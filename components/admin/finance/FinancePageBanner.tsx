'use client'

import { LucideIcon } from 'lucide-react'

type Stat = {
  label: string
  value: string | number
  color?: string
}

type Props = {
  title: string
  subtitle: string
  badge?: string
  icon?: LucideIcon
  stats?: Stat[]
  actions?: React.ReactNode
}

export function FinancePageBanner({
  title,
  subtitle,
  badge = 'GESTION FINANCIÈRE',
  icon: Icon,
  stats,
  actions,
}: Props) {
  return (
    <div className="relative overflow-hidden rounded-[1.75rem] bg-[#070b14] min-h-[130px] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl border border-white/[0.08] ring-1 ring-inset ring-white/[0.04] p-6 sm:p-7 mb-6">
      {/* Orbes lumineuses de prestige */}
      <div className="absolute -top-12 -left-12 w-64 h-64 bg-emerald-500/15 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute -bottom-10 right-10 w-64 h-64 bg-violet-500/15 rounded-full blur-[70px] pointer-events-none" />

      {/* Contenu principal */}
      <div className="relative z-10">
        <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-0.5 mb-2.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400">{badge}</p>
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-white leading-tight tracking-tight flex items-center gap-2.5">
          {Icon && <Icon size={22} className="text-emerald-400 shrink-0" />}
          <span>{title}</span>
        </h1>
        <p className="text-white/60 text-xs sm:text-sm mt-1 font-medium max-w-2xl">{subtitle}</p>
      </div>

      {/* Stats rapides ou actions */}
      <div className="relative z-10 flex items-center gap-2.5 flex-wrap sm:pl-0">
        {stats && stats.map((stat, i) => (
          <div
            key={i}
            className="bg-white/[0.05] border border-white/[0.08] rounded-2xl px-4 py-2.5 text-center min-w-[95px]"
          >
            <p className="text-[9px] text-white/50 font-bold uppercase tracking-[0.15em] mb-0.5">{stat.label}</p>
            <p className={`text-base sm:text-lg font-black leading-none ${stat.color || 'text-white'}`}>
              {stat.value}
            </p>
          </div>
        ))}

        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}
