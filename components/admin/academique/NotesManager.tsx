'use client'

import { useState, useTransition, FormEvent, useEffect, useMemo, useRef } from 'react'
import { savePrimaryGrades, saveSecondaryGrades } from '@/app/actions/academique'
import Link from 'next/link'
import { sortClasses } from '@/lib/classes'
import { 
  ChevronRight, 
  Table, 
  Save, 
  Loader2, 
  User, 
  ChevronLeft, 
  CheckCircle2, 
  AlertCircle,
  BookOpen,
  Calendar,
  Layers,
  GraduationCap,
  ArrowLeft,
  Search,
  FileText,
  Calculator,
  Award
} from 'lucide-react'
import { 
  getCoefficientForSubject, 
  detectClassSeriesKey, 
  LYCEE_SERIES_CONFIG,
  getPrimarySubjectMaxScore,
  detectPrimaryLevel,
  calculateDisciplineAverage,
  calculatePrimaryGeneralAverage
} from '@/lib/academic-curriculum'

type ClassItem = { id: string; name: string; level?: string }
type SubjectItem = { id: string; name: string; cycle: string; category?: string | null; coefficient?: number }
type StudentItem = { id: string; last_name: string; first_name: string; matricule: string; class_id: string }

type PrimaryGradeItem = { student_id: string; subject_id: string; month_number: number; score: number }
type SecondaryGradeItem = { student_id: string; subject_id: string; term: string; class_score: number | null; comp_score: number | null }

type Props = {
  classes: ClassItem[]
  subjects: SubjectItem[]
  students: StudentItem[]
  primaryGrades: PrimaryGradeItem[]
  secondaryGrades: SecondaryGradeItem[]
}

const CATEGORY_PRIORITY: Record<string, number> = {
  'Français': 1,
  'Mathématiques': 2,
  'Sciences': 3,
  'Divers': 4,
  'Général': 5,
}

export function NotesManager({ classes, subjects, students, primaryGrades, secondaryGrades }: Props) {
  const [selectedCycle, setSelectedCycle] = useState<string>('primaire')
  const [selectedClass, setSelectedClass] = useState<string>('')
  const [selectedStudent, setSelectedStudent] = useState<string>('') // Mode primaire / maternelle
  const [selectedSubject, setSelectedSubject] = useState<string>('') // Mode secondaire
  const [selectedTerm, setSelectedTerm] = useState<string>('1er_trimestre') // Mode secondaire
  const [searchStudentTerm, setSearchStudentTerm] = useState<string>('')

  const [allPrimaryGrades, setAllPrimaryGrades] = useState<PrimaryGradeItem[]>(primaryGrades)
  const [allSecondaryGrades, setAllSecondaryGrades] = useState<SecondaryGradeItem[]>(secondaryGrades)
  const [studentScores, setStudentScores] = useState<Record<string, string>>({})
  const [nextAfterSave, setNextAfterSave] = useState<boolean>(false)

  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Keep local copies in sync when props change
  useEffect(() => {
    setAllPrimaryGrades(primaryGrades)
  }, [primaryGrades])

  useEffect(() => {
    setAllSecondaryGrades(secondaryGrades)
  }, [secondaryGrades])

  const isPrimaryCycle = selectedCycle === 'primaire' || selectedCycle === 'maternelle'
  const isSecondaryCycle = !isPrimaryCycle
  const selectedClassObj = classes.find(c => c.id === selectedClass)

  const filteredClasses = sortClasses(classes.filter(c => {
    const full = ((c.level || '') + ' ' + (c.name || '')).toLowerCase();
    
    if (selectedCycle === 'maternelle') {
      return ['s1', 's2', 'section1', 'section2', 'maternelle', 'ps', 'ms', 'gs'].some(k => full.includes(k));
    }
    if (selectedCycle === 'primaire') {
      return ['cp1', 'cp2', 'cp', 'ce1', 'ce2', 'ce', 'cm1', 'cm2', 'cm', 'ci', 'primaire'].some(k => full.includes(k));
    }
    if (selectedCycle === 'college') {
      return ['6eme', '6ème', '5eme', '5ème', '4eme', '4ème', '3eme', '3ème', 'college', 'collège', '6e', '5e', '4e', '3e'].some(k => full.includes(k));
    }
    if (selectedCycle === 'lycee') {
      return ['2nde', 'seconde', '1ere', '1ère', 'premiere', 'tle', 'terminale', 'lycee', 'lycée'].some(k => full.includes(k));
    }
    if (selectedCycle === 'secondaire') {
      return ['6eme', '6ème', '5eme', '5ème', '4eme', '4ème', '3eme', '3ème', 'college', 'collège', '2nde', 'seconde', '1ere', '1ère', 'tle', 'terminale', 'lycee', 'lycée', 'secondaire'].some(k => full.includes(k));
    }
    return false;
  }))

  // Primary subjects sorted neatly by Category then Name
  const filteredPrimarySubjects = useMemo(() => {
    return subjects
      .filter(s => s.cycle === 'primaire' || s.cycle === 'maternelle')
      .sort((a, b) => {
        const catA = CATEGORY_PRIORITY[a.category || 'Général'] || 99
        const catB = CATEGORY_PRIORITY[b.category || 'Général'] || 99
        if (catA !== catB) return catA - catB
        return a.name.localeCompare(b.name)
      })
  }, [subjects])

  // Secondary subjects
  const filteredSecondarySubjects = useMemo(() => {
    return subjects.filter(s => s.cycle === 'secondaire')
  }, [subjects])

  // Students in selected class sorted alphabetically
  const filteredStudents = useMemo(() => {
    if (!selectedClass) return []
    return students
      .filter(s => s.class_id === selectedClass)
      .sort((a, b) => a.last_name.localeCompare(b.last_name))
  }, [students, selectedClass])

  // Filtered by search keyword on class roster
  const searchedStudents = useMemo(() => {
    if (!searchStudentTerm.trim()) return filteredStudents
    const q = searchStudentTerm.toLowerCase().trim()
    return filteredStudents.filter(s => 
      s.last_name.toLowerCase().includes(q) || 
      s.first_name.toLowerCase().includes(q) || 
      (s.matricule && s.matricule.toLowerCase().includes(q))
    )
  }, [filteredStudents, searchStudentTerm])

  // Current student helpers
  const currentStudentIndex = filteredStudents.findIndex(s => s.id === selectedStudent)
  const currentStudent = currentStudentIndex >= 0 ? filteredStudents[currentStudentIndex] : null
  const hasPrevStudent = currentStudentIndex > 0
  const hasNextStudent = currentStudentIndex >= 0 && currentStudentIndex < filteredStudents.length - 1

  // Student stats for class roster view
  const studentStatsMap = useMemo(() => {
    const stats: Record<string, { count: number; total: number; maxPossible: number; avg: string | null }> = {}
    if (!isPrimaryCycle) return stats

    filteredStudents.forEach(stu => {
      let count = 0
      let total = 0
      let maxPossible = 0
      allPrimaryGrades.forEach(g => {
        if (g.student_id === stu.id && g.score !== null && g.score !== undefined) {
          const subj = subjects.find(s => s.id === g.subject_id)
          const maxS = subj ? getPrimarySubjectMaxScore(subj.name, selectedClassObj?.name, selectedClassObj?.level) : ((g as any).max_score || 10)
          total += g.score
          maxPossible += maxS
          count++
        }
      })
      stats[stu.id] = {
        count,
        total,
        maxPossible,
        avg: maxPossible > 0 ? ((total / maxPossible) * 10).toFixed(2) : null
      }
    })
    return stats
  }, [isPrimaryCycle, filteredStudents, allPrimaryGrades, subjects, selectedClassObj])

  // Synchronize studentScores when selected student changes
  useEffect(() => {
    if (!selectedStudent || !isPrimaryCycle) {
      setStudentScores({})
      return
    }
    const map: Record<string, string> = {}
    allPrimaryGrades.forEach(g => {
      if (g.student_id === selectedStudent && g.score !== null && g.score !== undefined) {
        map[`${g.month_number}_${g.subject_id}`] = g.score.toString()
      }
    })
    setStudentScores(map)
  }, [selectedStudent, allPrimaryGrades, isPrimaryCycle])

  // Calculate live monthly totals and averages for current student
  const monthCalculations = useMemo(() => {
    if (!isPrimaryCycle || !selectedStudent) return {}
    const calcs: Record<number, { total: number; count: number; avg: string | null; maxPossible: number }> = {}

    for (let m = 1; m <= 9; m++) {
      let sum = 0
      let maxPossible = 0
      let count = 0
      filteredPrimarySubjects.forEach(s => {
        const maxS = getPrimarySubjectMaxScore(s.name, selectedClassObj?.name, selectedClassObj?.level)
        const valStr = studentScores[`${m}_${s.id}`]
        if (valStr !== undefined && valStr !== '') {
          const val = parseFloat(valStr)
          if (!isNaN(val)) {
            sum += val
            maxPossible += maxS
            count++
          }
        }
      })
      calcs[m] = {
        total: sum,
        count,
        maxPossible,
        avg: maxPossible > 0 ? ((sum / maxPossible) * 10).toFixed(2) : null
      }
    }
    return calcs
  }, [isPrimaryCycle, selectedStudent, studentScores, filteredPrimarySubjects, selectedClassObj])

  // Moyenne de chaque discipline pour l'élève sélectionné
  const disciplineStats = useMemo(() => {
    if (!isPrimaryCycle || !selectedStudent) return {}
    const stats: Record<string, { sum: number; count: number; maxScore: number; avgOnScale: string | null; avgOutOf10: string | null }> = {}

    filteredPrimarySubjects.forEach(s => {
      const maxScore = getPrimarySubjectMaxScore(s.name, selectedClassObj?.name, selectedClassObj?.level)
      let sum = 0
      let count = 0
      for (let m = 1; m <= 9; m++) {
        const valStr = studentScores[`${m}_${s.id}`]
        if (valStr !== undefined && valStr !== '') {
          const val = parseFloat(valStr)
          if (!isNaN(val)) {
            sum += val
            count++
          }
        }
      }
      const rawAvg = count > 0 ? sum / count : null
      const avgOnScale = rawAvg !== null ? rawAvg.toFixed(2) : null
      const avgOutOf10 = rawAvg !== null ? ((rawAvg / maxScore) * 10).toFixed(2) : null

      stats[s.id] = { sum, count, maxScore, avgOnScale, avgOutOf10 }
    })
    return stats
  }, [isPrimaryCycle, selectedStudent, studentScores, filteredPrimarySubjects, selectedClassObj])

  // Synthèse trimestrielle et annuelle de l'élève sélectionné
  const termSummaries = useMemo(() => {
    if (!isPrimaryCycle || !selectedStudent) return null

    const calcRange = (startMonth: number, endMonth: number) => {
      let sum = 0
      let maxPossible = 0
      let count = 0
      for (let m = startMonth; m <= endMonth; m++) {
        filteredPrimarySubjects.forEach(s => {
          const maxS = getPrimarySubjectMaxScore(s.name, selectedClassObj?.name, selectedClassObj?.level)
          const valStr = studentScores[`${m}_${s.id}`]
          if (valStr !== undefined && valStr !== '') {
            const val = parseFloat(valStr)
            if (!isNaN(val)) {
              sum += val
              maxPossible += maxS
              count++
            }
          }
        })
      }
      return {
        sum,
        maxPossible,
        count,
        avg: maxPossible > 0 ? ((sum / maxPossible) * 10).toFixed(2) : null
      }
    }

    const t1 = calcRange(1, 3)
    const t2 = calcRange(4, 6)
    const t3 = calcRange(7, 9)
    const annual = calcRange(1, 9)

    return { t1, t2, t3, annual }
  }, [isPrimaryCycle, selectedStudent, studentScores, filteredPrimarySubjects, selectedClassObj])

  // Keyboard navigation across cells in Excel style
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, subjIdx: number, month: number) => {
    if (e.key === 'Enter' || e.key === 'ArrowDown') {
      e.preventDefault()
      const nextInput = document.getElementById(`score-input-${subjIdx + 1}-${month}`)
      if (nextInput) (nextInput as HTMLInputElement).focus()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const prevInput = document.getElementById(`score-input-${subjIdx - 1}-${month}`)
      if (prevInput) (prevInput as HTMLInputElement).focus()
    } else if (e.key === 'ArrowRight') {
      const input = e.currentTarget
      if (input.selectionStart === input.value.length && month < 9) {
        const nextColInput = document.getElementById(`score-input-${subjIdx}-${month + 1}`)
        if (nextColInput) (nextColInput as HTMLInputElement).focus()
      }
    } else if (e.key === 'ArrowLeft') {
      const input = e.currentTarget
      if (input.selectionStart === 0 && month > 1) {
        const prevColInput = document.getElementById(`score-input-${subjIdx}-${month - 1}`)
        if (prevColInput) (prevColInput as HTMLInputElement).focus()
      }
    }
  }

  // Pre-fill helper for Secondary
  const getSecondaryScore = (studentId: string, type: 'class' | 'comp') => {
    const g = allSecondaryGrades.find(g => g.student_id === studentId && g.subject_id === selectedSubject && g.term === selectedTerm)
    if (!g) return ''
    return type === 'class' ? (g.class_score ?? '') : (g.comp_score ?? '')
  }

  // Handle Form Submission
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    const formData = new FormData(e.currentTarget)
    
    startTransition(async () => {
      if (isPrimaryCycle) {
        const result = await savePrimaryGrades(null, formData)

        if (result?.error) {
          setError(result.error)
        } else if (result?.success) {
          // Update local allPrimaryGrades state with new values
          const updatedGrades = allPrimaryGrades.filter(g => g.student_id !== selectedStudent)
          for (let m = 1; m <= 9; m++) {
            filteredPrimarySubjects.forEach(s => {
              const valStr = studentScores[`${m}_${s.id}`]
              if (valStr !== undefined && valStr.trim() !== '') {
                const val = parseFloat(valStr)
                if (!isNaN(val)) {
                  updatedGrades.push({
                    student_id: selectedStudent,
                    subject_id: s.id,
                    month_number: m,
                    score: val
                  })
                }
              }
            })
          }
          setAllPrimaryGrades(updatedGrades)
          
          const studentName = currentStudent ? `${currentStudent.last_name} ${currentStudent.first_name}` : 'Élève'
          setSuccess(`Notes de ${studentName} enregistrées avec succès !`)
          setTimeout(() => setSuccess(null), 4000)

          // If "Enregistrer & Suivant" was clicked
          if (nextAfterSave && hasNextStudent) {
            setSelectedStudent(filteredStudents[currentStudentIndex + 1].id)
            setNextAfterSave(false)
            // Scroll table container to top
            const container = document.getElementById('primary-notes-table-container')
            if (container) container.scrollTop = 0
          }
        }
      } else {
        // Secondary submission
        const result = await saveSecondaryGrades(null, formData)
        if (result?.error) {
          setError(result.error)
        } else if (result?.success) {
          setSuccess('Notes du secondaire enregistrées avec succès !')
          setTimeout(() => setSuccess(null), 3000)
        }
      }
    })
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-[var(--color-surface)] custom-scrollbar">
      <div className="max-w-[1440px] mx-auto space-y-6">
        
        {/* Header Breadcrumb */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[var(--color-surface-container-lowest)] p-6 rounded-xl border border-[var(--color-outline-variant)]">
          <div>
            <div className="flex items-center gap-2 text-[var(--color-on-surface-variant)] mb-2">
              <Link href="#" onClick={(e) => {e.preventDefault(); window.history.back()}} className="hover:text-[var(--color-primary)] transition-colors text-sm font-semibold">
                Retour
              </Link>
              <ChevronRight className="w-4 h-4 text-sm" />
              <span className="text-sm font-semibold text-[var(--color-on-surface)]">Saisie des Notes</span>
            </div>
            <h2 className="text-3xl font-bold text-[var(--color-on-surface)]">Grille de saisie</h2>
            <p className="text-base text-[var(--color-on-surface-variant)] mt-1">
              {isPrimaryCycle 
                ? 'Saisie des notes élève par élève pour l’ensemble des matières du primaire.' 
                : 'Saisie des notes de toute la classe comme sur Excel.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Quick Link to Bulletins */}
            <Link 
              href="/admin/academique/bulletins"
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[var(--color-surface-container-high)] text-[var(--color-on-surface)] hover:bg-[var(--color-primary)] hover:text-white transition-all text-xs font-semibold border border-[var(--color-outline-variant)] shadow-2xs"
            >
              <FileText className="w-4 h-4" />
              <span>Générer les Bulletins & Livrets</span>
            </Link>

            {/* Quick cycle mode pill */}
            <div className="flex items-center gap-2 bg-[var(--color-surface-container-low)] px-3 py-1.5 rounded-full border border-[var(--color-outline-variant)] text-xs font-semibold text-[var(--color-on-surface-variant)]">
              <GraduationCap className="w-4 h-4 text-[var(--color-primary)]" />
              <span>Mode : <strong className="text-[var(--color-on-surface)]">{isPrimaryCycle ? 'Primaire (par élève)' : 'Secondaire (par matière)'}</strong></span>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="flex items-center gap-3 bg-[var(--color-status-retard-bg)] text-[var(--color-status-retard-text)] p-4 rounded-xl text-sm font-medium border border-red-200 shadow-xs">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-3 bg-[var(--color-status-paye-bg)] text-[var(--color-status-paye-text)] p-4 rounded-xl text-sm font-medium border border-emerald-200 shadow-xs">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
            <span>{success}</span>
          </div>
        )}

        <div className="bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-outline-variant)] shadow-sm flex flex-col overflow-hidden">
          
          {/* Top Filter Bar */}
          <div className="p-4 border-b border-[var(--color-outline-variant)] flex flex-wrap gap-4 bg-[var(--color-surface-bright)] items-end">
            
            {/* Niveau */}
            <div className="flex flex-col gap-1.5 flex-1 min-w-[150px]">
              <label className="text-sm font-semibold text-[var(--color-on-surface)] flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-[var(--color-on-surface-variant)]" />
                Niveau
              </label>
              <select 
                value={selectedCycle} 
                onChange={(e) => {
                  const val = e.target.value
                  setSelectedCycle(val)
                  setSelectedClass('')
                  setSelectedStudent('')
                  setSelectedSubject('')
                  if (val === 'lycee') {
                    setSelectedTerm('1er_semestre')
                  } else if (val === 'college') {
                    setSelectedTerm('1er_trimestre')
                  }
                }}
                className="h-11 px-3 border border-[var(--color-outline-variant)] rounded-lg text-sm focus:border-[var(--color-primary)] outline-none bg-[var(--color-surface)] font-medium"
              >
                <option value="primaire">Primaire (Mensuel)</option>
                <option value="maternelle">Maternelle</option>
                <option value="college">Collège (Trimestriel)</option>
                <option value="lycee">Lycée (Semestriel)</option>
              </select>
            </div>
            
            {/* Classe */}
            <div className="flex flex-col gap-1.5 flex-1 min-w-[150px]">
              <label className="text-sm font-semibold text-[var(--color-on-surface)] flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-[var(--color-on-surface-variant)]" />
                Classe
              </label>
              <select 
                value={selectedClass} 
                onChange={(e) => {
                  setSelectedClass(e.target.value)
                  setSelectedStudent('')
                }}
                className="h-11 px-3 border border-[var(--color-outline-variant)] rounded-lg text-sm focus:border-[var(--color-primary)] outline-none bg-[var(--color-surface)] font-medium"
              >
                <option value="">Sélectionner une classe...</option>
                {filteredClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            {/* In Primary mode: 3rd selector is Élève! */}
            {isPrimaryCycle ? (
              <div className="flex flex-col gap-1.5 flex-1 min-w-[220px]">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-[var(--color-on-surface)] flex items-center gap-1.5">
                    <User className="w-4 h-4 text-[var(--color-primary)]" />
                    Élève
                  </label>
                  {selectedStudent && (
                    <button
                      type="button"
                      onClick={() => setSelectedStudent('')}
                      className="text-xs text-[var(--color-primary)] hover:underline font-medium"
                    >
                      Voir toute la classe
                    </button>
                  )}
                </div>
                <select 
                  value={selectedStudent} 
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  disabled={!selectedClass}
                  className="h-11 px-3 border border-[var(--color-outline-variant)] rounded-lg text-sm focus:border-[var(--color-primary)] outline-none bg-[var(--color-surface)] font-medium disabled:opacity-50 disabled:bg-gray-50"
                >
                  <option value="">
                    {!selectedClass ? "Sélectionnez d'abord une classe" : "Choisir un élève ou voir la liste ci-dessous..."}
                  </option>
                  {filteredStudents.map((s, idx) => (
                    <option key={s.id} value={s.id}>
                      {idx + 1}. {s.last_name} {s.first_name} {s.matricule ? `(${s.matricule})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              /* In Secondary mode: 3rd selector is Matière */
              <div className="flex flex-col gap-1.5 flex-1 min-w-[180px]">
                <label className="text-sm font-semibold text-[var(--color-on-surface)]">Matière</label>
                <select 
                  value={selectedSubject} 
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="h-11 px-3 border border-[var(--color-outline-variant)] rounded-lg text-sm focus:border-[var(--color-primary)] outline-none bg-[var(--color-surface)] font-medium"
                >
                  <option value="">Sélectionner une matière...</option>
                  {filteredSecondarySubjects.map(s => {
                    const currentCoef = selectedClassObj 
                      ? getCoefficientForSubject(s.name, selectedClassObj.name, selectedClassObj.level, (s as any).coefficient || 2)
                      : null
                    return (
                      <option key={s.id} value={s.id}>
                        {s.name} {currentCoef ? `(Coef ${currentCoef})` : ''}
                      </option>
                    )
                  })}
                </select>
              </div>
            )}

            {/* Secondary Term/Semester Selectors */}
            {selectedCycle === 'college' && (
              <div className="flex flex-col gap-1.5 flex-1 min-w-[150px]">
                <label className="text-sm font-semibold text-[var(--color-on-surface)] flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-[var(--color-on-surface-variant)]" />
                  Trimestre
                </label>
                <select 
                  value={selectedTerm} 
                  onChange={(e) => setSelectedTerm(e.target.value)}
                  className="h-11 px-3 border border-[var(--color-outline-variant)] rounded-lg text-sm focus:border-[var(--color-primary)] outline-none bg-[var(--color-surface)] font-medium"
                >
                  <option value="1er_trimestre">1er Trimestre</option>
                  <option value="2e_trimestre">2e Trimestre</option>
                  <option value="3e_trimestre">3e Trimestre</option>
                </select>
              </div>
            )}

            {selectedCycle === 'lycee' && (
              <div className="flex flex-col gap-1.5 flex-1 min-w-[150px]">
                <label className="text-sm font-semibold text-[var(--color-on-surface)] flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-[var(--color-on-surface-variant)]" />
                  Semestre
                </label>
                <select 
                  value={selectedTerm} 
                  onChange={(e) => setSelectedTerm(e.target.value)}
                  className="h-11 px-3 border border-[var(--color-outline-variant)] rounded-lg text-sm focus:border-[var(--color-primary)] outline-none bg-[var(--color-surface)] font-medium"
                >
                  <option value="1er_semestre">1er Semestre</option>
                  <option value="2e_semestre">2e Semestre</option>
                </select>
              </div>
            )}

            {selectedCycle === 'secondaire' && (
              <div className="flex flex-col gap-1.5 flex-1 min-w-[150px]">
                <label className="text-sm font-semibold text-[var(--color-on-surface)]">Période</label>
                <select 
                  value={selectedTerm} 
                  onChange={(e) => setSelectedTerm(e.target.value)}
                  className="h-11 px-3 border border-[var(--color-outline-variant)] rounded-lg text-sm focus:border-[var(--color-primary)] outline-none bg-[var(--color-surface)] font-medium"
                >
                  <option value="1er_trimestre">1er Trimestre</option>
                  <option value="2e_trimestre">2e Trimestre</option>
                  <option value="3e_trimestre">3e Trimestre</option>
                  <option value="1er_semestre">1er Semestre</option>
                  <option value="2e_semestre">2e Semestre</option>
                </select>
              </div>
            )}
          </div>

          {/* Lycée / Série Badge Info Bar (Only Secondary) */}
          {(() => {
            if (isPrimaryCycle) return null;
            const curClass = classes.find(c => c.id === selectedClass);
            const curSubj = subjects.find(s => s.id === selectedSubject);
            if (!curClass || !isSecondaryCycle) return null;
            const seriesKey = detectClassSeriesKey(curClass.name, curClass.level);
            const coef = curSubj ? getCoefficientForSubject(curSubj.name, curClass.name, curClass.level, (curSubj as any).coefficient || 2) : null;
            return (
              <div className="px-6 py-2.5 bg-blue-50/60 border-b border-blue-100 flex flex-wrap items-center justify-between gap-2 text-xs text-blue-900">
                <div className="flex items-center gap-2">
                  <span className="font-bold">Classe : {curClass.name}</span>
                  {seriesKey && (
                    <span className="font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                      {LYCEE_SERIES_CONFIG[seriesKey].label}
                    </span>
                  )}
                </div>
                {curSubj && coef && (
                  <div className="flex items-center gap-2 font-medium">
                    <span>Matière : <strong className="text-blue-950">{curSubj.name}</strong></span>
                    <span className="font-bold px-2 py-0.5 rounded bg-white border border-blue-200 text-blue-700 shadow-2xs">
                      Coefficient appliqué : {coef}
                    </span>
                  </div>
                )}
              </div>
            );
          })()}

          {/* ========================================================================= */}
          {/* PRIMARY VIEW: Mode Primaire (Par Élève)                                   */}
          {/* ========================================================================= */}
          {isPrimaryCycle ? (
            !selectedClass ? (
              /* Étape 1 : Choisir une classe */
              <div className="p-16 flex flex-col items-center justify-center text-center text-[var(--color-on-surface-variant)] flex-1 min-h-[350px]">
                <Table className="w-12 h-12 mb-3 opacity-40 text-[var(--color-primary)]" />
                <h4 className="text-lg font-semibold text-[var(--color-on-surface)]">Sélectionnez une classe</h4>
                <p className="text-sm mt-1 max-w-md">Choisissez une classe primaire (CP1, CP2, CE1, CE2, CM1, CM2) pour accéder à la liste de ses élèves.</p>
              </div>
            ) : filteredStudents.length === 0 ? (
              /* Étape 2 : Classe vide */
              <div className="p-16 flex flex-col items-center justify-center text-center text-[var(--color-on-surface-variant)] flex-1 min-h-[350px]">
                <User className="w-12 h-12 mb-3 opacity-40 text-[var(--color-primary)]" />
                <h4 className="text-lg font-semibold text-[var(--color-on-surface)]">Aucun élève dans cette classe</h4>
                <p className="text-sm mt-1">Ajoutez d'abord des élèves dans la classe {selectedClassObj?.name} pour commencer la saisie.</p>
              </div>
            ) : !selectedStudent ? (
              /* Étape 3 : Liste / Tableau des élèves de la classe (Roster view avec double-clic ou bouton) */
              <div className="flex flex-col">
                <div className="p-4 sm:p-6 border-b border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-lg text-[var(--color-on-surface)] flex items-center gap-2">
                        <span>Liste des élèves de la classe :</span>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[var(--color-primary)] text-white">
                          {selectedClassObj?.name}
                        </span>
                        <span className="text-sm font-normal text-[var(--color-on-surface-variant)]">
                          ({filteredStudents.length} élèves)
                        </span>
                      </h3>

                      {/* Badge barème officiel */}
                      {(() => {
                        const primLvl = selectedClassObj ? detectPrimaryLevel(selectedClassObj.name, selectedClassObj.level) : null;
                        if (primLvl === 'CP') {
                          return (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                              📘 CP (CP1, CP2, CI) : toutes disciplines sur 10
                            </span>
                          );
                        }
                        if (primLvl === 'CE') {
                          return (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">
                              📗 CE (CE1, CE2) : Problème & Dictée sur 20 • Autres sur 10
                            </span>
                          );
                        }
                        if (primLvl === 'CM') {
                          return (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
                              📙 CM (CM1, CM2) : Problème, Dictée, Calcul écrit & Étude de texte sur 20 • Autres sur 10
                            </span>
                          );
                        }
                        return null;
                      })()}
                    </div>
                    <p className="text-xs text-[var(--color-on-surface-variant)] mt-1">
                      💡 Cliquez sur un élève, <strong>double-cliquez</strong> ou cliquez sur <strong>« Saisir les notes »</strong> pour ouvrir sa grille de notes complète.
                    </p>
                  </div>

                  {/* Recherche rapide d'un élève */}
                  <div className="relative w-full sm:w-72">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-on-surface-variant)]" />
                    <input 
                      type="text"
                      placeholder="Rechercher un élève..."
                      value={searchStudentTerm}
                      onChange={(e) => setSearchStudentTerm(e.target.value)}
                      className="w-full h-10 pl-9 pr-3 text-xs rounded-lg border border-[var(--color-outline-variant)] bg-[var(--color-surface)] outline-none focus:border-[var(--color-primary)]"
                    />
                  </div>
                </div>

                {/* Tableau de la classe */}
                <div className="overflow-x-auto min-h-[350px] custom-scrollbar">
                  <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead>
                      <tr className="bg-[var(--color-surface-container)] border-b border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] text-xs font-semibold uppercase tracking-wider">
                        <th className="py-3 px-4 w-12 text-center">N°</th>
                        <th className="py-3 px-4">Nom & Prénoms</th>
                        <th className="py-3 px-4">Matricule</th>
                        <th className="py-3 px-4 text-center">Notes saisies</th>
                        <th className="py-3 px-4 text-center">Moyenne générale</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-outline-variant)] text-sm">
                      {searchedStudents.map((stu, idx) => {
                        const st = studentStatsMap[stu.id] || { count: 0, total: 0, avg: null }
                        const totalCells = filteredPrimarySubjects.length * 9
                        const progressPct = Math.min(100, Math.round((st.count / (totalCells || 1)) * 100))

                        return (
                          <tr 
                            key={stu.id}
                            onClick={() => setSelectedStudent(stu.id)}
                            onDoubleClick={() => setSelectedStudent(stu.id)}
                            className="hover:bg-[var(--color-primary)]/5 cursor-pointer transition-colors group"
                            title="Double-cliquez pour ouvrir la grille de notes"
                          >
                            <td className="py-3 px-4 text-center text-xs font-bold text-[var(--color-on-surface-variant)]">
                              {idx + 1}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-[var(--color-primary)] group-hover:text-white transition-all">
                                  {stu.last_name[0]}{stu.first_name[0]}
                                </div>
                                <div>
                                  <div className="font-bold text-[var(--color-on-surface)] group-hover:text-[var(--color-primary)] transition-colors">
                                    {stu.last_name} {stu.first_name}
                                  </div>
                                  <div className="text-xs text-[var(--color-on-surface-variant)]">
                                    Élève {selectedClassObj?.name}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 font-mono text-xs text-[var(--color-on-surface-variant)]">
                              {stu.matricule || '—'}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <div className="flex flex-col items-center gap-1">
                                <span className="text-xs font-semibold text-[var(--color-on-surface)]">
                                  {st.count} / {totalCells} notes
                                </span>
                                <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-[var(--color-primary)] transition-all" 
                                    style={{ width: `${progressPct}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center">
                              {st.avg ? (
                                <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                  parseFloat(st.avg) >= 5 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  {st.avg} / 10
                                </span>
                              ) : (
                                <span className="text-xs text-[var(--color-on-surface-variant)] opacity-50">
                                  Non calculé
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedStudent(stu.id)
                                }}
                                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[var(--color-primary)] text-white hover:opacity-90 transition-all shadow-2xs flex items-center gap-1.5 ml-auto"
                              >
                                <span>Saisir les notes</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* Étape 4 : Grille Excel de l'élève sélectionné */
              <form onSubmit={handleSubmit} className="flex flex-col">
                <input type="hidden" name="classId" value={selectedClass} />
                <input type="hidden" name="studentId" value={selectedStudent} />

                {/* Student Banner and Fast Switcher Controls */}
                <div className="px-6 py-4 bg-[var(--color-surface-container-low)] border-b border-[var(--color-outline-variant)] flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedStudent('')}
                      className="p-2 rounded-lg border border-[var(--color-outline-variant)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-container-high)] text-[var(--color-on-surface)] transition-all"
                      title="Retour à la liste des élèves"
                    >
                      <ArrowLeft className="w-4 h-4 text-[var(--color-primary)]" />
                    </button>

                    <div className="w-11 h-11 rounded-full bg-[var(--color-primary)]/15 text-[var(--color-primary)] flex items-center justify-center font-bold text-base border border-[var(--color-primary)]/20 shadow-2xs">
                      {currentStudent?.last_name?.[0] || 'E'}{currentStudent?.first_name?.[0] || ''}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg text-[var(--color-on-surface)]">
                          {currentStudent?.last_name} {currentStudent?.first_name}
                        </h3>
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/20">
                          {selectedClassObj?.name}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--color-on-surface-variant)] mt-0.5">
                        Matricule : <span className="font-semibold text-[var(--color-on-surface)]">{currentStudent?.matricule || 'Non renseigné'}</span>
                        {' • '}
                        <span className="text-[var(--color-on-surface-variant)]">
                          {filteredPrimarySubjects.length} matières • Barème : {(() => {
                            const primLvl = selectedClassObj ? detectPrimaryLevel(selectedClassObj.name, selectedClassObj.level) : null;
                            if (primLvl === 'CM') return '4 disciplines sur 20 (Problème, Dictée, Calcul, Étude de texte), autres sur 10';
                            if (primLvl === 'CE') return '2 disciplines sur 20 (Problème, Dictée), autres sur 10';
                            return 'Toutes disciplines sur 10';
                          })()} • Moyenne calculée sur 10
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Quick Prev / Next navigation + Back to List button */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedStudent('')}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-[var(--color-outline-variant)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-container-high)] text-[var(--color-on-surface)] transition-all flex items-center gap-1.5 shadow-2xs"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Liste des élèves</span>
                    </button>

                    <div className="flex items-center gap-1 bg-[var(--color-surface-container-lowest)] p-1 rounded-xl border border-[var(--color-outline-variant)] shadow-2xs">
                      <span className="text-xs font-semibold text-[var(--color-on-surface-variant)] px-2">
                        Élève <strong className="text-[var(--color-on-surface)]">{currentStudentIndex + 1}</strong> sur <strong>{filteredStudents.length}</strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedStudent(filteredStudents[currentStudentIndex - 1].id)}
                        disabled={!hasPrevStudent}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-[var(--color-outline-variant)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-container-high)] text-[var(--color-on-surface)] disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-1"
                        title="Élève précédent"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        Précédent
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedStudent(filteredStudents[currentStudentIndex + 1].id)}
                        disabled={!hasNextStudent}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-[var(--color-outline-variant)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-container-high)] text-[var(--color-on-surface)] disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-1"
                        title="Élève suivant"
                      >
                        Suivant
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Cartes de synthèse des moyennes de l'élève */}
                {termSummaries && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 p-4 bg-[var(--color-surface-container-lowest)] border-b border-[var(--color-outline-variant)]">
                    <div className="p-3 rounded-xl border border-blue-200 bg-blue-50/50 flex flex-col">
                      <span className="text-[11px] font-semibold text-blue-900 uppercase tracking-wide">Moyenne T1 (M1-M3)</span>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-xl font-extrabold text-blue-950">{termSummaries.t1.avg ?? '—'}</span>
                        <span className="text-xs font-semibold text-blue-800">/ 10</span>
                      </div>
                      <span className="text-[10px] text-blue-700 mt-0.5">{termSummaries.t1.count} note(s) saisie(s)</span>
                    </div>

                    <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/50 flex flex-col">
                      <span className="text-[11px] font-semibold text-emerald-900 uppercase tracking-wide">Moyenne T2 (M4-M6)</span>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-xl font-extrabold text-emerald-950">{termSummaries.t2.avg ?? '—'}</span>
                        <span className="text-xs font-semibold text-emerald-800">/ 10</span>
                      </div>
                      <span className="text-[10px] text-emerald-700 mt-0.5">{termSummaries.t2.count} note(s) saisie(s)</span>
                    </div>

                    <div className="p-3 rounded-xl border border-purple-200 bg-purple-50/50 flex flex-col">
                      <span className="text-[11px] font-semibold text-purple-900 uppercase tracking-wide">Moyenne T3 (M7-M9)</span>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-xl font-extrabold text-purple-950">{termSummaries.t3.avg ?? '—'}</span>
                        <span className="text-xs font-semibold text-purple-800">/ 10</span>
                      </div>
                      <span className="text-[10px] text-purple-700 mt-0.5">{termSummaries.t3.count} note(s) saisie(s)</span>
                    </div>

                    <div className="p-3 rounded-xl border border-amber-300 bg-amber-50/70 flex flex-col shadow-2xs">
                      <span className="text-[11px] font-bold text-amber-950 uppercase tracking-wide">Moyenne Annuelle</span>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-2xl font-black text-amber-900">{termSummaries.annual.avg ?? '—'}</span>
                        <span className="text-xs font-bold text-amber-800">/ 10</span>
                      </div>
                      <span className="text-[10px] font-medium text-amber-800 mt-0.5">Sur l'ensemble des mois</span>
                    </div>

                    <div className="p-3 rounded-xl border border-[var(--color-outline-variant)] bg-[var(--color-surface)] flex flex-col col-span-2 sm:col-span-1">
                      <span className="text-[11px] font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wide">Points cumulés</span>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-lg font-bold text-[var(--color-on-surface)]">{termSummaries.annual.sum.toFixed(1)}</span>
                        <span className="text-xs text-[var(--color-on-surface-variant)]">/ {termSummaries.annual.maxPossible}</span>
                      </div>
                      <span className="text-[10px] text-[var(--color-on-surface-variant)] mt-0.5">{termSummaries.annual.count} notes au total</span>
                    </div>
                  </div>
                )}

                {/* Primary Excel Grid */}
                <div id="primary-notes-table-container" className="overflow-x-auto min-h-[420px] max-h-[650px] custom-scrollbar">
                  <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead>
                      {/* Trimestre group headers */}
                      <tr className="bg-[var(--color-surface-container-low)] border-b border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] text-xs uppercase tracking-wider">
                        <th className="py-2 px-4 font-bold sticky left-0 bg-[var(--color-surface-container-low)] z-20 border-r border-[var(--color-outline-variant)] min-w-[280px]">
                          Matières ({filteredPrimarySubjects.length})
                        </th>
                        <th colSpan={3} className="py-2 px-2 text-center font-bold bg-blue-50/50 text-blue-900 border-r border-[var(--color-outline-variant)]">
                          1er Trimestre
                        </th>
                        <th colSpan={3} className="py-2 px-2 text-center font-bold bg-emerald-50/50 text-emerald-900 border-r border-[var(--color-outline-variant)]">
                          2e Trimestre
                        </th>
                        <th colSpan={3} className="py-2 px-2 text-center font-bold bg-purple-50/50 text-purple-900 border-r border-[var(--color-outline-variant)]">
                          3e Trimestre
                        </th>
                        <th colSpan={2} className="py-2 px-3 text-center font-bold bg-amber-50/70 text-amber-950">
                          Moyennes Discipline
                        </th>
                      </tr>

                      {/* Month sub-headers */}
                      <tr className="bg-[var(--color-surface-container)] border-b border-[var(--color-outline-variant)] text-[var(--color-on-surface)] text-xs font-semibold">
                        <th className="py-2.5 px-4 sticky left-0 bg-[var(--color-surface-container)] z-20 border-r border-[var(--color-outline-variant)] shadow-[1px_0_0_var(--color-outline-variant)]">
                          Discipline & Barème
                        </th>
                        {Array.from({ length: 9 }).map((_, i) => (
                          <th key={i} className={`py-2.5 px-2 text-center w-[85px] ${i === 2 || i === 5 ? 'border-r border-[var(--color-outline-variant)]' : ''}`}>
                            <div className="font-bold">Mois {i + 1}</div>
                            <div className="text-[10px] font-normal text-[var(--color-on-surface-variant)]">Évaluation</div>
                          </th>
                        ))}
                        <th className="py-2.5 px-3 text-center w-[115px] border-l border-[var(--color-outline-variant)] bg-amber-50/40">
                          <div className="font-bold text-amber-950">Moy. Discipline</div>
                          <div className="text-[10px] font-normal text-amber-800">Sur barème officiel</div>
                        </th>
                        <th className="py-2.5 px-3 text-center w-[95px] bg-amber-50/40">
                          <div className="font-bold text-amber-950">Moy. / 10</div>
                          <div className="text-[10px] font-normal text-amber-800">Ramenée</div>
                        </th>
                      </tr>
                    </thead>
                    
                    <tbody className="divide-y divide-[var(--color-outline-variant)] text-sm">
                      {filteredPrimarySubjects.map((subject, subjIdx) => {
                        const cat = subject.category || 'Général'
                        const maxScore = getPrimarySubjectMaxScore(subject.name, selectedClassObj?.name, selectedClassObj?.level)
                        return (
                          <tr key={subject.id} className="hover:bg-[var(--color-surface-container-lowest)]/80 bg-[var(--color-surface-container-lowest)] transition-colors group">
                            
                            {/* Sticky Subject Cell */}
                            <td className="py-2.5 px-4 sticky left-0 bg-[var(--color-surface-container-lowest)] group-hover:bg-[var(--color-surface-bright)] z-10 border-r border-[var(--color-outline-variant)] shadow-[1px_0_0_var(--color-outline-variant)] min-w-[280px]">
                              <div className="flex flex-col">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-semibold text-[var(--color-on-surface)] text-sm leading-tight">
                                    {subject.name}
                                  </span>
                                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold shrink-0 ${
                                    maxScore === 20 
                                      ? 'bg-blue-100 text-blue-800 border border-blue-200 shadow-2xs' 
                                      : 'bg-slate-100 text-slate-700 border border-slate-200'
                                  }`}>
                                    sur {maxScore}
                                  </span>
                                </div>
                                {cat && (
                                  <span className="text-[10px] text-[var(--color-on-surface-variant)] font-medium mt-0.5">
                                    {cat}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* 9 Months Grade Inputs */}
                            {Array.from({ length: 9 }).map((_, i) => {
                              const month = i + 1;
                              const scoreKey = `${month}_${subject.id}`;
                              const currentVal = studentScores[scoreKey] ?? '';
                              const hasPrevScore = allPrimaryGrades.some(g => g.student_id === selectedStudent && g.subject_id === subject.id && g.month_number === month);
                              const isOutOfRange = currentVal !== '' && (parseFloat(currentVal) < 0 || parseFloat(currentVal) > maxScore);

                              return (
                                <td 
                                  key={i} 
                                  className={`py-1.5 px-1.5 text-center ${month === 3 || month === 6 ? 'border-r border-[var(--color-outline-variant)]' : ''}`}
                                >
                                  <input 
                                    type="number" 
                                    step="0.25"
                                    min="0"
                                    max={maxScore}
                                    id={`score-input-${subjIdx}-${month}`}
                                    name={`score_${month}_${subject.id}`}
                                    value={currentVal}
                                    onChange={(e) => {
                                      const val = e.target.value
                                      setStudentScores(prev => ({
                                        ...prev,
                                        [scoreKey]: val
                                      }))
                                    }}
                                    onKeyDown={(e) => handleKeyDown(e, subjIdx, month)}
                                    placeholder={`/${maxScore}`}
                                    className={`w-16 h-9 text-center font-semibold text-sm border rounded-lg outline-none transition-all ${
                                      isOutOfRange 
                                        ? 'border-red-500 bg-red-50 text-red-700 focus:ring-2 focus:ring-red-200' 
                                        : currentVal !== '' 
                                          ? 'border-[var(--color-primary)]/40 bg-[var(--color-primary)]/5 text-[var(--color-on-surface)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20' 
                                          : 'border-[var(--color-outline-variant)] bg-[var(--color-surface)] text-[var(--color-on-surface)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20'
                                    }`}
                                  />
                                  {/* Dynamic max score and previous grade tracking */}
                                  <input 
                                    type="hidden" 
                                    name={`max_${subject.id}`} 
                                    value={maxScore} 
                                  />
                                  <input 
                                    type="hidden" 
                                    name={`orig_${month}_${subject.id}`} 
                                    value={hasPrevScore ? "1" : "0"} 
                                  />
                                </td>
                              )
                            })}

                            {/* Colonnes de moyennes par discipline */}
                            {(() => {
                              const dStat = disciplineStats[subject.id];
                              const isPass = dStat?.avgOutOf10 !== null && parseFloat(dStat.avgOutOf10) >= 5;
                              return (
                                <>
                                  <td className="py-1.5 px-2 text-center border-l border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)]">
                                    {dStat && dStat.count > 0 ? (
                                      <span className={`inline-block px-2.5 py-0.5 rounded text-xs font-bold ${
                                        maxScore === 20
                                          ? parseFloat(dStat.avgOnScale || '0') >= 10
                                            ? 'bg-blue-100 text-blue-900 border border-blue-200'
                                            : 'bg-red-100 text-red-800 border border-red-200'
                                          : isPass
                                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                            : 'bg-red-100 text-red-800 border border-red-200'
                                      }`}>
                                        {dStat.avgOnScale} <span className="text-[10px] font-normal opacity-75">/ {maxScore}</span>
                                      </span>
                                    ) : (
                                      <span className="text-[var(--color-on-surface-variant)] opacity-40 text-xs">—</span>
                                    )}
                                  </td>
                                  <td className="py-1.5 px-2 text-center bg-[var(--color-surface-container-lowest)]">
                                    {dStat && dStat.count > 0 ? (
                                      <span className="text-xs font-semibold text-[var(--color-on-surface)]">
                                        {dStat.avgOutOf10} <span className="text-[10px] text-[var(--color-on-surface-variant)]">/ 10</span>
                                      </span>
                                    ) : (
                                      <span className="text-[var(--color-on-surface-variant)] opacity-40 text-xs">—</span>
                                    )}
                                  </td>
                                </>
                              );
                            })()}
                          </tr>
                        )
                      })}
                    </tbody>

                    {/* Footer Rows: Total des notes & Moyenne mensuelle */}
                    <tfoot>
                      {/* Row 1: TOTAL DES NOTES */}
                      <tr className="bg-[var(--color-surface-container)] border-t-2 border-[var(--color-outline-variant)] text-xs font-bold text-[var(--color-on-surface)]">
                        <td className="py-2.5 px-4 sticky left-0 bg-[var(--color-surface-container)] z-20 border-r border-[var(--color-outline-variant)] shadow-[1px_0_0_var(--color-outline-variant)]">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <Calculator className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                              Total des notes
                            </span>
                            <span className="text-[10px] font-normal text-[var(--color-on-surface-variant)] uppercase tracking-wider">
                              Somme des points
                            </span>
                          </div>
                        </td>
                        {Array.from({ length: 9 }).map((_, i) => {
                          const month = i + 1;
                          const calc = monthCalculations[month];

                          return (
                            <td 
                              key={i} 
                              className={`py-2.5 px-2 text-center ${month === 3 || month === 6 ? 'border-r border-[var(--color-outline-variant)]' : ''}`}
                            >
                              {calc && calc.count > 0 ? (
                                <div className="flex flex-col items-center">
                                  <span className="font-bold text-xs text-[var(--color-on-surface)]">
                                    {calc.total.toFixed(2)}
                                  </span>
                                  <span className="text-[10px] font-normal text-[var(--color-on-surface-variant)]">
                                    / {calc.maxPossible}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-[var(--color-on-surface-variant)] opacity-40">-</span>
                              )}
                            </td>
                          )
                        })}
                        {/* Annuel Total Points */}
                        <td className="py-2.5 px-2 text-center border-l border-[var(--color-outline-variant)] bg-[var(--color-surface-container)] font-bold text-xs" colSpan={2}>
                          {termSummaries && termSummaries.annual.count > 0 ? (
                            <div className="flex flex-col items-center">
                              <span className="font-bold text-xs text-[var(--color-on-surface)]">
                                {termSummaries.annual.sum.toFixed(2)}
                              </span>
                              <span className="text-[10px] font-normal text-[var(--color-on-surface-variant)]">
                                / {termSummaries.annual.maxPossible} points
                              </span>
                            </div>
                          ) : (
                            <span className="text-[var(--color-on-surface-variant)] opacity-40">—</span>
                          )}
                        </td>
                      </tr>

                      {/* Row 2: MOYENNE MENSUELLE */}
                      <tr className="bg-[var(--color-surface-container-high)] border-t border-[var(--color-outline-variant)] text-xs font-bold text-[var(--color-on-surface)]">
                        <td className="py-2.5 px-4 sticky left-0 bg-[var(--color-surface-container-high)] z-20 border-r border-[var(--color-outline-variant)] shadow-[1px_0_0_var(--color-outline-variant)]">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <Award className="w-3.5 h-3.5 text-emerald-600" />
                              Moyenne du mois (/ 10)
                            </span>
                            <span className="text-[10px] font-normal text-[var(--color-on-surface-variant)] uppercase tracking-wider">
                              Calculé en direct
                            </span>
                          </div>
                        </td>
                        {Array.from({ length: 9 }).map((_, i) => {
                          const month = i + 1;
                          const calc = monthCalculations[month];
                          const avgNum = calc?.avg ? parseFloat(calc.avg) : null;
                          const isPass = avgNum !== null && avgNum >= 5;

                          return (
                            <td 
                              key={i} 
                              className={`py-2.5 px-2 text-center ${month === 3 || month === 6 ? 'border-r border-[var(--color-outline-variant)]' : ''}`}
                            >
                              {calc?.avg ? (
                                <span className={`inline-block px-2 py-0.5 rounded font-bold text-xs ${
                                  isPass ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  {calc.avg}
                                </span>
                              ) : (
                                <span className="text-[var(--color-on-surface-variant)] opacity-40">-</span>
                              )}
                            </td>
                          )
                        })}
                        {/* Annuel Moyenne Générale */}
                        <td className="py-2.5 px-2 text-center border-l border-[var(--color-outline-variant)] bg-[var(--color-surface-container-high)] font-bold text-xs" colSpan={2}>
                          {termSummaries && termSummaries.annual.avg ? (
                            <div className="flex flex-col items-center">
                              <span className={`inline-block px-2.5 py-0.5 rounded font-extrabold text-xs shadow-2xs ${
                                parseFloat(termSummaries.annual.avg) >= 5
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                  : 'bg-red-100 text-red-900 border border-red-200'
                              }`}>
                                {termSummaries.annual.avg} / 10
                              </span>
                              <span className="text-[9px] font-normal text-[var(--color-on-surface-variant)] mt-0.5">
                                Moyenne Générale
                              </span>
                            </div>
                          ) : (
                            <span className="text-[var(--color-on-surface-variant)] opacity-40">—</span>
                          )}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Primary Submit Bar */}
                <div className="p-4 border-t border-[var(--color-outline-variant)] bg-[var(--color-surface-bright)] flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedStudent('')}
                      className="px-4 py-2.5 rounded-lg text-xs font-semibold bg-[var(--color-surface)] border border-[var(--color-outline-variant)] text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container-high)] transition-all flex items-center gap-1.5"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Retour à la liste ({selectedClassObj?.name})</span>
                    </button>
                    <span className="text-xs text-[var(--color-on-surface-variant)] hidden sm:inline">
                      Barème primaire sur <strong>/ 10</strong>.
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button 
                      type="submit" 
                      disabled={isPending} 
                      onClick={() => setNextAfterSave(false)}
                      className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-[var(--color-surface)] border border-[var(--color-outline-variant)] text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container-high)] transition-all disabled:opacity-50 flex items-center gap-2 shadow-2xs cursor-pointer"
                    >
                      {isPending && !nextAfterSave ? <Loader2 className="w-4 h-4 animate-spin text-[var(--color-primary)]" /> : <Save className="w-4 h-4 text-[var(--color-primary)]" />}
                      Enregistrer les notes
                    </button>

                    {hasNextStudent && (
                      <button 
                        type="submit" 
                        disabled={isPending} 
                        onClick={() => setNextAfterSave(true)}
                        className="px-6 py-2.5 rounded-lg text-sm font-semibold bg-[var(--color-primary)] text-white hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-2 shadow-sm cursor-pointer"
                      >
                        {isPending && nextAfterSave ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        <span>Enregistrer & Élève suivant →</span>
                      </button>
                    )}
                  </div>
                </div>
              </form>
            )
          ) : (

            /* ========================================================================= */
            /* SECONDARY VIEW: Saisie par matière (Élèves en lignes, Devoir/Comp en cols) */
            /* ========================================================================= */
            !selectedClass || !selectedSubject ? (
              <div className="p-16 flex flex-col items-center justify-center text-center text-[var(--color-on-surface-variant)] flex-1 min-h-[350px]">
                <Table className="w-12 h-12 mb-3 opacity-40 text-[var(--color-primary)]" />
                <h4 className="text-lg font-semibold text-[var(--color-on-surface)]">Sélectionnez une classe et une matière</h4>
                <p className="text-sm mt-1">Au secondaire, la saisie s'effectue par matière pour l'ensemble des élèves de la classe.</p>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="p-16 flex flex-col items-center justify-center text-center text-[var(--color-on-surface-variant)] flex-1 min-h-[350px]">
                <p className="text-lg font-medium">Aucun élève dans cette classe.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col">
                <input type="hidden" name="classId" value={selectedClass} />
                <input type="hidden" name="subjectId" value={selectedSubject} />
                <input type="hidden" name="term" value={selectedTerm} />
                
                <div className="overflow-x-auto min-h-[400px] custom-scrollbar">
                  <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead>
                      <tr className="bg-[var(--color-surface-container-low)] border-b border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] text-sm">
                        <th className="py-3 px-4 font-semibold sticky left-0 bg-[var(--color-surface-container-low)] z-10 border-r border-[var(--color-outline-variant)] shadow-[1px_0_0_var(--color-outline-variant)] min-w-[220px]">
                          Élève ({filteredStudents.length})
                        </th>
                        <th className="py-3 px-4 font-semibold text-center w-[140px]">
                          {selectedCycle === 'lycee' ? 'Devoir' : 'Note Classe'}
                          <div className="text-[10px] font-normal opacity-70">/ 20</div>
                        </th>
                        <th className="py-3 px-4 font-semibold text-center w-[140px]">
                          Composition
                          <div className="text-[10px] font-normal opacity-70">/ 20</div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-outline-variant)] text-sm">
                      {filteredStudents.map((student) => (
                        <tr key={student.id} className="hover:bg-[var(--color-surface-container-lowest)]/50 bg-[var(--color-surface-container-lowest)]">
                          <td className="py-2 px-4 font-medium text-[var(--color-on-surface)] sticky left-0 bg-[var(--color-surface-container-lowest)] z-10 border-r border-[var(--color-outline-variant)] shadow-[1px_0_0_var(--color-outline-variant)] truncate max-w-[220px]">
                            {student.last_name} {student.first_name}
                            {student.matricule && <span className="text-xs text-[var(--color-on-surface-variant)] block font-normal">{student.matricule}</span>}
                          </td>
                          
                          <td className="py-2 px-2 text-center">
                            <input 
                              type="number" 
                              step="0.25"
                              min="0"
                              max="20"
                              name={`class_score_${student.id}`}
                              defaultValue={getSecondaryScore(student.id, 'class')}
                              className="w-24 h-9 text-center border border-[var(--color-outline-variant)] rounded-lg bg-[var(--color-surface)] focus:border-[var(--color-primary)] outline-none mx-auto block font-semibold text-sm"
                            />
                          </td>
                          <td className="py-2 px-2 text-center">
                            <input 
                              type="number" 
                              step="0.25"
                              min="0"
                              max="20"
                              name={`comp_score_${student.id}`}
                              defaultValue={getSecondaryScore(student.id, 'comp')}
                              className="w-24 h-9 text-center border border-[var(--color-outline-variant)] rounded-lg bg-[var(--color-surface)] focus:border-[var(--color-primary)] outline-none mx-auto block font-semibold text-sm"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div className="p-4 border-t border-[var(--color-outline-variant)] bg-[var(--color-surface-bright)] flex justify-end">
                  <button type="submit" disabled={isPending} className="px-6 py-3 rounded-lg text-sm font-semibold bg-[var(--color-primary)] text-white hover:opacity-90 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm cursor-pointer">
                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Enregistrer les notes
                  </button>
                </div>
              </form>
            )
          )}
        </div>
      </div>
    </div>
  )
}
