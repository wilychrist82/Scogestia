'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"

export function GradesChart({ data, studentName }: { data: any[], studentName: string }) {
  // data attendue : [{ name: 'Trimestre 1', moyenne: 14.5 }, { name: 'Trimestre 2', moyenne: 16 }, ...]
  
  return (
    <Card className="mt-6 border border-gray-100 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Évolution Académique - {studentName}</CardTitle>
        <CardDescription className="text-xs">
          Moyennes générales au fil des trimestres.
        </CardDescription>
      </CardHeader>
      <CardContent className="pl-0">
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis
              dataKey="name"
              stroke="#888888"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              padding={{ left: 20, right: 20 }}
            />
            <YAxis
              stroke="#888888"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              domain={[0, 20]}
            />
            <Tooltip 
              formatter={(value: number) => [`${value} / 20`, 'Moyenne']}
              cursor={{stroke: '#e2e8f0', strokeWidth: 2}}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            />
            <Line
              type="monotone"
              dataKey="moyenne"
              stroke="var(--color-primary)"
              strokeWidth={3}
              dot={{ r: 4, fill: "var(--color-primary)", strokeWidth: 2, stroke: "#fff" }}
              activeDot={{ r: 6 }}
              animationDuration={1500}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
