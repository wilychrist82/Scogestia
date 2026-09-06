'use client'

import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { TopHeader } from './TopHeader'

export function AdminLayoutWrapper({ 
  children, 
  userFullName, 
  userRoleLabel,
  userAvatar,
  navVariant = 'admin',
  banner,
  schoolName,
  schoolCity
}: { 
  children: React.ReactNode, 
  userFullName: string, 
  userRoleLabel: string,
  userAvatar?: string | null,
  navVariant?: 'admin' | 'enseignant' | 'super_admin',
  banner?: React.ReactNode,
  schoolName?: string,
  schoolCity?: string
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <>
      <Sidebar 
        userFullName={userFullName} 
        userRoleLabel={userRoleLabel} 
        userAvatar={userAvatar}
        navVariant={navVariant}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <div className="flex h-screen bg-[var(--color-dashboard-bg)] overflow-hidden w-full relative">
        <div className="flex-1 ml-0 md:ml-64 flex flex-col h-screen overflow-hidden relative">
          {banner}
          <TopHeader 
          userFullName={userFullName} 
          userRoleLabel={userRoleLabel} 
          userAvatar={userAvatar}
          onMenuClick={() => setIsSidebarOpen(true)}
          schoolName={schoolName}
          schoolCity={schoolCity}
          navVariant={navVariant}
        />
          <main className={`flex-1 ${navVariant === 'enseignant' ? 'pb-8 lg:p-8' : 'p-4 md:p-6 lg:p-8'} overflow-y-auto custom-scrollbar relative`}>
            {children}
          </main>
        </div>
      </div>
    </>
  )
}
