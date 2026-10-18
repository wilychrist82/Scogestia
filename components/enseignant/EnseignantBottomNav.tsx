'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useNotifications } from '@/components/providers/NotificationProvider'
import {
  LayoutDashboard,
  MessageSquare,
  CalendarCheck,
  BookOpen,
  GraduationCap
} from 'lucide-react'

const navItems = [
  { label: 'Accueil', href: '/enseignant', icon: LayoutDashboard },
  { label: 'Messages', href: '/enseignant/messages', icon: MessageSquare },
  { label: 'Présences', href: '/enseignant/presences', icon: CalendarCheck },
  { label: 'Devoirs', href: '/enseignant/devoirs', icon: BookOpen },
  { label: 'Notes', href: '/enseignant/notes', icon: GraduationCap },
]

export function EnseignantBottomNav() {
  const pathname = usePathname()
  const { unreadCount } = useNotifications()

  return (
    <nav
      aria-label="Navigation mobile enseignant"
      className="fixed left-1/2 z-40 flex h-16 w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 items-center justify-around rounded-[1.75rem] bg-white/75 px-1.5 shadow-[0_12px_40px_-10px_rgba(15,23,42,0.35),inset_0_1px_1px_rgba(255,255,255,0.9)] ring-1 ring-slate-900/10 backdrop-blur-xl md:hidden"
      style={{ bottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
    >
      {navItems.map(item => {
        const isActive = pathname === item.href || (item.href !== '/enseignant' && pathname.startsWith(`${item.href}/`))
        const isMessages = item.href === '/enseignant/messages'
        const Icon = item.icon

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? 'page' : undefined}
            className="group relative flex h-full flex-1 select-none flex-col items-center justify-center gap-1 transition-transform active:scale-90"
          >
            <div className="relative flex items-center justify-center">
              <div className={`flex h-9 w-12 items-center justify-center rounded-2xl transition-all duration-300 ${
                isActive
                  ? 'bg-emerald-700 text-white shadow-[0_6px_16px_-4px_rgba(4,120,87,0.8),inset_0_1px_1px_rgba(255,255,255,0.3)]'
                  : 'text-slate-700 group-hover:bg-slate-900/5 group-hover:text-slate-900'
              }`}>
                <Icon size={20} className={isActive ? 'stroke-[2.4]' : 'stroke-[1.9]'} />
              </div>

              {isMessages && unreadCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px]">
                  <span aria-hidden className="absolute inset-0 animate-ping rounded-full bg-rose-400 opacity-60" />
                  <span className="relative flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-extrabold tabular-nums text-white shadow-[0_0_10px_rgba(225,29,72,0.6)] ring-2 ring-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                </span>
              )}
            </div>

            <span className={`text-[10.5px] leading-none tracking-tight ${isActive ? 'font-extrabold text-emerald-900' : 'font-semibold text-slate-800'}`}>
              {item.label}
            </span>

            {isActive && (
              <span aria-hidden className="absolute -bottom-0.5 h-1 w-5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.9)]" />
            )}
          </Link>
        )
      })}
    </nav>
  )
}
