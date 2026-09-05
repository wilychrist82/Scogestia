'use client'

import { useState, useTransition, useEffect } from 'react'
import { fetchMonthlyAttendance, saveMonthlyAttendanceGrid } from '@/app/actions/academique'
import Link from 'next/link'

type ClassItem = { id: string; name: string }
type StudentItem = { id: string; last_name: string; first_name: string; matricule: string; class_id: string }

type Props = {
  classes: ClassItem[]
  students: StudentItem[]
}

const MONTHS = [
  { value: 1, label: 'Janvier' },
  { value: 2, label: 'Février' },
  { value: 3, label: 'Mars' },
  { value: 4, label: 'Avril' },
  { value: 5, label: 'Mai' },
  { value: 6, label: 'Juin' },
  { value: 7, label: 'Juillet' },
  { value: 8, label: 'Août' },
  { value: 9, label: 'Septembre' },
  { value: 10, label: 'Octobre' },
  { value: 11, label: 'Novembre' },
  { value: 12, label: 'Décembre' }
]

const DAYS_OF_WEEK = ['D', 'L', 'M', 'M', 'J', 'V', 'S'] // 0 = Sunday

export function PresencesManager({ classes, students }: Props) {
  const currentDate = new Date()
  const [selectedClass, setSelectedClass] = useState<string>('')
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1)
  
  // State pour la grille: "studentId_YYYY-MM-DD" -> "retard" (-) | "absent" (+) | "present" (vide)
  const [gridData, setGridData] = useState<Record<string, string>>({})
  // Pour garder une trace des modifications non sauvegardées
  const [modifiedCells, setModifiedCells] = useState<Set<string>>(new Set())

  const [isLoadingData, setIsLoadingData] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<boolean>(false)

  const filteredStudents = selectedClass ? students.filter(s => s.class_id === selectedClass) : []

  // Calcul des jours du mois
  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate()
  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const dayNum = i + 1
    const dateObj = new Date(selectedYear, selectedMonth - 1, dayNum)
    const dayOfWeek = dateObj.getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
    return {
      dayNum,
      initial: DAYS_OF_WEEK[dayOfWeek],
      isWeekend,
      dateStr
    }
  })

  // Chargement des données quand classe/année/mois change
  useEffect(() => {
    if (!selectedClass) return

    let isMounted = true
    setIsLoadingData(true)
    setError(null)

    fetchMonthlyAttendance(selectedClass, selectedYear, selectedMonth)
      .then(result => {
        if (!isMounted) return
        if (result.error) {
          setError(result.error)
        } else if (result.data) {
          const newData: Record<string, string> = {}
          result.data.forEach((att: any) => {
            const key = `${att.student_id}_${att.date}`
            newData[key] = att.status
          })
          setGridData(newData)
          setModifiedCells(new Set())
        }
        setIsLoadingData(false)
      })
      .catch(err => {
        if (isMounted) {
          setError(err.message)
          setIsLoadingData(false)
        }
      })

    return () => { isMounted = false }
  }, [selectedClass, selectedYear, selectedMonth])

  const handleCellClick = (studentId: string, dateStr: string, isWeekend: boolean) => {
    if (isWeekend) return // Impossible de modifier les weekends
    
    const key = `${studentId}_${dateStr}`
    const currentStatus = gridData[key] || 'present'
    
    let newStatus = 'present'
    if (currentStatus === 'present' || currentStatus === '') newStatus = 'retard' // '-'
    else if (currentStatus === 'retard') newStatus = 'absent' // '+'
    else if (currentStatus === 'absent') newStatus = 'present' // ''

    setGridData(prev => ({ ...prev, [key]: newStatus }))
    setModifiedCells(prev => {
      const newSet = new Set(prev)
      newSet.add(key)
      return newSet
    })
  }

  const handleSave = () => {
    if (modifiedCells.size === 0) return

    setError(null)
    setSuccess(false)

    // Préparer les updates
    const updates = Array.from(modifiedCells).map(key => {
      const [studentId, date] = key.split('_')
      return {
        student_id: studentId,
        date,
        status: gridData[key] || 'present'
      }
    })

    startTransition(async () => {
      const result = await saveMonthlyAttendanceGrid(selectedClass, selectedYear, selectedMonth, updates)
      if (result?.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        setModifiedCells(new Set())
        setTimeout(() => setSuccess(false), 3000)
      }
    })
  }

  const getCellDisplay = (status?: string) => {
    if (status === 'retard') return '-'
    if (status === 'absent') return '+'
    return ''
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-[var(--color-surface)]">
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[var(--color-surface-container-lowest)] p-6 rounded-xl border border-[var(--color-outline-variant)]">
          <div>
            <div className="flex items-center gap-2 text-[var(--color-on-surface-variant)] mb-2">
              <Link href="/admin/academique" className="hover:text-[var(--color-primary)] transition-colors text-sm font-semibold">
                Académique
              </Link>
              <span className="material-symbols-outlined text-sm">chevron_right</span>
              <span className="text-sm font-semibold text-[var(--color-on-surface)]">Registre d'Appel</span>
            </div>
            <h2 className="text-3xl font-bold text-[var(--color-on-surface)]">Registre d'Appel Journalier</h2>
            <p className="text-base text-[var(--color-on-surface-variant)] mt-1">
              Gérez les absences mensuelles. Cliquez sur une case pour marquer une absence (- matin, + journée entière).
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-outline-variant)] p-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-[var(--color-on-surface)]">Classe</label>
              <select 
                value={selectedClass} 
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full h-11 px-3 border border-[var(--color-outline-variant)] rounded-lg text-sm focus:border-[var(--color-primary)] outline-none bg-[var(--color-surface)]"
              >
                <option value="">Sélectionner une classe...</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-[var(--color-on-surface)]">Mois</label>
              <select 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="w-full h-11 px-3 border border-[var(--color-outline-variant)] rounded-lg text-sm focus:border-[var(--color-primary)] outline-none bg-[var(--color-surface)]"
              >
                {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-[var(--color-on-surface)]">Année</label>
              <select 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-full h-11 px-3 border border-[var(--color-outline-variant)] rounded-lg text-sm focus:border-[var(--color-primary)] outline-none bg-[var(--color-surface)]"
              >
                {[currentDate.getFullYear() - 1, currentDate.getFullYear(), currentDate.getFullYear() + 1].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-[var(--color-status-retard-bg)] text-[var(--color-status-retard-text)] p-3 rounded text-sm font-medium">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-[#e6f4ea] text-[#1e8e3e] p-3 rounded text-sm font-medium flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">check_circle</span>
            Registre sauvegardé avec succès.
          </div>
        )}

        {/* Data Grid */}
        {selectedClass ? (
          <div className="bg-white rounded-xl border border-gray-300 overflow-hidden shadow-sm flex flex-col mt-4">
            <div className="p-4 border-b border-gray-200 flex flex-wrap justify-between items-center gap-4 bg-gray-50/50">
              <h3 className="font-semibold text-[var(--color-on-surface)] flex items-center gap-3">
                <span>Registre d'appel - {MONTHS.find(m => m.value === selectedMonth)?.label} {selectedYear}</span>
                {isLoadingData && <span className="w-4 h-4 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></span>}
              </h3>
              
              <div className="flex items-center gap-4">
                <div className="flex gap-4 text-xs font-medium text-gray-500">
                  <div className="flex items-center gap-1"><span className="w-4 h-4 flex items-center justify-center bg-gray-100 rounded text-gray-800 font-bold border border-gray-200">-</span> Absent Matin</div>
                  <div className="flex items-center gap-1"><span className="w-4 h-4 flex items-center justify-center bg-gray-100 rounded text-gray-800 font-bold border border-gray-200">+</span> Absent Journée</div>
                </div>
                <button 
                  onClick={handleSave}
                  disabled={isPending || modifiedCells.size === 0}
                  className="bg-[var(--color-primary)] text-white px-6 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isPending ? 'Sauvegarde...' : "Sauvegarder"}
                  {modifiedCells.size > 0 && !isPending && <span className="bg-white/20 px-1.5 py-0.5 rounded text-xs">{modifiedCells.size}</span>}
                </button>
              </div>
            </div>

            <div className="overflow-x-auto max-h-[65vh] custom-scrollbar relative p-4">
              <table className="w-full text-left border-collapse border-spacing-0 select-none bg-white">
                <thead className="sticky top-0 z-20">
                  {/* First header row: Indication des absences */}
                  <tr>
                    <th rowSpan={2} className="border border-gray-400 py-2 px-3 font-semibold text-center w-12 bg-gray-100 text-gray-700 text-sm z-30 sticky left-0">
                      N°
                    </th>
                    <th rowSpan={2} className="border border-gray-400 py-2 px-4 font-semibold w-64 bg-gray-100 text-gray-700 text-sm z-30 sticky left-[48px]">
                      Nom et prénom
                    </th>
                    <th colSpan={daysInMonth} className="border border-gray-400 py-1 font-bold text-center bg-indigo-50/50 text-gray-700 text-sm tracking-wide">
                      Indication des absences
                    </th>
                  </tr>
                  {/* Second header row: Day numbers and initials */}
                  <tr>
                    {days.map(d => (
                      <th 
                        key={d.dayNum} 
                        className={`border border-gray-400 p-0 text-center min-w-[28px] w-[28px] text-[11px]
                          ${d.isWeekend ? 'bg-blue-100/50 text-blue-900' : 'bg-white text-gray-700'}
                        `}
                      >
                        <div className="flex flex-col">
                          <span className="font-bold py-1 border-b border-gray-400">{String(d.dayNum).padStart(2, '0')}</span>
                          <span className="py-1 font-semibold">{d.initial}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {filteredStudents.map((student, index) => (
                    <tr key={student.id} className="hover:bg-gray-50 group">
                      <td className="border border-gray-400 py-2 px-2 text-center text-gray-600 font-semibold sticky left-0 bg-white z-10 group-hover:bg-gray-50">
                        {String(index + 1).padStart(2, '0')}
                      </td>
                      <td className="border border-gray-400 py-2 px-3 font-semibold text-gray-800 sticky left-[48px] bg-white z-10 whitespace-nowrap overflow-hidden text-ellipsis group-hover:bg-gray-50 text-xs">
                        {student.last_name} {student.first_name}
                      </td>
                      {days.map(d => {
                        const key = `${student.id}_${d.dateStr}`
                        const status = gridData[key]
                        const isModified = modifiedCells.has(key)
                        return (
                          <td 
                            key={d.dayNum} 
                            onClick={() => handleCellClick(student.id, d.dateStr, d.isWeekend)}
                            className={`
                              border border-gray-400 p-0 text-center text-sm font-bold transition-colors
                              ${d.isWeekend ? 'bg-blue-100/30 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-100'}
                              ${isModified ? 'text-indigo-600 bg-indigo-50/50' : 'text-gray-800'}
                            `}
                          >
                            <div className="w-full h-8 flex items-center justify-center">
                              {!d.isWeekend && getCellDisplay(status)}
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-outline-variant)] p-12 flex flex-col items-center justify-center text-center text-[var(--color-on-surface-variant)] min-h-[400px]">
            <span className="material-symbols-outlined text-4xl mb-2 opacity-50">fact_check</span>
            <p className="text-lg font-medium">Sélectionnez une classe pour afficher le registre</p>
            <p className="text-sm">La grille d'appel du mois apparaîtra ici.</p>
          </div>
        )}

      </div>
    </div>
  )
}
