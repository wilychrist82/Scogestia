import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MatieresManager } from '@/components/admin/academique/MatieresManager'

export const dynamic = 'force-dynamic'

export default async function MatieresPage() {
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

  const { data: subjects, error } = await supabase
    .from('subjects')
    .select('*')
    .eq('school_id', schoolId)
    .order('name')

  if (error) {
    return <div className="p-8 text-[var(--color-status-retard-text)]">Erreur de récupération des matières: {error.message || JSON.stringify(error)}</div>
  }

  return (
    <MatieresManager subjects={subjects || []} />
  )
}
