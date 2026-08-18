import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { EcheancesManager } from '@/components/admin/finance/EcheancesManager'

export const dynamic = 'force-dynamic'

export default async function EcheancesPage() {
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

  const { data: schedules, error } = await supabase
    .from('payment_schedules')
    .select(\`
      id,
      label,
      amount_due,
      due_date,
      status,
      student:students(
        last_name,
        first_name,
        classes(name)
      )
    \`)
    .eq('school_id', schoolId)
    .order('created_at', { ascending: false })

  const { data: classes } = await supabase
    .from('classes')
    .select('id, name')
    .eq('school_id', schoolId)
    .order('name')

  const { data: students } = await supabase
    .from('students')
    .select('id, matricule, last_name, first_name')
    .eq('school_id', schoolId)
    .eq('status', 'actif')
    .order('last_name')

  if (error) {
    return <div className="p-8 text-[var(--color-status-retard-text)]">Erreur de récupération des échéances.</div>
  }

  return (
    <EcheancesManager 
      schedules={(schedules as any) || []} 
      classes={classes || []} 
      students={students || []} 
    />
  )
}
