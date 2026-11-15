import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { reconcileChariowPayment } from '@/lib/chariow/reconcile'
import { isOwnerEmail } from '@/lib/owner'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await req.json()
    const { sale_id } = body

    if (!sale_id || typeof sale_id !== 'string') {
      return NextResponse.json({ error: 'Sale ID requis' }, { status: 400 })
    }

    const supabaseAdmin = createServiceRoleClient()

    // Vérifier que le paiement existe et appartient bien à une école administrée par l'utilisateur
    const { data: payment, error: paymentErr } = await supabaseAdmin
      .from('saas_payments')
      .select('school_id')
      .eq('provider_sale_id', sale_id)
      .limit(1)
      .maybeSingle()

    if (paymentErr || !payment) {
      return NextResponse.json({ error: 'Transaction introuvable' }, { status: 404 })
    }

    const [{ data: isSuperAdmin }, { data: roles }] = await Promise.all([
      supabase.rpc('is_super_admin'),
      supabase
        .from('user_school_roles')
        .select('school_id, role')
        .eq('user_id', user.id)
        .eq('school_id', payment.school_id)
        .in('role', ['admin', 'comptable', 'directeur', 'super_admin'])
        .limit(1),
    ])

    const isPrivileged = Boolean(isSuperAdmin) || isOwnerEmail(user.email)
    const hasSchoolAccess = Boolean(roles && roles.length > 0)

    if (!isPrivileged && !hasSchoolAccess) {
      return NextResponse.json({ error: 'Accès interdit pour cette transaction' }, { status: 403 })
    }

    // Réconciliation sécurisée avec client service_role et contrôle multi-tenant préalable
    const isSuccess = await reconcileChariowPayment(sale_id, supabaseAdmin)

    if (isSuccess) {
      return NextResponse.json({ status: 'succeeded' })
    }
    return NextResponse.json({ status: 'pending' })

  } catch (error) {
    console.error('Verify Error:', error)
    return NextResponse.json({ error: 'Erreur interne lors de la vérification.' }, { status: 500 })
  }
}
