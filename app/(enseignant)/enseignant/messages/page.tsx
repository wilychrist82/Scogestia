import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { EnseignantCommunication } from '@/components/enseignant/EnseignantCommunication'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

export default async function EnseignantMessagesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: roleData } = await supabase
    .from('user_school_roles')
    .select('school_id')
    .eq('user_id', user.id)
    .eq('role', 'enseignant')
    .limit(1).maybeSingle()

  if (!roleData) redirect('/')

  const schoolId = roleData.school_id

  // Classes assignées à cet enseignant
  const { data: assignments } = await supabase
    .from('teacher_class_subjects')
    .select('class_id')
    .eq('teacher_id', user.id)

  const classIds = [...new Set(assignments?.map(a => a.class_id) || [])]

  // Élèves de ces classes (normaliser la jointure Supabase)
  const { data: studentsRaw } = await supabase
    .from('students')
    .select('id, first_name, last_name, classes(name)')
    .eq('school_id', schoolId)
    .in('class_id', classIds.length > 0 ? classIds : ['00000000-0000-0000-0000-000000000000'])
    .order('last_name')


  // Communications de/vers cet enseignant :
  const { data: communicationsRaw } = await supabase
    .from('communications')
    .select('*')
    .eq('school_id', schoolId)
    .or(
      `sender_id.eq.${user.id},` +
      `and(recipient_type.eq.enseignant,recipient_id.eq.${user.id}),` +
      `recipient_type.eq.all_teachers`
    )
    .order('created_at', { ascending: false })
    .limit(50)

  // Fetch parent_user_id for each student using admin client
  const { createAdminClient } = await import('@/lib/supabase/admin')
  const adminClient = createAdminClient()

  let parentLinks: any[] = []
  if (studentsRaw && studentsRaw.length > 0) {
    const studentIds = studentsRaw.map(s => s.id)
    const { data: links } = await adminClient
      .from('parent_student_links')
      .select('student_id, parent_user_id')
      .in('student_id', studentIds)
    if (links) parentLinks = links
  }

  const students = studentsRaw?.map(s => {
    const link = parentLinks.find(l => l.student_id === s.id)
    return {
      ...s,
      classes: Array.isArray(s.classes) ? s.classes[0] ?? null : s.classes,
      parent_user_id: link?.parent_user_id || null
    }
  }) || []

  // Fetch sender roles
  const senderIds = [...new Set(communicationsRaw?.map(c => c.sender_id) || [])]
  let sendersRoles: any[] = []
  if (senderIds.length > 0) {
    const { data: roles } = await supabase
      .from('user_school_roles')
      .select('user_id, role')
      .in('user_id', senderIds)
      .eq('school_id', schoolId)
    if (roles) sendersRoles = roles
  }

  const rolesMap = new Map(sendersRoles.map(r => [r.user_id, r.role]))

  const communications = communicationsRaw?.map(c => ({
    ...c,
    sender_role: rolesMap.get(c.sender_id) || 'unknown'
  })) || []

  return (
    <EnseignantCommunication
      currentUserId={user.id}
      students={students as any}
      communications={communications}
    />
  )
}
