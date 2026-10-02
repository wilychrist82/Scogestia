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

  // 1. Fetch total expected (payment_schedules)
  const { data: schedules } = await supabase
    .from('payment_schedules')
    .select('amount_due, status, due_date')
    .eq('school_id', schoolId)

  // 2. Fetch total received (payments)
  const { data: payments } = await supabase
    .from('payments')
    .select('amount, paid_at')
    .eq('school_id', schoolId)

  const totalAttendu = schedules?.reduce((acc, curr) => acc + Number(curr.amount_due), 0) || 0
  const totalEncaisse = payments?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0
  
  const today = new Date().toISOString().split('T')[0]
  
  const paiementsDuJour = payments?.filter(p => p.paid_at?.startsWith(today))
    .reduce((acc, curr) => acc + Number(curr.amount), 0) || 0
    
  // Impayés : where status is 'en_retard' or (due_date < today and status != 'paye')
  // We approximate the amount by looking at the remaining amount per schedule. 
  // For simplicity here, we'll just sum the 'en_retard' or past due schedules
  const impayesSchedules = schedules?.filter(s => {
    return s.status === 'en_retard' || (s.due_date < today && s.status !== 'paye')
  }) || []
  const totalImpayesAttendu = impayesSchedules.reduce((acc, curr) => acc + Number(curr.amount_due), 0)
  
  // Real calculation of impayés would require joining schedules and payments, but we will pass the raw arrays to the client component to compute accurately.

  return (
    <FinanceDashboard 
      schedules={schedules || []} 
      payments={payments || []} 
    />
  )
}
