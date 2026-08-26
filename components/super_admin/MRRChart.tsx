'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"

const data = [
  { name: "Jan", total: 0 },
  { name: "Fév", total: 0 },
  { name: "Mar", total: 0 },
  { name: "Avr", total: 0 },
  { name: "Mai", total: 0 },
  { name: "Juin", total: 0 },
  { name: "Juil", total: 0 },
  { name: "Août", total: 150000 },
  { name: "Sep", total: 200000 },
  { name: "Oct", total: 350000 },
  { name: "Nov", total: 500000 },
  { name: "Déc", total: 800000 },
]

export function MRRChart() {
  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Croissance du MRR (Prévision)</CardTitle>
        <CardDescription>
          Évolution des revenus mensuels récurrents générés par les abonnements des écoles (en FCFA).
        </CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis
              dataKey="name"
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value / 1000}k`}
            />
            <Tooltip 
              formatter={(value: number) => [`${value.toLocaleString()} FCFA`, 'MRR']}
              cursor={{fill: '#f8fafc'}}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            />
            <Bar
              dataKey="total"
              fill="var(--color-primary)"
              radius={[4, 4, 0, 0]}
              animationDuration={1500}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
