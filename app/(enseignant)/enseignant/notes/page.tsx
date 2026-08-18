import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { NotesManager } from '@/components/admin/academique/NotesManager'

export const dynamic = 'force-dynamic'

export default async function EnseignantNotesPage() {
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

  // 1. Récupérer uniquement les classes et matières assignées à ce prof
  const { data: assignments } = await supabase
    .from('teacher_class_subjects')
    .select(`
      class_id,
      subject_name,
      classes ( name )
    `)
    .eq('teacher_id', user.id)

  if (!assignments || assignments.length === 0) {
    return <div className="p-8">Aucune classe assignée.</div>
  }

  // Dedupliquer les classes
  const classesMap = new Map()
  const subjectsMap = new Map()

  assignments.forEach((a: any) => {
    if (!classesMap.has(a.class_id)) {
      classesMap.set(a.class_id, { id: a.class_id, name: a.classes.name })
    }
    const subjId = `${a.class_id}-${a.subject_name}`
    if (!subjectsMap.has(subjId)) {
      subjectsMap.set(subjId, { id: subjId, subject_name: a.subject_name, class_id: a.class_id })
    }
  })

  const classes = Array.from(classesMap.values())
  const subjects = Array.from(subjectsMap.values())

  const classIds = classes.map(c => c.id)

  // 2. Récupérer les élèves des classes assignées
  const { data: students } = await supabase
    .from('students')
    .select('id, last_name, first_name, matricule, class_id')
    .eq('school_id', schoolId)
    .in('class_id', classIds)
    .eq('status', 'actif')
    .order('last_name', { ascending: true })

  // 3. Récupérer les notes existantes
  const { data: existingGrades } = await supabase
    .from('grades')
    .select('student_id, score, subject_name, term, evaluation_type, class_id')
    .eq('school_id', schoolId)
    .in('class_id', classIds)

  return (
    <NotesManager 
      classes={classes}
      subjects={subjects}
      students={students as any || []}
      existingGrades={existingGrades as any || []}
    />
  )
}
