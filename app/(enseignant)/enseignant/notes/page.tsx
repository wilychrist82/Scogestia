import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TeacherNotesWrapper } from '@/components/enseignant/TeacherNotesWrapper'

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
    return <div className="p-8">Aucune classe assignée.</div>
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
    
    // Find the real subject from the subjects table
    const realSubject = allSubjects?.find(s => s.name === a.subject_name)
    if (realSubject) {
      if (!subjectsMap.has(realSubject.id)) {
        subjectsMap.set(realSubject.id, realSubject)
      }
    }
  })

  const classes = Array.from(classesMap.values())
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

  // Fetch new metadata fields for primary
  const { data: studentsData } = await supabase.from('students').select('id').eq('school_id', schoolId);
  const studentIds = studentsData ? studentsData.map(s => s.id) : [];
  
  let primaryRanks: any[] = [];
  let primaryInfo: any[] = [];
  if (studentIds.length > 0) {
    const { data: r } = await supabase.from('primary_monthly_ranks').select('*').in('student_id', studentIds);
    if (r) primaryRanks = r;
    const { data: i } = await supabase.from('primary_bulletin_info').select('*').in('student_id', studentIds);
    if (i) primaryInfo = i;
  }

  return (
    <TeacherNotesWrapper 
      classes={classes}
      allSubjects={allSubjects || []}
      assignedSubjects={assignedSubjects || []}
      students={students as any || []}
      primaryGrades={primaryGrades || []}
      secondaryGrades={secondaryGrades || []}
      primaryRanks={primaryRanks}
      primaryInfo={primaryInfo}
      schoolName={(roleData as any)?.school?.name || 'École'}
    />
  )
}
