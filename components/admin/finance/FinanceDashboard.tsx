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
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight,
  Calendar,
  CreditCard,
  FileText,
  DollarSign,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  Search,
  ExternalLink,
  ShieldCheck,
  Receipt,
  Smartphone,
  Building,
} from 'lucide-react'

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
  // ── 1. CALCULS CONSOLIDÉS & RÈGLES MÉTIER ──
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

    // Impayés échus réels
    const overdueList = schedules.filter(s => s.status !== 'paye' && s.due_date < today)
    const impayes = overdueList.reduce((acc, s) => {
      const paid = (s.payments || []).reduce((a, p) => a + Number(p.amount || 0), 0)
      return acc + Math.max(0, Number(s.amount_due || 0) - paid)
    }, 0)
    const overdueCount = overdueList.length

    // En attente non échues
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

  // ── 2. DONNÉES MENSUELLES POUR GRAPHIQUES ──
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

  // ── 3. ÉTAT CARROUSEL / DIAPORAMA DES MÉTRIQUES ──
  const [activeSlide, setActiveSlide] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  const carouselItems = useMemo(() => [
    {
      id: 'recouvrement',
      tag: 'OBJECTIF ANNUEL',
      title: 'Taux de Recouvrement',
      value: `${stats.taux}%`,
      sub: `${formatCFA(stats.encaisse)} encaissés`,
      target: `sur ${formatCFA(stats.attendu)} attendus`,
      icon: TrendingUp,
      accent: 'from-emerald-500 to-teal-600',
      badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      progress: stats.taux,
      linkText: 'Voir le détail',
      linkHref: `${basePath}/rapports`,
    },
    {
      id: 'caisse',
      tag: 'EN DIRECT DU JOUR',
      title: 'Caisse & Flux Journalier',
      value: formatCFA(stats.paiementsDuJour),
      sub: `${stats.paiementsDuJourCount} encaissement(s) aujourd'hui`,
      target: 'Guichet ouvert',
      icon: Banknote,
      accent: 'from-cyan-500 to-blue-600',
      badgeBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
      progress: Math.min(100, Math.round((stats.paiementsDuJour / Math.max(1, stats.encaisse * 0.05)) * 100)),
      linkText: 'Ouvrir la caisse',
      linkHref: `${basePath}/caisse`,
    },
    {
      id: 'reste',
      tag: 'ENGAGEMENT RESTANT',
      title: 'Solde Restant à Percevoir',
      value: formatCFA(stats.reste),
      sub: `${stats.pendingCount} échéance(s) en attente`,
      target: `Échéances ${academicYear}`,
      icon: Hourglass,
      accent: 'from-violet-500 to-purple-600',
      badgeBg: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
      progress: Math.max(0, 100 - stats.taux),
      linkText: "Gérer l'échéancier",
      linkHref: `${basePath}/echeances`,
    },
    {
      id: 'impayes',
      tag: 'ALERTES CRITIQUES',
      title: 'Impayés & Retards Échus',
      value: formatCFA(stats.impayes),
      sub: `${stats.overdueCount} dossier(s) en dépassement`,
      target: 'Relances requises',
      icon: AlertTriangle,
      accent: 'from-rose-500 to-red-600',
      badgeBg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      progress: stats.attendu > 0 ? Math.min(100, Math.round((stats.impayes / stats.attendu) * 100)) : 0,
      linkText: 'Envoyer relances',
      linkHref: `${basePath}/impayes`,
    },
  ], [stats, academicYear, basePath])

  // Défilement automatique fluide (pause au survol)
  useEffect(() => {
    if (isPaused) return
    const timer = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % carouselItems.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [isPaused, carouselItems.length])

  // ── 4. SIMULATEUR D'ENCAISSEMENT EXPRESS (INSPIRÉ DE LA "SWAP BOX" NODEKA) ──
  const [simAmount, setSimAmount] = useState<number>(25000)
  const [simCategory, setSimCategory] = useState<string>(
    feeTypes.length > 0 ? feeTypes[0].label : 'Scolarité Trimestre 1'
  )

  // ── 5. TOGGLE GRAPHIQUE (AIRE LUMINEUSE OU HISTOGRAMME) ──
  const [chartType, setChartType] = useState<'area' | 'bar'>('area')

  // ── 6. CALCULS DE LA JAUGE RADIALE (SPEEDOMETER STYLE "GREED INDEX") ──
  // Arc semi-circulaire de 180° à 0°
  const radius = 68
  const circumference = Math.PI * radius
  const strokeOffset = circumference - (stats.taux / 100) * circumference

  const healthState = useMemo(() => {
    if (stats.taux >= 80) return { label: 'Optimal', color: '#10B981', textCls: 'text-emerald-400', badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' }
    if (stats.taux >= 50) return { label: 'Équilibré', color: '#F59E0B', textCls: 'text-amber-400', badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20' }
    return { label: 'Vigilance', color: '#EF4444', textCls: 'text-rose-400', badge: 'bg-rose-500/10 text-rose-400 border-rose-500/20' }
  }, [stats.taux])

  // ── 7. NAVIGATION SOUS-MODULES FINANCE ──
  const subModules = [
    { label: "Vue d'ensemble", href: basePath, active: true, icon: Layers },
    { label: 'Caisse (Direct)', href: `${basePath}/caisse`, icon: Banknote },
    { label: 'Paiements & Reçus', href: `${basePath}/paiements`, icon: Receipt },
    { label: 'Échéancier', href: `${basePath}/echeances`, icon: Calendar },
    { label: 'Impayés & Relances', href: `${basePath}/impayes`, icon: AlertTriangle },
    { label: 'Frais Scolaires', href: `${basePath}/frais`, icon: DollarSign },
    { label: 'Rapports & Bilans', href: `${basePath}/rapports`, icon: FileText },
  ]

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto pb-12 px-1 text-slate-100">

      {/* ── BARRE DE NAVIGATION SUPÉRIEURE DES SOUS-MODULES (STYLE STRIPE / DEFI TABS) ── */}
      <div className="flex items-center justify-between gap-3 overflow-x-auto pb-2 scrollbar-none border-b border-white/[0.08]">
        <div className="flex items-center gap-1.5 min-w-max">
          {subModules.map(sm => {
            const Icon = sm.icon
            return (
              <Link
                key={sm.href}
                href={sm.href}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  sm.active
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04] border border-transparent'
                }`}
              >
                <Icon size={14} />
                <span>{sm.label}</span>
              </Link>
            )
          })}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={`${basePath}/caisse`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-[0_4px_16px_rgba(16,185,129,0.3)] transition-all duration-200"
          >
            <Banknote size={15} />
            <span>Guichet Caisse</span>
          </Link>
        </div>
      </div>

      {/* ── CONTENEUR PRINCIPAL DU COCKPIT FINANCIER SOMBRE (AESTHETIC NODEKA) ── */}
      <div className="relative rounded-[2rem] bg-[#0B0F19] border border-white/[0.08] shadow-[0_25px_60px_rgba(0,0,0,0.6)] p-6 sm:p-8 overflow-hidden space-y-6">
        
        {/* LUEURS AMBIANTES D'ARRIÈRE-PLAN */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 -right-32 w-96 h-96 bg-[#FF5B4F]/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-violet-500/10 rounded-full blur-[130px] pointer-events-none" />

        {/* ── EN-TÊTE DU COCKPIT AVEC STATUT EN DIRECT ── */}
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.06] pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400">Trésorerie & Recouvrement</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <span>Cockpit Financier</span>
              <span className="text-xs font-semibold text-slate-400 bg-white/[0.05] border border-white/[0.08] px-2.5 py-1 rounded-lg">
                {academicYear}
              </span>
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              {schoolName} · Analyse consolidée des flux d&apos;encaissements et des engagements financiers.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`${basePath}/paiements`}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 text-xs font-semibold transition-colors"
            >
              <Receipt size={14} className="text-slate-400" />
              <span>Historique Reçus</span>
            </Link>
            <Link
              href={`${basePath}/impayes`}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 text-xs font-semibold transition-colors"
            >
              <AlertTriangle size={14} className="text-rose-400" />
              <span>{stats.overdueCount} Impayés</span>
            </Link>
          </div>
        </div>

        {/* ── SECTION HAUTE : SWAP EXPRESS (GAUCHE) & DIAPORAMA MÉTRIQUES (DROITE) ── */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-5">

          {/* CARTE GAUCHE : SIMULATEUR D'ENCAISSEMENT EXPRESS (STYLE "SWAP" NODEKA) */}
          <div className="lg:col-span-5 bg-[#121724]/90 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col justify-between relative overflow-hidden group hover:border-white/15 transition-all duration-300">
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#FF5B4F]/10 rounded-full blur-3xl pointer-events-none group-hover:bg-[#FF5B4F]/15 transition-all duration-500" />
            
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#FF5B4F]/15 border border-[#FF5B4F]/25 flex items-center justify-center text-[#FF5B4F]">
                    <ArrowLeftRight size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-tight">Encaissement Express</h3>
                    <p className="text-[11px] text-slate-400 font-medium">Préparer & simuler un versement</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-[#FF7A50] bg-[#FF5B4F]/10 border border-[#FF5B4F]/20 px-2 py-0.5 rounded-full">
                  Guichet actif
                </span>
              </div>

              {/* Champ 1 : Montant du versement */}
              <div className="bg-[#0A0D15] border border-white/[0.08] rounded-xl p-3.5 mb-2 relative">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 mb-1">
                  <span>Montant perçu</span>
                  <span className="text-emerald-400 font-bold">Devise : FCFA</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <input
                    type="number"
                    value={simAmount}
                    onChange={(e) => setSimAmount(Math.max(0, Number(e.target.value) || 0))}
                    className="bg-transparent text-xl sm:text-2xl font-black text-white tracking-tight focus:outline-none w-full tabular-nums"
                    placeholder="0"
                  />
                  <span className="text-xs font-bold text-slate-300 bg-white/[0.06] border border-white/10 px-2.5 py-1 rounded-lg shrink-0">
                    FCFA
                  </span>
                </div>
              </div>

              {/* Bouton transfert central décoratif */}
              <div className="flex justify-center -my-2.5 relative z-10">
                <div className="w-8 h-8 rounded-full bg-[#181F30] border border-white/10 flex items-center justify-center text-slate-300 shadow-md group-hover:rotate-180 transition-transform duration-500">
                  <ArrowLeftRight size={14} className="text-[#FF7A50]" />
                </div>
              </div>

              {/* Champ 2 : Affectation / Motif */}
              <div className="bg-[#0A0D15] border border-white/[0.08] rounded-xl p-3.5 mt-2">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 mb-1">
                  <span>Affectation / Échéance</span>
                  <span className="text-slate-400">Catégorie</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <select
                    value={simCategory}
                    onChange={(e) => setSimCategory(e.target.value)}
                    className="bg-transparent text-sm font-bold text-white focus:outline-none w-full cursor-pointer"
                  >
                    {feeTypes.length > 0 ? (
                      feeTypes.map(f => (
                        <option key={f.id} value={f.label} className="bg-[#121724] text-white">
                          {f.label} ({formatCFA(f.amount)})
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="Scolarité Trimestre 1" className="bg-[#121724] text-white">Scolarité Trimestre 1</option>
                        <option value="Frais d'inscription" className="bg-[#121724] text-white">Frais d&apos;inscription</option>
                        <option value="Cantine Scolaire" className="bg-[#121724] text-white">Cantine Scolaire</option>
                        <option value="Transport & Activités" className="bg-[#121724] text-white">Transport & Activités</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              {/* Impact calculé en direct */}
              <div className="mt-3 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.05] flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Reste dû estimé après versement</span>
                <span className="font-bold text-white tabular-nums">
                  {formatCFA(Math.max(0, stats.reste - simAmount))}
                </span>
              </div>
            </div>

            {/* Bouton d'action vibrant (dégradé corail/orange comme dans Nodeka) */}
            <Link
              href={`${basePath}/caisse`}
              className="mt-5 w-full py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#FF5B4F] via-[#FF7A50] to-[#FFA74F] hover:from-[#FF483B] hover:to-[#FF953A] shadow-[0_8px_25px_rgba(255,91,79,0.35)] hover:shadow-[0_12px_32px_rgba(255,91,79,0.5)] active:scale-[0.99] transition-all flex items-center justify-center gap-2 group/btn"
            >
              <Banknote size={17} className="group-hover/btn:scale-110 transition-transform" />
              <span>Ouvrir la Caisse & Encaisser</span>
              <ArrowRight size={15} className="group-hover/btn:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* CARTE DROITE : DIAPORAMA / CARROUSEL DES MÉTRIQUES CLÉS (STYLE "TRENDING COIN") */}
          <div
            className="lg:col-span-7 bg-[#121724]/90 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col justify-between relative overflow-hidden"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {/* Header du diaporama */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">Indicateurs de Trésorerie</h3>
                  <p className="text-[11px] text-slate-400 font-medium">Diaporama interactif des métriques clés</p>
                </div>
              </div>

              {/* Boutons flèches de navigation du diaporama */}
              <div className="flex items-center gap-1.5 bg-[#0A0D15] border border-white/[0.08] p-1 rounded-xl">
                <button
                  onClick={() => setActiveSlide(prev => (prev - 1 + carouselItems.length) % carouselItems.length)}
                  className="w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                  aria-label="Diapositive précédente"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setActiveSlide(prev => (prev + 1) % carouselItems.length)}
                  className="w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                  aria-label="Diapositive suivante"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Cartes du Diaporama (Affichage des 3 cartes avec mise en valeur de la diapositive active) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 my-2">
              {carouselItems.slice(0, 4).map((item, idx) => {
                const Icon = item.icon
                const isSelected = activeSlide === idx
                return (
                  <div
                    key={item.id}
                    onClick={() => setActiveSlide(idx)}
                    className={`cursor-pointer rounded-xl p-4 transition-all duration-300 relative overflow-hidden border ${
                      isSelected
                        ? 'bg-[#182033] border-white/20 shadow-[0_8px_25px_rgba(0,0,0,0.5)] scale-[1.02]'
                        : 'bg-[#0A0D15]/80 border-white/[0.06] hover:border-white/15 opacity-85 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full border ${item.badgeBg}`}>
                        {item.tag}
                      </span>
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${item.accent} flex items-center justify-center text-white shadow-md`}>
                        <Icon size={15} />
                      </div>
                    </div>

                    <p className="text-xs font-semibold text-slate-400">{item.title}</p>
                    <p className="text-xl sm:text-2xl font-black text-white tracking-tight tabular-nums mt-1">
                      {item.value}
                    </p>

                    <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 border-t border-white/[0.05] pt-2">
                      <span className="truncate">{item.sub}</span>
                      <Link
                        href={item.linkHref}
                        className="text-emerald-400 hover:text-emerald-300 font-bold inline-flex items-center gap-0.5 shrink-0"
                      >
                        {item.linkText} <ArrowRight size={11} />
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Indicateurs de points du diaporama */}
            <div className="flex items-center justify-center gap-1.5 pt-3">
              {carouselItems.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveSlide(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    activeSlide === i ? 'w-6 bg-gradient-to-r from-emerald-400 to-cyan-400' : 'w-1.5 bg-white/20 hover:bg-white/40'
                  }`}
                  aria-label={`Aller au slide ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ── SECTION MOYENNE (STYLE NODEKA MIDDLE ROW) : GRAPHIQUE LUMINEUX, STATS & JAUGE ── */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-5">

          {/* CARTE 1 : COURBE LUMINEUSE DES FLUX MENSUELS (STYLE "EXCHANGE OFFER" NODEKA) */}
          <div className="lg:col-span-5 bg-[#121724]/90 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-5 shadow-xl flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3 border-b border-white/[0.06] pb-3">
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight">Courbe de Trésorerie</h3>
                <p className="text-[11px] text-slate-400">Attendu vs Encaissé par mois</p>
              </div>
              <div className="flex items-center gap-1 bg-[#0A0D15] p-1 rounded-lg border border-white/[0.06]">
                <button
                  onClick={() => setChartType('area')}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-colors ${
                    chartType === 'area' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Courbe
                </button>
                <button
                  onClick={() => setChartType('bar')}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-colors ${
                    chartType === 'bar' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Barres
                </button>
              </div>
            </div>

            <div className="h-[230px] w-full">
              {chartData.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <p className="text-xs text-slate-400">Aucun flux enregistré pour cette période</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === 'area' ? (
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                      <defs>
                        <linearGradient id="glowEncaisse" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.45} />
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="glowAttendu" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#FF5B4F" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#FF5B4F" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={compact} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0A0D15',
                          borderRadius: '12px',
                          border: '1px solid rgba(255,255,255,0.12)',
                          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                          fontSize: '12px',
                          color: '#fff',
                        }}
                        formatter={(val: any) => formatCFA(Number(val))}
                      />
                      <Area type="monotone" dataKey="attendu" name="Attendu" stroke="#FF5B4F" strokeWidth={2} fillOpacity={1} fill="url(#glowAttendu)" />
                      <Area type="monotone" dataKey="encaisse" name="Encaissé" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#glowEncaisse)" />
                    </AreaChart>
                  ) : (
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={compact} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0A0D15',
                          borderRadius: '12px',
                          border: '1px solid rgba(255,255,255,0.12)',
                          fontSize: '12px',
                          color: '#fff',
                        }}
                        formatter={(val: any) => formatCFA(Number(val))}
                      />
                      <Bar dataKey="attendu" name="Attendu" fill="rgba(255,91,79,0.6)" radius={[4, 4, 0, 0]} barSize={12} />
                      <Bar dataKey="encaisse" name="Encaissé" fill="#10B981" radius={[4, 4, 0, 0]} barSize={12} />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              )}
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-white/[0.05]">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#FF5B4F]" />Attendu</span>
                <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#10B981]" />Encaissé</span>
              </div>
              <span className="font-semibold text-white tabular-nums">{formatCFA(stats.encaisse)}</span>
            </div>
          </div>

          {/* CARTE 2 : VENTILATION DES FRAIS (STYLE "POOL STATISTIC" NODEKA) */}
          <div className="lg:col-span-4 bg-[#121724]/90 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-5 shadow-xl flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3 border-b border-white/[0.06] pb-3">
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight">Grille des Frais</h3>
                <p className="text-[11px] text-slate-400">Rubriques tarifaires actives</p>
              </div>
              <Link
                href={`${basePath}/frais`}
                className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1"
              >
                Configurer <ExternalLink size={11} />
              </Link>
            </div>

            <div className="space-y-3 my-auto py-1">
              {feeTypes.length > 0 ? (
                feeTypes.slice(0, 4).map((f) => (
                  <div key={f.id} className="bg-[#0A0D15]/60 border border-white/[0.05] rounded-xl p-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white">{f.label}</span>
                      <span className="font-black text-emerald-400 tabular-nums">{formatCFA(f.amount)}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                      <span className="capitalize">{f.periodicity}</span>
                      <span className="uppercase text-slate-500">{f.target}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] text-center">
                  <p className="text-xs text-slate-400">Aucun type de frais personnalisé enregistré.</p>
                  <Link
                    href={`${basePath}/frais`}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-emerald-400 hover:underline"
                  >
                    Ajouter un frais scolaire <ArrowRight size={12} />
                  </Link>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-white/[0.05] flex items-center justify-between text-[11px] text-slate-400">
              <span>Total rubriques actives</span>
              <span className="font-bold text-white">{feeTypes.length} tarif(s)</span>
            </div>
          </div>

          {/* CARTE 3 : JAUGE RADIALE DE SANTÉ FINANCIÈRE (STYLE "GREED INDEX" DE NODEKA) */}
          <div className="lg:col-span-3 bg-[#121724]/90 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-5 shadow-xl flex flex-col justify-between relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight">Indice Recouvrement</h3>
                <p className="text-[11px] text-slate-400">Santé de trésorerie</p>
              </div>
              <Link
                href={`${basePath}/impayes`}
                className="text-[10px] font-bold text-slate-400 hover:text-white transition-colors"
              >
                Détails
              </Link>
            </div>

            {/* Arc SVG semi-circulaire Speedometer */}
            <div className="flex flex-col items-center justify-center my-auto py-2 relative">
              <svg width="180" height="105" viewBox="0 0 180 105" className="overflow-visible">
                {/* Arc d'arrière-plan */}
                <path
                  d="M 22 90 A 68 68 0 0 1 158 90"
                  fill="none"
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth="12"
                  strokeLinecap="round"
                />
                {/* Arc de valeur avec dégradé */}
                <defs>
                  <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#FF5B4F" />
                    <stop offset="50%" stopColor="#F59E0B" />
                    <stop offset="100%" stopColor="#10B981" />
                  </linearGradient>
                </defs>
                <path
                  d="M 22 90 A 68 68 0 0 1 158 90"
                  fill="none"
                  stroke="url(#gaugeGradient)"
                  strokeWidth="12"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeOffset}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>

              {/* Texte central dans la jauge */}
              <div className="absolute bottom-1 flex flex-col items-center">
                <span className="text-3xl font-black text-white tracking-tight tabular-nums leading-none">
                  {stats.taux}%
                </span>
                <span className={`text-[10px] font-bold uppercase tracking-widest mt-1.5 px-2 py-0.5 rounded-full border ${healthState.badge}`}>
                  {healthState.label}
                </span>
              </div>
            </div>

            {/* Pied de la jauge */}
            <div className="pt-2 border-t border-white/[0.05] flex items-center justify-between text-[10px] text-slate-400">
              <span>0% (Critique)</span>
              <span>100% (Clôturé)</span>
            </div>
          </div>

        </div>

        {/* ── SECTION BASSE : FLUX EN DIRECT DES TRANSACTIONS RÉCENTES (STYLE "PRICE" TABLE DE NODEKA) ── */}
        <div className="relative z-10 bg-[#121724]/90 backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-xl overflow-hidden">
          
          <div className="p-5 sm:p-6 border-b border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
                <Receipt size={17} />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  Flux des Récents Encaissements
                </h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Journal en direct des versements enregistrés à la caisse
                </p>
              </div>
            </div>

            <Link
              href={`${basePath}/paiements`}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-bold text-slate-300 hover:text-white transition-colors self-start sm:self-auto"
            >
              <span>Voir tout l&apos;historique</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <div className="overflow-x-auto">
            {payments.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center px-4">
                <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-slate-500 mb-3">
                  <Banknote size={22} />
                </div>
                <p className="text-sm font-bold text-slate-300">Aucun encaissement enregistré</p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">
                  Les paiements enregistrés au guichet de caisse apparaîtront instantanément dans ce flux en direct.
                </p>
                <Link
                  href={`${basePath}/caisse`}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors"
                >
                  <Banknote size={14} />
                  <span>Encaisser un premier versement</span>
                </Link>
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06] text-slate-400 font-bold uppercase tracking-wider text-[10px] bg-white/[0.01]">
                    <th className="py-3 px-5">Élève & Classe</th>
                    <th className="py-3 px-5">Motif / Échéance</th>
                    <th className="py-3 px-5">Montant Encaissé</th>
                    <th className="py-3 px-5">Mode de Paiement</th>
                    <th className="py-3 px-5">Date d&apos;Encaissement</th>
                    <th className="py-3 px-5 text-right">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {payments.slice(0, 7).map((p, idx) => {
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
                      <tr key={p.id || idx} className="hover:bg-white/[0.03] transition-colors group">
                        
                        {/* Élève */}
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-[11px] font-black text-emerald-400 shrink-0">
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-white group-hover:text-emerald-300 transition-colors truncate">
                                {studentName}
                              </p>
                              <p className="text-[10px] text-slate-400 font-medium">
                                {className}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Motif */}
                        <td className="py-3.5 px-5 font-medium text-slate-300">
                          {p.schedule?.label || 'Frais de scolarité'}
                        </td>

                        {/* Montant */}
                        <td className="py-3.5 px-5 font-black text-emerald-400 tabular-nums text-sm">
                          {formatCFA(p.amount)}
                        </td>

                        {/* Mode de paiement */}
                        <td className="py-3.5 px-5">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08] text-slate-300 text-[11px] font-semibold capitalize">
                            {method.includes('mobile') || method.includes('momo') || method.includes('wave') ? (
                              <Smartphone size={12} className="text-cyan-400" />
                            ) : method.includes('virement') || method.includes('banque') ? (
                              <Building size={12} className="text-violet-400" />
                            ) : (
                              <Banknote size={12} className="text-emerald-400" />
                            )}
                            <span>{p.payment_method || 'Espèces'}</span>
                          </span>
                        </td>

                        {/* Date */}
                        <td className="py-3.5 px-5 text-slate-400 font-medium">
                          {dateFormatted}
                        </td>

                        {/* Statut avec pastille verte */}
                        <td className="py-3.5 px-5 text-right">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span>Confirmé</span>
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

    </div>
  )
}
