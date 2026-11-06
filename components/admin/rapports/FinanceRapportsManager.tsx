'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Cell } from 'recharts'
import { ExportButtons } from '@/components/ui/ExportButtons'
import Link from 'next/link'
import { RapportsNavTabs } from './RapportsNavTabs'
import { Wallet, TrendingUp, BarChart3 } from 'lucide-react'

type MonthlyData = {
  month: string
  rawMonth: string
  amount: number
}

type ClassData = {
  name: string
  amount: number
}

type Props = {
  monthlyData: MonthlyData[]
  classData: ClassData[]
  totalCollected: number
}

export function FinanceRapportsManager({ monthlyData, classData, totalCollected }: Props) {
  
  const COLORS = [
    '#4285F4', '#DB4437', '#F4B400', '#0F9D58', '#AB47BC', 
    '#00ACC1', '#FF7043', '#9E9D24', '#5C6BC0', '#F06292'
  ]
  
  // Format data for export
  const exportData = monthlyData.map(m => ({
    Mois: m.month,
    'Montant Encaissé (F CFA)': m.amount
  }))

  const exportHeaders = [
    { key: 'Mois', label: 'Mois' },
    { key: 'Montant Encaissé (F CFA)', label: 'Montant Encaissé (F CFA)' }
  ]

  const formatFCFA = (value: number) => {
    return value.toLocaleString('fr-FR') + ' F'
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-[var(--color-surface)]">
      <div className="max-w-[1280px] mx-auto space-y-6">
        
        {/* Navigation Tabs */}
        <div className="print:hidden">
          <RapportsNavTabs />
        </div>

        {/* En-tête Exécutif — Stripe Royal Indigo & Sapphire */}
        <div className="relative flex flex-col justify-between gap-5 overflow-hidden rounded-2xl bg-gradient-to-r from-[#1E293B] via-[#312E81] to-[#4338CA] px-6 py-5 text-white shadow-[0_14px_34px_-12px_rgba(67,56,202,0.45)] ring-1 ring-indigo-400/25 sm:px-7 sm:py-6 lg:flex-row lg:items-center print:shadow-none print:border-none print:p-0">
          <div aria-hidden className="pointer-events-none absolute inset-0 print:hidden">
            <div className="absolute -right-12 -top-16 h-56 w-56 rounded-full bg-indigo-400/25 blur-3xl" />
            <div className="absolute -bottom-20 left-1/3 h-48 w-72 rounded-full bg-sky-400/15 blur-3xl" />
          </div>
          <div className="relative z-10">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-indigo-50 ring-1 ring-inset ring-white/25 backdrop-blur-md print:hidden">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-300" />
              Rapports · Bilans Financiers
            </div>
            <h2 className="text-xl font-extrabold tracking-tight text-white sm:text-2xl print:text-black">Bilans Financiers</h2>
            <p className="mt-1 text-[13px] font-medium text-indigo-100/90 sm:text-sm print:text-gray-600">Analyse des encaissements et évolution du chiffre d'affaires.</p>
          </div>
          <div className="relative z-10">
            <ExportButtons data={exportData} filename="bilan_financier" headers={exportHeaders} />
          </div>
        </div>

        {/* KPI */}
        <div className="bg-gradient-to-r from-[var(--color-primary)] to-[#147a63] rounded-xl p-6 shadow-lg text-white flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-[var(--color-primary-container)]">Total des encaissements sur la période</h3>
            <p className="text-4xl font-black mt-1">{formatFCFA(totalCollected)}</p>
          </div>
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
            <Wallet className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-10">
          
          <div className="bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-outline-variant)] p-6 shadow-sm min-h-[400px] flex flex-col">
            <h3 className="font-bold text-[var(--color-on-surface)] mb-6 text-lg">Évolution Mensuelle des Encaissements</h3>
            <div className="flex-1 min-h-[300px] flex items-center justify-center">
              {monthlyData && monthlyData.some(d => d.amount > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} tickFormatter={(val) => `${val / 1000}k`} />
                    <Tooltip 
                      cursor={{ stroke: 'var(--color-outline)' }} 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: any) => [formatFCFA(Number(value)), 'Encaissé']}
                    />
                    <Line type="monotone" dataKey="amount" stroke="var(--color-primary)" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-[var(--color-on-surface-variant)] opacity-60 flex flex-col items-center">
                  <TrendingUp className="w-10 h-10 mb-2 opacity-50" />
                  <p className="text-sm font-medium">Aucun encaissement à afficher pour l'évolution</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-outline-variant)] p-6 shadow-sm min-h-[400px] flex flex-col">
            <h3 className="font-bold text-[var(--color-on-surface)] mb-6 text-lg">Répartition par Classe</h3>
            <div className="flex-1 min-h-[300px] flex items-center justify-center">
              {classData && classData.some(d => d.amount > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={classData} layout="vertical" margin={{ left: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e0e0e0" />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} tickFormatter={(val) => `${val / 1000}k`} />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                    <Tooltip 
                      cursor={{ fill: 'transparent' }} 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: any) => [formatFCFA(Number(value)), 'Encaissé']}
                    />
                    <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                      {classData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-[var(--color-on-surface-variant)] opacity-60 flex flex-col items-center">
                  <BarChart3 className="w-10 h-10 mb-2 opacity-50" />
                  <p className="text-sm font-medium">Aucun encaissement par classe</p>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}
