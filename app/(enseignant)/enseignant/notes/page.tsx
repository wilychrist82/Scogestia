import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TeacherNotesWrapper } from '@/components/enseignant/TeacherNotesWrapper'
import { sortClasses } from '@/lib/classes'

export const dynamic = 'force-dynamic'

export default async function EnseignantNotesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: roleData } = await supabase
    .from('user_school_roles')
    .select('school_id, school:schools(name)')
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
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center">
        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4 border border-blue-100">
          <span className="text-3xl">📚</span>
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Aucune classe assignée</h2>
        <p className="text-sm text-slate-500 max-w-sm">Vous n'avez pas encore de classe ou de matière assignée par l'administration.</p>
      </div>
    )
  }

  // Fetch actual subjects from DB to get their cycle and ID
  const { data: allSubjects } = await supabase
    .from('subjects')
    .select('*')
    .eq('school_id', schoolId)

  // Dedupliquer les classes et matières
  const classesMap = new Map()
  const subjectsMap = new Map()

  assignments.forEach((a: any) => {
    if (!classesMap.has(a.class_id)) {
      classesMap.set(a.class_id, { id: a.class_id, name: a.classes?.name, level: a.classes?.level })
    }
  })

  // Detect if teacher teaches any primary/maternelle class
  const hasPrimaryClass = Array.from(classesMap.values()).some((c: any) => {
    const full = ((c.level || '') + ' ' + (c.name || '')).toLowerCase()
    return ['cp1', 'cp2', 'cp', 'ce1', 'ce2', 'ce', 'cm1', 'cm2', 'cm', 'ci', 'primaire', 'maternelle', 's1', 's2', 'section1', 'section2', 'ps', 'ms', 'gs'].some(k => full.includes(k))
  })

  // If teacher has primary classes, they teach all primary/maternelle subjects
  if (hasPrimaryClass && allSubjects) {
    allSubjects
      .filter(s => s.cycle === 'primaire' || s.cycle === 'maternelle')
      .forEach(s => subjectsMap.set(s.id, s))
  }

  // For secondary classes, match assigned subject names to actual subject records
  assignments.forEach((a: any) => {
    const realSubject = allSubjects?.find(s => s.name === a.subject_name)
    if (realSubject) {
      if (!subjectsMap.has(realSubject.id)) {
        subjectsMap.set(realSubject.id, realSubject)
      }
    }
  })

  const classes = sortClasses(Array.from(classesMap.values()))
  const assignedSubjects = Array.from(subjectsMap.values())

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
    <TeacherNotesWrapper 
      classes={classes}
      assignedSubjects={assignedSubjects}
      students={(students as any) || []}
      primaryGrades={primaryGrades || []}
      secondaryGrades={secondaryGrades || []}
    />
  )
}
