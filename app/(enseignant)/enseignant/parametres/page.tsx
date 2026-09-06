import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TeacherParametres } from '@/components/enseignant/TeacherParametres'

export const dynamic = 'force-dynamic'

export default async function EnseignantParametresPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: roleData, error: roleError } = await supabase
    .from('user_school_roles')
    .select('full_name, role')
    .eq('user_id', user.id)
    .maybeSingle()

  if (roleError || !roleData || roleData.role !== 'enseignant') {
    return <div className="p-8 text-[var(--color-status-retard-text)]">Accès refusé. Vous devez être enseignant.</div>
  }

  const userAvatar = user.user_metadata?.avatar_url || ''

  return (
    <TeacherParametres userAvatar={userAvatar} userFullName={roleData.full_name} />
  )
}
