'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Sidebar } from './Sidebar'
import { TopHeader } from './TopHeader'
import { PaywallOverlay } from '@/components/admin/abonnement/PaywallOverlay'
import { AVATAR_UPDATED_EVENT } from '@/lib/avatar-sync'

import { EnseignantBottomNav } from '@/components/enseignant/EnseignantBottomNav'

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
  navVariant?: 'admin' | 'comptable' | 'enseignant' | 'super_admin',
  banner?: React.ReactNode,
  schoolName?: string,
  schoolCity?: string,
  isExpired?: boolean,
  daysRemaining?: number,
  isSuperAdmin?: boolean
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [avatarOverride, setAvatarOverride] = useState<{ base: string | null; value: string | null } | null>(null)
  const pathname = usePathname()
  const isAbonnementPage = pathname === '/admin/abonnement'

  useEffect(() => {
    const handleAvatarUpdated = (event: Event) => {
      const custom = event as CustomEvent<{ avatarUrl: string | null }>
      setAvatarOverride({
        base: userAvatar || null,
        value: custom.detail?.avatarUrl ?? null,
      })
    }
    window.addEventListener(AVATAR_UPDATED_EVENT, handleAvatarUpdated)
    return () => window.removeEventListener(AVATAR_UPDATED_EVENT, handleAvatarUpdated)
  }, [userAvatar])

  const liveAvatar =
    avatarOverride && avatarOverride.base === (userAvatar || null)
      ? avatarOverride.value
      : (userAvatar || null)

  // Si l'abonnement est expiré et qu'on n'est pas sur la page d'abonnement,
  // on affiche le PaywallOverlay qui bloque strictement l'accès.
  const shouldBlockAccess = isExpired && navVariant === 'admin' && !isAbonnementPage

  return (
    <>
      <Sidebar
        userFullName={userFullName}
        userRoleLabel={userRoleLabel}
        userAvatar={liveAvatar}
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
            userAvatar={liveAvatar}
            onMenuClick={() => setIsSidebarOpen(prev => !prev)}
            schoolName={schoolName}
            schoolCity={schoolCity}
            navVariant={navVariant}
          />
          <main className={`flex-1 ${navVariant === 'enseignant' ? 'pb-20 md:pb-8 lg:p-8' : 'p-4 md:p-6 lg:p-8'} overflow-y-auto scrollbar-light relative`}>
            {shouldBlockAccess ? (
              <PaywallOverlay schoolName={schoolName} daysRemaining={daysRemaining} />
            ) : (
              children
            )}
          </main>
          {navVariant === 'enseignant' && <EnseignantBottomNav />}
        </div>
      </div>
    </>
  )
}
