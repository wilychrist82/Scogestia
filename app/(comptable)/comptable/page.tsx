import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AccountingDashboard } from '@/components/comptable/AccountingDashboard'

export default async function ComptableDashboardPage() {
  const supabase = await createClient()

  // 1. Authentification
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  // 2. Vérification du rôle et récupération de l'école
  const { data: roleData } = await supabase
    .from('user_school_roles')
    .select('school_id, role')
    .eq('user_id', user.id)
    .in('role', ['admin', 'comptable'])
    .single()

  if (!roleData) redirect('/')

  const schoolId = roleData.school_id

  // 3. Récupération des statistiques
  // Total Attendu (Somme de toutes les échéances pour cette école)
  const { data: dues, error: duesError } = await supabase
    .from('dues')
    .select('amount, status')
    .eq('school_id', schoolId)

  let totalExpected = 0
  let totalCollected = 0

  if (dues && !duesError) {
    for (const due of dues) {
      totalExpected += due.amount
      if (due.status === 'paye') {
        totalCollected += due.amount
      }
    }
  }

  // 4. Liste des impayés urgents
  const { data: unpaidDues, error: unpaidError } = await supabase
    .from('dues')
    .select(`
      id,
      label,
      amount,
      due_date,
      student:students (
        first_name,
        last_name,
        class:classes (name)
      )
    `)
    .eq('school_id', schoolId)
    .eq('status', 'en_retard')
    .order('due_date', { ascending: true })

  return (
    <AccountingDashboard 
      totalExpected={totalExpected}
      totalCollected={totalCollected}
      unpaidDues={unpaidDues || []}
    />
  )
}
