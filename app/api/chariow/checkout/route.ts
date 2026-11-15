import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { createChariowCheckout, resolveChariowPhone } from '@/lib/chariow/api'

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

    // Résoudre le format de numéro attendu par Chariow
    const resolvedPhone = resolveChariowPhone(phone, phoneCountry)

    // Créer la vente chez Chariow
    const chariowRes = await createChariowCheckout({
      product_id,
      email: user.email || 'contact@ecole.com',
      first_name: firstName,
      last_name: lastName,
      phone: resolvedPhone,
      redirect_url: `${baseUrl}/admin/abonnement/success?sale_id={sale_id}`,
      custom_metadata: {
        school_id: roleData.school_id
      }
    })

    // Enregistrer le paiement en 'pending' via service_role (saas_payments n'a pas de policy INSERT publique)
    const serviceClient = createServiceRoleClient()
    const { error: insertError } = await serviceClient.from('saas_payments').insert({
      school_id: roleData.school_id,
      provider_sale_id: chariowRes.purchase.id,
      amount: chariowRes.purchase.amount.value,
      currency: chariowRes.purchase.amount.currency,
      status: 'pending',
      plan_name: plan_name || 'Standard'
    })

    if (insertError) {
      console.error('Erreur insertion saas_payments:', insertError)
      return NextResponse.json(
        { error: "Impossible d'enregistrer l'initialisation du paiement." },
        { status: 500 }
      )
    }

    return NextResponse.json({ checkout_url: chariowRes.payment.checkout_url })

  } catch (error) {
    console.error('Checkout Error:', error)
    return NextResponse.json({ error: 'Erreur lors de la création du paiement.' }, { status: 500 })
  }
}
