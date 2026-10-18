'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import Link from 'next/link'
import {
  Banknote,
  TrendingUp,
  Hourglass,
  AlertTriangle,
  ArrowRight,
  PlusCircle,
  Receipt,
  Smartphone,
  Building,
  Wallet,
  BellRing,
  ArrowUpRight,
  FileText,
  Download,
  CalendarDays,
  Activity,
} from 'lucide-react'
import { FinanceNavTabs } from './FinanceNavTabs'
import { generatePaymentReceipt } from '@/lib/pdf/receipt'

export type Schedule = {
  id?: string
  amount_due: number
  status: string
  due_date: string
  label?: string
  payments?: { amount: number }[] | null
}

export type Payment = {
  id?: string
  amount: number
  paid_at: string
  payment_method?: string | null
  transaction_reference?: string | null
  receipt_number?: string | null
  schedule?: { label?: string } | null
  student?: {
    id?: string
    first_name?: string
    last_name?: string
    matricule?: string
    classes?: { name?: string } | null
  } | null
}

export type FeeType = {
  id: string
  label: string
  amount: number
  periodicity: string
  target: string
}

type Props = {
  schedules: Schedule[]
  payments: Payment[]
  feeTypes?: FeeType[]
  schoolName?: string
  schoolCity?: string
  academicYear?: string
  basePath?: string
}

const MONTHS = ['Janv', 'Févr', 'Mars', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc']

const METHOD_LABELS: Record<string, string> = {
  especes: 'Espèces',
  tmoney: 'T-Money',
  flooz: 'Flooz',
  wave: 'Wave',
  banque: 'Virement',
  autre: 'Autre',
}

const AVATAR_TONES = [
  'bg-emerald-100 text-emerald-900 ring-emerald-300',
  'bg-sky-100 text-sky-900 ring-sky-300',
  'bg-violet-100 text-violet-900 ring-violet-300',
  'bg-amber-100 text-amber-900 ring-amber-300',
  'bg-rose-100 text-rose-900 ring-rose-300',
  'bg-teal-100 text-teal-900 ring-teal-300',
]

const avatarTone = (seed: string) => {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return AVATAR_TONES[h % AVATAR_TONES.length]
}

const formatCFA = (amount: number) =>
  `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(amount)} FCFA`

const compact = (val: number) => {
  if (val >= 1_000_000) return `${+(val / 1_000_000).toFixed(1)}M`
  if (val >= 1_000) return `${Math.round(val / 1_000)}k`
  return String(val)
}

function GlassTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="min-w-[180px] rounded-xl border border-white/10 bg-slate-900/85 p-3 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.5)] backdrop-blur-xl">
      <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-200">{label}</p>
      <div className="space-y-1.5">
        {payload.map((entry: any) => (
          <div key={entry.dataKey} className="flex items-center justify-between gap-4 text-xs">
            <span className="inline-flex items-center gap-2 font-semibold text-slate-100">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.dataKey === 'encaisse' ? '#34d399' : '#cbd5e1' }} />
              {entry.name}
            </span>
            <span className="font-bold tabular-nums text-white">{formatCFA(Number(entry.value))}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

type KpiProps = {
  label: string
  value: string
  icon: React.ComponentType<{ size?: number }>
  tone: { chip: string; value: string; glow: string }
  pills: { text: string; className: string; icon?: React.ReactNode }[]
  linkHref: string
  linkLabel: string
}

function KpiCard({ label, value, icon: Icon, tone, pills, linkHref, linkLabel }: KpiProps) {
  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.06),0_10px_30px_-18px_rgba(15,23,42,0.18)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_1px_2px_rgba(15,23,42,0.08),0_18px_40px_-18px_rgba(15,23,42,0.28)]">
      <div aria-hidden className={`pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full blur-3xl opacity-60 transition-opacity group-hover:opacity-100 ${tone.glow}`} />
      <div className="relative flex items-center justify-between">
        <span className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-800">{label}</span>
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ring-1 ring-inset ${tone.chip}`}>
          <Icon size={17} />
        </div>
      </div>
      <p className={`relative mt-4 mb-1 text-[1.75rem] font-extrabold leading-tight tracking-[-0.03em] tabular-nums xl:text-3xl ${tone.value}`}>
        {value}
      </p>
      <div className="relative mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {pills.map((p) => (
            <span key={p.text} className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ring-1 ring-inset ${p.className}`}>
              {p.icon}
              {p.text}
            </span>
          ))}
        </div>
        <Link href={linkHref} className="text-xs font-bold text-slate-900 underline-offset-4 hover:text-emerald-800 hover:underline">
          {linkLabel} →
        </Link>
      </div>
    </div>
  )
}

export function FinanceDashboard({
  schedules,
  payments,
  feeTypes = [],
  schoolName = 'Établissement',
  schoolCity = '',
  academicYear = '2026-2027',
  basePath = '/admin/finance',
}: Props) {
  // ── 1. CALCULS CONSOLIDÉS & RÈGLES COMPTABLES ──
  const stats = useMemo(() => {
    const attendu = schedules.reduce((acc, s) => acc + Number(s.amount_due || 0), 0)
    const encaisse = payments.reduce((acc, p) => acc + Number(p.amount || 0), 0)
    const reste = Math.max(0, attendu - encaisse)
    const taux = attendu > 0 ? Math.min(100, Math.round((encaisse / attendu) * 100)) : 0

    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`

    const paiementsDuJourList = payments.filter(
      p => p.paid_at && new Date(p.paid_at).toDateString() === now.toDateString()
    )
    const paiementsDuJour = paiementsDuJourList.reduce((acc, p) => acc + Number(p.amount || 0), 0)

    // Impayés échus
    const overdueList = schedules.filter(s => s.status !== 'paye' && s.due_date < today)
    const impayes = overdueList.reduce((acc, s) => {
      const paid = (s.payments || []).reduce((a, p) => a + Number(p.amount || 0), 0)
      return acc + Math.max(0, Number(s.amount_due || 0) - paid)
    }, 0)
    const overdueCount = overdueList.length

    // Échéances en cours
    const pendingList = schedules.filter(s => s.status !== 'paye' && s.due_date >= today)
    const pendingCount = pendingList.length

    return {
      attendu,
      encaisse,
      reste,
      taux,
      paiementsDuJour,
      impayes,
      overdueCount,
      pendingCount,
      today,
    }
  }, [schedules, payments])

  // ── 2. DONNÉES MENSUELLES (CALENDRIER SCOLAIRE SEPTEMBRE → AOÛT) ──
  const chartData = useMemo(() => {
    const attendu: Record<number, number> = {}
    const encaisse: Record<number, number> = {}

    schedules.forEach(s => {
      if (!s.due_date) return
      const m = new Date(s.due_date).getMonth()
      attendu[m] = (attendu[m] || 0) + Number(s.amount_due || 0)
    })

    payments.forEach(p => {
      if (!p.paid_at) return
      const m = new Date(p.paid_at).getMonth()
      encaisse[m] = (encaisse[m] || 0) + Number(p.amount || 0)
    })

    const order = [8, 9, 10, 11, 0, 1, 2, 3, 4, 5, 6, 7]
    return order.map(i => ({
      name: MONTHS[i],
      attendu: attendu[i] || 0,
      encaisse: encaisse[i] || 0,
    }))
  }, [schedules, payments])

  const [chartType, setChartType] = useState<'area' | 'bar'>('area')

  const [ringReady, setRingReady] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setRingReady(true), 120)
    return () => clearTimeout(t)
  }, [])

  const RING_R = 54
  const RING_C = 2 * Math.PI * RING_R

  const handleReceipt = (p: Payment, idx: number) => {
    const rawMethod = p.payment_method || 'especes'
    generatePaymentReceipt({
      schoolName,
      schoolCity,
      studentName: `${p.student?.first_name || ''} ${p.student?.last_name || ''}`.trim(),
      studentClass: p.student?.classes?.name || 'Non assigné',
      paymentMethod: METHOD_LABELS[rawMethod] ?? rawMethod,
      amount: Number(p.amount),
      date: new Date(p.paid_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }),
      reference:
        p.transaction_reference ||
        p.receipt_number ||
        `REC-${(p.id || String(idx)).substring(0, 8).toUpperCase()}`,
    })
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 px-1 pb-12">

      {/* ── BARRE DE NAVIGATION D'ONGLETS FINANCE ── */}
      <FinanceNavTabs basePath={basePath} />

      {/* ── HERO FINANCIER EXÉCUTIF ── */}
      <section className="relative overflow-hidden rounded-3xl bg-[#050B18] p-6 shadow-[0_30px_80px_-30px_rgba(5,11,24,0.8)] ring-1 ring-white/10 sm:p-8 lg:p-10">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -left-20 -top-32 h-[420px] w-[520px] rounded-full bg-emerald-500/20 blur-[120px]" />
          <div className="absolute -bottom-40 right-0 h-[380px] w-[480px] rounded-full bg-cyan-400/10 blur-[130px]" />
          <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_at_left,black_20%,transparent_75%)]" />
        </div>

        <div className="relative flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/[0.06] px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-200 ring-1 ring-white/15 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]">
              <CalendarDays size={13} />
              Année scolaire {academicYear}
            </span>
            <h1 className="mt-5 text-3xl font-extrabold leading-[1.05] tracking-[-0.03em] text-white sm:text-4xl lg:text-5xl">
              Tableau de bord financier
            </h1>
            <p className="mt-2 text-lg font-bold text-emerald-300">{schoolName}</p>
            <p className="mt-3 max-w-xl text-sm font-medium leading-relaxed text-slate-200 sm:text-base">
              Pilotez la trésorerie de votre école en toute clarté : encaissements, échéances et relances en temps réel.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href={`${basePath}/caisse`}
                className="group inline-flex h-12 items-center gap-2.5 rounded-xl bg-emerald-500 px-5 text-sm font-extrabold text-[#04210f] shadow-[0_10px_30px_-8px_rgba(16,185,129,0.7),inset_0_1px_0_rgba(255,255,255,0.35)] transition-all hover:-translate-y-0.5 hover:bg-emerald-400"
              >
                <Banknote size={18} />
                Ouvrir la Caisse
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href={`${basePath}/impayes`}
                className="inline-flex h-12 items-center gap-2.5 rounded-xl bg-white/[0.06] px-5 text-sm font-bold text-white ring-1 ring-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)] transition-all hover:bg-white/[0.12]"
              >
                <BellRing size={17} className="text-rose-300" />
                Gérer les Impayés
                {stats.overdueCount > 0 && (
                  <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[11px] font-extrabold tabular-nums text-white">{stats.overdueCount}</span>
                )}
              </Link>
            </div>
          </div>

          <div className="flex flex-col items-center gap-6 sm:flex-row lg:gap-8">
            <div className="relative h-44 w-44 shrink-0">
              <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90" role="img" aria-label={`Taux de recouvrement global : ${stats.taux}%`}>
                <defs>
                  <linearGradient id="ringGradient" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#34d399" />
                    <stop offset="100%" stopColor="#38bdf8" />
                  </linearGradient>
                </defs>
                <circle cx="70" cy="70" r={RING_R} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="12" />
                <circle
                  cx="70"
                  cy="70"
                  r={RING_R}
                  fill="none"
                  stroke="url(#ringGradient)"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={RING_C}
                  strokeDashoffset={RING_C * (1 - (ringReady ? stats.taux : 0) / 100)}
                  className="transition-[stroke-dashoffset] duration-[1400ms] ease-out"
                  style={{ filter: 'drop-shadow(0 0 8px rgba(52,211,153,0.7))' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-extrabold tabular-nums tracking-tight text-white">{stats.taux}<span className="text-xl text-emerald-300">%</span></span>
                <span className="mt-0.5 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-200">Recouvré</span>
              </div>
            </div>

            <dl className="grid w-full grid-cols-3 gap-2 sm:w-auto sm:grid-cols-1 sm:gap-2.5">
              {[
                { label: 'Encaissé', value: compact(stats.encaisse), cls: 'text-emerald-300' },
                { label: 'Reste', value: compact(stats.reste), cls: 'text-amber-300' },
                { label: 'Impayés', value: compact(stats.impayes), cls: 'text-rose-300' },
              ].map((s) => (
                <div key={s.label} className="flex items-center justify-between gap-6 rounded-xl bg-white/[0.05] px-4 py-2.5 ring-1 ring-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)] max-sm:flex-col max-sm:items-start max-sm:gap-0.5 max-sm:px-3">
                  <dt className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-200">{s.label}</dt>
                  <dd className={`text-lg font-extrabold tabular-nums ${s.cls}`}>{s.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* ── 4 CARTES KPI ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Total Attendu"
          value={formatCFA(stats.attendu)}
          icon={Wallet}
          tone={{ chip: 'bg-sky-50 text-sky-800 ring-sky-300', value: 'text-slate-900', glow: 'bg-sky-300/40' }}
          pills={[{ text: `Année ${academicYear}`, className: 'bg-sky-50 text-sky-900 ring-sky-300' }]}
          linkHref={`${basePath}/echeances`}
          linkLabel="Gérer"
        />
        <KpiCard
          label="Encaissé Réel"
          value={formatCFA(stats.encaisse)}
          icon={TrendingUp}
          tone={{ chip: 'bg-emerald-50 text-emerald-800 ring-emerald-300', value: 'text-emerald-800', glow: 'bg-emerald-300/40' }}
          pills={[{ text: `${stats.taux}% recouvré`, className: 'bg-emerald-50 text-emerald-900 ring-emerald-300', icon: <ArrowUpRight size={12} /> }]}
          linkHref={`${basePath}/paiements`}
          linkLabel="Détails"
        />
        <KpiCard
          label="Reste à Recouvrer"
          value={formatCFA(stats.reste)}
          icon={Hourglass}
          tone={{ chip: 'bg-amber-50 text-amber-900 ring-amber-300', value: 'text-slate-900', glow: 'bg-amber-300/40' }}
          pills={[
            { text: `${stats.pendingCount} en attente`, className: 'bg-amber-50 text-amber-900 ring-amber-300' },
            ...(stats.overdueCount > 0
              ? [{ text: `${stats.overdueCount} en retard · ${compact(stats.impayes)} F`, className: 'bg-rose-50 text-rose-900 ring-rose-300', icon: <AlertTriangle size={12} /> }]
              : []),
          ]}
          linkHref={`${basePath}/impayes`}
          linkLabel="Relancer"
        />
        <KpiCard
          label="Caisse du Jour"
          value={formatCFA(stats.paiementsDuJour)}
          icon={Banknote}
          tone={{ chip: 'bg-emerald-50 text-emerald-800 ring-emerald-300', value: 'text-slate-900', glow: 'bg-emerald-300/40' }}
          pills={[{ text: "Aujourd'hui", className: 'bg-emerald-50 text-emerald-900 ring-emerald-300', icon: <Activity size={12} /> }]}
          linkHref={`${basePath}/caisse`}
          linkLabel="Encaisser"
        />
      </div>

      {/* ── FLUX DE TRÉSORERIE & OPÉRATIONS RAPIDES ── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">

        <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.06),0_10px_30px_-18px_rgba(15,23,42,0.18)] sm:p-6 lg:col-span-8">
          <div className="mb-5 flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-extrabold tracking-tight text-slate-900">Flux de trésorerie</h3>
              <p className="mt-0.5 text-sm font-medium text-slate-700">Comparatif mensuel des flux attendus et encaissés</p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 text-xs font-bold text-slate-800">
                <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-slate-400" />Attendu</span>
                <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />Encaissé</span>
              </div>

              <div role="radiogroup" aria-label="Type de graphique" className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 ring-1 ring-inset ring-slate-200">
                {(['area', 'bar'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    role="radio"
                    aria-checked={chartType === type}
                    onClick={() => setChartType(type)}
                    className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
                      chartType === type
                        ? 'bg-white text-emerald-800 shadow-[0_1px_3px_rgba(15,23,42,0.2)] ring-1 ring-emerald-600'
                        : 'text-slate-800 hover:bg-white/70'
                    }`}
                  >
                    {type === 'area' ? 'Courbe' : 'Barres'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="h-[300px] w-full">
            {chartData.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <p className="text-sm font-semibold text-slate-700">Aucune donnée mensuelle disponible</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'area' ? (
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="emeraldFlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#059669" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#059669" stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="slateFlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#94A3B8" stopOpacity={0.22} />
                        <stop offset="100%" stopColor="#94A3B8" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="2 6" vertical={false} stroke="#cbd5e1" strokeOpacity={0.7} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#334155', fontSize: 12, fontWeight: 600 }} dy={8} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#334155', fontSize: 12, fontWeight: 600 }} tickFormatter={compact} />
                    <Tooltip content={<GlassTooltip />} cursor={{ stroke: '#0f172a', strokeOpacity: 0.15, strokeDasharray: '4 4' }} />
                    <Area type="monotone" dataKey="attendu" name="Attendu" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 4" fill="url(#slateFlow)" />
                    <Area type="monotone" dataKey="encaisse" name="Encaissé" stroke="#059669" strokeWidth={3} fill="url(#emeraldFlow)" activeDot={{ r: 5, fill: '#059669', stroke: '#fff', strokeWidth: 2 }} />
                  </AreaChart>
                ) : (
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="2 6" vertical={false} stroke="#cbd5e1" strokeOpacity={0.7} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#334155', fontSize: 12, fontWeight: 600 }} dy={8} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#334155', fontSize: 12, fontWeight: 600 }} tickFormatter={compact} />
                    <Tooltip content={<GlassTooltip />} cursor={{ fill: '#0f172a', fillOpacity: 0.05 }} />
                    <Bar dataKey="attendu" name="Attendu" fill="#cbd5e1" radius={[6, 6, 0, 0]} barSize={14} />
                    <Bar dataKey="encaisse" name="Encaissé" fill="#059669" radius={[6, 6, 0, 0]} barSize={14} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.06),0_10px_30px_-18px_rgba(15,23,42,0.18)] sm:p-6 lg:col-span-4">
          <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-base font-extrabold tracking-tight text-slate-900">Opérations rapides</h3>
              <p className="mt-0.5 text-sm font-medium text-slate-700">Accès immédiat</p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-extrabold text-emerald-900 ring-1 ring-inset ring-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
              Guichet ouvert
            </span>
          </div>

          <div className="my-auto space-y-3">
            <Link href={`${basePath}/caisse`} className="group flex items-center justify-between rounded-xl border border-slate-200 p-3.5 transition-all hover:border-emerald-600 hover:bg-emerald-50/60">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-300 transition-colors group-hover:bg-emerald-700 group-hover:text-white">
                  <Banknote size={18} />
                </div>
                <div>
                  <p className="text-sm font-extrabold text-slate-900">Encaisser un élève</p>
                  <p className="text-xs font-medium text-slate-700">Versement et reçu</p>
                </div>
              </div>
              <ArrowRight size={16} className="text-slate-700 transition-transform group-hover:translate-x-0.5" />
            </Link>

            <Link href={`${basePath}/paiements`} className="group flex items-center justify-between rounded-xl border border-slate-200 p-3.5 transition-all hover:border-slate-900 hover:bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-900 ring-1 ring-inset ring-slate-300 transition-colors group-hover:bg-slate-900 group-hover:text-white">
                  <Receipt size={18} />
                </div>
                <div>
                  <p className="text-sm font-extrabold text-slate-900">Journal des paiements</p>
                  <p className="text-xs font-medium text-slate-700">Transactions et reçus</p>
                </div>
              </div>
              <ArrowRight size={16} className="text-slate-700 transition-transform group-hover:translate-x-0.5" />
            </Link>

            <Link href={`${basePath}/impayes`} className="group flex items-center justify-between rounded-xl border border-slate-200 p-3.5 transition-all hover:border-rose-600 hover:bg-rose-50/60">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-800 ring-1 ring-inset ring-rose-300 transition-colors group-hover:bg-rose-700 group-hover:text-white">
                  <BellRing size={18} />
                </div>
                <div>
                  <p className="text-sm font-extrabold text-slate-900">Relances des impayés</p>
                  <p className="text-xs font-medium text-slate-700">{stats.overdueCount} dossier(s) à relancer</p>
                </div>
              </div>
              <ArrowRight size={16} className="text-slate-700 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4 text-sm font-semibold text-slate-800">
            <span>Encaissé aujourd&apos;hui</span>
            <span className="font-extrabold tabular-nums text-emerald-800">{formatCFA(stats.paiementsDuJour)}</span>
          </div>
        </div>

      </div>

      {/* ── FLUX DES DERNIERS PAIEMENTS ── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.06),0_10px_30px_-18px_rgba(15,23,42,0.18)]">
        <div className="flex flex-col justify-between gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:p-6">
          <div>
            <h3 className="flex items-center gap-2.5 text-base font-extrabold tracking-tight text-slate-900">
              Derniers versements
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wide text-emerald-900 ring-1 ring-inset ring-emerald-300">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-600" />
                </span>
                En direct
              </span>
            </h3>
            <p className="mt-0.5 text-sm font-medium text-slate-700">Journal des paiements reçus</p>
          </div>

          <Link
            href={`${basePath}/paiements`}
            className="inline-flex items-center gap-1.5 self-start rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-900 transition-colors hover:border-emerald-600 hover:text-emerald-800 sm:self-auto"
          >
            <span>Voir tout le journal</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="overflow-x-auto">
          {payments.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-14 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-800 ring-1 ring-inset ring-slate-300">
                <Banknote size={22} />
              </div>
              <p className="text-sm font-extrabold text-slate-900">Aucun encaissement pour le moment</p>
              <p className="mt-1 max-w-sm text-sm font-medium text-slate-700">
                Enregistrez un premier versement au guichet pour alimenter le journal de caisse.
              </p>
              <Link
                href={`${basePath}/caisse`}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-emerald-800"
              >
                <PlusCircle size={14} />
                <span>Encaisser un versement</span>
              </Link>
            </div>
          ) : (
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-800">
                  <th className="px-5 py-3.5 sm:px-6">Élève</th>
                  <th className="px-5 py-3.5">Échéance</th>
                  <th className="px-5 py-3.5">Mode</th>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5 text-right">Montant net</th>
                  <th className="px-5 py-3.5 text-right sm:px-6">Reçu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {payments.slice(0, 6).map((p, idx) => {
                  const studentName = p.student
                    ? `${p.student.last_name || ''} ${p.student.first_name || ''}`.trim()
                    : 'Élève non renseigné'
                  const className = (p.student as any)?.classes?.name || 'Classe non assignée'
                  const initials = p.student?.last_name
                    ? `${p.student.last_name.charAt(0)}${p.student.first_name?.charAt(0) || ''}`
                    : 'EC'
                  const method = (p.payment_method || 'espèces').toLowerCase()
                  const isMobile = ['mobile', 'momo', 'wave', 'tmoney', 'flooz'].some(k => method.includes(k))
                  const isTransfer = method.includes('virement') || method.includes('banque')
                  const isCheque = method.includes('cheque') || method.includes('chèque')
                  const methodText = isMobile ? 'Mobile Money' : isTransfer ? 'Virement' : isCheque ? 'Chèque' : 'Espèces'
                  const methodTone = isMobile
                    ? 'bg-sky-50 text-sky-900 ring-sky-300'
                    : isTransfer
                      ? 'bg-violet-50 text-violet-900 ring-violet-300'
                      : isCheque
                        ? 'bg-amber-50 text-amber-900 ring-amber-300'
                        : 'bg-emerald-50 text-emerald-900 ring-emerald-300'
                  const dateFormatted = p.paid_at
                    ? new Date(p.paid_at).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })
                    : '—'

                  return (
                    <tr key={p.id || idx} className="transition-colors hover:bg-slate-50">
                      <td className="px-5 py-3.5 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-extrabold ring-1 ring-inset ${avatarTone(p.student?.id || studentName)}`}>
                            {initials.toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-extrabold text-slate-900">{studentName}</p>
                            <span className="mt-0.5 inline-flex rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-bold text-slate-800 ring-1 ring-inset ring-slate-300">{className}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-slate-900">
                        {p.schedule?.label || 'Frais scolaires'}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset ${methodTone}`}>
                          {isMobile ? <Smartphone size={12} /> : isTransfer ? <Building size={12} /> : isCheque ? <FileText size={12} /> : <Banknote size={12} />}
                          {methodText}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 font-semibold text-slate-800">
                        {dateFormatted}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-right text-base font-extrabold tabular-nums tracking-tight text-emerald-800">
                        +{formatCFA(p.amount)}
                      </td>
                      <td className="px-5 py-3.5 text-right sm:px-6">
                        <button
                          type="button"
                          onClick={() => handleReceipt(p, idx)}
                          title="Télécharger le reçu"
                          aria-label={`Télécharger le reçu de ${studentName}`}
                          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-xs font-bold text-slate-900 transition-all hover:border-emerald-600 hover:bg-emerald-50 hover:text-emerald-900"
                        >
                          <Download size={14} />
                          <span className="hidden md:inline">Reçu</span>
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

    </div>
  )
}
