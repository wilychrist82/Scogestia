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
    { label: 'Impayés & Relances', href: `${basePath}/impayes`, icon: AlertTriangle },
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
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-2 border-b border-slate-200">
      {/* Barre d'onglets avec contraste irréprochable sur fond clair */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const active = isTabActive(tab.href, tab.exact)

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 whitespace-nowrap shadow-xs ${
                active
                  ? 'bg-emerald-600 text-white shadow-emerald-600/20 border border-emerald-600'
                  : 'bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-100 hover:border-slate-300 border border-slate-200'
              }`}
            >
              <Icon size={14} className={active ? 'text-white' : 'text-slate-500'} />
              <span>{tab.label}</span>
            </Link>
          )
        })}
      </div>

      {/* Raccourci d'action guichet direct */}
      <div className="flex items-center gap-2 shrink-0">
        <Link
          href={`${basePath}/caisse`}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 shadow-sm transition-colors whitespace-nowrap"
        >
          <PlusCircle size={15} />
          <span>Nouveau versement</span>
        </Link>
      </div>
    </div>
  )
}
