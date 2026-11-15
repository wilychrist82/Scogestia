import type { Workbook } from 'exceljs'

export interface ExcelAoaOptions {
  sheetName: string
  rows: unknown[][]
  colWidths?: number[]
  headerRowIndex?: number
}

export interface FinancialBilanExportParams {
  schoolName: string
  academicYear: string
  userFullName?: string
  reference?: string
  dateLabel?: string
  stats: {
    totalAttendu: number
    totalEncaisse: number
    nbImpayes: number
    nbEleves: number
    nbPaiements: number
    repartitionMethode: Record<string, number>
  }
  soldeRestant: number
  tauxRecouvrement: number
  monthlyEntries: Array<[string, number]>
  methodLabels: Record<string, string>
}

function sanitizeSheetName(name: string): string {
  const cleaned = (name || 'Feuille')
    .replace(/[*?:\\/\[\]]/g, ' ')
    .trim()
  return (cleaned || 'Feuille').slice(0, 31)
}

async function createWorkbookFromAoa({
  sheetName,
  rows,
  colWidths,
  headerRowIndex,
}: ExcelAoaOptions): Promise<Workbook> {
  const ExcelJSModule = await import('exceljs')
  const ExcelJS = (ExcelJSModule as unknown as { default?: typeof import('exceljs') }).default || ExcelJSModule
  const wb: Workbook = new ExcelJS.Workbook()
  wb.creator = 'Scogestia'
  wb.created = new Date()

  const ws = wb.addWorksheet(sanitizeSheetName(sheetName))
  for (const row of rows) {
    ws.addRow(row.map((cell) => (cell === undefined ? '' : cell)))
  }

  if (colWidths && colWidths.length > 0) {
    ws.columns = colWidths.map((width) => ({ width }))
  } else if (rows.length > 0) {
    const colCount = Math.max(...rows.map((r) => r.length))
    ws.columns = Array.from({ length: colCount }, () => ({ width: 22 }))
  }

  if (headerRowIndex !== undefined && headerRowIndex >= 1) {
    const headerRow = ws.getRow(headerRowIndex)
    headerRow.font = { bold: true }
  }

  return wb
}

export async function buildAoaWorkbookBuffer(options: ExcelAoaOptions): Promise<ArrayBuffer> {
  const wb = await createWorkbookFromAoa(options)
  return wb.xlsx.writeBuffer()
}

export async function downloadAoaExcel(
  options: ExcelAoaOptions & { fileName: string },
): Promise<void> {
  const buffer = await buildAoaWorkbookBuffer(options)
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const safeFileName = options.fileName.endsWith('.xlsx')
    ? options.fileName
    : `${options.fileName}.xlsx`

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = safeFileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export async function exportFinancialBilanExcel(params: FinancialBilanExportParams): Promise<void> {
  const {
    schoolName,
    academicYear,
    userFullName,
    reference,
    dateLabel,
    stats,
    soldeRestant,
    tauxRecouvrement,
    monthlyEntries,
    methodLabels,
  } = params

  const effectiveDate = dateLabel || new Date().toLocaleDateString('fr-FR')

  const rows: unknown[][] = [
    ['RÉPUBLIQUE SCOGESTIA - ÉTABLISSEMENT ' + schoolName.toUpperCase()],
    ['BILAN ET ÉTAT FINANCIER DE TRÉSORERIE'],
    [`Année Scolaire : ${academicYear}`, `Date d'exportation : ${effectiveDate}`],
    [
      reference ? `Référence : ${reference}` : '',
      `Édité par : ${userFullName || 'Direction'}`,
    ].filter(Boolean),
    [],
    ['--- SYNTHÈSE GLOBALE ---'],
    ['Indicateur', 'Montant / Valeur', 'Observations'],
    ['Total Prévisionnel Attendu', stats.totalAttendu, 'Somme globale des échéances'],
    ['Total Réellement Encaissé', stats.totalEncaisse, 'Montant effectif perçu'],
    ['Solde Restant à Recouvrer', soldeRestant, 'Créances restantes'],
    ['Taux de Recouvrement', `${tauxRecouvrement}%`, "Niveau d'avancement des règlements"],
    ['Effectif Élèves Actifs', stats.nbEleves, "Nombre total d'élèves inscrits"],
    ['Dossiers en Retard (Impayés)', stats.nbImpayes, 'Dossiers nécessitant une relance'],
    ['Nombre de Règlements Enregistrés', stats.nbPaiements, 'Transactions enregistrées'],
    [],
    ['--- RÉPARTITION PAR MODE DE RÈGLEMENT ---'],
    ['Mode de Règlement', 'Montant Encaissé (FCFA)', 'Part (%)'],
    ...Object.entries(stats.repartitionMethode).map(([method, amount]) => {
      const pct = stats.totalEncaisse > 0 ? Math.round((amount / stats.totalEncaisse) * 100) : 0
      return [methodLabels[method] || method, amount, `${pct}%`]
    }),
    ['TOTAL GÉNÉRAL', stats.totalEncaisse, '100%'],
  ]

  if (monthlyEntries.length > 0) {
    rows.push([])
    rows.push(['--- ENCAISSEMENTS MENSUELS ---'])
    rows.push(['Mois', 'Montant Encaissé (FCFA)'])
    for (const [monthLabel, amount] of monthlyEntries) {
      rows.push([monthLabel, amount])
    }
  }

  const sanitizedSchool = schoolName.replace(/[^a-zA-Z0-9]/g, '_')
  await downloadAoaExcel({
    sheetName: 'Bilan Financier',
    fileName: `Bilan_Financier_${sanitizedSchool}_${new Date().toISOString().slice(0, 10)}.xlsx`,
    rows,
    colWidths: [35, 25, 35],
    headerRowIndex: 7,
  })
}
