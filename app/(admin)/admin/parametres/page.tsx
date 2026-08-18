import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ParametresManager } from '@/components/admin/parametres/ParametresManager'

export const dynamic = 'force-dynamic'

export default async function ParametresPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: roleData } = await supabase
    .from('user_school_roles')
    .select('school_id, role')
    .eq('user_id', user.id)
    .single()

  if (!roleData?.school_id) {
    return <div className="p-8 text-[var(--color-status-retard-text)]">École introuvable.</div>
  }

  // Seul l'admin a accès
  if (roleData.role !== 'admin') {
    return <div className="p-8 text-[var(--color-status-retard-text)]">Accès refusé. Vous devez être administrateur.</div>
  }

  const { data: school } = await supabase
    .from('schools')
    .select('id, name, address, phone, email, current_academic_year')
    .eq('id', roleData.school_id)
    .single()

  if (!school) {
    return <div className="p-8 text-[var(--color-status-retard-text)]">École introuvable.</div>
  }

  return (
    <ParametresManager school={school as any} />
  )
}
