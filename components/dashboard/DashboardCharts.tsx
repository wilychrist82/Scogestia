'use client'

import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, LabelList
} from 'recharts'

export interface PaymentData { month: string; attendu: number; encaisse: number; }
export interface AttendanceData { name: string; value: number; color: string; }
export interface ClassDistributionData { name: string; value: number; color: string; }

// Tooltip premium personnalisé
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0b0f19] border border-white/10 rounded-xl px-4 py-3 shadow-2xl backdrop-blur-xl">
        <p className="text-[11px] font-bold text-white/50 uppercase tracking-wider mb-2">{label}</p>
        {payload.map((entry: any, i: number) => (
          <div key={i} className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color || entry.fill }} />
            <span className="text-xs text-white/70">{entry.name}</span>
            <span className="text-xs font-bold text-white ml-auto pl-3">
              {new Intl.NumberFormat('fr-FR').format(entry.value)}
            </span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export function PaymentBarChart({ data }: { data: PaymentData[] }) {
  return (
    <div className="h-[260px] w-full mt-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 5, left: -25, bottom: 0 }} barGap={3} barCategoryGap="35%">
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.06)" />
          <XAxis 
            dataKey="month" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 10.5, fill: '#9ca3af', fontWeight: 600 }} 
            dy={10}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 10.5, fill: '#9ca3af', fontWeight: 600 }} 
            tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`}
          />
          <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)', rx: 6 }} />
          <Bar dataKey="attendu" name="Attendu" fill="#d1fae5" radius={[4, 4, 0, 0]} />
          <Bar dataKey="encaisse" name="Encaissé" fill="#059669" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function CircularProgress({ percentage }: { percentage: number }) {
  const size = 84
  const radius = 34
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (Math.min(percentage, 100) / 100) * circumference
  const color = percentage >= 90 ? '#059669' : percentage >= 70 ? '#f59e0b' : '#ef4444'

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={radius} stroke="#e5e7eb" strokeWidth="7" fill="transparent" />
        <circle
          cx={size/2} cy={size/2} r={radius}
          stroke={color}
          strokeWidth="7"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.32,0.72,0,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center flex-col">
        <span className="text-sm font-black" style={{ color }}>{percentage}%</span>
      </div>
    </div>
  )
}

// Pie chart donut premium — affiche la valeur totale au centre
function DonutCenterLabel({ cx, cy, total, label }: { cx: number; cy: number; total: number; label: string }) {
  return (
    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
      <tspan x={cx} dy="-8" fontSize="20" fontWeight="900" fill="#0b1c30">{total}</tspan>
      <tspan x={cx} dy="18" fontSize="10" fontWeight="600" fill="#6b7280">{label}</tspan>
    </text>
  )
}

export function AttendancePieChart({ data }: { data: AttendanceData[] }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  return (
    <div className="h-[200px] w-full relative">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%" cy="50%"
            innerRadius={58} outerRadius={78}
            paddingAngle={3}
            dataKey="value"
            stroke="none"
            animationBegin={0}
            animationDuration={900}
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <RechartsTooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      {/* Centre label */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center">
          <p className="text-xl font-black text-[#0b1c30] leading-none">{total}</p>
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wide mt-0.5">élèves</p>
        </div>
      </div>
    </div>
  )
}

export function ClassDistributionPieChart({ data }: { data: ClassDistributionData[] }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  return (
    <div className="h-[200px] w-full relative">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%" cy="50%"
            innerRadius={58} outerRadius={78}
            paddingAngle={3}
            dataKey="value"
            stroke="none"
            animationBegin={0}
            animationDuration={900}
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <RechartsTooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      {/* Centre label */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center">
          <p className="text-xl font-black text-[#0b1c30] leading-none">{total}</p>
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wide mt-0.5">total</p>
        </div>
      </div>
    </div>
  )
}
