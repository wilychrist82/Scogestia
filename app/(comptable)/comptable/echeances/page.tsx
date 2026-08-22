import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { EcheancesManager } from '@/components/admin/finance/EcheancesManager'

export const dynamic = 'force-dynamic'

export default async function ComptableEcheancesPage() {
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
      label,
      amount_due,
      status,
      due_date,
      student_id,
      students (
        id,
        first_name,
        last_name,
        class_id,
        classes (name)
      )
    `)
    .eq('school_id', schoolId)
    .order('due_date', { ascending: true })

  const { data: classes } = await supabase
    .from('classes')
    .select('id, name')
    .eq('school_id', schoolId)

  const { data: students } = await supabase
    .from('students')
    .select('id, first_name, last_name, class_id')
    .eq('school_id', schoolId)
    .eq('status', 'actif')

  // Fetch parent links and roles to get phone numbers
  const { data: parentLinks } = await supabase
    .from('parent_student_links')
    .select('student_id, parent_user_id')
    .eq('school_id', schoolId)

  const { data: parentRoles } = await supabase
    .from('user_school_roles')
    .select('user_id, phone')
    .eq('school_id', schoolId)
    .eq('role', 'parent')

  // Inject parent phone into schedules
  const formattedSchedules = schedules?.map(s => {
    const studentLinks = parentLinks?.filter(l => l.student_id === s.student_id || l.student_id === (s as any).students?.id) || []
    let parentPhone = null
    for (const link of studentLinks) {
      const pRole = parentRoles?.find(r => r.user_id === link.parent_user_id)
      if (pRole?.phone) {
        parentPhone = pRole.phone
        break
      }
    }

    return {
      ...s,
      student: {
        ...((s as any).students || {}),
        parent_phone: parentPhone
      }
    }
  }) || []

  return (
    <EcheancesManager 
      schedules={formattedSchedules as any}
      classes={classes as any || []}
      students={students as any || []}
      basePath="/comptable"
    />
  )
}
