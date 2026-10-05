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
      className={`relative overflow-hidden rounded-[1.75rem] min-h-[145px] sm:min-h-[155px] flex flex-col lg:flex-row lg:items-center justify-between gap-5 p-6 sm:p-8 shadow-[0_20px_50px_rgba(24,14,52,0.35)] border border-white/[0.12] ring-1 ring-inset ring-white/[0.06] bg-[#180E34] ${className}`}
    >
      {/* ── ARRIÈRE-PLAN MAGIQUE : AURA FLUIDE COUCHER DE SOLEIL & VAGUE OCÉANIQUE ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
        
        {/* Fond dégradé violet profond de base */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#170E32] via-[#201247] to-[#120926]" />

        {/* Forme vectorielle SVG de la vague fluide (courbe parabolique parfaite) */}
        <svg
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="none"
          viewBox="0 0 1200 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Dégradé coucher de soleil radiant (Orange / Ambre / Or) */}
            <radialGradient id="auraSunset" cx="50%" cy="50%" r="50%" fx="35%" fy="60%">
              <stop offset="0%" stopColor="#FFF4D0" stopOpacity="1" />
              <stop offset="25%" stopColor="#FFAE33" stopOpacity="0.98" />
              <stop offset="60%" stopColor="#FF6636" stopOpacity="0.92" />
              <stop offset="90%" stopColor="#C92A4B" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#241249" stopOpacity="0" />
            </radialGradient>

            {/* Vague Océanique / Cyan électrique à droite */}
            <radialGradient id="auraCyanWave" cx="95%" cy="30%" r="65%">
              <stop offset="0%" stopColor="#38E1FF" stopOpacity="0.95" />
              <stop offset="40%" stopColor="#0077FE" stopOpacity="0.88" />
              <stop offset="75%" stopColor="#1B2875" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#120926" stopOpacity="0" />
            </radialGradient>

            {/* Filtre de flou doux organique pour fondre les contours */}
            <filter id="auraBlur" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="25" />
            </filter>
          </defs>

          {/* Courbe fluide parabolique enveloppante */}
          <path
            d="M 420 0 C 470 65, 520 135, 620 200 L 1200 200 L 1200 0 Z"
            fill="url(#auraSunset)"
          />

          {/* Vague cyan et bleu roi sur le coin supérieur droit */}
          <path
            d="M 850 0 C 820 60, 890 140, 1020 200 L 1200 200 L 1200 0 Z"
            fill="url(#auraCyanWave)"
            opacity="0.92"
          />

          {/* Arc lumineux néon blanc ultra-fin qui traverse la courbe */}
          <path
            d="M 720 0 C 720 85, 780 155, 890 200"
            stroke="rgba(255, 255, 255, 0.45)"
            strokeWidth="1.5"
            strokeDasharray="4 2"
            fill="none"
          />
        </svg>

        {/* Lueur solaire diffuse au cœur de l'aura */}
        <div className="absolute top-1/2 left-[58%] -translate-x-1/2 -translate-y-1/2 w-[450px] h-[320px] bg-[radial-gradient(circle,_#FFF1C5_0%,_#FFAE33_45%,_transparent_75%)] opacity-85 blur-[45px] pointer-events-none" />

        {/* Lueur cyan / turquoise électrique au bord droit */}
        <div className="absolute -top-16 -right-16 w-[380px] h-[380px] bg-[radial-gradient(circle,_#38D9FF_0%,_#0072FF_55%,_transparent_75%)] opacity-75 blur-[55px] pointer-events-none" />

        {/* Fin voilage de verre pour adoucir la brillance */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.05] via-transparent to-black/[0.15] pointer-events-none" />
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
        {/* Capsules de statistiques en verre fumé translucide (flottant sur l'aura) */}
        {stats && stats.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            {stats.map((stat, i) => (
              <div
                key={i}
                className="bg-black/25 hover:bg-black/35 backdrop-blur-md border border-white/15 hover:border-white/30 rounded-2xl px-3.5 sm:px-4 py-2.5 text-center transition-all duration-300 shadow-md group cursor-default min-w-[85px] sm:min-w-[95px]"
              >
                <p className="text-[9px] text-white/70 font-black uppercase tracking-[0.15em] mb-0.5">
                  {stat.label}
                </p>
                <p
                  className={`text-lg sm:text-xl font-black leading-none ${
                    stat.color || 'text-white'
                  } group-hover:scale-105 inline-block transition-transform drop-shadow-xs`}
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
