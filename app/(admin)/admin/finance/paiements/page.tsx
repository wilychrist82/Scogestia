import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PaiementsManager } from '@/components/admin/finance/PaiementsManager'
import { DataErrorCard } from '@/components/shared/DataErrorCard'

export const dynamic = 'force-dynamic'

export default async function PaiementsPage() {
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

  const { data: school } = await supabase
    .from('schools')
    .select('name, city')
    .eq('id', schoolId)
    .maybeSingle()

  // Récupération à plat (sans jointure ambiguë PostgREST entre payments et payment_schedules
  // qui possèdent deux clés étrangères : schedule_id et due_id)
  const [
    { data: rawPayments, error: paymentsError },
    { data: rawSchedules, error: schedulesError },
    { data: rawStudents },
  ] = await Promise.all([
    supabase
      .from('payments')
      .select('id, amount, payment_method, transaction_reference, receipt_number, paid_at, schedule_id, due_id, student_id')
      .eq('school_id', schoolId)
      .order('paid_at', { ascending: false }),
    supabase
      .from('payment_schedules')
      .select('id, label, amount_due, status, due_date, student_id')
      .eq('school_id', schoolId)
      .order('due_date', { ascending: true }),
    supabase
      .from('students')
      .select('id, last_name, first_name, matricule, classes(name)')
      .eq('school_id', schoolId),
  ])

  if (paymentsError) {
    console.error('Erreur de récupération des paiements:', paymentsError)
  }
  if (schedulesError) {
    console.error('Erreur de récupération des échéances:', schedulesError)
  }

  const studentsMap = new Map<string, { last_name: string; first_name: string; matricule: string; classes: { name: string } | null }>()
  for (const s of rawStudents || []) {
    const cls = Array.isArray((s as any).classes) ? (s as any).classes[0] : (s as any).classes
    studentsMap.set(s.id, {
      last_name: s.last_name || '',
      first_name: s.first_name || '',
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

  const schedulesMap = new Map<string, { id: string; label: string; amount_due: number; status: string; due_date: string; student_id: string; payments: { amount: number }[] }>()
  for (const sch of rawSchedules || []) {
    schedulesMap.set(sch.id, {
      id: sch.id,
      label: sch.label || 'Frais scolaire',
      amount_due: Number(sch.amount_due || 0),
      status: sch.status || 'en_attente',
      due_date: sch.due_date || '',
      student_id: sch.student_id,
      payments: paymentsBySchedule.get(sch.id) || [],
    })
  }

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
      payment_method: p.payment_method,
      transaction_reference: p.transaction_reference || p.receipt_number || null,
      paid_at: p.paid_at,
      schedule: sched
        ? {
            label: sched.label,
            amount_due: sched.amount_due,
            payments: sched.payments,
          }
        : null,
      student: stu
        ? {
            last_name: stu.last_name,
            first_name: stu.first_name,
            classes: stu.classes,
          }
        : null,
    }
  })

  const pendingSchedules = (rawSchedules || [])
    .filter((s: any) => ['en_attente', 'partiel', 'en_retard'].includes(s.status))
    .map((s: any) => {
      const stu = studentsMap.get(s.student_id)
      return {
        id: s.id,
        label: s.label,
        amount_due: Number(s.amount_due || 0),
        status: s.status,
        student: stu
          ? {
              last_name: stu.last_name,
              first_name: stu.first_name,
              matricule: stu.matricule,
            }
          : null,
        payments: paymentsBySchedule.get(s.id) || [],
      }
    })

  return (
    <PaiementsManager
      payments={paymentsError ? [] : payments}
      pendingSchedules={pendingSchedules}
      schoolName={school?.name || 'Établissement'}
      schoolCity={(school as any)?.city || ''}
      loadError={Boolean(paymentsError)}
    />
  )
}
