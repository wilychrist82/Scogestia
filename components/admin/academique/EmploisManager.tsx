'use client'

import { useState } from 'react'
import { StaticTimetable } from '@/components/ui/StaticTimetable'

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
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[var(--color-surface-container-lowest)] p-6 rounded-xl border border-[var(--color-outline-variant)]">
          <div>
            <div className="flex items-center gap-2 text-[var(--color-on-surface-variant)] mb-2">
              <span className="hover:text-[var(--color-primary)] transition-colors text-sm font-semibold">
                Académique
              </span>
              <span className="material-symbols-outlined text-sm">chevron_right</span>
              <span className="text-sm font-semibold text-[var(--color-on-surface)]">Emplois du temps</span>
            </div>
            <h2 className="text-3xl font-bold text-[var(--color-on-surface)]">Emplois du temps</h2>
            <p className="text-base text-[var(--color-on-surface-variant)] mt-1">
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
            <span className="material-symbols-outlined text-4xl mb-2 opacity-50">calendar_month</span>
            <p className="text-lg font-medium">Sélectionnez une classe pour afficher son emploi du temps</p>
          </div>
        )}

      </div>
    </div>
  )
}
