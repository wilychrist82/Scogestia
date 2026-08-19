import { AdminLayoutWrapper } from '@/components/layout/AdminLayoutWrapper'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/connexion')
  }

  const { data: roleData } = await supabase
    .from('user_school_roles')
    .select('full_name, role')
    .eq('user_id', user.id)
    .single()

  const userFullName = roleData?.full_name || 'Admin User'
  const userRoleLabel = 'Administrateur'

  return (
    <AdminLayoutWrapper userFullName={userFullName} userRoleLabel={userRoleLabel}>
      {children}
    </AdminLayoutWrapper>
  )
}
