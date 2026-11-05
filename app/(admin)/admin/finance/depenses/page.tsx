import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DataErrorCard } from '@/components/shared/DataErrorCard'
import { DepensesManager } from '@/components/admin/finance/DepensesManager'

export const dynamic = 'force-dynamic'

export default async function FinanceDepensesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/connexion')

  const { data: roleData } = await supabase
    .from('user_school_roles')
    .select('school_id, role')
    .eq('user_id', user.id)
    .in('role', ['admin', 'comptable', 'super_admin'])
    .limit(1)
    .maybeSingle()

  if (!roleData?.school_id) {
    return (
      <DataErrorCard
        title="Accès restreint"
        message="Cette section est réservée à la direction et à la comptabilité de l'établissement."
      />
    )
  }

  const [{ data: expenses }, { data: payments }, { data: school }] = await Promise.all([
    supabase
      .from('school_expenses')
      .select('id, category, label, amount, payment_method, beneficiary, expense_date, notes, created_at')
      .eq('school_id', roleData.school_id)
      .order('expense_date', { ascending: false })
      .order('created_at', { ascending: false }),
    supabase
      .from('payments')
      .select('amount')
      .eq('school_id', roleData.school_id),
    supabase
      .from('schools')
      .select('name, city, phone, director_name')
      .eq('id', roleData.school_id)
      .limit(1)
      .maybeSingle(),
  ])

  const totalCollected = (payments || []).reduce(
    (sum, p) => sum + Number(p.amount || 0),
    0
  )

  return (
    <DepensesManager
      expenses={(expenses as any) || []}
      totalCollected={totalCollected}
      schoolInfo={school || null}
    />
  )
}

