'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useNotifications } from '@/components/providers/NotificationProvider'

const navItems = [
  { label: 'Accueil', href: '/enseignant', icon: 'home' },
  { label: 'Messages', href: '/enseignant/messages', icon: 'forum' },
  { label: 'Présences', href: '/enseignant/presences', icon: 'fact_check' },
  { label: 'Devoirs', href: '/enseignant/devoirs', icon: 'assignment' },
  { label: 'Notes', href: '/enseignant/notes', icon: 'workspace_premium' },
]

export function EnseignantBottomNav() {
  const pathname = usePathname()
  const { unreadCount } = useNotifications()

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 w-full bg-white border-t border-gray-200 flex items-center justify-around z-40 md:hidden shadow-[0_-2px_10px_rgba(0,0,0,0.06)]"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom)',
        height: 'calc(4rem + env(safe-area-inset-bottom))'
      }}
    >
      {navItems.map(item => {
        const isActive = pathname === item.href || (item.href !== '/enseignant' && pathname.startsWith(`${item.href}/`))
        const isMessages = item.href === '/enseignant/messages'

        return (
          <Link 
            key={item.href} 
            href={item.href}
            className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors relative ${
              isActive ? 'text-[var(--color-primary)] font-semibold' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="relative">
              <span className={`material-symbols-outlined ${isActive ? 'filled' : ''} text-[24px]`}>
                {item.icon}
              </span>
              {isMessages && unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-2.5 bg-red-500 text-white text-[10px] font-extrabold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center shadow-md animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium leading-tight">{item.label}</span>
          </Link>
        )
      })}
    </div>
  )
}
