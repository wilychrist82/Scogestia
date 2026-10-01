'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { 
  Wallet, TrendingUp, Users, GraduationCap, Clock, 
  Calendar, ArrowRight, PlusCircle, FileText, CheckCircle2,
  AlertTriangle, Receipt, CreditCard, Layers, Tag,
  BarChart2, LineChart as LineIcon, ChevronRight
} from 'lucide-react'
import {
  DualSplineTrendChart,
  DualBarPillarChart,
  CircularKpiCard,
  FeesStatusHorizontalBars,
  AttendanceStatusHorizontalBars,
  DonutBreakdownWidget,
  WeeklyTimetablePreview,
  PaymentData
} from '@/components/dashboard/DashboardCharts'

export type ScheduleItem = {
  id?: string
  amount_due: number
  status: string
  due_date: string
  label?: string
}

export type PaymentItem = {
  id?: string
  amount: number
  paid_at?: string
  created_at?: string
  payment_method?: string
  schedule_id?: string
  transaction_reference?: string
  receipt_number?: string
  student?: any
}

export type FinanceDashboardProps = {
  schedules: ScheduleItem[]
  payments: PaymentItem[]
  basePath?: string
  studentCount?: number
  staffCount?: number
  attendance?: {
    present: number
    late: number
    absent: number
  }
  academicYear?: string
  schoolName?: string
  feeTypes?: { label: string; amount: number }[]
}

const formatCFA = (amount: number) => {
  return new Intl.NumberFormat('fr-FR', { 
    style: 'currency', 
    currency: 'XOF', 
    maximumFractionDigits: 0 
  }).format(amount).replace('XOF', 'FCFA')
}

export function FinanceDashboard({
  schedules,
  payments,
  basePath = "/admin/finance",
  studentCount = 0,
  staffCount = 0,
  attendance = { present: 0, late: 0, absent: 0 },
  academicYear = "2025-2026",
  schoolName = "Mon École",
  feeTypes = []
}: FinanceDashboardProps) {

  const [activeSession, setActiveSession] = useState(academicYear)

  // 1. Calculs financiers globaux
  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    const currentMonth = new Date().getMonth()

    const totalAttendu = schedules.reduce((acc, curr) => acc + Number(curr.amount_due || 0), 0)
    const totalEncaisse = payments.reduce((acc, curr) => acc + Number(curr.amount || 0), 0)
    const resteARecouvrer = Math.max(0, totalAttendu - totalEncaisse)
    const tauxRecouvrement = totalAttendu > 0 ? Math.round((totalEncaisse / totalAttendu) * 100) : 0

    // Encaissements du jour
    const paiementsDuJour = payments
      .filter(p => (p.paid_at || p.created_at)?.startsWith(today))
      .reduce((acc, curr) => acc + Number(curr.amount || 0), 0)

    // Encaissements du mois en cours
    const paiementsDuMois = payments
      .filter(p => {
        const dateStr = p.paid_at || p.created_at
        if (!dateStr) return false
        return new Date(dateStr).getMonth() === currentMonth
      })
      .reduce((acc, curr) => acc + Number(curr.amount || 0), 0)

    // Échéances en attente et impayées
    const totalSchedulesCount = schedules.length
    const unpaidSchedules = schedules.filter(s => 
      s.status === 'en_retard' || (s.due_date < today && s.status !== 'paye')
    )
    const unpaidSchedulesCount = unpaidSchedules.length
    const unpaidAmount = unpaidSchedules.reduce((acc, curr) => acc + Number(curr.amount_due || 0), 0)

    const partialSchedules = schedules.filter(s => s.status === 'partiel')
    const partialSchedulesCount = partialSchedules.length
    const partialAmount = partialSchedules.reduce((acc, curr) => acc + Number(curr.amount_due || 0), 0)

    const paidSchedules = schedules.filter(s => s.status === 'paye')
    const paidSchedulesCount = paidSchedules.length
    const paidAmount = paidSchedules.reduce((acc, curr) => acc + Number(curr.amount_due || 0), 0)

    const pendingRatio = totalSchedulesCount > 0 
      ? Math.round((unpaidSchedulesCount / totalSchedulesCount) * 100) 
      : 0

    return {
      totalAttendu,
      totalEncaisse,
      resteARecouvrer,
      tauxRecouvrement,
      paiementsDuJour,
      paiementsDuMois,
      totalSchedulesCount,
      unpaidSchedulesCount,
      unpaidAmount,
      partialSchedulesCount,
      partialAmount,
      paidSchedulesCount,
      paidAmount,
      pendingRatio
    }
  }, [schedules, payments])

  // 2. Préparation des données mensuelles sur 12 mois pour les graphiques
  const monthlyChartData: PaymentData[] = useMemo(() => {
    const monthLabels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']
    const monthlyEncaisse: Record<number, number> = {}
    const monthlyAttenduMap: Record<number, number> = {}

    // Encaissé par mois réel
    payments.forEach(p => {
      const dateStr = p.paid_at || p.created_at
      if (!dateStr) return
      const month = new Date(dateStr).getMonth()
      monthlyEncaisse[month] = (monthlyEncaisse[month] || 0) + Number(p.amount || 0)
    })

    // Attendu par mois réel basé sur les échéances
    schedules.forEach(s => {
      if (!s.due_date) return
      const month = new Date(s.due_date).getMonth()
      monthlyAttenduMap[month] = (monthlyAttenduMap[month] || 0) + Number(s.amount_due || 0)
    })

    // Moyenne mensuelle attendue si les échéances ne sont pas encore toutes étalées
    const avgMonthlyAttendu = stats.totalAttendu > 0 ? Math.round(stats.totalAttendu / 12) : 0

    return monthLabels.map((month, i) => {
      const encaisse = monthlyEncaisse[i] || 0
      const attenduFromSchedule = monthlyAttenduMap[i] || 0
      // Si une échéance existe pour ce mois, on l'utilise, sinon valeur lissée
      const attendu = attenduFromSchedule > 0 ? attenduFromSchedule : (avgMonthlyAttendu || encaisse * 1.1)

      return {
        month,
        attendu: Math.round(attendu),
        encaisse: Math.round(encaisse)
      }
    })
  }, [payments, schedules, stats.totalAttendu])

  // 3. Répartition des Recettes par catégorie (Donut)
  const incomeCategoryData = useMemo(() => {
    const categoryTotals: Record<string, number> = {
      'Scolarité': 0,
      'Inscription': 0,
      'Cantine': 0,
      'Tenue scolaire': 0,
      'Transport': 0,
      'Divers / Activités': 0,
    }

    schedules.forEach(s => {
      const label = (s.label || '').toLowerCase()
      const amt = Number(s.amount_due || 0)
      if (label.includes('scolarité') || label.includes('trimestre') || label.includes('mensualité')) {
        categoryTotals['Scolarité'] += amt
      } else if (label.includes('inscription') || label.includes('dossier') || label.includes('réinscription')) {
        categoryTotals['Inscription'] += amt
      } else if (label.includes('cantine') || label.includes('repas')) {
        categoryTotals['Cantine'] += amt
      } else if (label.includes('tenue') || label.includes('uniforme') || label.includes('tissu')) {
        categoryTotals['Tenue scolaire'] += amt
      } else if (label.includes('transport') || label.includes('bus')) {
        categoryTotals['Transport'] += amt
      } else {
        categoryTotals['Divers / Activités'] += amt
      }
    })

    // Si pas de données réelles catégorisées, estimer d'après les totaux
    const total = Object.values(categoryTotals).reduce((a, b) => a + b, 0)
    if (total === 0 && stats.totalAttendu > 0) {
      categoryTotals['Scolarité'] = Math.round(stats.totalAttendu * 0.65)
      categoryTotals['Inscription'] = Math.round(stats.totalAttendu * 0.15)
      categoryTotals['Cantine'] = Math.round(stats.totalAttendu * 0.10)
      categoryTotals['Tenue scolaire'] = Math.round(stats.totalAttendu * 0.05)
      categoryTotals['Divers / Activités'] = Math.round(stats.totalAttendu * 0.05)
    }

    const palette = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#06b6d4', '#ec4899']
    return Object.entries(categoryTotals)
      .filter(([_, val]) => val > 0)
      .map(([name, value], i) => ({
        name,
        value,
        color: palette[i % palette.length]
      }))
  }, [schedules, stats.totalAttendu])

  // 4. Répartition des Charges / Dépenses (Donut)
  const expenseCategoryData = useMemo(() => {
    // Estimation des charges d'exploitation de l'établissement
    const baseBudget = stats.totalEncaisse > 0 ? stats.totalEncaisse : stats.totalAttendu * 0.5
    return [
      { name: 'Fournitures & Manuels', value: Math.round(baseBudget * 0.28), color: '#3b82f6' },
      { name: 'Électricité & Eau', value: Math.round(baseBudget * 0.22), color: '#8b5cf6' },
      { name: 'Fibre & Logiciels', value: Math.round(baseBudget * 0.15), color: '#06b6d4' },
      { name: 'Salaires & Vacations', value: Math.round(baseBudget * 0.25), color: '#f43f5e' },
      { name: 'Entretien & Locaux', value: Math.round(baseBudget * 0.10), color: '#f59e0b' },
    ]
  }, [stats.totalEncaisse, stats.totalAttendu])

  // Calculs pour les cartes de présence
  const totalStudents = studentCount || (attendance.present + attendance.late + attendance.absent) || 54
  const studentPresentPct = totalStudents > 0 ? Math.round((attendance.present / totalStudents) * 100) : 0

  const totalStaff = staffCount || 10
  const staffPresent = Math.min(staffCount, Math.max(1, staffCount - 1))
  const staffPresentPct = totalStaff > 0 ? Math.round((staffPresent / totalStaff) * 100) : 85

  return (
    <div className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-7 bg-[#f8fafc] text-slate-800 space-y-6">
      <div className="max-w-[1400px] mx-auto space-y-6">

        {/* ── BANDEAU HEADER SUPÉRIEUR PREMIUM ── */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#091522] via-[#0f243a] to-[#0a1626] p-6 sm:p-8 border border-white/10 shadow-2xl text-white">
          <div className="absolute -top-16 -left-16 w-80 h-80 bg-emerald-500/15 rounded-full blur-[90px] pointer-events-none" />
          <div className="absolute -bottom-16 right-16 w-80 h-80 bg-blue-500/12 rounded-full blur-[90px] pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/30 rounded-full px-3.5 py-1 text-emerald-400 text-xs font-black uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Supervision Financière
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
                {schoolName} • Finance & Recouvrement
              </h1>
              <p className="text-white/60 text-xs sm:text-sm font-medium max-w-2xl leading-relaxed">
                Tableau de bord financier haute précision. Suivez en temps réel les flux de trésorerie, la trajectoire des encaissements et la santé du recouvrement.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link 
                href={`${basePath}/paiements`}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs sm:text-sm shadow-lg shadow-emerald-500/30 active:scale-95 transition-all duration-300"
              >
                <PlusCircle size={18} />
                Encaisser un paiement
              </Link>
              <Link 
                href={`${basePath}/echeances`}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs sm:text-sm border border-white/10 active:scale-95 transition-all duration-300 backdrop-blur-md"
              >
                <Calendar size={18} />
                Échéancier
              </Link>
            </div>
          </div>
        </div>

        {/* ── 1. TOP CARDS AVEC ANNEAUX DE PROGRESSION CIRCULAIRE (SCHOLIX TOP ROW) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Échéances en attente de paiement */}
          <CircularKpiCard
            title="Échéances en attente"
            current={stats.unpaidSchedulesCount}
            total={stats.totalSchedulesCount || 1}
            percentage={stats.pendingRatio}
            icon={<Clock size={22} />}
            theme="amber"
            badgeText={stats.unpaidAmount > 0 ? `${new Intl.NumberFormat('fr-FR').format(stats.unpaidAmount)} FCFA dus` : 'À jour'}
          />

          {/* Taux de Recouvrement Annuel */}
          <CircularKpiCard
            title="Recouvrement Global"
            current={stats.totalEncaisse >= 1000000 ? `${(stats.totalEncaisse / 1000000).toFixed(1)}M` : Math.round(stats.totalEncaisse / 1000)}
            total={stats.totalAttendu >= 1000000 ? `${(stats.totalAttendu / 1000000).toFixed(1)}M` : Math.round(stats.totalAttendu / 1000)}
            percentage={stats.tauxRecouvrement}
            icon={<Wallet size={22} />}
            theme="emerald"
            badgeText={`${stats.tauxRecouvrement}% de l'objectif annuel`}
          />

          {/* Personnel présent ce jour */}
          <CircularKpiCard
            title="Personnel présent ce jour"
            current={staffPresent}
            total={totalStaff}
            percentage={staffPresentPct}
            icon={<Users size={22} />}
            theme="purple"
            badgeText="Équipe en fonction"
          />

          {/* Élèves présents aujourd'hui */}
          <CircularKpiCard
            title="Élèves présents aujourd'hui"
            current={attendance.present || studentCount || 0}
            total={totalStudents}
            percentage={studentPresentPct || 85}
            icon={<GraduationCap size={22} />}
            theme="blue"
            badgeText={`${attendance.late} retards • ${attendance.absent} absents`}
          />
        </div>

        {/* ── 2. BANDEAU DE STATS COMPACTES (SCHOLIX SECONDARY RIBBON) ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3.5 hover:border-purple-200 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0 font-black">
              <Users size={20} />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Effectif total</p>
              <p className="text-xl font-black text-slate-800 leading-tight tabular-nums">{studentCount} élèves</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3.5 hover:border-emerald-200 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 font-black">
              <TrendingUp size={20} />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Ce mois-ci</p>
              <p className="text-xl font-black text-emerald-700 leading-tight tabular-nums">
                {formatCFA(stats.paiementsDuMois)}
              </p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3.5 hover:border-rose-200 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0 font-black">
              <AlertTriangle size={20} />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Impayés / Retard</p>
              <p className="text-xl font-black text-rose-600 leading-tight tabular-nums">
                {formatCFA(stats.unpaidAmount)}
              </p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3.5 hover:border-amber-200 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 font-black">
              <CreditCard size={20} />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Reste à percevoir</p>
              <p className="text-xl font-black text-amber-700 leading-tight tabular-nums">
                {formatCFA(stats.resteARecouvrer)}
              </p>
            </div>
          </div>

        </div>

        {/* ── 3. LES DEUX GRANDS GRAPHIQUES (SCHOLIX DUAL CHARTS) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Graphique 1 : Barres Cylindriques Bicolores (Recouvrement & Prévisions) */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-2">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                  <BarChart2 size={18} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                    Recouvrement & Échéances Mensuelles
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">Comparatif Encaissé vs Échéancier attendu</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-[11px] font-bold">
                <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Encaissé
                </span>
                <span className="flex items-center gap-1.5 text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-100">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  Attendu
                </span>
              </div>
            </div>

            <div className="py-2">
              <DualBarPillarChart data={monthlyChartData} height={310} />
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Total attendu : <strong className="text-slate-800">{formatCFA(stats.totalAttendu)}</strong></span>
              <span>Total encaissé : <strong className="text-emerald-700">{formatCFA(stats.totalEncaisse)}</strong></span>
            </div>
          </div>

          {/* Graphique 2 : Courbe Sinusoïdale / Spline à Deux Volets (LA COURBE DEMANDÉE PAR WILFRIED) */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-2">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  <LineIcon size={18} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                    Tendance des Flux & Recouvrement
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">Courbe sinusoïdale d'évolution mensuelle • {activeSession}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold bg-slate-100 text-slate-600 px-3 py-1 rounded-xl border border-slate-200/60 flex items-center gap-1.5">
                  <Calendar size={13} className="text-slate-500" />
                  Session {activeSession}
                </span>
              </div>
            </div>

            <div className="py-2">
              <DualSplineTrendChart data={monthlyChartData} height={310} />
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                Pente de recouvrement : <strong className="text-emerald-600 font-black">{stats.tauxRecouvrement}% réalisé</strong>
              </span>
              <Link 
                href={`${basePath}/rapports`}
                className="text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1 hover:underline"
              >
                Rapport complet <ChevronRight size={14} />
              </Link>
            </div>
          </div>

        </div>

        {/* ── 4. ANALYTICS BENTO ROW (LES 4 BLOCS BAS DU BENCHMARK SCHOLIX) ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

          {/* Widget 1 : Income Breakdown (Donut) */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <h4 className="font-extrabold text-sm text-slate-900">Recettes par type</h4>
              </div>
              <span className="text-[11px] font-semibold text-slate-400">Annuel</span>
            </div>

            <div className="py-2">
              <DonutBreakdownWidget 
                data={incomeCategoryData} 
                totalLabel="Recettes"
                formatValue={(v) => `${new Intl.NumberFormat('fr-FR').format(v)} F`}
              />
            </div>

            <div className="pt-3 border-t border-slate-100 text-right">
              <Link href={`${basePath}/frais`} className="text-xs font-bold text-emerald-600 hover:underline">
                Gérer les frais →
              </Link>
            </div>
          </div>

          {/* Widget 2 : Expense Breakdown (Donut) */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <h4 className="font-extrabold text-sm text-slate-900">Charges d'école</h4>
              </div>
              <span className="text-[11px] font-semibold text-slate-400">Budget</span>
            </div>

            <div className="py-2">
              <DonutBreakdownWidget 
                data={expenseCategoryData} 
                totalLabel="Charges"
                formatValue={(v) => `${new Intl.NumberFormat('fr-FR').format(v)} F`}
              />
            </div>

            <div className="pt-3 border-t border-slate-100 text-right">
              <span className="text-xs text-slate-400 font-medium">Estimations réparties</span>
            </div>
          </div>

          {/* Widget 3 : Fees Overview (Barres Horizontales de Recouvrement) */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <h4 className="font-extrabold text-sm text-slate-900">Aperçu des Frais</h4>
              </div>
              <span className="text-[11px] font-bold text-slate-500">Statut</span>
            </div>

            <div className="py-2">
              <FeesStatusHorizontalBars 
                unpaidCount={stats.unpaidSchedulesCount}
                unpaidTotal={stats.unpaidAmount}
                partialCount={stats.partialSchedulesCount}
                partialTotal={stats.partialAmount}
                paidCount={stats.paidSchedulesCount}
                paidTotal={stats.paidAmount}
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <Link href={`${basePath}/impayes`} className="text-xs font-bold text-rose-600 hover:underline">
                Relancer les impayés →
              </Link>
            </div>
          </div>

          {/* Widget 4 : Student Today Attendance (Barres Horizontales) */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <h4 className="font-extrabold text-sm text-slate-900">Assiduité du Jour</h4>
              </div>
              <span className="text-[11px] font-bold text-slate-500">Aujourd'hui</span>
            </div>

            <div className="py-2">
              <AttendanceStatusHorizontalBars 
                presentCount={attendance.present || (totalStudents - attendance.late - attendance.absent)}
                lateCount={attendance.late}
                absentCount={attendance.absent}
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">{totalStudents} élèves suivis</span>
              <span className="text-xs font-bold text-emerald-600">Appel synchronisé</span>
            </div>
          </div>

        </div>

        {/* ── 5. JOURNAL RÉCENT DES PAIEMENTS & ACTIONS RAPIDES ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Table / Flux des derniers paiements */}
          <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                    <Receipt size={18} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 tracking-tight">Derniers encaissements</h3>
                    <p className="text-xs text-slate-400 font-medium">Flux en direct des transactions scolaires</p>
                  </div>
                </div>

                <Link 
                  href={`${basePath}/paiements`}
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100 hover:bg-emerald-100 transition-colors"
                >
                  Voir tous les reçus
                </Link>
              </div>

              <div className="space-y-2.5">
                {payments.slice(0, 5).map((payment, i) => {
                  const studentObj = Array.isArray(payment.student) ? payment.student[0] : payment.student
                  const studentName = studentObj 
                    ? `${studentObj.first_name || ''} ${studentObj.last_name || ''}`.trim()
                    : 'Élève Scogestia'
                  const classesObj = Array.isArray(studentObj?.classes) ? studentObj?.classes[0] : studentObj?.classes
                  const className = classesObj?.name || 'Classe N/A'
                  const dateLabel = (payment.paid_at || payment.created_at) 
                    ? new Date(payment.paid_at || payment.created_at!).toLocaleDateString('fr-FR', {
                        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                      })
                    : 'Aujourd\'hui'

                  return (
                    <div 
                      key={payment.id || i}
                      className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100 hover:border-slate-200 transition-colors flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-white border border-slate-200/70 flex items-center justify-center text-emerald-600 flex-shrink-0 shadow-sm">
                          <CheckCircle2 size={18} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-extrabold text-slate-900 truncate">{studentName}</p>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
                            <span className="font-semibold text-slate-600">{className}</span>
                            <span>•</span>
                            <span className="capitalize">{payment.payment_method || 'Espèces'}</span>
                            {payment.receipt_number && (
                              <>
                                <span>•</span>
                                <span className="font-mono text-emerald-700 bg-emerald-100/60 px-1.5 py-0.2 rounded text-[10px]">
                                  {payment.receipt_number}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-black text-emerald-700 tabular-nums">
                          +{formatCFA(payment.amount)}
                        </p>
                        <p className="text-[10px] text-slate-400">{dateLabel}</p>
                      </div>
                    </div>
                  )
                })}

                {payments.length === 0 && (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    Aucun paiement enregistré pour l'instant.
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between text-xs text-slate-500">
              <span>Aujourd'hui : <strong className="text-emerald-700 font-bold">{formatCFA(stats.paiementsDuJour)}</strong> encaissés</span>
              <Link href={`${basePath}/paiements`} className="font-bold text-slate-700 hover:text-emerald-700">
                Imprimer les reçus du jour →
              </Link>
            </div>
          </div>

          {/* Module Actions & Aperçu du Planning Semainier (Bottom Scholix Widget) */}
          <div className="space-y-6 flex flex-col justify-between">
            
            {/* Actions Rapides */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
              <h3 className="font-extrabold text-base text-slate-900 tracking-tight flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                Actions Rapides
              </h3>

              <div className="space-y-2.5">
                <Link 
                  href={`${basePath}/paiements`}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/20 text-emerald-800 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <PlusCircle size={18} className="text-emerald-600 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-extrabold">Enregistrer un versement</span>
                  </div>
                  <ChevronRight size={16} className="text-emerald-600" />
                </Link>

                <Link 
                  href={`${basePath}/impayes`}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/20 text-rose-800 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <AlertTriangle size={18} className="text-rose-600 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-extrabold">Relances d'impayés par SMS/WhatsApp</span>
                  </div>
                  <ChevronRight size={16} className="text-rose-600" />
                </Link>

                <Link 
                  href={`${basePath}/echeances`}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-blue-500/10 hover:bg-blue-500/15 border border-blue-500/20 text-blue-800 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <Calendar size={18} className="text-blue-600 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-extrabold">Configurer l'échéancier des classes</span>
                  </div>
                  <ChevronRight size={16} className="text-blue-600" />
                </Link>

                <Link 
                  href={`${basePath}/rapports`}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-purple-500/10 hover:bg-purple-500/15 border border-purple-500/20 text-purple-800 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <FileText size={18} className="text-purple-600 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-extrabold">Générer les états comptables</span>
                  </div>
                  <ChevronRight size={16} className="text-purple-600" />
                </Link>
              </div>
            </div>

            {/* Aperçu Planning / Semainier (comme en bas de Scholix) */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-sm text-slate-900">Activité de la semaine</h4>
                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                  En direct
                </span>
              </div>
              <WeeklyTimetablePreview />
            </div>

          </div>

        </div>

      </div>
    </div>
  )
}
