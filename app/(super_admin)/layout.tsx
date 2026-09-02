import { AdminLayoutWrapper } from '@/components/layout/AdminLayoutWrapper'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/connexion')
  }

  // Vérifier si l'utilisateur est un Super Admin (bypasses RLS issues)
  const { data: isSuperAdmin } = await supabase.rpc('is_super_admin')

  if (!isSuperAdmin) {
    redirect('/connexion?error=unauthorized_super_admin')
  }

  const userFullName = 'Propriétaire Scogestia'
  const userRoleLabel = 'Super Administrateur SaaS'

  return (
    <AdminLayoutWrapper userFullName={userFullName} userRoleLabel={userRoleLabel} navVariant="super_admin">
      {children}
    </AdminLayoutWrapper>
  )
}
