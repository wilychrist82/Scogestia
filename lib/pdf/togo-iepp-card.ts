import QRCode from 'qrcode'
import type jsPDF from 'jspdf'
import type {
  CardFontFamily,
  CardTypographyConfig,
  CardZoneTextStyle,
  StudentDocumentData,
} from '@/lib/pdf/student-documents'

export type CardTemplateId = 'classic' | 'togo_iepp'

const FALLBACK_TOGO_TYPOGRAPHY: CardTypographyConfig = {
  schoolName: {
    fontFamily: 'helvetica',
    sizeScale: 1,
    bold: true,
    italic: false,
    underline: false,
    uppercase: true,
    color: '#FFFFFF',
  },
  headerOfficial: {
    fontFamily: 'helvetica',
    sizeScale: 1,
    bold: true,
    italic: false,
    underline: false,
    uppercase: true,
    color: '#0A1950',
  },
  bannerTitle: {
    fontFamily: 'times',
    sizeScale: 1,
    bold: true,
    italic: false,
    underline: false,
    uppercase: true,
    color: '#081B58',
  },
  bannerBgColor: '#FFFFFF',
  studentName: {
    fontFamily: 'helvetica',
    sizeScale: 1,
    bold: true,
    italic: false,
    underline: false,
    uppercase: true,
    color: '#0E1B52',
  },
  studentDetails: {
    fontFamily: 'helvetica',
    sizeScale: 1,
    bold: true,
    italic: false,
    underline: false,
    uppercase: false,
    color: '#0F172A',
  },
  footerInfo: {
    fontFamily: 'helvetica',
    sizeScale: 1,
    bold: true,
    italic: false,
    underline: false,
    uppercase: false,
    color: '#0E1B52',
  },
}

export interface TogoCardRenderAssets {
  photoDataUrl: string | null
  logoDataUrl: string | null
  stampDataUrl: string | null
  signatureDataUrl: string | null
}

/**
 * Nettoie toute mention résiduelle de "DRE" dans le libellé IEPP pour le modèle officiel Togo.
 */
export function sanitizeIeppText(raw?: string | null): string {
  return (raw || '')
    .replace(/\bIEPP\s*\/\s*DRE\b/gi, 'IEPP')
    .replace(/\s*\/\s*DRE\b/gi, '')
    .replace(/\bDRE\b\s*/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

/**
 * Formate une date ISO (YYYY-MM-DD ou ISO timestamp) en JJ/MM/AAAA sans décalage de fuseau horaire.
 */
export function formatCardDateFr(dateStr?: string | null): string {
  if (!dateStr) return ''
  const trimmed = dateStr.trim()
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (isoMatch) {
    return `${isoMatch[3]}/${isoMatch[2]}/${isoMatch[1]}`
  }
  const parsed = new Date(trimmed)
  if (Number.isNaN(parsed.getTime())) return trimmed
  return parsed.toLocaleDateString('fr-FR')
}

/**
 * Formate proprement l'année scolaire (ex: "2026-2027" -> "2026 - 2027").
 */
export function formatAcademicYearLabel(academicYear?: string | null): string {
  const raw = (academicYear || '').trim()
  if (!raw) return '2026 - 2027'
  const match = raw.match(/^(\d{4})\s*[-/]\s*(\d{4})$/)
  if (match) {
    return `${match[1]} - ${match[2]}`
  }
  return raw
}

/**
 * Construit le contenu encodé dans le QR Code de vérification de la carte.
 */
export function buildStudentQrPayload(data: {
  matricule: string
  lastName: string
  firstName: string
  className: string
  schoolName: string
  academicYear: string
  inspectionName?: string | null
}): string {
  const clean = (v?: string | null) => (v || '').trim().replace(/\|/g, ' ')
  return [
    'SCOGESTIA',
    clean(data.matricule) || 'N/A',
    `${clean(data.lastName).toUpperCase()} ${clean(data.firstName)}`.trim(),
    clean(data.className),
    sanitizeIeppText(data.inspectionName) || 'IEPP',
    clean(data.schoolName),
    clean(data.academicYear),
  ]
    .filter(Boolean)
    .join('|')
}

/**
 * Génère une matrice booléenne réelle de QR Code (niveau de correction M) utilisable à la fois
 * pour l'aperçu SVG React et pour le rendu vectoriel jsPDF (100% hors-ligne).
 */
export function generateQrMatrix(value: string): boolean[][] {
  try {
    const qr = QRCode.create(value || 'SCOGESTIA', { errorCorrectionLevel: 'M' })
    const size = qr.modules.size
    const matrix: boolean[][] = []
    for (let r = 0; r < size; r++) {
      const row: boolean[] = []
      for (let c = 0; c < size; c++) {
        row.push(Boolean(qr.modules.get(r, c)))
      }
      matrix.push(row)
    }
    return matrix
  } catch {
    const size = 21
    return Array.from({ length: size }, (_, r) =>
      Array.from({ length: size }, (_, c) => (r + c) % 2 === 0)
    )
  }
}

function mapFontFamily(fontFamily: CardFontFamily): 'times' | 'helvetica' | 'courier' {
  if (fontFamily === 'helvetica' || fontFamily === 'verdana') return 'helvetica'
  if (fontFamily === 'courier') return 'courier'
  return 'times'
}

function mapFontStyle(style: CardZoneTextStyle): 'normal' | 'bold' | 'italic' | 'bolditalic' {
  if (style.bold && style.italic) return 'bolditalic'
  if (style.bold) return 'bold'
  if (style.italic) return 'italic'
  return 'normal'
}

function parseHexRgb(hex: string, fallback: [number, number, number]): [number, number, number] {
  const clean = (hex || '').replace('#', '').trim()
  if (clean.length === 6) {
    const r = parseInt(clean.slice(0, 2), 16)
    const g = parseInt(clean.slice(2, 4), 16)
    const b = parseInt(clean.slice(4, 6), 16)
    if (!Number.isNaN(r) && !Number.isNaN(g) && !Number.isNaN(b)) {
      return [r, g, b]
    }
  }
  return fallback
}

function fitTextSize(doc: jsPDF, text: string, maxW: number, startPt: number, minPt: number): number {
  let pt = startPt
  doc.setFontSize(pt)
  while (pt > minPt && doc.getTextWidth(text) > maxW) {
    pt = Number((pt - 0.2).toFixed(2))
    doc.setFontSize(pt)
  }
  return pt
}

function drawStarPolygon(
  doc: jsPDF,
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  fillRgb: [number, number, number]
) {
  const pts: [number, number][] = []
  for (let i = 0; i < 10; i++) {
    const angle = -Math.PI / 2 + (i * Math.PI) / 5
    const r = i % 2 === 0 ? outerR : innerR
    pts.push([cx + Math.cos(angle) * r, cy + Math.sin(angle) * r])
  }
  doc.setFillColor(fillRgb[0], fillRgb[1], fillRgb[2])
  for (let i = 0; i < pts.length; i++) {
    const p1 = pts[i]
    const p2 = pts[(i + 1) % pts.length]
    doc.triangle(cx, cy, p1[0], p1[1], p2[0], p2[1], 'F')
  }
}

/**
 * Emblème officiel : couronne de lauriers dorée + ruban tricolore + livre ouvert bleu + étoile.
 */
function drawIeppLaurelBookEmblem(doc: jsPDF, cx: number, cy: number, scale = 1) {
  doc.setDrawColor(196, 146, 28)
  doc.setFillColor(214, 165, 36)
  doc.setLineWidth(0.24 * scale)

  const leafAnglesLeft = [-2.25, -2.55, -2.85, 3.05, 2.75, 2.45, 2.1]
  leafAnglesLeft.forEach((ang, idx) => {
    const r = (4.6 - idx * 0.08) * scale
    doc.ellipse(cx + Math.cos(ang) * r, cy + Math.sin(ang) * r, 0.72 * scale, 0.34 * scale, 'F')
  })

  const leafAnglesRight = [-0.89, -0.59, -0.29, 0.09, 0.39, 0.69, 1.04]
  leafAnglesRight.forEach((ang, idx) => {
    const r = (4.6 - idx * 0.08) * scale
    doc.ellipse(cx + Math.cos(ang) * r, cy + Math.sin(ang) * r, 0.72 * scale, 0.34 * scale, 'F')
  })

  doc.setFillColor(0, 114, 58)
  doc.roundedRect(cx - 3.6 * scale, cy + 3.1 * scale, 7.2 * scale, 0.85 * scale, 0.3, 0.3, 'F')
  doc.setFillColor(248, 198, 22)
  doc.rect(cx - 3.1 * scale, cy + 3.55 * scale, 6.2 * scale, 0.6 * scale, 'F')
  doc.setFillColor(206, 17, 46)
  doc.rect(cx - 2.6 * scale, cy + 4.0 * scale, 5.2 * scale, 0.55 * scale, 'F')

  drawStarPolygon(doc, cx, cy - 3.25 * scale, 1.05 * scale, 0.42 * scale, [14, 34, 98])

  doc.setDrawColor(14, 34, 98)
  doc.setFillColor(255, 255, 255)
  doc.setLineWidth(0.32 * scale)
  doc.roundedRect(cx - 3.1 * scale, cy - 1.55 * scale, 3.05 * scale, 3.35 * scale, 0.25, 0.25, 'FD')
  doc.roundedRect(cx + 0.05 * scale, cy - 1.55 * scale, 3.05 * scale, 3.35 * scale, 0.25, 0.25, 'FD')

  doc.setDrawColor(46, 78, 158)
  doc.setLineWidth(0.18 * scale)
  for (let i = 0; i < 3; i++) {
    const ly = cy - 0.7 * scale + i * 0.85 * scale
    doc.line(cx - 2.5 * scale, ly, cx - 0.55 * scale, ly)
    doc.line(cx + 0.55 * scale, ly, cx + 2.5 * scale, ly)
  }
}

/**
 * Drapeau Togolais flottant en haut à droite (5 bandes vert/jaune + canton rouge + étoile blanche).
 */
function drawWavingTogoFlagTopRight(doc: jsPDF, x: number, y: number, w: number, h: number) {
  const stripeH = h / 5
  const colors: [number, number, number][] = [
    [0, 108, 62],
    [250, 204, 21],
    [0, 108, 62],
    [250, 204, 21],
    [0, 108, 62],
  ]

  colors.forEach((col, i) => {
    doc.setFillColor(col[0], col[1], col[2])
    const sy = y + i * stripeH
    const steps = 6
    const segW = w / steps
    for (let s = 0; s < steps; s++) {
      const waveY = Math.sin((s / steps) * Math.PI * 1.4) * 0.42
      doc.rect(x + s * segW, sy + waveY, segW + 0.15, stripeH + 0.12, 'F')
    }
  })

  doc.setFillColor(0, 82, 46)
  doc.rect(x + w * 0.55, y + 0.15, w * 0.14, stripeH, 'F')

  const cantonW = w * 0.42
  const cantonH = stripeH * 3
  doc.setFillColor(210, 16, 52)
  doc.rect(x, y, cantonW, cantonH, 'F')

  drawStarPolygon(
    doc,
    x + cantonW * 0.5,
    y + cantonH * 0.5,
    Math.min(cantonW, cantonH) * 0.34,
    Math.min(cantonW, cantonH) * 0.14,
    [255, 255, 255]
  )
}

/**
 * Filigrane très doux de la carte du Togo à droite (opacité réduite pour une lecture nette).
 */
function drawTogoSoftWatermarkMap(doc: jsPDF, x: number, y: number, w: number, h: number) {
  const normPts: [number, number][] = [
    [0.14, 0.03],
    [0.36, 0.02],
    [0.44, 0.08],
    [0.54, 0.11],
    [0.48, 0.21],
    [0.64, 0.28],
    [0.68, 0.39],
    [0.78, 0.49],
    [0.82, 0.62],
    [0.88, 0.74],
    [0.95, 0.87],
    [0.89, 0.96],
    [0.65, 0.98],
    [0.51, 0.92],
    [0.49, 0.80],
    [0.41, 0.72],
    [0.44, 0.60],
    [0.35, 0.50],
    [0.39, 0.37],
    [0.24, 0.26],
    [0.19, 0.14],
  ]

  const absPts = normPts.map(([nx, ny]): [number, number] => [x + nx * w, y + ny * h])
  const cx = x + w * 0.56
  const cy = y + h * 0.52

  // Remplissage rose très pâle façon filigrane discret
  doc.setFillColor(253, 238, 244)
  for (let i = 0; i < absPts.length; i++) {
    const p1 = absPts[i]
    const p2 = absPts[(i + 1) % absPts.length]
    doc.triangle(cx, cy, p1[0], p1[1], p2[0], p2[1], 'F')
  }

  doc.setDrawColor(244, 204, 220)
  doc.setLineWidth(0.14)
  for (let i = 0; i < absPts.length; i++) {
    const p1 = absPts[i]
    const p2 = absPts[(i + 1) % absPts.length]
    doc.line(p1[0], p1[1], p2[0], p2[1])
  }

  drawStarPolygon(doc, x + w * 0.58, y + h * 0.44, 1.2, 0.48, [246, 206, 222])
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(5.0)
  doc.setTextColor(232, 168, 194)
  doc.text('TOGO', x + w * 0.61, y + h * 0.58, { align: 'center' })
}

/**
 * Ruban national ondulé discret tout en bas de la carte (vert / jaune / rouge).
 */
function drawBottomNationalRibbon(doc: jsPDF, cardX: number, cardY: number, cardW: number, cardH: number) {
  const bottomY = cardY + cardH
  const segments = 24
  const segW = cardW / segments

  for (let i = 0; i < segments; i++) {
    const t0 = i / segments
    const x0 = cardX + t0 * cardW
    const leftLift = Math.max(0, 1 - t0 * 5.2)
    const greenH = 1.4 + leftLift * 12.0 + Math.sin(t0 * Math.PI * 2.1) * 0.4
    const yellowH = 1.05 + leftLift * 7.8 + Math.cos(t0 * Math.PI * 1.8) * 0.35
    const redH = 0.7 + leftLift * 3.8 + Math.sin(t0 * Math.PI * 2.4) * 0.25

    doc.setFillColor(0, 108, 62)
    doc.rect(x0, bottomY - greenH, segW + 0.15, greenH, 'F')

    doc.setFillColor(246, 198, 22)
    doc.rect(x0, bottomY - yellowH, segW + 0.15, yellowH, 'F')

    doc.setFillColor(198, 16, 62)
    doc.rect(x0, bottomY - redH, segW + 0.15, redH, 'F')
  }
}

/**
 * Cachet circulaire bleu officiel du modèle IEPP ("ÉTABLISSEMENT SCOLAIRE · TOGO" + livre ouvert).
 */
function drawTogoIeppCircularStamp(doc: jsPDF, cx: number, cy: number, radius: number) {
  const r = 16
  const g = 50
  const b = 158

  doc.setFillColor(255, 255, 255)
  doc.circle(cx, cy, radius, 'F')

  doc.setDrawColor(r, g, b)
  doc.setLineWidth(0.36)
  doc.circle(cx, cy, radius, 'S')
  doc.setLineWidth(0.16)
  doc.circle(cx, cy, radius - 0.5, 'S')
  doc.setLineWidth(0.2)
  doc.circle(cx, cy, radius * 0.62, 'S')

  doc.setFillColor(26, 70, 194)
  doc.roundedRect(cx - radius * 0.36, cy - radius * 0.22, radius * 0.34, radius * 0.42, 0.2, 0.2, 'F')
  doc.roundedRect(cx + radius * 0.02, cy - radius * 0.22, radius * 0.34, radius * 0.42, 0.2, 0.2, 'F')

  drawStarPolygon(doc, cx - radius * 0.77, cy + 0.65, 0.42, 0.16, [r, g, b])
  drawStarPolygon(doc, cx + radius * 0.77, cy + 0.65, 0.42, 0.16, [r, g, b])

  doc.setTextColor(r, g, b)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(3.0)
  doc.text('ETABLISSEMENT SCOLAIRE', cx, cy - radius * 0.69, { align: 'center' })
  doc.setFontSize(3.4)
  doc.text('TOGO', cx, cy + radius * 0.85, { align: 'center' })
}

/**
 * Dessine la façade scolaire pastel en filigrane doux au centre-droit du corps de carte.
 */
function drawSubtleSchoolBuildingBackdrop(doc: jsPDF, cardX: number, cardY: number) {
  const bx = cardX + 49
  const by = cardY + 21.0
  doc.setFillColor(250, 243, 242)
  doc.rect(bx, by + 3.2, 31, 13.0, 'F')
  doc.setFillColor(246, 232, 232)
  doc.triangle(bx - 1.2, by + 3.2, bx + 15.5, by, bx + 32.2, by + 3.2, 'F')
  doc.setFillColor(244, 236, 236)
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 6; c++) {
      doc.rect(bx + 2.2 + c * 4.5, by + 4.8 + r * 4.4, 2.4, 2.8, 'F')
    }
  }
}

/**
 * Dessine le Modèle 2 : Carte d'Identité Scolaire Officielle IEPP / Centre d'écrit (Togo).
 * Format optimisé 94mm × 53.5mm pour planche 10 cartes/page A4.
 */
export function drawTogoIeppIdCardRecto(
  doc: jsPDF,
  data: StudentDocumentData,
  cardX: number,
  cardY: number,
  cardW: number,
  cardH: number,
  assets: TogoCardRenderAssets
) {
  const typo: CardTypographyConfig = {
    ...FALLBACK_TOGO_TYPOGRAPHY,
    ...(data.typography || {}),
  }

  // 1. Fond principal blanc-crème + teinte douce
  doc.setFillColor(255, 253, 249)
  doc.rect(cardX, cardY, cardW, cardH, 'F')

  doc.setFillColor(254, 249, 242)
  doc.rect(cardX + cardW * 0.28, cardY + 14.0, cardW * 0.69, cardH - 17, 'F')

  // Filigrane bâtiment scolaire très discret & carte Togo floutée à droite
  drawSubtleSchoolBuildingBackdrop(doc, cardX, cardY)
  drawTogoSoftWatermarkMap(doc, cardX + 75.5, cardY + 14.5, 16.5, 25.5)

  // Ruban national ondulé tout en bas
  drawBottomNationalRibbon(doc, cardX, cardY, cardW, cardH)

  // Cadre fin de découpe
  doc.setDrawColor(203, 213, 225)
  doc.setLineWidth(0.16)
  doc.rect(cardX, cardY, cardW, cardH, 'S')

  // 2. En-tête : Emblème gauche + Drapeau flottant droite + Bloc central IEPP / École / Centre d'écrit
  if (assets.logoDataUrl) {
    try {
      doc.setFillColor(255, 255, 255)
      doc.circle(cardX + 11.8, cardY + 5.8, 5.1, 'F')
      doc.addImage(assets.logoDataUrl, 'PNG', cardX + 7.2, cardY + 1.2, 9.2, 9.2)
    } catch {
      if (!data.hideFallbackEmblem) {
        drawIeppLaurelBookEmblem(doc, cardX + 11.8, cardY + 5.8, 0.96)
      }
    }
  } else if (!data.hideFallbackEmblem) {
    drawIeppLaurelBookEmblem(doc, cardX + 11.8, cardY + 5.8, 0.96)
  }

  // Drapeau Togolais flottant en haut à droite
  drawWavingTogoFlagTopRight(doc, cardX + 72.2, cardY + 0.4, 21.4, 10.6)

  const headerCenterX = cardX + 46.5

  // Ligne 1 : IEPP (sans DRE, écriture très visible et nette)
  const cleanIepp = sanitizeIeppText(data.inspectionName)
  const ieppText =
    cleanIepp.toUpperCase() === 'IEPP'
      ? 'I  E  P  P'
      : typo.headerOfficial.uppercase
        ? cleanIepp.toUpperCase()
        : cleanIepp

  if (ieppText) {
    doc.setFont(mapFontFamily(typo.headerOfficial.fontFamily), 'bold')
    const fittedIeppPt = fitTextSize(doc, ieppText, 48, 9.3, 6.0)
    doc.setFontSize(fittedIeppPt)
    doc.setTextColor(10, 25, 80)
    doc.text(ieppText, headerCenterX, cardY + 3.35, { align: 'center' })

    const textW = doc.getTextWidth(ieppText)
    const ruleGap = 1.6
    const leftEdge = cardX + 19.5
    const rightEdge = cardX + 70.5
    const leftRuleEnd = headerCenterX - textW / 2 - ruleGap
    const rightRuleStart = headerCenterX + textW / 2 + ruleGap
    doc.setDrawColor(168, 12, 70)
    doc.setLineWidth(0.28)
    if (leftRuleEnd - leftEdge > 2.0) {
      doc.line(leftEdge, cardY + 2.5, leftRuleEnd, cardY + 2.5)
    }
    if (rightEdge - rightRuleStart > 2.0) {
      doc.line(rightRuleStart, cardY + 2.5, rightEdge, cardY + 2.5)
    }
  }

  // Ligne 2 : Bannière arrondie auto-adaptative au Nom de l'établissement (s'étend si long, se rétrécit si court)
  const rawSchoolName = (data.schoolName || 'ÉTABLISSEMENT SCOLAIRE').trim()
  const displaySchoolName = typo.schoolName.uppercase
    ? rawSchoolName.toUpperCase()
    : rawSchoolName

  doc.setFont(mapFontFamily(typo.schoolName.fontFamily), 'bold')
  const maxSchoolPillW = 49.5
  const baseSchoolPt = 7.4 * Math.max(0.85, Math.min(1.15, typo.schoolName.sizeScale || 1))
  const fittedSchoolPt = fitTextSize(doc, displaySchoolName, maxSchoolPillW - 6.0, baseSchoolPt, 4.9)
  doc.setFontSize(fittedSchoolPt)

  const measuredSchoolW = doc.getTextWidth(displaySchoolName)
  const schoolPillW = Math.min(maxSchoolPillW, Math.max(18.0, measuredSchoolW + 6.4))
  const schoolPillX = headerCenterX - schoolPillW / 2
  const schoolPillY = cardY + 4.05
  const schoolPillH = 3.55

  doc.setFillColor(166, 7, 68)
  doc.setDrawColor(124, 4, 48)
  doc.setLineWidth(0.24)
  doc.roundedRect(schoolPillX, schoolPillY, schoolPillW, schoolPillH, 1.75, 1.75, 'FD')

  doc.setTextColor(255, 255, 255)
  doc.text(displaySchoolName, headerCenterX, schoolPillY + 2.48, { align: 'center' })

  // Ligne 3 : Centre d'écrit (texte "Centre d'écrit : ...", pilule adaptée)
  const cleanExamCenter = (data.examCenter || '').trim()
  const centerDisplayText = cleanExamCenter
    ? `Centre d'écrit : ${cleanExamCenter}`
    : "Centre d'écrit : .............................."
  doc.setFont('helvetica', 'bold')
  const maxCenterPillW = 48.0
  fitTextSize(doc, centerDisplayText, maxCenterPillW - 5.2, 5.3, 4.0)
  const measuredCenterW = doc.getTextWidth(centerDisplayText)
  const centerPillW = Math.min(maxCenterPillW, Math.max(24.0, measuredCenterW + 5.6))
  const centerPillX = headerCenterX - centerPillW / 2
  const centerPillY = cardY + 7.95
  const centerPillH = 2.65

  doc.setFillColor(255, 251, 232)
  doc.setDrawColor(214, 155, 26)
  doc.setLineWidth(0.22)
  doc.roundedRect(centerPillX, centerPillY, centerPillW, centerPillH, 1.3, 1.3, 'FD')

  doc.setTextColor(14, 27, 82)
  doc.text(centerDisplayText, headerCenterX, centerPillY + 1.85, { align: 'center' })

  // Ligne 4 : Titre "CARTE D'IDENTITÉ SCOLAIRE" SANS bannière arrondie, plus gros et police designer éditoriale
  const rawBanner = (data.cardBannerTitle || '').trim()
  const bannerText =
    !rawBanner || rawBanner.toUpperCase() === "CARTE D'IDENTITE SCOLAIRE"
      ? "CARTE D'IDENTITÉ SCOLAIRE"
      : rawBanner.toUpperCase()

  const bannerFontFamily = typo.bannerTitle.fontFamily === 'courier' ? 'courier' : 'times'
  doc.setFont(bannerFontFamily, 'bold')
  fitTextSize(doc, bannerText, 64, 9.6, 7.0)
  const bannerY = cardY + 13.75

  // Ombre légère dorée/argentée + texte principal royal navy pour un rendu professionnel
  doc.setTextColor(214, 175, 86)
  doc.text(bannerText, headerCenterX + 0.16, bannerY + 0.16, { align: 'center' })
  doc.setTextColor(8, 27, 88)
  doc.text(bannerText, headerCenterX, bannerY, { align: 'center' })

  // Lignes ornementales fines symétriques sous le titre (pas de bloc fermé)
  const bannerTextW = doc.getTextWidth(bannerText)
  const accentHalfW = Math.min(34, bannerTextW / 2 + 2)
  doc.setDrawColor(198, 148, 30)
  doc.setLineWidth(0.32)
  doc.line(headerCenterX - accentHalfW, bannerY + 0.65, headerCenterX + accentHalfW, bannerY + 0.65)

  // 3. Colonne Gauche : Cadre Photo 100% occupé par la photo (tête + poitrine, sans texte) + Année Scolaire + QR Code
  const photoFrameX = cardX + 3.8
  const photoFrameY = cardY + 15.1
  const photoFrameW = 19.2
  const photoFrameH = 21.6

  doc.setFillColor(255, 255, 255)
  doc.setDrawColor(168, 7, 68)
  doc.setLineWidth(0.42)
  doc.roundedRect(photoFrameX, photoFrameY, photoFrameW, photoFrameH, 1.3, 1.3, 'FD')

  const imgX = photoFrameX + 0.45
  const imgY = photoFrameY + 0.45
  const imgW = photoFrameW - 0.9
  const imgH = photoFrameH - 0.9

  if (assets.photoDataUrl) {
    try {
      doc.addImage(assets.photoDataUrl, 'PNG', imgX, imgY, imgW, imgH)
    } catch {
      drawPhotoSilhouetteFallback(doc, imgX, imgY, imgW, imgH)
    }
  } else {
    drawPhotoSilhouetteFallback(doc, imgX, imgY, imgW, imgH)
  }

  // Pilule Année Scolaire sous la photo
  const yearBoxX = cardX + 3.8
  const yearBoxY = cardY + 37.35
  const yearBoxW = 19.2
  const yearBoxH = 4.75
  doc.setFillColor(255, 250, 224)
  doc.setDrawColor(214, 155, 26)
  doc.setLineWidth(0.3)
  doc.roundedRect(yearBoxX, yearBoxY, yearBoxW, yearBoxH, 1.4, 1.4, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(4.4)
  doc.setTextColor(14, 27, 82)
  doc.text('Année Scolaire', yearBoxX + yearBoxW / 2, yearBoxY + 1.8, { align: 'center' })

  const formattedYear = formatAcademicYearLabel(data.academicYear)
  doc.setFontSize(6.1)
  doc.setTextColor(166, 7, 68)
  doc.text(formattedYear, yearBoxX + yearBoxW / 2, yearBoxY + 3.95, { align: 'center' })

  // QR Code en bas à gauche
  const qrSize = 9.0
  const qrBoxX = cardX + 4.3
  const qrBoxY = cardY + 42.65
  doc.setFillColor(255, 255, 255)
  doc.setDrawColor(148, 163, 184)
  doc.setLineWidth(0.22)
  doc.roundedRect(qrBoxX, qrBoxY, qrSize, qrSize, 0.8, 0.8, 'FD')

  const qrMatrix = generateQrMatrix(
    buildStudentQrPayload({
      matricule: data.matricule,
      lastName: data.lastName,
      firstName: data.firstName,
      className: data.className,
      schoolName: rawSchoolName,
      academicYear: data.academicYear,
      inspectionName: cleanIepp,
    })
  )
  const qrPad = 0.65
  const qrDrawSize = qrSize - qrPad * 2
  const cell = qrDrawSize / qrMatrix.length
  doc.setFillColor(15, 23, 42)
  for (let r = 0; r < qrMatrix.length; r++) {
    for (let c = 0; c < qrMatrix.length; c++) {
      if (qrMatrix[r][c]) {
        doc.rect(
          qrBoxX + qrPad + c * cell,
          qrBoxY + qrPad + r * cell,
          cell + 0.015,
          cell + 0.015,
          'F'
        )
      }
    }
  }

  // 4. Colonne Centrale : Infos élève (PAS de pointillés quand l'info est renseignée ; Classe bien remontée)
  const fieldStartX = cardX + 25.0
  const fieldEndX = cardX + 75.5
  const rowStartY = cardY + 17.5
  const rowStep = 3.22

  const dobText = formatCardDateFr(data.dateOfBirth)
  const birthPlaceText = (data.birthPlace || '').trim()
  const [studentR, studentG, studentB] = parseHexRgb(typo.studentName.color, [15, 23, 42])

  const drawFieldRow = (
    rowIndex: number,
    label: string,
    value: string,
    isProminentName = false
  ) => {
    const ry = rowStartY + rowIndex * rowStep
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6.6)
    doc.setTextColor(14, 27, 82)
    doc.text(label, fieldStartX, ry)

    const labelW = doc.getTextWidth(label)
    const valStartX = fieldStartX + labelW + 1.5
    const maxValW = fieldEndX - valStartX

    const trimmedVal = value.trim()
    if (trimmedVal) {
      // Information renseignée : aucun pointillé dessous ni devant
      doc.setFont(
        mapFontFamily(isProminentName ? typo.studentName.fontFamily : typo.studentDetails.fontFamily),
        isProminentName ? 'bold' : mapFontStyle(typo.studentDetails)
      )
      fitTextSize(doc, trimmedVal, maxValW, isProminentName ? 6.9 : 6.45, 4.8)
      if (isProminentName) {
        doc.setTextColor(studentR, studentG, studentB)
      } else {
        doc.setTextColor(15, 23, 42)
      }
      doc.text(trimmedVal, valStartX, ry)
    } else {
      // Uniquement si le champ est vide : pointillés pour compléter manuellement
      doc.setDrawColor(148, 163, 184)
      doc.setLineWidth(0.18)
      for (let dx = valStartX; dx < fieldEndX; dx += 1.1) {
        doc.circle(dx, ry + 0.25, 0.11, 'F')
      }
    }
  }

  drawFieldRow(0, 'Matricule :', data.matricule || '')
  drawFieldRow(1, 'Nom :', (data.lastName || '').toUpperCase(), true)
  drawFieldRow(2, 'Prénoms :', data.firstName || '', true)
  drawFieldRow(3, 'Date de naissance :', dobText)
  drawFieldRow(4, 'Lieu de naissance :', birthPlaceText)

  // Sexe : afficher automatiquement UNIQUEMENT "Masculin" ou "Féminin" (pas les 2 à la fois)
  const genderCode = (data.gender || '').trim().toUpperCase()
  const sexDisplay =
    genderCode === 'M' || genderCode.startsWith('MASC')
      ? 'Masculin'
      : genderCode === 'F' || genderCode.startsWith('FEM')
        ? 'Féminin'
        : ''
  drawFieldRow(5, 'Sexe :', sexDisplay)

  // Classe remontée bien au-dessus de la zone basse (y ≈ 36.8mm, jamais sur le ruban du bas)
  drawFieldRow(6, 'Classe :', data.className || '', true)

  // 5. Pied de carte : Directement le Nom du directeur & Signature des paramètres (SANS libellés ni petits cadres/pointillés)
  const directorText = (data.directorName || '').trim()
  if (directorText) {
    doc.setFont(mapFontFamily(typo.footerInfo.fontFamily), 'bold')
    fitTextSize(doc, directorText, 31, 6.4, 4.6)
    doc.setTextColor(14, 27, 82)
    doc.text(directorText, cardX + 38.5, cardY + 46.8, { align: 'center' })
  }

  if (assets.signatureDataUrl) {
    try {
      doc.addImage(assets.signatureDataUrl, 'PNG', cardX + 56.5, cardY + 41.2, 20.5, 7.6)
    } catch {
      // Ignorer si l'image de signature est invalide
    }
  }

  // Cachet circulaire à droite
  const stampCx = cardX + 85.0
  const stampCy = cardY + 45.6
  const stampR = 5.4
  if (assets.stampDataUrl) {
    try {
      doc.addImage(assets.stampDataUrl, 'PNG', stampCx - stampR, stampCy - stampR, stampR * 2, stampR * 2)
    } catch {
      if (!data.hideFallbackStamp) {
        drawTogoIeppCircularStamp(doc, stampCx, stampCy, stampR)
      }
    }
  } else if (!data.hideFallbackStamp) {
    drawTogoIeppCircularStamp(doc, stampCx, stampCy, stampR)
  }
}

function drawPhotoSilhouetteFallback(doc: jsPDF, x: number, y: number, w: number, h: number) {
  doc.setFillColor(241, 245, 249)
  doc.rect(x, y, w, h, 'F')
  doc.setFillColor(186, 195, 208)
  doc.circle(x + w / 2, y + h * 0.34, w * 0.24, 'F')
  doc.ellipse(x + w / 2, y + h * 0.88, w * 0.42, h * 0.28, 'F')
}
