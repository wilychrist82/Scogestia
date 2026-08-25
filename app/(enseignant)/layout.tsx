import { AdminLayoutWrapper } from '@/components/layout/AdminLayoutWrapper'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

import { LayoutDashboard, GraduationCap, ClipboardCheck, BookOpen, Calendar } from 'lucide-react'

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
    .limit(1).maybeSingle()

  const navItems = [
    { label: 'Tableau de bord', href: '/enseignant', icon: LayoutDashboard },
    { label: 'Emploi du temps', href: '/enseignant/planning', icon: Calendar },
    { label: 'Notes', href: '/enseignant/notes', icon: GraduationCap },
    { label: 'Présences', href: '/enseignant/presences', icon: ClipboardCheck },
    { label: 'Devoirs', href: '/enseignant/devoirs', icon: BookOpen },
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
