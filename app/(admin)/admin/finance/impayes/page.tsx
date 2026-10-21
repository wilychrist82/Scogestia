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
          parent_user_id,
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
