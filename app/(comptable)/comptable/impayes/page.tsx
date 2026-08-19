import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ImpayesManager } from '@/components/admin/finance/ImpayesManager'

export const dynamic = 'force-dynamic'

export default async function ComptableImpayesPage() {
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

  const { data: unpaidSchedules } = await supabase
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
    .eq('status', 'en_retard')
    .order('due_date', { ascending: true })

  return (
    <ImpayesManager 
      impayes={unpaidSchedules as any || []} 
      basePath="/comptable"
    />
  )
}
