import { describe, it, expect } from 'vitest'
import * as XLSX from 'xlsx'
import {
  buildReportFromImportedData,
  matchStudentsToClass,
  parseExcelWorkbookGrades,
  suggestSubjectMappings,
} from '@/lib/grades-import'
import { buildClassResultsWorkbook } from '@/lib/excel-grades-export'
import { ExportClassItem, ExportStudentItem, ExportSubjectItem } from '@/lib/grades-export'

function toArrayBuffer(data: Uint8Array | Buffer): ArrayBuffer {
  const ab = new ArrayBuffer(data.byteLength)
  new Uint8Array(ab).set(data)
  return ab
}

function buildXlsxArrayBuffer(sheets: Record<string, any[][]>): ArrayBuffer {
  const wb = XLSX.utils.book_new()
  for (const [name, aoa] of Object.entries(sheets)) {
    const ws = XLSX.utils.aoa_to_sheet(aoa)
    XLSX.utils.book_append_sheet(wb, ws, name)
  }
  const out = XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer | Uint8Array
  return out instanceof ArrayBuffer ? out : toArrayBuffer(out)
}

describe('grades-import Excel parsing, auto-computation & merit export', () => {
  const cm2Class: ExportClassItem = { id: 'cm2', name: 'CM2', level: 'CM2' }

  it('parses multi-row official screenshot layout, recomputes totals/averages/ranks/appreciations and extracts passing merit list', () => {
    const aoa: any[][] = [
      // Row 1: Title banner
      ['COMPOSITION MENSUELLE – OCTOBRE 2026'],
      // Row 2: Metadata line with formula
      ['Classe : CM2    |    Effectif : 6 élèves    |    Moyenne = Total ÷ 7'],
      // Row 3: Group row
      ['ÉLÈVES', '', '', 'NOTES PAR DISCIPLINE', '', '', '', '', '', '', '', '', '', '', '', '', '', 'RÉSULTATS'],
      // Row 4: Column headers
      [
        'N°',
        'Nom et Prénom',
        'Sexe',
        'Je sais écrire les mots',
        'Questions',
        'Je produis un texte',
        'Etude de texte',
        'Calcul mental',
        'Calcul écrit',
        'Problème',
        'Science Humaine',
        'Sciences et Technologie',
        'Education Sociale',
        'Education Artistique',
        "J'apprends à Lire",
        'Je sais dire',
        'Education Musicale',
        'Total',
        'Moyenne',
        'Rang',
        'Appréciation',
      ],
      // Row 5: ABOGNON Sandra (F) -> Sum = 47.0 -> 47/7 = 6.71 (Travail médiocre, 5e)
      [1, 'ABOGNON Sandra', 'F', 0, 1, 3, 4, 0, 5, 12, 8, 5, 3, 6, null, null, null, '', '', '', ''],
      // Row 6: AGBEKO Esther (F) -> Sum = 107.0 -> 107/7 = 15.29 (Assez bon travail, 3e)
      [2, 'AGBEKO Esther', 'F', 2, '8,5', 7, 15, 6, 20, 16, '9,5', 8, 8, 7, null, null, null, null, null, null, null],
      // Row 7: ALOGNON Gloria (F) -> Absente
      [3, 'ALOGNON Gloria', 'F', null, null, null, null, null, null, null, null, null, null, null],
      // Row 8: ALOMASSO Akossiwa (F) -> Sum = 70.0 -> 70/7 = 10.00 (Passable, 4e)
      [4, 'ALOMASSO Akossiwa', 'F', 0, 3, 6, 6, 5, 17, 12, 6, 6, 6, 3],
      // Row 9: HUNLEDE Rachelle (F) -> Sum = 117.0 -> 117/7 = 16.71 (Bon travail, 1er ex)
      [5, 'HUNLEDE Rachelle', 'F', 3, 7, 8, 16, 7, 20, 20, 10, 10, 10, 6],
      // Row 10: TCHOKOU Frederic (M) -> Sum = 117.0 -> 117/7 = 16.71 (Bon travail, 1er ex)
      [6, 'TCHOKOU Frederic', 'M', 4, '8,5', 8, 16, 10, 20, 16, 9, 9, 10, '6,5'],
      // Footer legend row (must be skipped cleanly)
      ['Appréciations : ≥ 18 Très bon travail ; félicitations | 16 à 17,99 Bon travail | Moyenne < 10 en rouge.'],
    ]

    const buf = buildXlsxArrayBuffer({ Résultats: aoa, Récapitulation: [['Statistiques']] })
    const parsed = parseExcelWorkbookGrades(buf, {
      fileName: 'composition_mensuelle_octobre_2026_CM2.xlsx',
      className: 'CM2',
      classLevel: 'CM2',
    })

    expect(parsed.sheetName).toBe('Résultats')
    expect(parsed.detectedTitle).toBe('COMPOSITION MENSUELLE – OCTOBRE 2026')
    expect(parsed.detectedDivisor).toBe(7)
    expect(parsed.detectedPrimaryPeriod).toBe('month_1')
    expect(parsed.columns).toHaveLength(14)
    expect(parsed.rows).toHaveLength(6) // Legend skipped

    const report = buildReportFromImportedData({
      parsed,
      classItem: cm2Class,
      cycle: 'primaire',
      scale: 20,
      sortMode: 'alphabetical',
      filterMode: 'all',
    })

    expect(report.divisor).toBe(7)
    expect(report.formulaLabel).toBe('Moyenne = Total ÷ 7')

    const byName = Object.fromEntries(report.allRows.map(r => [r.fullName, r]))
    expect(byName['ABOGNON Sandra'].totalPoints).toBe(47)
    expect(byName['ABOGNON Sandra'].average).toBe(6.71)
    expect(byName['ABOGNON Sandra'].rankNum).toBe(5)
    expect(byName['ABOGNON Sandra'].isPassing).toBe(false)
    expect(byName['ABOGNON Sandra'].appreciation).toBe('Travail médiocre')

    expect(byName['AGBEKO Esther'].totalPoints).toBe(107)
    expect(byName['AGBEKO Esther'].average).toBe(15.29)
    expect(byName['AGBEKO Esther'].rankNum).toBe(3)
    expect(byName['AGBEKO Esther'].rankText).toBe('3e')
    expect(byName['AGBEKO Esther'].appreciation).toBe('Assez bon travail')

    expect(byName['ALOGNON Gloria'].isAbsent).toBe(true)
    expect(byName['ALOGNON Gloria'].appreciation).toBe('Absent(e)')

    expect(byName['ALOMASSO Akossiwa'].totalPoints).toBe(70)
    expect(byName['ALOMASSO Akossiwa'].average).toBe(10)
    expect(byName['ALOMASSO Akossiwa'].rankText).toBe('4e')
    expect(byName['ALOMASSO Akossiwa'].isPassing).toBe(true)
    expect(byName['ALOMASSO Akossiwa'].appreciation).toBe('Passable')

    expect(byName['HUNLEDE Rachelle'].average).toBe(16.71)
    expect(byName['HUNLEDE Rachelle'].rankText).toBe('1er ex')
    expect(byName['TCHOKOU Frederic'].average).toBe(16.71)
    expect(byName['TCHOKOU Frederic'].rankText).toBe('1er ex')

    // Ordre de mérite — UNIQUEMENT LES ADMIS (du 1er au dernier)
    expect(report.meritPassingRows.map(r => r.fullName)).toEqual([
      'HUNLEDE Rachelle',
      'TCHOKOU Frederic',
      'AGBEKO Esther',
      'ALOMASSO Akossiwa',
    ])
    expect(report.stats.present.total).toBe(5)
    expect(report.stats.absent.total).toBe(1)
    expect(report.stats.passing.total).toBe(4)
    expect(report.stats.passRatePct).toBe(80)
  })

  it('auto-computes from a minimal Row-1 Excel sheet without Total/Moyenne/Rang/Appréciation or divisor banner', () => {
    const aoa: any[][] = [
      [
        'Nom et Prénom',
        'Sexe',
        'Je sais écrire les mots',
        'Questions',
        'Je produis un texte',
        'Etude de texte',
        'Calcul mental',
        'Calcul écrit',
        'Problème',
        'Science Humaine',
        'Sciences et Technologie',
        'Education Sociale',
        'Education Artistique',
      ],
      ['DOSSOU Paul', 'M', 5, 5, 5, 10, 5, 10, 10, 5, 5, 5, 5], // 70 pts / 7 = 10.00
      ['KODJO Marie', 'F', 8, 9, 9, 18, 9, 19, 19, 9, 9, 9, 8], // 126 pts / 7 = 18.00
      ['MENSAH Luc', 'M', 2, 2, 3, 6, 3, 8, 6, 4, 4, 3, 4], // 45 pts / 7 = 6.43
    ]

    const buf = buildXlsxArrayBuffer({ Notes: aoa })
    const parsed = parseExcelWorkbookGrades(buf, { className: 'CM2', classLevel: 'CM2' })

    expect(parsed.detectedDivisor).toBeNull()
    const report = buildReportFromImportedData({
      parsed,
      classItem: cm2Class,
      cycle: 'primaire',
      scale: 20,
      sortMode: 'merit',
      filterMode: 'passing_only',
    })

    // 140 max barème across the 11 active disciplines -> auto divisor = 7!
    expect(report.barèmeTotal).toBe(140)
    expect(report.divisor).toBe(7)
    expect(report.displayRows.map(r => r.fullName)).toEqual(['KODJO Marie', 'DOSSOU Paul'])
    expect(report.displayRows[0].average).toBe(18)
    expect(report.displayRows[0].appreciation).toBe('Très bon travail ; félicitations')
    expect(report.displayRows[1].average).toBe(10)
    expect(report.displayRows[1].rankText).toBe('2e')
  })

  it('computes weighted averages and merit passing order for secondary (Collège/Lycée) Excel sheets', () => {
    const aoa: any[][] = [
      ['Nom', 'Prénom', 'Sexe', 'Français (c.3)', 'Mathématiques (c.4)', 'Anglais (c.2)'],
      ['AMAH', 'Afi', 'F', 14, 15, 12], // (42 + 60 + 24) / 9 = 126 / 9 = 14.00
      ['KOFFI', 'Jean', 'M', 8, 7, 9], // (24 + 28 + 18) / 9 = 70 / 9 = 7.78
      ['LAWSON', 'Latevi', 'M', 16, 17, 14], // (48 + 68 + 28) / 9 = 144 / 9 = 16.00
    ]

    const buf = buildXlsxArrayBuffer({ Trimestre1: aoa })
    const clsTle: ExportClassItem = { id: 'tle1', name: 'Terminale A4', level: 'Terminale' }
    const parsed = parseExcelWorkbookGrades(buf, {
      fileName: '1er_trimestre_tle.xlsx',
      className: clsTle.name,
      classLevel: clsTle.level || undefined,
    })

    expect(parsed.detectedSecondaryTerm).toBe('1er_trimestre')
    expect(parsed.columns.map(c => c.explicitCoef)).toEqual([3, 4, 2])

    const report = buildReportFromImportedData({
      parsed,
      classItem: clsTle,
      cycle: 'lycee',
      sortMode: 'merit',
      filterMode: 'passing_only',
    })

    expect(report.meritPassingRows.map(r => r.fullName)).toEqual(['LAWSON Latevi', 'AMAH Afi'])
    expect(report.meritPassingRows[0].totalPoints).toBe(144)
    expect(report.meritPassingRows[0].average).toBe(16)
    expect(report.meritPassingRows[0].rankText).toBe('1er')
    expect(report.meritPassingRows[1].average).toBe(14)
    expect(report.meritPassingRows[1].rankText).toBe('2e')
  })

  it('parses French semicolon CSV files with comma decimal scores cleanly', () => {
    const csv = [
      'N°;Nom et Prénom;Sexe;Calcul mental;Problème',
      '1;AKPO Goodluck;M;7,5;14,5',
      '2;ABOGNON Sandra;F;2;4',
    ].join('\n')
    const bytes = new TextEncoder().encode(csv)
    const ab = toArrayBuffer(bytes)

    const parsed = parseExcelWorkbookGrades(ab, {
      fileName: 'notes_cm2_novembre.csv',
      className: 'CM2',
      classLevel: 'CM2',
    })

    expect(parsed.detectedPrimaryPeriod).toBe('month_2')
    expect(parsed.rows).toHaveLength(2)
    expect(parsed.rows[0].scores['col_3']).toBe(7.5)
    expect(parsed.rows[0].scores['col_4']).toBe(14.5)
  })

  it('matches students accurately and assigns 1-to-1 subject synonyms', () => {
    const dbStudents: ExportStudentItem[] = [
      { id: 's1', last_name: 'ABOGNON', first_name: 'Sandra', matricule: 'MAT01', class_id: 'cm2', gender: 'F' },
      { id: 's2', last_name: 'TCHOKOU', first_name: 'Éric Frédéric', matricule: 'MAT02', class_id: 'cm2', gender: 'M' },
      { id: 's3', last_name: 'LAWSON-AVUNSU', first_name: 'Latevi', matricule: 'MAT03', class_id: 'cm2', gender: 'M' },
    ]

    const excelAoa: any[][] = [
      [
        'Matricule',
        'Nom et Prénom',
        'Je sais écrire les mots',
        'Education Artistique',
        'Science Humaine',
        "J'apprends à Lire",
      ],
      ['', 'ABOGNON Sandra', 5, 6, 7, 8], // Exact LAST FIRST
      ['', 'Eric Frederic TCHOKOU', 6, 7, 8, 9], // Reversed + accent-insensitive
      ['MAT03', 'Eleve Inconnu', 7, 7, 7, 7], // Matricule priority
      ['', 'NOUVEAU Eleve', 5, 5, 5, 5], // Unmatched
    ]

    const buf = buildXlsxArrayBuffer({ Sheet1: excelAoa })
    const parsed = parseExcelWorkbookGrades(buf, { className: 'CM2', classLevel: 'CM2' })

    const stuMatches = matchStudentsToClass(parsed.rows, dbStudents)
    expect(stuMatches[0].matchedStudentId).toBe('s1')
    expect(stuMatches[0].matchMethod).toBe('exact_name')
    expect(stuMatches[1].matchedStudentId).toBe('s2')
    expect(stuMatches[1].matchMethod).toBe('reversed_name')
    expect(stuMatches[2].matchedStudentId).toBe('s3')
    expect(stuMatches[2].matchMethod).toBe('matricule')
    expect(stuMatches[3].matchedStudentId).toBeNull()
    expect(stuMatches[3].matchMethod).toBe('unmatched')

    const dbSubjects: ExportSubjectItem[] = [
      { id: 'sub1', name: 'Je sais écrire les mots (dictée, questions)', cycle: 'primaire' },
      { id: 'sub2', name: 'Arts plastiques (Dessin)', cycle: 'primaire' },
      { id: 'sub3', name: 'Sciences Humaines (Histoire-Géographie)', cycle: 'primaire' },
      { id: 'sub4', name: 'Lecture', cycle: 'primaire' },
    ]

    const subMaps = suggestSubjectMappings(parsed.columns, dbSubjects, cm2Class, true)
    expect(subMaps.map(m => m.matchedSubjectId)).toEqual(['sub1', 'sub2', 'sub3', 'sub4'])
  })

  it('builds a dedicated merit-only ExcelJS workbook containing strictly passing students from 1st to last', async () => {
    const aoa: any[][] = [
      ['Classe : CM2 | Moyenne = Total ÷ 2'],
      ['Nom et Prénom', 'Sexe', 'Calcul écrit', 'Problème'], // max 40 => div 2
      ['ELEVE ECHEC', 'M', 8, 10], // 18 / 2 = 9.00 (Fail)
      ['ELEVE SECOND', 'F', 12, 12], // 24 / 2 = 12.00 (Pass, 2e)
      ['ELEVE PREMIER', 'F', 18, 16], // 34 / 2 = 17.00 (Pass, 1er)
    ]

    const buf = buildXlsxArrayBuffer({ Notes: aoa })
    const parsed = parseExcelWorkbookGrades(buf, { className: 'CM2', classLevel: 'CM2' })
    const report = buildReportFromImportedData({
      parsed,
      classItem: cm2Class,
      cycle: 'primaire',
      scale: 20,
      sortMode: 'merit',
      filterMode: 'passing_only',
    })

    const wb = await buildClassResultsWorkbook(report, { mode: 'merit_only' })
    expect(wb.worksheets.map(w => w.name)).toEqual([
      'Ordre de mérite (Admis)',
      'Récapitulation',
    ])

    const wsMerit = wb.getWorksheet('Ordre de mérite (Admis)')!
    expect(wsMerit.getRow(5).getCell(2).value).toBe('ELEVE PREMIER')
    expect(wsMerit.getRow(6).getCell(2).value).toBe('ELEVE SECOND')
    expect(wsMerit.getRow(7).getCell(2).value).toBeNull() // Failing student excluded!

    const outBuf = await wb.xlsx.writeBuffer()
    expect(outBuf.byteLength).toBeGreaterThan(4000)
  }, 30000)
})

