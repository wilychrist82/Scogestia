import { ClassDetailsView } from '@/components/admin/ClassDetailsView'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { DataErrorCard } from '@/components/shared/DataErrorCard'

export const dynamic = 'force-dynamic'

export default async function ClassDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: roleData } = await supabase
    .from('user_school_roles')
    .select('school_id')
    .eq('user_id', user.id)
    .limit(1).maybeSingle()

  if (!roleData?.school_id) {
    return <DataErrorCard title="Établissement introuvable" message="Impossible d'identifier votre établissement. Veuillez vous reconnecter ou contacter l'assistance." />
  }

  // 1. Fetch class information
  const { data: classData, error: classError } = await supabase
    .from('classes')
    .select('id, name, level, capacity, academic_year')
    .eq('id', id)
    .eq('school_id', roleData.school_id)
    .single()

  if (classError || !classData) {
    return (
      <DataErrorCard
        title="Classe introuvable"
        message="Cette classe n'existe pas ou vous n'avez pas l'autorisation d'y accéder."
        actionHref="/admin/classes"
        actionLabel="Retour à la liste des classes"
      />
    )
  }

  // 2. Fetch all students in this class + timetable + attendance
  const [
    { data: students },
    { data: timetableSlots },
    { data: attendances }
  ] = await Promise.all([
    supabase
      .from('students')
      .select('id, matricule, first_name, last_name, gender, date_of_birth, parent_phone, status')
      .eq('class_id', id)
      .eq('school_id', roleData.school_id)
      .order('last_name', { ascending: true }),
    supabase
      .from('timetable_slots')
      .select('id, day_of_week, start_time, end_time, subject_name, teacher_name, room, color')
      .eq('class_id', id)
      .order('day_of_week', { ascending: true })
      .order('start_time', { ascending: true }),
    supabase
      .from('attendance')
      .select('id, student_id, date, status, justification')
      .eq('class_id', id)
      .order('date', { ascending: false })
      .limit(200)
  ])

  const studentIds = (students || []).map(s => s.id)
  let classSchedules: any[] = []
  if (studentIds.length > 0) {
    const { data: scheds } = await supabase
      .from('payment_schedules')
      .select('id, student_id, total_amount, paid_amount, status')
      .in('student_id', studentIds)
    classSchedules = scheds || []
  }

  return (
    <ClassDetailsView
      classInfo={classData}
      students={(students as any) || []}
      timetableSlots={(timetableSlots as any) || []}
      attendances={(attendances as any) || []}
      schedules={classSchedules}
    />
  )
}
