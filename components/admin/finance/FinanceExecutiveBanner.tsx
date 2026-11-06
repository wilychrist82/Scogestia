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
      className={`relative flex flex-col justify-between gap-5 overflow-hidden rounded-2xl bg-gradient-to-r from-[#1E293B] via-[#312E81] to-[#4338CA] px-6 py-5 text-white shadow-[0_14px_34px_-12px_rgba(67,56,202,0.45)] ring-1 ring-indigo-400/25 sm:px-7 sm:py-6 lg:flex-row lg:items-center ${className}`}
    >
      {/* Aurores Indigo & Saphir style Stripe */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -right-12 -top-16 h-48 w-48 rounded-full bg-indigo-400/20 blur-2xl" />
        <div className="absolute -left-12 -bottom-16 h-40 w-40 rounded-full bg-sky-400/15 blur-2xl" />
      </div>

      {/* Contenu gauche : badge, titre, sous-titre */}
      <div className="relative z-10 max-w-2xl">
        {badge && (
          <div className="mb-2.5 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-indigo-100 ring-1 ring-inset ring-white/20">
            <BadgeIcon size={12} />
            <span className="text-[10px] font-bold uppercase tracking-[0.14em]">{badge}</span>
          </div>
        )}

        <h1 className="text-xl font-extrabold leading-tight tracking-tight text-white sm:text-2xl">
          {title}
        </h1>

        {subtitle && (
          <p className="mt-1 max-w-xl text-xs font-medium leading-relaxed text-indigo-100/90 sm:text-sm">
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
                className="min-w-[96px] rounded-xl bg-white/12 px-4 py-2.5 ring-1 ring-white/20 backdrop-blur-md transition-colors hover:bg-white/18"
              >
                <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-100">
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
