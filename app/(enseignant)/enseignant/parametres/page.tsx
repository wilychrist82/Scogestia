import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TeacherParametres } from '@/components/enseignant/TeacherParametres'
import { DataErrorCard } from '@/components/shared/DataErrorCard'

export const dynamic = 'force-dynamic'

export default async function EnseignantParametresPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: roleData, error: roleError } = await supabase
    .from('user_school_roles')
    .select('full_name, role')
    .eq('user_id', user.id)
    .eq('role', 'enseignant')
    .limit(1)
    .maybeSingle()

  if (roleError || !roleData) {
    return <DataErrorCard title="Accès restreint" message="Cette section est exclusivement réservée aux enseignants." actionHref="/enseignant" actionLabel="Retour à l'espace enseignant" />
  }

  const userAvatar = user.user_metadata?.avatar_url || ''

  return (
    <TeacherParametres userAvatar={userAvatar} userFullName={roleData.full_name} />
  )
}
