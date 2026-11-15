import type { BulletinData } from '@/components/pdf/BulletinDocument'
import {
  getCoefficientForSubject,
  getPrimarySubjectMaxScore,
  getPrimarySubjectOrder,
  type SecondaryClassRankResult,
  type StudentRankResult,
} from '@/lib/academic-curriculum'
import { getDynamicAcademicYear } from '@/lib/academic-year'

export type BulletinClassItem = {
  id: string
  name: string
  level?: string
}

export type BulletinStudentItem = {
  id: string
  last_name: string
  first_name: string
  matricule: string
  class_id: string
}

export type BulletinSubjectItem = {
  id: string
  name: string
  cycle: string
  category: string | null
  coefficient: number
}

export type BulletinPrimaryGradeItem = {
  student_id: string
  subject_id: string
  month_number: number
  score: number
}

export type BulletinSecondaryGradeItem = {
  student_id: string
  subject_id: string
  term: string
  class_score: number | null
  comp_score: number | null
}

export type BulletinPrimaryRankRecord = {
  student_id: string
  month_number: number
  rank_text?: string | null
}

export type BulletinPrimaryInfoRecord = {
  student_id: string
  appreciation?: string | null
  director_decision?: string | null
}

export type SecondaryStatsInput = {
  min: string
  max: string
  annual: string
  t1: string
  t2: string
  annual_t3: string
}

export type BuiltBulletinData = Omit<BulletinData, 'student'> & {
  student: BulletinData['student'] & { id: string }
}

export type BuildStudentBulletinParams = {
  studentId: string
  selectedStudentId?: string
  selectedLevel: string
  selectedClassId?: string
  selectedTerm: string
  schoolName: string
  academicYear?: string
  students: BulletinStudentItem[]
  classes: BulletinClassItem[]
  subjects: BulletinSubjectItem[]
  primaryGrades: BulletinPrimaryGradeItem[]
  secondaryGrades: BulletinSecondaryGradeItem[]
  primaryRanks?: BulletinPrimaryRankRecord[]
  primaryInfo?: BulletinPrimaryInfoRecord[]
  computedPrimaryRanks: Record<number, Record<string, StudentRankResult>>
  computedSecondaryRanks: Pick<SecondaryClassRankResult, 'ranks' | 'minAvg' | 'maxAvg' | 'totalClassed'>
  localPrimGrades?: Record<string, string>
  localPrimRanks?: Record<number, string>
  localPrimInfo?: { appreciation: string; decision: string }
  localSecGrades?: Record<string, { cScore: string; compScore: string }>
  secAppr?: Record<string, string>
  secRank?: string
  secTotalStudents?: string
  secStats?: SecondaryStatsInput
  secFooterInfo?: { appreciation: string; decision: string }
}

function normalizeSubjectName(name: string): string {
  return (name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

/**
 * Déduplique les matières du primaire/maternelle, injecte « Étude de texte »
 * si absente du référentiel, puis trie dans l'ordre officiel du livret.
 */
export function preparePrimarySubjects(subjects: BulletinSubjectItem[]): BulletinSubjectItem[] {
  const list = subjects.filter((s) => !s.cycle || s.cycle === 'primaire' || s.cycle === 'maternelle')
  const seen = new Set<string>()
  const deduplicated: BulletinSubjectItem[] = []

  for (const sub of list) {
    const norm = normalizeSubjectName(sub.name)
    if (!seen.has(norm)) {
      seen.add(norm)
      deduplicated.push(sub)
    }
  }

  const hasEtude = deduplicated.some((s) => {
    const n = normalizeSubjectName(s.name)
    return n === 'etude de texte' || n.includes('etude de texte') || n.includes('etude texte')
  })

  if (!hasEtude) {
    deduplicated.push({
      id: 'virtual-etude-de-texte',
      name: 'Étude de texte',
      cycle: 'primaire',
      category: 'Français',
      coefficient: 1,
    })
  }

  return deduplicated.sort((a, b) => getPrimarySubjectOrder(a.name) - getPrimarySubjectOrder(b.name))
}

/**
 * Calcule la moyenne pondérée d'un élève pour un trimestre ou semestre donné
 * à partir des notes stockées (`secondaryGrades`).
 */
export function computeStudentSecondaryTermAverage(params: {
  studentId: string
  term: string
  secondaryGrades: BulletinSecondaryGradeItem[]
  subjects: BulletinSubjectItem[]
  className?: string
  classLevel?: string
}): string {
  const { studentId, term, secondaryGrades, subjects, className, classLevel } = params
  const termGrades = secondaryGrades.filter((g) => g.student_id === studentId && g.term === term)
  if (termGrades.length === 0) return ''

  let coefSum = 0
  let prodSum = 0

  for (const g of termGrades) {
    const sub = subjects.find((s) => s.id === g.subject_id)
    const cVal = g.class_score !== null ? Number(g.class_score) : NaN
    const compVal = g.comp_score !== null ? Number(g.comp_score) : NaN

    let moy: number | null = null
    if (!isNaN(cVal) && !isNaN(compVal)) moy = (cVal + compVal) / 2
    else if (!isNaN(cVal)) moy = cVal
    else if (!isNaN(compVal)) moy = compVal

    if (moy !== null) {
      const coef = getCoefficientForSubject(sub?.name || '', className, classLevel, sub?.coefficient || 2)
      coefSum += coef
      prodSum += moy * coef
    }
  }

  return coefSum > 0 ? (prodSum / coefSum).toFixed(2) : ''
}

function getSecondaryDefaultAppreciation(moy: number | null): string {
  if (moy === null) return ''
  if (moy >= 16) return 'Très Bien'
  if (moy >= 14) return 'Bien'
  if (moy >= 12) return 'Assez Bien'
  if (moy >= 10) return 'Passable'
  return 'Insuffisant'
}

/**
 * Construit le payload typé `BulletinData` pour un élève (impression PDF / publication Parent).
 * Garantit l'isolation stricte des moyennes et décisions par élève lors de la génération en lot.
 */
export function buildStudentBulletinData(params: BuildStudentBulletinParams): BuiltBulletinData | null {
  const {
    studentId,
    selectedStudentId,
    selectedLevel,
    selectedClassId,
    selectedTerm,
    schoolName,
    academicYear = getDynamicAcademicYear('-'),
    students,
    classes,
    subjects,
    primaryGrades,
    secondaryGrades,
    primaryRanks,
    primaryInfo,
    computedPrimaryRanks,
    computedSecondaryRanks,
    localPrimGrades = {},
    localPrimRanks = {},
    localPrimInfo = { appreciation: '', decision: '' },
    localSecGrades = {},
    secAppr = {},
    secRank = '',
    secTotalStudents = '',
    secStats = { min: '', max: '', annual: '', t1: '', t2: '', annual_t3: '' },
    secFooterInfo = { appreciation: '', decision: '' },
  } = params

  const stu = students.find((s) => s.id === studentId)
  const cl = classes.find((c) => c.id === (stu?.class_id || selectedClassId))
  if (!stu || !cl) return null

  const isSelected = studentId === selectedStudentId
  const isPrimary = selectedLevel === 'primaire' || selectedLevel === 'maternelle'

  const baseData: BuiltBulletinData = {
    level: (selectedLevel || 'secondaire') as BulletinData['level'],
    student: {
      id: stu.id,
      first_name: stu.first_name,
      last_name: stu.last_name,
      matricule: stu.matricule,
    },
    cls: { name: cl.name },
    schoolName,
    academicYear,
    termOrMonth: selectedTerm,
  }

  if (isPrimary) {
    const primarySubjects = preparePrimarySubjects(subjects)
    const months = Array.from({ length: 9 }, (_, i) => i + 1)
    const groupedSubjects: NonNullable<BulletinData['primaryCategories']> = {}

    const readPrimaryScore = (subjectId: string, month: number): string => {
      if (isSelected && localPrimGrades[`${subjectId}_${month}`] !== undefined) {
        return localPrimGrades[`${subjectId}_${month}`]
      }
      const grade = primaryGrades.find(
        (g) => g.student_id === studentId && g.subject_id === subjectId && g.month_number === month
      )
      return grade ? grade.score.toString() : ''
    }

    for (const s of primarySubjects) {
      const cat = s.category || 'Général'
      if (!groupedSubjects[cat]) groupedSubjects[cat] = []

      const monthScores: Record<string, string> = {}
      let total = 0
      let count = 0

      for (const m of months) {
        const valStr = readPrimaryScore(s.id, m)
        monthScores[m] = valStr
        const val = parseFloat(valStr)
        if (!isNaN(val)) {
          total += val
          count++
        }
      }

      const avg = count > 0 ? (total / count).toFixed(2) : ''
      const maxScore = getPrimarySubjectMaxScore(s.name, cl.name, cl.level)
      groupedSubjects[cat].push({
        id: s.id,
        name: s.name,
        monthScores,
        avg,
        maxScore,
      })
    }

    const monthTotals: Record<string, string> = {}
    const monthAvgs: Record<string, string> = {}
    const monthRanks: Record<string, string> = {}

    for (const m of months) {
      let mTotal = 0
      let maxPossible = 0

      for (const s of primarySubjects) {
        const val = parseFloat(readPrimaryScore(s.id, m))
        if (!isNaN(val)) {
          mTotal += val
          maxPossible += getPrimarySubjectMaxScore(s.name, cl.name, cl.level)
        }
      }

      monthTotals[m] = mTotal > 0 ? mTotal.toFixed(2) : ''
      monthAvgs[m] = maxPossible > 0 ? ((mTotal / maxPossible) * 10).toFixed(2) : ''

      const autoRank = computedPrimaryRanks[m]?.[studentId]?.rankText || ''
      if (isSelected && localPrimRanks[m] !== undefined && localPrimRanks[m].trim() !== '') {
        monthRanks[m] = localPrimRanks[m]
      } else {
        const r = primaryRanks?.find((item) => item.student_id === studentId && item.month_number === m)
        monthRanks[m] = r?.rank_text && r.rank_text.trim() !== '' ? r.rank_text : autoRank
      }
    }

    const info = primaryInfo?.find((i) => i.student_id === studentId)
    baseData.months = months
    baseData.primaryCategories = groupedSubjects
    baseData.monthTotals = monthTotals
    baseData.monthAvgs = monthAvgs
    baseData.monthRanks = monthRanks
    baseData.footerInfo = isSelected
      ? localPrimInfo
      : {
          appreciation: info?.appreciation || '',
          decision: info?.director_decision || '',
        }

    return baseData
  }

  // Secondaire (Collège / Lycée)
  const secondarySubjects = subjects.filter((s) => s.cycle === 'secondaire')
  let totalCoef = 0
  let totalProduct = 0

  const secondaryRows: NonNullable<BulletinData['secondaryRows']> = secondarySubjects.map((s) => {
    let cScore = ''
    let compScore = ''

    if (isSelected && localSecGrades[s.id]) {
      cScore = localSecGrades[s.id].cScore
      compScore = localSecGrades[s.id].compScore
    } else {
      const g = secondaryGrades.find(
        (item) => item.student_id === studentId && item.subject_id === s.id && item.term === selectedTerm
      )
      if (g) {
        cScore = g.class_score !== null ? g.class_score.toString() : ''
        compScore = g.comp_score !== null ? g.comp_score.toString() : ''
      }
    }

    const cVal = parseFloat(cScore)
    const compVal = parseFloat(compScore)
    let moy: number | null = null
    if (!isNaN(cVal) && !isNaN(compVal)) moy = (cVal + compVal) / 2
    else if (!isNaN(cVal)) moy = cVal
    else if (!isNaN(compVal)) moy = compVal

    const realCoef = getCoefficientForSubject(s.name, cl.name, cl.level, s.coefficient)
    let produit: number | null = null
    if (moy !== null) {
      produit = moy * realCoef
      totalCoef += realCoef
      totalProduct += produit
    }

    const defaultAppr = getSecondaryDefaultAppreciation(moy)
    return {
      id: s.id,
      name: s.name,
      cScore,
      compScore,
      moy,
      coefficient: realCoef,
      produit,
      appr: isSelected && secAppr[s.id] !== undefined ? secAppr[s.id] : defaultAppr,
    }
  })

  const termAvg = totalCoef > 0 ? (totalProduct / totalCoef).toFixed(2) : '0.00'
  const autoSecRank = computedSecondaryRanks.ranks[studentId]?.rankText || '-'
  const rank = isSelected && secRank && secRank !== '-' ? secRank : autoSecRank
  const totalStudents =
    isSelected && secTotalStudents && secTotalStudents !== '-'
      ? secTotalStudents
      : computedSecondaryRanks.totalClassed > 0
        ? computedSecondaryRanks.totalClassed.toString()
        : students.filter((s) => s.class_id === cl.id).length.toString()

  const firstPeriodKey = selectedLevel === 'lycee' || selectedTerm === '2e_semestre' ? '1er_semestre' : '1er_trimestre'
  const studentT1 = computeStudentSecondaryTermAverage({
    studentId,
    term: firstPeriodKey,
    secondaryGrades,
    subjects,
    className: cl.name,
    classLevel: cl.level,
  })
  const studentT2 = computeStudentSecondaryTermAverage({
    studentId,
    term: '2e_trimestre',
    secondaryGrades,
    subjects,
    className: cl.name,
    classLevel: cl.level,
  })

  const effectiveT1 = isSelected && secStats.t1 && secStats.t1 !== '-' ? secStats.t1 : studentT1
  const effectiveT2 = isSelected && secStats.t2 && secStats.t2 !== '-' ? secStats.t2 : studentT2

  let computedAnnual = isSelected ? secStats.annual_t3 || '' : ''
  if (!computedAnnual || computedAnnual === '-') {
    if (selectedTerm === '3eme_trimestre' || selectedTerm === '3e_trimestre') {
      const t1 = parseFloat(effectiveT1)
      const t2 = parseFloat(effectiveT2)
      const t3 = parseFloat(termAvg)
      if (!isNaN(t1) && !isNaN(t2) && !isNaN(t3)) {
        computedAnnual = ((t1 + t2 + t3) / 3).toFixed(2)
      }
    } else if (selectedTerm === '2e_semestre') {
      const s1 = parseFloat(effectiveT1)
      const s2 = parseFloat(termAvg)
      if (!isNaN(s1) && !isNaN(s2)) {
        computedAnnual = ((s1 + s2) / 2).toFixed(2)
      }
    }
  }

  let autoDecision = isSelected ? secFooterInfo.decision : ''
  if (!autoDecision && computedAnnual && computedAnnual !== '-') {
    const annNum = parseFloat(computedAnnual)
    if (!isNaN(annNum)) {
      autoDecision = annNum >= 10 ? 'Passe en classe supérieure (Admis)' : 'Redouble la classe'
    }
  }

  baseData.secondaryRows = secondaryRows
  baseData.totalCoef = totalCoef
  baseData.totalProduct = totalProduct
  baseData.termAvg = termAvg
  baseData.rank = rank
  baseData.totalStudents = totalStudents
  baseData.stats = isSelected
    ? {
        ...secStats,
        min: secStats.min && secStats.min !== '-' ? secStats.min : computedSecondaryRanks.minAvg,
        max: secStats.max && secStats.max !== '-' ? secStats.max : computedSecondaryRanks.maxAvg,
        annual: computedAnnual || secStats.annual_t3 || '-',
      }
    : {
        min: computedSecondaryRanks.minAvg,
        max: computedSecondaryRanks.maxAvg,
        annual: computedAnnual || '-',
        ...(effectiveT1 ? { t1: effectiveT1 } : {}),
        ...(effectiveT2 ? { t2: effectiveT2 } : {}),
      }

  baseData.footerInfo = isSelected
    ? {
        ...secFooterInfo,
        decision: autoDecision || secFooterInfo.decision,
      }
    : {
        appreciation: '',
        decision: autoDecision || '',
      }

  return baseData
}
