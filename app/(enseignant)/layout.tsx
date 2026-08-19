import { AdminLayoutWrapper } from '@/components/layout/AdminLayoutWrapper'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function EnseignantLayout({
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
    { label: 'Tableau de bord', href: '/enseignant', icon: 'dashboard' },
    { label: 'Notes', href: '/enseignant/notes', icon: 'grading' },
    { label: 'Présences', href: '/enseignant/presences', icon: 'fact_check' },
    { label: 'Devoirs', href: '/enseignant/devoirs', icon: 'assignment' },
  ]

  return (
    <AdminLayoutWrapper 
      userFullName={roleData?.full_name || 'Enseignant'} 
      userRoleLabel="Enseignant"
      navItems={navItems}
    >
      {children}
    </AdminLayoutWrapper>
  )
}
