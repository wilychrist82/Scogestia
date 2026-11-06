'use client'

import { useState } from 'react'
import { TimetableGrid } from '@/components/admin/academique/TimetableGrid'
import { StaticTimetable } from '@/components/ui/StaticTimetable'
import { getTimetableSlots } from '@/app/actions/timetable'
import type { TimetableSlot } from '@/app/actions/timetable'
import { Calendar, ChevronDown, ChevronRight } from 'lucide-react'
import { sortClasses } from '@/lib/classes'

type ClassItem = { id: string; name: string; level: string }

type Props = {
  classes: ClassItem[]
  schoolId: string
  readOnly: boolean
}

export function EmploisManagerClient({ classes, schoolId, readOnly }: Props) {
  const [selectedClassId, setSelectedClassId] = useState<string>('')
  const [selectedClassName, setSelectedClassName] = useState<string>('')
  const [slots, setSlots] = useState<TimetableSlot[]>([])
  const [loading, setLoading] = useState(false)

  const handleClassChange = async (classId: string) => {
    setSelectedClassId(classId)
    const cls = classes.find(c => c.id === classId)
    setSelectedClassName(cls?.name || '')

    if (!classId) {
      setSlots([])
      return
    }

    setLoading(true)
    try {
      const data = await getTimetableSlots(classId)
      setSlots(data)
    } catch (err) {
      console.error(err)
      setSlots([])
    } finally {
      setLoading(false)
    }
  }

  const getTimetableLevel = (classId: string): 'maternelle' | 'cp' | 'ce' | 'cm' | null => {
    const cls = classes.find(c => c.id === classId)
    if (!cls) return null
    const match = `${cls.level} ${cls.name}`.toLowerCase()
    
    // Si la classe est explicitement secondaire ou lycée, on force null
    if (match.includes('6ème') || match.includes('6eme') || match.includes('6e') || match.includes('secondaire') || match.includes('college') || match.includes('lycee') || match.includes('seconde') || match.includes('premiere') || match.includes('première') || match.includes('terminale') || match.includes('2nde') || match.includes('1ere') || match.includes('1ère') || match.includes('tle')) {
      return null
    }

    if (match.includes('s1') || match.includes('s2') || match.includes('section') || match.includes('maternelle')) return 'maternelle'
    if (match.includes('cp1') || match.includes('cp2') || match.includes('cp')) return 'cp'
    if (match.includes('ce1') || match.includes('ce2') || match.includes('ce')) return 'ce'
    if (match.includes('cm1') || match.includes('cm2') || match.includes('cm')) return 'cm'
    
    return null
  }

  const staticLevel = selectedClassId ? getTimetableLevel(selectedClassId) : null

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
              {readOnly
                ? 'Consultez les emplois du temps officiels par classe.'
                : 'Consultez ou modifiez les emplois du temps par classe.'}
            </p>
          </div>
        </div>

        {/* Sélecteur de classe */}
        <div className="bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-outline-variant)] p-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-xl">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-[var(--color-on-surface)]">Classe</label>
              <div className="relative">
                <select
                  value={selectedClassId}
                  onChange={(e) => handleClassChange(e.target.value)}
                  className="w-full h-11 px-3 pr-10 border border-[var(--color-outline-variant)] rounded-lg text-sm focus:border-[var(--color-primary)] outline-none bg-[var(--color-surface)] appearance-none"
                >
                  <option value="">Sélectionner une classe...</option>
                  {sortClasses(classes).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-on-surface-variant)] pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Contenu principal */}
        {loading ? (
          <div className="bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-outline-variant)] p-12 flex flex-col items-center justify-center min-h-[400px]">
            <div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm text-[var(--color-on-surface-variant)]">Chargement de l'emploi du temps...</p>
          </div>
        ) : selectedClassId ? (
          <div className="bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-outline-variant)] p-4 md:p-6 shadow-sm">
            {staticLevel ? (
              <StaticTimetable level={staticLevel} />
            ) : (
              <TimetableGrid
                classId={selectedClassId}
                className={selectedClassName}
                initialSlots={slots}
                readOnly={readOnly}
              />
            )}
          </div>
        ) : (
          <div className="bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-outline-variant)] p-12 flex flex-col items-center justify-center text-center text-[var(--color-on-surface-variant)] min-h-[400px]">
            <Calendar className="w-10 h-10 mb-3 opacity-40" />
            <p className="text-lg font-medium">Sélectionnez une classe</p>
            <p className="text-sm mt-1 opacity-70">L'emploi du temps de la classe s'affichera ici</p>
          </div>
        )}

      </div>
    </div>
  )
}
