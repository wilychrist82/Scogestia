import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PersonnelManager } from '@/components/admin/PersonnelManager'

import { DataErrorCard } from '@/components/shared/DataErrorCard'

export const dynamic = 'force-dynamic'

export default async function PersonnelPage() {
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

  // Fetch staff list for this school
  const { data: staffList, error } = await supabase
    .from('user_school_roles')
    .select('id, full_name, role, phone, is_active, user_id')
    .eq('school_id', schoolId)
    .in('role', ['admin', 'comptable', 'enseignant']) // Only staff roles
    .order('created_at', { ascending: false })

  if (error) {
    return <DataErrorCard title="Erreur de chargement" message="Impossible de récupérer la liste du personnel pour le moment. Veuillez rafraîchir la page." />
  }

  return (
    <PersonnelManager staffList={staffList || []} />
  )
}
