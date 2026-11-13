'use client'

import { useState, useTransition, FormEvent, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  savePrimaryGrades,
  saveSecondaryGrades,
  clearStudentGrades,
  saveClassMonthPrimaryGrades,
} from '@/app/actions/academique'
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
  FileText,
  Calculator,
  Award,
  Trash2,
  FileSpreadsheet,
  Trophy,
  Upload
} from 'lucide-react'
import { ClassResultsPreviewModal } from './ClassResultsPreviewModal'
import { ImportGradesModal } from './ImportGradesModal'
import { PrimaryClassMatrixGrid } from './PrimaryClassMatrixGrid'
import { AverageScale, ExportCycle, FilterMode, SortMode } from '@/lib/grades-export'
import {
  TRIMESTER_OPTIONS,
  TRIMESTER_MONTHS_MAP,
  TrimesterNumber,
  TrimesterMonthIndex,
  getMonthNumberFromTrimester,
  parseCellScoreInput,
} from '@/lib/primary-class-grid'
import { 
  getCoefficientForSubject, 
  detectClassSeriesKey, 
  LYCEE_SERIES_CONFIG,
  getPrimarySubjectMaxScore,
  detectPrimaryLevel,
  calculateDisciplineAverage,
  calculatePrimaryGeneralAverage,
  getPrimarySubjectOrder,
  computePrimaryMonthClassRanks,
} from '@/lib/academic-curriculum'

type ClassItem = { id: string; name: string; level?: string }
type SubjectItem = { id: string; name: string; cycle: string; category?: string | null; coefficient?: number }
type StudentItem = { id: string; last_name: string; first_name: string; matricule: string; class_id: string; gender?: string | null }

type PrimaryGradeItem = { student_id: string; subject_id: string; month_number: number; score: number }
type SecondaryGradeItem = { student_id: string; subject_id: string; term: string; class_score: number | null; comp_score: number | null }

type Props = {
  classes: ClassItem[]
  subjects: SubjectItem[]
  students: StudentItem[]
  primaryGrades: PrimaryGradeItem[]
  secondaryGrades: SecondaryGradeItem[]
  isTeacher?: boolean
  schoolName?: string
  academicYear?: string
}

const CATEGORY_PRIORITY: Record<string, number> = {
  'Français': 1,
  'Mathématiques': 2,
  'Sciences': 3,
  'Divers': 4,
  'Général': 5,
}

export function NotesManager({ 
  classes, 
  subjects, 
  students, 
  primaryGrades, 
  secondaryGrades,
  isTeacher = false,
  schoolName,
  academicYear
}: Props) {
  const router = useRouter()
  const [selectedCycle, setSelectedCycle] = useState<string>(() => {
    if (classes.length > 0) {
      const firstClass = classes[0]
      const full = ((firstClass.level || '') + ' ' + (firstClass.name || '')).toLowerCase()
      if (['cp1', 'cp2', 'cp', 'ce1', 'ce2', 'ce', 'cm1', 'cm2', 'cm', 'ci', 'primaire'].some(k => full.includes(k))) return 'primaire'
      if (['s1', 's2', 'section1', 'section2', 'maternelle', 'ps', 'ms', 'gs'].some(k => full.includes(k))) return 'maternelle'
      if (['6eme', '6ème', '5eme', '5ème', '4eme', '4ème', '3eme', '3ème', 'college', 'collège', '6e', '5e', '4e', '3e'].some(k => full.includes(k))) return 'college'
      if (['2nde', 'seconde', '1ere', '1ère', 'premiere', 'tle', 'terminale', 'lycee', 'lycée'].some(k => full.includes(k))) return 'lycee'
      if (['secondaire'].some(k => full.includes(k))) return 'secondaire'
    }
    return 'primaire'
  })
  const [selectedClass, setSelectedClass] = useState<string>(() => {
    if (classes.length === 1) return classes[0].id
    return ''
  })
  const [selectedStudent, setSelectedStudent] = useState<string>('') // Mode primaire / maternelle (fiche élève optionnelle)
  const [selectedSubject, setSelectedSubject] = useState<string>('') // Mode secondaire
  const [selectedTerm, setSelectedTerm] = useState<string>('1er_trimestre') // Mode secondaire

  // Sélecteurs Trimestre / Mois et brouillons de la grille collective Primaire / Maternelle
  const [selectedTrimester, setSelectedTrimester] = useState<TrimesterNumber>(1)
  const [selectedTrimMonth, setSelectedTrimMonth] = useState<TrimesterMonthIndex>(1)
  const [matrixScale, setMatrixScale] = useState<AverageScale>(20)
  const [matrixDivisorInput, setMatrixDivisorInput] = useState<string>('')
  const [classDraftEdits, setClassDraftEdits] = useState<Record<string, string>>({})
  const [isSavingMatrix, setIsSavingMatrix] = useState<boolean>(false)

  const [localSubjects, setLocalSubjects] = useState<SubjectItem[]>(subjects)
  const [localStudents, setLocalStudents] = useState<StudentItem[]>(students)
  const [allPrimaryGrades, setAllPrimaryGrades] = useState<PrimaryGradeItem[]>(primaryGrades)
  const [allSecondaryGrades, setAllSecondaryGrades] = useState<SecondaryGradeItem[]>(secondaryGrades)
  const [studentScores, setStudentScores] = useState<Record<string, string>>({})
  const [nextAfterSave, setNextAfterSave] = useState<boolean>(false)

  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [isResultsPreviewOpen, setIsResultsPreviewOpen] = useState<boolean>(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false)
  const [previewInitialSort, setPreviewInitialSort] = useState<SortMode>('alphabetical')
  const [previewInitialFilter, setPreviewInitialFilter] = useState<FilterMode>('all')

  const openResultsPreview = (sort: SortMode = 'alphabetical', filter: FilterMode = 'all') => {
    setPreviewInitialSort(sort)
    setPreviewInitialFilter(filter)
    setIsResultsPreviewOpen(true)
  }

  // Keep local copies in sync when props change
  useEffect(() => {
    setLocalSubjects(subjects)
  }, [subjects])

  useEffect(() => {
    setLocalStudents(students)
  }, [students])

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

  // Primary subjects sorted neatly by official curriculum order (Lecture followed directly by Étude de texte)
  const filteredPrimarySubjects = useMemo(() => {
    const list = localSubjects.filter(s => !s.cycle || s.cycle.toLowerCase() === 'primaire' || s.cycle.toLowerCase() === 'maternelle')
    
    // Déduplication stricte par nom normalisé
    const seen = new Set<string>()
    const deduplicated: typeof list = []

    for (const sub of list) {
      const norm = (sub.name || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim()
      if (!seen.has(norm)) {
        seen.add(norm)
        deduplicated.push(sub)
      }
    }

    const hasEtude = deduplicated.some(s => {
      const n = (s.name || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim()
      return n === 'etude de texte' || n.includes('etude de texte') || n.includes('etude texte')
    })
    if (!hasEtude) {
      deduplicated.push({
        id: 'virtual-etude-de-texte',
        name: 'Étude de texte',
        cycle: 'primaire',
        category: 'Français',
        coefficient: 1
      })
    }
    return deduplicated.sort((a, b) => {
      const orderA = getPrimarySubjectOrder(a.name)
      const orderB = getPrimarySubjectOrder(b.name)
      if (orderA !== orderB) return orderA - orderB
      return a.name.localeCompare(b.name)
    })
  }, [localSubjects])

  // Secondary subjects
  const filteredSecondarySubjects = useMemo(() => {
    return localSubjects.filter(s => s.cycle === 'secondaire')
  }, [localSubjects])

  // Auto-select class when filteredClasses changes
  useEffect(() => {
    if (filteredClasses.length === 1) {
      if (selectedClass !== filteredClasses[0].id) {
        setSelectedClass(filteredClasses[0].id)
      }
    } else if (selectedClass && !filteredClasses.some(c => c.id === selectedClass)) {
      setSelectedClass(filteredClasses[0]?.id || '')
    }
  }, [filteredClasses, selectedClass])

  // Auto-select subject for secondary when filteredSecondarySubjects changes
  useEffect(() => {
    if (isSecondaryCycle) {
      if (filteredSecondarySubjects.length === 1) {
        if (selectedSubject !== filteredSecondarySubjects[0].id) {
          setSelectedSubject(filteredSecondarySubjects[0].id)
        }
      } else if (selectedSubject && !filteredSecondarySubjects.some(s => s.id === selectedSubject)) {
        setSelectedSubject(filteredSecondarySubjects[0]?.id || '')
      }
    }
  }, [filteredSecondarySubjects, selectedSubject, isSecondaryCycle])

  // Students in selected class sorted alphabetically
  const filteredStudents = useMemo(() => {
    if (!selectedClass) return []
    return localStudents
      .filter(s => s.class_id === selectedClass)
      .sort((a, b) => a.last_name.localeCompare(b.last_name))
  }, [localStudents, selectedClass])

  // Current student helpers
  const currentStudentIndex = filteredStudents.findIndex(s => s.id === selectedStudent)
  const currentStudent = currentStudentIndex >= 0 ? filteredStudents[currentStudentIndex] : null
  const hasPrevStudent = currentStudentIndex > 0
  const hasNextStudent = currentStudentIndex >= 0 && currentStudentIndex < filteredStudents.length - 1

  // Mois effectif (1..9) piloté par Trimestre (1..3) + Mois du trimestre (1..3)
  const currentMonthNumber = getMonthNumberFromTrimester(selectedTrimester, selectedTrimMonth)

  // Notes enregistrées en base pour la classe et le mois actifs (clé: `${studentId}_${subjectId}`)
  const savedScoreMap = useMemo(() => {
    const map: Record<string, number> = {}
    if (!isPrimaryCycle || !selectedClass) return map
    const stuSet = new Set(filteredStudents.map(s => s.id))
    allPrimaryGrades.forEach(g => {
      if (
        g.month_number === currentMonthNumber &&
        stuSet.has(g.student_id) &&
        g.score !== null &&
        g.score !== undefined
      ) {
        map[`${g.student_id}_${g.subject_id}`] = Number(g.score)
      }
    })
    return map
  }, [isPrimaryCycle, selectedClass, filteredStudents, allPrimaryGrades, currentMonthNumber])

  // Brouillons non encore enregistrés pour (classe, mois) actif (clé: `${studentId}_${subjectId}`)
  const currentMonthDraftMap = useMemo(() => {
    const map: Record<string, string> = {}
    if (!selectedClass) return map
    const prefix = `${selectedClass}_${currentMonthNumber}_`
    Object.entries(classDraftEdits).forEach(([fullKey, rawVal]) => {
      if (fullKey.startsWith(prefix)) {
        map[fullKey.slice(prefix.length)] = rawVal
      }
    })
    return map
  }, [selectedClass, currentMonthNumber, classDraftEdits])

  // Compteur de notes saisies par mois (1..9) pour la classe active (badge dans le sélecteur de mois)
  const monthGradeCounts = useMemo(() => {
    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 }
    if (!isPrimaryCycle || !selectedClass) return counts
    const stuSet = new Set(filteredStudents.map(s => s.id))
    const mergedKeys = new Set<string>()
    allPrimaryGrades.forEach(g => {
      if (
        stuSet.has(g.student_id) &&
        g.score !== null &&
        g.score !== undefined &&
        g.month_number >= 1 &&
        g.month_number <= 9
      ) {
        mergedKeys.add(`${g.month_number}_${g.student_id}_${g.subject_id}`)
      }
    })
    const classPrefix = `${selectedClass}_`
    Object.entries(classDraftEdits).forEach(([fullKey, raw]) => {
      if (!fullKey.startsWith(classPrefix)) return
      const rest = fullKey.slice(classPrefix.length)
      const parsed = parseCellScoreInput(raw)
      if (parsed === null) {
        mergedKeys.delete(rest)
      } else if (typeof parsed === 'number') {
        mergedKeys.add(rest)
      }
    })
    mergedKeys.forEach(k => {
      const mNum = Number(k.split('_')[0])
      if (mNum >= 1 && mNum <= 9) counts[mNum] = (counts[mNum] || 0) + 1
    })
    return counts
  }, [isPrimaryCycle, selectedClass, filteredStudents, allPrimaryGrades, classDraftEdits])

  // Fusionne les saisies non encore enregistrées (grille collective + fiche élève) avec allPrimaryGrades pour l'aperçu/export instantané
  const effectivePrimaryGrades = useMemo(() => {
    if (!isPrimaryCycle) return allPrimaryGrades
    const hasClassDrafts =
      !!selectedClass &&
      Object.keys(classDraftEdits).some(k => k.startsWith(`${selectedClass}_`))
    const hasStudentDrafts = !!selectedStudent && Object.keys(studentScores).length > 0

    if (!hasClassDrafts && !hasStudentDrafts) {
      return allPrimaryGrades
    }

    const gradeMap = new Map<string, PrimaryGradeItem>()
    allPrimaryGrades.forEach(g => {
      gradeMap.set(`${g.student_id}_${g.subject_id}_${g.month_number}`, g)
    })

    if (hasClassDrafts && selectedClass) {
      const classPrefix = `${selectedClass}_`
      Object.entries(classDraftEdits).forEach(([fullKey, raw]) => {
        if (!fullKey.startsWith(classPrefix)) return
        const rest = fullKey.slice(classPrefix.length)
        const parts = rest.split('_')
        if (parts.length < 3) return
        const mNum = Number(parts[0])
        const stuId = parts[1]
        const subId = parts.slice(2).join('_')
        const mapKey = `${stuId}_${subId}_${mNum}`
        const parsed = parseCellScoreInput(raw)
        if (parsed === null) {
          gradeMap.delete(mapKey)
        } else if (typeof parsed === 'number') {
          gradeMap.set(mapKey, {
            student_id: stuId,
            subject_id: subId,
            month_number: mNum,
            score: parsed,
          })
        }
      })
    }

    if (hasStudentDrafts && selectedStudent) {
      for (let m = 1; m <= 9; m++) {
        filteredPrimarySubjects.forEach(s => {
          const valStr = studentScores[`${m}_${s.id}`]
          const mapKey = `${selectedStudent}_${s.id}_${m}`
          if (valStr !== undefined) {
            if (valStr.trim() === '') {
              gradeMap.delete(mapKey)
            } else {
              const val = parseFloat(valStr.replace(',', '.'))
              if (!isNaN(val)) {
                gradeMap.set(mapKey, {
                  student_id: selectedStudent,
                  subject_id: s.id,
                  month_number: m,
                  score: val,
                })
              }
            }
          }
        })
      }
    }

    return Array.from(gradeMap.values())
  }, [
    isPrimaryCycle,
    selectedClass,
    selectedStudent,
    classDraftEdits,
    studentScores,
    allPrimaryGrades,
    filteredPrimarySubjects,
  ])

  const handleMatrixCellChange = (studentId: string, subjectId: string, rawValue: string) => {
    if (!selectedClass) return
    const cellKey = `${studentId}_${subjectId}`
    const draftKey = `${selectedClass}_${currentMonthNumber}_${cellKey}`
    const savedVal = savedScoreMap[cellKey]

    setClassDraftEdits(prev => {
      const parsed = parseCellScoreInput(rawValue)
      const isTrailingSep = /[.,]$/.test(rawValue.trim())

      const matchesSaved =
        (savedVal === undefined && parsed === null) ||
        (savedVal !== undefined &&
          typeof parsed === 'number' &&
          Math.abs(parsed - savedVal) < 0.0001 &&
          !isTrailingSep)

      if (matchesSaved) {
        if (!(draftKey in prev)) return prev
        const next = { ...prev }
        delete next[draftKey]
        return next
      }

      return { ...prev, [draftKey]: rawValue }
    })
  }

  const handleResetMatrixDrafts = () => {
    if (!selectedClass) return
    const prefix = `${selectedClass}_${currentMonthNumber}_`
    setClassDraftEdits(prev => {
      const next: Record<string, string> = {}
      Object.entries(prev).forEach(([k, v]) => {
        if (!k.startsWith(prefix)) next[k] = v
      })
      return next
    })
    setError(null)
  }

  const handleSaveClassMonth = async () => {
    if (!selectedClass || isSavingMatrix) return
    setError(null)
    setSuccess(null)

    const subjectById = new Map(filteredPrimarySubjects.map(s => [s.id, s]))
    const upserts: Array<{ studentId: string; subjectId: string; score: number }> = []
    const deletes: Array<{ studentId: string; subjectId: string }> = []

    for (const [cellKey, raw] of Object.entries(currentMonthDraftMap)) {
      const sepIdx = cellKey.indexOf('_')
      if (sepIdx <= 0) continue
      const studentId = cellKey.slice(0, sepIdx)
      const subjectId = cellKey.slice(sepIdx + 1)
      const subj = subjectById.get(subjectId)
      const maxS = subj
        ? getPrimarySubjectMaxScore(subj.name, selectedClassObj?.name, selectedClassObj?.level)
        : 20

      const parsed = parseCellScoreInput(raw)
      if (parsed === 'invalid') {
        setError(`Valeur numérique invalide saisie ("${raw}") en ${subj?.name || 'discipline'}.`)
        return
      }
      if (parsed === null) {
        if (savedScoreMap[cellKey] !== undefined) {
          deletes.push({ studentId, subjectId })
        }
        continue
      }
      if (parsed > maxS) {
        setError(`La note ${parsed} dépasse le barème maximal (${maxS}) en ${subj?.name || 'discipline'}.`)
        return
      }

      const existing = savedScoreMap[cellKey]
      if (existing === undefined || Math.abs(parsed - existing) >= 0.0001) {
        upserts.push({ studentId, subjectId, score: parsed })
      }
    }

    if (upserts.length === 0 && deletes.length === 0) {
      setSuccess('Toutes les notes de ce mois sont déjà enregistrées.')
      setTimeout(() => setSuccess(null), 3000)
      return
    }

    setIsSavingMatrix(true)
    try {
      const result = await saveClassMonthPrimaryGrades({
        classId: selectedClass,
        monthNumber: currentMonthNumber,
        upserts,
        deletes,
      })

      if (result.error) {
        setError(result.error)
        return
      }

      const resolvedEtude = result.resolvedEtudeSubject
      if (resolvedEtude) {
        setLocalSubjects(prev => {
          if (prev.some(s => s.id === resolvedEtude.id)) return prev
          return [...prev, resolvedEtude]
        })
      }

      const deleteKeys = new Set(
        (result.deletedPairs || []).map(p => `${p.student_id}_${p.subject_id}_${p.month_number}`)
      )
      const upsertKeys = new Set(
        (result.savedGrades || []).map(g => `${g.student_id}_${g.subject_id}_${g.month_number}`)
      )

      setAllPrimaryGrades(prev => {
        const filtered = prev.filter(g => {
          const k = `${g.student_id}_${g.subject_id}_${g.month_number}`
          return !deleteKeys.has(k) && !upsertKeys.has(k)
        })
        return [...filtered, ...(result.savedGrades || [])]
      })

      const savedPrefix = `${selectedClass}_${currentMonthNumber}_`
      setClassDraftEdits(prev => {
        const next: Record<string, string> = {}
        Object.entries(prev).forEach(([k, v]) => {
          if (k.startsWith(savedPrefix)) return
          if (resolvedEtude && k.endsWith('_virtual-etude-de-texte')) {
            next[k.replace(/_virtual-etude-de-texte$/, `_${resolvedEtude.id}`)] = v
          } else {
            next[k] = v
          }
        })
        return next
      })

      const totalTouched = (result.savedCount || 0) + (result.deletedCount || 0)
      const trimLabel = TRIMESTER_OPTIONS.find(t => t.value === selectedTrimester)?.shortLabel || `T${selectedTrimester}`
      const monthLabel =
        TRIMESTER_MONTHS_MAP[selectedTrimester]?.find(m => m.trimMonth === selectedTrimMonth)?.label ||
        `Mois ${currentMonthNumber}`
      setSuccess(
        `Grille enregistrée (${trimLabel} · ${monthLabel}) : ${totalTouched} note(s) synchronisée(s) avec succès !`
      )
      setTimeout(() => setSuccess(null), 4500)
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur inattendue lors de l’enregistrement.')
    } finally {
      setIsSavingMatrix(false)
    }
  }

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

  // Classement officiel automatique pour chaque mois de l'année
  const computedPrimaryRanks = useMemo(() => {
    if (!isPrimaryCycle || !selectedClass) return {}
    const convertedLocalScores: Record<string, string> = {}
    Object.entries(studentScores).forEach(([k, v]) => {
      const parts = k.split('_')
      if (parts.length === 2) {
        const m = parts[0]
        const sId = parts[1]
        convertedLocalScores[`${sId}_${m}`] = v
      }
    })

    return computePrimaryMonthClassRanks({
      students: filteredStudents,
      primaryGrades: allPrimaryGrades,
      subjects: filteredPrimarySubjects,
      className: selectedClassObj?.name,
      classLevel: selectedClassObj?.level,
      localScoresOverride: convertedLocalScores,
      activeStudentId: selectedStudent,
    })
  }, [isPrimaryCycle, selectedClass, filteredStudents, allPrimaryGrades, filteredPrimarySubjects, selectedClassObj, studentScores, selectedStudent])

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

  // Handle Clear all grades for student
  const handleClearAllGrades = () => {
    if (!selectedStudent || !currentStudent) return
    const confirmed = window.confirm(`Voulez-vous vraiment effacer toutes les notes saisies pour ${currentStudent.first_name} ${currentStudent.last_name} ? L'espace parent et les bulletins redeviendront vides pour cet élève.`)
    if (!confirmed) return

    startTransition(async () => {
      const res = await clearStudentGrades(selectedStudent)
      if (res?.error) {
        setError(res.error)
      } else {
        setAllPrimaryGrades(prev => prev.filter(g => g.student_id !== selectedStudent))
        setStudentScores({})
        setSuccess(`Toutes les notes de ${currentStudent.first_name} ont été effacées avec succès.`)
        setTimeout(() => setSuccess(null), 4000)
      }
    })
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
          // Mettre à jour l'état local allSecondaryGrades pour refléter immédiatement les notes en aperçu / export Excel
          const subId = formData.get('subjectId') as string
          const trm = formData.get('term') as string
          setAllSecondaryGrades(prev => {
            const nextList = prev.filter(g => !(g.subject_id === subId && g.term === trm && filteredStudents.some(s => s.id === g.student_id)))
            filteredStudents.forEach(stu => {
              const cStr = formData.get(`class_score_${stu.id}`) as string | null
              const compStr = formData.get(`comp_score_${stu.id}`) as string | null
              const cVal = cStr && cStr.trim() !== '' ? parseFloat(cStr) : null
              const compVal = compStr && compStr.trim() !== '' ? parseFloat(compStr) : null
              if (cVal !== null || compVal !== null) {
                nextList.push({
                  student_id: stu.id,
                  subject_id: subId,
                  term: trm,
                  class_score: !isNaN(cVal as number) ? cVal : null,
                  comp_score: !isNaN(compVal as number) ? compVal : null,
                })
              }
            })
            return nextList
          })
          setSuccess('Notes du secondaire enregistrées avec succès !')
          setTimeout(() => setSuccess(null), 3000)
        }
      }
    })
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-[var(--color-surface)] custom-scrollbar">
      <div className="max-w-[1440px] mx-auto space-y-6">
        
        {/* En-tête Exécutif — Scogestia Slate & Emerald */}
        <div className="relative flex flex-col justify-between gap-4 overflow-hidden rounded-2xl bg-gradient-to-r from-[#0F172A] via-[#132A3E] to-[#064E3B] px-6 py-5 text-white shadow-[0_14px_34px_-14px_rgba(6,78,59,0.5)] ring-1 ring-emerald-400/20 sm:px-7 sm:py-6 xl:flex-row xl:items-center">
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute -right-12 -top-16 h-56 w-56 rounded-full bg-emerald-400/15 blur-3xl" />
            <div className="absolute -bottom-20 left-1/3 h-48 w-72 rounded-full bg-sky-400/10 blur-3xl" />
          </div>
          <div className="relative z-10 min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-100 ring-1 ring-inset ring-white/20 backdrop-blur-md">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Académique · Saisie des Notes
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-slate-200 ring-1 ring-inset ring-white/15">
                <GraduationCap className="w-3.5 h-3.5 text-emerald-300" />
                {isPrimaryCycle
                  ? selectedStudent
                    ? 'Primaire · Fiche élève (9 mois)'
                    : 'Primaire · Grille collective de classe'
                  : 'Secondaire (par matière)'}
              </span>
            </div>
            <h2 className="text-xl font-extrabold tracking-tight text-white sm:text-2xl">
              Grille de Saisie &amp; Import Excel des Notes
            </h2>
            <p className="mt-1 text-[13px] font-medium text-slate-300 sm:text-sm">
              {isPrimaryCycle
                ? selectedStudent
                  ? 'Visualisez ou ajustez les 9 mois d’évaluations pour cet élève, ou revenez à la grille collective.'
                  : 'Sélectionnez le niveau, la classe, le trimestre et le mois pour saisir toute la classe d’un coup avec calcul automatique du total et de la moyenne.'
                : 'Importez votre fichier Excel de classe par matières ou saisissez les notes ci-dessous.'}
            </p>
          </div>

          <div className="relative z-10 flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-extrabold shadow-sm transition-all whitespace-nowrap cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Importer Excel</span>
            </button>

            {selectedClassObj && (
              <>
                <button
                  type="button"
                  onClick={() => openResultsPreview('alphabetical', 'all')}
                  className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold shadow-sm transition-all whitespace-nowrap cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                  <span>Aperçu &amp; Export (.xlsx)</span>
                </button>
                <button
                  type="button"
                  onClick={() => openResultsPreview('merit', 'passing_only')}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/12 hover:bg-white/20 text-white ring-1 ring-white/25 text-xs font-bold transition-all whitespace-nowrap cursor-pointer"
                >
                  <Trophy className="w-4 h-4 text-amber-300" />
                  <span>Mérite (Admis)</span>
                </button>
              </>
            )}
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

            {/* In Primary mode: Trimestre -> Mois -> Élève (fiche 9m optionnelle) */}
            {isPrimaryCycle ? (
              <>
                <div className="flex flex-col gap-1.5 min-w-[195px] flex-1">
                  <label className="text-sm font-semibold text-[var(--color-on-surface)] flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-[var(--color-primary)]" />
                    Trimestre
                  </label>
                  <select
                    value={selectedTrimester}
                    onChange={(e) => {
                      const t = Number(e.target.value) as TrimesterNumber
                      setSelectedTrimester(t)
                      setSelectedStudent('')
                    }}
                    disabled={!selectedClass}
                    className="h-11 px-3 border border-[var(--color-outline-variant)] rounded-lg text-sm focus:border-[var(--color-primary)] outline-none bg-[var(--color-surface)] font-medium disabled:opacity-50 disabled:bg-gray-50"
                  >
                    {TRIMESTER_OPTIONS.map(t => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5 min-w-[185px] flex-1">
                  <label className="text-sm font-semibold text-[var(--color-on-surface)] flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-emerald-700" />
                    Mois du trimestre
                  </label>
                  <select
                    value={selectedTrimMonth}
                    onChange={(e) => {
                      setSelectedTrimMonth(Number(e.target.value) as TrimesterMonthIndex)
                      setSelectedStudent('')
                    }}
                    disabled={!selectedClass}
                    className="h-11 px-3 border border-[var(--color-outline-variant)] rounded-lg text-sm focus:border-[var(--color-primary)] outline-none bg-[var(--color-surface)] font-medium disabled:opacity-50 disabled:bg-gray-50"
                  >
                    {TRIMESTER_MONTHS_MAP[selectedTrimester].map(m => {
                      const cnt = monthGradeCounts[m.monthNumber] || 0
                      return (
                        <option key={m.monthNumber} value={m.trimMonth}>
                          {m.label}{selectedClass && cnt > 0 ? ` (${cnt} notes)` : ''}
                        </option>
                      )
                    })}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5 flex-1 min-w-[205px]">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-[var(--color-on-surface)] flex items-center gap-1.5">
                      <User className="w-4 h-4 text-[var(--color-primary)]" />
                      Vue / Élève
                    </label>
                    {selectedStudent && (
                      <button
                        type="button"
                        onClick={() => setSelectedStudent('')}
                        className="text-xs text-[var(--color-primary)] hover:underline font-semibold cursor-pointer"
                      >
                        Retour grille classe
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
                      {!selectedClass
                        ? "Sélectionnez d'abord une classe"
                        : `Toute la classe (${filteredStudents.length} élèves)`}
                    </option>
                    {filteredStudents.map((s, idx) => (
                      <option key={s.id} value={s.id}>
                        {idx + 1}. {s.last_name} {s.first_name} {s.matricule ? `(${s.matricule})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </>
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
            const curSubj = localSubjects.find(s => s.id === selectedSubject);
            if (!curClass || !isSecondaryCycle) return null;
            const seriesKey = detectClassSeriesKey(curClass.name, curClass.level);
            const coef = curSubj ? getCoefficientForSubject(curSubj.name, curClass.name, curClass.level, (curSubj as any).coefficient || 2) : null;
            return (
              <div className="px-6 py-2.5 bg-slate-50 border-b border-[var(--color-outline-variant)] flex flex-wrap items-center justify-between gap-2 text-xs text-slate-700">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">Classe : {curClass.name}</span>
                  {seriesKey && (
                    <span className="font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {LYCEE_SERIES_CONFIG[seriesKey].label}
                    </span>
                  )}
                </div>
                {curSubj && coef && (
                  <div className="flex flex-wrap items-center gap-2 font-medium">
                    <span>Matière : <strong className="text-slate-950">{curSubj.name}</strong></span>
                    <span className="font-bold px-2.5 py-0.5 rounded-md bg-white border border-slate-200 text-slate-800 shadow-2xs">
                      Coefficient : {coef}
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
                <p className="text-sm mt-1 max-w-md">Choisissez une classe primaire (CP1, CP2, CE1, CE2, CM1, CM2) pour accéder à la liste de ses élèves ou importez directement un fichier Excel complet.</p>
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(true)}
                  className="mt-5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm cursor-pointer transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  <span>Importer un fichier Excel rempli</span>
                </button>
              </div>
            ) : filteredStudents.length === 0 ? (
              /* Étape 2 : Classe vide */
              <div className="p-16 flex flex-col items-center justify-center text-center text-[var(--color-on-surface-variant)] flex-1 min-h-[350px]">
                <User className="w-12 h-12 mb-3 opacity-40 text-[var(--color-primary)]" />
                <h4 className="text-lg font-semibold text-[var(--color-on-surface)]">Aucun élève dans cette classe</h4>
                <p className="text-sm mt-1 max-w-md">Ajoutez d&apos;abord des élèves dans la classe {selectedClassObj?.name} ou importez directement un fichier Excel rempli (Scogestia calcule les résultats et peut inscrire les élèves).</p>
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(true)}
                  className="mt-5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm cursor-pointer transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  <span>Importer un fichier Excel rempli</span>
                </button>
              </div>
            ) : !selectedStudent ? (
              /* Étape 3 : Grille collective de saisie directe par classe (N°, Nom et Prénoms, Sexe, Disciplines, Total, Moyenne) */
              <PrimaryClassMatrixGrid
                classId={selectedClass}
                className={selectedClassObj?.name || ''}
                classLevel={selectedClassObj?.level}
                students={filteredStudents}
                subjects={filteredPrimarySubjects}
                trimester={selectedTrimester}
                trimMonth={selectedTrimMonth}
                monthNumber={currentMonthNumber}
                savedScoreMap={savedScoreMap}
                draftMap={currentMonthDraftMap}
                onCellChange={handleMatrixCellChange}
                onResetDrafts={handleResetMatrixDrafts}
                onSaveMonth={handleSaveClassMonth}
                onOpenStudentFiche={(studentId) => setSelectedStudent(studentId)}
                isSaving={isSavingMatrix}
                scale={matrixScale}
                onScaleChange={setMatrixScale}
                customDivisorInput={matrixDivisorInput}
                onCustomDivisorChange={setMatrixDivisorInput}
              />
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
                      title="Retour à la grille de classe"
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
                        <span>{filteredPrimarySubjects.length} matières</span>
                      </p>
                    </div>
                  </div>

                  {/* Quick Prev / Next navigation + Back to Class Grid button */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedStudent('')}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-[var(--color-outline-variant)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-container-high)] text-[var(--color-on-surface)] transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Grille de classe</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleClearAllGrades}
                      disabled={isPending}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
                      title="Effacer toutes les notes de cet élève"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      <span>Effacer les notes</span>
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

                    <div className="p-3 rounded-xl border border-blue-200 bg-blue-50/70 flex flex-col shadow-2xs">
                      <span className="text-[11px] font-bold text-blue-950 uppercase tracking-wide">Règle Primaire</span>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-sm font-black text-blue-900">Moyenne sur 10</span>
                      </div>
                      <span className="text-[10px] font-medium text-blue-800 mt-0.5">Calculée par mois composé (pas de moyenne annuelle)</span>
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
                          Discipline
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
                                <span className="font-semibold text-[var(--color-on-surface)] text-sm leading-tight">
                                  {subject.name}
                                </span>
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
                                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                  : 'bg-red-100 text-red-900 border border-red-200'
                              }`}>
                                {termSummaries.annual.avg} / 10
                              </span>
                              <span className="text-[9px] font-normal text-[var(--color-on-surface-variant)] mt-0.5">
                                Moyenne sur 10
                              </span>
                            </div>
                          ) : (
                            <span className="text-[var(--color-on-surface-variant)] opacity-40">—</span>
                          )}
                        </td>
                      </tr>

                      {/* Row 3: RANG DE L'ÉLÈVE DANS LA CLASSE */}
                      <tr className="bg-[var(--color-surface-container)] border-t border-[var(--color-outline-variant)] text-xs font-bold text-[var(--color-on-surface)]">
                        <td className="py-2.5 px-4 sticky left-0 bg-[var(--color-surface-container)] z-20 border-r border-[var(--color-outline-variant)] shadow-[1px_0_0_var(--color-outline-variant)]">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                              Rang de l&apos;élève
                            </span>
                            <span className="text-[10px] font-normal text-[var(--color-on-surface-variant)] uppercase tracking-wider">
                              Dans la classe
                            </span>
                          </div>
                        </td>
                        {Array.from({ length: 9 }).map((_, i) => {
                          const month = i + 1;
                          const r = computedPrimaryRanks[month]?.[selectedStudent]?.rankText;

                          return (
                            <td 
                              key={i} 
                              className={`py-2 px-2 text-center ${month === 3 || month === 6 ? 'border-r border-[var(--color-outline-variant)]' : ''}`}
                            >
                              {r ? (
                                <span className="inline-block px-2 py-0.5 rounded font-extrabold text-xs bg-blue-100 text-blue-900 border border-blue-200 shadow-2xs">
                                  {r}
                                </span>
                              ) : (
                                <span className="text-[var(--color-on-surface-variant)] opacity-40">-</span>
                              )}
                            </td>
                          );
                        })}
                        {/* Annuel Info */}
                        <td className="py-2.5 px-2 text-center border-l border-[var(--color-outline-variant)] bg-[var(--color-surface-container)] font-semibold text-xs text-[var(--color-on-surface-variant)]" colSpan={2}>
                          {filteredStudents.length} élèves
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
                <p className="text-sm mt-1 max-w-md">Au secondaire, la saisie manuelle s&apos;effectue par matière, ou importez directement le fichier Excel complet de toute la classe.</p>
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(true)}
                  className="mt-5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm cursor-pointer transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  <span>Importer un fichier Excel complet</span>
                </button>
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
                              key={`${selectedClass}_${selectedSubject}_${selectedTerm}_${student.id}_class`}
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
                              key={`${selectedClass}_${selectedSubject}_${selectedTerm}_${student.id}_comp`}
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
                
                <div className="p-4 border-t border-[var(--color-outline-variant)] bg-[var(--color-surface-bright)] flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs text-[var(--color-on-surface-variant)]">
                    Barème sur <strong>20</strong> · Utilisez l&apos;en-tête ci-dessus pour l&apos;import ou l&apos;export Excel complet de la classe.
                  </span>
                  <button type="submit" disabled={isPending} className="px-6 py-2.5 rounded-lg text-sm font-semibold bg-[var(--color-primary)] text-white hover:opacity-90 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm cursor-pointer ml-auto">
                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Enregistrer les notes
                  </button>
                </div>
              </form>
            )
          )}
        </div>
      </div>

      {selectedClassObj && (
        <ClassResultsPreviewModal
          isOpen={isResultsPreviewOpen}
          onClose={() => setIsResultsPreviewOpen(false)}
          classItem={selectedClassObj}
          students={localStudents}
          subjects={isPrimaryCycle ? filteredPrimarySubjects : filteredSecondarySubjects}
          primaryGrades={effectivePrimaryGrades}
          secondaryGrades={allSecondaryGrades}
          cycle={(selectedCycle as ExportCycle) || 'primaire'}
          initialSecondaryTerm={selectedTerm}
          initialSortMode={previewInitialSort}
          initialFilterMode={previewInitialFilter}
          schoolName={schoolName}
          academicYear={academicYear}
        />
      )}

      <ImportGradesModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        classes={filteredClasses.length > 0 ? filteredClasses : classes}
        selectedClassId={selectedClass || filteredClasses[0]?.id || classes[0]?.id || ''}
        students={localStudents}
        subjects={localSubjects}
        cycle={(selectedCycle as ExportCycle) || 'primaire'}
        initialTerm={selectedTerm}
        schoolName={schoolName}
        academicYear={academicYear}
        isTeacher={isTeacher}
        onImportSaved={({
          classId: importedClassId,
          savedPrimaryGrades,
          savedSecondaryGrades,
          createdStudents,
          createdSubjects,
        }) => {
          if (createdSubjects && createdSubjects.length > 0) {
            setLocalSubjects(prev => {
              const existingIds = new Set(prev.map(s => s.id))
              const additions = createdSubjects.filter(s => !existingIds.has(s.id))
              return additions.length > 0 ? [...prev, ...additions] : prev
            })
          }
          if (createdStudents && createdStudents.length > 0) {
            setLocalStudents(prev => {
              const existingIds = new Set(prev.map(s => s.id))
              const additions = createdStudents.filter(s => !existingIds.has(s.id))
              return additions.length > 0 ? [...prev, ...additions] : prev
            })
          }
          if (savedPrimaryGrades && savedPrimaryGrades.length > 0) {
            setAllPrimaryGrades(prev => {
              const incomingKeys = new Set(
                savedPrimaryGrades.map(g => `${g.student_id}_${g.subject_id}_${g.month_number}`)
              )
              const kept = prev.filter(
                g => !incomingKeys.has(`${g.student_id}_${g.subject_id}_${g.month_number}`)
              )
              return [...kept, ...savedPrimaryGrades]
            })
          }
          if (savedSecondaryGrades && savedSecondaryGrades.length > 0) {
            setAllSecondaryGrades(prev => {
              const incomingKeys = new Set(
                savedSecondaryGrades.map(g => `${g.student_id}_${g.subject_id}_${g.term}`)
              )
              const kept = prev.filter(
                g => !incomingKeys.has(`${g.student_id}_${g.subject_id}_${g.term}`)
              )
              return [...kept, ...savedSecondaryGrades]
            })
          }
          if (importedClassId) {
            setSelectedClass(importedClassId)
          }
          const savedCount = (savedPrimaryGrades?.length || 0) + (savedSecondaryGrades?.length || 0)
          setSuccess(`Importation Excel réussie : ${savedCount} note(s) enregistrée(s) et synchronisée(s) dans Scogestia !`)
          setTimeout(() => setSuccess(null), 5000)
          router.refresh()
        }}
      />
    </div>
  )
}
