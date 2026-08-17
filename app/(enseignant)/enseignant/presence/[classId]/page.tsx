import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AttendanceList } from '@/components/enseignant/AttendanceList'
import { AttendanceStatus } from '@/app/actions/attendance'

type PageProps = {
  params: Promise<{
    classId: string
  }>
}

export default async function PresencePage({ params }: PageProps) {
  const resolvedParams = await params
  const { classId } = resolvedParams

  const supabase = await createClient()

  // 1. Authentification
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  // 2. Vérification: L'enseignant a-t-il accès à cette école et classe ?
  const { data: roleData } = await supabase
    .from('user_school_roles')
    .select('school_id')
    .eq('user_id', user.id)
    .eq('role', 'enseignant')
    .single()

  if (!roleData) redirect('/')

  // On vérifie que l'enseignant est bien assigné à cette classe (n'importe quelle matière)
  const { data: assignment } = await supabase
    .from('teacher_class_subjects')
    .select('id')
    .eq('teacher_id', user.id)
    .eq('class_id', classId)
    .limit(1)

  if (!assignment || assignment.length === 0) {
    redirect('/enseignant')
  }

  // 3. Infos de la classe
  const { data: classData } = await supabase
    .from('classes')
    .select('name')
    .eq('id', classId)
    .single()

  if (!classData) redirect('/enseignant')

  // 4. Récupérer les élèves de la classe
  const { data: students, error: studentsError } = await supabase
    .from('students')
    .select('id, matricule, first_name, last_name, photo_url')
    .eq('class_id', classId)
    .order('last_name', { ascending: true })

  if (!students || students.length === 0) {
    return <div className="p-8">Aucun élève trouvé dans cette classe.</div>
  }

  // 5. Date du jour
  const today = new Date().toISOString().split('T')[0]

  // 6. Récupérer les présences existantes pour aujourd'hui
  const { data: attendances } = await supabase
    .from('attendance')
    .select('student_id, status')
    .eq('class_id', classId)
    .eq('date', today)

  const initialAttendance: Record<string, AttendanceStatus> = {}
  if (attendances) {
    attendances.forEach(a => {
      initialAttendance[a.student_id] = a.status as AttendanceStatus
    })
  }

  return (
    <div className="h-full flex flex-col p-8">
      <AttendanceList 
        classId={classId}
        className={classData.name}
        date={today}
        students={students}
        initialAttendance={initialAttendance}
      />
    </div>
  )
}
