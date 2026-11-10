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

// Teintes lisibles sur le fond dégradé Émeraude Impérial (#022C22 -> #064E3B -> #047857)
const statTone = (color?: string) => {
  if (!color) return 'text-white'
  if (color.includes('emerald') || color.includes('green')) return 'text-emerald-200'
  if (color.includes('rose') || color.includes('red')) return 'text-rose-200'
  if (color.includes('amber') || color.includes('orange') || color.includes('yellow')) return 'text-amber-200'
  if (color.includes('blue') || color.includes('sky') || color.includes('indigo') || color.includes('cyan')) return 'text-sky-200'
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
      className={`relative flex flex-col justify-between gap-5 overflow-hidden rounded-2xl bg-gradient-to-r from-[#022C22] via-[#064E3B] to-[#047857] px-6 py-5 text-white shadow-[0_12px_32px_-10px_rgba(4,120,87,0.35)] ring-1 ring-emerald-400/25 sm:px-7 sm:py-6 lg:flex-row lg:items-center ${className}`}
    >
      {/* Reflets subtils émeraude & menthe */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="absolute -left-16 -bottom-20 h-48 w-48 rounded-full bg-teal-300/15 blur-3xl" />
      </div>

      {/* Contenu gauche : badge, titre, sous-titre */}
      <div className="relative z-10 max-w-2xl">
        {badge && (
          <div className="mb-2.5 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-emerald-100 ring-1 ring-inset ring-white/20 backdrop-blur-sm">
            <BadgeIcon size={12} />
            <span className="text-[10px] font-bold uppercase tracking-[0.14em]">{badge}</span>
          </div>
        )}

        <h1 className="text-xl font-extrabold leading-tight tracking-tight text-white sm:text-2xl">
          {title}
        </h1>

        {subtitle && (
          <p className="mt-1 max-w-xl text-xs font-medium leading-relaxed text-emerald-100/90 sm:text-sm">
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
                className="min-w-[104px] rounded-xl bg-white/10 px-4 py-2.5 ring-1 ring-white/20 backdrop-blur-md transition-colors hover:bg-white/15"
              >
                <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-100/80">
                  {stat.label}
                </p>
                <p
                  className={`whitespace-nowrap text-lg font-extrabold leading-none tabular-nums tracking-tight ${statTone(
                    stat.color
                  )}`}
                >
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
