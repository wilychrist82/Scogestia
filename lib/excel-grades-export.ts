import type { Workbook, Worksheet, Border, Fill, Font } from 'exceljs'
import { ClassResultsReport, ComputedStudentRow } from '@/lib/grades-export'

function colLetter(colNumber: number): string {
  let letter = ''
  let n = colNumber
  while (n > 0) {
    const mod = (n - 1) % 26
    letter = String.fromCharCode(65 + mod) + letter
    n = Math.floor((n - mod) / 26)
  }
  return letter
}

const NAVY_FILL: Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF1B365D' },
}

const SUB_HEADER_FILL: Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFF1F5F9' },
}

const ZEBRA_FILL: Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFF8FAFC' },
}

const PASS_TINT_FILL: Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFECFDF5' },
}

const THIN_BORDER: Partial<Border> = { style: 'thin', color: { argb: 'FF94A3B8' } }
const GRID_BORDER = {
  top: THIN_BORDER,
  left: THIN_BORDER,
  bottom: THIN_BORDER,
  right: THIN_BORDER,
}

const HEADER_FONT: Partial<Font> = {
  name: 'Calibri',
  size: 11,
  bold: true,
  color: { argb: 'FFFFFFFF' },
}

function populateResultsSheet(
  ws: Worksheet,
  report: ClassResultsReport,
  rows: ComputedStudentRow[],
  options?: { titleOverride?: string; subtitleExtra?: string }
) {
  const numCols = report.columns.length
  const firstSubjCol = 4
  const lastSubjCol = 3 + Math.max(1, numCols)
  const totalCol = lastSubjCol + 1
  const avgCol = lastSubjCol + 2
  const rankCol = lastSubjCol + 3
  const apprCol = lastSubjCol + 4
  const totalSheetCols = apprCol

  const lastColLtr = colLetter(totalSheetCols)
  const firstSubjLtr = colLetter(firstSubjCol)
  const lastSubjLtr = colLetter(lastSubjCol)
  const totalLtr = colLetter(totalCol)

  // Row 1 : Bannière titre
  ws.mergeCells(`A1:${lastColLtr}1`)
  const titleCell = ws.getCell('A1')
  titleCell.value = options?.titleOverride || report.title
  titleCell.font = { name: 'Calibri', size: 15, bold: true, color: { argb: 'FFFFFFFF' } }
  titleCell.fill = NAVY_FILL
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
  ws.getRow(1).height = 32

  // Row 2 : Métadonnées de classe et formule
  ws.mergeCells(`A2:${lastColLtr}2`)
  const metaCell = ws.getCell('A2')
  const metaParts = [
    `Classe : ${report.className}`,
    `Effectif : ${rows.length} élève${rows.length > 1 ? 's' : ''}`,
    report.formulaLabel,
    options?.subtitleExtra || report.periodLabel,
  ]
  metaCell.value = metaParts.join('      |      ')
  metaCell.font = { name: 'Calibri', size: 10.5, bold: true, color: { argb: 'FF0F172A' } }
  metaCell.fill = SUB_HEADER_FILL
  metaCell.alignment = { horizontal: 'center', vertical: 'middle' }
  ws.getRow(2).height = 22

  // Row 3 : Groupes de colonnes (ÉLÈVES | NOTES PAR DISCIPLINE | RÉSULTATS)
  ws.mergeCells('A3:C3')
  const grpStudents = ws.getCell('A3')
  grpStudents.value = 'ÉLÈVES'

  if (numCols > 1) {
    ws.mergeCells(`${firstSubjLtr}3:${lastSubjLtr}3`)
  }
  const grpNotes = ws.getCell(`${firstSubjLtr}3`)
  grpNotes.value = 'NOTES PAR DISCIPLINE'

  ws.mergeCells(`${totalLtr}3:${lastColLtr}3`)
  const grpResults = ws.getCell(`${totalLtr}3`)
  grpResults.value = 'RÉSULTATS'

  for (let c = 1; c <= totalSheetCols; c++) {
    const cell = ws.getRow(3).getCell(c)
    cell.font = { name: 'Calibri', size: 10.5, bold: true, color: { argb: 'FFFFFFFF' } }
    cell.fill = NAVY_FILL
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF334155' } },
      bottom: { style: 'thin', color: { argb: 'FF334155' } },
      left: { style: 'thin', color: { argb: 'FF64748B' } },
      right: { style: 'thin', color: { argb: 'FF64748B' } },
    }
  }
  ws.getRow(3).height = 24

  // Row 4 : En-têtes détaillés (disciplines orientées verticalement à 90°)
  const row4 = ws.getRow(4)
  row4.getCell(1).value = 'N°'
  row4.getCell(2).value = 'Nom et Prénom'
  row4.getCell(3).value = 'Sexe'

  if (numCols === 0) {
    row4.getCell(4).value = 'Aucune discipline'
  } else {
    report.columns.forEach((col, i) => {
      const cell = row4.getCell(firstSubjCol + i)
      cell.value = report.isPrimary ? col.name : `${col.name} (c.${col.coefficient})`
      cell.alignment = { horizontal: 'center', vertical: 'bottom', textRotation: 90, wrapText: true }
    })
  }

  row4.getCell(totalCol).value = 'Total'
  row4.getCell(avgCol).value = 'Moyenne'
  row4.getCell(rankCol).value = 'Rang'
  row4.getCell(apprCol).value = 'Appréciation'

  for (let c = 1; c <= totalSheetCols; c++) {
    const cell = row4.getCell(c)
    cell.font = HEADER_FONT
    cell.fill = NAVY_FILL
    if (c < firstSubjCol || c > lastSubjCol) {
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
    }
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF334155' } },
      bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
      left: { style: 'thin', color: { argb: 'FF64748B' } },
      right: { style: 'thin', color: { argb: 'FF64748B' } },
    }
  }
  row4.height = 124

  // Largeurs de colonnes optimisées
  ws.getColumn(1).width = 5
  ws.getColumn(2).width = 30
  ws.getColumn(3).width = 6.5
  for (let i = 0; i < Math.max(1, numCols); i++) {
    ws.getColumn(firstSubjCol + i).width = 6.8
  }
  ws.getColumn(totalCol).width = 9.5
  ws.getColumn(avgCol).width = 10.5
  ws.getColumn(rankCol).width = 8.5
  ws.getColumn(apprCol).width = 27

  // Figer les volets (lignes 1..4 et colonnes A..C visibles au défilement)
  ws.views = [{ state: 'frozen', xSplit: 3, ySplit: 4 }]

  // Lignes élèves (à partir de la ligne 5)
  const divisorSafe = Math.round(report.divisor * 10000) / 10000 || 1

  rows.forEach((stu, idx) => {
    const excelRowIdx = 5 + idx
    const r = ws.getRow(excelRowIdx)
    r.height = 20

    r.getCell(1).value = idx + 1
    r.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' }
    r.getCell(1).font = { name: 'Calibri', size: 10.5, color: { argb: 'FF334155' } }

    r.getCell(2).value = stu.fullName
    r.getCell(2).alignment = { horizontal: 'left', vertical: 'middle' }
    r.getCell(2).font = { name: 'Calibri', size: 10.5, bold: true, color: { argb: 'FF0F172A' } }

    r.getCell(3).value = stu.gender || ''
    r.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' }
    r.getCell(3).font = { name: 'Calibri', size: 10.5, color: { argb: 'FF334155' } }

    if (numCols === 0) {
      r.getCell(4).value = ''
    } else {
      report.columns.forEach((col, cIdx) => {
        const val = stu.scores[col.id]
        const cell = r.getCell(firstSubjCol + cIdx)
        if (val !== null && val !== undefined) {
          cell.value = val
          cell.numFmt = Number.isInteger(val) ? '0' : '0.##'
        }
        cell.alignment = { horizontal: 'center', vertical: 'middle' }
        cell.font = { name: 'Calibri', size: 10.5, color: { argb: 'FF0F172A' } }
      })
    }

    // Colonne Total
    const totalCell = r.getCell(totalCol)
    if (!stu.isAbsent && stu.totalPoints !== null && numCols > 0) {
      if (report.isPrimary) {
        totalCell.value = {
          formula: `IF(COUNT(${firstSubjLtr}${excelRowIdx}:${lastSubjLtr}${excelRowIdx})=0,"",SUM(${firstSubjLtr}${excelRowIdx}:${lastSubjLtr}${excelRowIdx}))`,
          result: stu.totalPoints,
        }
      } else {
        const weightedParts = report.columns.map(
          (col, cIdx) => `IF(${colLetter(firstSubjCol + cIdx)}${excelRowIdx}="",0,${colLetter(firstSubjCol + cIdx)}${excelRowIdx}*${col.coefficient})`
        )
        totalCell.value = {
          formula: `IF(COUNT(${firstSubjLtr}${excelRowIdx}:${lastSubjLtr}${excelRowIdx})=0,"",${weightedParts.join('+')})`,
          result: stu.totalPoints,
        }
      }
      totalCell.numFmt = '0.0'
    }
    totalCell.alignment = { horizontal: 'center', vertical: 'middle' }
    totalCell.font = { name: 'Calibri', size: 10.5, bold: true, color: { argb: 'FF0F172A' } }

    // Colonne Moyenne (en rouge si < seuil)
    const avgCell = r.getCell(avgCol)
    if (!stu.isAbsent && stu.average !== null && numCols > 0) {
      if (report.isPrimary) {
        avgCell.value = {
          formula: `IF(${totalLtr}${excelRowIdx}="","",${totalLtr}${excelRowIdx}/${divisorSafe})`,
          result: stu.average,
        }
      } else {
        const activeCoefs = report.columns
          .filter(c => stu.scores[c.id] !== null && stu.scores[c.id] !== undefined)
          .reduce((a, b) => a + b.coefficient, 0)
        const secDiv = activeCoefs > 0 ? activeCoefs : divisorSafe
        avgCell.value = {
          formula: `IF(${totalLtr}${excelRowIdx}="","",${totalLtr}${excelRowIdx}/${secDiv})`,
          result: stu.average,
        }
      }
      avgCell.numFmt = '0.00'
    }
    avgCell.alignment = { horizontal: 'center', vertical: 'middle' }
    avgCell.font = {
      name: 'Calibri',
      size: 10.5,
      bold: true,
      color: { argb: !stu.isAbsent && !stu.isPassing ? 'FFDC2626' : 'FF0F172A' },
    }

    // Colonne Rang
    const rankCell = r.getCell(rankCol)
    rankCell.value = stu.isAbsent ? '' : stu.rankText
    rankCell.alignment = { horizontal: 'center', vertical: 'middle' }
    rankCell.font = { name: 'Calibri', size: 10.5, bold: stu.rankNum === 1, color: { argb: 'FF0F172A' } }

    // Colonne Appréciation
    const apprCell = r.getCell(apprCol)
    apprCell.value = stu.appreciation
    apprCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 }
    apprCell.font = {
      name: 'Calibri',
      size: 10.5,
      italic: stu.isAbsent,
      color: {
        argb: stu.isAbsent ? 'FF64748B' : !stu.isPassing ? 'FFDC2626' : 'FF0F172A',
      },
    }

    // Bordures & léger zébrage
    for (let c = 1; c <= totalSheetCols; c++) {
      const cell = r.getCell(c)
      cell.border = GRID_BORDER
      if (idx % 2 === 1) {
        cell.fill = ZEBRA_FILL
      }
    }
  })

  // Ligne de légende en pied de tableau
  const legendRowIdx = 5 + rows.length + 1
  ws.mergeCells(`A${legendRowIdx}:${lastColLtr}${legendRowIdx}`)
  const legendCell = ws.getCell(`A${legendRowIdx}`)
  legendCell.value = report.legendText
  legendCell.font = { name: 'Calibri', size: 9.5, italic: true, color: { argb: 'FF475569' } }
  legendCell.alignment = { horizontal: 'left', vertical: 'middle' }
  ws.getRow(legendRowIdx).height = 20

  // Configuration impression paysage
  ws.pageSetup = {
    orientation: 'landscape',
    paperSize: 9, // A4
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
  }
}

function populateRecapitulationSheet(ws: Worksheet, report: ClassResultsReport) {
  ws.mergeCells('A1:F1')
  const titleCell = ws.getCell('A1')
  titleCell.value = `RÉCAPITULATION – ${report.title}`
  titleCell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFFFF' } }
  titleCell.fill = NAVY_FILL
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
  ws.getRow(1).height = 30

  ws.mergeCells('A2:F2')
  const subCell = ws.getCell('A2')
  subCell.value = `${report.schoolName}  |  Classe : ${report.className}  |  Période : ${report.periodLabel}  |  Année : ${report.academicYear}`
  subCell.font = { name: 'Calibri', size: 10.5, bold: true, color: { argb: 'FF0F172A' } }
  subCell.fill = SUB_HEADER_FILL
  subCell.alignment = { horizontal: 'center', vertical: 'middle' }
  ws.getRow(2).height = 22

  // Section 1 : Synthèse générale de la classe
  let rowCursor = 4
  ws.mergeCells(`A${rowCursor}:F${rowCursor}`)
  const s1Title = ws.getCell(`A${rowCursor}`)
  s1Title.value = '1. SYNTHÈSE GÉNÉRALE DES RÉSULTATS'
  s1Title.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } }
  s1Title.fill = NAVY_FILL
  s1Title.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 }
  ws.getRow(rowCursor).height = 24
  rowCursor++

  const header1 = ['Indicateur', 'Garçons (M)', 'Filles (F)', 'Total', 'Pourcentage / Valeur', 'Observation']
  const hRow1 = ws.getRow(rowCursor)
  hRow1.height = 22
  header1.forEach((lbl, idx) => {
    const c = hRow1.getCell(idx + 1)
    c.value = lbl
    c.font = { name: 'Calibri', size: 10.5, bold: true, color: { argb: 'FF0F172A' } }
    c.fill = SUB_HEADER_FILL
    c.border = GRID_BORDER
    c.alignment = { horizontal: idx === 0 || idx === 5 ? 'left' : 'center', vertical: 'middle' }
  })
  rowCursor++

  const { stats } = report
  const fmtAvg = (v: number | null) => (v !== null ? `${v.toFixed(2).replace('.', ',')} / ${report.scale}` : '—')

  const kpiRows: Array<[string, number | string, number | string, number | string, string, string]> = [
    ['Effectif inscrit', stats.enrolled.boys, stats.enrolled.girls, stats.enrolled.total, '100 %', 'Effectif total de la classe'],
    ['Effectif ayant composé (Présents)', stats.present.boys, stats.present.girls, stats.present.total, stats.enrolled.total > 0 ? `${((stats.present.total / stats.enrolled.total) * 100).toFixed(1)} %` : '—', 'Élèves évalués'],
    ['Absents (Aucune note)', stats.absent.boys, stats.absent.girls, stats.absent.total, stats.enrolled.total > 0 ? `${((stats.absent.total / stats.enrolled.total) * 100).toFixed(1)} %` : '—', 'Non classés'],
    [`Ayant la moyenne (≥ ${report.passThreshold})`, stats.passing.boys, stats.passing.girls, stats.passing.total, stats.passRatePct !== null ? `${stats.passRatePct} % des présents` : '—', 'Admis / Taux de réussite'],
    [`En dessous de la moyenne (< ${report.passThreshold})`, stats.failing.boys, stats.failing.girls, stats.failing.total, stats.present.total > 0 ? `${((stats.failing.total / stats.present.total) * 100).toFixed(1)} % des présents` : '—', 'À encourager'],
    ['Moyenne générale de la classe', '—', '—', '—', fmtAvg(stats.classAverage), 'Moyenne arithmétique des présents'],
    ['Plus forte moyenne', '—', '—', '—', fmtAvg(stats.highestAverage), stats.highestStudentName || '—'],
    ['Plus faible moyenne', '—', '—', '—', fmtAvg(stats.lowestAverage), stats.lowestStudentName || '—'],
  ]

  kpiRows.forEach((kr, idx) => {
    const r = ws.getRow(rowCursor++)
    r.height = 20
    kr.forEach((val, cIdx) => {
      const cell = r.getCell(cIdx + 1)
      cell.value = val
      cell.border = GRID_BORDER
      cell.font = {
        name: 'Calibri',
        size: 10.5,
        bold: idx === 3 || cIdx === 0 || cIdx === 3,
        color: { argb: idx === 4 ? 'FFDC2626' : idx === 3 ? 'FF047857' : 'FF0F172A' },
      }
      cell.alignment = { horizontal: cIdx === 0 || cIdx === 5 ? 'left' : 'center', vertical: 'middle' }
      if (idx === 3) cell.fill = PASS_TINT_FILL
    })
  })

  // Section 2 : Répartition par Appréciation
  rowCursor += 1
  ws.mergeCells(`A${rowCursor}:F${rowCursor}`)
  const s2Title = ws.getCell(`A${rowCursor}`)
  s2Title.value = '2. RÉPARTITION PAR TRANCHE D’APPRÉCIATION'
  s2Title.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } }
  s2Title.fill = NAVY_FILL
  s2Title.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 }
  ws.getRow(rowCursor).height = 24
  rowCursor++

  const h2 = ['Appréciation', 'Tranche de moyenne', 'Garçons (M)', 'Filles (F)', 'Total élèves', '% de la classe']
  const hRow2 = ws.getRow(rowCursor++)
  hRow2.height = 22
  h2.forEach((lbl, idx) => {
    const c = hRow2.getCell(idx + 1)
    c.value = lbl
    c.font = { name: 'Calibri', size: 10.5, bold: true, color: { argb: 'FF0F172A' } }
    c.fill = SUB_HEADER_FILL
    c.border = GRID_BORDER
    c.alignment = { horizontal: idx <= 1 ? 'left' : 'center', vertical: 'middle' }
  })

  stats.appreciationBreakdown.forEach(item => {
    const r = ws.getRow(rowCursor++)
    r.height = 20
    const isFailBucket = item.bucket === 'mediocre' || item.bucket === 'tres_insuffisant'
    const vals = [item.label, item.rangeLabel, item.boys, item.girls, item.total, `${item.pct} %`]
    vals.forEach((v, cIdx) => {
      const cell = r.getCell(cIdx + 1)
      cell.value = v
      cell.border = GRID_BORDER
      cell.font = {
        name: 'Calibri',
        size: 10.5,
        bold: cIdx === 4,
        color: { argb: isFailBucket && cIdx === 0 ? 'FFDC2626' : 'FF0F172A' },
      }
      cell.alignment = { horizontal: cIdx <= 1 ? 'left' : 'center', vertical: 'middle' }
    })
  })

  // Section 3 : Statistiques par Discipline
  rowCursor += 1
  ws.mergeCells(`A${rowCursor}:F${rowCursor}`)
  const s3Title = ws.getCell(`A${rowCursor}`)
  s3Title.value = '3. MOYENNES ET RÉUSSITE PAR DISCIPLINE'
  s3Title.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } }
  s3Title.fill = NAVY_FILL
  s3Title.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 }
  ws.getRow(rowCursor).height = 24
  rowCursor++

  const h3 = ['Discipline / Rubrique', 'Barème', 'Élèves notés', 'Note Min / Max', 'Moyenne classe', 'Taux de réussite']
  const hRow3 = ws.getRow(rowCursor++)
  hRow3.height = 22
  h3.forEach((lbl, idx) => {
    const c = hRow3.getCell(idx + 1)
    c.value = lbl
    c.font = { name: 'Calibri', size: 10.5, bold: true, color: { argb: 'FF0F172A' } }
    c.fill = SUB_HEADER_FILL
    c.border = GRID_BORDER
    c.alignment = { horizontal: idx === 0 ? 'left' : 'center', vertical: 'middle' }
  })

  stats.subjectStats.forEach(st => {
    const r = ws.getRow(rowCursor++)
    r.height = 20
    const minMax =
      st.minScore !== null && st.maxFoundScore !== null
        ? `${st.minScore} / ${st.maxFoundScore}`
        : '—'
    const vals = [
      st.name,
      `/${st.maxScore}`,
      st.gradedCount,
      minMax,
      st.average !== null ? st.average : '—',
      st.passRatePct !== null ? `${st.passRatePct} %` : '—',
    ]
    vals.forEach((v, cIdx) => {
      const cell = r.getCell(cIdx + 1)
      cell.value = v
      cell.border = GRID_BORDER
      cell.font = { name: 'Calibri', size: 10.5, bold: cIdx === 0 || cIdx === 4, color: { argb: 'FF0F172A' } }
      cell.alignment = { horizontal: cIdx === 0 ? 'left' : 'center', vertical: 'middle' }
    })
  })

  ws.getColumn(1).width = 36
  ws.getColumn(2).width = 18
  ws.getColumn(3).width = 14
  ws.getColumn(4).width = 16
  ws.getColumn(5).width = 22
  ws.getColumn(6).width = 28

  ws.pageSetup = {
    orientation: 'portrait',
    paperSize: 9,
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 1,
  }
}

/**
 * Construit le classeur ExcelJS (.xlsx) à 3 onglets :
 * - "Résultats" : feuille principale (alphabétique ou ordre de mérite selon la vue choisie)
 * - "Récapitulation" : synthèses par sexe, tranches d'appréciations et statistiques par discipline
 * - "Ordre de mérite (Admis)" : liste des élèves ayant la moyenne triés de la plus forte à la plus faible
 */
export async function buildClassResultsWorkbook(report: ClassResultsReport): Promise<Workbook> {
  const ExcelJSModule = await import('exceljs')
  const ExcelJS = (ExcelJSModule as any).default || ExcelJSModule
  const wb: Workbook = new ExcelJS.Workbook()
  wb.creator = 'Scogestia'
  wb.created = new Date()

  // Feuille 1 : Résultats (vue sélectionnée par l'utilisateur)
  const wsResults = wb.addWorksheet('Résultats')
  const sheet1Subtitle =
    report.filterMode === 'passing_only'
      ? `Ordre de mérite — Admis uniquement (Moy. ≥ ${report.passThreshold}) · ${report.periodLabel}`
      : report.sortMode === 'merit'
        ? `Ordre de mérite (Tous) · ${report.periodLabel}`
        : report.periodLabel
  populateResultsSheet(wsResults, report, report.displayRows, {
    subtitleExtra: sheet1Subtitle,
  })

  // Feuille 2 : Récapitulation (statistiques complètes)
  const wsRecap = wb.addWorksheet('Récapitulation')
  populateRecapitulationSheet(wsRecap, report)

  // Feuille 3 : Ordre de mérite (Admis uniquement, triés de la plus forte moyenne à la plus faible)
  const wsMerit = wb.addWorksheet('Ordre de mérite (Admis)')
  populateResultsSheet(wsMerit, report, report.meritPassingRows, {
    titleOverride: `${report.title} – LISTE DE MÉRITE (ADMIS)`,
    subtitleExtra: `Admis (Moy. ≥ ${report.passThreshold}) : ${report.meritPassingRows.length} / ${report.stats.present.total} présents`,
  })

  return wb
}

/**
 * Génère et télécharge le classeur Excel (.xlsx) complet et stylisé.
 */
export async function exportClassResultsToExcel(report: ClassResultsReport): Promise<void> {
  const wb = await buildClassResultsWorkbook(report)
  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })

  const safeClass = (report.className || 'classe')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
  const safePeriod = (report.periodLabel || 'periode')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
  const fileName = `resultats_${safeClass}_${safePeriod}_${new Date().toISOString().slice(0, 10)}.xlsx`

  const isNativeMobile =
    typeof window !== 'undefined' &&
    Boolean((window as any).Capacitor?.isNativePlatform?.())

  if (isNativeMobile && typeof navigator !== 'undefined' && navigator.share) {
    const file = new File([blob], fileName, { type: blob.type })
    if (!navigator.canShare || navigator.canShare({ files: [file] })) {
      await navigator.share({ title: fileName, files: [file] })
      return
    }
  }

  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(url)
}
