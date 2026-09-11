import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { EnseignantCommunication } from '@/components/enseignant/EnseignantCommunication'

export const dynamic = 'force-dynamic'

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

  const students = studentsRaw?.map(s => ({
    ...s,
    classes: Array.isArray(s.classes) ? s.classes[0] ?? null : s.classes
  })) || []

  // Communications de/vers cet enseignant :
  // - Messages qu'il a envoyés (sender_id = user.id)
  // - Messages qui lui sont destinés (recipient_type = 'enseignant' AND recipient_id = user.id)
  // - Messages 'all_teachers' (envoi à tous les enseignants)
  const { data: communications } = await supabase
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

  return (
    <EnseignantCommunication
      currentUserId={user.id}
      students={students as any}
      communications={communications || []}
    />
  )
}
