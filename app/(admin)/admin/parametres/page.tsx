import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ParametresManager } from '@/components/admin/parametres/ParametresManager'
import { DataErrorCard } from '@/components/shared/DataErrorCard'

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

  if (roleError || !roleData?.school_id) {
    return <DataErrorCard title="Établissement introuvable" message="Impossible d'identifier votre établissement. Veuillez vous reconnecter ou contacter l'assistance." />
  }

  // Seul l'admin a accès
  if (roleData.role !== 'admin') {
    return <DataErrorCard title="Accès restreint" message="Cette section de configuration est exclusivement réservée à l'administrateur de l'école." />
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
