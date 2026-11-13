import { describe, it, expect } from 'vitest'
import {
  computePrimaryMatrixCalculations,
  getMonthNumberFromTrimester,
  getTrimesterAndMonthFromMonthNumber,
  parseCellScoreInput,
  GridStudentInput,
  GridSubjectInput,
} from '@/lib/primary-class-grid'

describe('primary-class-grid helpers & live spreadsheet calculation', () => {
  it('maps Trimestre (1..3) and Mois du trimestre (1..3) cleanly to DB month_number (1..9) and back', () => {
    expect(getMonthNumberFromTrimester(1, 1)).toBe(1)
    expect(getMonthNumberFromTrimester(1, 3)).toBe(3)
    expect(getMonthNumberFromTrimester(2, 1)).toBe(4)
    expect(getMonthNumberFromTrimester(2, 2)).toBe(5)
    expect(getMonthNumberFromTrimester(3, 1)).toBe(7)
    expect(getMonthNumberFromTrimester(3, 3)).toBe(9)

    for (let m = 1; m <= 9; m++) {
      const { trimester, trimMonth } = getTrimesterAndMonthFromMonthNumber(m)
      expect(getMonthNumberFromTrimester(trimester, trimMonth)).toBe(m)
    }

    expect(getTrimesterAndMonthFromMonthNumber(0)).toEqual({ trimester: 1, trimMonth: 1 })
    expect(getTrimesterAndMonthFromMonthNumber(14)).toEqual({ trimester: 3, trimMonth: 3 })
  })

  it('parses French decimal commas, dots, blanks, and rejects invalid/negative entries', () => {
    expect(parseCellScoreInput('')).toBeNull()
    expect(parseCellScoreInput('   ')).toBeNull()
    expect(parseCellScoreInput('17,25')).toBe(17.25)
    expect(parseCellScoreInput(' 8.5 ')).toBe(8.5)
    expect(parseCellScoreInput('0')).toBe(0)
    expect(parseCellScoreInput('abc')).toBe('invalid')
    expect(parseCellScoreInput('-2')).toBe('invalid')
    expect(parseCellScoreInput('12,3,4')).toBe('invalid')
  })

  it('computes totals, /20 & /10 averages, official competition ex-aequo ranks, and appreciations accurately', () => {
    const subjects: GridSubjectInput[] = [
      { id: 'dictee', name: 'Je sais écrire les mots (dictée)' }, // max 20
      { id: 'redac', name: 'Je produis un texte (Rédaction)' }, // max 10
      { id: 'etude', name: 'Étude de texte' }, // max 20
      { id: 'mental', name: 'Calcul mental' }, // max 10
      { id: 'ecrit', name: 'Calcul Écrit' }, // max 20
      { id: 'prob', name: 'Problème' }, // max 20
      { id: 'sh', name: 'Sciences Humaines' }, // max 10
      { id: 'st', name: 'Sciences et Technologie' }, // max 10
      { id: 'es', name: 'Éducation Sociale' }, // max 10
      { id: 'ea', name: 'Éducation Artistique' }, // max 10
      // Total active barème = 140 => /20 divisor = 7, /10 divisor = 14
      { id: 'ungraded', name: "J'apprends à Lire" }, // not graded yet -> ignored in divisor
    ]

    const students: GridStudentInput[] = [
      { id: 'rachelle', last_name: 'HUNLEDE', first_name: 'Rachelle', gender: 'F' },
      { id: 'frederic', last_name: 'TCHOKOU', first_name: 'Frédéric', gender: 'M' },
      { id: 'daniel', last_name: 'DOGBLE', first_name: 'Daniel', gender: 'M' },
      { id: 'absent', last_name: 'ZOOTO', first_name: 'Eméfa', gender: 'F' },
    ]

    // Rachelle & Frédéric both sum to 117 pts (16.71 / 20 => 1er ex, Bon travail)
    // Daniel sums to 63 pts (9.00 / 20 => 3e, Travail insuffisant, failing < 10)
    const scores: Record<string, string> = {
      rachelle_dictee: '10',
      rachelle_redac: '8',
      rachelle_etude: '16',
      rachelle_mental: '7',
      rachelle_ecrit: '20',
      rachelle_prob: '20',
      rachelle_sh: '10',
      rachelle_st: '10',
      rachelle_es: '10',
      rachelle_ea: '6',

      frederic_dictee: '12,5',
      frederic_redac: '8',
      frederic_etude: '16',
      frederic_mental: '10',
      frederic_ecrit: '20',
      frederic_prob: '16',
      frederic_sh: '9',
      frederic_st: '9',
      frederic_es: '10',
      frederic_ea: '6,5',

      daniel_dictee: '6',
      daniel_redac: '4',
      daniel_etude: '8',
      daniel_mental: '5',
      daniel_ecrit: '10',
      daniel_prob: '10',
      daniel_sh: '5',
      daniel_st: '5',
      daniel_es: '5',
      daniel_ea: '5',
    }

    const summary20 = computePrimaryMatrixCalculations({
      students,
      subjects,
      className: 'CM2',
      classLevel: 'CM2',
      getRawValue: (stuId, subId) => scores[`${stuId}_${subId}`] ?? '',
      scale: 20,
    })

    expect(summary20.baremeTotal).toBe(140)
    expect(summary20.divisor).toBe(7)
    expect(summary20.formulaLabel).toBe('Moyenne = Total ÷ 7')
    expect(summary20.enrolledCount).toBe(4)
    expect(summary20.presentCount).toBe(3)
    expect(summary20.absentCount).toBe(1)
    expect(summary20.passingCount).toBe(2)
    expect(summary20.failingCount).toBe(1)
    expect(summary20.invalidCellCount).toBe(0)

    const rRachelle = summary20.rowByStudentId.rachelle
    const rFrederic = summary20.rowByStudentId.frederic
    const rDaniel = summary20.rowByStudentId.daniel
    const rAbsent = summary20.rowByStudentId.absent

    expect(rRachelle.totalPoints).toBe(117)
    expect(rRachelle.average).toBe(16.71)
    expect(rRachelle.rankNum).toBe(1)
    expect(rRachelle.rankText).toBe('1er ex')
    expect(rRachelle.isExAequo).toBe(true)
    expect(rRachelle.isPassing).toBe(true)
    expect(rRachelle.appreciation).toBe('Bon travail')

    expect(rFrederic.totalPoints).toBe(117)
    expect(rFrederic.average).toBe(16.71)
    expect(rFrederic.rankNum).toBe(1)
    expect(rFrederic.rankText).toBe('1er ex')

    expect(rDaniel.totalPoints).toBe(63)
    expect(rDaniel.average).toBe(9)
    expect(rDaniel.rankNum).toBe(3)
    expect(rDaniel.rankText).toBe('3e')
    expect(rDaniel.isPassing).toBe(false)
    expect(rDaniel.appreciation).toBe('Travail médiocre')

    expect(rAbsent.isAbsent).toBe(true)
    expect(rAbsent.totalPoints).toBeNull()
    expect(rAbsent.average).toBeNull()
    expect(rAbsent.rankText).toBe('—')
    expect(rAbsent.appreciation).toBe('Absent(e)')

    // Switching to /10 doubles divisor to 14 and halves average
    const summary10 = computePrimaryMatrixCalculations({
      students,
      subjects,
      className: 'CM2',
      classLevel: 'CM2',
      getRawValue: (stuId, subId) => scores[`${stuId}_${subId}`] ?? '',
      scale: 10,
    })

    expect(summary10.divisor).toBe(14)
    expect(summary10.rowByStudentId.rachelle.average).toBe(8.36)
    expect(summary10.rowByStudentId.daniel.average).toBe(4.5)
    expect(summary10.rowByStudentId.daniel.isPassing).toBe(false)
  })

  it('flags out-of-range scores and non-numeric strings, and supports customDivisor', () => {
    const subjects: GridSubjectInput[] = [
      { id: 'redac', name: 'Je produis un texte (Rédaction)' }, // max 10
      { id: 'ecrit', name: 'Calcul Écrit' }, // max 20
    ]
    const students: GridStudentInput[] = [
      { id: 's1', last_name: 'KODJO', first_name: 'Afi', gender: 'F' },
    ]
    const map: Record<string, string> = {
      s1_redac: '15', // exceeds /10 max!
      s1_ecrit: 'xyz', // invalid non-numeric!
    }

    const summary = computePrimaryMatrixCalculations({
      students,
      subjects,
      className: 'CM1',
      classLevel: 'CM1',
      getRawValue: (stuId, subId) => map[`${stuId}_${subId}`] ?? '',
      scale: 20,
      customDivisor: 5,
    })

    expect(summary.invalidCellCount).toBe(2)
    expect(summary.rowByStudentId.s1.invalidSubjects.redac).toBe(true)
    expect(summary.rowByStudentId.s1.invalidSubjects.ecrit).toBe(true)
    expect(summary.divisor).toBe(5)
    expect(summary.formulaLabel).toBe('Moyenne = Total ÷ 5')
  })
})
