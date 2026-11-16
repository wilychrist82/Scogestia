import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { createChariowCheckout, isTestChariowProduct, resolveChariowPhone } from '@/lib/chariow/api'
import { isBillingTestEmail } from '@/lib/owner'
import {
  PENDING_CHECKOUT_COOKIE,
  signPendingCheckoutToken,
} from '@/lib/chariow/pending-token'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { data: roleData } = await supabase
      .from('user_school_roles')
      .select('school_id, role, full_name')
      .eq('user_id', user.id)
      .in('role', ['admin', 'comptable', 'directeur', 'super_admin'])
      .limit(1)
      .maybeSingle()

    if (!roleData?.school_id) {
      return NextResponse.json({ error: 'Permissions insuffisantes' }, { status: 403 })
    }

    const body = await req.json()
    const { product_id, phone, phoneCountry, plan_name } = body

    if (!product_id || !phone) {
      return NextResponse.json({ error: 'Produit et téléphone requis' }, { status: 400 })
    }

    const isTestCheckout = isTestChariowProduct(
      {
        id: String(product_id),
        name: String(plan_name || ''),
        price: Number(body.amount) || 0,
      },
      process.env.CHARIOW_TEST_PRODUCT_ID,
    )

    if (isTestCheckout) {
      const { data: isSuperAdmin } = await supabase.rpc('is_super_admin')
      if (!isBillingTestEmail(user.email) && !isSuperAdmin) {
        return NextResponse.json({ error: 'Offre de test réservée aux comptes de recette autorisés.' }, { status: 403 })
      }
    }

    const rawName = (roleData.full_name || (user.user_metadata?.full_name as string) || '').trim()
    const nameParts = rawName.split(/\s+/).filter(Boolean)
    const firstName = nameParts[0] || (user.user_metadata?.first_name as string) || 'Admin'
    const lastName = nameParts.slice(1).join(' ') || (user.user_metadata?.last_name as string) || 'Ecole'

    const baseUrl = (
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      req.headers.get('origin') ||
      new URL(req.url).origin
    ).replace(/\/$/, '')

    const resolvedPhone = resolveChariowPhone(phone, phoneCountry)

    const chariowRes = await createChariowCheckout({
      product_id,
      email: user.email || 'contact@ecole.com',
      first_name: firstName,
      last_name: lastName,
      phone: resolvedPhone,
      redirect_url: `${baseUrl}/admin/abonnement/success`,
      custom_metadata: {
        school_id: roleData.school_id,
      },
    })

    const saleObj = chariowRes.purchase || chariowRes.sale
    const saleId = saleObj?.id
    const checkoutUrl = chariowRes.payment?.checkout_url || chariowRes.checkout_url

    if (!saleId || !checkoutUrl) {
      console.error('Réponse Chariow incomplète:', chariowRes)
      return NextResponse.json(
        { error: 'Réponse Chariow invalide lors de la création du paiement.' },
        { status: 502 },
      )
    }

    const rawAmount = saleObj?.amount
    const amountValue =
      typeof rawAmount === 'number'
        ? rawAmount
        : Number(rawAmount?.value ?? body.amount ?? 0)
    const currencyValue =
      typeof rawAmount === 'object' && rawAmount?.currency
        ? String(rawAmount.currency)
        : 'XOF'
    const resolvedPlanName = typeof plan_name === 'string' && plan_name.trim() ? plan_name.trim() : 'Standard'

    const pendingToken = signPendingCheckoutToken({
      saleId,
      schoolId: roleData.school_id,
      planName: resolvedPlanName,
      expectedAmount: Number.isFinite(amountValue) ? amountValue : 0,
      exp: Date.now() + 2 * 60 * 60 * 1000,
    })

    const serviceClient = createServiceRoleClient()
    const { error: insertError } = await serviceClient.from('saas_payments').insert({
      school_id: roleData.school_id,
      provider_sale_id: saleId,
      amount: Number.isFinite(amountValue) ? amountValue : 0,
      currency: currencyValue,
      status: 'pending',
      plan_name: resolvedPlanName,
    })

    if (insertError) {
      console.error('Erreur insertion saas_payments:', insertError)
      const isPermissionDenied = insertError.code === '42501'
      if (!isPermissionDenied || !pendingToken) {
        return NextResponse.json(
          { error: "Impossible d'enregistrer l'initialisation du paiement." },
          { status: 500 },
        )
      }
      console.warn(
        '[Chariow Checkout] Privilèges SQL 42501 manquants sur saas_payments — poursuite via jeton HMAC serveur. Exécutez supabase/migrations/0052_grant_service_role_and_saas_billing.sql dans Supabase.',
      )
    }

    const response = NextResponse.json({ checkout_url: checkoutUrl })
    if (pendingToken) {
      response.cookies.set(PENDING_CHECKOUT_COOKIE, pendingToken, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 2 * 60 * 60,
      })
    }

    return response
  } catch (error) {
    console.error('Checkout Error:', error)
    return NextResponse.json({ error: 'Erreur lors de la création du paiement.' }, { status: 500 })
  }
}
