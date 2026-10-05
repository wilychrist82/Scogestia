'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, GraduationCap, WalletCards } from 'lucide-react'

const TABS = [
  {
    href: '/admin/rapports',
    label: 'Rapport global',
    icon: BarChart3,
    exact: true,
  },
  {
    href: '/admin/rapports/academique',
    label: 'Rapports académiques',
    icon: GraduationCap,
  },
  {
    href: '/admin/rapports/finance',
    label: 'Bilans financiers',
    icon: WalletCards,
  },
]

export function RapportsNavTabs() {
  const pathname = usePathname()

  return (
    <div className="flex items-center gap-1 overflow-x-auto border-b border-[var(--color-outline-variant)] pb-px -mx-1 px-1 scrollbar-hide">
      {TABS.map((tab) => {
        const isActive = tab.exact
          ? pathname === tab.href
          : pathname.startsWith(tab.href)
        const Icon = tab.icon

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
              isActive
                ? 'border-[var(--color-primary)] text-[var(--color-primary)] font-bold bg-[var(--color-primary-container)]/10 rounded-t-lg'
                : 'border-transparent text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)] hover:border-slate-300'
            }`}
          >
            <Icon size={16} className={isActive ? 'text-[var(--color-primary)]' : 'text-[var(--color-on-surface-variant)]'} />
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}
