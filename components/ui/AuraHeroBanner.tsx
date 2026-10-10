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
      className={`relative overflow-hidden rounded-[1.75rem] min-h-[145px] sm:min-h-[155px] flex flex-col lg:flex-row lg:items-center justify-between gap-5 p-6 sm:p-8 shadow-[0_20px_50px_rgba(7,13,30,0.4)] border border-white/[0.12] ring-1 ring-inset ring-white/[0.06] bg-[#070D1E] ${className}`}
    >
      {/* ── ARRIÈRE-PLAN ÉLÉGANT : BLEU FONCÉ À GAUCHE CROISÉ AVEC BLEU CLAIR CYAN À DROITE (SANS JAUNE/ORANGE) ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
        
        {/* Fond dégradé bleu nuit exécutif de base */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#070D1E] via-[#0E204E] to-[#0A3273]" />

        {/* Forme vectorielle SVG de la vague fluide bleue */}
        <svg
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="none"
          viewBox="0 0 1200 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Dégradé bleu roi profond au centre */}
            <radialGradient id="auraRoyalBlue" cx="45%" cy="50%" r="55%" fx="35%" fy="50%">
              <stop offset="0%" stopColor="#2563EB" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#1D4ED8" stopOpacity="0.75" />
              <stop offset="85%" stopColor="#1E3A8A" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#070D1E" stopOpacity="0" />
            </radialGradient>

            {/* Vague Océanique / Cyan et Bleu Ciel éclatant à droite */}
            <radialGradient id="auraCyanWave" cx="95%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.95" />
              <stop offset="35%" stopColor="#0EA5E9" stopOpacity="0.9" />
              <stop offset="70%" stopColor="#0284C7" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#070D1E" stopOpacity="0" />
            </radialGradient>

            {/* Filtre de flou doux organique */}
            <filter id="auraBlur" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="25" />
            </filter>
          </defs>

          {/* Courbe fluide parabolique enveloppante bleu royal */}
          <path
            d="M 400 0 C 470 65, 520 135, 640 200 L 1200 200 L 1200 0 Z"
            fill="url(#auraRoyalBlue)"
          />

          {/* Vague cyan et bleu ciel éclatante sur le côté droit */}
          <path
            d="M 800 0 C 780 60, 860 140, 1000 200 L 1200 200 L 1200 0 Z"
            fill="url(#auraCyanWave)"
            opacity="0.95"
          />

          {/* Arc lumineux ultra-fin qui traverse la courbe */}
          <path
            d="M 680 0 C 680 85, 750 155, 870 200"
            stroke="rgba(255, 255, 255, 0.4)"
            strokeWidth="1.5"
            strokeDasharray="4 2"
            fill="none"
          />
        </svg>

        {/* Lueur bleu roi diffuse au centre */}
        <div className="absolute top-1/2 left-[52%] -translate-x-1/2 -translate-y-1/2 w-[420px] h-[300px] bg-[radial-gradient(circle,_#2563EB_0%,_#1E40AF_50%,_transparent_75%)] opacity-70 blur-[50px] pointer-events-none" />

        {/* Lueur bleu ciel / cyan électrique au bord droit */}
        <div className="absolute -top-16 -right-16 w-[420px] h-[420px] bg-[radial-gradient(circle,_#38BDF8_0%,_#0284C7_50%,_transparent_75%)] opacity-85 blur-[55px] pointer-events-none" />

        {/* Fin voilage de verre pour adoucir la brillance */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] via-transparent to-black/[0.2] pointer-events-none" />
      </div>

      {/* ── CONTENU GAUCHE : IDENTIFICATION & TITRES ── */}
      <div className="relative z-10 max-w-xl">
        {badge && (
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-3 py-1 mb-2.5 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300">{badge}</p>
          </div>
        )}

        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-tight tracking-tight flex items-center gap-3 drop-shadow-sm">
          {Icon && <Icon size={28} className="text-white shrink-0 drop-shadow-xs" />}
          <span>{title}</span>
        </h1>

        {subtitle && (
          <p className="text-white/80 text-xs sm:text-sm mt-1.5 font-medium leading-relaxed drop-shadow-xs">
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
