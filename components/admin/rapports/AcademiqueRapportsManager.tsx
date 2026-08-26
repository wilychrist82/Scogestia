'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { ExportButtons } from '@/components/ui/ExportButtons'
import Link from 'next/link'

type ClassStat = {
  id: string
  name: string
  totalStudents: number
  successRate: number
  classAverage: number
}

type Props = {
  classStats: ClassStat[]
}

export function AcademiqueRapportsManager({ classStats }: Props) {
  
  // Prepare data for ExportButtons
  const exportData = classStats.map(c => ({
    Classe: c.name,
    'Effectif Évalué': c.totalStudents,
    'Moyenne de Classe': c.classAverage,
    'Taux de Réussite (%)': c.successRate
  }))

  const headers = [
    { key: 'Classe', label: 'Classe' },
    { key: 'Effectif Évalué', label: 'Effectif Évalué' },
    { key: 'Moyenne de Classe', label: 'Moyenne de Classe' },
    { key: 'Taux de Réussite (%)', label: 'Taux de Réussite (%)' }
  ]

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-[var(--color-surface)]">
      <div className="max-w-[1280px] mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[var(--color-surface-container-lowest)] p-6 rounded-xl border border-[var(--color-outline-variant)] print:shadow-none print:border-none print:p-0">
          <div>
            <div className="flex items-center gap-2 text-[var(--color-on-surface-variant)] mb-2 print:hidden">
              <Link href="/admin/rapports" className="hover:text-[var(--color-primary)]">Rapports</Link>
              <span className="text-[var(--color-on-surface-variant)]">/</span>
              <span className="text-sm font-semibold text-[var(--color-on-surface)]">Académique</span>
            </div>
            <h2 className="text-3xl font-bold text-[var(--color-on-surface)]">Rapports Académiques</h2>
            <p className="text-base text-[var(--color-on-surface-variant)] mt-1">Analyse des performances et taux de réussite par classe.</p>
          </div>
          <ExportButtons data={exportData} filename="rapports_academiques" headers={headers} />
        </div>

        {/* Charts */}
        <div className="bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-outline-variant)] p-6 shadow-sm min-h-[400px] flex flex-col">
          <h3 className="font-bold text-[var(--color-on-surface)] mb-6 text-lg">Taux de Réussite par Classe (%)</h3>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={classStats}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} domain={[0, 100]} />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="successRate" name="Taux de réussite (%)" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-outline-variant)] shadow-sm overflow-hidden">
          <div className="p-4 border-b border-[var(--color-outline-variant)] bg-[var(--color-surface-bright)]">
            <h3 className="font-bold text-[var(--color-on-surface)] flex items-center gap-2">
              <span className="material-symbols-outlined text-[var(--color-on-surface-variant)]">table</span>
              Détails par classe
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--color-surface)] border-b border-[var(--color-outline-variant)]">
                  <th className="p-4 text-sm font-semibold text-[var(--color-on-surface-variant)]">Classe</th>
                  <th className="p-4 text-sm font-semibold text-[var(--color-on-surface-variant)]">Effectif Évalué</th>
                  <th className="p-4 text-sm font-semibold text-[var(--color-on-surface-variant)]">Moyenne de Classe</th>
                  <th className="p-4 text-sm font-semibold text-[var(--color-on-surface-variant)]">Taux de Réussite</th>
                </tr>
              </thead>
              <tbody>
                {classStats.length > 0 ? (
                  classStats.map(stat => (
                    <tr key={stat.id} className="border-b border-[var(--color-outline-variant)] hover:bg-[var(--color-surface-bright)] transition-colors">
                      <td className="p-4 text-sm font-semibold text-[var(--color-on-surface)]">{stat.name}</td>
                      <td className="p-4 text-sm text-[var(--color-on-surface-variant)]">{stat.totalStudents}</td>
                      <td className="p-4 text-sm text-[var(--color-on-surface)] font-medium">
                        <span className={`px-2 py-1 rounded-md text-xs font-bold ${stat.classAverage >= 10 ? 'bg-[#e6f4ea] text-[#1e8e3e]' : 'bg-[#fce8e6] text-[#d93025]'}`}>
                          {stat.classAverage.toFixed(2)} / 20
                        </span>
                      </td>
                      <td className="p-4 text-sm text-[var(--color-on-surface)] font-medium">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-200 rounded-full h-1.5">
                            <div className={`h-1.5 rounded-full ${stat.successRate >= 50 ? 'bg-[var(--color-primary)]' : 'bg-red-500'}`} style={{ width: `${stat.successRate}%` }}></div>
                          </div>
                          <span>{stat.successRate.toFixed(1)}%</span>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-[var(--color-on-surface-variant)]">
                      Aucune donnée académique disponible.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}
