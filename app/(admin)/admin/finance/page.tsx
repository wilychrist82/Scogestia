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

  // Informations sur l'école
  const { data: school } = await supabase
    .from('schools')
    .select('name, current_academic_year')
    .eq('id', schoolId)
    .maybeSingle()

  // Échéances (attendu) avec les paiements rattachés pour calculer le reste dû réel
  const { data: schedules } = await supabase
    .from('payment_schedules')
    .select('id, amount_due, status, due_date, label, payments(amount)')
    .eq('school_id', schoolId)

  // Paiements reçus (encaissé) avec détails pour le flux en direct
  const { data: payments } = await supabase
    .from('payments')
    .select(`
      id,
      amount,
      paid_at,
      payment_method,
      transaction_reference,
      receipt_number,
      schedule:payment_schedules(label),
      student:students(
        id,
        first_name,
        last_name,
        matricule,
        classes(name)
      )
    `)
    .eq('school_id', schoolId)
    .order('paid_at', { ascending: false })

  // Types de frais configurés
  const { data: feeTypes } = await supabase
    .from('fee_types')
    .select('id, label, amount, periodicity, target')
    .eq('school_id', schoolId)
    .order('created_at', { ascending: false })

  return (
    <FinanceDashboard
      schedules={(schedules as any) || []}
      payments={(payments as any) || []}
      feeTypes={(feeTypes as any) || []}
      schoolName={school?.name || 'Établissement'}
      academicYear={school?.current_academic_year || '2024-2025'}
    />
  )
}
