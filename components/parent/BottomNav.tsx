'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useNotifications } from '@/components/providers/NotificationProvider'
import { Home, MessageSquare, Award, CalendarCheck, BookOpen } from 'lucide-react'

const navItems = [
  { label: 'Accueil', href: '/parent', icon: Home },
  { label: 'Messages', href: '/parent/messages', icon: MessageSquare },
  { label: 'Résultats', href: '/parent/bulletins', icon: Award },
  { label: 'Présences', href: '/parent/presences', icon: CalendarCheck },
  { label: 'Devoirs', href: '/parent/devoirs', icon: BookOpen },
]

export function BottomNav() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const child = searchParams.get('child') || searchParams.get('student_id')
  const { unreadCount } = useNotifications()

  return (
    <nav 
      aria-label="Navigation principale parent"
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md md:max-w-2xl lg:max-w-3xl bg-white/95 backdrop-blur-xl border-t border-slate-200/80 flex items-center justify-around z-50 shadow-[0_-6px_25px_rgba(15,23,42,0.08)]"
      style={{
        paddingBottom: 'max(0.35rem, env(safe-area-inset-bottom))',
        height: 'calc(4.1rem + env(safe-area-inset-bottom))'
      }}
    >
      {navItems.map(item => {
        const isActive = pathname === item.href
        const Icon = item.icon
        const isMessages = item.href === '/parent/messages'

        return (
          <Link 
            key={item.href} 
            href={child ? `${item.href}?child=${child}` : item.href}
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 gap-1 transition-all relative group select-none ${
              isActive 
                ? 'text-emerald-700 font-bold' 
                : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            {/* Ligne d'accentuation supérieure active */}
            {isActive && (
              <span className="absolute top-0 inset-x-6 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.7)]" />
            )}

            <div className="relative flex items-center justify-center">
              <div className={`p-1.5 rounded-xl transition-all ${
                isActive 
                  ? 'bg-emerald-50 text-emerald-600 scale-105 shadow-2xs' 
                  : 'group-hover:bg-slate-50'
              }`}>
                <Icon size={20} className={isActive ? 'stroke-[2.4]' : 'stroke-[1.8]'} />
              </div>

              {isMessages && unreadCount > 0 && (
                <span className="absolute -top-1 -right-1.5 bg-rose-500 text-white text-[9.5px] font-extrabold min-w-[17px] h-[17px] px-1 rounded-full flex items-center justify-center border-2 border-white shadow-xs animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>

            <span className={`text-[10.5px] tracking-tight leading-none ${isActive ? 'font-bold' : 'font-medium'}`}>
              {item.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
