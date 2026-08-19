import { AdminLayoutWrapper } from '@/components/layout/AdminLayoutWrapper'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function ComptableLayout({
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

  const navItems = [
    { label: 'Tableau de bord', href: '/comptable', icon: 'dashboard' },
    { label: 'Paiements', href: '/comptable/paiements', icon: 'payments' },
    { label: 'Frais scolaires', href: '/comptable/echeances', icon: 'calendar_month' },
    { label: 'Impayés', href: '/comptable/impayes', icon: 'notifications_active' },
  ]

  return (
    <AdminLayoutWrapper 
      userFullName={roleData?.full_name || 'Comptable'} 
      userRoleLabel="Comptable"
      navItems={navItems}
    >
      {children}
    </AdminLayoutWrapper>
  )
}
