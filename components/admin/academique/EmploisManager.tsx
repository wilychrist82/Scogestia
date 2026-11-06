'use client'

import { useState } from 'react'
import { StaticTimetable } from '@/components/ui/StaticTimetable'
import { ChevronRight, CalendarDays } from 'lucide-react'

type ClassItem = { id: string; name: string; level: string }

type Props = {
  classes: ClassItem[]
}

export function EmploisManager({ classes }: Props) {
  const [selectedClassId, setSelectedClassId] = useState<string>('')

  const selectedClass = classes.find(c => c.id === selectedClassId)

  const getTimetableLevel = (levelStr: string): 'maternelle' | 'cp' | 'ce' | 'cm' | null => {
    if (!levelStr) return null
    const l = levelStr.toLowerCase()
    if (['s1', 's2', 'section1', 'section2', 'maternelle'].includes(l)) return 'maternelle'
    if (['cp1', 'cp2', 'cp'].includes(l)) return 'cp'
    if (['ce1', 'ce2', 'ce'].includes(l)) return 'ce'
    if (['cm1', 'cm2', 'cm'].includes(l)) return 'cm'
    return null // Pour le secondaire ou autre, on affiche "Bientôt disponible"
  }

  const timetableLevel = selectedClass ? getTimetableLevel(selectedClass.level) : null

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-[var(--color-surface)] relative">
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        {/* En-tête Exécutif — Stripe Royal Indigo & Sapphire */}
        <div className="relative flex flex-col justify-between gap-5 overflow-hidden rounded-2xl bg-gradient-to-r from-[#1E293B] via-[#312E81] to-[#4338CA] px-6 py-5 text-white shadow-[0_14px_34px_-12px_rgba(67,56,202,0.45)] ring-1 ring-indigo-400/25 sm:px-7 sm:py-6 lg:flex-row lg:items-center">
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute -right-12 -top-16 h-56 w-56 rounded-full bg-indigo-400/25 blur-3xl" />
            <div className="absolute -bottom-20 left-1/3 h-48 w-72 rounded-full bg-sky-400/15 blur-3xl" />
          </div>
          <div className="relative z-10">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-indigo-50 ring-1 ring-inset ring-white/25 backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-300" />
              Académique · Emplois du temps
            </div>
            <h2 className="text-xl font-extrabold tracking-tight text-white sm:text-2xl">Emplois du temps</h2>
            <p className="mt-1 text-[13px] font-medium text-indigo-100/90 sm:text-sm">
              Consultez les emplois du temps officiels par classe.
            </p>
          </div>
        </div>

        {/* Filter */}
        <div className="bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-outline-variant)] p-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-xl">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-[var(--color-on-surface)]">Classe</label>
              <select 
                value={selectedClassId} 
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full h-11 px-3 border border-[var(--color-outline-variant)] rounded-lg text-sm focus:border-[var(--color-primary)] outline-none bg-[var(--color-surface)]"
              >
                <option value="">Sélectionner une classe...</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Display Timetable */}
        {selectedClass ? (
          <StaticTimetable level={timetableLevel} />
        ) : (
          <div className="bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-outline-variant)] p-12 flex flex-col items-center justify-center text-center text-[var(--color-on-surface-variant)] min-h-[400px]">
            <CalendarDays className="w-10 h-10 mb-2 opacity-50 text-[var(--color-primary)]" />
            <p className="text-lg font-medium">Sélectionnez une classe pour afficher son emploi du temps</p>
          </div>
        )}

      </div>
    </div>
  )
}
