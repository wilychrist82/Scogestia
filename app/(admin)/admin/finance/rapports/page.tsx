import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { RapportsFinanciers } from '@/components/admin/finance/RapportsFinanciers'

export const dynamic = 'force-dynamic'

export default async function RapportsFinancePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: roleData } = await supabase
    .from('user_school_roles')
    .select('school_id')
    .eq('user_id', user.id)
    .limit(1).maybeSingle()

  if (!roleData?.school_id) {
    return <div className="p-8 text-red-600">École introuvable.</div>
  }

  const schoolId = roleData.school_id
  const today = new Date().toISOString().split('T')[0]

  // Récupérer les paiements
  const { data: payments } = await supabase
    .from('payments')
    .select('amount, paid_at, payment_method')
    .eq('school_id', schoolId)
    .order('paid_at', { ascending: false })

  // Récupérer les échéanciers
  const { data: schedules } = await supabase
    .from('payment_schedules')
    .select('amount_due, status, due_date')
    .eq('school_id', schoolId)

  // Compter les élèves
  const { count: studentCount } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true })
    .eq('school_id', schoolId)
    .eq('status', 'actif')

  const stats = {
    totalEncaisse: payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0,
    totalAttendu: schedules?.reduce((sum, s) => sum + Number(s.amount_due), 0) || 0,
    nbImpayes: schedules?.filter(s => s.status !== 'paye' && s.due_date < today).length || 0,
    nbEleves: studentCount || 0,
    nbPaiements: payments?.length || 0,
    repartitionMethode: payments?.reduce((acc: Record<string, number>, p) => {
      const method = p.payment_method || 'Autre'
      acc[method] = (acc[method] || 0) + Number(p.amount)
      return acc
    }, {}) || {},
  }

  return (
    <RapportsFinanciers
      stats={stats}
      payments={(payments || []) as any}
      schedules={(schedules || []) as any}
    />
  )
}
