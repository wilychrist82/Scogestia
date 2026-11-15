import { describe, it, expect } from 'vitest'
import ExcelJS from 'exceljs'
import { buildAoaWorkbookBuffer } from '../lib/excel-export-utils'

describe('excel-export-utils', () => {
  it('writes valid .xlsx buffer with sanitized sheet names and intact cell data', async () => {
    const buffer = await buildAoaWorkbookBuffer({
      sheetName: 'Liste [Elèves] 2026/2027*TropLongPourExcel',
      rows: [
        ['Nom', 'Prénom', 'Montant'],
        ['Koffi', 'Amina', 45000],
        ['Mensah', 'Jean', 0],
      ],
      colWidths: [20, 20, 15],
      headerRowIndex: 1,
    })

    const wb = new ExcelJS.Workbook()
    await wb.xlsx.load(buffer)

    expect(wb.worksheets.length).toBe(1)
    const ws = wb.worksheets[0]
    expect(ws.name.length).toBeLessThanOrEqual(31)
    expect(ws.name).not.toMatch(/[*?:\\/\[\]]/)

    expect(ws.getRow(1).values).toEqual([undefined, 'Nom', 'Prénom', 'Montant'])
    expect(ws.getRow(1).font?.bold).toBe(true)
    expect(ws.getRow(2).values).toEqual([undefined, 'Koffi', 'Amina', 45000])
    expect(ws.getRow(3).values).toEqual([undefined, 'Mensah', 'Jean', 0])
  })
})
