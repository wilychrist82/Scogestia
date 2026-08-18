import { Sidebar } from '@/components/layout/Sidebar'
import { TopHeader } from '@/components/layout/TopHeader'
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
    <div className="flex h-screen bg-[var(--color-dashboard-bg)] overflow-hidden">
      <Sidebar 
        userFullName={userFullName} 
        userRoleLabel={userRoleLabel} 
      />
      <div className="flex-1 md:ml-64 flex flex-col h-screen overflow-hidden">
        <TopHeader userFullName={userFullName} userRoleLabel={userRoleLabel} />
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto custom-scrollbar">
          {children}
        </main>
      </div>
    </div>
  )
}
