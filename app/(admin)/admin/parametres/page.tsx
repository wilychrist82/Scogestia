import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ParametresManager } from '@/components/admin/parametres/ParametresManager'
import { DataErrorCard } from '@/components/shared/DataErrorCard'
import { ADMIN_SPACE_ROLES } from '@/lib/roles'
import { isOwnerEmail } from '@/lib/owner'

export const dynamic = 'force-dynamic'

export default async function ParametresPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const [{ data: roleData, error: roleError }, { data: isSuperAdmin }] = await Promise.all([
    supabase
      .from('user_school_roles')
      .select('school_id, role')
      .eq('user_id', user.id)
      .in('role', [...ADMIN_SPACE_ROLES, 'super_admin'])
      .limit(1)
      .maybeSingle(),
    supabase.rpc('is_super_admin'),
  ])

  const isPrivileged = Boolean(isSuperAdmin) || isOwnerEmail(user.email)

  if (roleError || !roleData?.school_id) {
    return <DataErrorCard title="Établissement introuvable" message="Impossible d'identifier votre établissement. Veuillez vous reconnecter ou contacter l'assistance." />
  }

  // Seul l'admin (ou super_admin) a accès à la configuration globale de l'école ; les autres rôles sont redirigés vers leur profil personnel
  if (roleData.role !== 'admin' && roleData.role !== 'super_admin' && !isPrivileged) {
    redirect('/admin/parametres/profil')
  }

  const { data: school, error: schoolError } = await supabase
    .from('schools')
    .select('id, name, city, phone, email, current_academic_year, director_name, signature_url, stamp_url, logo_url')
    .eq('id', roleData.school_id)
    .maybeSingle()

  if (schoolError || !school) {
    return <DataErrorCard title="Erreur de chargement" message="Impossible de charger les paramètres de l'école. Veuillez rafraîchir la page." />
  }

  const userAvatar = user?.user_metadata?.avatar_url || ''

  return (
    <ParametresManager school={school as { id: string; name: string; city: string | null; phone: string | null; email: string | null; current_academic_year: string; director_name?: string | null; logo_url?: string | null; signature_url?: string | null; stamp_url?: string | null }} userAvatar={userAvatar} />
  )
}
