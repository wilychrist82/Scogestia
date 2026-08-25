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
    .limit(1).maybeSingle()

  if (!roleData) redirect('/')

  const schoolId = roleData.school_id

  // 1. Récupérer uniquement les classes et matières assignées à ce prof
  const { data: assignments } = await supabase
    .from('teacher_class_subjects')
    .select(`
      class_id,
      subject_name,
      classes ( name, level )
    `)
    .eq('teacher_id', user.id)

  if (!assignments || assignments.length === 0) {
    return <div className="p-8">Aucune classe assignée.</div>
  }

  // Fetch actual subjects from DB to get their cycle and ID
  const { data: allSubjects } = await supabase
    .from('subjects')
    .select('id, name, cycle')
    .eq('school_id', schoolId)

  // Dedupliquer les classes et matières
  const classesMap = new Map()
  const subjectsMap = new Map()

  assignments.forEach((a: any) => {
    if (!classesMap.has(a.class_id)) {
      classesMap.set(a.class_id, { id: a.class_id, name: a.classes?.name, level: a.classes?.level })
    }
    
    // Find the real subject from the subjects table
    const realSubject = allSubjects?.find(s => s.name === a.subject_name)
    if (realSubject) {
      // Note: NotesManager currently uses subjectId. If the same subject name is taught in multiple classes,
      // the real subject ID is what we want to pass. The admin space passes all subjects directly.
      if (!subjectsMap.has(realSubject.id)) {
        subjectsMap.set(realSubject.id, { 
          id: realSubject.id, 
          name: realSubject.name, 
          cycle: realSubject.cycle 
        })
      }
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
  const { data: primaryGrades } = await supabase
    .from('primary_grades')
    .select('*')
    .eq('school_id', schoolId)

  const { data: secondaryGrades } = await supabase
    .from('secondary_grades')
    .select('*')
    .eq('school_id', schoolId)

  return (
    <NotesManager 
      classes={classes}
      subjects={subjects}
      students={students as any || []}
      primaryGrades={primaryGrades || []}
      secondaryGrades={secondaryGrades || []}
    />
  )
}
