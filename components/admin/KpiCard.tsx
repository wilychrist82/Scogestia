import type { LucideIcon } from 'lucide-react'

type Tone = 'emerald' | 'blue' | 'violet' | 'amber' | 'rose' | 'slate'

const TONES: Record<Tone, string> = {
  emerald: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  blue: 'bg-blue-50 text-blue-800 ring-blue-200',
  violet: 'bg-violet-50 text-violet-800 ring-violet-200',
  amber: 'bg-amber-50 text-amber-800 ring-amber-200',
  rose: 'bg-rose-50 text-rose-800 ring-rose-200',
  slate: 'bg-slate-100 text-slate-800 ring-slate-200',
}

type Props = {
  label: string
  value: string | number
  icon: LucideIcon
  tone?: Tone
  hint?: string
}

export function KpiCard({ label, value, icon: Icon, tone = 'emerald', hint }: Props) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.05)] transition-shadow hover:shadow-[0_6px_20px_-10px_rgba(15,23,42,0.18)]">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ${TONES[tone]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-[11px] font-bold uppercase tracking-wider text-slate-600">{label}</p>
        <p className="text-2xl font-extrabold leading-tight tabular-nums tracking-tight text-slate-900">{value}</p>
        {hint && <p className="truncate text-xs font-medium text-slate-600">{hint}</p>}
      </div>
    </div>
  )
}
