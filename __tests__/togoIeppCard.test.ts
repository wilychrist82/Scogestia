import { describe, expect, it, vi, beforeEach } from 'vitest'
import jsPDF from 'jspdf'

const { mockSaveOrSharePdf } = vi.hoisted(() => ({
  mockSaveOrSharePdf: vi.fn(),
}))

vi.mock('@/lib/mobile-file-share', () => ({
  saveOrSharePdf: mockSaveOrSharePdf,
}))

import {
  generateClassStudentIdCardsPDF,
  generateStudentIdCardPDF,
  type StudentDocumentData,
} from '@/lib/pdf/student-documents'
import {
  buildStudentQrPayload,
  drawTogoIeppIdCardRecto,
  formatAcademicYearLabel,
  formatCardDateFr,
  generateQrMatrix,
} from '@/lib/pdf/togo-iepp-card'

function makeSampleStudent(overrides?: Partial<StudentDocumentData>): StudentDocumentData {
  return {
    studentId: 'stu-1',
    matricule: 'SCO-2026-0042',
    firstName: 'Koffi Mensah',
    lastName: 'Agbodjan',
    dateOfBirth: '2015-03-09',
    birthPlace: 'Aného',
    gender: 'M',
    className: 'CM2',
    schoolName: 'EPM CANNAN',
    academicYear: '2026-2027',
    directorName: 'M. GNAMAVO Kodjo',
    inspectionName: 'IEPP LACS-OUEST',
    examCenter: 'CEG LACS-OUEST',
    cardTemplate: 'togo_iepp',
    ...overrides,
  }
}

describe('Modèle 2 Carte Scolaire Officielle IEPP / Togo', () => {
  beforeEach(() => {
    mockSaveOrSharePdf.mockReset()
  })

  it('formate correctement les dates et années scolaires sans décalage UTC', () => {
    expect(formatCardDateFr('2015-03-09')).toBe('09/03/2015')
    expect(formatCardDateFr('2012-12-31T00:00:00Z')).toBe('31/12/2012')
    expect(formatCardDateFr('')).toBe('')
    expect(formatAcademicYearLabel('2026-2027')).toBe('2026 - 2027')
    expect(formatAcademicYearLabel('2026/2027')).toBe('2026 - 2027')
  })

  it('génère une matrice QR Code réelle carrée avec motifs de repérage', () => {
    const payload = buildStudentQrPayload({
      matricule: 'SCO-2026-0042',
      lastName: 'Agbodjan',
      firstName: 'Koffi',
      className: 'CM2',
      schoolName: 'EPM CANNAN',
      academicYear: '2026-2027',
      inspectionName: 'IEPP LACS-EST',
    })
    expect(payload).toContain('SCOGESTIA|SCO-2026-0042|AGBODJAN Koffi|CM2|IEPP LACS-EST')

    const matrix = generateQrMatrix(payload)
    expect(matrix.length).toBeGreaterThanOrEqual(21)
    expect(matrix.every((row) => row.length === matrix.length)).toBe(true)
    // Angle haut-gauche du finder pattern toujours sombre (true)
    expect(matrix[0][0]).toBe(true)
    expect(matrix[0][6]).toBe(true)
    expect(matrix[6][0]).toBe(true)
  })

  it("rend le recto Togo IEPP dans jsPDF avec IEPP personnalisée, Centre d'écrit et sans erreur", () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const textSpy = vi.spyOn(doc, 'text')

    drawTogoIeppIdCardRecto(
      doc,
      makeSampleStudent({
        inspectionName: 'IEPP LACS-EST',
        examCenter: '',
        gender: 'F',
      }),
      8.5,
      10,
      94,
      53.5,
      {
        photoDataUrl: null,
        logoDataUrl: null,
        stampDataUrl: null,
        signatureDataUrl: null,
      }
    )

    const printedStrings = textSpy.mock.calls.map((c) => String(c[0]))
    expect(printedStrings).toContain('IEPP LACS-EST')
    expect(printedStrings).toContain('EPM CANNAN')
    expect(printedStrings).toContain("CARTE D'IDENTITÉ SCOLAIRE")
    expect(printedStrings).toContain('SCO-2026-0042')
    expect(printedStrings).toContain('AGBODJAN')
    expect(printedStrings).toContain('09/03/2015')
    expect(printedStrings).toContain('Aného')
    expect(printedStrings.some((s) => s.startsWith('Centre : .......'))).toBe(true)
    expect(printedStrings).toContain('ETABLISSEMENT SCOLAIRE')
  })

  it('génère un PDF individuel en modèle togo_iepp et une planche 10 cartes/page A4 pour 12 élèves', async () => {
    await generateStudentIdCardPDF(makeSampleStudent({ cardTemplate: 'togo_iepp' }))
    expect(mockSaveOrSharePdf).toHaveBeenCalledTimes(1)
    const [singleDoc, singleName] = mockSaveOrSharePdf.mock.calls[0]
    expect(singleName).toContain('Carte_Scolaire_Agbodjan')
    expect(singleDoc.getNumberOfPages()).toBe(1)

    const students12 = Array.from({ length: 12 }, (_, idx) =>
      makeSampleStudent({
        studentId: `stu-${idx + 1}`,
        matricule: `MAT-${idx + 1}`,
        firstName: `Eleve ${idx + 1}`,
        gender: idx % 2 === 0 ? 'F' : 'M',
      })
    )
    await generateClassStudentIdCardsPDF('CM2', students12)
    expect(mockSaveOrSharePdf).toHaveBeenCalledTimes(2)
    const [sheetDoc, sheetName] = mockSaveOrSharePdf.mock.calls[1]
    expect(sheetName).toContain('Planche_10_Cartes_Scolaires_CM2')
    expect(sheetDoc.getNumberOfPages()).toBe(2)
  })

  it('préserve entièrement la rétrocompatibilité du Modèle 1 classique', async () => {
    await generateStudentIdCardPDF(makeSampleStudent({ cardTemplate: 'classic' }))
    expect(mockSaveOrSharePdf).toHaveBeenCalledTimes(1)
    const [classicDoc] = mockSaveOrSharePdf.mock.calls[0]
    expect(classicDoc.getNumberOfPages()).toBe(1)
  })
})
