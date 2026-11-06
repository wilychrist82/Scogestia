'use client'

import React from 'react'
import { LucideIcon } from 'lucide-react'

type Stat = {
  label: string
  value: string | number
  color?: string
}

type Props = {
  title: string
  subtitle?: string
  badge?: string
  icon?: LucideIcon
  stats?: Stat[]
  actions?: React.ReactNode
  className?: string
  children?: React.ReactNode
}

export function AuraHeroBanner({
  title,
  subtitle,
  badge = 'TABLEAU DE BORD',
  icon: Icon,
  stats,
  actions,
  className = '',
  children,
}: Props) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl min-h-[135px] sm:min-h-[145px] flex flex-col lg:flex-row lg:items-center justify-between gap-5 px-6 py-5 sm:px-7 sm:py-6 shadow-[0_14px_34px_-12px_rgba(67,56,202,0.45)] ring-1 ring-indigo-400/25 bg-gradient-to-r from-[#1E293B] via-[#312E81] to-[#4338CA] ${className}`}
    >
      {/* ── ARRIÈRE-PLAN ÉLÉGANT : STRIPE ROYAL INDIGO & SAPPHIRE ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
        <div className="absolute -right-12 -top-16 h-56 w-56 rounded-full bg-indigo-400/25 blur-3xl" />
        <div className="absolute -bottom-20 left-1/3 h-48 w-72 rounded-full bg-sky-400/15 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_at_right,black_25%,transparent_75%)]" />
      </div>

      {/* ── CONTENU GAUCHE : IDENTIFICATION & TITRES ── */}
      <div className="relative z-10 max-w-xl">
        {badge && (
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md ring-1 ring-inset ring-white/25 rounded-full px-3 py-1 mb-2 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-300" />
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-indigo-50">{badge}</p>
          </div>
        )}

        <h1 className="text-xl sm:text-2xl font-extrabold text-white leading-tight tracking-tight flex items-center gap-3">
          {Icon && <Icon size={24} className="text-white shrink-0" />}
          <span>{title}</span>
        </h1>

        {subtitle && (
          <p className="text-indigo-100/90 text-[13px] sm:text-sm mt-1 font-medium leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>

      {/* ── CONTENU DROITE : ACTIONS & STATS TRANSLUCIDES ── */}
      <div className="relative z-10 flex flex-wrap items-center gap-3 self-start lg:self-center">
        {/* Capsules de statistiques en verre dépoli nacré translucide (contraste net sans effet bleu sur bleu) */}
        {stats && stats.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            {stats.map((stat, i) => (
              <div
                key={i}
                className="bg-white/[0.14] hover:bg-white/[0.22] backdrop-blur-xl border border-white/30 hover:border-white/50 rounded-2xl px-3.5 sm:px-4 py-2.5 text-center transition-all duration-300 shadow-[0_8px_20px_rgba(0,0,0,0.25)] ring-1 ring-inset ring-white/20 group cursor-default min-w-[85px] sm:min-w-[95px]"
              >
                <p className="text-[9.5px] text-white/90 font-black uppercase tracking-[0.14em] mb-0.5">
                  {stat.label}
                </p>
                <p
                  className={`text-lg sm:text-xl font-black leading-none ${
                    stat.color || 'text-white'
                  } group-hover:scale-105 inline-block transition-transform drop-shadow-sm`}
                >
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Boutons d'actions rapides (style pill exact de la capture) */}
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
