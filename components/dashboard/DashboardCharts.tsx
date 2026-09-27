'use client'

import { 
  AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, 
  ResponsiveContainer, PieChart, Pie, Cell
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

export function PaymentChart({ data }: { data: PaymentData[] }) {
  return (
    <div className="h-[260px] w-full mt-2">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
          <defs>
            <linearGradient id="colorAttenduArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#e2e8f0" stopOpacity={0.5}/>
              <stop offset="95%" stopColor="#f8fafc" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorEncaisseArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.6}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
            <filter id="shadowArea" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#10b981" floodOpacity="0.3" />
            </filter>
          </defs>
          <XAxis 
            dataKey="month" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600, fontFamily: 'var(--font-sans)' }} 
            dy={12}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600, fontFamily: 'var(--font-sans)' }} 
            tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`}
          />
          <RechartsTooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(16, 185, 129, 0.2)', strokeWidth: 2, strokeDasharray: '5 5' }} />
          
          <Area 
            type="monotone" 
            dataKey="attendu" 
            name="Attendu" 
            stroke="#cbd5e1" 
            strokeWidth={3}
            strokeDasharray="6 6"
            fill="url(#colorAttenduArea)" 
            activeDot={false}
          />
          <Area 
            type="monotone" 
            dataKey="encaisse" 
            name="Encaissé" 
            stroke="#10b981" 
            strokeWidth={4}
            fill="url(#colorEncaisseArea)" 
            activeDot={{ r: 6, fill: '#fff', stroke: '#10b981', strokeWidth: 3 }}
            style={{ filter: 'url(#shadowArea)' }}
          />
        </AreaChart>
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

// Préparer des gradients premium pour les pie charts
const PIE_GRADIENTS = [
  { id: 'pie-grad-1', colors: ['#10b981', '#047857'] }, // Emerald
  { id: 'pie-grad-2', colors: ['#3b82f6', '#1d4ed8'] }, // Blue
  { id: 'pie-grad-3', colors: ['#8b5cf6', '#6d28d9'] }, // Violet
  { id: 'pie-grad-4', colors: ['#f59e0b', '#b45309'] }, // Amber
  { id: 'pie-grad-5', colors: ['#ec4899', '#be185d'] }, // Pink
  { id: 'pie-grad-6', colors: ['#f43f5e', '#be123c'] }, // Rose
  { id: 'pie-grad-7', colors: ['#06b6d4', '#0e7490'] }, // Cyan
]

const ATTENDANCE_GRADIENTS = [
  { id: 'att-grad-present', colors: ['#10b981', '#047857'] }, // Emerald (Présents)
  { id: 'att-grad-absent', colors: ['#f43f5e', '#be123c'] },  // Rose (Absents)
  { id: 'att-grad-retard', colors: ['#f59e0b', '#b45309'] },  // Amber (Retards)
]

export function AttendancePieChart({ data }: { data: AttendanceData[] }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  return (
    <div className="h-[200px] w-full relative">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <defs>
            {ATTENDANCE_GRADIENTS.map((g) => (
              <linearGradient key={g.id} id={g.id} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={g.colors[0]} stopOpacity={1}/>
                <stop offset="100%" stopColor={g.colors[1]} stopOpacity={1}/>
              </linearGradient>
            ))}
          </defs>
          <Pie
            data={data}
            cx="50%" cy="50%"
            innerRadius={58} outerRadius={78}
            paddingAngle={4}
            dataKey="value"
            stroke="none"
            animationBegin={0}
            animationDuration={1000}
            animationEasing="ease-out"
            cornerRadius={4}
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={`url(#${ATTENDANCE_GRADIENTS[i % ATTENDANCE_GRADIENTS.length].id})`} style={{ filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.06))' }} />
            ))}
          </Pie>
          <RechartsTooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      {/* Centre label */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center bg-white shadow-[0_2px_10px_rgba(0,0,0,0.04)] rounded-full w-[100px] h-[100px] flex flex-col items-center justify-center border border-slate-100">
          <p className="text-2xl font-black text-slate-800 leading-none">{total}</p>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mt-1">élèves</p>
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
          <defs>
            {PIE_GRADIENTS.map((g) => (
              <linearGradient key={g.id} id={`dist-${g.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={g.colors[0]} stopOpacity={1}/>
                <stop offset="100%" stopColor={g.colors[1]} stopOpacity={1}/>
              </linearGradient>
            ))}
          </defs>
          <Pie
            data={data}
            cx="50%" cy="50%"
            innerRadius={58} outerRadius={78}
            paddingAngle={4}
            dataKey="value"
            stroke="none"
            animationBegin={100}
            animationDuration={1000}
            animationEasing="ease-out"
            cornerRadius={4}
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={`url(#dist-${PIE_GRADIENTS[i % PIE_GRADIENTS.length].id})`} style={{ filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.06))' }} />
            ))}
          </Pie>
          <RechartsTooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      {/* Centre label */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center bg-white shadow-[0_2px_10px_rgba(0,0,0,0.04)] rounded-full w-[100px] h-[100px] flex flex-col items-center justify-center border border-slate-100">
          <p className="text-2xl font-black text-slate-800 leading-none">{total}</p>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mt-1">total</p>
        </div>
      </div>
    </div>
  )
}
