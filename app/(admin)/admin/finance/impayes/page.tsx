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

  // Impayés: échéances dépassées et non payées
  // Jointure via user_school_roles (pas auth.users qui est protégée)
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
          parent_user:user_school_roles(full_name, phone)
        )
      ),
      payments(amount)
    `)
    .eq('school_id', schoolId)
    .neq('status', 'paye')
    .lt('due_date', today)
    .order('due_date', { ascending: true })

  if (error) {
    console.error('Erreur récupération impayés:', error)
  }

  return (
    <ImpayesManager impayes={(error ? [] : impayes as any) || []} />
  )
}
