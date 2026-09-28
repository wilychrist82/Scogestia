import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdminProfileManager } from '@/components/admin/parametres/AdminProfileManager'

export const dynamic = 'force-dynamic'

export default async function AdminProfilPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: roleData } = await supabase
    .from('user_school_roles')
    .select('school_id, role, full_name, phone')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (!roleData?.school_id) {
    redirect('/admin')
  }

  const userAvatar = user?.user_metadata?.avatar_url || ''

  return (
    <AdminProfileManager
      userId={user.id}
      fullName={roleData.full_name || user.email?.split('@')[0] || 'Utilisateur'}
      email={user.email || ''}
      phone={roleData.phone || ''}
      role={roleData.role || 'admin'}
      userAvatar={userAvatar}
    />
  )
}
