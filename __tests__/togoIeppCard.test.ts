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
      dateOfBirth: '2015-03-09',
      birthPlace: 'Aného',
      gender: 'M',
      className: 'CM2',
      schoolName: 'EPM CANNAN',
      academicYear: '2026-2027',
      inspectionName: 'IEPP / DRE TONE-EST',
      examCenter: 'LYCEE DE DAPAONG',
      schoolPhone: '+228 90 11 22 33',
      directorPhone: '+228 91 44 55 66',
    })
    expect(payload).toContain("CARTE D'IDENTITE SCOLAIRE")
    expect(payload).toContain('Mle: SCO-2026-0042')
    expect(payload).toContain('Nom: AGBODJAN')
    expect(payload).toContain('Prenoms: Koffi')
    expect(payload).toContain('Ne(e): 09/03/2015 a Aného')
    expect(payload).toContain('Sexe: Masculin')
    expect(payload).toContain('Classe: CM2')
    expect(payload).toContain('Ecole: EPM CANNAN')
    expect(payload).toContain('IEPP: IEPP TONE-EST')
    expect(payload).toContain('Centre: LYCEE DE DAPAONG')
    expect(payload).toContain('Tel Ecole: +228 90 11 22 33')
    expect(payload).toContain('Tel Dir: +228 91 44 55 66')
    expect(payload).toContain('Annee: 2026 - 2027')

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
    const curveSpy = vi.spyOn(doc, 'curveTo')

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

    // Drapeau et bande tricolore tracés en courbes de Bézier vectorielles lisses
    expect(curveSpy.mock.calls.length).toBeGreaterThanOrEqual(16)

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

    // Nom du directeur ordonné (y = 10 + 47.6 = 57.6, entre la zone haute et le ruban du bas)
    const dirCall = textSpy.mock.calls.find((c) => String(c[0]) === 'M. GNAMAVO Kodjo')
    expect(dirCall?.[2]).toBeGreaterThanOrEqual(56)
    expect(dirCall?.[2]).toBeLessThanOrEqual(59.5)

    // QR Code agrandi et net positionné à droite devant la carte du Togo (cardX 8.5 + 66.8 = 75.3mm)
    const qrRect = roundedRectSpy.mock.calls.find((args) => args[2] === 9.8 && args[3] === 9.8)
    expect(qrRect).toBeTruthy()
    expect(qrRect?.[0]).toBeCloseTo(8.5 + 66.8, 1)
    expect(qrRect?.[1]).toBeCloseTo(10 + 26.8, 1)

    // Cachet circulaire grand format remonté avec marge sûre anti-découpe (y_bottom <= cardY + 49.5 < 53.5mm)
    const stampFillCircle = circleSpy.mock.calls.find((args) => args[2] === 6.5)
    expect(stampFillCircle).toBeTruthy()
    const stampCy = stampFillCircle![1] as number
    const stampR = stampFillCircle![2] as number
    expect(stampCy + stampR).toBeLessThanOrEqual(10 + 49.5)

    // Couleurs par défaut Modèle 2 : Matricule=Bleu (#1D4ED8), Nom/Prénoms=Rouge (#C8102E), Détails=Noir (#0F172A), Classe=Vert (#007A33)
    const setColorSpy = vi.spyOn(doc, 'setTextColor')
    drawTogoIeppIdCardRecto(
      doc,
      makeSampleStudent({
        inspectionName: 'IEPP KARA',
        schoolName: 'EPL TEST',
        examCenter: 'CENTRE 1',
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
    const defaultRgbCalls = setColorSpy.mock.calls.map((c) => `${c[0]},${c[1]},${c[2]}`)
    expect(defaultRgbCalls).toContain('255,255,255') // Blanc Nom École sur bannière
    expect(defaultRgbCalls).toContain('29,78,216') // Bleu Matricule
    expect(defaultRgbCalls).toContain('200,16,46') // Rouge Nom & Prénoms
    expect(defaultRgbCalls).toContain('15,23,42') // Noir Date / Lieu / Sexe
    expect(defaultRgbCalls).toContain('0,122,51') // Vert Classe
    expect(defaultRgbCalls).toContain('153,18,28') // Rouge bordeaux Nom du directeur

    // Aucune mention textuelle superflue sur la photo, le chef ni la signature
    expect(printedStrings).not.toContain('PHOTO')
    expect(printedStrings).not.toContain("DE L'ÉLÈVE")
    expect(printedStrings).not.toContain("Nom du Chef d'établissement")
    expect(printedStrings).not.toContain('Signature du Directeur')

    // Aucun pointillé sous les champs déjà remplis
    const smallDotCircles = circleSpy.mock.calls.filter((args) => args[2] === 0.11)
    expect(smallDotCircles.length).toBe(0)
  })

  it('applique exactement les couleurs personnalisées de zone et lettre-par-lettre sur le PDF Modèle 2', () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const colorSpy = vi.spyOn(doc, 'setTextColor')

    drawTogoIeppIdCardRecto(
      doc,
      makeSampleStudent({
        inspectionName: 'IEPP KOZAH',
        schoolName: 'EPL LE ROI',
        examCenter: 'KARA',
        typography: {
          schoolName: { fontFamily: 'helvetica', sizeScale: 1, bold: true, italic: false, underline: false, uppercase: true, color: '#FEF08A' },
          headerOfficial: { fontFamily: 'helvetica', sizeScale: 1, bold: true, italic: false, underline: false, uppercase: true, color: '#DC2626' },
          examCenter: { fontFamily: 'helvetica', sizeScale: 1, bold: true, italic: false, underline: false, uppercase: false, color: '#1D4ED8' },
          bannerTitle: { fontFamily: 'times', sizeScale: 1, bold: true, italic: false, underline: false, uppercase: true, color: '#7C3AED' },
          bannerBgColor: '#FFFFFF',
          studentName: { fontFamily: 'helvetica', sizeScale: 1, bold: true, italic: false, underline: false, uppercase: true, color: '#0E1B52' },
          studentDetails: { fontFamily: 'helvetica', sizeScale: 1, bold: true, italic: false, underline: false, uppercase: false, color: '#0F172A' },
          footerInfo: { fontFamily: 'helvetica', sizeScale: 1, bold: true, italic: false, underline: false, uppercase: false, color: '#0E1B52' },
        },
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

    const rgbCalls = colorSpy.mock.calls.map((c) => `${c[0]},${c[1]},${c[2]}`)
    expect(rgbCalls).toContain('220,38,38') // #DC2626 IEPP
    expect(rgbCalls).toContain('254,240,138') // #FEF08A Nom Établissement
    expect(rgbCalls).toContain('29,78,216') // #1D4ED8 Centre d'écrit
    expect(rgbCalls).toContain('124,58,237') // #7C3AED Titre Carte
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
