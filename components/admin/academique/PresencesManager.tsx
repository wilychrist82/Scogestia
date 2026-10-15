'use client'

import { useState, useTransition, useEffect } from 'react'
import { fetchMonthlyAttendance, saveMonthlyAttendanceGrid } from '@/app/actions/academique'
import Link from 'next/link'
import { sortClasses } from '@/lib/classes'
import { 
  ChevronRight, 
  School, 
  Calendar, 
  CalendarDays, 
  CheckCircle2, 
  FileText, 
  ClipboardCheck, 
  X, 
  Table, 
  BarChart3, 
  Printer,
  Wifi,
  WifiOff,
  CloudUpload,
  RefreshCw
} from 'lucide-react'

type ClassItem = { id: string; name: string }
type StudentItem = { id: string; last_name: string; first_name: string; matricule: string; class_id: string; gender: string; status: string }

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
  
  // State pour la grille
  const [gridData, setGridData] = useState<Record<string, string>>({})
  const [modifiedCells, setModifiedCells] = useState<Set<string>>(new Set())

  // State pour la période active et la modale de récapitulation
  const [periodStart, setPeriodStart] = useState<string>('')
  const [periodEnd, setPeriodEnd] = useState<string>('')
  const [onlyShowPeriodDays, setOnlyShowPeriodDays] = useState<boolean>(false)
  const [isRecapOpen, setIsRecapOpen] = useState(false)

  const [isLoadingData, setIsLoadingData] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<boolean>(false)

  // State offline / PWA
  const [isOnline, setIsOnline] = useState<boolean>(true)
  const [offlinePendingQueue, setOfflinePendingQueue] = useState<Array<{
    classId: string
    year: number
    month: number
    updates: Array<{ student_id: string; date: string; status: string }>
  }>>([])
  const [isSyncingOffline, setIsSyncingOffline] = useState(false)
  const [offlineSavedMsg, setOfflineSavedMsg] = useState(false)
  const [isLoadedFromCache, setIsLoadedFromCache] = useState(false)

  const filteredStudents = selectedClass ? students.filter(s => s.class_id === selectedClass) : []

  // Gestion de la connectivité réseau et file d'attente hors-ligne
  useEffect(() => {
    if (typeof window === 'undefined') return
    setIsOnline(navigator.onLine)

    const handleOnline = () => {
      setIsOnline(true)
      syncOfflineQueue()
    }
    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    try {
      const stored = localStorage.getItem('scogestia_offline_attendance_queue')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) setOfflinePendingQueue(parsed)
      }
    } catch (e) {
      console.warn('Erreur lecture queue hors-ligne:', e)
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const saveToOfflineQueue = (updates: Array<{ student_id: string; date: string; status: string }>) => {
    const queueItem = {
      classId: selectedClass,
      year: selectedYear,
      month: selectedMonth,
      updates
    }
    const nextQueue = [...offlinePendingQueue, queueItem]
    setOfflinePendingQueue(nextQueue)
    try {
      localStorage.setItem('scogestia_offline_attendance_queue', JSON.stringify(nextQueue))
      localStorage.setItem(`scogestia_attendance_grid_${selectedClass}_${selectedYear}_${selectedMonth}`, JSON.stringify(gridData))
    } catch (e) {}
    setModifiedCells(new Set())
    setOfflineSavedMsg(true)
    setTimeout(() => setOfflineSavedMsg(false), 4500)
  }

  const syncOfflineQueue = async () => {
    let currentQueue: any[] = []
    try {
      const stored = localStorage.getItem('scogestia_offline_attendance_queue')
      if (stored) currentQueue = JSON.parse(stored)
    } catch (e) {}

    if (!currentQueue || currentQueue.length === 0) return

    setIsSyncingOffline(true)
    let hasError = false
    const remainingQueue = []

    for (const item of currentQueue) {
      try {
        const res = await saveMonthlyAttendanceGrid(item.classId, item.year, item.month, item.updates)
        if (res?.error) {
          hasError = true
          remainingQueue.push(item)
        }
      } catch (e) {
        hasError = true
        remainingQueue.push(item)
      }
    }

    setOfflinePendingQueue(remainingQueue)
    try {
      localStorage.setItem('scogestia_offline_attendance_queue', JSON.stringify(remainingQueue))
    } catch (e) {}

    setIsSyncingOffline(false)
    if (!hasError) {
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    }
  }

  // Initialiser les dates de période par défaut quand l'année ou le mois change
  useEffect(() => {
    const start = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`
    const lastDay = new Date(selectedYear, selectedMonth, 0).getDate()
    const end = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
    setPeriodStart(start)
    setPeriodEnd(end)
  }, [selectedYear, selectedMonth])

  // Calcul des jours du mois et détection de la période active
  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate()
  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const dayNum = i + 1
    const dateObj = new Date(selectedYear, selectedMonth - 1, dayNum)
    const dayOfWeek = dateObj.getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
    const isWithinPeriod = (!periodStart || dateStr >= periodStart) && (!periodEnd || dateStr <= periodEnd)
    return {
      dayNum,
      initial: DAYS_OF_WEEK[dayOfWeek],
      isWeekend,
      dateStr,
      isWithinPeriod
    }
  })

  // Jours affichés dans le tableau (tout le mois ou uniquement la période)
  const displayedDays = onlyShowPeriodDays ? days.filter(d => d.isWithinPeriod) : days

  // Chargement des données quand classe/année/mois change
  useEffect(() => {
    if (!selectedClass) return

    let isMounted = true
    setIsLoadingData(true)
    setError(null)
    setIsLoadedFromCache(false)

    fetchMonthlyAttendance(selectedClass, selectedYear, selectedMonth)
      .then(result => {
        if (!isMounted) return
        if (result.error) {
          try {
            const cached = localStorage.getItem(`scogestia_attendance_grid_${selectedClass}_${selectedYear}_${selectedMonth}`)
            if (cached) {
              setGridData(JSON.parse(cached))
              setIsLoadedFromCache(true)
              setIsLoadingData(false)
              return
            }
          } catch (e) {}
          setError(result.error)
        } else if (result.data) {
          const newData: Record<string, string> = {}
          result.data.forEach((att: any) => {
            const key = `${att.student_id}_${att.date}`
            newData[key] = att.status
          })
          setGridData(newData)
          setModifiedCells(new Set())
          try {
            localStorage.setItem(`scogestia_attendance_grid_${selectedClass}_${selectedYear}_${selectedMonth}`, JSON.stringify(newData))
          } catch (e) {}
        }
        setIsLoadingData(false)
      })
      .catch(err => {
        if (isMounted) {
          try {
            const cached = localStorage.getItem(`scogestia_attendance_grid_${selectedClass}_${selectedYear}_${selectedMonth}`)
            if (cached) {
              setGridData(JSON.parse(cached))
              setIsLoadedFromCache(true)
              setIsLoadingData(false)
              return
            }
          } catch (e) {}
          setError(err.message)
          setIsLoadingData(false)
        }
      })

    return () => { isMounted = false }
  }, [selectedClass, selectedYear, selectedMonth])

  const handleCellClick = (studentId: string, dateStr: string, isWeekend: boolean, isWithinPeriod: boolean) => {
    if (isWeekend || !isWithinPeriod) return // Impossible de modifier les weekends ou les jours hors période
    
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

    if (!navigator.onLine) {
      saveToOfflineQueue(updates)
      return
    }

    startTransition(async () => {
      try {
        const result = await saveMonthlyAttendanceGrid(selectedClass, selectedYear, selectedMonth, updates)
        if (result?.error) {
          saveToOfflineQueue(updates)
        } else {
          setSuccess(true)
          setModifiedCells(new Set())
          try {
            localStorage.setItem(`scogestia_attendance_grid_${selectedClass}_${selectedYear}_${selectedMonth}`, JSON.stringify(gridData))
          } catch (e) {}
          setTimeout(() => setSuccess(false), 3000)
        }
      } catch (err) {
        saveToOfflineQueue(updates)
      }
    })
  }

  const getCellDisplay = (status?: string) => {
    if (status === 'retard') return '-'
    if (status === 'absent') return '+'
    return ''
  }

  const getTotalAbsences = (studentId: string) => {
    let total = 0
    days.forEach(d => {
      // Ne comptabilise que les jours de la période active et hors weekend
      if (!d.isWithinPeriod || d.isWeekend) return
      const status = gridData[`${studentId}_${d.dateStr}`]
      if (status === 'absent') {
        total += 2 // '+' compte pour 2 demi-journées
      } else if (status === 'retard') {
        total += 1 // '-' compte pour 1 demi-journée
      }
    })
    return total
  }

  // Calculs pour la récapitulation
  const calculateRecap = () => {
    let garconsInscrits = 0, fillesInscrites = 0
    let garconsAbandons = 0, fillesAbandons = 0
    let garconsAbsents = 0, fillesAbsentes = 0
    let garconsPresents = 0, fillesPresentes = 0

    filteredStudents.forEach(student => {
      const isFille = student.gender?.toLowerCase().startsWith('f')
      
      // Inscrits
      if (isFille) fillesInscrites++
      else garconsInscrits++

      // Abandons
      if (student.status === 'abandon' || student.status === 'inactif') {
        if (isFille) fillesAbandons++
        else garconsAbandons++
      }

      // Absences sur le mois
      const absences = getTotalAbsences(student.id)
      if (absences > 0) {
        if (isFille) fillesAbsentes++
        else garconsAbsents++
      } else {
        if (isFille) fillesPresentes++
        else garconsPresents++
      }
    })

    // Calcul des demi-journées ouvrables
    let totalDemiJournees = 0
    if (periodStart && periodEnd) {
      const start = new Date(periodStart)
      const end = new Date(periodEnd)
      const current = new Date(start)

      while (current <= end) {
        const dayOfWeek = current.getDay() // 0 = Dimanche, 3 = Mercredi
        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
          if (dayOfWeek === 3) {
            totalDemiJournees += 1 // Mercredi
          } else {
            totalDemiJournees += 2 // Autres jours
          }
        }
        current.setDate(current.getDate() + 1)
      }
    }

    // Total des absences de la classe
    let totalAbsencesClasse = 0
    filteredStudents.forEach(student => {
      totalAbsencesClasse += getTotalAbsences(student.id)
    })

    const totalInscrits = garconsInscrits + fillesInscrites
    const presencesPossibles = totalDemiJournees * totalInscrits
    const presencesReelles = presencesPossibles > 0 ? presencesPossibles - totalAbsencesClasse : 0
    const tauxAssiduite = presencesPossibles > 0 ? ((presencesReelles / presencesPossibles) * 100).toFixed(2) : '0.00'
    const tauxAbsence = presencesPossibles > 0 ? ((totalAbsencesClasse / presencesPossibles) * 100).toFixed(2) : '0.00'

    return {
      garconsInscrits, fillesInscrites, totalInscrits,
      garconsAbandons, fillesAbandons, totalAbandons: garconsAbandons + fillesAbandons,
      garconsAbsents, fillesAbsentes, totalAbsents: garconsAbsents + fillesAbsentes,
      garconsPresents, fillesPresentes, totalPresents: garconsPresents + fillesPresentes,
      totalDemiJournees,
      totalAbsencesClasse,
      presencesPossibles,
      presencesReelles,
      tauxAssiduite,
      tauxAbsence
    }
  }

  const recap = calculateRecap()

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-[var(--color-surface)] relative">
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[var(--color-surface-container-lowest)] p-6 rounded-xl border border-[var(--color-outline-variant)]">
          <div>
            <div className="flex items-center gap-2 text-[var(--color-on-surface-variant)] mb-2">
              <Link href="/admin/academique" className="hover:text-[var(--color-primary)] transition-colors text-sm font-semibold">
                Académique
              </Link>
              <ChevronRight className="w-4 h-4 text-sm" />
              <span className="text-sm font-semibold text-[var(--color-on-surface)]">Registre d'Appel</span>
            </div>
            <h2 className="text-3xl font-bold text-[var(--color-on-surface)]">Registre d'Appel Journalier</h2>
            <p className="text-base text-[var(--color-on-surface-variant)] mt-1">
              Gérez les absences mensuelles. Cliquez sur une case pour marquer une absence (- matin, + journée entière).
            </p>
          </div>

          {/* Network & Offline Status Pill */}
          <div className="flex items-center gap-3">
            {isOnline ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                En ligne
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-300 shadow-2xs">
                <WifiOff className="w-3.5 h-3.5 text-amber-600" />
                Mode Hors-ligne
              </span>
            )}

            {offlinePendingQueue.length > 0 && (
              <button
                onClick={syncOfflineQueue}
                disabled={isSyncingOffline || !isOnline}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50 transition-all shadow-sm"
                title="Synchroniser les présences en attente"
              >
                <CloudUpload className={`w-3.5 h-3.5 ${isSyncingOffline ? 'animate-bounce' : ''}`} />
                {isSyncingOffline ? 'Synchronisation...' : `Synchroniser (${offlinePendingQueue.length})`}
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-outline-variant)] p-5 md:p-6 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-[var(--color-on-surface)] flex items-center gap-1.5">
                <School className="w-4 h-4 text-[var(--color-primary)]" />
                Classe
              </label>
              <select 
                value={selectedClass} 
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full h-11 px-3 border border-[var(--color-outline-variant)] rounded-lg text-sm focus:border-[var(--color-primary)] outline-none bg-[var(--color-surface)] text-[var(--color-on-surface)]"
              >
                <option value="">Sélectionner une classe...</option>
                {sortClasses(classes).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-[var(--color-on-surface)] flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[var(--color-primary)]" />
                Mois
              </label>
              <select 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="w-full h-11 px-3 border border-[var(--color-outline-variant)] rounded-lg text-sm focus:border-[var(--color-primary)] outline-none bg-[var(--color-surface)] text-[var(--color-on-surface)]"
              >
                {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-[var(--color-on-surface)] flex items-center gap-1.5">
                <CalendarDays className="w-4 h-4 text-[var(--color-primary)]" />
                Année
              </label>
              <select 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-full h-11 px-3 border border-[var(--color-outline-variant)] rounded-lg text-sm focus:border-[var(--color-primary)] outline-none bg-[var(--color-surface)] text-[var(--color-on-surface)]"
              >
                {[currentDate.getFullYear() - 1, currentDate.getFullYear(), currentDate.getFullYear() + 1].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-[var(--color-on-surface)] flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-blue-600" />
                Période du :
              </label>
              <input 
                type="date"
                value={periodStart}
                min={`${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`}
                max={periodEnd || `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${daysInMonth}`}
                onChange={(e) => setPeriodStart(e.target.value)}
                className="w-full h-11 px-3 border border-[var(--color-outline-variant)] rounded-lg text-sm focus:border-[var(--color-primary)] outline-none bg-[var(--color-surface)] font-medium text-[var(--color-on-surface)]"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-[var(--color-on-surface)] flex items-center gap-1.5">
                <CalendarDays className="w-4 h-4 text-blue-600" />
                Au :
              </label>
              <input 
                type="date"
                value={periodEnd}
                min={periodStart || `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`}
                max={`${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${daysInMonth}`}
                onChange={(e) => setPeriodEnd(e.target.value)}
                className="w-full h-11 px-3 border border-[var(--color-outline-variant)] rounded-lg text-sm focus:border-[var(--color-primary)] outline-none bg-[var(--color-surface)] font-medium text-[var(--color-on-surface)]"
              />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[var(--color-outline-variant)] flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-800 font-semibold border border-blue-200">
                <Calendar className="w-3.5 h-3.5" />
                <span>
                  Période : {periodStart ? new Date(periodStart + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '—'} au {periodEnd ? new Date(periodEnd + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                </span>
              </div>
              <span className="text-[var(--color-on-surface-variant)] font-medium">
                • {days.filter(d => d.isWithinPeriod && !d.isWeekend).length} jours de classe ouvré(s) ({recap.totalDemiJournees} demi-journées ouvrables)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const start = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`
                  const end = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`
                  setPeriodStart(start)
                  setPeriodEnd(end)
                }}
                className="px-2.5 py-1 rounded text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors border border-gray-300"
              >
                Réinitialiser tout le mois
              </button>
            </div>
          </div>
        </div>

        {offlineSavedMsg && (
          <div className="bg-amber-50 border border-amber-300 text-amber-900 p-4 rounded-xl text-sm font-medium flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <WifiOff className="w-5 h-5 text-amber-600 shrink-0" />
              <span>Modifications sauvegardées hors-ligne sur votre appareil. Elles seront synchronisées automatiquement dès que la connexion Internet sera rétablie.</span>
            </div>
            {isOnline && (
              <button 
                onClick={syncOfflineQueue}
                disabled={isSyncingOffline}
                className="px-3.5 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700 transition-colors shrink-0 flex items-center gap-1.5"
              >
                <CloudUpload className="w-4 h-4" />
                Synchroniser maintenant
              </button>
            )}
          </div>
        )}

        {isLoadedFromCache && (
          <div className="bg-blue-50 border border-blue-200 text-blue-900 p-3 rounded-xl text-xs font-medium flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            Mode hors-ligne : données du registre chargées depuis la mémoire cache locale de cet appareil.
          </div>
        )}

        {error && (
          <div className="bg-[var(--color-status-retard-bg)] text-[var(--color-status-retard-text)] p-3 rounded text-sm font-medium">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-[#e6f4ea] text-[#1e8e3e] p-3 rounded text-sm font-medium flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            Registre sauvegardé avec succès.
          </div>
        )}

        {/* Data Grid */}
        {selectedClass ? (
          <div className="bg-white rounded-xl border border-gray-300 overflow-hidden shadow-sm flex flex-col mt-4">
            <div className="p-4 border-b border-gray-200 flex flex-wrap justify-between items-center gap-4 bg-gray-50/50">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="font-semibold text-[var(--color-on-surface)] flex items-center gap-3">
                  <span>Registre d'appel - {MONTHS.find(m => m.value === selectedMonth)?.label} {selectedYear}</span>
                  {isLoadingData && <span className="w-4 h-4 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></span>}
                </h3>

                {/* Filter toggle button */}
                <div className="inline-flex rounded-lg border border-gray-300 p-0.5 bg-gray-100 text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => setOnlyShowPeriodDays(false)}
                    className={`px-2.5 py-1 rounded-md transition-all ${!onlyShowPeriodDays ? 'bg-white text-gray-900 shadow-sm font-semibold' : 'text-gray-600 hover:text-gray-900'}`}
                  >
                    Vue mois entier ({daysInMonth}j)
                  </button>
                  <button
                    type="button"
                    onClick={() => setOnlyShowPeriodDays(true)}
                    className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${onlyShowPeriodDays ? 'bg-white text-blue-700 shadow-sm font-semibold' : 'text-gray-600 hover:text-gray-900'}`}
                  >
                    <span>Période seule</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                      {days.filter(d => d.isWithinPeriod).length}j
                    </span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const today = new Date()
                    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
                    const el = document.getElementById(`day-col-${todayStr}`)
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
                    }
                  }}
                  className="px-2.5 py-1 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
                  title="Faire défiler jusqu'au jour d'aujourd'hui"
                >
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  <span>Aujourd'hui</span>
                </button>
              </div>
              
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex flex-wrap gap-3 text-xs font-medium text-gray-500">
                  <div className="flex items-center gap-1"><span className="w-4 h-4 flex items-center justify-center bg-gray-100 rounded text-gray-800 font-bold border border-gray-200">-</span> Absent Matin</div>
                  <div className="flex items-center gap-1"><span className="w-4 h-4 flex items-center justify-center bg-gray-100 rounded text-gray-800 font-bold border border-gray-200">+</span> Absent Journée</div>
                  <div className="flex items-center gap-1"><span className="w-4 h-4 flex items-center justify-center bg-gray-200/80 rounded text-gray-400 font-bold border border-gray-300">/</span> Hors période</div>
                </div>
                
                <button 
                  onClick={handleSave}
                  disabled={isPending || modifiedCells.size === 0}
                  className="hidden md:flex bg-[var(--color-primary)] text-white px-6 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed items-center gap-2"
                >
                  {isPending ? 'Enregistrement...' : "Enregistrer"}
                  {modifiedCells.size > 0 && !isPending && <span className="bg-white/20 px-1.5 py-0.5 rounded text-xs">{modifiedCells.size}</span>}
                </button>

                <button 
                  onClick={() => setIsRecapOpen(true)}
                  className="hidden md:flex bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Récapitulation
                </button>
              </div>
            </div>

            {/* Data Grid Table */}
            <div className="overflow-x-auto max-h-[70vh] custom-scrollbar relative">
              <table className="w-full text-left border-collapse border-spacing-0 select-none bg-white">
                <thead className="sticky top-0 z-30">
                  {/* First header row: Indication des absences */}
                  <tr>
                    <th rowSpan={2} className="border border-gray-400 py-2 px-1 font-semibold text-center w-8 min-w-[32px] max-w-[32px] md:w-12 md:min-w-[48px] md:max-w-[48px] bg-gray-100 text-gray-700 text-xs sm:text-sm z-50 sticky left-0">
                      N°
                    </th>
                    <th rowSpan={2} className="border border-gray-400 py-2 px-2 md:px-3 font-semibold w-[130px] min-w-[130px] max-w-[130px] md:w-64 md:min-w-[256px] md:max-w-[256px] bg-gray-100 text-gray-700 text-xs sm:text-sm z-50 sticky left-[32px] md:left-[48px]">
                      Nom et prénom
                    </th>
                    <th rowSpan={2} className="border border-gray-400 border-r-2 border-r-gray-400 py-2 px-1 font-semibold text-center w-8 min-w-[32px] max-w-[32px] md:w-14 md:min-w-[56px] md:max-w-[56px] bg-gray-100 text-gray-700 text-xs sm:text-sm z-50 sticky left-[162px] md:left-[304px] shadow-[4px_0_8px_-2px_rgba(0,0,0,0.18)]">
                      Sexe
                    </th>
                    <th colSpan={displayedDays.length} className="border border-gray-400 py-1 font-bold text-center bg-indigo-50/50 text-gray-700 text-xs sm:text-sm tracking-wide">
                      Indication des absences
                    </th>
                    <th rowSpan={2} className="border border-gray-400 py-2 px-2 font-semibold text-center w-16 sm:w-24 bg-gray-100 text-gray-700 text-xs sm:text-sm z-20">
                      Total Abs.
                    </th>
                  </tr>
                  {/* Second header row: Day numbers and initials */}
                  <tr>
                    {displayedDays.map(d => (
                      <th 
                        key={d.dayNum} 
                        id={`day-col-${d.dateStr}`}
                        className={`border border-gray-400 p-0 text-center min-w-[34px] w-[34px] sm:min-w-[28px] sm:w-[28px] text-[11px]
                          ${!d.isWithinPeriod 
                            ? 'bg-gray-200/70 text-gray-400' 
                            : d.isWeekend 
                              ? 'bg-blue-100/50 text-blue-900' 
                              : 'bg-white text-gray-700'}
                        `}
                        title={!d.isWithinPeriod ? 'Jour hors période scolaire' : d.isWeekend ? 'Weekend' : `Jour ${d.dayNum}`}
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
                  {filteredStudents.map((student, index) => {
                    const isFille = student.gender?.toLowerCase().startsWith('f')
                    const textColor = isFille ? 'text-red-600' : 'text-gray-900'
                    return (
                      <tr key={student.id} className="hover:bg-gray-50 group">
                        <td className="border border-gray-400 py-2 px-1 text-center text-gray-600 font-semibold bg-white z-20 group-hover:bg-gray-100 text-xs sticky left-0 w-8 min-w-[32px] max-w-[32px] md:w-12 md:min-w-[48px] md:max-w-[48px]">
                          {String(index + 1).padStart(2, '0')}
                        </td>
                        <td 
                          title={`${student.last_name} ${student.first_name}`}
                          className={`border border-gray-400 py-2 px-2 font-semibold bg-white z-20 whitespace-nowrap overflow-hidden text-ellipsis group-hover:bg-gray-100 text-xs sticky left-[32px] md:left-[48px] w-[130px] min-w-[130px] max-w-[130px] md:w-64 md:min-w-[256px] md:max-w-[256px] ${textColor}`}
                        >
                          {student.last_name} {student.first_name}
                        </td>
                        <td className={`border border-gray-400 border-r-2 border-r-gray-400 py-2 px-1 font-bold text-center bg-white z-20 group-hover:bg-gray-100 text-xs sticky left-[162px] md:left-[304px] w-8 min-w-[32px] max-w-[32px] md:w-14 md:min-w-[56px] md:max-w-[56px] shadow-[4px_0_8px_-2px_rgba(0,0,0,0.18)] ${textColor}`}>
                          {isFille ? 'F' : 'M'}
                        </td>
                        {displayedDays.map(d => {
                          const key = `${student.id}_${d.dateStr}`
                          const status = gridData[key]
                          const isModified = modifiedCells.has(key)
                          return (
                            <td 
                              key={d.dayNum} 
                              onClick={() => handleCellClick(student.id, d.dateStr, d.isWeekend, d.isWithinPeriod)}
                              title={
                                !d.isWithinPeriod 
                                  ? 'Jour hors période scolaire définie' 
                                  : d.isWeekend 
                                    ? 'Weekend (aucun cours)' 
                                    : 'Cliquez pour marquer : Présent -> Retard (-) -> Absent (+)'
                              }
                              className={`
                                border border-gray-400 p-0 text-center text-sm font-black transition-colors select-none
                                ${!d.isWithinPeriod 
                                  ? 'bg-gray-100/80 text-gray-300 cursor-not-allowed' 
                                  : d.isWeekend 
                                    ? 'bg-blue-100/30 cursor-not-allowed' 
                                    : 'cursor-pointer hover:bg-gray-100 active:bg-blue-50'}
                                ${isModified ? 'text-indigo-600 bg-indigo-50/50' : 'text-gray-900'}
                              `}
                            >
                              <div className="w-full h-9 sm:h-8 flex items-center justify-center text-base sm:text-sm font-black">
                                {!d.isWithinPeriod ? (
                                  <span className="text-gray-300 text-xs font-normal">/</span>
                                ) : !d.isWeekend ? (
                                  getCellDisplay(status)
                                ) : null}
                              </div>
                            </td>
                          )
                        })}
                        <td className="border border-gray-400 py-2 px-2 text-center font-bold text-gray-700 bg-gray-50/50 text-xs sm:text-sm">
                          {getTotalAbsences(student.id)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Barre d'action mobile fixe en bas */}
            <div className="p-3 border-t border-gray-200 bg-white/95 backdrop-blur-xs flex md:hidden items-center justify-between gap-2 sticky bottom-0 z-30 shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
              <button 
                onClick={() => setIsRecapOpen(true)}
                className="flex-1 bg-blue-50 border border-blue-200 text-blue-700 px-3 py-2.5 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors flex items-center justify-center gap-1.5"
              >
                <FileText className="w-4 h-4" />
                Récapitulatif
              </button>

              <button 
                onClick={handleSave}
                disabled={isPending || modifiedCells.size === 0}
                className="flex-1 bg-[var(--color-primary)] text-white px-3 py-2.5 rounded-lg text-xs font-bold hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 shadow-sm"
              >
                {isPending ? 'Enregistrement...' : "Enregistrer"}
                {modifiedCells.size > 0 && !isPending && (
                  <span className="bg-white/25 px-1.5 py-0.2 rounded-full text-[10px] font-bold">
                    {modifiedCells.size}
                  </span>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-outline-variant)] p-12 flex flex-col items-center justify-center text-center text-[var(--color-on-surface-variant)] min-h-[400px]">
            <ClipboardCheck className="w-10 h-10 mb-2 opacity-50 text-[var(--color-primary)]" />
            <p className="text-lg font-medium">Sélectionnez une classe pour afficher le registre</p>
            <p className="text-sm">La grille d'appel du mois apparaîtra ici.</p>
          </div>
        )}
      </div>

      {/* Modal de Récapitulation */}
      {isRecapOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-blue-600">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Récapitulation du mois - {MONTHS.find(m => m.value === selectedMonth)?.label} {selectedYear}
              </h3>
              <button onClick={() => setIsRecapOpen(false)} className="text-blue-100 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-8 flex-1">
              
              {/* Paramètres de la période */}
              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                <h4 className="font-semibold text-blue-900 mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-700" />
                  Définir la période du cours
                </h4>
                <div className="flex flex-wrap items-end gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-600">Date de début</label>
                    <input 
                      type="date" 
                      value={periodStart}
                      min={`${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`}
                      max={periodEnd || `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${daysInMonth}`}
                      onChange={e => setPeriodStart(e.target.value)}
                      className="h-10 px-3 border border-gray-300 rounded-lg text-sm focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-600">Date de fin</label>
                    <input 
                      type="date" 
                      value={periodEnd}
                      min={periodStart || `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`}
                      max={`${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${daysInMonth}`}
                      onChange={e => setPeriodEnd(e.target.value)}
                      className="h-10 px-3 border border-gray-300 rounded-lg text-sm focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Tableau croisé */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Table className="w-4 h-4 text-gray-700" />
                  Tableau Croisé (Effectifs et Présences)
                </h4>
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                  <table className="w-full min-w-[300px] text-left border-collapse bg-white text-xs sm:text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="border border-gray-300 p-2 sm:p-3 font-semibold text-gray-800">Catégorie</th>
                        <th className="border border-gray-300 p-2 sm:p-3 font-bold text-gray-800 text-center">G</th>
                        <th className="border border-gray-300 p-2 sm:p-3 font-bold text-gray-800 text-center">F</th>
                        <th className="border border-gray-300 p-2 sm:p-3 font-bold text-gray-800 text-center bg-gray-100">T</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="hover:bg-gray-50">
                        <td className="border border-gray-300 p-2 sm:p-3 font-semibold text-gray-800">Inscrits</td>
                        <td className="border border-gray-300 p-2 sm:p-3 text-center font-medium text-gray-800">{recap.garconsInscrits || '0'}</td>
                        <td className="border border-gray-300 p-2 sm:p-3 text-center font-medium text-gray-800">{recap.fillesInscrites || '0'}</td>
                        <td className="border border-gray-300 p-2 sm:p-3 text-center font-bold text-gray-800 bg-gray-50">{recap.totalInscrits || '0'}</td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="border border-gray-300 p-2 sm:p-3 font-semibold text-gray-800">Présents</td>
                        <td className="border border-gray-300 p-2 sm:p-3 text-center font-medium text-gray-800">{recap.garconsPresents || '0'}</td>
                        <td className="border border-gray-300 p-2 sm:p-3 text-center font-medium text-gray-800">{recap.fillesPresentes || '0'}</td>
                        <td className="border border-gray-300 p-2 sm:p-3 text-center font-bold text-gray-800 bg-gray-50">{recap.totalPresents || '0'}</td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="border border-gray-300 p-2 sm:p-3 font-semibold text-gray-800">Absents</td>
                        <td className="border border-gray-300 p-2 sm:p-3 text-center font-medium text-gray-800">{recap.garconsAbsents || '0'}</td>
                        <td className="border border-gray-300 p-2 sm:p-3 text-center font-medium text-gray-800">{recap.fillesAbsentes || '0'}</td>
                        <td className="border border-gray-300 p-2 sm:p-3 text-center font-bold text-gray-800 bg-gray-50">{recap.totalAbsents || '0'}</td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="border border-gray-300 p-2 sm:p-3 font-semibold text-gray-800">Abandons</td>
                        <td className="border border-gray-300 p-2 sm:p-3 text-center font-medium text-gray-800">{recap.garconsAbandons || '0'}</td>
                        <td className="border border-gray-300 p-2 sm:p-3 text-center font-medium text-gray-800">{recap.fillesAbandons || '0'}</td>
                        <td className="border border-gray-300 p-2 sm:p-3 text-center font-bold text-gray-800 bg-gray-50">{recap.totalAbandons || '0'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Indicateurs de performance */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-gray-700" />
                  Récapitulatif du mois de {MONTHS.find(m => m.value === selectedMonth)?.label} {selectedYear}
                </h4>
                <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 sm:p-6">
                  <ul className="space-y-3 text-sm sm:text-base text-gray-800">
                    <li className="flex justify-between items-center py-1 border-b border-gray-200">
                      <span className="font-medium">Nombre de demi-journées</span>
                      <span className="font-bold">{recap.totalDemiJournees || '0'}</span>
                    </li>
                    <li className="flex justify-between items-center py-1 border-b border-gray-200">
                      <span className="font-medium">Nombre de présences possibles</span>
                      <span className="font-bold">{recap.presencesPossibles || '0'}</span>
                    </li>
                    <li className="flex justify-between items-center py-1 border-b border-gray-200">
                      <span className="font-medium">Nombre total d'absences</span>
                      <span className="font-bold">{recap.totalAbsencesClasse || '0'}</span>
                    </li>
                    <li className="flex justify-between items-center py-1 border-b border-gray-200">
                      <span className="font-medium">Nombre de présences effectives</span>
                      <span className="font-bold">{recap.presencesReelles || '0'}</span>
                    </li>
                    <li className="flex justify-between items-center py-1 border-b border-gray-200">
                      <span className="font-medium">Pourcentage des présences effectives</span>
                      <span className="font-bold">{recap.tauxAssiduite} %</span>
                    </li>
                    <li className="flex justify-between items-center py-1">
                      <span className="font-medium">Pourcentage des absences</span>
                      <span className="font-bold">{recap.tauxAbsence} %</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Signatures */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <p className="text-right text-sm text-gray-700 mb-6">Fermé le {new Date().toLocaleDateString('fr-FR')}</p>
                <div className="flex justify-between items-start text-sm font-semibold text-gray-800">
                  <div className="text-center w-1/3">
                    <p className="mb-16">Le titulaire</p>
                    <p className="font-normal text-gray-600 border-t border-gray-400 pt-1 w-32 mx-auto"></p>
                  </div>
                  <div className="text-center text-gray-400 text-xs mt-10 w-1/3">
                    (Cachet de l'établissement)
                  </div>
                  <div className="text-center w-1/3">
                    <p className="mb-16">Le directeur</p>
                    <p className="font-normal text-gray-600 border-t border-gray-400 pt-1 w-32 mx-auto"></p>
                  </div>
                </div>
              </div>

            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button 
                onClick={() => setIsRecapOpen(false)}
                className="px-6 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Fermer
              </button>
              {/* Optional: un bouton pour imprimer le PDF */}
              <button 
                onClick={() => window.print()}
                className="px-6 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Imprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
