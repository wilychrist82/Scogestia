'use client'

import { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import Link from 'next/link'
import { Banknote, CalendarPlus, BellRing, Wallet, TrendingUp, Hourglass, AlertTriangle, ArrowRight } from 'lucide-react'

type Schedule = {
  amount_due: number
  status: string
  due_date: string
  payments?: { amount: number }[] | null
}

type Payment = {
  amount: number
  paid_at: string
}

type Props = {
  schedules: Schedule[]
  payments: Payment[]
}

const MONTHS = ['Janv', 'Févr', 'Mars', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc']

const formatCFA = (amount: number) =>
  `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(amount)} FCFA`

const compact = (val: number) => {
  if (val >= 1_000_000) return `${+(val / 1_000_000).toFixed(1)} M`
  if (val >= 1_000) return `${Math.round(val / 1_000)} k`
  return String(val)
}

export function FinanceDashboard({ schedules, payments, basePath = '/admin/finance' }: Props & { basePath?: string }) {
  const stats = useMemo(() => {
    const attendu = schedules.reduce((acc, s) => acc + Number(s.amount_due || 0), 0)
    const encaisse = payments.reduce((acc, p) => acc + Number(p.amount || 0), 0)
    const reste = Math.max(0, attendu - encaisse)
    // Plafonné à 100 % : un trop-perçu ne doit pas produire un taux aberrant
    const taux = attendu > 0 ? Math.min(100, Math.round((encaisse / attendu) * 100)) : 0

    // Date locale (et non UTC) pour ne pas décaler « aujourd'hui »
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`

    const paiementsDuJour = payments
      .filter(p => p.paid_at && new Date(p.paid_at).toDateString() === now.toDateString())
      .reduce((acc, p) => acc + Number(p.amount || 0), 0)

    // Impayés = reste dû (échéance − paiements reçus) des échéances dépassées non soldées
    const impayes = schedules
      .filter(s => s.status !== 'paye' && s.due_date < today)
      .reduce((acc, s) => {
        const paid = (s.payments || []).reduce((a, p) => a + Number(p.amount || 0), 0)
        return acc + Math.max(0, Number(s.amount_due || 0) - paid)
      }, 0)

    return { attendu, encaisse, reste, taux, paiementsDuJour, impayes, today }
  }, [schedules, payments])

  // Données réelles uniquement : attendu = échéances par mois, encaissé = paiements par mois
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
    // Calendrier scolaire : septembre → août
    const order = [8, 9, 10, 11, 0, 1, 2, 3, 4, 5, 6, 7]
    return order
      .map(i => ({ name: MONTHS[i], attendu: attendu[i] || 0, encaisse: encaisse[i] || 0 }))
      .filter(d => d.attendu > 0 || d.encaisse > 0)
  }, [schedules, payments])

  const kpis = [
    { label: 'Total attendu', value: formatCFA(stats.attendu), icon: Wallet, tint: 'bg-slate-100 text-slate-600 border-slate-200', valueCls: 'text-slate-900' },
    { label: 'Total encaissé', value: formatCFA(stats.encaisse), icon: TrendingUp, tint: 'bg-emerald-50 text-emerald-700 border-emerald-100', valueCls: 'text-emerald-700', hint: `${stats.taux}% de recouvrement` },
    { label: 'Reste à recouvrer', value: formatCFA(stats.reste), icon: Hourglass, tint: 'bg-amber-50 text-amber-700 border-amber-100', valueCls: 'text-slate-900' },
    { label: 'Impayés en retard', value: formatCFA(stats.impayes), icon: AlertTriangle, tint: 'bg-rose-50 text-rose-700 border-rose-100', valueCls: 'text-rose-600' },
  ]

  return (
    <div className="max-w-[1280px] mx-auto space-y-6 pb-8">

      {/* En-tête de page */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Vue d&apos;ensemble financière</h1>
          <p className="text-sm text-slate-500 mt-1">Encaissements, échéances et impayés de l&apos;établissement.</p>
        </div>
        <Link
          href={`${basePath}/paiements`}
          className="inline-flex items-center gap-2 h-9 px-3.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium shadow-sm transition-colors self-start sm:self-auto"
        >
          <Banknote size={15} /> Encaisser
        </Link>
      </div>

      {/* Indicateurs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map(({ label, value, icon: Icon, tint, valueCls, hint }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-slate-500">{label}</p>
              <span className={`w-7 h-7 rounded-md border flex items-center justify-center ${tint}`}>
                <Icon size={14} />
              </span>
            </div>
            <p className={`text-xl font-semibold tabular-nums tracking-tight mt-3 ${valueCls}`}>{value}</p>
            {hint && <p className="text-[11px] text-slate-500 mt-1">{hint}</p>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Graphique */}
        <section className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <header className="flex items-center justify-between gap-3 px-5 pt-4 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Recouvrement mensuel</h2>
              <p className="text-xs text-slate-500 mt-0.5">Montants attendus et encaissés par mois</p>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-medium text-slate-500">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-300" />Attendu</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-600" />Encaissé</span>
            </div>
          </header>
          <div className="p-5">
            {chartData.length === 0 ? (
              <div className="h-[300px] flex flex-col items-center justify-center text-center">
                <p className="text-sm font-medium text-slate-800">Aucune donnée à afficher</p>
                <p className="text-xs text-slate-500 mt-1">Générez des échéances ou enregistrez un paiement.</p>
              </div>
            ) : (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={8} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={compact} width={48} />
                    <Tooltip
                      cursor={{ fill: '#f1f5f9' }}
                      contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgb(15 23 42 / 0.08)', fontSize: 12 }}
                      formatter={(value) => formatCFA(Number(value))}
                    />
                    <Bar dataKey="attendu" name="Attendu" fill="#cbd5e1" radius={[4, 4, 0, 0]} barSize={18} />
                    <Bar dataKey="encaisse" name="Encaissé" fill="#047857" radius={[4, 4, 0, 0]} barSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </section>

        {/* Colonne latérale */}
        <div className="flex flex-col gap-6">
          <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <p className="text-xs font-medium text-slate-500">Encaissé aujourd&apos;hui</p>
            <p className="text-2xl font-semibold text-slate-900 tabular-nums tracking-tight mt-2">{formatCFA(stats.paiementsDuJour)}</p>
            <Link
              href={`${basePath}/paiements`}
              className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:text-emerald-800 hover:underline underline-offset-2"
            >
              Voir les paiements <ArrowRight size={12} />
            </Link>
          </section>

          <section className="bg-white rounded-xl border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)] flex-1">
            <header className="px-5 pt-4 pb-3 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-900">Actions rapides</h2>
            </header>
            <div className="p-2">
              <Link href={`${basePath}/echeances`} className="group flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                <span className="w-9 h-9 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-emerald-700 group-hover:text-white flex items-center justify-center transition-colors">
                  <CalendarPlus size={17} />
                </span>
                <span className="text-sm font-medium text-slate-700">Générer des échéances</span>
              </Link>
              <Link href={`${basePath}/impayes`} className="group flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                <span className="w-9 h-9 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-rose-600 group-hover:text-white flex items-center justify-center transition-colors">
                  <BellRing size={17} />
                </span>
                <span className="text-sm font-medium text-slate-700">Relancer les impayés</span>
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
