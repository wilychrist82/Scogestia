import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { FinanceDashboard } from '@/components/admin/finance/FinanceDashboard'

export const dynamic = 'force-dynamic'

export default async function FinancePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: roleData } = await supabase
    .from('user_school_roles')
    .select('school_id')
    .eq('user_id', user.id)
    .limit(1).maybeSingle()

  if (!roleData?.school_id) {
    return <div className="p-8 text-[var(--color-status-retard-text)]">École introuvable.</div>
  }

  const schoolId = roleData.school_id

  // Échéances (attendu) avec les paiements rattachés pour calculer le reste dû réel
  const { data: schedules } = await supabase
    .from('payment_schedules')
    .select('amount_due, status, due_date, payments(amount)')
    .eq('school_id', schoolId)

  // Paiements reçus (encaissé)
  const { data: payments } = await supabase
    .from('payments')
    .select('amount, paid_at')
    .eq('school_id', schoolId)

  return (
    <FinanceDashboard
      schedules={(schedules as any) || []}
      payments={payments || []}
    />
  )
}
