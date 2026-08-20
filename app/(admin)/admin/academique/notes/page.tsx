import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { NotesManager } from '@/components/admin/academique/NotesManager'

export const dynamic = 'force-dynamic'

export default async function NotesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: roleData } = await supabase
    .from('user_school_roles')
    .select('school_id')
    .eq('user_id', user.id)
    .single()

  if (!roleData?.school_id) {
    return <div className="p-8 text-[var(--color-status-retard-text)]">École introuvable.</div>
  }

  const schoolId = roleData.school_id

  let { data: classes } = await supabase
    .from('classes')
    .select('id, name, level')
    .eq('school_id', schoolId)
    .order('name')

  // Auto-seed classes for the prototype if empty
  if (!classes || classes.length === 0) {
    const defaultClasses = [
      { school_id: schoolId, name: 'CP1', level: 'primaire', academic_year: '2024-2025' },
      { school_id: schoolId, name: 'CP2', level: 'primaire', academic_year: '2024-2025' },
      { school_id: schoolId, name: 'CE1', level: 'primaire', academic_year: '2024-2025' },
      { school_id: schoolId, name: 'CE2', level: 'primaire', academic_year: '2024-2025' },
      { school_id: schoolId, name: 'CM1', level: 'primaire', academic_year: '2024-2025' },
      { school_id: schoolId, name: 'CM2', level: 'primaire', academic_year: '2024-2025' },
      { school_id: schoolId, name: '6ème', level: 'secondaire', academic_year: '2024-2025' },
      { school_id: schoolId, name: '5ème', level: 'secondaire', academic_year: '2024-2025' },
      { school_id: schoolId, name: '4ème', level: 'secondaire', academic_year: '2024-2025' },
      { school_id: schoolId, name: '3ème', level: 'secondaire', academic_year: '2024-2025' },
    ];
    await supabase.from('classes').insert(defaultClasses);
    
    const { data: newClasses } = await supabase
      .from('classes')
      .select('id, name, level')
      .eq('school_id', schoolId)
      .order('name');
    classes = newClasses;
  }

  const { data: subjects } = await supabase
    .from('teacher_class_subjects')
    .select('id, subject_name, class_id')
    .eq('school_id', schoolId)
    .order('subject_name')

  const { data: students } = await supabase
    .from('students')
    .select('id, matricule, last_name, first_name, class_id')
    .eq('school_id', schoolId)
    .eq('status', 'actif')
    .order('last_name')
    
  // We fetch all grades for the school to pass them down. In a large app, we would fetch only for the selected class/term via an API route.
  // But for this prototype, we'll fetch them.
  const { data: grades } = await supabase
    .from('grades')
    .select('student_id, score, subject_name, term, evaluation_type, class_id')
    .eq('school_id', schoolId)

  return (
    <NotesManager 
      classes={classes || []} 
      subjects={subjects || []} 
      students={students || []} 
      existingGrades={grades || []}
    />
  )
}
