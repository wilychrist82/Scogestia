'use client'

import React, { useState, useEffect, useRef, KeyboardEvent } from 'react'
import { saveGrade, syncOfflineGrades, GradeSavePayload } from '@/app/actions/grades'
import { WifiOff, CheckCircle2, Loader2, AlertCircle, CloudOff } from 'lucide-react'

type Student = {
  id: string
  first_name: string
  last_name: string
}

type GradeEntry = {
  student_id: string
  evaluation_type: 'devoir_maison' | 'devoir_mensuel' | 'composition_trimestrielle'
  score: number | null
}

type Props = {
  classId: string
  subjectName: string
  term: string
  students: Student[]
  initialGrades: GradeEntry[]
}

type CellStatus = 'idle' | 'saving' | 'saved' | 'error' | 'offline_queued'

export function GradesGrid({ classId, subjectName, term, students, initialGrades }: Props) {
  const [grades, setGrades] = useState<Record<string, Record<string, number | null>>>(() => {
    const map: Record<string, Record<string, number | null>> = {}
    students.forEach(s => {
      map[s.id] = {
        devoir_maison: null,
        devoir_mensuel: null,
        composition_trimestrielle: null
      }
    })
    initialGrades.forEach(g => {
      if (map[g.student_id]) {
        map[g.student_id][g.evaluation_type] = g.score
      }
    })
    return map
  })

  // Stocke l'état visuel de chaque cellule ("student_id-eval_type")
  const [cellStatus, setCellStatus] = useState<Record<string, CellStatus>>({})
  
  // File d'attente hors-ligne
  const [offlineQueue, setOfflineQueue] = useState<GradeSavePayload[]>([])
  const [isOnline, setIsOnline] = useState(true)

  // Réfs pour la navigation clavier (matrice 2D : [rowIndex][colIndex])
  const inputRefs = useRef<(HTMLInputElement | null)[][]>([])

  useEffect(() => {
    setIsOnline(navigator.onLine)
    
    const handleOnline = () => {
      setIsOnline(true)
      // Synchroniser la file d'attente
      if (offlineQueue.length > 0) {
        syncOfflineGrades(offlineQueue).then(res => {
          if (res.success) {
            setOfflineQueue([])
            // Mettre à jour visuellement les cellules en queued -> saved
            setCellStatus(prev => {
              const newStatus = { ...prev }
              Object.keys(newStatus).forEach(key => {
                if (newStatus[key] === 'offline_queued') newStatus[key] = 'saved'
              })
              return newStatus
            })
          }
        })
      }
    }
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [offlineQueue])

  const handleScoreChange = (studentId: string, evalType: string, val: string) => {
    const score = val === '' ? null : parseFloat(val)
    
    setGrades(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [evalType]: score
      }
    }))
  }

  const handleBlur = async (studentId: string, evalType: 'devoir_maison' | 'devoir_mensuel' | 'composition_trimestrielle', rIdx: number, cIdx: number) => {
    const score = grades[studentId][evalType]
    const cellKey = `${studentId}-${evalType}`

    // Validation
    if (score !== null && (score < 0 || score > 20 || isNaN(score))) {
      setCellStatus(prev => ({ ...prev, [cellKey]: 'error' }))
      return
    }

    const payload: GradeSavePayload = {
      student_id: studentId,
      class_id: classId,
      subject_name: subjectName,
      term,
      evaluation_type: evalType,
      score
    }

    if (!isOnline) {
      // Offline mode
      setOfflineQueue(prev => {
        // Remplacer s'il y a déjà une entrée pour cette cellule
        const filtered = prev.filter(p => !(p.student_id === studentId && p.evaluation_type === evalType))
        return [...filtered, payload]
      })
      setCellStatus(prev => ({ ...prev, [cellKey]: 'offline_queued' }))
      return
    }

    // Online mode - save
    setCellStatus(prev => ({ ...prev, [cellKey]: 'saving' }))
    
    const res = await saveGrade(payload)
    if (res.error) {
      setCellStatus(prev => ({ ...prev, [cellKey]: 'error' }))
    } else {
      setCellStatus(prev => ({ ...prev, [cellKey]: 'saved' }))
      // Effacer le 'saved' après 3 secondes pour garder l'interface propre
      setTimeout(() => {
        setCellStatus(prev => ({ ...prev, [cellKey]: 'idle' }))
      }, 3000)
    }
  }

  // Navigation au clavier type tableur Excel
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, rIdx: number, cIdx: number) => {
    const numCols = 3
    const numRows = students.length

    if (e.key === 'ArrowDown' || e.key === 'Enter') {
      e.preventDefault()
      const nextRow = rIdx + 1
      if (nextRow < numRows) inputRefs.current[nextRow][cIdx]?.focus()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const prevRow = rIdx - 1
      if (prevRow >= 0) inputRefs.current[prevRow][cIdx]?.focus()
    } else if (e.key === 'ArrowRight') {
      // Ne bouger que si le curseur est à la fin du texte pour ne pas gêner l'édition
      const target = e.target as HTMLInputElement
      if (target.selectionStart === target.value.length) {
        e.preventDefault()
        const nextCol = cIdx + 1
        if (nextCol < numCols) inputRefs.current[rIdx][nextCol]?.focus()
      }
    } else if (e.key === 'ArrowLeft') {
      const target = e.target as HTMLInputElement
      if (target.selectionStart === 0) {
        e.preventDefault()
        const prevCol = cIdx - 1
        if (prevCol >= 0) inputRefs.current[rIdx][prevCol]?.focus()
      }
    }
  }

  // Initialisation matrice refs
  if (inputRefs.current.length !== students.length) {
    inputRefs.current = Array(students.length).fill(null).map(() => Array(3).fill(null))
  }

  const columns = [
    { key: 'devoir_maison' as const, label: 'Devoir Maison', coeff: 'Coeff 0.5' },
    { key: 'devoir_mensuel' as const, label: 'Devoir Mensuel', coeff: 'Coeff 1' },
    { key: 'composition_trimestrielle' as const, label: 'Composition', coeff: 'Coeff 2' },
  ]

  // Stats
  const savingCount = Object.values(cellStatus).filter(v => v === 'saving').length
  const errorCount = Object.values(cellStatus).filter(v => v === 'error').length
  const savedCount = Object.values(cellStatus).filter(v => v === 'saved').length

  return (
    <div className="flex flex-col h-full">
      {/* Header Info */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-[var(--color-on-background)]">Saisie des Notes</h2>
          <p className="text-[var(--color-on-surface-variant)] mt-1">Matière: <strong className="text-[var(--color-primary)]">{subjectName}</strong> | {term}</p>
        </div>
        
        {offlineQueue.length > 0 && (
          <div className="bg-amber-50 text-amber-800 border border-amber-200 px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-amber-600" />
            <span>{offlineQueue.length} notes en attente (Hors-ligne)</span>
          </div>
        )}
      </div>

      {/* Grid */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-max">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 font-semibold text-xs text-slate-600 sticky left-0 bg-slate-50 z-10 w-64 border-r border-slate-200">
                  Élève
                </th>
                {columns.map(col => (
                  <th key={col.key} className="py-3 px-4 min-w-[140px] border-r border-slate-200">
                    <div className="font-semibold text-xs text-slate-800">{col.label}</div>
                    <div className="text-[11px] text-slate-500 font-normal">{col.coeff} • /20</div>
                  </th>
                ))}
                <th className="py-3 px-4 min-w-[100px] text-right font-semibold text-xs text-slate-800">
                  Moyenne
                </th>
              </tr>
            </thead>
            
            <tbody className="text-sm text-slate-900 divide-y divide-slate-100">
              {students.map((student, rIdx) => {
                
                // Calcul Moyenne ligne
                let sumCoeff = 0
                let sumGrades = 0
                
                columns.forEach(col => {
                  const val = grades[student.id][col.key]
                  if (val !== null && !isNaN(val)) {
                    const c = col.key === 'composition_trimestrielle' ? 2 : (col.key === 'devoir_mensuel' ? 1 : 0.5)
                    sumCoeff += c
                    sumGrades += (val * c)
                  }
                })

                const avg = sumCoeff > 0 ? (sumGrades / sumCoeff).toFixed(2) : '--'

                return (
                  <tr key={student.id} className="hover:bg-slate-50/80 transition-colors bg-white">
                    
                    {/* Colonne Élève figée */}
                    <td className="py-2.5 px-4 sticky left-0 bg-inherit border-r border-slate-100 flex items-center gap-2.5 font-medium text-slate-800">
                      <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-semibold shrink-0">
                        {student.first_name[0]}{student.last_name[0]}
                      </div>
                      <span className="truncate">{student.first_name} {student.last_name}</span>
                    </td>

                    {/* Cellules Édition */}
                    {columns.map((col, cIdx) => {
                      const cellKey = `${student.id}-${col.key}`
                      const status = cellStatus[cellKey] || 'idle'
                      const val = grades[student.id][col.key]

                      let inputClass = "w-full h-9 px-2.5 pr-7 rounded-lg text-sm text-right transition-colors outline-none font-medium "
                      
                      // Couleurs d'état
                      if (status === 'error') {
                        inputClass += "border border-rose-300 text-rose-900 focus:border-rose-500 bg-rose-50/50"
                      } else if (status === 'saving') {
                        inputClass += "border border-blue-400 focus:border-blue-500 bg-blue-50/20 text-slate-900"
                      } else {
                        inputClass += "border border-slate-200 focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]/20 bg-white text-slate-900"
                      }

                      return (
                        <td key={col.key} className="py-2 px-3 border-r border-slate-100">
                          <div className="relative flex items-center group">
                            <input
                              ref={el => { inputRefs.current[rIdx][cIdx] = el }}
                              type="number"
                              min="0"
                              max="20"
                              step="0.25"
                              value={val === null ? '' : val}
                              onChange={e => handleScoreChange(student.id, col.key, e.target.value)}
                              onBlur={() => handleBlur(student.id, col.key, rIdx, cIdx)}
                              onKeyDown={e => handleKeyDown(e, rIdx, cIdx)}
                              className={inputClass}
                              placeholder="-"
                            />
                            
                            {/* Indicateurs (coche, erreur, spinner) */}
                            {status === 'saved' && (
                              <span className="absolute right-2" title="Sauvegardé">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              </span>
                            )}
                            {status === 'saving' && (
                              <span className="absolute right-2" title="Enregistrement...">
                                <Loader2 className="w-3.5 h-3.5 text-slate-400 animate-spin" />
                              </span>
                            )}
                            {status === 'error' && (
                              <span className="absolute right-2" title="Erreur (doit être entre 0 et 20)">
                                <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                              </span>
                            )}
                            {status === 'offline_queued' && (
                              <span className="absolute right-2" title="En attente de réseau">
                                <CloudOff className="w-3.5 h-3.5 text-amber-600" />
                              </span>
                            )}
                          </div>
                        </td>
                      )
                    })}

                    {/* Colonne Moyenne */}
                    <td className="py-2 px-4 text-right font-semibold text-slate-800">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                        avg !== '--' && parseFloat(avg) >= 10
                          ? 'bg-emerald-50 text-emerald-700'
                          : avg !== '--'
                            ? 'bg-rose-50 text-rose-700'
                            : 'text-slate-400'
                      }`}>
                        {avg}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        
        {/* Footer info */}
        <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 flex justify-between items-center text-xs font-medium text-slate-500">
          <span>{students.length} Élève(s) inscrit(s)</span>
          <div className="flex items-center gap-4">
            {savedCount > 0 && (
              <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> {savedCount} Sauvegardé(s)
              </span>
            )}
            {savingCount > 0 && (
              <span className="flex items-center gap-1.5 text-blue-700 font-semibold">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> En cours...
              </span>
            )}
            {errorCount > 0 && (
              <span className="flex items-center gap-1.5 text-rose-600 font-semibold">
                <AlertCircle className="w-3.5 h-3.5" /> {errorCount} Erreur(s)
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
