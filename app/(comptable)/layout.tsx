import { Sidebar } from '@/components/layout/Sidebar'
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
    { label: 'Échéanciers', href: '/comptable/echeanciers', icon: 'calendar_month' },
    { label: 'Relances', href: '/comptable/relances', icon: 'notifications_active' },
  ]

  return (
    <div className="flex min-h-screen bg-[var(--color-surface)]">
      <Sidebar 
        navItems={navItems} 
        userFullName={roleData?.full_name || 'Comptable'} 
        userRoleLabel="Comptable" 
      />
      <div className="flex-1 md:ml-64 flex flex-col">
        <main className="flex-1 p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
