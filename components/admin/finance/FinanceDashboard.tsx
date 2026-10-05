'use client'

import { useMemo, useState } from 'react'
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
  Calendar,
  PlusCircle,
  Receipt,
  Smartphone,
  Building,
  Wallet,
  BellRing,
  ArrowUpRight,
  ShieldCheck,
  FileText,
} from 'lucide-react'
import { FinanceNavTabs } from './FinanceNavTabs'
import { FinanceExecutiveBanner } from './FinanceExecutiveBanner'

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
  academicYear?: string
  basePath?: string
}

const MONTHS = ['Janv', 'Févr', 'Mars', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc']

const formatCFA = (amount: number) =>
  `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(amount)} FCFA`

const compact = (val: number) => {
  if (val >= 1_000_000) return `${+(val / 1_000_000).toFixed(1)}M`
  if (val >= 1_000) return `${Math.round(val / 1_000)}k`
  return String(val)
}

export function FinanceDashboard({
  schedules,
  payments,
  feeTypes = [],
  schoolName = 'Établissement',
  academicYear = '2024-2025',
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

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-12 px-1">

      {/* ── BARRE DE NAVIGATION D'ONGLETS FINANCE ── */}
      <FinanceNavTabs basePath={basePath} />

      {/* ── BANNIÈRE EXECUTIVE BLEU DOUX (STYLE CLASSPANEL RÉFÉRENCE) ── */}
      <FinanceExecutiveBanner
        badge={`CENTRE FINANCIER & TRÉSORERIE · ${academicYear}`}
        title={`Tableau de bord financier — ${schoolName}`}
        subtitle="Pilotez la trésorerie de votre école en toute clarté : encaissements, échéances et relances en temps réel."
        stats={[
          { label: 'Recouvrement', value: `${stats.taux}%`, color: 'text-emerald-700' },
          { label: 'Encaissé', value: compact(stats.encaisse), color: 'text-blue-700' },
          { label: 'Reste', value: compact(stats.reste), color: 'text-amber-700' },
          { label: 'Impayés', value: compact(stats.impayes), color: 'text-rose-700' },
        ]}
        actions={
          <div className="flex items-center gap-2.5">
            <Link
              href={`${basePath}/caisse`}
              className="inline-flex items-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all text-xs sm:text-sm"
            >
              <Banknote size={16} />
              <span>Guichet caisse</span>
              <ArrowRight size={14} />
            </Link>
            <Link
              href={`${basePath}/rapports`}
              className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 font-bold px-4 py-2.5 rounded-xl shadow-2xs transition-all text-xs sm:text-sm"
            >
              <FileText size={15} className="text-slate-500" />
              <span>Rapports</span>
            </Link>
          </div>
        }
      />

      {/* ── 4 CARTES KPI ÉPURÉES & BLANCHES (STYLE CLASSPANEL RÉFÉRENCE) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Encaissé */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Encaissé</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="my-3">
            <p className="text-2xl font-bold text-slate-900 tabular-nums tracking-tight">
              {formatCFA(stats.encaisse)}
            </p>
          </div>
          <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-100">
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
              <ArrowUpRight size={12} /> {stats.taux}% de recouvrement
            </span>
            <Link href={`${basePath}/paiements`} className="text-slate-400 hover:text-slate-700 font-medium">
              Détails →
            </Link>
          </div>
        </div>

        {/* Total Attendu */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Attendu</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <Wallet size={16} />
            </div>
          </div>
          <div className="my-3">
            <p className="text-2xl font-bold text-slate-900 tabular-nums tracking-tight">
              {formatCFA(stats.attendu)}
            </p>
          </div>
          <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-100">
            <span className="font-medium text-slate-500">
              Échéancier scolaire {academicYear}
            </span>
            <Link href={`${basePath}/echeances`} className="text-slate-400 hover:text-slate-700 font-medium">
              Gérer →
            </Link>
          </div>
        </div>

        {/* Reste à Percevoir */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Reste à Percevoir</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Hourglass size={16} />
            </div>
          </div>
          <div className="my-3">
            <p className="text-2xl font-bold text-slate-900 tabular-nums tracking-tight">
              {formatCFA(stats.reste)}
            </p>
          </div>
          <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-100">
            <span className="font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
              {stats.pendingCount} échéance(s) en attente
            </span>
            <Link href={`${basePath}/caisse`} className="text-slate-400 hover:text-slate-700 font-medium">
              Encaisser →
            </Link>
          </div>
        </div>

        {/* Impayés Échus */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Impayés Échus</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center">
              <AlertTriangle size={16} />
            </div>
          </div>
          <div className="my-3">
            <p className="text-2xl font-bold text-rose-600 tabular-nums tracking-tight">
              {formatCFA(stats.impayes)}
            </p>
          </div>
          <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-100">
            <span className="font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md">
              {stats.overdueCount} dossier(s) en retard
            </span>
            <Link href={`${basePath}/impayes`} className="text-rose-600 hover:text-rose-700 font-medium">
              Relancer →
            </Link>
          </div>
        </div>

      </div>

      {/* ── SECTION ANALYTIQUE ÉPURÉE (STYLE CLASSPANEL CÔTE À CÔTE) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* COURBE D'ÉVOLUTION DES ENCAISSEMENTS (GAUCHE - ATTENDU VS ENCAISSÉ) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Évolution des Encaissements
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Comparatif mensuel des flux attendus et encaissés
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2.5 text-xs font-medium text-slate-600">
                <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-300" />Attendu</span>
                <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-600" />Encaissé</span>
              </div>

              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200/60">
                <button
                  onClick={() => setChartType('area')}
                  className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all ${
                    chartType === 'area' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Courbe
                </button>
                <button
                  onClick={() => setChartType('bar')}
                  className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all ${
                    chartType === 'bar' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Barres
                </button>
              </div>
            </div>
          </div>

          <div className="h-[240px] w-full">
            {chartData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <p className="text-xs text-slate-400">Aucune donnée mensuelle disponible</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'area' ? (
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="blueGlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563EB" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="slateGlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#94A3B8" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#94A3B8" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} dy={6} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={compact} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                        fontSize: '12px',
                        color: '#0f172a',
                      }}
                      formatter={(val: any) => formatCFA(Number(val))}
                    />
                    <Area type="monotone" dataKey="attendu" name="Attendu" stroke="#94a3b8" strokeWidth={1.5} fill="url(#slateGlow)" />
                    <Area type="monotone" dataKey="encaisse" name="Encaissé" stroke="#2563EB" strokeWidth={2.5} fill="url(#blueGlow)" />
                  </AreaChart>
                ) : (
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} dy={6} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={compact} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        fontSize: '12px',
                      }}
                      formatter={(val: any) => formatCFA(Number(val))}
                    />
                    <Bar dataKey="attendu" name="Attendu" fill="#e2e8f0" radius={[4, 4, 0, 0]} barSize={14} />
                    <Bar dataKey="encaisse" name="Encaissé" fill="#2563EB" radius={[4, 4, 0, 0]} barSize={14} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* ACTIONS DIRECTES & FLUX DU JOUR (DROITE - ÉPURÉ & ACTIONNABLE) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">Opérations Rapides</h3>
              <p className="text-xs text-slate-500">Accès immédiat pour le gestionnaire</p>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
              Guichet Ouvert
            </span>
          </div>

          <div className="space-y-2.5 my-auto">
            <Link
              href={`${basePath}/caisse`}
              className="group flex items-center justify-between p-3 rounded-xl border border-slate-200/90 hover:border-blue-300 hover:bg-blue-50/40 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center transition-colors">
                  <Banknote size={17} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 group-hover:text-blue-900">Encaisser un élève</p>
                  <p className="text-[11px] text-slate-500">Enregistrer un versement et imprimer le reçu</p>
                </div>
              </div>
              <ArrowRight size={14} className="text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <Link
              href={`${basePath}/paiements`}
              className="group flex items-center justify-between p-3 rounded-xl border border-slate-200/90 hover:border-slate-300 hover:bg-slate-50 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 group-hover:bg-slate-800 group-hover:text-white flex items-center justify-center transition-colors">
                  <Receipt size={17} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Journal des Paiements</p>
                  <p className="text-[11px] text-slate-500">Historique complet des transactions et reçus</p>
                </div>
              </div>
              <ArrowRight size={14} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <Link
              href={`${basePath}/impayes`}
              className="group flex items-center justify-between p-3 rounded-xl border border-slate-200/90 hover:border-rose-300 hover:bg-rose-50/40 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-700 group-hover:bg-rose-600 group-hover:text-white flex items-center justify-center transition-colors">
                  <BellRing size={17} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 group-hover:text-rose-900">Relances des Impayés</p>
                  <p className="text-[11px] text-slate-500">{stats.overdueCount} dossiers nécessitant une relance</p>
                </div>
              </div>
              <ArrowRight size={14} className="text-slate-400 group-hover:text-rose-600 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div className="pt-3 border-t border-slate-100 mt-3 flex items-center justify-between text-xs text-slate-500">
            <span>Encaissé aujourd&apos;hui :</span>
            <span className="font-bold text-emerald-700 tabular-nums">{formatCFA(stats.paiementsDuJour)}</span>
          </div>
        </div>

      </div>

      {/* ── SECTION BASSE : JOURNAL DES DERNIERS ENCAISSEMENTS (TABLE ÉPURÉE) ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
              Derniers Versements Enregistrés
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Journal en direct des paiements reçus au guichet
            </p>
          </div>

          <Link
            href={`${basePath}/paiements`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors self-start sm:self-auto"
          >
            <span>Voir tout le journal</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        <div className="overflow-x-auto">
          {payments.length === 0 ? (
            <div className="py-10 flex flex-col items-center justify-center text-center px-4">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mb-2.5">
                <Banknote size={20} />
              </div>
              <p className="text-xs font-bold text-slate-800">Aucun encaissement pour le moment</p>
              <p className="text-[11px] text-slate-500 mt-0.5 max-w-sm">
                Enregistrez un premier versement au guichet pour alimenter le journal de caisse.
              </p>
              <Link
                href={`${basePath}/caisse`}
                className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                <PlusCircle size={13} />
                <span>Encaisser un versement</span>
              </Link>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px] bg-slate-50/60">
                  <th className="py-3 px-5">Élève & Classe</th>
                  <th className="py-3 px-5">Motif / Échéance</th>
                  <th className="py-3 px-5">Montant</th>
                  <th className="py-3 px-5">Mode de paiement</th>
                  <th className="py-3 px-5">Date</th>
                  <th className="py-3 px-5 text-right">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.slice(0, 6).map((p, idx) => {
                  const studentName = p.student
                    ? `${p.student.last_name || ''} ${p.student.first_name || ''}`.trim()
                    : 'Élève non renseigné'
                  const className = (p.student as any)?.classes?.name || 'Classe non assignée'
                  const initials = p.student?.last_name
                    ? `${p.student.last_name.charAt(0)}${p.student.first_name?.charAt(0) || ''}`
                    : 'EC'
                  const method = (p.payment_method || 'espèces').toLowerCase()
                  const dateFormatted = p.paid_at
                    ? new Date(p.paid_at).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })
                    : '—'

                  return (
                    <tr key={p.id || idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-800 font-black text-[11px] flex items-center justify-center shrink-0">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate">{studentName}</p>
                            <p className="text-[10px] text-slate-500 font-medium">{className}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-5 font-medium text-slate-700">
                        {p.schedule?.label || 'Frais scolaires'}
                      </td>
                      <td className="py-3 px-5 font-bold text-slate-900 tabular-nums">
                        {formatCFA(p.amount)}
                      </td>
                      <td className="py-3 px-5">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10.5px] font-semibold capitalize border border-slate-200">
                          {method.includes('mobile') || method.includes('momo') || method.includes('wave') ? (
                            <Smartphone size={11} className="text-blue-600" />
                          ) : method.includes('virement') || method.includes('banque') ? (
                            <Building size={11} className="text-violet-600" />
                          ) : (
                            <Banknote size={11} className="text-emerald-600" />
                          )}
                          <span>{p.payment_method || 'Espèces'}</span>
                        </span>
                      </td>
                      <td className="py-3 px-5 text-slate-500 font-medium">
                        {dateFormatted}
                      </td>
                      <td className="py-3 px-5 text-right">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>Validé</span>
                        </span>
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
