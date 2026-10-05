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
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#DBEAFE] via-[#EFF6FF] to-[#BFDBFE]/80 border border-blue-200/70 p-6 sm:p-7 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-5 ${className}`}
    >
      {/* Lueur d'ambiance bleue douce en arrière-plan */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 right-1/4 w-64 h-64 bg-indigo-300/15 rounded-full blur-2xl pointer-events-none" />

      {/* Contenu gauche : Titre, badge et description claire */}
      <div className="relative z-10 max-w-xl">
        {badge && (
          <div className="inline-flex items-center gap-1.5 bg-amber-100/90 border border-amber-300/70 rounded-full px-2.5 py-0.5 mb-2.5 text-amber-900 shadow-2xs">
            <BadgeIcon size={12} className="text-amber-700" />
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-amber-900">{badge}</span>
          </div>
        )}

        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-tight">
          {title}
        </h1>

        {subtitle && (
          <p className="text-xs sm:text-sm text-slate-600 mt-1.5 font-medium leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>

      {/* Contenu droite : Stats ou boutons d'actions épurés (Style ClassPanel) */}
      <div className="relative z-10 flex flex-wrap items-center gap-3 self-start lg:self-center">
        {stats && stats.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap mr-1">
            {stats.map((stat, i) => (
              <div
                key={i}
                className="bg-white/80 hover:bg-white border border-blue-200/80 rounded-xl px-3.5 py-2 text-center transition-all shadow-xs min-w-[80px]"
              >
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">
                  {stat.label}
                </p>
                <p className={`text-base font-black leading-none ${stat.color || 'text-slate-900'}`}>
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        )}

        {actions && (
          <div className="flex items-center gap-2.5 flex-wrap">
            {actions}
          </div>
        )}

        {children}
      </div>
    </div>
  )
}
