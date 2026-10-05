'use client'

import { useMemo, useState, useEffect } from 'react'
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
  ChevronLeft,
  ChevronRight,
  Calendar,
  DollarSign,
  PlusCircle,
  Receipt,
  Smartphone,
  Building,
  Sparkles,
  ExternalLink,
  Wallet,
  ArrowUpRight,
  UserCheck,
  BellRing,
} from 'lucide-react'
import { FinanceNavTabs } from './FinanceNavTabs'
import { AuraHeroBanner } from '@/components/ui/AuraHeroBanner'

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
  // ── 1. CALCULS MÉTIER COMPTABLE CONSOLIDÉS ──
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
    const paiementsDuJourCount = paiementsDuJourList.length

    // Impayés échus réels (échéance dépassée non soldée)
    const overdueList = schedules.filter(s => s.status !== 'paye' && s.due_date < today)
    const impayes = overdueList.reduce((acc, s) => {
      const paid = (s.payments || []).reduce((a, p) => a + Number(p.amount || 0), 0)
      return acc + Math.max(0, Number(s.amount_due || 0) - paid)
    }, 0)
    const overdueCount = overdueList.length

    // Échéances en cours non échues
    const pendingList = schedules.filter(s => s.status !== 'paye' && s.due_date >= today)
    const pendingCount = pendingList.length

    return {
      attendu,
      encaisse,
      reste,
      taux,
      paiementsDuJour,
      paiementsDuJourCount,
      impayes,
      overdueCount,
      pendingCount,
      today,
    }
  }, [schedules, payments])

  // ── 2. DONNÉES MENSUELLES POUR GRAPHIQUE ──
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

    // Calendrier scolaire standard : Septembre → Août
    const order = [8, 9, 10, 11, 0, 1, 2, 3, 4, 5, 6, 7]
    return order.map(i => ({
      name: MONTHS[i],
      attendu: attendu[i] || 0,
      encaisse: encaisse[i] || 0,
    }))
  }, [schedules, payments])

  // ── 3. DIAPORAMA / CARROUSEL FLUIDE DES MÉTRIQUES COMPTABLES ──
  const [activeSlide, setActiveSlide] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  const carouselItems = useMemo(() => [
    {
      id: 'recouvrement',
      badge: 'OBJECTIF ANNUEL',
      title: 'Taux de Recouvrement Global',
      value: `${stats.taux}%`,
      sub: `${formatCFA(stats.encaisse)} encaissés sur ${formatCFA(stats.attendu)}`,
      icon: TrendingUp,
      accentColor: 'from-emerald-600 to-teal-700',
      badgeCls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      linkText: 'Consulter le rapport',
      linkHref: `${basePath}/rapports`,
    },
    {
      id: 'caisse',
      badge: 'EN DIRECT AUJOURD’HUI',
      title: 'Caisse & Encaissements du Jour',
      value: formatCFA(stats.paiementsDuJour),
      sub: `${stats.paiementsDuJourCount} versement(s) enregistré(s) ce jour`,
      icon: Banknote,
      accentColor: 'from-blue-600 to-indigo-700',
      badgeCls: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      linkText: 'Accéder au guichet caisse',
      linkHref: `${basePath}/caisse`,
    },
    {
      id: 'reste',
      badge: 'ENGAGEMENT RESTANT',
      title: 'Solde Total à Percevoir',
      value: formatCFA(stats.reste),
      sub: `${stats.pendingCount} échéance(s) en attente sur l'année`,
      icon: Hourglass,
      accentColor: 'from-violet-600 to-purple-700',
      badgeCls: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
      linkText: "Gérer l'échéancier",
      linkHref: `${basePath}/echeances`,
    },
    {
      id: 'impayes',
      badge: 'ALERTES RETARDS',
      title: 'Impayés & Retards Échus',
      value: formatCFA(stats.impayes),
      sub: `${stats.overdueCount} dossier(s) en dépassement d'échéance`,
      icon: AlertTriangle,
      accentColor: 'from-rose-600 to-red-700',
      badgeCls: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      linkText: 'Envoyer relances WhatsApp',
      linkHref: `${basePath}/impayes`,
    },
  ], [stats, basePath])

  // Défilement automatique fluide (pause au survol)
  useEffect(() => {
    if (isPaused) return
    const timer = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % carouselItems.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [isPaused, carouselItems.length])

  // ── 4. TOGGLE GRAPHIQUE (COURBE OU HISTOGRAMME) ──
  const [chartType, setChartType] = useState<'area' | 'bar'>('area')

  // ── 5. CALCULS JAUGE RADIALE DE SANTÉ FINANCIÈRE ──
  const radius = 68
  const circumference = Math.PI * radius
  const strokeOffset = circumference - (stats.taux / 100) * circumference

  const healthState = useMemo(() => {
    if (stats.taux >= 80) return { label: 'Optimal', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
    if (stats.taux >= 50) return { label: 'Équilibré', badge: 'bg-amber-50 text-amber-700 border-amber-200' }
    return { label: 'Vigilance', badge: 'bg-rose-50 text-rose-700 border-rose-200' }
  }, [stats.taux])

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-12 px-1">

      {/* ── BARRE DE NAVIGATION D'ONGLETS FINANCE (CONTRASTE PARFAIT) ── */}
      <FinanceNavTabs basePath={basePath} />

      {/* ── HERO BANNER AURA COUCHER DE SOLEIL & VAGUE FLUIDE (STYLE RÉFÉRENCE) ── */}
      <AuraHeroBanner
        badge="CENTRE FINANCIER & TRÉSORERIE"
        title={schoolName}
        subtitle={`Vue d'ensemble de la solvabilité, suivi des encaissements de scolarité et recouvrement · ${academicYear}`}
        stats={[
          { label: 'Recouvrement', value: `${stats.taux}%`, color: 'text-emerald-300' },
          { label: 'Encaissé', value: compact(stats.encaisse), color: 'text-white' },
          { label: 'Reste', value: compact(stats.reste), color: 'text-amber-300' },
          { label: 'Impayés', value: compact(stats.impayes), color: 'text-rose-300' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href={`${basePath}/rapports`}
              className="inline-flex items-center gap-2 bg-white hover:bg-slate-100 text-slate-900 font-bold px-4 py-2.5 rounded-xl shadow-md transition-all duration-200 text-xs hover:scale-105 active:scale-95"
            >
              <Receipt size={15} className="text-slate-700" />
              <span>Rapport</span>
            </Link>
            <Link
              href={`${basePath}/caisse`}
              className="inline-flex items-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-blue-500/30 transition-all duration-200 text-xs hover:scale-105 active:scale-95"
            >
              <Banknote size={15} />
              <span>Guichet caisse</span>
            </Link>
          </div>
        }
      />

      {/* ── 4 CARTES KPI BENTO COLORÉES (STYLE PRESTIGE SCOGESTIA) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Encaissé — Vert Émeraude */}
        <div className="relative overflow-hidden rounded-[1.25rem] p-[1.5px] bg-gradient-to-br from-emerald-400/30 via-emerald-600/20 to-transparent group">
          <div className="relative bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-900 rounded-[calc(1.25rem-1.5px)] p-5 h-full flex flex-col justify-between gap-3 overflow-hidden shadow-[0_8px_32px_rgba(5,150,105,0.22)]">
            <div className="absolute -right-3 -bottom-3 opacity-[0.08] group-hover:opacity-[0.16] transition-opacity duration-500">
              <TrendingUp size={72} className="text-white" />
            </div>
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/10">
                <TrendingUp size={17} className="text-white" />
              </div>
              <span className="text-[10px] font-bold bg-black/20 text-emerald-200 px-2.5 py-0.5 rounded-full border border-white/10">
                {stats.taux}% recouvré
              </span>
            </div>
            <div>
              <p className="text-2xl font-black text-white leading-none tabular-nums">
                {formatCFA(stats.encaisse)}
              </p>
              <p className="text-emerald-200/90 text-xs font-semibold mt-1.5">Total Encaissé</p>
            </div>
            <Link
              href={`${basePath}/paiements`}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-white hover:underline mt-1"
            >
              Voir les versements <ArrowRight size={12} />
            </Link>
          </div>
        </div>

        {/* Total Attendu — Bleu Roi */}
        <div className="relative overflow-hidden rounded-[1.25rem] p-[1.5px] bg-gradient-to-br from-blue-400/30 via-blue-600/20 to-transparent group">
          <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 rounded-[calc(1.25rem-1.5px)] p-5 h-full flex flex-col justify-between gap-3 overflow-hidden shadow-[0_8px_32px_rgba(37,99,235,0.22)]">
            <div className="absolute -right-3 -bottom-3 opacity-[0.08] group-hover:opacity-[0.16] transition-opacity duration-500">
              <Wallet size={72} className="text-white" />
            </div>
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/10">
                <Wallet size={17} className="text-white" />
              </div>
              <span className="text-[10px] font-bold bg-black/20 text-blue-200 px-2.5 py-0.5 rounded-full border border-white/10">
                Échéancier complet
              </span>
            </div>
            <div>
              <p className="text-2xl font-black text-white leading-none tabular-nums">
                {formatCFA(stats.attendu)}
              </p>
              <p className="text-blue-200/90 text-xs font-semibold mt-1.5">Total Attendu</p>
            </div>
            <Link
              href={`${basePath}/echeances`}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-white hover:underline mt-1"
            >
              Consulter l&apos;échéancier <ArrowRight size={12} />
            </Link>
          </div>
        </div>

        {/* Reste à Percevoir — Ambre Chaud */}
        <div className="relative overflow-hidden rounded-[1.25rem] p-[1.5px] bg-gradient-to-br from-amber-400/30 via-amber-600/20 to-transparent group">
          <div className="relative bg-gradient-to-br from-amber-500 via-amber-600 to-amber-800 rounded-[calc(1.25rem-1.5px)] p-5 h-full flex flex-col justify-between gap-3 overflow-hidden shadow-[0_8px_32px_rgba(217,119,6,0.22)]">
            <div className="absolute -right-3 -bottom-3 opacity-[0.08] group-hover:opacity-[0.16] transition-opacity duration-500">
              <Hourglass size={72} className="text-white" />
            </div>
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/10">
                <Hourglass size={17} className="text-white" />
              </div>
              <span className="text-[10px] font-bold bg-black/20 text-amber-200 px-2.5 py-0.5 rounded-full border border-white/10">
                {stats.pendingCount} en attente
              </span>
            </div>
            <div>
              <p className="text-2xl font-black text-white leading-none tabular-nums">
                {formatCFA(stats.reste)}
              </p>
              <p className="text-amber-100 text-xs font-semibold mt-1.5">Reste à Percevoir</p>
            </div>
            <Link
              href={`${basePath}/caisse`}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-white hover:underline mt-1"
            >
              Encaisser un versement <ArrowRight size={12} />
            </Link>
          </div>
        </div>

        {/* Impayés en Retard — Rose Corail */}
        <div className="relative overflow-hidden rounded-[1.25rem] p-[1.5px] bg-gradient-to-br from-rose-400/30 via-rose-600/20 to-transparent group">
          <div className="relative bg-gradient-to-br from-rose-500 via-rose-600 to-rose-800 rounded-[calc(1.25rem-1.5px)] p-5 h-full flex flex-col justify-between gap-3 overflow-hidden shadow-[0_8px_32px_rgba(225,29,72,0.22)]">
            <div className="absolute -right-3 -bottom-3 opacity-[0.08] group-hover:opacity-[0.16] transition-opacity duration-500">
              <AlertTriangle size={72} className="text-white" />
            </div>
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/10">
                <AlertTriangle size={17} className="text-white" />
              </div>
              <span className="text-[10px] font-bold bg-black/20 text-rose-200 px-2.5 py-0.5 rounded-full border border-white/10">
                {stats.overdueCount} dépassés
              </span>
            </div>
            <div>
              <p className="text-2xl font-black text-white leading-none tabular-nums">
                {formatCFA(stats.impayes)}
              </p>
              <p className="text-rose-100 text-xs font-semibold mt-1.5">Impayés Échus</p>
            </div>
            <Link
              href={`${basePath}/impayes`}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-white hover:underline mt-1"
            >
              Lancer les relances <ArrowRight size={12} />
            </Link>
          </div>
        </div>

      </div>

      {/* ── SECTION ANALYTIQUE : DIAPORAMA INTERACTIF (GAUCHE) & GUICHET RAPIDE (DROITE) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* DIAPORAMA / CARROUSEL INTERACTIF DES MÉTRIQUES (STYLE STRIPE FLUIDE) */}
        <div
          className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between relative overflow-hidden"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center">
                <Sparkles size={16} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">Indicateurs Consolidés de Trésorerie</h3>
                <p className="text-xs text-slate-500 font-medium">Défilement interactif pour le pilotage financier</p>
              </div>
            </div>

            {/* Boutons flèches de commande */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setActiveSlide(prev => (prev - 1 + carouselItems.length) % carouselItems.length)}
                className="w-7 h-7 rounded-lg hover:bg-white flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors shadow-xs"
                aria-label="Diapositive précédente"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setActiveSlide(prev => (prev + 1) % carouselItems.length)}
                className="w-7 h-7 rounded-lg hover:bg-white flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors shadow-xs"
                aria-label="Diapositive suivante"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Grille des 4 cartes du carrousel avec mise en valeur active */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 my-2">
            {carouselItems.map((item, idx) => {
              const Icon = item.icon
              const isSelected = activeSlide === idx
              return (
                <div
                  key={item.id}
                  onClick={() => setActiveSlide(idx)}
                  className={`cursor-pointer rounded-xl p-4 transition-all duration-300 border ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-800 shadow-md scale-[1.01]'
                      : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-100 text-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[9.5px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                      isSelected ? 'bg-white/10 text-emerald-300 border-white/10' : 'bg-white text-slate-600 border-slate-200'
                    }`}>
                      {item.badge}
                    </span>
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                      isSelected ? 'bg-white/15 text-white' : 'bg-white text-slate-700 shadow-xs border border-slate-200'
                    }`}>
                      <Icon size={14} />
                    </div>
                  </div>

                  <p className={`text-xs font-semibold ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                    {item.title}
                  </p>
                  <p className={`text-xl sm:text-2xl font-black tracking-tight tabular-nums mt-1 ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                    {item.value}
                  </p>
                  <div className={`mt-3 flex items-center justify-between text-[11px] pt-2 border-t ${
                    isSelected ? 'border-white/10 text-slate-300' : 'border-slate-200 text-slate-500'
                  }`}>
                    <span className="truncate">{item.sub}</span>
                    <Link
                      href={item.linkHref}
                      className={`font-bold inline-flex items-center gap-0.5 shrink-0 ${
                        isSelected ? 'text-emerald-300 hover:text-white' : 'text-emerald-700 hover:text-emerald-800'
                      }`}
                    >
                      {item.linkText} <ArrowRight size={11} />
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Points indicateurs de défilement */}
          <div className="flex items-center justify-center gap-1.5 pt-4">
            {carouselItems.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveSlide(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  activeSlide === i ? 'w-6 bg-emerald-600' : 'w-1.5 bg-slate-200 hover:bg-slate-300'
                }`}
                aria-label={`Aller au slide ${i + 1}`}
              />
            ))}
          </div>
        </div>

        {/* GUICHET COMPTABLE RAPIDE (DROITE — SIMPLE, EFFICACE & DIRECT) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 mb-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center">
                <Banknote size={16} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Guichet & Actions Directes</h3>
                <p className="text-xs text-slate-500">Accès rapide aux opérations clés</p>
              </div>
            </div>

            <div className="space-y-2.5">
              <Link
                href={`${basePath}/caisse`}
                className="group flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white flex items-center justify-center transition-colors">
                    <PlusCircle size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-900">Encaisser un élève</p>
                    <p className="text-[11px] text-slate-500">Ouverture directe de la caisse</p>
                  </div>
                </div>
                <ArrowRight size={14} className="text-slate-400 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                href={`${basePath}/paiements`}
                className="group flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center transition-colors">
                    <Receipt size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 group-hover:text-blue-900">Reçus & Justificatifs</p>
                    <p className="text-[11px] text-slate-500">Générer ou imprimer les reçus</p>
                  </div>
                </div>
                <ArrowRight size={14} className="text-slate-400 group-hover:text-blue-700 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                href={`${basePath}/echeances`}
                className="group flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-amber-300 hover:bg-amber-50/50 transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 group-hover:bg-amber-600 group-hover:text-white flex items-center justify-center transition-colors">
                    <Calendar size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 group-hover:text-amber-900">Nouvelle Échéance</p>
                    <p className="text-[11px] text-slate-500">Planifier les tranches de scolarité</p>
                  </div>
                </div>
                <ArrowRight size={14} className="text-slate-400 group-hover:text-amber-700 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                href={`${basePath}/impayes`}
                className="group flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-rose-300 hover:bg-rose-50/50 transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-rose-100 text-rose-700 group-hover:bg-rose-600 group-hover:text-white flex items-center justify-center transition-colors">
                    <BellRing size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 group-hover:text-rose-900">Relances WhatsApp / SMS</p>
                    <p className="text-[11px] text-slate-500">{stats.overdueCount} dossiers à relancer</p>
                  </div>
                </div>
                <ArrowRight size={14} className="text-slate-400 group-hover:text-rose-700 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Encaissé aujourd&apos;hui :</span>
            <span className="font-bold text-emerald-700 tabular-nums">{formatCFA(stats.paiementsDuJour)}</span>
          </div>
        </div>

      </div>

      {/* ── SECTION ANALYTIQUE : COURBE MENSUELLE (GAUCHE) & JAUGE DE SANTÉ FINANCIÈRE (DROITE) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* COURBE MENSUELLE DES FLUX (ATTENDU VS ENCAISSÉ) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Évolution Mensuelle des Encaissements</h3>
              <p className="text-xs text-slate-500">Comparaison entre montants attendus et montants encaissés</p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-3 text-xs font-semibold text-slate-600 mr-2">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-300" />Attendu</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />Encaissé</span>
              </div>

              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setChartType('area')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                    chartType === 'area' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Courbe
                </button>
                <button
                  onClick={() => setChartType('bar')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                    chartType === 'bar' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Barres
                </button>
              </div>
            </div>
          </div>

          <div className="h-[260px] w-full">
            {chartData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <p className="text-sm font-semibold text-slate-700">Aucun flux financier pour cette période</p>
                <p className="text-xs text-slate-400 mt-1">Générez des échéances pour commencer à suivre la trésorerie.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'area' ? (
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorEncaisse" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#059669" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="colorAttendu" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#94a3b8" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={6} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={compact} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
                        fontSize: '12px',
                        color: '#0f172a',
                      }}
                      formatter={(val: any) => formatCFA(Number(val))}
                    />
                    <Area type="monotone" dataKey="attendu" name="Attendu" stroke="#94a3b8" strokeWidth={2} fillOpacity={1} fill="url(#colorAttendu)" />
                    <Area type="monotone" dataKey="encaisse" name="Encaissé" stroke="#059669" strokeWidth={2.5} fillOpacity={1} fill="url(#colorEncaisse)" />
                  </AreaChart>
                ) : (
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={6} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={compact} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        fontSize: '12px',
                      }}
                      formatter={(val: any) => formatCFA(Number(val))}
                    />
                    <Bar dataKey="attendu" name="Attendu" fill="#cbd5e1" radius={[4, 4, 0, 0]} barSize={16} />
                    <Bar dataKey="encaisse" name="Encaissé" fill="#059669" radius={[4, 4, 0, 0]} barSize={16} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* JAUGE RADIALE DE SANTÉ FINANCIÈRE (SPEEDOMETER) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Indice de Recouvrement</h3>
              <p className="text-xs text-slate-500">Solvabilité globale</p>
            </div>
            <Link
              href={`${basePath}/impayes`}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800"
            >
              Détails impayés
            </Link>
          </div>

          {/* Arc SVG semi-circulaire Speedometer */}
          <div className="flex flex-col items-center justify-center my-auto py-4 relative">
            <svg width="200" height="115" viewBox="0 0 200 115" className="overflow-visible">
              {/* Arc fond */}
              <path
                d="M 25 100 A 75 75 0 0 1 175 100"
                fill="none"
                stroke="#f1f5f9"
                strokeWidth="14"
                strokeLinecap="round"
              />
              {/* Arc valeur avec dégradé */}
              <defs>
                <linearGradient id="speedoGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f43f5e" />
                  <stop offset="50%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
              </defs>
              <path
                d="M 25 100 A 75 75 0 0 1 175 100"
                fill="none"
                stroke="url(#speedoGrad)"
                strokeWidth="14"
                strokeDasharray={Math.PI * 75}
                strokeDashoffset={Math.PI * 75 - (stats.taux / 100) * (Math.PI * 75)}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>

            {/* Texte au centre de la jauge */}
            <div className="absolute bottom-2 flex flex-col items-center">
              <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight tabular-nums leading-none">
                {stats.taux}%
              </span>
              <span className={`text-[10px] font-bold uppercase tracking-widest mt-1.5 px-2.5 py-0.5 rounded-full border ${healthState.badge}`}>
                {healthState.label}
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>0% (Début d&apos;année)</span>
            <span>100% (Clôture)</span>
          </div>
        </div>

      </div>

      {/* ── SECTION BASSE : FLUX EN DIRECT DES RÉCENTS PAIEMENTS (TABLE EXÉCUTIVE) ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center">
              <Receipt size={18} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                Flux en Direct des Récents Encaissements
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Journal des derniers versements enregistrés au guichet de caisse
              </p>
            </div>
          </div>

          <Link
            href={`${basePath}/paiements`}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors self-start sm:self-auto"
          >
            <span>Voir tous les paiements</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        <div className="overflow-x-auto">
          {payments.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center px-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 mb-3">
                <Banknote size={22} />
              </div>
              <p className="text-sm font-bold text-slate-800">Aucun encaissement pour le moment</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Enregistrez un premier versement au guichet pour alimenter le journal de caisse.
              </p>
              <Link
                href={`${basePath}/caisse`}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 transition-colors"
              >
                <PlusCircle size={14} />
                <span>Ouvrir la caisse</span>
              </Link>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px] bg-slate-50/70">
                  <th className="py-3 px-5">Élève & Classe</th>
                  <th className="py-3 px-5">Motif / Échéance</th>
                  <th className="py-3 px-5">Montant</th>
                  <th className="py-3 px-5">Mode de paiement</th>
                  <th className="py-3 px-5">Date</th>
                  <th className="py-3 px-5 text-right">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.slice(0, 8).map((p, idx) => {
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
                    <tr key={p.id || idx} className="hover:bg-slate-50/80 transition-colors group">
                      
                      {/* Élève */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center shrink-0">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors truncate">
                              {studentName}
                            </p>
                            <p className="text-[10px] text-slate-500 font-medium">
                              {className}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Motif */}
                      <td className="py-3.5 px-5 font-medium text-slate-700">
                        {p.schedule?.label || 'Frais de scolarité'}
                      </td>

                      {/* Montant */}
                      <td className="py-3.5 px-5 font-black text-emerald-700 tabular-nums text-sm">
                        {formatCFA(p.amount)}
                      </td>

                      {/* Mode de paiement */}
                      <td className="py-3.5 px-5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-semibold capitalize border border-slate-200">
                          {method.includes('mobile') || method.includes('momo') || method.includes('wave') ? (
                            <Smartphone size={12} className="text-blue-600" />
                          ) : method.includes('virement') || method.includes('banque') ? (
                            <Building size={12} className="text-violet-600" />
                          ) : (
                            <Banknote size={12} className="text-emerald-600" />
                          )}
                          <span>{p.payment_method || 'Espèces'}</span>
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-5 text-slate-500 font-medium">
                        {dateFormatted}
                      </td>

                      {/* Statut avec pastille verte */}
                      <td className="py-3.5 px-5 text-right">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
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
