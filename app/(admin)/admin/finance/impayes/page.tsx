import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ImpayesManager } from '@/components/admin/finance/ImpayesManager'

export const dynamic = 'force-dynamic'

export default async function ImpayesPage() {
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
  const today = new Date().toISOString().split('T')[0]

  // Impayés : schedule status 'en_retard' OR due_date < today AND status != 'paye'
  const { data: impayes, error } = await supabase
    .from('payment_schedules')
    .select(`
      id,
      label,
      amount_due,
      due_date,
      student:students(
        last_name,
        first_name,
        matricule,
        classes(name),
        parent_links:parent_student_links(
          parent_user:users(full_name, phone)
        )
      ),
      payments(amount)
    `)
    .eq('school_id', schoolId)
    .neq('status', 'paye')
    .lt('due_date', today)
    .order('due_date', { ascending: true })

  if (error) {
    return <div className="p-8 text-[var(--color-status-retard-text)]">Erreur de récupération des impayés.</div>
  }

  return (
    <ImpayesManager impayes={(impayes as any) || []} />
  )
}
