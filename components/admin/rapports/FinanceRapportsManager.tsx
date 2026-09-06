'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Cell } from 'recharts'
import { ExportButtons } from '@/components/ui/ExportButtons'
import Link from 'next/link'

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
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[var(--color-surface-container-lowest)] p-6 rounded-xl border border-[var(--color-outline-variant)] print:shadow-none print:border-none print:p-0">
          <div>
            <div className="flex items-center gap-2 text-[var(--color-on-surface-variant)] mb-2 print:hidden">
              <Link href="/admin/rapports" className="hover:text-[var(--color-primary)]">Rapports</Link>
              <span className="text-[var(--color-on-surface-variant)]">/</span>
              <span className="text-sm font-semibold text-[var(--color-on-surface)]">Finance</span>
            </div>
            <h2 className="text-3xl font-bold text-[var(--color-on-surface)]">Bilans Financiers</h2>
            <p className="text-base text-[var(--color-on-surface-variant)] mt-1">Analyse des encaissements et évolution du chiffre d'affaires.</p>
          </div>
          <ExportButtons data={exportData} filename="bilan_financier" headers={exportHeaders} />
        </div>

        {/* KPI */}
        <div className="bg-gradient-to-r from-[var(--color-primary)] to-[#147a63] rounded-xl p-6 shadow-lg text-white flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-[var(--color-primary-container)]">Total des encaissements sur la période</h3>
            <p className="text-4xl font-black mt-1">{formatFCFA(totalCollected)}</p>
          </div>
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-[32px]">account_balance_wallet</span>
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
                  <span className="material-symbols-outlined text-4xl mb-2">show_chart</span>
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
                  <span className="material-symbols-outlined text-4xl mb-2">bar_chart</span>
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
