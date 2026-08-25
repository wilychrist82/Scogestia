import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { EcheancesManager } from '@/components/admin/finance/EcheancesManager'

export const dynamic = 'force-dynamic'

export default async function EcheancesPage() {
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

  const { data: schedules, error } = await supabase
    .from('payment_schedules')
    .select(`
      id,
      label,
      amount_due,
      due_date,
      status,
      student:students(
        last_name,
        first_name,
        classes(name)
      )
    `)
    .eq('school_id', schoolId)
    .order('created_at', { ascending: false })

  const { data: classes } = await supabase
    .from('classes')
    .select('id, name')
    .eq('school_id', schoolId)
    .order('name')

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
    const studentLinks = parentLinks?.filter(l => l.student_id === (s.student as any)?.id || l.student_id === (s as any).student_id) || []
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
        ...((s as any).student || {}),
        parent_phone: parentPhone
      }
    }
  }) || []

  if (error) {
    return <div className="p-8 text-[var(--color-status-retard-text)]">Erreur de récupération des échéances.</div>
  }

  return (
    <EcheancesManager 
      schedules={formattedSchedules as any}
      classes={classes as any || []}
      students={students as any || []}
      basePath="/admin/finance"
    />
  )
}
