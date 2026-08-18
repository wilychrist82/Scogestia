import { Sidebar } from '@/components/layout/Sidebar'
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

  const navItems = [
    { label: 'Tableau de bord', href: '/admin', icon: 'dashboard' },
    { label: 'Classes', href: '/admin/classes', icon: 'school' },
    { label: 'Élèves', href: '/admin/eleves', icon: 'group' },
    { label: 'Personnel', href: '/admin/personnel', icon: 'badge' },
    { label: 'Paramètres', href: '/admin/parametres', icon: 'settings' },
  ]

  return (
    <div className="flex min-h-screen bg-[var(--color-surface)]">
      <Sidebar 
        navItems={navItems} 
        userFullName={roleData?.full_name || 'Admin User'} 
        userRoleLabel="Administrateur" 
      />
      {/* Main Content wrapper */}
      <div className="flex-1 md:ml-64 flex flex-col">
        <main className="flex-1 p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
