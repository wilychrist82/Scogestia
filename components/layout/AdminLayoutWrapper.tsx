'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Sidebar } from './Sidebar'
import { TopHeader } from './TopHeader'
import { PaywallOverlay } from '@/components/admin/abonnement/PaywallOverlay'

export function AdminLayoutWrapper({ 
  children, 
  userFullName, 
  userRoleLabel,
  userAvatar,
  navVariant = 'admin',
  banner,
  schoolName,
  schoolCity,
  isExpired = false,
  daysRemaining = 0,
  isSuperAdmin = false
}: { 
  children: React.ReactNode, 
  userFullName: string, 
  userRoleLabel: string,
  userAvatar?: string | null,
  navVariant?: 'admin' | 'enseignant' | 'super_admin',
  banner?: React.ReactNode,
  schoolName?: string,
  schoolCity?: string,
  isExpired?: boolean,
  daysRemaining?: number,
  isSuperAdmin?: boolean
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const pathname = usePathname()
  const isAbonnementPage = pathname === '/admin/abonnement'

  // Si l'abonnement est expiré et qu'on n'est pas sur la page d'abonnement,
  // on affiche le PaywallOverlay qui bloque strictement l'accès.
  const shouldBlockAccess = isExpired && navVariant === 'admin' && !isAbonnementPage

  return (
    <>
      <Sidebar 
        userFullName={userFullName} 
        userRoleLabel={userRoleLabel}
        navVariant={navVariant}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        isExpired={isExpired}
        isSuperAdmin={isSuperAdmin}
      />
      <div className="flex h-screen bg-[var(--color-dashboard-bg)] overflow-hidden w-full relative">
        <div className="flex-1 ml-0 md:ml-64 flex flex-col h-screen overflow-hidden relative">
          {banner}
          <TopHeader 
            userFullName={userFullName} 
            userRoleLabel={userRoleLabel} 
            userAvatar={userAvatar}
            onMenuClick={() => setIsSidebarOpen(prev => !prev)}
            schoolName={schoolName}
            schoolCity={schoolCity}
            navVariant={navVariant}
          />
          <main className={`flex-1 ${navVariant === 'enseignant' ? 'pb-8 lg:p-8' : 'p-4 md:p-6 lg:p-8'} overflow-y-auto scrollbar-light relative`}>
            {shouldBlockAccess ? (
              <PaywallOverlay schoolName={schoolName} daysRemaining={daysRemaining} />
            ) : (
              children
            )}
          </main>
        </div>
      </div>
    </>
  )
}
