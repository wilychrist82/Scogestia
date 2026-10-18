'use client'

import React from 'react'
import { LucideIcon, Sparkles } from 'lucide-react'

type Stat = {
  label: string
  value: string | number
  color?: string
}

type Props = {
  title: string
  subtitle?: string
  badge?: string
  badgeIcon?: LucideIcon
  stats?: Stat[]
  actions?: React.ReactNode
  className?: string
  children?: React.ReactNode
}

// Les couleurs de stats sont passées par les pages (variantes claires ou sombres) :
// on les ramène à des teintes lisibles sur le fond #050B18.
const statTone = (color?: string) => {
  if (!color) return 'text-white'
  if (color.includes('emerald') || color.includes('green')) return 'text-emerald-300'
  if (color.includes('rose') || color.includes('red')) return 'text-rose-300'
  if (color.includes('amber') || color.includes('orange') || color.includes('yellow')) return 'text-amber-300'
  if (color.includes('blue') || color.includes('sky') || color.includes('indigo') || color.includes('cyan')) return 'text-sky-300'
  return 'text-white'
}

export function FinanceExecutiveBanner({
  title,
  subtitle,
  badge = 'CENTRE FINANCIER & TRÉSORERIE',
  badgeIcon: BadgeIcon = Sparkles,
  stats,
  actions,
  className = '',
  children,
}: Props) {
  return (
    <div
      className={`relative flex flex-col justify-between gap-6 overflow-hidden rounded-3xl bg-[#050B18] p-6 shadow-[0_30px_80px_-30px_rgba(5,11,24,0.8)] ring-1 ring-white/10 sm:p-8 lg:flex-row lg:items-center ${className}`}
    >
      {/* Aurores émeraude & cyan */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 -top-32 h-[380px] w-[480px] rounded-full bg-emerald-500/20 blur-[120px]" />
        <div className="absolute -bottom-40 right-0 h-[340px] w-[440px] rounded-full bg-cyan-400/10 blur-[130px]" />
        <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_at_left,black_20%,transparent_75%)]" />
      </div>

      {/* Contenu gauche : badge, titre, sous-titre */}
      <div className="relative z-10 max-w-2xl">
        {badge && (
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-emerald-400/10 px-3.5 py-1.5 text-emerald-200 ring-1 ring-inset ring-emerald-400/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)]">
            <BadgeIcon size={13} />
            <span className="text-[11px] font-bold uppercase tracking-[0.14em]">{badge}</span>
          </div>
        )}

        <h1 className="text-2xl font-extrabold leading-[1.1] tracking-[-0.03em] text-white sm:text-3xl">
          {title}
        </h1>

        {subtitle && (
          <p className="mt-2.5 max-w-xl text-sm font-medium leading-relaxed text-slate-200 sm:text-base">
            {subtitle}
          </p>
        )}
      </div>

      {/* Contenu droite : stats et actions */}
      <div className="relative z-10 flex flex-wrap items-center gap-3 self-start lg:self-center">
        {stats && stats.length > 0 && (
          <div className="mr-1 flex flex-wrap items-center gap-2.5">
            {stats.map((stat, i) => (
              <div
                key={i}
                className="min-w-[104px] rounded-xl bg-white/[0.05] px-4 py-3 ring-1 ring-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] backdrop-blur-md transition-colors hover:bg-white/[0.09]"
              >
                <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-200">
                  {stat.label}
                </p>
                <p className={`whitespace-nowrap text-lg font-extrabold leading-none tabular-nums tracking-tight ${statTone(stat.color)}`}>
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        )}

        {actions && (
          <div className="flex flex-wrap items-center gap-2.5">
            {actions}
          </div>
        )}

        {children}
      </div>
    </div>
  )
}
