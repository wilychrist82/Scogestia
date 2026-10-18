'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Layers,
  Banknote,
  Receipt,
  Calendar,
  AlertTriangle,
  DollarSign,
  FileText,
  PlusCircle,
} from 'lucide-react'

type Props = {
  basePath?: string
}

export function FinanceNavTabs({ basePath = '/admin/finance' }: Props) {
  const pathname = usePathname()

  const tabs = [
    { label: "Vue d'ensemble", href: basePath, icon: Layers, exact: true },
    { label: 'Caisse (Direct)', href: `${basePath}/caisse`, icon: Banknote },
    { label: 'Paiements & Reçus', href: `${basePath}/paiements`, icon: Receipt },
    { label: 'Échéancier', href: `${basePath}/echeances`, icon: Calendar },
    { label: 'Impayés & Relances', href: `${basePath}/impayes`, icon: AlertTriangle, alert: true },
    { label: 'Frais Scolaires', href: `${basePath}/frais`, icon: DollarSign },
    { label: 'Rapports & Bilans', href: `${basePath}/rapports`, icon: FileText },
  ]

  const isTabActive = (href: string, exact?: boolean) => {
    if (exact) {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  return (
    <div className="mb-2 flex flex-col justify-between gap-3 pb-4 sm:flex-row sm:items-center">
      {/* Barre d'onglets feutrée */}
      <nav
        aria-label="Navigation Finance"
        className="flex items-center gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-slate-100/80 p-1 shadow-[inset_0_1px_2px_rgba(15,23,42,0.06)] scrollbar-none"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon
          const active = isTabActive(tab.href, tab.exact)

          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? 'page' : undefined}
              className={`inline-flex items-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-bold transition-all duration-200 ${
                active
                  ? 'bg-emerald-700 text-white shadow-[0_4px_12px_-4px_rgba(4,120,87,0.7),inset_0_1px_0_rgba(255,255,255,0.2)] ring-1 ring-emerald-800'
                  : 'text-slate-800 hover:bg-white hover:text-slate-900 hover:shadow-sm hover:ring-1 hover:ring-slate-200'
              }`}
            >
              <Icon
                size={14}
                className={active ? 'text-white' : tab.alert ? 'text-rose-600' : 'text-slate-700'}
              />
              <span>{tab.label}</span>
              {tab.alert && !active && (
                <span className="h-1.5 w-1.5 rounded-full bg-rose-600" aria-hidden />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Raccourci d'action guichet direct */}
      <div className="flex shrink-0 items-center gap-2">
        <Link
          href={`${basePath}/caisse`}
          className="inline-flex items-center gap-2 whitespace-nowrap rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white shadow-[0_6px_16px_-6px_rgba(4,120,87,0.7),inset_0_1px_0_rgba(255,255,255,0.2)] transition-all hover:bg-emerald-800 active:scale-[0.98]"
        >
          <PlusCircle size={15} />
          <span>Nouveau versement</span>
        </Link>
      </div>
    </div>
  )
}
