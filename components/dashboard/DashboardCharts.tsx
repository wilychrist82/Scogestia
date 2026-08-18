'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const paymentData = [
  { month: 'Janv.', attendu: 2800000, encaisse: 2800000 },
  { month: 'Févr.', attendu: 2800000, encaisse: 2600000 },
  { month: 'Mars', attendu: 2800000, encaisse: 2750000 },
  { month: 'Avr.', attendu: 2800000, encaisse: 2400000 },
  { month: 'Mai', attendu: 2800000, encaisse: 2300000 },
  { month: 'Juin', attendu: 2800000, encaisse: 2800000 },
  { month: 'Juil.', attendu: 2500000, encaisse: 1200000 },
  { month: 'Août', attendu: 2500000, encaisse: 1400000 },
  { month: 'Sept.', attendu: 3000000, encaisse: 2900000 },
  { month: 'Oct.', attendu: 3000000, encaisse: 2800000 },
  { month: 'Nov.', attendu: 3000000, encaisse: 2700000 },
  { month: 'Déc.', attendu: 3000000, encaisse: 1000000 },
]

export function PaymentBarChart() {
  return (
    <div className="h-[250px] w-full mt-6">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={paymentData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barGap={2}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} dy={10} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} tickFormatter={(value) => `${value / 1000000}M`} />
          <RechartsTooltip cursor={{ fill: '#F3F4F6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
          <Bar dataKey="attendu" name="Attendu" fill="#E5E7EB" radius={[2, 2, 0, 0]} barSize={8} />
          <Bar dataKey="encaisse" name="Encaissé" fill="var(--color-chart-green)" radius={[2, 2, 0, 0]} barSize={8} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function CircularProgress({ percentage }: { percentage: number }) {
  const radius = 30
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg className="transform -rotate-90 w-20 h-20">
        <circle cx="40" cy="40" r="30" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-gray-200" />
        <circle
          cx="40" cy="40" r="30" stroke="currentColor" strokeWidth="6" fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="text-[var(--color-chart-green)] transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center flex-col">
        <span className="text-sm font-bold text-gray-800">{percentage}%</span>
      </div>
    </div>
  )
}

const attendanceData = [
  { name: 'Présents', value: 476, color: 'var(--color-chart-green)' },
  { name: 'Absents', value: 32, color: 'var(--color-chart-red)' },
  { name: 'Retards', value: 54, color: 'var(--color-chart-orange)' },
]

export function AttendancePieChart() {
  return (
    <div className="h-[200px] w-full relative">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={attendanceData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
            stroke="none"
          >
            {attendanceData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

const classDistributionData = [
  { name: '6ème', value: 120, color: 'var(--color-chart-green)' },
  { name: '5ème', value: 140, color: 'var(--color-chart-blue)' },
  { name: '4ème', value: 130, color: 'var(--color-chart-purple)' },
  { name: '3ème', value: 172, color: 'var(--color-chart-orange)' },
]

export function ClassDistributionPieChart() {
  return (
    <div className="h-[200px] w-full relative">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={classDistributionData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
            stroke="none"
          >
            {classDistributionData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
