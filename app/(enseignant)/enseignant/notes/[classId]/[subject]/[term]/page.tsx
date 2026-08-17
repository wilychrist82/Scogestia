import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { GradesGrid } from '@/components/enseignant/GradesGrid'

// Dans Next.js 15, les params des Server Components sont asynchrones.
type PageProps = {
  params: Promise<{
    classId: string
    subject: string
    term: string
  }>
}

export default async function NotesPage({ params }: PageProps) {
  const resolvedParams = await params
  const { classId, subject, term } = resolvedParams
  const decodedSubject = decodeURIComponent(subject)

  const supabase = await createClient()

  // 1. Authentification
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  // 2. Vérification: L'enseignant a-t-il le droit d'accéder à cette classe/matière ?
  const { data: roleData } = await supabase
    .from('user_school_roles')
    .select('school_id')
    .eq('user_id', user.id)
    .eq('role', 'enseignant')
    .single()

  if (!roleData) redirect('/')

  const { data: assignment } = await supabase
    .from('teacher_class_subjects')
    .select('id')
    .eq('teacher_id', user.id)
    .eq('class_id', classId)
    .eq('subject_name', decodedSubject)
    .single()

  if (!assignment) {
    // Non autorisé pour cette classe/matière
    redirect('/enseignant')
  }

  // 3. Récupérer les élèves de la classe
  const { data: students, error: studentsError } = await supabase
    .from('students')
    .select('id, first_name, last_name')
    .eq('class_id', classId)
    .order('last_name', { ascending: true })

  if (!students || students.length === 0) {
    return <div className="p-8">Aucun élève trouvé dans cette classe.</div>
  }

  // 4. Récupérer les notes existantes pour ce trimestre
  const { data: grades } = await supabase
    .from('grades')
    .select('student_id, evaluation_type, score')
    .eq('class_id', classId)
    .eq('subject_name', decodedSubject)
    .eq('term', term)

  return (
    <div className="h-full flex flex-col">
      <GradesGrid 
        classId={classId}
        subjectName={decodedSubject}
        term={term}
        students={students}
        initialGrades={grades as any || []}
      />
    </div>
  )
}
