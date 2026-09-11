'use client'

import { useState } from 'react'
import { TimetableGrid } from '@/components/admin/academique/TimetableGrid'
import { getTimetableSlots } from '@/app/actions/timetable'
import type { TimetableSlot } from '@/app/actions/timetable'
import { Calendar, ChevronDown } from 'lucide-react'

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
              {readOnly
                ? 'Consultez les emplois du temps par classe.'
                : 'Créez et modifiez les emplois du temps. Cliquez sur une cellule pour ajouter un créneau.'}
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
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
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
            <TimetableGrid
              classId={selectedClassId}
              className={selectedClassName}
              initialSlots={slots}
              readOnly={readOnly}
            />
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
