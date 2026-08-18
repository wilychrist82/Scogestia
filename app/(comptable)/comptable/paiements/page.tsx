import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PaiementsManager } from '@/components/admin/finance/PaiementsManager'

export const dynamic = 'force-dynamic'

export default async function ComptablePaiementsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: roleData } = await supabase
    .from('user_school_roles')
    .select('school_id, role')
    .eq('user_id', user.id)
    .in('role', ['admin', 'comptable'])
    .single()

  if (!roleData) redirect('/')

  const schoolId = roleData.school_id

  const { data: payments } = await supabase
    .from('payments')
    .select(`
      id,
      amount,
      payment_date,
      payment_method,
      schedule_id,
      payment_schedules (
        student_id,
        students (
          first_name,
          last_name,
          classes (name)
        )
      )
    `)
    .eq('school_id', schoolId)
    .order('payment_date', { ascending: false })

  const { data: pendingSchedules } = await supabase
    .from('payment_schedules')
    .select(`
      id,
      amount_due,
      status,
      due_date,
      student_id,
      students (
        first_name,
        last_name,
        classes (name)
      )
    `)
    .eq('school_id', schoolId)
    .in('status', ['en_attente', 'partiel', 'en_retard'])
    .order('due_date', { ascending: true })

  return (
    <PaiementsManager 
      payments={payments as any || []} 
      pendingSchedules={pendingSchedules as any || []} 
      basePath="/comptable"
    />
  )
}
