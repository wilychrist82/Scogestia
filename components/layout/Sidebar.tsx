'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export type NavItem = {
  label: string
  href: string
  icon: string
}

export type SidebarProps = {
  navItems: NavItem[]
  userFullName: string
  userRoleLabel: string
}

export function Sidebar({ navItems, userFullName, userRoleLabel }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="bg-[var(--color-surface-container-lowest)] h-screen w-64 fixed left-0 top-0 border-r border-[var(--color-outline-variant)] hidden md:flex flex-col py-8 px-4 z-20">
      <div className="mb-8 flex items-center gap-3">
        <div className="w-10 h-10 bg-[var(--color-surface-container)] rounded flex items-center justify-center font-bold text-[var(--color-primary)]">
          S
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-primary)]">Scogestia</h1>
          <p className="text-xs text-[var(--color-on-surface-variant)]">Gestion Scolaire</p>
        </div>
      </div>
      
      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ease-in-out ${
                isActive 
                  ? 'bg-[#d5e0f8] text-[#0b1c30] font-semibold' // secondary-container and on-secondary-container
                  : 'text-[var(--color-on-surface-variant)] hover:bg-[#dce9ff]' // hover: surface-container-high
              }`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto flex items-center gap-3 px-4 py-3 border-t border-[var(--color-outline-variant)] pt-4">
        <div className="w-10 h-10 rounded-full bg-[var(--color-surface-variant)] flex items-center justify-center text-[var(--color-on-surface)] font-bold border border-[var(--color-outline-variant)]">
          {userFullName.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-bold text-[var(--color-on-surface)] truncate w-32">{userFullName}</p>
          <p className="text-xs text-[var(--color-on-surface-variant)]">{userRoleLabel}</p>
        </div>
      </div>
    </aside>
  )
}
