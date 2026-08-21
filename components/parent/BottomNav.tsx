'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { label: 'Accueil', href: '/parent', icon: 'home' },
  { label: 'Messages', href: '/parent/messages', icon: 'forum' },
  { label: 'Notes', href: '/parent/notes', icon: 'grading' },
  { label: 'Présences', href: '/parent/presences', icon: 'fact_check' },
  { label: 'Devoirs', href: '/parent/devoirs', icon: 'assignment' },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[var(--color-outline-variant)] pb-safe h-16 flex items-center justify-around z-50">
      {navItems.map(item => {
        const isActive = pathname === item.href
        return (
          <Link 
            key={item.href} 
            href={item.href}
            className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${isActive ? 'text-[var(--color-primary)]' : 'text-[var(--color-on-surface-variant)]'}`}
          >
            <span className={`material-symbols-outlined ${isActive ? 'filled' : ''} text-[24px]`}>
              {item.icon}
            </span>
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        )
      })}
    </div>
  )
}
