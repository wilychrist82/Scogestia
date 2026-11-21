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
  formatIeppHeaderDisplay,
  generateQrMatrix,
  sanitizeIeppText,
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
    inspectionName: 'IEPP MON-INSPECTION',
    examCenter: 'AGBAVI',
    cardTemplate: 'togo_iepp',
    ...overrides,
  }
}

describe('Modèle 2 Carte Scolaire Officielle IEPP / Togo', () => {
  beforeEach(() => {
    mockSaveOrSharePdf.mockReset()
  })

  it('reste neutre sans inspection imposée par défaut et supprime DRE', () => {
    expect(formatIeppHeaderDisplay('')).toBe('IEPP : .........................')
    expect(formatIeppHeaderDisplay('IEPP')).toBe('IEPP : .........................')
    expect(formatIeppHeaderDisplay('IEPP Kozah')).toBe('IEPP KOZAH')
    expect(sanitizeIeppText('IEPP / DRE ANÉHO')).toBe('IEPP ANÉHO')
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
      inspectionName: 'IEPP / DRE TONE-EST',
    })
    expect(payload).toContain('SCOGESTIA|SCO-2026-0042|AGBODJAN Koffi|CM2|IEPP TONE-EST')

    const matrix = generateQrMatrix(payload)
    expect(matrix.length).toBeGreaterThanOrEqual(21)
    expect(matrix.every((row) => row.length === matrix.length)).toBe(true)
    expect(matrix[0][0]).toBe(true)
    expect(matrix[0][6]).toBe(true)
    expect(matrix[6][0]).toBe(true)
  })

  it("rend le recto Togo IEPP avec QR Code à droite, Centre d'écrit agrandi, sexe unique, directeur remonté et sans étiquettes", () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const textSpy = vi.spyOn(doc, 'text')
    const circleSpy = vi.spyOn(doc, 'circle')
    const roundedRectSpy = vi.spyOn(doc, 'roundedRect')

    drawTogoIeppIdCardRecto(
      doc,
      makeSampleStudent({
        inspectionName: '',
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
    expect(printedStrings).toContain('IEPP : .........................')
    expect(printedStrings.some((s) => /\bDRE\b/i.test(s))).toBe(false)
    expect(printedStrings).toContain('EPM CANNAN')
    expect(printedStrings).toContain("CARTE D'IDENTITÉ SCOLAIRE")
    expect(printedStrings).toContain('SCO-2026-0042')
    expect(printedStrings).toContain('AGBODJAN')
    expect(printedStrings).toContain('Féminin')
    expect(printedStrings).not.toContain('Masculin')
    expect(printedStrings.some((s) => s.startsWith("Centre d'écrit : ......."))).toBe(true)
    expect(printedStrings).toContain('M. GNAMAVO Kodjo')

    // Nom du directeur bien remonté (y = 10 + 44 = 54 <= 54.5, bien au-dessus du bas de la carte 63.5)
    const dirCall = textSpy.mock.calls.find((c) => String(c[0]) === 'M. GNAMAVO Kodjo')
    expect(dirCall?.[2]).toBeLessThanOrEqual(55)

    // QR Code positionné à droite devant la carte du Togo (cardX 8.5 + 67.8 = 76.3mm) au niveau de la classe vers le haut
    const qrRect = roundedRectSpy.mock.calls.find((args) => args[2] === 9.0 && args[3] === 9.0)
    expect(qrRect).toBeTruthy()
    expect(qrRect?.[0]).toBeCloseTo(8.5 + 67.8, 1)
    expect(qrRect?.[1]).toBeCloseTo(10 + 28.0, 1)

    // Aucune mention textuelle superflue sur la photo, le chef ni la signature
    expect(printedStrings).not.toContain('PHOTO')
    expect(printedStrings).not.toContain("DE L'ÉLÈVE")
    expect(printedStrings).not.toContain("Nom du Chef d'établissement")
    expect(printedStrings).not.toContain('Signature du Directeur')

    // Aucun pointillé sous les champs déjà remplis
    const smallDotCircles = circleSpy.mock.calls.filter((args) => args[2] === 0.11)
    expect(smallDotCircles.length).toBe(0)
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
