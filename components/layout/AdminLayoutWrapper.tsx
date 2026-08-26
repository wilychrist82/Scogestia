'use client'

import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { TopHeader } from './TopHeader'

export function AdminLayoutWrapper({ 
  children, 
  userFullName, 
  userRoleLabel,
  navVariant = 'admin'
}: { 
  children: React.ReactNode, 
  userFullName: string, 
  userRoleLabel: string,
  navVariant?: 'admin' | 'enseignant' | 'super_admin'
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-[var(--color-dashboard-bg)] overflow-hidden">
      <Sidebar 
        userFullName={userFullName} 
        userRoleLabel={userRoleLabel} 
        navVariant={navVariant}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <div className="flex-1 md:ml-64 flex flex-col h-screen overflow-hidden w-full">
        <TopHeader 
          userFullName={userFullName} 
          userRoleLabel={userRoleLabel} 
          onMenuClick={() => setIsSidebarOpen(true)}
        />
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto custom-scrollbar relative z-0">
          {children}
        </main>
      </div>
    </div>
  )
}
