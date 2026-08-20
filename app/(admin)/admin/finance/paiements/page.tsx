import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PaiementsManager } from '@/components/admin/finance/PaiementsManager'

export const dynamic = 'force-dynamic'

export default async function PaiementsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: roleData } = await supabase
    .from('user_school_roles')
    .select('school_id')
    .eq('user_id', user.id)
    .single()

  if (!roleData?.school_id) {
    return <div className="p-8 text-[var(--color-status-retard-text)]">École introuvable.</div>
  }

  const schoolId = roleData.school_id

  const { data: payments, error } = await supabase
    .from('payments')
    .select(`
      id,
      amount,
      payment_method,
      transaction_reference,
      paid_at,
      schedule:payment_schedules(label),
      student:students(
        last_name,
        first_name,
        classes(name)
      ),
      recorded_by_user:auth.users(raw_user_meta_data)
    `)
    .eq('school_id', schoolId)
    .order('paid_at', { ascending: false })

  // Fetch pending schedules for the modal
  const { data: pendingSchedules } = await supabase
    .from('payment_schedules')
    .select(`
      id,
      label,
      amount_due,
      status,
      student:students(last_name, first_name, matricule)
    `)
    .eq('school_id', schoolId)
    .in('status', ['en_attente', 'partiel', 'en_retard'])
    .order('due_date', { ascending: true })

  if (error) {
    console.error("Erreur de récupération des paiements:", error)
  }

  return (
    <PaiementsManager 
      payments={(error ? [] : payments as any) || []} 
      pendingSchedules={(pendingSchedules as any) || []} 
    />
  )
}
