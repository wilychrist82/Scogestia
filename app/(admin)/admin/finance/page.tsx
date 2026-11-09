import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { FinanceDashboard } from '@/components/admin/finance/FinanceDashboard'
import { DataErrorCard } from '@/components/shared/DataErrorCard'

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
    return <DataErrorCard title="Établissement introuvable" message="Impossible d'identifier votre établissement. Veuillez vous reconnecter ou contacter l'assistance." />
  }

  const schoolId = roleData.school_id

  // Informations sur l'école
  const { data: school } = await supabase
    .from('schools')
    .select('name, current_academic_year, city')
    .eq('id', schoolId)
    .maybeSingle()

  // Récupération à plat (sans jointure ambiguë PostgREST entre payments et payment_schedules)
  const [
    { data: rawSchedules },
    { data: rawPayments },
    { data: rawStudents },
    { data: feeTypes },
  ] = await Promise.all([
    supabase
      .from('payment_schedules')
      .select('id, amount_due, status, due_date, label, student_id')
      .eq('school_id', schoolId),
    supabase
      .from('payments')
      .select('id, amount, paid_at, payment_method, transaction_reference, receipt_number, schedule_id, due_id, student_id')
      .eq('school_id', schoolId)
      .order('paid_at', { ascending: false }),
    supabase
      .from('students')
      .select('id, first_name, last_name, matricule, classes(name)')
      .eq('school_id', schoolId),
    supabase
      .from('fee_types')
      .select('id, label, amount, periodicity, target')
      .eq('school_id', schoolId)
      .order('created_at', { ascending: false }),
  ])

  const studentsMap = new Map<string, any>()
  for (const s of rawStudents || []) {
    const cls = Array.isArray((s as any).classes) ? (s as any).classes[0] : (s as any).classes
    studentsMap.set(s.id, {
      id: s.id,
      first_name: s.first_name || '',
      last_name: s.last_name || '',
      matricule: s.matricule || '',
      classes: cls ? { name: cls.name } : null,
    })
  }

  const paymentsBySchedule = new Map<string, { amount: number }[]>()
  for (const p of rawPayments || []) {
    const schedId = (p as any).schedule_id || (p as any).due_id
    if (!schedId) continue
    const list = paymentsBySchedule.get(schedId) || []
    list.push({ amount: Number(p.amount || 0) })
    paymentsBySchedule.set(schedId, list)
  }

  const schedulesMap = new Map<string, { label: string; student_id?: string }>()
  const schedules = (rawSchedules || []).map((s: any) => {
    schedulesMap.set(s.id, { label: s.label, student_id: s.student_id })
    return {
      id: s.id,
      amount_due: Number(s.amount_due || 0),
      status: s.status,
      due_date: s.due_date,
      label: s.label,
      payments: paymentsBySchedule.get(s.id) || [],
    }
  })

  const payments = (rawPayments || []).map((p: any) => {
    const schedId = p.schedule_id || p.due_id
    const sched = schedId ? schedulesMap.get(schedId) : null
    const stu = p.student_id
      ? studentsMap.get(p.student_id)
      : sched?.student_id
        ? studentsMap.get(sched.student_id)
        : null

    return {
      id: p.id,
      amount: Number(p.amount || 0),
      paid_at: p.paid_at,
      payment_method: p.payment_method,
      transaction_reference: p.transaction_reference,
      receipt_number: p.receipt_number,
      schedule: sched ? { label: sched.label } : null,
      student: stu || null,
    }
  })

  return (
    <FinanceDashboard
      schedules={(schedules as any) || []}
      payments={(payments as any) || []}
      feeTypes={(feeTypes as any) || []}
      schoolName={school?.name || 'Établissement'}
      schoolCity={(school as any)?.city || ''}
      academicYear={school?.current_academic_year || '2026-2027'}
    />
  )
}
