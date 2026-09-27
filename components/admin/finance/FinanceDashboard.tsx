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

type Schedule = {
  amount_due: number
  status: string
  due_date: string
}

type Payment = {
  amount: number
  paid_at: string
}

type Props = {
  schedules: Schedule[]
  payments: Payment[]
}

export function FinanceDashboard({ schedules, payments, basePath = "/admin/finance" }: Props & { basePath?: string }) {
  const { totalAttendu, totalEncaisse, resteARecouvrer, tauxRecouvrement, paiementsDuJour, impayes } = useMemo(() => {
    const attendu = schedules.reduce((acc, curr) => acc + Number(curr.amount_due), 0)
    const encaisse = payments.reduce((acc, curr) => acc + Number(curr.amount), 0)
    const reste = Math.max(0, attendu - encaisse)
    const taux = attendu > 0 ? Math.round((encaisse / attendu) * 100) : 0
    
    const today = new Date().toISOString().split('T')[0]
    const paiementsJour = payments
      .filter(p => p.paid_at.startsWith(today))
      .reduce((acc, curr) => acc + Number(curr.amount), 0)

    // Approximation of impayés (total of schedules that are overdue)
    const impayesTotal = schedules
      .filter(s => s.status === 'en_retard' || (s.due_date < today && s.status !== 'paye'))
      .reduce((acc, curr) => acc + Number(curr.amount_due), 0) // In reality, we should subtract the paid amount for these schedules

    return {
      totalAttendu: attendu,
      totalEncaisse: encaisse,
      resteARecouvrer: reste,
      tauxRecouvrement: taux,
      paiementsDuJour: paiementsJour,
      impayes: impayesTotal
    }
  }, [schedules, payments])

  // Données réelles groupées par mois (basées sur les vrais paiements)
  const chartData = useMemo(() => {
    const monthLabels = ['Janv', 'Févr', 'Mars', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc']
    const monthlyEncaisse: Record<number, number> = {}
    payments.forEach(p => {
      if (!p.paid_at) return
      const month = new Date(p.paid_at).getMonth()
      monthlyEncaisse[month] = (monthlyEncaisse[month] || 0) + Number(p.amount)
    })
    return monthLabels.map((name, i) => ({
      name,
      attendu: Math.round(totalAttendu / 12),
      encaisse: monthlyEncaisse[i] || 0,
    })).filter(d => d.encaisse > 0 || d.attendu > 0).slice(0, 6)
  }, [payments, totalAttendu])

  const formatCFA = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(amount).replace('XOF', 'FCFA')
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-[var(--color-surface)]">
      <div className="max-w-[1280px] mx-auto space-y-6">
        
        {/* Top Header Premium */}
        <div className="relative overflow-hidden rounded-[1.5rem] bg-[#070b14] p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 border border-white/[0.06] shadow-2xl">
          <div className="absolute -top-12 -left-12 w-60 h-60 bg-emerald-500/12 rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute -bottom-8 right-20 w-48 h-48 bg-violet-500/10 rounded-full blur-[60px] pointer-events-none" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1 mb-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400">Finance</p>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight tracking-tight">Tableau de Bord Financier</h2>
            <p className="text-white/40 text-sm mt-1.5 font-medium">Supervisez les encaissements, échéances et impayés.</p>
          </div>
          <div className="relative z-10 flex gap-2.5">
            <Link href={`${basePath}/paiements`} className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white h-11 px-5 rounded-xl text-sm font-bold active:scale-95 transition-all duration-300 shadow-lg shadow-emerald-500/25"
              style={{ transitionTimingFunction: 'cubic-bezier(0.32,0.72,0,1)' }}>
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              Encaisser
            </Link>
          </div>
        </div>



        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[var(--color-surface-container-lowest)] p-6 rounded-xl border border-[var(--color-outline-variant)] flex flex-col justify-between hover:shadow-md hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center gap-3 mb-4 text-[var(--color-on-surface-variant)]">
              <span className="material-symbols-outlined text-[24px]">account_balance_wallet</span>
              <h3 className="font-semibold text-sm uppercase tracking-wide">Total Attendu</h3>
            </div>
            <p className="text-2xl font-bold text-[var(--color-on-surface)]">{formatCFA(totalAttendu)}</p>
          </div>

          <div className="bg-[var(--color-primary)] p-6 rounded-xl shadow flex flex-col justify-between relative overflow-hidden text-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
              <span className="material-symbols-outlined text-9xl">savings</span>
            </div>
            <div className="flex items-center gap-3 mb-4 relative z-10">
              <span className="material-symbols-outlined text-[24px]">done_all</span>
              <h3 className="font-semibold text-sm uppercase tracking-wide text-white/90">Total Encaissé</h3>
            </div>
            <div className="relative z-10 flex items-end justify-between">
              <p className="text-3xl font-bold">{formatCFA(totalEncaisse)}</p>
              <div className="bg-white/20 px-3 py-1 rounded-full text-sm font-bold ">
                {tauxRecouvrement}%
              </div>
            </div>
          </div>

          <div className="bg-[var(--color-surface-container-lowest)] p-6 rounded-xl border border-[var(--color-outline-variant)] flex flex-col justify-between hover:shadow-md hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center gap-3 mb-4 text-[var(--color-on-surface-variant)]">
              <span className="material-symbols-outlined text-[24px]">pending_actions</span>
              <h3 className="font-semibold text-sm uppercase tracking-wide">Reste à recouvrer</h3>
            </div>
            <p className="text-2xl font-bold text-[var(--color-on-surface)]">{formatCFA(resteARecouvrer)}</p>
          </div>

          <div className="bg-[#fff0f0] p-6 rounded-xl border border-[#ffd6d6] flex flex-col justify-between hover:shadow-md hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center gap-3 mb-4 text-[var(--color-status-retard-text)]">
              <span className="material-symbols-outlined text-[24px]">warning</span>
              <h3 className="font-semibold text-sm uppercase tracking-wide">Impayés / Retards</h3>
            </div>
            <p className="text-2xl font-bold text-[var(--color-status-retard-text)]">{formatCFA(impayes)}</p>
          </div>
        </div>

        {/* Charts & Details Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Chart */}
          <div className="lg:col-span-2 bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-[var(--color-on-surface)]">Recouvrement des paiements</h3>
              <select className="bg-[var(--color-surface-bright)] border border-[var(--color-outline-variant)] text-sm rounded-lg px-3 py-1.5 outline-none">
                <option>Cette année</option>
                <option>Année précédente</option>
              </select>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} tickFormatter={(val) => `${val / 1000000}M`} />
                  <Tooltip 
                    cursor={{fill: '#f1f5f9'}}
                    contentStyle={{borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                    formatter={(value: any) => [formatCFA(value), undefined]}
                  />
                  <Bar dataKey="attendu" name="Attendu" fill="#cbd5e1" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar dataKey="encaisse" name="Encaissé" fill="var(--color-primary)" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Side Panel */}
          <div className="flex flex-col gap-6">
            <div className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-[var(--color-on-surface)] mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[var(--color-primary)]">today</span>
                Aujourd'hui
              </h3>
              <div className="flex justify-between items-end border-b border-[var(--color-outline-variant)] pb-4 mb-4">
                <span className="text-[var(--color-on-surface-variant)] text-sm font-medium">Encaissé ce jour</span>
                <span className="text-xl font-bold text-[var(--color-on-surface)]">{formatCFA(paiementsDuJour)}</span>
              </div>
              <Link href={`${basePath}/paiements`} className="text-[var(--color-primary)] text-sm font-semibold flex items-center justify-center gap-1 hover:underline">
                Voir les paiements du jour
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Link>
            </div>

            <div className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-xl p-6 shadow-sm flex-1">
              <h3 className="text-lg font-bold text-[var(--color-on-surface)] mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[var(--color-primary)]">bolt</span>
                Actions Rapides
              </h3>
              <div className="flex flex-col gap-3">
                <Link href={`${basePath}/echeances`} className="flex items-center gap-3 p-3 rounded-lg border border-[var(--color-outline-variant)] hover:border-[var(--color-primary)] hover:bg-[#eff4ff] hover:shadow-sm hover:-translate-y-0.5 transition-all duration-300 group">
                  <div className="h-10 w-10 rounded-full bg-[var(--color-surface-bright)] flex items-center justify-center group-hover:bg-white group-hover:text-[var(--color-primary)] text-[var(--color-on-surface-variant)] transition-colors">
                    <span className="material-symbols-outlined">receipt_long</span>
                  </div>
                  <span className="font-medium text-sm text-[var(--color-on-surface)] group-hover:text-[var(--color-primary)] transition-colors">Générer des échéances</span>
                </Link>
                <Link href={`${basePath}/impayes`} className="flex items-center gap-3 p-3 rounded-lg border border-[var(--color-outline-variant)] hover:border-[var(--color-status-retard-text)] hover:bg-[#fff0f0] hover:shadow-sm hover:-translate-y-0.5 transition-all duration-300 group">
                  <div className="h-10 w-10 rounded-full bg-[var(--color-surface-bright)] flex items-center justify-center group-hover:bg-white group-hover:text-[var(--color-status-retard-text)] text-[var(--color-on-surface-variant)] transition-colors">
                    <span className="material-symbols-outlined">notification_important</span>
                  </div>
                  <span className="font-medium text-sm text-[var(--color-on-surface)] group-hover:text-[var(--color-status-retard-text)] transition-colors">Relancer les impayés</span>
                </Link>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}
