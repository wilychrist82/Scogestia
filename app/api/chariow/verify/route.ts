import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { reconcileChariowPayment, reconcilePendingCheckoutToken } from '@/lib/chariow/reconcile'
import {
  PENDING_CHECKOUT_COOKIE,
  verifyPendingCheckoutToken,
} from '@/lib/chariow/pending-token'
import { isOwnerEmail } from '@/lib/owner'

async function hasSchoolBillingAccess(
  supabase: Awaited<ReturnType<typeof createClient>>,
  user: { id: string; email?: string | null },
  schoolId: string,
): Promise<boolean> {
  if (isOwnerEmail(user.email)) return true

  const [{ data: isSuperAdmin }, { data: roles }] = await Promise.all([
    supabase.rpc('is_super_admin'),
    supabase
      .from('user_school_roles')
      .select('school_id, role')
      .eq('user_id', user.id)
      .eq('school_id', schoolId)
      .in('role', ['admin', 'comptable', 'directeur', 'super_admin'])
      .limit(1),
  ])

  return Boolean(isSuperAdmin) || Boolean(roles && roles.length > 0)
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await req.json()
    const rawSaleId = typeof body?.sale_id === 'string' ? body.sale_id.trim() : ''
    const cookieStore = await cookies()
    const pendingToken = verifyPendingCheckoutToken(
      cookieStore.get(PENDING_CHECKOUT_COOKIE)?.value,
    )

    // Si Chariow a laissé le placeholder littéral "{sale_id}" ou omis le paramètre, utiliser le jeton HMAC serveur
    const saleId =
      rawSaleId && !/^\{.*\}$/.test(rawSaleId)
        ? rawSaleId
        : pendingToken?.saleId || ''

    if (!saleId) {
      return NextResponse.json({ error: 'Sale ID requis' }, { status: 400 })
    }

    const supabaseAdmin = createServiceRoleClient()

    const { data: payment, error: paymentErr } = await supabaseAdmin
      .from('saas_payments')
      .select('school_id')
      .eq('provider_sale_id', saleId)
      .limit(1)
      .maybeSingle()

    if (!paymentErr && payment) {
      const allowed = await hasSchoolBillingAccess(supabase, user, payment.school_id)
      if (!allowed) {
        return NextResponse.json({ error: 'Accès interdit pour cette transaction' }, { status: 403 })
      }

      const isSuccess = await reconcileChariowPayment(saleId, supabaseAdmin)
      const res = NextResponse.json({ status: isSuccess ? 'succeeded' : 'pending' })
      if (isSuccess) {
        revalidatePath('/admin', 'layout')
        revalidatePath('/admin/abonnement')
        res.cookies.delete(PENDING_CHECKOUT_COOKIE)
      }
      return res
    }

    // Fallback sécurisé si la ligne saas_payments n'a pas pu être écrite (ex: droits SQL 42501 en attente)
    if (!pendingToken || pendingToken.saleId !== saleId) {
      return NextResponse.json({ error: 'Transaction introuvable' }, { status: 404 })
    }

    const allowed = await hasSchoolBillingAccess(supabase, user, pendingToken.schoolId)
    if (!allowed) {
      return NextResponse.json({ error: 'Accès interdit pour cette transaction' }, { status: 403 })
    }

    const isSuccess = await reconcilePendingCheckoutToken(supabaseAdmin, {
      saleId,
      schoolId: pendingToken.schoolId,
      planName: pendingToken.planName,
      expectedAmount: pendingToken.expectedAmount,
    })

    const res = NextResponse.json({ status: isSuccess ? 'succeeded' : 'pending' })
    if (isSuccess) {
      revalidatePath('/admin', 'layout')
      revalidatePath('/admin/abonnement')
      res.cookies.delete(PENDING_CHECKOUT_COOKIE)
    }
    return res
  } catch (error) {
    console.error('Verify Error:', error)
    return NextResponse.json({ error: 'Erreur interne lors de la vérification.' }, { status: 500 })
  }
}
