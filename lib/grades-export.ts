import {
  getPrimarySubjectMaxScore,
  getPrimarySubjectOrder,
  getCoefficientForSubject,
  formatRank,
} from '@/lib/academic-curriculum'

export type ExportCycle = 'primaire' | 'maternelle' | 'college' | 'lycee' | 'secondaire'
export type AverageScale = 20 | 10
export type SortMode = 'alphabetical' | 'merit'
export type FilterMode = 'all' | 'passing_only'

export interface ExportClassItem {
  id: string
  name: string
  level?: string | null
}

export interface ExportSubjectItem {
  id: string
  name: string
  cycle: string
  category?: string | null
  coefficient?: number | null
}

export interface ExportStudentItem {
  id: string
  last_name: string
  first_name: string
  matricule?: string | null
  class_id: string
  gender?: string | null
}

export interface ExportPrimaryGrade {
  student_id: string
  subject_id: string
  month_number: number
  score: number
}

export interface ExportSecondaryGrade {
  student_id: string
  subject_id: string
  term: string
  class_score: number | null
  comp_score: number | null
}

export interface ExportColumnDef {
  id: string
  name: string
  shortName: string
  maxScore: number
  coefficient: number
  hasAnyGrade: boolean
}

export interface ComputedStudentRow {
  studentId: string
  lastName: string
  firstName: string
  fullName: string
  matricule: string
  gender: 'M' | 'F' | ''
  /** Map columnId -> numeric score (or null if blank/absent) */
  scores: Record<string, number | null>
  gradedCount: number
  totalPoints: number | null
  /** Average on chosen scale (/20 or /10), or null if absent */
  average: number | null
  rankNum: number | null
  rankText: string
  isExAequo: boolean
  isPassing: boolean
  isAbsent: boolean
  appreciation: string
  appreciationBucket:
    | 'tres_bon'
    | 'bon'
    | 'assez_bon'
    | 'passable'
    | 'mediocre'
    | 'tres_insuffisant'
    | 'absent'
}

export interface RecapGenderStats {
  boys: number
  girls: number
  other: number
  total: number
}

export interface SubjectStatsRow {
  columnId: string
  name: string
  maxScore: number
  coefficient: number
  gradedCount: number
  minScore: number | null
  maxFoundScore: number | null
  average: number | null
  passingCount: number
  passRatePct: number | null
}

export interface ClassResultsReport {
  title: string
  periodLabel: string
  className: string
  schoolName: string
  academicYear: string
  cycle: ExportCycle
  isPrimary: boolean
  scale: AverageScale
  passThreshold: number
  sortMode: SortMode
  filterMode: FilterMode
  /** Formula label displayed in subheader, e.g. "Moyenne = Total ÷ 7" */
  formulaLabel: string
  divisor: number
  barèmeTotal: number
  columns: ExportColumnDef[]
  /** All students ranked (unsorted reference list) */
  allRows: ComputedStudentRow[]
  /** Rows after applying filterMode and sortMode */
  displayRows: ComputedStudentRow[]
  /** Passing students sorted strictly by merit descending */
  meritPassingRows: ComputedStudentRow[]
  stats: {
    enrolled: RecapGenderStats
    present: RecapGenderStats
    absent: RecapGenderStats
    passing: RecapGenderStats
    failing: RecapGenderStats
    passRatePct: number | null
    classAverage: number | null
    highestAverage: number | null
    highestStudentName: string | null
    lowestAverage: number | null
    lowestStudentName: string | null
    appreciationBreakdown: Array<{
      bucket: ComputedStudentRow['appreciationBucket']
      label: string
      rangeLabel: string
      boys: number
      girls: number
      total: number
      pct: number
    }>
    subjectStats: SubjectStatsRow[]
  }
  legendText: string
}

export const PRIMARY_MONTH_NAMES: Record<number, string> = {
  1: 'Octobre (Mois 1)',
  2: 'Novembre (Mois 2)',
  3: 'Décembre (Mois 3)',
  4: 'Janvier (Mois 4)',
  5: 'Février (Mois 5)',
  6: 'Mars (Mois 6)',
  7: 'Avril (Mois 7)',
  8: 'Mai (Mois 8)',
  9: 'Juin (Mois 9)',
}

export const PRIMARY_MONTH_TITLES: Record<number, string> = {
  1: 'OCTOBRE',
  2: 'NOVEMBRE',
  3: 'DÉCEMBRE',
  4: 'JANVIER',
  5: 'FÉVRIER',
  6: 'MARS',
  7: 'AVRIL',
  8: 'MAI',
  9: 'JUIN',
}

export type PrimaryPeriodKey =
  | 'month_1'
  | 'month_2'
  | 'month_3'
  | 'month_4'
  | 'month_5'
  | 'month_6'
  | 'month_7'
  | 'month_8'
  | 'month_9'
  | 'trim_1'
  | 'trim_2'
  | 'trim_3'
  | 'annual'

export function normalizeGender(raw?: string | null): 'M' | 'F' | '' {
  const g = (raw || '').trim().toUpperCase()
  if (g.startsWith('F')) return 'F'
  if (g.startsWith('M') || g.startsWith('G')) return 'M'
  return ''
}

export function getAppreciation(
  average: number | null,
  scale: AverageScale = 20
): {
  label: string
  bucket: ComputedStudentRow['appreciationBucket']
} {
  if (average === null || isNaN(average)) {
    return { label: 'Absent(e)', bucket: 'absent' }
  }
  const on20 = scale === 10 ? average * 2 : average
  if (on20 >= 18) return { label: 'Très bon travail', bucket: 'tres_bon' }
  if (on20 >= 16) return { label: 'Bon travail', bucket: 'bon' }
  if (on20 >= 12) return { label: 'Assez bon travail', bucket: 'assez_bon' }
  if (on20 >= 10) return { label: 'Passable', bucket: 'passable' }
  if (on20 >= 6) return { label: 'Travail médiocre', bucket: 'mediocre' }
  return { label: 'Travail très insuffisant', bucket: 'tres_insuffisant' }
}

export function getLegendText(scale: AverageScale = 20): string {
  if (scale === 10) {
    return 'Appréciations : ≥ 9 Très bon travail | 8 à 8,99 Bon travail | 6 à 7,99 Assez bon travail | 5 à 5,99 Passable | 3 à 4,99 Travail médiocre | < 3 Travail très insuffisant. Moyenne < 5 en rouge.'
  }
  return 'Appréciations : ≥ 18 Très bon travail | 16 à 17,99 Bon travail | 12 à 15,99 Assez bon travail | 10 à 11,99 Passable | 6 à 9,99 Travail médiocre | < 6 Travail très insuffisant. Moyenne < 10 en rouge.'
}

export function getDefaultReportTitle(params: {
  isPrimary: boolean
  primaryPeriod?: PrimaryPeriodKey
  secondaryTerm?: string
  year?: number
}): string {
  const yr = params.year || new Date().getFullYear()
  if (params.isPrimary) {
    const p = params.primaryPeriod || 'month_1'
    if (p.startsWith('month_')) {
      const m = parseInt(p.replace('month_', ''), 10)
      return `COMPOSITION MENSUELLE – ${PRIMARY_MONTH_TITLES[m] || `MOIS ${m}`} ${yr}`
    }
    if (p === 'trim_1') return `COMPOSITION DU 1ER TRIMESTRE ${yr}`
    if (p === 'trim_2') return `COMPOSITION DU 2E TRIMESTRE ${yr}`
    if (p === 'trim_3') return `COMPOSITION DU 3E TRIMESTRE ${yr}`
    return `BILAN ANNUEL DE LA CLASSE ${yr}`
  }

  const termLabels: Record<string, string> = {
    '1er_trimestre': `RÉSULTATS DU 1ER TRIMESTRE ${yr}`,
    '2e_trimestre': `RÉSULTATS DU 2E TRIMESTRE ${yr}`,
    '3e_trimestre': `RÉSULTATS DU 3E TRIMESTRE ${yr}`,
    '1er_semestre': `RÉSULTATS DU 1ER SEMESTRE ${yr}`,
    '2e_semestre': `RÉSULTATS DU 2E SEMESTRE ${yr}`,
  }
  return termLabels[params.secondaryTerm || '1er_trimestre'] || `RÉSULTATS SCOLAIRES ${yr}`
}

export function getPeriodLabel(
  isPrimary: boolean,
  primaryPeriod: PrimaryPeriodKey = 'month_1',
  secondaryTerm: string = '1er_trimestre'
): string {
  if (isPrimary) {
    if (primaryPeriod.startsWith('month_')) {
      const m = parseInt(primaryPeriod.replace('month_', ''), 10)
      return PRIMARY_MONTH_NAMES[m] || `Mois ${m}`
    }
    if (primaryPeriod === 'trim_1') return '1er Trimestre (M1 – M3)'
    if (primaryPeriod === 'trim_2') return '2e Trimestre (M4 – M6)'
    if (primaryPeriod === 'trim_3') return '3e Trimestre (M7 – M9)'
    return 'Année complète (M1 – M9)'
  }

  const map: Record<string, string> = {
    '1er_trimestre': '1er Trimestre',
    '2e_trimestre': '2e Trimestre',
    '3e_trimestre': '3e Trimestre',
    '1er_semestre': '1er Semestre',
    '2e_semestre': '2e Semestre',
  }
  return map[secondaryTerm] || secondaryTerm
}

function getPrimaryMonthsForPeriod(period: PrimaryPeriodKey): number[] {
  if (period.startsWith('month_')) {
    return [parseInt(period.replace('month_', ''), 10)]
  }
  if (period === 'trim_1') return [1, 2, 3]
  if (period === 'trim_2') return [4, 5, 6]
  if (period === 'trim_3') return [7, 8, 9]
  return [1, 2, 3, 4, 5, 6, 7, 8, 9]
}

function formatDivisorNumber(val: number): string {
  const rounded = Math.round(val * 100) / 100
  return rounded.toString().replace('.', ',')
}

/**
 * Calcule l'ensemble du bulletin récapitulatif de classe (notes, totaux, moyennes, rangs officiels,
 * appréciations, statistiques par sexe et par discipline), prêt pour l'aperçu UI et l'export Excel.
 */
export function buildClassResultsReport(params: {
  classItem: ExportClassItem
  students: ExportStudentItem[]
  subjects: ExportSubjectItem[]
  primaryGrades: ExportPrimaryGrade[]
  secondaryGrades: ExportSecondaryGrade[]
  cycle: ExportCycle
  primaryPeriod?: PrimaryPeriodKey
  secondaryTerm?: string
  scale?: AverageScale
  customDivisor?: number | null
  sortMode?: SortMode
  filterMode?: FilterMode
  customTitle?: string
  schoolName?: string
  academicYear?: string
}): ClassResultsReport {
  const {
    classItem,
    students,
    subjects,
    primaryGrades,
    secondaryGrades,
    cycle,
    primaryPeriod = 'month_1',
    secondaryTerm = '1er_trimestre',
    sortMode = 'alphabetical',
    filterMode = 'all',
    schoolName = 'Établissement Scolaire',
    academicYear = '2026-2027',
  } = params

  const isPrimary = cycle === 'primaire' || cycle === 'maternelle'
  const scale: AverageScale = isPrimary ? (params.scale || 20) : 20
  const passThreshold = scale === 10 ? 5 : 10

  const classStudents = students
    .filter(s => s.class_id === classItem.id)
    .sort((a, b) => {
      const cmpLast = (a.last_name || '').localeCompare(b.last_name || '', 'fr')
      if (cmpLast !== 0) return cmpLast
      return (a.first_name || '').localeCompare(b.first_name || '', 'fr')
    })

  // 1. Préparer les colonnes de disciplines
  const columns: ExportColumnDef[] = []
  const monthsToInclude = getPrimaryMonthsForPeriod(primaryPeriod)
  const studentIdSet = new Set(classStudents.map(s => s.id))

  if (isPrimary) {
    const primList = subjects.filter(
      s => !s.cycle || s.cycle.toLowerCase() === 'primaire' || s.cycle.toLowerCase() === 'maternelle'
    )
    const seen = new Set<string>()
    const deduped: ExportSubjectItem[] = []
    for (const sub of primList) {
      const norm = (sub.name || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
      if (!seen.has(norm)) {
        seen.add(norm)
        deduped.push(sub)
      }
    }
    deduped.sort((a, b) => {
      const oa = getPrimarySubjectOrder(a.name)
      const ob = getPrimarySubjectOrder(b.name)
      if (oa !== ob) return oa - ob
      return a.name.localeCompare(b.name, 'fr')
    })

    for (const sub of deduped) {
      const maxScore = getPrimarySubjectMaxScore(sub.name, classItem.name, classItem.level || undefined)
      const hasAnyGrade = primaryGrades.some(
        g =>
          studentIdSet.has(g.student_id) &&
          g.subject_id === sub.id &&
          monthsToInclude.includes(g.month_number) &&
          g.score !== null &&
          g.score !== undefined &&
          !isNaN(Number(g.score))
      )
      columns.push({
        id: sub.id,
        name: sub.name,
        shortName: sub.name,
        maxScore,
        coefficient: 1,
        hasAnyGrade,
      })
    }
  } else {
    const secList = subjects
      .filter(s => s.cycle === 'secondaire')
      .sort((a, b) => a.name.localeCompare(b.name, 'fr'))

    for (const sub of secList) {
      const coef = getCoefficientForSubject(
        sub.name,
        classItem.name,
        classItem.level || undefined,
        sub.coefficient || 2
      )
      const hasAnyGrade = secondaryGrades.some(
        g =>
          studentIdSet.has(g.student_id) &&
          g.subject_id === sub.id &&
          g.term === secondaryTerm &&
          ((g.class_score !== null && g.class_score !== undefined) ||
            (g.comp_score !== null && g.comp_score !== undefined))
      )
      columns.push({
        id: sub.id,
        name: sub.name,
        shortName: `${sub.name} (c.${coef})`,
        maxScore: 20,
        coefficient: coef,
        hasAnyGrade,
      })
    }
  }

  // 2. Calculer le barème / diviseur de la classe
  const activeColumns = columns.filter(c => c.hasAnyGrade)
  const columnsForDenominator = activeColumns.length > 0 ? activeColumns : columns

  let barèmeTotal = 0
  let divisor = 1
  if (isPrimary) {
    barèmeTotal = columnsForDenominator.reduce((acc, c) => acc + c.maxScore, 0)
    const autoDivisor = barèmeTotal > 0 ? barèmeTotal / scale : 1
    divisor =
      params.customDivisor && params.customDivisor > 0 ? params.customDivisor : autoDivisor
  } else {
    barèmeTotal = columnsForDenominator.reduce((acc, c) => acc + c.coefficient, 0)
    divisor = barèmeTotal > 0 ? barèmeTotal : 1
  }

  // 3. Construire les notes, totaux et moyennes brutes par élève
  const rawRows: ComputedStudentRow[] = classStudents.map(stu => {
    const scores: Record<string, number | null> = {}
    let totalPoints = 0
    let gradedCount = 0
    let studentCoefSum = 0

    if (isPrimary) {
      for (const col of columns) {
        const stuMonthScores = primaryGrades
          .filter(
            g =>
              g.student_id === stu.id &&
              g.subject_id === col.id &&
              monthsToInclude.includes(g.month_number) &&
              g.score !== null &&
              g.score !== undefined &&
              !isNaN(Number(g.score))
          )
          .map(g => Number(g.score))

        if (stuMonthScores.length > 0) {
          const val =
            monthsToInclude.length === 1
              ? stuMonthScores[0]
              : Number(
                  (
                    stuMonthScores.reduce((a, b) => a + b, 0) / stuMonthScores.length
                  ).toFixed(2)
                )
          scores[col.id] = val
          totalPoints += val
          gradedCount++
        } else {
          scores[col.id] = null
        }
      }
    } else {
      for (const col of columns) {
        const g = secondaryGrades.find(
          item =>
            item.student_id === stu.id &&
            item.subject_id === col.id &&
            item.term === secondaryTerm
        )
        let moy: number | null = null
        if (g) {
          const cVal =
            g.class_score !== null && g.class_score !== undefined
              ? Number(g.class_score)
              : NaN
          const compVal =
            g.comp_score !== null && g.comp_score !== undefined
              ? Number(g.comp_score)
              : NaN
          if (!isNaN(cVal) && !isNaN(compVal)) moy = (cVal + compVal) / 2
          else if (!isNaN(cVal)) moy = cVal
          else if (!isNaN(compVal)) moy = compVal
        }
        if (moy !== null) {
          const roundedMoy = Number(moy.toFixed(2))
          scores[col.id] = roundedMoy
          totalPoints += roundedMoy * col.coefficient
          studentCoefSum += col.coefficient
          gradedCount++
        } else {
          scores[col.id] = null
        }
      }
    }

    const isAbsent = gradedCount === 0
    const finalTotal = isAbsent ? null : Number(totalPoints.toFixed(2))

    let average: number | null = null
    if (!isAbsent && finalTotal !== null) {
      if (isPrimary) {
        average = divisor > 0 ? Number((finalTotal / divisor).toFixed(2)) : null
      } else {
        const effectiveDiv =
          params.customDivisor && params.customDivisor > 0
            ? params.customDivisor
            : studentCoefSum > 0
              ? studentCoefSum
              : divisor
        average = effectiveDiv > 0 ? Number((finalTotal / effectiveDiv).toFixed(2)) : null
      }
    }

    const appr = getAppreciation(average, scale)

    return {
      studentId: stu.id,
      lastName: stu.last_name || '',
      firstName: stu.first_name || '',
      fullName: `${(stu.last_name || '').toUpperCase()} ${stu.first_name || ''}`.trim(),
      matricule: stu.matricule || '',
      gender: normalizeGender(stu.gender),
      scores,
      gradedCount,
      totalPoints: finalTotal,
      average,
      rankNum: null,
      rankText: '-',
      isExAequo: false,
      isPassing: average !== null && average >= passThreshold,
      isAbsent,
      appreciation: appr.label,
      appreciationBucket: appr.bucket,
    }
  })

  // 4. Calcul officiel des rangs (sur les présents uniquement, triés par moyenne puis total décroissant)
  const presentRows = rawRows
    .filter(r => !r.isAbsent && r.average !== null)
    .sort((a, b) => {
      if ((b.average ?? 0) !== (a.average ?? 0)) {
        return (b.average ?? 0) - (a.average ?? 0)
      }
      return (b.totalPoints ?? 0) - (a.totalPoints ?? 0)
    })

  const rankById = new Map<string, { rankNum: number; rankText: string; isExAequo: boolean }>()
  let currentRank = 1
  for (let i = 0; i < presentRows.length; i++) {
    const cur = presentRows[i]
    const prev = i > 0 ? presentRows[i - 1] : null
    const next = i < presentRows.length - 1 ? presentRows[i + 1] : null

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
    rankById.set(cur.studentId, {
      rankNum: currentRank,
      rankText: formatRank(currentRank, isExAequo),
      isExAequo,
    })
  }

  const allRows: ComputedStudentRow[] = rawRows.map(r => {
    const rank = rankById.get(r.studentId)
    if (!rank) return r
    return {
      ...r,
      rankNum: rank.rankNum,
      rankText: rank.rankText,
      isExAequo: rank.isExAequo,
    }
  })

  // 5. Ordre de mérite des élèves ayant la moyenne
  const meritPassingRows = allRows
    .filter(r => !r.isAbsent && r.isPassing)
    .sort((a, b) => {
      if ((b.average ?? 0) !== (a.average ?? 0)) {
        return (b.average ?? 0) - (a.average ?? 0)
      }
      return (b.totalPoints ?? 0) - (a.totalPoints ?? 0)
    })

  // 6. Appliquer filtre + tri pour l'affichage / export feuille principale
  let displayRows =
    filterMode === 'passing_only'
      ? allRows.filter(r => !r.isAbsent && r.isPassing)
      : [...allRows]

  if (sortMode === 'merit') {
    displayRows = [...displayRows].sort((a, b) => {
      if (a.isAbsent && !b.isAbsent) return 1
      if (!a.isAbsent && b.isAbsent) return -1
      if (a.isAbsent && b.isAbsent) return a.fullName.localeCompare(b.fullName, 'fr')
      if ((b.average ?? 0) !== (a.average ?? 0)) {
        return (b.average ?? 0) - (a.average ?? 0)
      }
      if ((b.totalPoints ?? 0) !== (a.totalPoints ?? 0)) {
        return (b.totalPoints ?? 0) - (a.totalPoints ?? 0)
      }
      return a.fullName.localeCompare(b.fullName, 'fr')
    })
  } else {
    displayRows = [...displayRows].sort((a, b) => a.fullName.localeCompare(b.fullName, 'fr'))
  }

  // 7. Calcul des statistiques de récapitulation
  const countGender = (rows: ComputedStudentRow[]): RecapGenderStats => {
    let boys = 0
    let girls = 0
    let other = 0
    for (const r of rows) {
      if (r.gender === 'M') boys++
      else if (r.gender === 'F') girls++
      else other++
    }
    return { boys, girls, other, total: rows.length }
  }

  const enrolledRows = allRows
  const presentAllRows = allRows.filter(r => !r.isAbsent)
  const absentAllRows = allRows.filter(r => r.isAbsent)
  const passingAllRows = presentAllRows.filter(r => r.isPassing)
  const failingAllRows = presentAllRows.filter(r => !r.isPassing)

  const classAverage =
    presentAllRows.length > 0
      ? Number(
          (
            presentAllRows.reduce((sum, r) => sum + (r.average ?? 0), 0) /
            presentAllRows.length
          ).toFixed(2)
        )
      : null

  const passRatePct =
    presentAllRows.length > 0
      ? Number(((passingAllRows.length / presentAllRows.length) * 100).toFixed(1))
      : null

  const highestRow = presentRows[0] || null
  const lowestRow = presentRows.length > 0 ? presentRows[presentRows.length - 1] : null

  const bucketDefs: Array<{
    bucket: ComputedStudentRow['appreciationBucket']
    label: string
    rangeLabel: string
  }> = [
    {
      bucket: 'tres_bon',
      label: 'Très bon travail',
      rangeLabel: scale === 10 ? '≥ 9,00' : '≥ 18,00',
    },
    {
      bucket: 'bon',
      label: 'Bon travail',
      rangeLabel: scale === 10 ? '8,00 à 8,99' : '16,00 à 17,99',
    },
    {
      bucket: 'assez_bon',
      label: 'Assez bon travail',
      rangeLabel: scale === 10 ? '6,00 à 7,99' : '12,00 à 15,99',
    },
    {
      bucket: 'passable',
      label: 'Passable',
      rangeLabel: scale === 10 ? '5,00 à 5,99' : '10,00 à 11,99',
    },
    {
      bucket: 'mediocre',
      label: 'Travail médiocre',
      rangeLabel: scale === 10 ? '3,00 à 4,99' : '6,00 à 9,99',
    },
    {
      bucket: 'tres_insuffisant',
      label: 'Travail très insuffisant',
      rangeLabel: scale === 10 ? '< 3,00' : '< 6,00',
    },
    {
      bucket: 'absent',
      label: 'Absent(e)',
      rangeLabel: 'Non noté',
    },
  ]

  const appreciationBreakdown = bucketDefs.map(def => {
    const matched = allRows.filter(r => r.appreciationBucket === def.bucket)
    const gCounts = countGender(matched)
    return {
      bucket: def.bucket,
      label: def.label,
      rangeLabel: def.rangeLabel,
      boys: gCounts.boys,
      girls: gCounts.girls,
      total: gCounts.total,
      pct:
        allRows.length > 0
          ? Number(((gCounts.total / allRows.length) * 100).toFixed(1))
          : 0,
    }
  })

  const subjectStats: SubjectStatsRow[] = columns.map(col => {
    const vals: number[] = []
    for (const r of allRows) {
      const v = r.scores[col.id]
      if (v !== null && v !== undefined && !isNaN(v)) {
        vals.push(v)
      }
    }
    const halfMax = col.maxScore / 2
    const passingCount = vals.filter(v => v >= halfMax).length
    return {
      columnId: col.id,
      name: col.name,
      maxScore: col.maxScore,
      coefficient: col.coefficient,
      gradedCount: vals.length,
      minScore: vals.length > 0 ? Math.min(...vals) : null,
      maxFoundScore: vals.length > 0 ? Math.max(...vals) : null,
      average:
        vals.length > 0
          ? Number((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2))
          : null,
      passingCount,
      passRatePct:
        vals.length > 0 ? Number(((passingCount / vals.length) * 100).toFixed(1)) : null,
    }
  })

  const formulaLabel = isPrimary
    ? `Moyenne = Total ÷ ${formatDivisorNumber(divisor)}`
    : `Moyenne = Σ(Moy × Coef) ÷ ${formatDivisorNumber(divisor)}`

  const title =
    params.customTitle?.trim() ||
    getDefaultReportTitle({
      isPrimary,
      primaryPeriod,
      secondaryTerm,
    })

  return {
    title,
    periodLabel: getPeriodLabel(isPrimary, primaryPeriod, secondaryTerm),
    className: classItem.name,
    schoolName,
    academicYear,
    cycle,
    isPrimary,
    scale,
    passThreshold,
    sortMode,
    filterMode,
    formulaLabel,
    divisor,
    barèmeTotal,
    columns,
    allRows,
    displayRows,
    meritPassingRows,
    stats: {
      enrolled: countGender(enrolledRows),
      present: countGender(presentAllRows),
      absent: countGender(absentAllRows),
      passing: countGender(passingAllRows),
      failing: countGender(failingAllRows),
      passRatePct,
      classAverage,
      highestAverage: highestRow?.average ?? null,
      highestStudentName: highestRow?.fullName ?? null,
      lowestAverage: lowestRow?.average ?? null,
      lowestStudentName: lowestRow?.fullName ?? null,
      appreciationBreakdown,
      subjectStats,
    },
    legendText: getLegendText(scale),
  }
}
