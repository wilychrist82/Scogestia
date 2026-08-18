'use client'

import Link from 'next/link'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

type Props = {
  totalStudents: number
  totalClasses: number
  totalExpected: number
  totalCollected: number
  attendanceRate: number // percentage
  studentsByClass: { name: string; count: number }[]
}

const COLORS = ['#0C4A3E', '#147a63', '#1e8e3e', '#34a853', '#81c995', '#b3e5fc', '#81d4fa', '#4fc3f7', '#29b6f6', '#03a9f4']

export function RapportsManager({ totalStudents, totalClasses, totalExpected, totalCollected, attendanceRate, studentsByClass }: Props) {
  
  const recoveryRate = totalExpected > 0 ? (totalCollected / totalExpected) * 100 : 0

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-[var(--color-surface)]">
      <div className="max-w-[1280px] mx-auto space-y-6">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[var(--color-surface-container-lowest)] p-6 rounded-xl border border-[var(--color-outline-variant)] print:shadow-none print:border-none print:p-0">
          <div>
            <div className="flex items-center gap-2 text-[var(--color-on-surface-variant)] mb-2 print:hidden">
              <span className="text-sm font-semibold text-[var(--color-on-surface)]">Rapports</span>
            </div>
            <h2 className="text-3xl font-bold text-[var(--color-on-surface)]">Rapport Global</h2>
            <p className="text-base text-[var(--color-on-surface-variant)] mt-1">Synthèse des effectifs, de la finance et de l'assiduité.</p>
          </div>
          <button onClick={() => window.print()} className="print:hidden flex items-center justify-center gap-2 bg-[var(--color-primary)] text-white h-12 px-6 rounded-full text-sm font-semibold hover:opacity-90 transition-colors shadow-sm w-full sm:w-auto shrink-0">
            <span className="material-symbols-outlined text-[20px]">print</span>
            Exporter PDF
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-[var(--color-surface-container-lowest)] p-6 rounded-xl border border-[var(--color-outline-variant)] shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-[#e8f0fe] text-[#1a73e8] flex items-center justify-center">
                <span className="material-symbols-outlined">group</span>
              </div>
              <h3 className="font-semibold text-[var(--color-on-surface-variant)]">Effectif Total</h3>
            </div>
            <p className="text-3xl font-black text-[var(--color-on-surface)]">{totalStudents}</p>
            <p className="text-sm text-[var(--color-on-surface-variant)] mt-1">Répartis dans {totalClasses} classes</p>
          </div>
          
          <div className="bg-[var(--color-surface-container-lowest)] p-6 rounded-xl border border-[var(--color-outline-variant)] shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-[#e6f4ea] text-[#1e8e3e] flex items-center justify-center">
                <span className="material-symbols-outlined">payments</span>
              </div>
              <h3 className="font-semibold text-[var(--color-on-surface-variant)]">Total Encaissé</h3>
            </div>
            <p className="text-3xl font-black text-[var(--color-on-surface)]">{totalCollected.toLocaleString('fr-FR')} F</p>
            <p className="text-sm text-[var(--color-on-surface-variant)] mt-1">Sur {totalExpected.toLocaleString('fr-FR')} F attendus</p>
          </div>

          <div className="bg-[var(--color-surface-container-lowest)] p-6 rounded-xl border border-[var(--color-outline-variant)] shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-[#fce8e6] text-[#d93025] flex items-center justify-center">
                <span className="material-symbols-outlined">trending_up</span>
              </div>
              <h3 className="font-semibold text-[var(--color-on-surface-variant)]">Recouvrement</h3>
            </div>
            <p className="text-3xl font-black text-[var(--color-on-surface)]">{recoveryRate.toFixed(1)} %</p>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-3">
              <div className="bg-[var(--color-primary)] h-1.5 rounded-full" style={{ width: \`\${Math.min(recoveryRate, 100)}%\` }}></div>
            </div>
          </div>

          <div className="bg-[var(--color-surface-container-lowest)] p-6 rounded-xl border border-[var(--color-outline-variant)] shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-[#fff8e1] text-[#f57f17] flex items-center justify-center">
                <span className="material-symbols-outlined">fact_check</span>
              </div>
              <h3 className="font-semibold text-[var(--color-on-surface-variant)]">Assiduité Globale</h3>
            </div>
            <p className="text-3xl font-black text-[var(--color-on-surface)]">{attendanceRate.toFixed(1)} %</p>
            <p className="text-sm text-[var(--color-on-surface-variant)] mt-1">Taux de présence mensuel</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-10">
          <div className="bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-outline-variant)] p-6 shadow-sm min-h-[400px] flex flex-col">
            <h3 className="font-bold text-[var(--color-on-surface)] mb-6 text-lg">Répartition des effectifs par classe</h3>
            <div className="flex-1 min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={studentsByClass}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="count" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-outline-variant)] p-6 shadow-sm min-h-[400px] flex flex-col">
            <h3 className="font-bold text-[var(--color-on-surface)] mb-6 text-lg">Proportion des classes</h3>
            <div className="flex-1 min-h-[300px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={studentsByClass}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="count"
                  >
                    {studentsByClass.map((entry, index) => (
                      <Cell key={\`cell-\${index}\`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Custom Legend */}
            <div className="flex flex-wrap justify-center gap-3 mt-4">
              {studentsByClass.map((item, index) => (
                <div key={index} className="flex items-center gap-1.5 text-sm font-medium">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                  {item.name}
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
