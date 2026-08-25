'use client'

import { useMemo } from 'react'

type TimetableEntry = {
  id: string
  day_of_week: number
  start_time: string
  end_time: string
  subject_name: string
  room_name?: string | null
  classes?: {
    name: string
  } | null
}

type Props = {
  timetables: TimetableEntry[]
}

const DAYS = [
  { id: 1, name: 'Lundi' },
  { id: 2, name: 'Mardi' },
  { id: 3, name: 'Mercredi' },
  { id: 4, name: 'Jeudi' },
  { id: 5, name: 'Vendredi' },
  { id: 6, name: 'Samedi' },
]

const HOURS = Array.from({ length: 11 }, (_, i) => i + 7) // 7h à 17h

export function PlanningDashboard({ timetables }: Props) {
  // Grouper les cours par jour
  const scheduleByDay = useMemo(() => {
    const grouped = new Map<number, TimetableEntry[]>()
    
    // Initialiser les jours
    DAYS.forEach(d => grouped.set(d.id, []))
    
    // Ajouter les cours
    timetables.forEach(t => {
      const daySchedule = grouped.get(t.day_of_week)
      if (daySchedule) {
        daySchedule.push(t)
      }
    })
    
    return grouped
  }, [timetables])

  const formatTime = (timeString: string) => {
    // "08:30:00" -> "08:30"
    return timeString.substring(0, 5)
  }

  const getSlotPosition = (start: string, end: string) => {
    const startHour = parseInt(start.substring(0, 2), 10)
    const startMin = parseInt(start.substring(3, 5), 10)
    const endHour = parseInt(end.substring(0, 2), 10)
    const endMin = parseInt(end.substring(3, 5), 10)
    
    // Calculer la position en pixels (1h = 60px)
    // Offset depuis 7h00
    const top = ((startHour - 7) * 60) + startMin
    const height = ((endHour - startHour) * 60) + (endMin - startMin)
    
    return { top, height }
  }

  // Couleurs prédéfinies pour les matières
  const getColorForSubject = (subject: string) => {
    const colors = [
      'bg-blue-100 text-blue-800 border-blue-200',
      'bg-emerald-100 text-emerald-800 border-emerald-200',
      'bg-amber-100 text-amber-800 border-amber-200',
      'bg-purple-100 text-purple-800 border-purple-200',
      'bg-rose-100 text-rose-800 border-rose-200',
      'bg-cyan-100 text-cyan-800 border-cyan-200',
    ]
    let hash = 0
    for (let i = 0; i < subject.length; i++) {
      hash = subject.charCodeAt(i) + ((hash << 5) - hash)
    }
    return colors[Math.abs(hash) % colors.length]
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-[var(--color-surface)]">
      <div className="max-w-[1280px] mx-auto space-y-6">
        
        {/* En-tête */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[var(--color-surface-container-lowest)] p-6 rounded-xl border border-[var(--color-outline-variant)]">
          <div>
            <div className="flex items-center gap-2 text-[var(--color-on-surface-variant)] mb-2">
              <span className="text-sm font-semibold text-[var(--color-on-surface)]">Espace Enseignant</span>
            </div>
            <h2 className="text-3xl font-bold text-[var(--color-on-surface)]">Emploi du temps</h2>
            <p className="text-base text-[var(--color-on-surface-variant)] mt-1">Consultez votre planning hebdomadaire de cours.</p>
          </div>
        </div>

        {timetables.length === 0 && (
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="material-symbols-outlined text-amber-500">info</span>
              </div>
              <div className="ml-3">
                <p className="text-sm text-amber-700 font-medium">
                  Aucun emploi du temps n'a été configuré pour vous actuellement.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Grille du planning */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-[800px]">
          {/* Jours de la semaine (Header) */}
          <div className="flex border-b border-gray-200 bg-gray-50">
            <div className="w-16 flex-shrink-0 border-r border-gray-200"></div>
            {DAYS.map(day => (
              <div key={day.id} className="flex-1 text-center py-3 border-r border-gray-200 last:border-r-0 font-semibold text-gray-700">
                {day.name}
              </div>
            ))}
          </div>

          {/* Grille des heures */}
          <div className="flex flex-1 overflow-y-auto relative custom-scrollbar">
            {/* Colonne des heures */}
            <div className="w-16 flex-shrink-0 border-r border-gray-200 bg-white z-10 relative">
              {HOURS.map(hour => (
                <div key={hour} className="h-[60px] border-b border-gray-100 flex items-start justify-center text-xs text-gray-500 pt-2 font-medium">
                  {hour}h00
                </div>
              ))}
            </div>

            {/* Conteneur des jours */}
            <div className="flex flex-1 relative bg-[linear-gradient(to_bottom,transparent_59px,#f3f4f6_60px)]" style={{ backgroundSize: '100% 60px' }}>
              {DAYS.map(day => (
                <div key={day.id} className="flex-1 border-r border-gray-200 last:border-r-0 relative">
                  {scheduleByDay.get(day.id)?.map(slot => {
                    const pos = getSlotPosition(slot.start_time, slot.end_time)
                    return (
                      <div 
                        key={slot.id} 
                        className={`absolute left-1 right-1 rounded-md border p-2 overflow-hidden shadow-sm transition-transform hover:scale-[1.02] cursor-pointer ${getColorForSubject(slot.subject_name)}`}
                        style={{ top: `${pos.top}px`, height: `${pos.height}px` }}
                      >
                        <div className="font-bold text-sm truncate">{slot.subject_name}</div>
                        <div className="text-xs mt-1 font-medium truncate opacity-90">
                          {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                        </div>
                        <div className="text-xs mt-1 truncate font-semibold">
                          {slot.classes?.name || 'Classe inconnue'}
                        </div>
                        {slot.room_name && (
                          <div className="text-[10px] mt-0.5 truncate flex items-center gap-1 opacity-80">
                            <span className="material-symbols-outlined text-[12px]">meeting_room</span>
                            {slot.room_name}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
