import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { FinanceDashboard } from '@/components/admin/finance/FinanceDashboard'

export const dynamic = 'force-dynamic'

export default async function ComptableDashboardPage() {
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

  const { data: schedules } = await supabase
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
        class_id,
        classes (name)
      )
    `)
    .eq('school_id', schoolId)

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

  return (
    <FinanceDashboard 
      schedules={schedules as any || []} 
      payments={payments as any || []} 
      basePath="/comptable"
    />
  )
}
