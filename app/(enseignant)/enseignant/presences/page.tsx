import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PresencesManager } from '@/components/admin/academique/PresencesManager'

export const dynamic = 'force-dynamic'

export default async function EnseignantPresencesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: roleData } = await supabase
    .from('user_school_roles')
    .select('school_id')
    .eq('user_id', user.id)
    .eq('role', 'enseignant')
    .single()

  if (!roleData) redirect('/')

  const schoolId = roleData.school_id

  // 1. Classes assignées
  const { data: assignments } = await supabase
    .from('teacher_class_subjects')
    .select(`class_id, classes (name)`)
    .eq('teacher_id', user.id)

  if (!assignments || assignments.length === 0) {
    return <div className="p-8">Aucune classe assignée.</div>
  }

  const classesMap = new Map()
  assignments.forEach((a: any) => {
    if (!classesMap.has(a.class_id)) {
      classesMap.set(a.class_id, { id: a.class_id, name: a.classes.name })
    }
  })
  const classes = Array.from(classesMap.values())
  const classIds = classes.map(c => c.id)

  // 2. Élèves
  const { data: students } = await supabase
    .from('students')
    .select('id, last_name, first_name, matricule, class_id')
    .eq('school_id', schoolId)
    .in('class_id', classIds)
    .eq('status', 'actif')
    .order('last_name', { ascending: true })

  // 3. Présences du jour
  const today = new Date().toISOString().split('T')[0]
  const { data: attendances } = await supabase
    .from('attendance')
    .select('student_id, class_id, status, justification')
    .eq('school_id', schoolId)
    .eq('date', today)
    .in('class_id', classIds)

  return (
    <PresencesManager 
      classes={classes}
      students={students as any || []}
      todayAttendances={attendances as any || []}
    />
  )
}
