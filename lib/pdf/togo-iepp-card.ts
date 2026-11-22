import QRCode from 'qrcode'
import type jsPDF from 'jspdf'
import type {
  CardFontFamily,
  CardTypographyConfig,
  CardZoneTextStyle,
  StudentDocumentData,
} from '@/lib/pdf/student-documents'

export type CardTemplateId = 'classic' | 'togo_iepp'

export const TOGO_DEFAULT_ZONE_COLORS = {
  schoolName: '#FFFFFF',
  headerOfficial: '#0A1950',
  examCenter: '#0E1B52',
  bannerTitle: '#006B38',
  studentMatricule: '#1D4ED8',
  studentName: '#C8102E',
  studentDetails: '#0F172A',
  studentClass: '#007A33',
  footerInfo: '#99121C',
} as const

export const FALLBACK_TOGO_TYPOGRAPHY: CardTypographyConfig = {
  schoolName: {
    fontFamily: 'helvetica',
    sizeScale: 1,
    bold: true,
    italic: false,
    underline: false,
    uppercase: true,
    color: TOGO_DEFAULT_ZONE_COLORS.schoolName,
  },
  headerOfficial: {
    fontFamily: 'helvetica',
    sizeScale: 1,
    bold: true,
    italic: false,
    underline: false,
    uppercase: true,
    color: TOGO_DEFAULT_ZONE_COLORS.headerOfficial,
  },
  examCenter: {
    fontFamily: 'helvetica',
    sizeScale: 1,
    bold: true,
    italic: false,
    underline: false,
    uppercase: false,
    color: TOGO_DEFAULT_ZONE_COLORS.examCenter,
  },
  bannerTitle: {
    fontFamily: 'times',
    sizeScale: 1,
    bold: true,
    italic: false,
    underline: false,
    uppercase: true,
    color: TOGO_DEFAULT_ZONE_COLORS.bannerTitle,
  },
  bannerBgColor: '#FFFFFF',
  studentMatricule: {
    fontFamily: 'helvetica',
    sizeScale: 1,
    bold: true,
    italic: false,
    underline: false,
    uppercase: false,
    color: TOGO_DEFAULT_ZONE_COLORS.studentMatricule,
  },
  studentName: {
    fontFamily: 'helvetica',
    sizeScale: 1,
    bold: true,
    italic: false,
    underline: false,
    uppercase: true,
    color: TOGO_DEFAULT_ZONE_COLORS.studentName,
  },
  studentDetails: {
    fontFamily: 'helvetica',
    sizeScale: 1,
    bold: true,
    italic: false,
    underline: false,
    uppercase: false,
    color: TOGO_DEFAULT_ZONE_COLORS.studentDetails,
  },
  studentClass: {
    fontFamily: 'helvetica',
    sizeScale: 1,
    bold: true,
    italic: false,
    underline: false,
    uppercase: false,
    color: TOGO_DEFAULT_ZONE_COLORS.studentClass,
  },
  footerInfo: {
    fontFamily: 'helvetica',
    sizeScale: 1,
    bold: true,
    italic: false,
    underline: false,
    uppercase: false,
    color: TOGO_DEFAULT_ZONE_COLORS.footerInfo,
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
 * Formate l'affichage de l'IEPP sur la carte (invite à compléter si non défini par l'utilisateur).
 */
export function formatIeppHeaderDisplay(raw?: string | null, uppercase = true): string {
  const clean = sanitizeIeppText(raw)
  if (!clean || clean.toUpperCase() === 'IEPP') {
    return 'IEPP : .........................'
  }
  return uppercase ? clean.toUpperCase() : clean
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
 * Construit le contenu lisible affiché lorsqu'on scanne le QR Code d'un élève (inclut les contacts si disponibles).
 */
export function buildStudentQrPayload(data: {
  matricule: string
  lastName: string
  firstName: string
  dateOfBirth?: string | null
  birthPlace?: string | null
  gender?: string | null
  className: string
  schoolName: string
  academicYear: string
  inspectionName?: string | null
  examCenter?: string | null
  schoolPhone?: string | null
  directorPhone?: string | null
}): string {
  const clean = (v?: string | null) => (v || '').trim().replace(/\r?\n/g, ' ')
  const dob = formatCardDateFr(data.dateOfBirth)
  const bp = clean(data.birthPlace)
  const birthLine = dob ? `Ne(e): ${dob}${bp ? ` a ${bp}` : ''}` : bp ? `Lieu: ${bp}` : ''
  const g = (data.gender || '').trim().toUpperCase()
  const sex =
    g === 'M' || g.startsWith('MASC')
      ? 'Masculin'
      : g === 'F' || g.startsWith('FEM')
        ? 'Feminin'
        : ''
  const iepp = sanitizeIeppText(data.inspectionName)
  const center = clean(data.examCenter)
  const sPhone = clean(data.schoolPhone)
  const dPhone = clean(data.directorPhone)

  return [
    "CARTE D'IDENTITE SCOLAIRE",
    `Mle: ${clean(data.matricule) || 'N/A'}`,
    `Nom: ${clean(data.lastName).toUpperCase()}`,
    `Prenoms: ${clean(data.firstName)}`,
    birthLine,
    sex ? `Sexe: ${sex}` : '',
    `Classe: ${clean(data.className)}`,
    `Ecole: ${clean(data.schoolName)}`,
    iepp && iepp.toUpperCase() !== 'IEPP' ? `IEPP: ${iepp}` : '',
    center ? `Centre: ${center}` : '',
    sPhone ? `Tel Ecole: ${sPhone}` : '',
    dPhone && dPhone !== sPhone ? `Tel Dir: ${dPhone}` : '',
    `Annee: ${formatAcademicYearLabel(data.academicYear)}`,
  ]
    .filter(Boolean)
    .join('\n')
}

/**
 * Génère une matrice booléenne de QR Code (correction L pour des modules plus larges et très faciles à scanner à l'impression).
 */
export function generateQrMatrix(value: string): boolean[][] {
  try {
    const qr = QRCode.create(value || 'SCOGESTIA', { errorCorrectionLevel: 'L' })
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

function drawCenteredTextWithOptionalLetters(
  doc: jsPDF,
  text: string,
  cx: number,
  y: number,
  defaultColorHex: string,
  fallbackRgb: [number, number, number],
  letterColors?: string[]
) {
  const hasCustom =
    Array.isArray(letterColors) && letterColors.some((c) => Boolean(c && c.trim()))
  if (!hasCustom || !text) {
    const [r, g, b] = parseHexRgb(defaultColorHex, fallbackRgb)
    doc.setTextColor(r, g, b)
    doc.text(text, cx, y, { align: 'center' })
    return
  }

  const chars = Array.from(text)
  const widths = chars.map((ch) => doc.getTextWidth(ch))
  const totalW = widths.reduce((sum, w) => sum + w, 0)
  let curX = cx - totalW / 2
  chars.forEach((ch, idx) => {
    const colHex = letterColors[idx] || defaultColorHex
    const [r, g, b] = parseHexRgb(colHex, fallbackRgb)
    doc.setTextColor(r, g, b)
    doc.text(ch, curX, y)
    curX += widths[idx]
  })
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
 * Dessine une bande ondulée parfaitement lisse (courbe de Bézier cubique vectorielle sans escaliers).
 */
function drawSmoothFlagStripe(
  doc: jsPDF,
  x: number,
  yTop: number,
  yBottom: number,
  w: number,
  rgb: [number, number, number]
) {
  doc.setFillColor(rgb[0], rgb[1], rgb[2])
  const c1x = x + w * 0.34
  const c2x = x + w * 0.67
  const endShift = 0.25
  const dip = 0.85
  const crest = -0.65

  doc
    .moveTo(x, yTop)
    .curveTo(c1x, yTop + dip, c2x, yTop + crest, x + w, yTop + endShift)
    .lineTo(x + w, yBottom + endShift)
    .curveTo(c2x, yBottom + crest, c1x, yBottom + dip, x, yBottom)
    .close()
    .fill()
}

/**
 * Drapeau Togolais flottant en haut à droite tracé en courbes vectorielles lisses (zéro zig-zag à l'impression).
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

  // Légère superposition (+0.08mm) entre bandes pour éviter tout micro-filet blanc à l'impression
  colors.forEach((col, i) => {
    const y0 = y + i * stripeH
    const y1 = y + (i + 1) * stripeH + (i < 4 ? 0.08 : 0)
    drawSmoothFlagStripe(doc, x, y0, y1, w, col)
  })

  // Canton rouge lisse épousant exactement la vague supérieure du drapeau
  const cantonW = w * 0.43
  const cantonBottom = y + stripeH * 3 + 0.05
  doc.setFillColor(210, 16, 52)
  doc
    .moveTo(x, y)
    .curveTo(
      x + cantonW * 0.45,
      y + 0.42,
      x + cantonW * 0.82,
      y + 0.45,
      x + cantonW,
      y + 0.28
    )
    .lineTo(x + cantonW, cantonBottom + 0.28)
    .curveTo(
      x + cantonW * 0.82,
      cantonBottom + 0.45,
      x + cantonW * 0.45,
      cantonBottom + 0.42,
      x,
      cantonBottom
    )
    .close()
    .fill()

  // Étoile blanche à 5 branches nette centrée dans le canton rouge
  drawStarPolygon(
    doc,
    x + cantonW * 0.49,
    y + (cantonBottom - y) * 0.5 + 0.22,
    Math.min(cantonW, cantonBottom - y) * 0.34,
    Math.min(cantonW, cantonBottom - y) * 0.14,
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
 * Ruban national ondulé tout en bas tracé en vraies courbes de Bézier vectorielles lisses (zéro marches d'escalier).
 */
function drawBottomNationalRibbon(doc: jsPDF, cardX: number, cardY: number, cardW: number, cardH: number) {
  const px = (nx: number) => cardX + (nx / 940) * cardW
  const py = (ny: number) => cardY + (ny / 535) * cardH

  // 1. Vague verte extérieure
  doc.setFillColor(0, 108, 62)
  doc
    .moveTo(px(0), py(382))
    .curveTo(px(18), py(472), px(86), py(508), px(230), py(517))
    .curveTo(px(425), py(529), px(675), py(512), px(940), py(522))
    .lineTo(px(940), py(535))
    .lineTo(px(0), py(535))
    .close()
    .fill()

  // 2. Vague jaune or intermédiaire
  doc.setFillColor(246, 198, 22)
  doc
    .moveTo(px(0), py(418))
    .curveTo(px(24), py(490), px(104), py(515), px(265), py(522))
    .curveTo(px(470), py(532), px(700), py(516), px(940), py(526))
    .lineTo(px(940), py(535))
    .lineTo(px(0), py(535))
    .close()
    .fill()

  // 3. Vague rouge carmin inférieure
  doc.setFillColor(198, 16, 62)
  doc
    .moveTo(px(0), py(460))
    .curveTo(px(38), py(508), px(130), py(522), px(308), py(527))
    .curveTo(px(518), py(533), px(740), py(522), px(940), py(530))
    .lineTo(px(940), py(535))
    .lineTo(px(0), py(535))
    .close()
    .fill()
}

/**
 * Cachet circulaire bleu officiel agrandi ("ÉTABLISSEMENT SCOLAIRE · TOGO" + livre ouvert).
 */
function drawTogoIeppCircularStamp(doc: jsPDF, cx: number, cy: number, radius: number) {
  const r = 16
  const g = 50
  const b = 158

  doc.setFillColor(255, 255, 255)
  doc.circle(cx, cy, radius, 'F')

  doc.setDrawColor(r, g, b)
  doc.setLineWidth(0.38)
  doc.circle(cx, cy, radius, 'S')
  doc.setLineWidth(0.18)
  doc.circle(cx, cy, radius - 0.58, 'S')
  doc.setLineWidth(0.22)
  doc.circle(cx, cy, radius * 0.62, 'S')

  doc.setFillColor(26, 70, 194)
  doc.roundedRect(cx - radius * 0.36, cy - radius * 0.22, radius * 0.34, radius * 0.42, 0.22, 0.22, 'F')
  doc.roundedRect(cx + radius * 0.02, cy - radius * 0.22, radius * 0.34, radius * 0.42, 0.22, 0.22, 'F')

  drawStarPolygon(doc, cx - radius * 0.77, cy + 0.65, 0.48, 0.18, [r, g, b])
  drawStarPolygon(doc, cx + radius * 0.77, cy + 0.65, 0.48, 0.18, [r, g, b])

  doc.setTextColor(r, g, b)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(3.3)
  doc.text('ETABLISSEMENT SCOLAIRE', cx, cy - radius * 0.68, { align: 'center' })
  doc.setFontSize(3.8)
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
    examCenter: {
      ...FALLBACK_TOGO_TYPOGRAPHY.examCenter!,
      ...(data.typography?.examCenter || {}),
    },
    studentMatricule: {
      ...FALLBACK_TOGO_TYPOGRAPHY.studentMatricule!,
      ...(data.typography?.studentMatricule || {}),
    },
    studentClass: {
      ...FALLBACK_TOGO_TYPOGRAPHY.studentClass!,
      ...(data.typography?.studentClass || {}),
    },
  }

  // 1. Fond principal blanc-crème + teinte douce
  doc.setFillColor(255, 253, 249)
  doc.rect(cardX, cardY, cardW, cardH, 'F')

  doc.setFillColor(254, 249, 242)
  doc.rect(cardX + cardW * 0.28, cardY + 14.0, cardW * 0.69, cardH - 17, 'F')

  // Filigrane bâtiment scolaire très discret & carte Togo floutée à droite
  drawSubtleSchoolBuildingBackdrop(doc, cardX, cardY)
  drawTogoSoftWatermarkMap(doc, cardX + 76.0, cardY + 14.5, 16.5, 25.5)

  // Ruban national ondulé tout en bas (courbes lisses)
  drawBottomNationalRibbon(doc, cardX, cardY, cardW, cardH)

  // Cadre fin de découpe
  doc.setDrawColor(203, 213, 225)
  doc.setLineWidth(0.16)
  doc.rect(cardX, cardY, cardW, cardH, 'S')

  // 2. En-tête : Logo agrandi gauche + Drapeau flottant lisse droite + Bloc central
  if (assets.logoDataUrl) {
    try {
      doc.setFillColor(255, 255, 255)
      doc.circle(cardX + 11.4, cardY + 6.4, 6.0, 'F')
      doc.addImage(assets.logoDataUrl, 'PNG', cardX + 5.7, cardY + 0.7, 11.4, 11.4)
    } catch {
      if (!data.hideFallbackEmblem) {
        drawIeppLaurelBookEmblem(doc, cardX + 11.4, cardY + 6.4, 1.1)
      }
    }
  } else if (!data.hideFallbackEmblem) {
    drawIeppLaurelBookEmblem(doc, cardX + 11.4, cardY + 6.4, 1.1)
  }

  // Drapeau Togolais lisse en haut à droite
  drawWavingTogoFlagTopRight(doc, cardX + 72.0, cardY + 0.5, 21.6, 10.6)

  const headerCenterX = cardX + 46.8

  // Ligne 1 : IEPP
  const ieppDisplayText = formatIeppHeaderDisplay(
    data.inspectionName,
    typo.headerOfficial.uppercase
  )
  doc.setFont(mapFontFamily(typo.headerOfficial.fontFamily), mapFontStyle(typo.headerOfficial))
  const ieppBasePt = 9.3 * Math.max(0.75, Math.min(1.25, typo.headerOfficial.sizeScale || 1))
  fitTextSize(doc, ieppDisplayText, 47, ieppBasePt, 5.8)
  drawCenteredTextWithOptionalLetters(
    doc,
    ieppDisplayText,
    headerCenterX,
    cardY + 3.35,
    typo.headerOfficial.color,
    [10, 25, 80],
    typo.letterColors?.inspectionName
  )

  const ieppTextW = doc.getTextWidth(ieppDisplayText)
  const ruleGap = 1.6
  const leftEdge = cardX + 19.5
  const rightEdge = cardX + 70.5
  const leftRuleEnd = headerCenterX - ieppTextW / 2 - ruleGap
  const rightRuleStart = headerCenterX + ieppTextW / 2 + ruleGap
  doc.setDrawColor(168, 12, 70)
  doc.setLineWidth(0.28)
  if (leftRuleEnd - leftEdge > 2.0) {
    doc.line(leftEdge, cardY + 2.5, leftRuleEnd, cardY + 2.5)
  }
  if (rightEdge - rightRuleStart > 2.0) {
    doc.line(rightRuleStart, cardY + 2.5, rightEdge, cardY + 2.5)
  }

  // Ligne 2 : Bannière arrondie auto-adaptative au Nom de l'établissement
  const rawSchoolName = (data.schoolName || 'ÉTABLISSEMENT SCOLAIRE').trim()
  const displaySchoolName = typo.schoolName.uppercase
    ? rawSchoolName.toUpperCase()
    : rawSchoolName

  doc.setFont(mapFontFamily(typo.schoolName.fontFamily), mapFontStyle(typo.schoolName))
  const maxSchoolPillW = 49.5
  const baseSchoolPt = 7.4 * Math.max(0.8, Math.min(1.2, typo.schoolName.sizeScale || 1))
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

  drawCenteredTextWithOptionalLetters(
    doc,
    displaySchoolName,
    headerCenterX,
    schoolPillY + 2.48,
    typo.schoolName.color,
    [255, 255, 255],
    typo.letterColors?.schoolName
  )

  // Ligne 3 : Centre d'écrit
  const examStyle = typo.examCenter || FALLBACK_TOGO_TYPOGRAPHY.examCenter!
  const cleanExamCenter = (data.examCenter || '').trim()
  const centerValue = examStyle.uppercase ? cleanExamCenter.toUpperCase() : cleanExamCenter
  const centerDisplayText = centerValue
    ? `Centre d'écrit : ${centerValue}`
    : "Centre d'écrit : ........................"
  doc.setFont(mapFontFamily(examStyle.fontFamily), mapFontStyle(examStyle))
  const maxCenterPillW = 49.5
  const centerBasePt = 6.4 * Math.max(0.75, Math.min(1.25, examStyle.sizeScale || 1))
  fitTextSize(doc, centerDisplayText, maxCenterPillW - 5.2, centerBasePt, 4.6)
  const measuredCenterW = doc.getTextWidth(centerDisplayText)
  const centerPillW = Math.min(maxCenterPillW, Math.max(26.0, measuredCenterW + 6.0))
  const centerPillX = headerCenterX - centerPillW / 2
  const centerPillY = cardY + 7.9
  const centerPillH = 3.05

  doc.setFillColor(255, 251, 232)
  doc.setDrawColor(214, 155, 26)
  doc.setLineWidth(0.22)
  doc.roundedRect(centerPillX, centerPillY, centerPillW, centerPillH, 1.5, 1.5, 'FD')

  drawCenteredTextWithOptionalLetters(
    doc,
    centerDisplayText,
    headerCenterX,
    centerPillY + 2.15,
    examStyle.color,
    [14, 27, 82],
    typo.letterColors?.examCenter
  )

  // Ligne 4 : Titre "CARTE D'IDENTITÉ SCOLAIRE" style prestige
  const rawBanner = (data.cardBannerTitle || '').trim()
  const bannerBase =
    !rawBanner || rawBanner.toUpperCase() === "CARTE D'IDENTITE SCOLAIRE"
      ? "CARTE D'IDENTITÉ SCOLAIRE"
      : rawBanner
  const bannerText = typo.bannerTitle.uppercase ? bannerBase.toUpperCase() : bannerBase

  const bannerFontFamily =
    typo.bannerTitle.fontFamily === 'helvetica' || typo.bannerTitle.fontFamily === 'verdana'
      ? 'helvetica'
      : typo.bannerTitle.fontFamily === 'courier'
        ? 'courier'
        : 'times'
  doc.setFont(bannerFontFamily, typo.bannerTitle.italic ? 'bolditalic' : 'bold')
  const bannerStartPt = 9.7 * Math.max(0.75, Math.min(1.25, typo.bannerTitle.sizeScale || 1))
  fitTextSize(doc, bannerText, 64, bannerStartPt, 6.8)
  const bannerY = cardY + 14.0

  doc.setTextColor(218, 175, 76)
  doc.text(bannerText, headerCenterX + 0.16, bannerY + 0.16, { align: 'center' })
  drawCenteredTextWithOptionalLetters(
    doc,
    bannerText,
    headerCenterX,
    bannerY,
    typo.bannerTitle.color,
    [0, 107, 56],
    typo.letterColors?.bannerTitle
  )

  const bannerTextW = doc.getTextWidth(bannerText)
  const accentHalfW = Math.min(34, bannerTextW / 2 + 2.5)
  doc.setDrawColor(198, 148, 30)
  doc.setLineWidth(0.32)
  doc.line(headerCenterX - accentHalfW, bannerY + 0.62, headerCenterX + accentHalfW, bannerY + 0.62)
  doc.setFillColor(198, 148, 30)
  doc.circle(headerCenterX - accentHalfW - 0.8, bannerY + 0.62, 0.28, 'F')
  doc.circle(headerCenterX + accentHalfW + 0.8, bannerY + 0.62, 0.28, 'F')

  // 3. Colonne Gauche : Cadre Photo 100% photo + Année Scolaire
  const photoFrameX = cardX + 3.6
  const photoFrameY = cardY + 15.1
  const photoFrameW = 19.0
  const photoFrameH = 21.4

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

  const yearBoxX = cardX + 3.6
  const yearBoxY = cardY + 37.25
  const yearBoxW = 19.0
  const yearBoxH = 4.7
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
  doc.text(formattedYear, yearBoxX + yearBoxW / 2, yearBoxY + 3.9, { align: 'center' })

  // 4. Colonne Centrale : Infos élève
  const fieldStartX = cardX + 24.4
  const fieldEndX = cardX + 66.0
  const rowStartY = cardY + 17.6
  const rowStep = 3.22

  const dobText = formatCardDateFr(data.dateOfBirth)
  const birthPlaceText = (data.birthPlace || '').trim()

  const matriculeZone = typo.studentMatricule || FALLBACK_TOGO_TYPOGRAPHY.studentMatricule!
  const classZone = typo.studentClass || FALLBACK_TOGO_TYPOGRAPHY.studentClass!

  const drawFieldRow = (
    rowIndex: number,
    label: string,
    value: string,
    zoneStyle: CardZoneTextStyle,
    fallbackRgb: [number, number, number],
    defaultBasePt = 6.45
  ) => {
    const ry = rowStartY + rowIndex * rowStep
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6.55)
    doc.setTextColor(14, 27, 82)
    doc.text(label, fieldStartX, ry)

    const labelW = doc.getTextWidth(label)
    const valStartX = fieldStartX + labelW + 1.4
    const maxValW = fieldEndX - valStartX

    const trimmedVal = value.trim()
    if (trimmedVal) {
      const displayVal = zoneStyle.uppercase ? trimmedVal.toUpperCase() : trimmedVal
      doc.setFont(mapFontFamily(zoneStyle.fontFamily), mapFontStyle(zoneStyle))
      const valBasePt = defaultBasePt * Math.max(0.75, Math.min(1.25, zoneStyle.sizeScale || 1))
      fitTextSize(doc, displayVal, maxValW, valBasePt, 4.7)
      const [vr, vg, vb] = parseHexRgb(zoneStyle.color, fallbackRgb)
      doc.setTextColor(vr, vg, vb)
      doc.text(displayVal, valStartX, ry)
    } else {
      doc.setDrawColor(148, 163, 184)
      doc.setLineWidth(0.18)
      for (let dx = valStartX; dx < fieldEndX; dx += 1.1) {
        doc.circle(dx, ry + 0.25, 0.11, 'F')
      }
    }
  }

  drawFieldRow(0, 'Matricule :', data.matricule || '', matriculeZone, [29, 78, 216], 6.65)
  drawFieldRow(1, 'Nom :', (data.lastName || '').toUpperCase(), typo.studentName, [200, 16, 46], 6.85)
  drawFieldRow(2, 'Prénoms :', data.firstName || '', typo.studentName, [200, 16, 46], 6.75)
  drawFieldRow(3, 'Date de naissance :', dobText, typo.studentDetails, [15, 23, 42], 6.4)
  drawFieldRow(4, 'Lieu de naissance :', birthPlaceText, typo.studentDetails, [15, 23, 42], 6.4)

  const genderCode = (data.gender || '').trim().toUpperCase()
  const sexDisplay =
    genderCode === 'M' || genderCode.startsWith('MASC')
      ? 'Masculin'
      : genderCode === 'F' || genderCode.startsWith('FEM')
        ? 'Féminin'
        : ''
  drawFieldRow(5, 'Sexe :', sexDisplay, typo.studentDetails, [15, 23, 42], 6.45)
  drawFieldRow(6, 'Classe :', data.className || '', classZone, [0, 122, 51], 6.8)

  // 5. QR Code ultra net (sans débordement + fusion horizontale des modules pour zéro aspect "tout noir")
  const qrSize = 9.8
  const qrBoxX = cardX + 66.8
  const qrBoxY = cardY + 26.8
  doc.setFillColor(255, 255, 255)
  doc.setDrawColor(148, 163, 184)
  doc.setLineWidth(0.22)
  doc.roundedRect(qrBoxX, qrBoxY, qrSize, qrSize, 0.8, 0.8, 'FD')

  const qrMatrix = generateQrMatrix(
    buildStudentQrPayload({
      matricule: data.matricule,
      lastName: data.lastName,
      firstName: data.firstName,
      dateOfBirth: data.dateOfBirth,
      birthPlace: data.birthPlace,
      gender: data.gender,
      className: data.className,
      schoolName: rawSchoolName,
      academicYear: data.academicYear,
      inspectionName: sanitizeIeppText(data.inspectionName),
      examCenter: cleanExamCenter,
      schoolPhone: data.schoolPhone,
      directorPhone: data.directorPhone,
    })
  )
  const qrPad = 0.75
  const qrDrawSize = qrSize - qrPad * 2
  const cell = qrDrawSize / qrMatrix.length
  doc.setFillColor(15, 23, 42)
  for (let r = 0; r < qrMatrix.length; r++) {
    let c = 0
    while (c < qrMatrix.length) {
      if (qrMatrix[r][c]) {
        const startC = c
        while (c < qrMatrix.length && qrMatrix[r][c]) {
          c++
        }
        const runW = (c - startC) * cell
        doc.rect(qrBoxX + qrPad + startC * cell, qrBoxY + qrPad + r * cell, runW, cell, 'F')
      } else {
        c++
      }
    }
  }

  // 6. Pied de carte bien ordonné : Nom du directeur (Rouge Bordeaux) & Signature descendus harmonieusement
  const directorText = (data.directorName || '').trim()
  if (directorText) {
    doc.setFont(mapFontFamily(typo.footerInfo.fontFamily), mapFontStyle(typo.footerInfo))
    fitTextSize(doc, directorText, 32, 6.45, 4.6)
    const [dirR, dirG, dirB] = parseHexRgb(typo.footerInfo.color, [153, 18, 28])
    doc.setTextColor(dirR, dirG, dirB)
    doc.text(directorText, cardX + 39.5, cardY + 47.6, { align: 'center' })
  }

  if (assets.signatureDataUrl) {
    try {
      doc.addImage(assets.signatureDataUrl, 'PNG', cardX + 55.6, cardY + 42.0, 18.8, 6.8)
    } catch {
      // Ignorer si l'image de signature est invalide
    }
  }

  // Cachet circulaire grand format aligné avec le bas de signature et marge sûre anti-découpe
  const stampCx = cardX + 83.4
  const stampCy = cardY + 42.6
  const stampR = 6.5
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
