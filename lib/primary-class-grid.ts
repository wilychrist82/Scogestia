import { getPrimarySubjectMaxScore, formatRank } from '@/lib/academic-curriculum'
import { AverageScale, getAppreciation, normalizeGender } from '@/lib/grades-export'

export type TrimesterNumber = 1 | 2 | 3
export type TrimesterMonthIndex = 1 | 2 | 3

export interface TrimesterMonthOption {
  trimMonth: TrimesterMonthIndex
  monthNumber: number
  shortLabel: string
  calendarMonth: string
  label: string
}

export const TRIMESTER_OPTIONS: Array<{ value: TrimesterNumber; label: string; shortLabel: string }> = [
  { value: 1, label: '1er Trimestre (Mois 1 à 3)', shortLabel: '1er Trimestre' },
  { value: 2, label: '2e Trimestre (Mois 1 à 3)', shortLabel: '2e Trimestre' },
  { value: 3, label: '3e Trimestre (Mois 1 à 3)', shortLabel: '3e Trimestre' },
]

export const TRIMESTER_MONTHS_MAP: Record<TrimesterNumber, TrimesterMonthOption[]> = {
  1: [
    { trimMonth: 1, monthNumber: 1, shortLabel: 'Mois 1', calendarMonth: 'Octobre', label: 'Mois 1 — Octobre' },
    { trimMonth: 2, monthNumber: 2, shortLabel: 'Mois 2', calendarMonth: 'Novembre', label: 'Mois 2 — Novembre' },
    { trimMonth: 3, monthNumber: 3, shortLabel: 'Mois 3', calendarMonth: 'Décembre', label: 'Mois 3 — Décembre' },
  ],
  2: [
    { trimMonth: 1, monthNumber: 4, shortLabel: 'Mois 1', calendarMonth: 'Janvier', label: 'Mois 1 — Janvier (M4)' },
    { trimMonth: 2, monthNumber: 5, shortLabel: 'Mois 2', calendarMonth: 'Février', label: 'Mois 2 — Février (M5)' },
    { trimMonth: 3, monthNumber: 6, shortLabel: 'Mois 3', calendarMonth: 'Mars', label: 'Mois 3 — Mars (M6)' },
  ],
  3: [
    { trimMonth: 1, monthNumber: 7, shortLabel: 'Mois 1', calendarMonth: 'Avril', label: 'Mois 1 — Avril (M7)' },
    { trimMonth: 2, monthNumber: 8, shortLabel: 'Mois 2', calendarMonth: 'Mai', label: 'Mois 2 — Mai (M8)' },
    { trimMonth: 3, monthNumber: 9, shortLabel: 'Mois 3', calendarMonth: 'Juin', label: 'Mois 3 — Juin (M9)' },
  ],
}

export function getMonthNumberFromTrimester(
  trimester: TrimesterNumber,
  trimMonth: TrimesterMonthIndex
): number {
  return (trimester - 1) * 3 + trimMonth
}

export function getTrimesterAndMonthFromMonthNumber(monthNumber: number): {
  trimester: TrimesterNumber
  trimMonth: TrimesterMonthIndex
} {
  const safe = Math.min(9, Math.max(1, Math.round(monthNumber || 1)))
  const trimester = (Math.floor((safe - 1) / 3) + 1) as TrimesterNumber
  const trimMonth = (((safe - 1) % 3) + 1) as TrimesterMonthIndex
  return { trimester, trimMonth }
}

export function parseCellScoreInput(raw: string): number | null | 'invalid' {
  const trimmed = (raw || '').trim()
  if (trimmed === '') return null
  const normalized = trimmed.replace(',', '.')
  if (!/^\d+(\.\d+)?$/.test(normalized)) return 'invalid'
  const num = Number(normalized)
  if (!Number.isFinite(num) || num < 0) return 'invalid'
  return num
}

export interface GridStudentInput {
  id: string
  last_name: string
  first_name: string
  matricule?: string | null
  gender?: string | null
}

export interface GridSubjectInput {
  id: string
  name: string
  category?: string | null
}

export interface ComputedGridSubject extends GridSubjectInput {
  maxScore: number
  hasAnyGrade: boolean
}

export interface ComputedGridStudentRow {
  student: GridStudentInput
  fullName: string
  gender: 'M' | 'F' | ''
  numericScores: Record<string, number | null>
  invalidSubjects: Record<string, boolean>
  gradedCount: number
  totalPoints: number | null
  average: number | null
  rankNum: number | null
  rankText: string
  isExAequo: boolean
  isPassing: boolean
  isAbsent: boolean
  appreciation: string
  appreciationBucket: ReturnType<typeof getAppreciation>['bucket']
}

export interface PrimaryClassMatrixSummary {
  subjects: ComputedGridSubject[]
  rows: ComputedGridStudentRow[]
  rowByStudentId: Record<string, ComputedGridStudentRow>
  baremeTotal: number
  divisor: number
  formulaLabel: string
  passThreshold: number
  enrolledCount: number
  presentCount: number
  absentCount: number
  passingCount: number
  failingCount: number
  passRatePct: number | null
  classAverage: number | null
  invalidCellCount: number
}

export function computePrimaryMatrixCalculations(params: {
  students: GridStudentInput[]
  subjects: GridSubjectInput[]
  className?: string | null
  classLevel?: string | null
  getRawValue: (studentId: string, subjectId: string) => string
  scale: AverageScale
  customDivisor?: number | null
}): PrimaryClassMatrixSummary {
  const { students, subjects, className, classLevel, getRawValue, scale, customDivisor } = params
  const passThreshold = scale === 10 ? 5 : 10

  // 1. Préparer les disciplines et détecter celles effectivement notées dans le mois
  const computedSubjects: ComputedGridSubject[] = subjects.map(sub => ({
    ...sub,
    maxScore: getPrimarySubjectMaxScore(sub.name, className || undefined, classLevel || undefined),
    hasAnyGrade: false,
  }))

  let invalidCellCount = 0
  const perStudentParsed = students.map(stu => {
    const numericScores: Record<string, number | null> = {}
    const invalidSubjects: Record<string, boolean> = {}
    let totalPoints = 0
    let gradedCount = 0

    for (const sub of computedSubjects) {
      const raw = getRawValue(stu.id, sub.id)
      const parsed = parseCellScoreInput(raw)
      if (parsed === 'invalid') {
        invalidSubjects[sub.id] = true
        numericScores[sub.id] = null
        invalidCellCount++
      } else if (parsed === null) {
        invalidSubjects[sub.id] = false
        numericScores[sub.id] = null
      } else if (parsed > sub.maxScore) {
        invalidSubjects[sub.id] = true
        numericScores[sub.id] = parsed
        totalPoints += parsed
        gradedCount++
        sub.hasAnyGrade = true
        invalidCellCount++
      } else {
        invalidSubjects[sub.id] = false
        numericScores[sub.id] = parsed
        totalPoints += parsed
        gradedCount++
        sub.hasAnyGrade = true
      }
    }

    return {
      student: stu,
      numericScores,
      invalidSubjects,
      gradedCount,
      totalPoints: gradedCount > 0 ? Number(totalPoints.toFixed(2)) : null,
    }
  })

  // 2. Barème total et diviseur automatique sur les disciplines composées (comme l'export officiel)
  const activeSubjects = computedSubjects.filter(s => s.hasAnyGrade)
  const denominatorSubjects = activeSubjects.length > 0 ? activeSubjects : computedSubjects
  const baremeTotal = denominatorSubjects.reduce((acc, s) => acc + s.maxScore, 0)
  const autoDivisor = baremeTotal > 0 ? baremeTotal / scale : 1
  const divisor = customDivisor && customDivisor > 0 ? customDivisor : autoDivisor

  const divDisplay = (Math.round(divisor * 100) / 100).toString().replace('.', ',')
  const formulaLabel = `Moyenne = Total ÷ ${divDisplay}`

  // 3. Totaux, moyennes et appréciations par élève
  const baseRows: ComputedGridStudentRow[] = perStudentParsed.map(entry => {
    const isAbsent = entry.gradedCount === 0
    const average =
      !isAbsent && entry.totalPoints !== null && divisor > 0
        ? Number((entry.totalPoints / divisor).toFixed(2))
        : null
    const appr = getAppreciation(average, scale)

    return {
      student: entry.student,
      fullName: `${(entry.student.last_name || '').toUpperCase()} ${entry.student.first_name || ''}`.trim(),
      gender: normalizeGender(entry.student.gender),
      numericScores: entry.numericScores,
      invalidSubjects: entry.invalidSubjects,
      gradedCount: entry.gradedCount,
      totalPoints: entry.totalPoints,
      average,
      rankNum: null,
      rankText: '—',
      isExAequo: false,
      isPassing: average !== null && average >= passThreshold,
      isAbsent,
      appreciation: appr.label,
      appreciationBucket: appr.bucket,
    }
  })

  // 4. Classement officiel ex-æquo sur les élèves notés
  const presentSorted = baseRows
    .filter(r => !r.isAbsent && r.average !== null)
    .sort((a, b) => {
      if ((b.average ?? 0) !== (a.average ?? 0)) return (b.average ?? 0) - (a.average ?? 0)
      return (b.totalPoints ?? 0) - (a.totalPoints ?? 0)
    })

  const rankById = new Map<string, { rankNum: number; rankText: string; isExAequo: boolean }>()
  let currentRank = 1
  for (let i = 0; i < presentSorted.length; i++) {
    const cur = presentSorted[i]
    const prev = i > 0 ? presentSorted[i - 1] : null
    const next = i < presentSorted.length - 1 ? presentSorted[i + 1] : null

    const sameAsPrev =
      prev !== null &&
      prev.average === cur.average &&
      Math.abs((prev.totalPoints ?? 0) - (cur.totalPoints ?? 0)) < 0.001

    const sameAsNext =
      next !== null &&
      next.average === cur.average &&
      Math.abs((next.totalPoints ?? 0) - (cur.totalPoints ?? 0)) < 0.001

    if (!sameAsPrev) {
      currentRank = i + 1
    }
    const isExAequo = sameAsPrev || sameAsNext
    rankById.set(cur.student.id, {
      rankNum: currentRank,
      rankText: formatRank(currentRank, isExAequo),
      isExAequo,
    })
  }

  const rows = baseRows.map(r => {
    const rank = rankById.get(r.student.id)
    if (!rank) return r
    return {
      ...r,
      rankNum: rank.rankNum,
      rankText: rank.rankText,
      isExAequo: rank.isExAequo,
    }
  })

  const rowByStudentId: Record<string, ComputedGridStudentRow> = {}
  rows.forEach(r => {
    rowByStudentId[r.student.id] = r
  })

  const presentRows = rows.filter(r => !r.isAbsent && r.average !== null)
  const passingCount = presentRows.filter(r => r.isPassing).length
  const failingCount = presentRows.length - passingCount
  const passRatePct =
    presentRows.length > 0 ? Number(((passingCount / presentRows.length) * 100).toFixed(1)) : null
  const classAverage =
    presentRows.length > 0
      ? Number(
          (
            presentRows.reduce((acc, r) => acc + (r.average ?? 0), 0) / presentRows.length
          ).toFixed(2)
        )
      : null

  return {
    subjects: computedSubjects,
    rows,
    rowByStudentId,
    baremeTotal,
    divisor: Number(divisor.toFixed(4)),
    formulaLabel,
    passThreshold,
    enrolledCount: rows.length,
    presentCount: presentRows.length,
    absentCount: rows.length - presentRows.length,
    passingCount,
    failingCount,
    passRatePct,
    classAverage,
    invalidCellCount,
  }
}
