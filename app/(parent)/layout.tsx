import { Sidebar } from '@/components/layout/Sidebar'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function ParentLayout({
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
    { label: 'Tableau de bord', href: '/parent', icon: 'dashboard' },
    { label: 'Mes Enfants', href: '/parent/enfants', icon: 'child_care' },
    { label: 'Paiements', href: '/parent/paiements', icon: 'payments' },
    { label: 'Résultats', href: '/parent/resultats', icon: 'school' },
  ]

  return (
    <div className="flex min-h-screen bg-[var(--color-surface)]">
      <Sidebar 
        navItems={navItems} 
        userFullName={roleData?.full_name || 'Parent'} 
        userRoleLabel="Parent d'élève" 
      />
      <div className="flex-1 md:ml-64 flex flex-col">
        <main className="flex-1 p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
