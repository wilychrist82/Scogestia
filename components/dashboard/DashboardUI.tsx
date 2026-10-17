import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import { ArrowUpRight } from 'lucide-react'
import { AnimatedCounter } from '@/components/ui/AnimatedCounter'

// ─────────────────────────────────────────────────────────────────────────────
// Palette de tons (classes littérales pour Tailwind v4)
// ─────────────────────────────────────────────────────────────────────────────
export type Tone = 'emerald' | 'blue' | 'indigo' | 'amber' | 'rose' | 'violet' | 'cyan' | 'slate'

const TONES: Record<Tone, { icon: string; glow: string; badge: string; bar: string; ring: string; text: string }> = {
  emerald: { icon: 'from-emerald-400 to-emerald-600 shadow-emerald-500/30', glow: 'bg-emerald-400', badge: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15', bar: 'from-emerald-400 to-teal-500', ring: 'hover:ring-emerald-500/25', text: 'text-emerald-600' },
  blue:    { icon: 'from-sky-400 to-blue-600 shadow-blue-500/30',          glow: 'bg-blue-400',    badge: 'bg-blue-50 text-blue-700 ring-blue-600/15',          bar: 'from-sky-400 to-blue-600',      ring: 'hover:ring-blue-500/25',    text: 'text-blue-600' },
  indigo:  { icon: 'from-indigo-400 to-indigo-600 shadow-indigo-500/30',   glow: 'bg-indigo-400',  badge: 'bg-indigo-50 text-indigo-700 ring-indigo-600/15',    bar: 'from-indigo-400 to-violet-600', ring: 'hover:ring-indigo-500/25',  text: 'text-indigo-600' },
  amber:   { icon: 'from-amber-300 to-orange-500 shadow-amber-500/30',     glow: 'bg-amber-400',   badge: 'bg-amber-50 text-amber-700 ring-amber-600/15',       bar: 'from-amber-300 to-orange-500',  ring: 'hover:ring-amber-500/25',   text: 'text-amber-600' },
  rose:    { icon: 'from-rose-400 to-rose-600 shadow-rose-500/30',         glow: 'bg-rose-400',    badge: 'bg-rose-50 text-rose-700 ring-rose-600/15',          bar: 'from-rose-400 to-pink-600',     ring: 'hover:ring-rose-500/25',    text: 'text-rose-600' },
  violet:  { icon: 'from-violet-400 to-purple-600 shadow-violet-500/30',   glow: 'bg-violet-400',  badge: 'bg-violet-50 text-violet-700 ring-violet-600/15',    bar: 'from-violet-400 to-purple-600', ring: 'hover:ring-violet-500/25',  text: 'text-violet-600' },
  cyan:    { icon: 'from-cyan-300 to-cyan-600 shadow-cyan-500/30',         glow: 'bg-cyan-400',    badge: 'bg-cyan-50 text-cyan-700 ring-cyan-600/15',          bar: 'from-cyan-300 to-sky-600',      ring: 'hover:ring-cyan-500/25',    text: 'text-cyan-600' },
  slate:   { icon: 'from-slate-500 to-slate-800 shadow-slate-500/30',      glow: 'bg-slate-400',   badge: 'bg-slate-100 text-slate-700 ring-slate-600/15',      bar: 'from-slate-400 to-slate-700',   ring: 'hover:ring-slate-500/25',   text: 'text-slate-700' },
}

export const toneOf = (t: Tone) => TONES[t]

// ─────────────────────────────────────────────────────────────────────────────
// HERO
// ─────────────────────────────────────────────────────────────────────────────
type HeroStat = { label: string; value: string | number; tone?: 'emerald' | 'rose' | 'amber' | 'cyan' | 'white' }

const HERO_TONE: Record<NonNullable<HeroStat['tone']>, string> = {
  emerald: 'text-emerald-300', rose: 'text-rose-300', amber: 'text-amber-300', cyan: 'text-cyan-300', white: 'text-white',
}

export function DashboardHero({
  schoolName, firstName, dateLabel, academicYear, recouvRate, stats, actions,
}: {
  schoolName: string
  firstName: string
  dateLabel: string
  academicYear: string
  recouvRate: number
  stats: HeroStat[]
  actions: React.ReactNode
}) {
  const size = 132, stroke = 10
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = Math.max(0, Math.min(100, recouvRate))

  return (
    <section className="dash-rise dash-grain relative isolate overflow-hidden rounded-[2rem] bg-[#050B18] text-white shadow-[0_30px_60px_-20px_rgba(5,11,24,0.55)] ring-1 ring-white/10" style={{ ['--d' as any]: 0 }}>
      {/* Aurores */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(120%_120%_at_0%_0%,#0B2A4A_0%,#050B18_55%)]" />
        <div className="dash-float absolute -left-24 -top-32 h-[380px] w-[380px] rounded-full bg-emerald-500/30 blur-[90px]" />
        <div className="dash-float-slow absolute -right-20 -top-24 h-[420px] w-[420px] rounded-full bg-sky-500/35 blur-[100px]" />
        <div className="dash-float absolute bottom-[-180px] left-1/3 h-[360px] w-[520px] rounded-full bg-indigo-600/30 blur-[110px]" />
        <div className="dash-dots absolute inset-0 [mask-image:radial-gradient(70%_80%_at_70%_40%,#000_10%,transparent_75%)]" />
        <svg className="absolute inset-0 h-full w-full opacity-40" viewBox="0 0 1200 300" preserveAspectRatio="none" fill="none">
          <path d="M0 230 C 220 170, 380 290, 620 210 S 1000 120, 1200 170" stroke="url(#heroLine)" strokeWidth="1.5" />
          <path d="M0 260 C 260 210, 420 300, 660 240 S 1020 170, 1200 210" stroke="url(#heroLine)" strokeWidth="1" strokeOpacity="0.5" />
          <defs>
            <linearGradient id="heroLine" x1="0" x2="1">
              <stop offset="0%" stopColor="#34d399" stopOpacity="0" />
              <stop offset="50%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
      </div>

      <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center lg:p-10">
        {/* Gauche */}
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 backdrop-blur-md">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/80">Tableau de bord · {academicYear}</span>
          </div>

          <h1 className="mt-4 text-[2rem] font-black leading-[1.05] tracking-[-0.03em] sm:text-5xl">
            <span className="bg-gradient-to-br from-white via-white to-white/60 bg-clip-text text-transparent">{schoolName}</span>
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/65 sm:text-[15px]">
            Bonjour <span className="font-semibold text-white">{firstName}</span>, voici le pouls de votre établissement —{' '}
            <span className="capitalize text-white/80">{dateLabel}</span>.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-2.5">{actions}</div>
        </div>

        {/* Droite : panneau verre */}
        <div className="relative w-full rounded-[1.5rem] border border-white/12 bg-white/[0.05] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-xl lg:w-[400px]">
          <div className="flex items-center gap-5">
            <div className="relative shrink-0" style={{ width: size, height: size }}>
              <svg width={size} height={size} className="-rotate-90">
                <defs>
                  <linearGradient id="heroRing" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#6ee7b7" />
                    <stop offset="100%" stopColor="#22d3ee" />
                  </linearGradient>
                </defs>
                <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} fill="none" />
                <circle
                  cx={size / 2} cy={size / 2} r={r} fill="none"
                  stroke="url(#heroRing)" strokeWidth={stroke} strokeLinecap="round"
                  strokeDasharray={c} strokeDashoffset={c - (pct / 100) * c}
                  style={{ filter: 'drop-shadow(0 0 10px rgba(52,211,153,0.55))', transition: 'stroke-dashoffset 1.6s cubic-bezier(0.16,1,0.3,1)' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black tracking-tight tabular-nums"><AnimatedCounter value={pct} className="font-black" />%</span>
                <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/50">Recouvré</span>
              </div>
            </div>
            <div className="grid min-w-0 flex-1 gap-2.5">
              {stats.map((s, i) => (
                <div key={i} className="flex items-center justify-between gap-3 border-b border-white/[0.07] pb-2 last:border-0 last:pb-0">
                  <span className="truncate text-[11px] font-semibold text-white/55">{s.label}</span>
                  <span className={`text-base font-black tabular-nums ${HERO_TONE[s.tone || 'white']}`}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// KPI CARD
// ─────────────────────────────────────────────────────────────────────────────
export function KpiCard({
  href, label, value, suffix, icon: Icon, tone, badge, progress, delay = 1,
}: {
  href: string
  label: string
  value: number
  suffix?: string
  icon: LucideIcon
  tone: Tone
  badge: string
  progress?: number
  delay?: number
}) {
  const t = TONES[tone]
  return (
    <Link
      href={href}
      id={`kpi-${label.toLowerCase().replace(/[^a-z]+/g, '-')}`}
      className={`dash-rise dash-card group relative flex flex-col justify-between gap-4 overflow-hidden p-5 ring-1 ring-transparent hover:-translate-y-1 ${t.ring}`}
      style={{ ['--d' as any]: delay }}
    >
      <div aria-hidden className={`pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full ${t.glow} opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-25`} />

      <div className="flex items-start justify-between">
        <span className="text-[12px] font-semibold tracking-tight text-slate-500">{label}</span>
        <div className={`flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg ${t.icon} transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110`}>
          <Icon size={18} strokeWidth={2.2} />
        </div>
      </div>

      <div>
        <p className="text-[32px] font-black leading-none tracking-[-0.03em] text-slate-900 tabular-nums">
          <AnimatedCounter value={value} suffix={suffix} className="font-black" />
        </p>
        <div className="mt-3 flex items-center justify-between gap-2">
          <span className={`inline-flex max-w-full items-center truncate rounded-lg px-2 py-0.5 text-[10.5px] font-bold ring-1 ring-inset ${t.badge}`}>{badge}</span>
          <ArrowUpRight size={15} className="shrink-0 text-slate-300 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-slate-700" />
        </div>
        {typeof progress === 'number' && (
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div className={`dash-bar-grow h-full rounded-full bg-gradient-to-r ${t.bar}`} style={{ width: `${Math.max(0, Math.min(100, progress))}%` }} />
          </div>
        )}
      </div>
    </Link>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PANEL
// ─────────────────────────────────────────────────────────────────────────────
export function DashPanel({
  title, subtitle, icon: Icon, tone = 'slate', action, live, delay = 0, className = '', bodyClassName = 'p-5 sm:p-6', children,
}: {
  title: string
  subtitle?: React.ReactNode
  icon?: LucideIcon
  tone?: Tone
  action?: { href: string; label: string }
  live?: 'rose' | 'amber' | 'emerald'
  delay?: number
  className?: string
  bodyClassName?: string
  children: React.ReactNode
}) {
  const t = TONES[tone]
  const liveColor = live === 'rose' ? 'bg-rose-500' : live === 'amber' ? 'bg-amber-500' : 'bg-emerald-500'
  const livePing = live === 'rose' ? 'bg-rose-400' : live === 'amber' ? 'bg-amber-400' : 'bg-emerald-400'

  return (
    <section className={`dash-rise dash-card flex flex-col overflow-hidden ${className}`} style={{ ['--d' as any]: delay }}>
      <header className="flex items-center justify-between gap-3 px-5 pb-1 pt-5 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          {Icon && (
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md ${t.icon}`}>
              <Icon size={16} strokeWidth={2.3} />
            </div>
          )}
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 text-[15px] font-extrabold tracking-tight text-slate-900">
              {live && (
                <span className="relative flex h-2 w-2">
                  <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-70 ${livePing}`} />
                  <span className={`relative inline-flex h-2 w-2 rounded-full ${liveColor}`} />
                </span>
              )}
              {title}
            </h2>
            {subtitle && <p className="mt-0.5 truncate text-xs font-medium text-slate-500">{subtitle}</p>}
          </div>
        </div>
        {action && (
          <Link
            href={action.href}
            className="group/a inline-flex shrink-0 items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-700 shadow-[0_1px_2px_rgba(15,23,42,0.05)] transition-all duration-300 hover:border-slate-900 hover:bg-slate-900 hover:text-white"
          >
            {action.label}
            <ArrowUpRight size={12} className="transition-transform duration-300 group-hover/a:-translate-y-0.5 group-hover/a:translate-x-0.5" />
          </Link>
        )}
      </header>
      <div className={`flex-1 ${bodyClassName}`}>{children}</div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// EMPTY STATE
// ─────────────────────────────────────────────────────────────────────────────
export function EmptyState({ icon: Icon, title, text, tone = 'slate' }: { icon: LucideIcon; title: string; text: string; tone?: Tone }) {
  const t = TONES[tone]
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-9 text-center">
      <div className="relative mb-3">
        <div className={`absolute inset-0 rounded-2xl ${t.glow} opacity-20 blur-xl`} />
        <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
          <Icon className={`h-5 w-5 ${t.text}`} />
        </div>
      </div>
      <p className="text-sm font-bold text-slate-800">{title}</p>
      <p className="mt-1 max-w-[260px] text-xs text-slate-500">{text}</p>
    </div>
  )
}
