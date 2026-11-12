import { describe, it, expect } from 'vitest'
import {
  buildClassResultsReport,
  getAppreciation,
  ExportClassItem,
  ExportStudentItem,
  ExportSubjectItem,
  ExportPrimaryGrade,
  ExportSecondaryGrade,
} from '@/lib/grades-export'
import { buildClassResultsWorkbook } from '@/lib/excel-grades-export'

describe('grades-export calculations & merit ranking', () => {
  const cm2Class: ExportClassItem = { id: 'c1', name: 'CM2', level: 'CM2' }

  const primarySubjects: ExportSubjectItem[] = [
    { id: 's1', name: 'Je sais écrire les mots (dictée)', cycle: 'primaire' }, // max 20 (dictée)
    { id: 's2', name: 'Je produis un texte (Rédaction)', cycle: 'primaire' }, // max 10
    { id: 's3', name: 'Étude de texte', cycle: 'primaire' }, // max 20
    { id: 's4', name: 'Calcul mental', cycle: 'primaire' }, // max 10
    { id: 's5', name: 'Calcul Écrit', cycle: 'primaire' }, // max 20
    { id: 's6', name: 'Problème', cycle: 'primaire' }, // max 20
    { id: 's7', name: 'Sciences Humaines', cycle: 'primaire' }, // max 10
    { id: 's8', name: 'Sciences et Technologie', cycle: 'primaire' }, // max 10
    { id: 's9', name: 'Éducation Sociale', cycle: 'primaire' }, // max 10
    { id: 's10', name: 'Éducation Artistique', cycle: 'primaire' }, // max 10
    // Total max des 10 matières = 20+10+20+10+20+20+10+10+10+10 = 140 => 140 / 20 = diviseur 7 !
  ]

  const students: ExportStudentItem[] = [
    { id: 'st1', last_name: 'ABOGNON', first_name: 'Sandra', class_id: 'c1', gender: 'F' },
    { id: 'st2', last_name: 'HUNLEDE', first_name: 'Rachelle', class_id: 'c1', gender: 'F' },
    { id: 'st3', last_name: 'TCHOKOU', first_name: 'Frederic', class_id: 'c1', gender: 'M' },
    { id: 'st4', last_name: 'ALOGNON', first_name: 'Gloria', class_id: 'c1', gender: 'F' }, // Absente
    { id: 'st5', last_name: 'ALOMASSO', first_name: 'Akossiwa', class_id: 'c1', gender: 'F' }, // 70 => 10.00 Passable
  ]

  const gradesForStudent = (studentId: string, scores: number[]): ExportPrimaryGrade[] =>
    scores.map((score, i) => ({
      student_id: studentId,
      subject_id: primarySubjects[i].id,
      month_number: 1,
      score,
    }))

  const primaryGrades: ExportPrimaryGrade[] = [
    // st1: sum = 47 => 47 / 7 = 6.71 (Travail médiocre, 4e)
    ...gradesForStudent('st1', [1, 3, 4, 0, 5, 12, 8, 5, 3, 6]),
    // st2: sum = 117 => 117 / 7 = 16.71 (Bon travail, 1er ex)
    ...gradesForStudent('st2', [10, 8, 16, 7, 20, 20, 10, 10, 10, 6]),
    // st3: sum = 117 => 117 / 7 = 16.71 (Bon travail, 1er ex)
    ...gradesForStudent('st3', [12.5, 8, 16, 10, 20, 16, 9, 9, 10, 6.5]),
    // st5: sum = 70 => 70 / 7 = 10.00 (Passable, 3e)
    ...gradesForStudent('st5', [3, 6, 6, 5, 17, 12, 6, 6, 6, 3]),
  ]

  it('computes divisor 7, averages /20, official competition ranks with ex-aequo, and appreciations', () => {
    const report = buildClassResultsReport({
      classItem: cm2Class,
      students,
      subjects: primarySubjects,
      primaryGrades,
      secondaryGrades: [],
      cycle: 'primaire',
      primaryPeriod: 'month_1',
      scale: 20,
      sortMode: 'alphabetical',
      filterMode: 'all',
    })

    expect(report.barèmeTotal).toBe(140)
    expect(report.divisor).toBe(7)
    expect(report.formulaLabel).toBe('Moyenne = Total ÷ 7')

    const byId = Object.fromEntries(report.allRows.map(r => [r.studentId, r]))
    expect(byId['st1'].totalPoints).toBe(47)
    expect(byId['st1'].average).toBe(6.71)
    expect(byId['st1'].rankNum).toBe(4)
    expect(byId['st1'].appreciation).toBe('Travail médiocre')
    expect(byId['st1'].isPassing).toBe(false)

    expect(byId['st2'].average).toBe(16.71)
    expect(byId['st2'].rankNum).toBe(1)
    expect(byId['st2'].rankText).toBe('1er ex')
    expect(byId['st2'].appreciation).toBe('Bon travail')

    expect(byId['st3'].average).toBe(16.71)
    expect(byId['st3'].rankNum).toBe(1)
    expect(byId['st3'].rankText).toBe('1er ex')

    expect(byId['st5'].totalPoints).toBe(70)
    expect(byId['st5'].average).toBe(10)
    expect(byId['st5'].rankNum).toBe(3) // 1, 1, 3!
    expect(byId['st5'].appreciation).toBe('Passable')
    expect(byId['st5'].isPassing).toBe(true)

    expect(byId['st4'].isAbsent).toBe(true)
    expect(byId['st4'].average).toBeNull()
    expect(byId['st4'].appreciation).toBe('Absent(e)')

    // Alphabetical display check
    expect(report.displayRows.map(r => r.lastName)).toEqual([
      'ABOGNON',
      'ALOGNON',
      'ALOMASSO',
      'HUNLEDE',
      'TCHOKOU',
    ])
  })

  it('filters passing students only and sorts strictly by merit descending', () => {
    const report = buildClassResultsReport({
      classItem: cm2Class,
      students,
      subjects: primarySubjects,
      primaryGrades,
      secondaryGrades: [],
      cycle: 'primaire',
      primaryPeriod: 'month_1',
      scale: 20,
      sortMode: 'merit',
      filterMode: 'passing_only',
    })

    // Only st2 (16.71), st3 (16.71), st5 (10.00) passed (>= 10)
    expect(report.displayRows.map(r => r.studentId)).toEqual(['st2', 'st3', 'st5'])
    expect(report.displayRows[0].average).toBe(16.71)
    expect(report.displayRows[2].average).toBe(10)
    expect(report.stats.enrolled.total).toBe(5)
    expect(report.stats.present.total).toBe(4)
    expect(report.stats.absent.total).toBe(1)
    expect(report.stats.passing.total).toBe(3)
    expect(report.stats.failing.total).toBe(1)
    expect(report.stats.passRatePct).toBe(75)
  })

  it('classifies all 6 appreciation thresholds accurately on /20 and /10', () => {
    expect(getAppreciation(18.5, 20).label).toBe('Très bon travail ; félicitations')
    expect(getAppreciation(16.0, 20).label).toBe('Bon travail')
    expect(getAppreciation(13.25, 20).label).toBe('Assez bon travail')
    expect(getAppreciation(10.0, 20).label).toBe('Passable')
    expect(getAppreciation(7.5, 20).label).toBe('Travail médiocre')
    expect(getAppreciation(5.99, 20).label).toBe('Travail très insuffisant')
    expect(getAppreciation(null, 20).label).toBe('Absent(e)')

    expect(getAppreciation(9.2, 10).label).toBe('Très bon travail ; félicitations')
    expect(getAppreciation(5.0, 10).label).toBe('Passable')
    expect(getAppreciation(4.5, 10).label).toBe('Travail médiocre')
  })

  it('computes weighted averages and ranks for secondary (Collège / Lycée)', () => {
    const cls3e: ExportClassItem = { id: 'c2', name: '3ème A', level: 'Collège' }
    const secSubjects: ExportSubjectItem[] = [
      { id: 'sec1', name: 'Français', cycle: 'secondaire', coefficient: 2 },
      { id: 'sec2', name: 'Mathématiques', cycle: 'secondaire', coefficient: 2 },
    ]
    const secStudents: ExportStudentItem[] = [
      { id: 'a1', last_name: 'KOFFI', first_name: 'Jean', class_id: 'c2', gender: 'M' },
      { id: 'a2', last_name: 'AMAH', first_name: 'Afi', class_id: 'c2', gender: 'F' },
    ]
    const secGrades: ExportSecondaryGrade[] = [
      { student_id: 'a1', subject_id: 'sec1', term: '1er_trimestre', class_score: 12, comp_score: 14 }, // avg 13
      { student_id: 'a1', subject_id: 'sec2', term: '1er_trimestre', class_score: 15, comp_score: 17 }, // avg 16
      { student_id: 'a2', subject_id: 'sec1', term: '1er_trimestre', class_score: 8, comp_score: 10 }, // avg 9
      { student_id: 'a2', subject_id: 'sec2', term: '1er_trimestre', class_score: 6, comp_score: 8 }, // avg 7
    ]

    const report = buildClassResultsReport({
      classItem: cls3e,
      students: secStudents,
      subjects: secSubjects,
      primaryGrades: [],
      secondaryGrades: secGrades,
      cycle: 'college',
      secondaryTerm: '1er_trimestre',
      sortMode: 'merit',
    })

    expect(report.displayRows.map(r => r.studentId)).toEqual(['a1', 'a2'])
    expect(report.displayRows[0].average).toBe(14.5) // (13*2 + 16*2)/4 = 14.5
    expect(report.displayRows[0].rankText).toBe('1er')
    expect(report.displayRows[1].average).toBe(8)
    expect(report.displayRows[1].isPassing).toBe(false)
  })

  it('generates a styled 3-sheet ExcelJS workbook with formulas, vertical headers, red fails, and valid xlsx buffer', async () => {
    const report = buildClassResultsReport({
      classItem: cm2Class,
      students,
      subjects: primarySubjects,
      primaryGrades,
      secondaryGrades: [],
      cycle: 'primaire',
      primaryPeriod: 'month_1',
      scale: 20,
      sortMode: 'alphabetical',
      filterMode: 'all',
      schoolName: 'EPL LE ROI',
      academicYear: '2026-2027',
    })

    const wb = await buildClassResultsWorkbook(report)
    expect(wb.worksheets.map(w => w.name)).toEqual([
      'Résultats',
      'Récapitulation',
      'Ordre de mérite (Admis)',
    ])

    const wsRes = wb.getWorksheet('Résultats')!
    expect(wsRes.getCell('A1').value).toContain('COMPOSITION MENSUELLE')
    expect(wsRes.getRow(4).getCell(4).alignment?.textRotation).toBe(90)
    // Row 5 = ABOGNON Sandra (6.71 -> failing red!)
    expect(wsRes.getRow(5).getCell(2).value).toBe('ABOGNON Sandra')
    expect((wsRes.getRow(5).getCell(15).value as any)?.formula).toContain('/7')
    expect(wsRes.getRow(5).getCell(15).font?.color?.argb).toBe('FFDC2626')
    expect(wsRes.getRow(5).getCell(17).value).toBe('Travail médiocre')

    // Sheet 3 has only the 3 passing students sorted by merit descending
    const wsMerit = wb.getWorksheet('Ordre de mérite (Admis)')!
    expect(wsMerit.getRow(5).getCell(2).value).toBe('HUNLEDE Rachelle')
    expect(wsMerit.getRow(6).getCell(2).value).toBe('TCHOKOU Frederic')
    expect(wsMerit.getRow(7).getCell(2).value).toBe('ALOMASSO Akossiwa')

    const buf = await wb.xlsx.writeBuffer()
    expect(buf.byteLength).toBeGreaterThan(5000)
  }, 30000)
})
