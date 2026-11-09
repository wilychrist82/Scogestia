import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ImpayesManager } from '@/components/admin/finance/ImpayesManager'
import { DataErrorCard } from '@/components/shared/DataErrorCard'

export const dynamic = 'force-dynamic'

export default async function ImpayesPage() {
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
  const today = new Date().toISOString().split('T')[0]

  // Impayés: échéances dépassées et non payées (assemblage à plat sans jointures ambiguës)
  const [
    { data: rawSchedules, error },
    { data: rawPayments },
    { data: rawStudents },
    { data: parentLinks },
    { data: parentRoles },
  ] = await Promise.all([
    supabase
      .from('payment_schedules')
      .select('id, label, amount_due, due_date, student_id')
      .eq('school_id', schoolId)
      .neq('status', 'paye')
      .lt('due_date', today)
      .order('due_date', { ascending: true }),
    supabase
      .from('payments')
      .select('schedule_id, due_id, amount')
      .eq('school_id', schoolId),
    supabase
      .from('students')
      .select('id, last_name, first_name, matricule, parent_phone, classes(name)')
      .eq('school_id', schoolId),
    supabase
      .from('parent_student_links')
      .select('student_id, parent_user_id')
      .eq('school_id', schoolId),
    supabase
      .from('user_school_roles')
      .select('user_id, full_name, phone')
      .eq('school_id', schoolId)
      .eq('role', 'parent'),
  ])

  if (error) {
    console.error('Erreur récupération impayés:', error)
  }

  const paymentsBySchedule = new Map<string, { amount: number }[]>()
  for (const p of rawPayments || []) {
    const schedId = (p as any).schedule_id || (p as any).due_id
    if (!schedId) continue
    const list = paymentsBySchedule.get(schedId) || []
    list.push({ amount: Number(p.amount || 0) })
    paymentsBySchedule.set(schedId, list)
  }

  const parentRolesByUserId = new Map<string, { full_name: string; phone: string | null }>()
  for (const r of parentRoles || []) {
    parentRolesByUserId.set(r.user_id, {
      full_name: r.full_name || 'Parent',
      phone: r.phone || null,
    })
  }

  const linksByStudentId = new Map<string, { parent_user_id: string; parent_user: { full_name: string; phone: string | null } }[]>()
  for (const l of parentLinks || []) {
    const list = linksByStudentId.get(l.student_id) || []
    const pUser = parentRolesByUserId.get(l.parent_user_id) || { full_name: 'Parent', phone: null }
    list.push({ parent_user_id: l.parent_user_id, parent_user: pUser })
    linksByStudentId.set(l.student_id, list)
  }

  const studentsMap = new Map<string, any>()
  for (const s of rawStudents || []) {
    const cls = Array.isArray((s as any).classes) ? (s as any).classes[0] : (s as any).classes
    const pLinks = linksByStudentId.get(s.id) || []
    // Si aucun téléphone sur le compte parent lié, fallback sur parent_phone de la fiche élève
    if (pLinks.length === 0 && (s as any).parent_phone) {
      pLinks.push({
        parent_user_id: '',
        parent_user: { full_name: 'Parent', phone: (s as any).parent_phone },
      })
    } else if (pLinks.length > 0 && !pLinks[0].parent_user.phone && (s as any).parent_phone) {
      pLinks[0].parent_user.phone = (s as any).parent_phone
    }
    studentsMap.set(s.id, {
      last_name: s.last_name || '',
      first_name: s.first_name || '',
      matricule: s.matricule || '',
      classes: cls ? { name: cls.name } : null,
      parent_links: pLinks,
    })
  }

  const impayes = (rawSchedules || []).map((s: any) => ({
    id: s.id,
    label: s.label,
    amount_due: Number(s.amount_due || 0),
    due_date: s.due_date,
    student: studentsMap.get(s.student_id) || null,
    payments: paymentsBySchedule.get(s.id) || [],
  }))

  return (
    <ImpayesManager impayes={error ? [] : (impayes as any)} />
  )
}
