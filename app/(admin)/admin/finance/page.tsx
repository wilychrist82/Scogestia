import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { FinanceDashboard } from '@/components/admin/finance/FinanceDashboard'

export const dynamic = 'force-dynamic'

export default async function FinancePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: roleData } = await supabase
    .from('user_school_roles')
    .select('school_id')
    .eq('user_id', user.id)
    .limit(1).maybeSingle()

  if (!roleData?.school_id) {
    return <div className="p-8 text-[var(--color-status-retard-text)]">École introuvable.</div>
  }

  const schoolId = roleData.school_id

  // 1. Informations école
  const { data: schoolData } = await supabase
    .from('schools')
    .select('name, current_academic_year')
    .eq('id', schoolId)
    .maybeSingle()

  const academicYear = schoolData?.current_academic_year || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`

  // 2. Fetch total expected (payment_schedules)
  const { data: schedules } = await supabase
    .from('payment_schedules')
    .select('id, amount_due, status, due_date, label')
    .eq('school_id', schoolId)

  // 3. Fetch total received (payments)
  const { data: payments } = await supabase
    .from('payments')
    .select('id, amount, paid_at, payment_method, schedule_id, transaction_reference, receipt_number, created_at, student:students(first_name, last_name, classes(name))')
    .eq('school_id', schoolId)
    .order('created_at', { ascending: false })

  // 4. Effectifs
  const { count: studentCount } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true })
    .eq('school_id', schoolId)

  const { count: staffCount } = await supabase
    .from('user_school_roles')
    .select('*', { count: 'exact', head: true })
    .eq('school_id', schoolId)
    .in('role', ['admin', 'comptable', 'enseignant'])

  // 5. Présences du jour
  const today = new Date().toISOString().split('T')[0]
  const { data: attendanceData } = await supabase
    .from('attendance')
    .select('status')
    .eq('school_id', schoolId)
    .eq('date', today)

  let presentCount = 0
  let lateCount = 0
  let absentCount = 0

  if (attendanceData && attendanceData.length > 0) {
    attendanceData.forEach((a: any) => {
      if (a.status === 'present') presentCount++
      else if (a.status === 'retard') lateCount++
      else if (a.status === 'absent') absentCount++
    })
  }

  // 6. Types de frais configurés
  const { data: feeTypes } = await supabase
    .from('fee_types')
    .select('label, amount')
    .eq('school_id', schoolId)

  return (
    <FinanceDashboard 
      schedules={schedules || []} 
      payments={payments || []}
      studentCount={studentCount || 0}
      staffCount={staffCount || 0}
      attendance={{
        present: presentCount,
        late: lateCount,
        absent: absentCount
      }}
      academicYear={academicYear}
      schoolName={schoolData?.name || 'Mon École'}
      feeTypes={feeTypes || []}
    />
  )
}

