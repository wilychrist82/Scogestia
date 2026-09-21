import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { UserProfileManager } from '@/components/shared/UserProfileManager'

export const dynamic = 'force-dynamic'

export default async function ParentParametresPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: roleData, error: roleError } = await supabase
    .from('user_school_roles')
    .select('school_id, role')
    .eq('user_id', user.id)
    .maybeSingle()

  if (roleError || !roleData || roleData.role !== 'parent') {
    return <div className="p-8 text-[var(--color-status-retard-text)]">Accès refusé.</div>
  }

  const userAvatar = user?.user_metadata?.avatar_url || ''

  return (
    <UserProfileManager userId={user.id} userAvatar={userAvatar} role="parent" />
  )
}
