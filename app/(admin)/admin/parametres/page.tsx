import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ParametresManager } from '@/components/admin/parametres/ParametresManager'

export const dynamic = 'force-dynamic'

export default async function ParametresPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: roleData, error: roleError } = await supabase
    .from('user_school_roles')
    .select('school_id, role')
    .eq('user_id', user.id)
    .maybeSingle()

  if (roleError) {
    return <div className="p-8 text-[var(--color-status-retard-text)]">Erreur Rôle: {roleError.message} - {roleError.details}</div>
  }

  if (!roleData?.school_id) {
    return <div className="p-8 text-[var(--color-status-retard-text)]">École introuvable (pas de rôle).</div>
  }

  // Seul l'admin a accès
  if (roleData.role !== 'admin') {
    return <div className="p-8 text-[var(--color-status-retard-text)]">Accès refusé. Vous devez être administrateur.</div>
  }

  const { data: school, error: schoolError } = await supabase
    .from('schools')
    .select('id, name, city, phone, email, current_academic_year')
    .eq('id', roleData.school_id)
    .maybeSingle()

  if (schoolError) {
    return <div className="p-8 text-[var(--color-status-retard-text)]">Erreur École: {schoolError.message}</div>
  }

  if (!school) {
    return <div className="p-8 text-[var(--color-status-retard-text)]">École introuvable dans la base. (ID: {roleData.school_id})</div>
  }

  return (
    <ParametresManager school={school as any} />
  )
}
