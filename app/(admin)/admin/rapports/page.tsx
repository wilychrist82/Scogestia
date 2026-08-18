import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { RapportsManager } from '@/components/admin/rapports/RapportsManager'

export const dynamic = 'force-dynamic'

export default async function RapportsPage() {
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

  // 1. Classes & Effectifs
  const { data: classes } = await supabase
    .from('classes')
    .select('id, name')
    .eq('school_id', schoolId)

  const { count: totalStudents } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true })
    .eq('school_id', schoolId)
    .eq('status', 'actif')

  // Group students by class
  const { data: studentsRaw } = await supabase
    .from('students')
    .select('class_id')
    .eq('school_id', schoolId)
    .eq('status', 'actif')

  const studentsByClassMap: Record<string, number> = {}
  studentsRaw?.forEach(s => {
    if (!studentsByClassMap[s.class_id]) studentsByClassMap[s.class_id] = 0
    studentsByClassMap[s.class_id]++
  })

  const studentsByClass = classes?.map(c => ({
    name: c.name,
    count: studentsByClassMap[c.id] || 0
  })) || []

  // 2. Finance
  const { data: schedules } = await supabase
    .from('payment_schedules')
    .select('amount_due, status')
    .eq('school_id', schoolId)

  let totalExpected = 0
  schedules?.forEach(s => { totalExpected += Number(s.amount_due) })

  const { data: payments } = await supabase
    .from('payments')
    .select('amount')
    .eq('school_id', schoolId)

  let totalCollected = 0
  payments?.forEach(p => { totalCollected += Number(p.amount) })

  // 3. Attendance rate (Present / Total records * 100)
  const { data: attendance } = await supabase
    .from('attendance')
    .select('status')
    .eq('school_id', schoolId)

  let attendanceRate = 100 // default if no data
  if (attendance && attendance.length > 0) {
    const presentCount = attendance.filter(a => a.status === 'present').length
    attendanceRate = (presentCount / attendance.length) * 100
  }

  return (
    <RapportsManager 
      totalStudents={totalStudents || 0}
      totalClasses={classes?.length || 0}
      totalExpected={totalExpected}
      totalCollected={totalCollected}
      attendanceRate={attendanceRate}
      studentsByClass={studentsByClass}
    />
  )
}
