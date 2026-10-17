'use client'

import { useId, useMemo, useState } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, CartesianGrid, ReferenceLine, LabelList,
} from 'recharts'
import type { PaymentData, AttendanceData, ClassDistributionData } from './DashboardCharts'

const nf = new Intl.NumberFormat('fr-FR')

function compact(v: number) {
  if (v >= 1_000_000) {
    const m = v / 1_000_000
    return `${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1).replace('.', ',')} M`
  }
  if (v >= 1_000) return `${Math.round(v / 1_000)} k`
  return `${v}`
}

const AXIS_TICK = { fontSize: 11, fill: '#94a3b8', fontWeight: 600, fontFamily: 'var(--font-sans)' }

// ─────────────────────────────────────────────────────────────────────────────
// 1. COURBE DE RECOUVREMENT FLUIDE — données réelles uniquement
// ─────────────────────────────────────────────────────────────────────────────

function RecoveryTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const enc = Number(payload.find((p: any) => p.dataKey === 'encaisse')?.value || 0)
  const att = Number(payload.find((p: any) => p.dataKey === 'attendu')?.value || 0)
  const rate = att > 0 ? Math.min(100, Math.round((enc / att) * 100)) : enc > 0 ? 100 : 0
  return (
    <div className="min-w-[200px] rounded-2xl border border-white/10 bg-slate-950/90 p-3.5 text-xs shadow-[0_20px_40px_-12px_rgba(2,6,23,0.6)] backdrop-blur-xl">
      <div className="mb-2.5 flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/50">{label}</span>
        <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-black ${rate >= 70 ? 'bg-emerald-400/15 text-emerald-300' : rate >= 40 ? 'bg-amber-400/15 text-amber-300' : 'bg-rose-400/15 text-rose-300'}`}>
          {rate}%
        </span>
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-2 text-white/70"><span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]" />Encaissé</span>
          <span className="font-bold tabular-nums text-white">{nf.format(enc)} F</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-2 text-white/70"><span className="h-2 w-2 rounded-full bg-indigo-400 shadow-[0_0_10px_#818cf8]" />Attendu</span>
          <span className="font-bold tabular-nums text-white/80">{nf.format(att)} F</span>
        </div>
      </div>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-300 transition-all duration-500" style={{ width: `${rate}%` }} />
      </div>
    </div>
  )
}

export function FluidRecoveryChart({
  data,
  height = 290,
  currentMonth,
}: {
  data: PaymentData[]
  height?: number
  currentMonth?: string
}) {
  const [mode, setMode] = useState<'mensuel' | 'cumule'>('mensuel')
  const uid = useId().replace(/:/g, '')

  const chartData = useMemo(() => {
    if (mode === 'mensuel') return data
    let e = 0, a = 0
    return data.map(d => {
      e += d.encaisse
      a += d.attendu
      return { month: d.month, encaisse: e, attendu: a }
    })
  }, [data, mode])

  const hasData = data.some(d => d.encaisse > 0 || d.attendu > 0)

  return (
    <div className="w-full">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">
          <span className="flex items-center gap-1.5"><span className="h-[3px] w-4 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500" />Encaissé</span>
          <span className="flex items-center gap-1.5"><span className="h-[3px] w-4 rounded-full border-t-2 border-dashed border-indigo-400" />Attendu</span>
        </div>
        <div className="relative inline-flex rounded-xl border border-slate-200/80 bg-slate-100/80 p-0.5 text-[11px] font-bold">
          {(['mensuel', 'cumule'] as const).map(m => (
            <button
              key={m}
              type="button"
              id={`recovery-mode-${m}`}
              onClick={() => setMode(m)}
              className={`relative rounded-[10px] px-3 py-1.5 transition-all duration-300 ${mode === m ? 'bg-white text-slate-900 shadow-[0_1px_3px_rgba(15,23,42,0.12)]' : 'text-slate-500 hover:text-slate-800'}`}
            >
              {m === 'mensuel' ? 'Mensuel' : 'Cumulé'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ height }} className="relative w-full">
        {!hasData && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
            <div className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-2.5 text-center shadow-sm backdrop-blur">
              <p className="text-xs font-bold text-slate-800">Aucune donnée financière</p>
              <p className="text-[11px] text-slate-500">Générez des échéances pour suivre le recouvrement.</p>
            </div>
          </div>
        )}
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 18, right: 8, left: -6, bottom: 0 }}>
            <defs>
              <linearGradient id={`enc-fill-${uid}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.32} />
                <stop offset="60%" stopColor="#10b981" stopOpacity={0.06} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id={`enc-stroke-${uid}`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#34d399" />
                <stop offset="100%" stopColor="#0d9488" />
              </linearGradient>
              <linearGradient id={`att-fill-${uid}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.10} />
                <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="2 6" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={AXIS_TICK} dy={10} interval="preserveStartEnd" />
            <YAxis axisLine={false} tickLine={false} tick={AXIS_TICK} tickFormatter={compact} width={52} allowDecimals={false} />

            {currentMonth && (
              <ReferenceLine
                x={currentMonth}
                stroke="#0f172a"
                strokeOpacity={0.18}
                strokeDasharray="3 4"
                label={{ value: 'Auj.', position: 'top', fill: '#64748b', fontSize: 10, fontWeight: 700 }}
              />
            )}

            <Tooltip
              content={<RecoveryTooltip />}
              cursor={{ stroke: '#0f172a', strokeOpacity: 0.12, strokeWidth: 28 }}
              animationDuration={200}
            />

            <Area
              type="monotoneX"
              dataKey="attendu"
              name="Attendu"
              stroke="#818cf8"
              strokeWidth={2}
              strokeDasharray="6 5"
              fill={`url(#att-fill-${uid})`}
              dot={false}
              activeDot={{ r: 5, fill: '#fff', stroke: '#6366f1', strokeWidth: 2.5 }}
              animationDuration={1400}
              animationEasing="ease-out"
            />
            <Area
              type="monotoneX"
              dataKey="encaisse"
              name="Encaissé"
              stroke={`url(#enc-stroke-${uid})`}
              strokeWidth={3}
              strokeLinecap="round"
              fill={`url(#enc-fill-${uid})`}
              dot={false}
              activeDot={{ r: 6, fill: '#fff', stroke: '#10b981', strokeWidth: 3, style: { filter: 'drop-shadow(0 0 6px rgba(16,185,129,0.6))' } }}
              style={{ filter: 'drop-shadow(0 8px 12px rgba(16,185,129,0.22))' }}
              animationDuration={1600}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. ANNEAU DE PROGRESSION DÉGRADÉ
// ─────────────────────────────────────────────────────────────────────────────

export function GradientRing({
  percentage,
  size = 92,
  stroke = 9,
  label,
}: {
  percentage: number
  size?: number
  stroke?: number
  label?: string
}) {
  const uid = useId().replace(/:/g, '')
  const pct = Math.max(0, Math.min(100, percentage))
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c - (pct / 100) * c
  const [from, to] = pct >= 80 ? ['#34d399', '#059669'] : pct >= 50 ? ['#fbbf24', '#f59e0b'] : ['#fb7185', '#e11d48']

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={`ring-${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={from} />
            <stop offset="100%" stopColor={to} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#eef2f7" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          stroke={`url(#ring-${uid})`}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(0.16,1,0.3,1)', filter: `drop-shadow(0 0 6px ${from}66)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-black leading-none tracking-tight text-slate-900 tabular-nums">{pct}%</span>
        {label && <span className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-400">{label}</span>}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. BARRES CAPSULES — Effectif par classe
// ─────────────────────────────────────────────────────────────────────────────

const BAR_PALETTE = [
  ['#34d399', '#059669'],
  ['#60a5fa', '#2563eb'],
  ['#a78bfa', '#7c3aed'],
  ['#fbbf24', '#d97706'],
  ['#f472b6', '#db2777'],
  ['#22d3ee', '#0891b2'],
  ['#fb7185', '#e11d48'],
]

function BarTooltip({ active, payload, label, total }: any) {
  if (!active || !payload?.length) return null
  const v = Number(payload[0].value || 0)
  return (
    <div className="rounded-xl border border-white/10 bg-slate-950/90 px-3 py-2 text-xs shadow-xl backdrop-blur-xl">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/50">{label}</p>
      <p className="mt-0.5 font-black text-white">{v} élève{v > 1 ? 's' : ''} <span className="font-semibold text-white/50">· {total > 0 ? Math.round((v / total) * 100) : 0}%</span></p>
    </div>
  )
}

export function CapsuleBarChart({ data, height = 280 }: { data: ClassDistributionData[]; height?: number }) {
  const uid = useId().replace(/:/g, '')
  const filtered = data.filter(d => d.value > 0)
  const total = filtered.reduce((s, d) => s + d.value, 0)
  const [hover, setHover] = useState<number | null>(null)

  if (filtered.length === 0) {
    return (
      <div style={{ height }} className="flex flex-col items-center justify-center text-center">
        <p className="text-sm font-bold text-slate-800">Aucun élève inscrit</p>
        <p className="text-xs text-slate-500">Les effectifs par niveau apparaîtront ici.</p>
      </div>
    )
  }

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={filtered}
          margin={{ top: 22, right: 4, left: -22, bottom: 0 }}
          barCategoryGap="22%"
          onMouseMove={(s: any) => setHover(typeof s?.activeTooltipIndex === 'number' ? s.activeTooltipIndex : Number.isFinite(Number(s?.activeTooltipIndex)) ? Number(s.activeTooltipIndex) : null)}
          onMouseLeave={() => setHover(null)}
        >
          <defs>
            {BAR_PALETTE.map(([a, b], i) => (
              <linearGradient key={i} id={`cap-${uid}-${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={a} />
                <stop offset="100%" stopColor={b} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="2 6" vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ ...AXIS_TICK, fontSize: 10 }} dy={8} interval={0} />
          <YAxis axisLine={false} tickLine={false} tick={AXIS_TICK} allowDecimals={false} />
          <Tooltip content={<BarTooltip total={total} />} cursor={false} />
          <Bar
            dataKey="value"
            name="Élèves"
            radius={[10, 10, 10, 10]}
            maxBarSize={30}
            background={{ fill: '#f1f5f9', radius: 10 } as any}
            animationDuration={1300}
            animationEasing="ease-out"
          >
            {filtered.map((_, i) => (
              <Cell
                key={i}
                fill={`url(#cap-${uid}-${i % BAR_PALETTE.length})`}
                fillOpacity={hover === null || hover === i ? 1 : 0.35}
                style={{ transition: 'fill-opacity 0.3s ease' }}
              />
            ))}
            <LabelList dataKey="value" position="top" offset={8} style={{ fontSize: 11, fontWeight: 800, fill: '#334155' }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. DONUT INTERACTIF (présences & répartition)
// ─────────────────────────────────────────────────────────────────────────────

export function InteractiveDonut({
  data,
  centerLabel = 'total',
  size = 210,
  emptyLabel = 'Aucun relevé',
}: {
  data: (AttendanceData | ClassDistributionData)[]
  centerLabel?: string
  size?: number
  emptyLabel?: string
}) {
  const [active, setActive] = useState<number | null>(null)
  const total = data.reduce((s, d) => s + d.value, 0)
  const visible = data.filter(d => d.value > 0)
  const current = active !== null ? visible[active] : null
  const inner = Math.round(size * 0.33)
  const outer = Math.round(size * 0.44)

  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          {/* Piste de fond */}
          <Pie data={[{ value: 1 }]} dataKey="value" cx="50%" cy="50%" innerRadius={inner} outerRadius={outer} stroke="none" fill="#f1f5f9" isAnimationActive={false} />
          {total > 0 && (
            <Pie
              data={visible}
              dataKey="value"
              nameKey="name"
              cx="50%" cy="50%"
              innerRadius={inner}
              outerRadius={outer}
              paddingAngle={visible.length > 1 ? 3 : 0}
              cornerRadius={8}
              stroke="none"
              animationDuration={1200}
              animationEasing="ease-out"
              onMouseEnter={(_, i) => setActive(i)}
              onMouseLeave={() => setActive(null)}
            >
              {visible.map((d, i) => (
                <Cell
                  key={i}
                  fill={d.color}
                  fillOpacity={active === null || active === i ? 1 : 0.3}
                  style={{ transition: 'fill-opacity 0.3s ease', cursor: 'pointer', filter: active === i ? `drop-shadow(0 0 8px ${d.color}88)` : 'none', outline: 'none' }}
                />
              ))}
            </Pie>
          )}
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="flex flex-col items-center text-center">
          {total === 0 ? (
            <>
              <span className="text-2xl font-black text-slate-300">0</span>
              <span className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">{emptyLabel}</span>
            </>
          ) : current ? (
            <>
              <span className="text-[28px] font-black leading-none tracking-tight tabular-nums" style={{ color: current.color }}>{current.value}</span>
              <span className="mt-1 max-w-[90px] truncate text-[10px] font-bold uppercase tracking-wider text-slate-500">{current.name}</span>
              <span className="text-[10px] font-semibold text-slate-400">{Math.round((current.value / total) * 100)}%</span>
            </>
          ) : (
            <>
              <span className="text-[30px] font-black leading-none tracking-tight text-slate-900 tabular-nums">{total}</span>
              <span className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">{centerLabel}</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
