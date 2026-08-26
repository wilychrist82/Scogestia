import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { FinanceRapportsManager } from '@/components/admin/rapports/FinanceRapportsManager'

export const dynamic = 'force-dynamic'

export default async function FinanceRapportsPage() {
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

  // Récupérer tous les paiements
  const { data: payments } = await supabase
    .from('payments')
    .select('amount, payment_date, status, payment_method, students (class_id, classes (name))')
    .eq('school_id', schoolId)

  // Agréger par mois
  const paymentsByMonthMap: Record<string, number> = {}
  let totalEnthousiasme = 0 // Just for fun total sum

  payments?.forEach(p => {
    if (p.status === 'success' || p.status === 'completed' || p.status === 'paye') {
      const amount = Number(p.amount)
      totalEnthousiasme += amount
      const date = new Date(p.payment_date)
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}` // YYYY-MM
      
      if (!paymentsByMonthMap[monthYear]) paymentsByMonthMap[monthYear] = 0
      paymentsByMonthMap[monthYear] += amount
    }
  })

  // Format array for chart
  const months = Object.keys(paymentsByMonthMap).sort()
  const monthlyData = months.map(m => {
    // Format YYYY-MM to MMM YYYY (e.g. Sept 2026)
    const [year, month] = m.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1, 1)
    const formattedMonth = date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })
    return {
      month: formattedMonth,
      rawMonth: m,
      amount: paymentsByMonthMap[m]
    }
  })

  // Agréger par classe
  const paymentsByClassMap: Record<string, number> = {}
  payments?.forEach(p => {
    if (p.status === 'success' || p.status === 'completed' || p.status === 'paye') {
      const std = Array.isArray(p.students) ? p.students[0] : p.students;
      const cls = std ? (Array.isArray((std as any).classes) ? (std as any).classes[0] : (std as any).classes) : null;
      const className = cls?.name || 'Inconnue';
      if (!paymentsByClassMap[className]) paymentsByClassMap[className] = 0
      paymentsByClassMap[className] += Number(p.amount)
    }
  })

  const classData = Object.keys(paymentsByClassMap).map(className => ({
    name: className,
    amount: paymentsByClassMap[className]
  }))

  return (
    <FinanceRapportsManager 
      monthlyData={monthlyData}
      classData={classData}
      totalCollected={totalEnthousiasme}
    />
  )
}
