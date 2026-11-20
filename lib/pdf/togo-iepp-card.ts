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
    color: '#0E1B52',
  },
  bannerTitle: {
    fontFamily: 'helvetica',
    sizeScale: 1,
    bold: true,
    italic: false,
    underline: false,
    uppercase: true,
    color: '#FFFFFF',
  },
  bannerBgColor: '#071E58',
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
    clean(data.inspectionName) || 'IEPP',
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
    pt = Number((pt - 0.25).toFixed(2))
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
    const angle = (-Math.PI / 2) + (i * Math.PI) / 5
    const r = i % 2 === 0 ? outerR : innerR
    pts.push([cx + Math.cos(angle) * r, cy + Math.sin(angle) * r])
  }
  doc.setFillColor(fillRgb[0], fillRgb[1], fillRgb[2])
  // Dessine les triangles reliés au centre pour un rendu vectoriel propre sans dépendre de path2d
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
  // Branches de laurier dorées gauche & droite
  doc.setDrawColor(196, 146, 28)
  doc.setFillColor(214, 165, 36)
  doc.setLineWidth(0.24 * scale)

  const leafAnglesLeft = [-2.25, -2.55, -2.85, 3.05, 2.75, 2.45, 2.1]
  leafAnglesLeft.forEach((ang, idx) => {
    const r = (4.6 - idx * 0.08) * scale
    const lx = cx + Math.cos(ang) * r
    const ly = cy + Math.sin(ang) * r
    doc.ellipse(lx, ly, 0.72 * scale, 0.34 * scale, 'F')
  })

  const leafAnglesRight = [-0.89, -0.59, -0.29, 0.09, 0.39, 0.69, 1.04]
  leafAnglesRight.forEach((ang, idx) => {
    const r = (4.6 - idx * 0.08) * scale
    const lx = cx + Math.cos(ang) * r
    const ly = cy + Math.sin(ang) * r
    doc.ellipse(lx, ly, 0.72 * scale, 0.34 * scale, 'F')
  })

  // Ruban tricolore courbé sous le livre (Vert / Jaune / Rouge)
  doc.setFillColor(0, 114, 58)
  doc.roundedRect(cx - 3.6 * scale, cy + 3.1 * scale, 7.2 * scale, 0.85 * scale, 0.3, 0.3, 'F')
  doc.setFillColor(248, 198, 22)
  doc.rect(cx - 3.1 * scale, cy + 3.55 * scale, 6.2 * scale, 0.6 * scale, 'F')
  doc.setFillColor(206, 17, 46)
  doc.rect(cx - 2.6 * scale, cy + 4.0 * scale, 5.2 * scale, 0.55 * scale, 'F')

  // Étoile supérieure bleu marine
  drawStarPolygon(doc, cx, cy - 3.25 * scale, 1.05 * scale, 0.42 * scale, [14, 34, 98])

  // Livre ouvert bleu marine (pages gauches & droites)
  doc.setDrawColor(14, 34, 98)
  doc.setFillColor(255, 255, 255)
  doc.setLineWidth(0.32 * scale)
  doc.roundedRect(cx - 3.1 * scale, cy - 1.55 * scale, 3.05 * scale, 3.35 * scale, 0.25, 0.25, 'FD')
  doc.roundedRect(cx + 0.05 * scale, cy - 1.55 * scale, 3.05 * scale, 3.35 * scale, 0.25, 0.25, 'FD')

  // Lignes de texte sur les pages
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
    // Légère courbe en vague via segments juxtaposés
    const steps = 6
    const segW = w / steps
    for (let s = 0; s < steps; s++) {
      const waveY = Math.sin((s / steps) * Math.PI * 1.4) * 0.42
      doc.rect(x + s * segW, sy + waveY, segW + 0.15, stripeH + 0.12, 'F')
    }
  })

  // Ombre légère sur un pli pour effet drapeau en tissu
  doc.setFillColor(0, 82, 46)
  doc.rect(x + w * 0.55, y + 0.15, w * 0.14, stripeH, 'F')

  // Canton rouge haut-gauche du drapeau
  const cantonW = w * 0.42
  const cantonH = stripeH * 3
  doc.setFillColor(210, 16, 52)
  doc.rect(x, y, cantonW, cantonH, 'F')

  // Étoile blanche à 5 branches centrée dans le canton rouge
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
 * Silhouette rose de la carte du Togo + étoile + libellé "TOGO" à droite de la carte.
 */
function drawTogoPinkMapSilhouette(doc: jsPDF, x: number, y: number, w: number, h: number) {
  // Coordonnées normalisées (0..1) du contour simplifié du Togo (Nord -> Sud)
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

  // Remplissage polygonal par éventail depuis le centroïde
  const cx = x + w * 0.56
  const cy = y + h * 0.52
  doc.setFillColor(249, 206, 222)
  for (let i = 0; i < absPts.length; i++) {
    const p1 = absPts[i]
    const p2 = absPts[(i + 1) % absPts.length]
    doc.triangle(cx, cy, p1[0], p1[1], p2[0], p2[1], 'F')
  }

  // Contour rose soutenu
  doc.setDrawColor(214, 84, 132)
  doc.setLineWidth(0.24)
  for (let i = 0; i < absPts.length; i++) {
    const p1 = absPts[i]
    const p2 = absPts[(i + 1) % absPts.length]
    doc.line(p1[0], p1[1], p2[0], p2[1])
  }

  // Étoile rose + libellé TOGO au centre
  drawStarPolygon(doc, x + w * 0.58, y + h * 0.44, 1.35, 0.55, [224, 128, 164])
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(5.5)
  doc.setTextColor(214, 84, 132)
  doc.text('TOGO', x + w * 0.61, y + h * 0.58, { align: 'center' })
}

/**
 * Ruban national ondulé en bas de carte (vert / jaune / rouge) fidèle au modèle IEPP.
 */
function drawBottomNationalRibbon(doc: jsPDF, cardX: number, cardY: number, cardW: number, cardH: number) {
  const bottomY = cardY + cardH
  const segments = 24
  const segW = cardW / segments

  for (let i = 0; i < segments; i++) {
    const t0 = i / segments
    const x0 = cardX + t0 * cardW
    // Courbe ascendante sur le côté gauche puis vague douce le long du bas
    const leftLift = Math.max(0, 1 - t0 * 5.2)
    const greenH = 1.65 + leftLift * 14.5 + Math.sin(t0 * Math.PI * 2.1) * 0.55
    const yellowH = 1.25 + leftLift * 9.5 + Math.cos(t0 * Math.PI * 1.8) * 0.45
    const redH = 0.85 + leftLift * 4.5 + Math.sin(t0 * Math.PI * 2.4) * 0.35

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
  doc.setLineWidth(0.38)
  doc.circle(cx, cy, radius, 'S')
  doc.setLineWidth(0.18)
  doc.circle(cx, cy, radius - 0.55, 'S')
  doc.setLineWidth(0.22)
  doc.circle(cx, cy, radius * 0.62, 'S')

  // Livre ouvert bleu au centre du cachet
  doc.setFillColor(26, 70, 194)
  doc.roundedRect(cx - radius * 0.36, cy - radius * 0.22, radius * 0.34, radius * 0.42, 0.2, 0.2, 'F')
  doc.roundedRect(cx + radius * 0.02, cy - radius * 0.22, radius * 0.34, radius * 0.42, 0.2, 0.2, 'F')

  // Deux petites étoiles bleues gauche/droite
  drawStarPolygon(doc, cx - radius * 0.77, cy + 0.65, 0.45, 0.18, [r, g, b])
  drawStarPolygon(doc, cx + radius * 0.77, cy + 0.65, 0.45, 0.18, [r, g, b])

  doc.setTextColor(r, g, b)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(3.15)
  doc.text('ETABLISSEMENT SCOLAIRE', cx, cy - radius * 0.69, { align: 'center' })
  doc.setFontSize(3.55)
  doc.text('TOGO', cx, cy + radius * 0.85, { align: 'center' })
}

/**
 * Dessine la façade scolaire pastel en filigrane doux au centre-droit du corps de carte.
 */
function drawSubtleSchoolBuildingBackdrop(doc: jsPDF, cardX: number, cardY: number) {
  const bx = cardX + 49
  const by = cardY + 21.5
  // Corps principal très pâle
  doc.setFillColor(249, 241, 240)
  doc.rect(bx, by + 3.2, 31, 13.5, 'F')
  // Toit en pente léger
  doc.setFillColor(244, 228, 228)
  doc.triangle(bx - 1.2, by + 3.2, bx + 15.5, by, bx + 32.2, by + 3.2, 'F')
  // Rangées de fenêtres en filigrane très discret
  doc.setFillColor(242, 232, 232)
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 6; c++) {
      doc.rect(bx + 2.2 + c * 4.5, by + 4.8 + r * 4.6, 2.4, 3.0, 'F')
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

  // 1. Fond principal blanc-crème + repère de découpe fin
  doc.setFillColor(255, 253, 249)
  doc.rect(cardX, cardY, cardW, cardH, 'F')

  // Légère teinte chaude sur la partie centrale / droite
  doc.setFillColor(254, 249, 242)
  doc.rect(cardX + cardW * 0.28, cardY + 14.5, cardW * 0.69, cardH - 18, 'F')

  // Filigrane bâtiment scolaire très discret pour garder une excellente lisibilité
  drawSubtleSchoolBuildingBackdrop(doc, cardX, cardY)

  // Carte rose du Togo à droite
  drawTogoPinkMapSilhouette(doc, cardX + 75.5, cardY + 14.0, 16.5, 26.5)

  // Ruban national ondulé en bas de carte
  drawBottomNationalRibbon(doc, cardX, cardY, cardW, cardH)

  // Cadre extérieur léger de découpe
  doc.setDrawColor(203, 213, 225)
  doc.setLineWidth(0.16)
  doc.rect(cardX, cardY, cardW, cardH, 'S')

  // 2. En-tête : Emblème gauche + Drapeau flottant droite + Bloc central IEPP / École / Centre
  if (assets.logoDataUrl) {
    try {
      doc.setFillColor(255, 255, 255)
      doc.circle(cardX + 12.2, cardY + 6.2, 5.4, 'F')
      doc.addImage(assets.logoDataUrl, 'PNG', cardX + 7.4, cardY + 1.4, 9.6, 9.6)
    } catch {
      if (!data.hideFallbackEmblem) {
        drawIeppLaurelBookEmblem(doc, cardX + 12.2, cardY + 6.2, 1.0)
      }
    }
  } else if (!data.hideFallbackEmblem) {
    drawIeppLaurelBookEmblem(doc, cardX + 12.2, cardY + 6.2, 1.0)
  }

  // Drapeau Togolais flottant en haut à droite
  drawWavingTogoFlagTopRight(doc, cardX + 71.2, cardY + 0.4, 22.4, 11.2)

  const headerCenterX = cardX + 46.8

  // Ligne 1 : IEPP (personnalisable, ex: IEPP LACS-OUEST, IEPP LACS-EST...)
  const rawIepp = (data.inspectionName || '').trim()
  const ieppText =
    rawIepp.toUpperCase() === 'IEPP'
      ? 'I  E  P  P'
      : typo.headerOfficial.uppercase
        ? rawIepp.toUpperCase()
        : rawIepp

  if (ieppText) {
    doc.setFont(mapFontFamily(typo.headerOfficial.fontFamily), 'bold')
    const fittedIeppPt = fitTextSize(doc, ieppText, 44, 8.2, 5.2)
    doc.setFontSize(fittedIeppPt)
    doc.setTextColor(14, 27, 82)
    doc.text(ieppText, headerCenterX, cardY + 3.45, { align: 'center' })

    const textW = doc.getTextWidth(ieppText)
    const ruleGap = 1.6
    const leftEdge = cardX + 20.5
    const rightEdge = cardX + 70.0
    const leftRuleEnd = headerCenterX - textW / 2 - ruleGap
    const rightRuleStart = headerCenterX + textW / 2 + ruleGap
    doc.setDrawColor(168, 12, 70)
    doc.setLineWidth(0.24)
    if (leftRuleEnd - leftEdge > 2.2) {
      doc.line(leftEdge, cardY + 2.65, leftRuleEnd, cardY + 2.65)
    }
    if (rightEdge - rightRuleStart > 2.2) {
      doc.line(rightRuleStart, cardY + 2.65, rightEdge, cardY + 2.65)
    }
  }

  // Ligne 2 : Pilule Magenta-Bordeaux — Nom de l'établissement (très lisible en blanc gras)
  const pillW = 47.6
  const pillX = headerCenterX - pillW / 2
  const pillY = cardY + 4.15
  const pillH = 3.55
  doc.setFillColor(166, 7, 68)
  doc.setDrawColor(124, 4, 48)
  doc.setLineWidth(0.24)
  doc.roundedRect(pillX, pillY, pillW, pillH, 1.75, 1.75, 'FD')

  const rawSchoolName = (data.schoolName || 'ÉTABLISSEMENT SCOLAIRE').trim()
  const displaySchoolName = typo.schoolName.uppercase
    ? rawSchoolName.toUpperCase()
    : rawSchoolName
  doc.setFont(mapFontFamily(typo.schoolName.fontFamily), 'bold')
  const fittedSchoolPt = fitTextSize(
    doc,
    displaySchoolName,
    pillW - 4.2,
    7.1 * Math.max(0.8, Math.min(1.15, typo.schoolName.sizeScale || 1)),
    4.6
  )
  doc.setFontSize(fittedSchoolPt)
  doc.setTextColor(255, 255, 255)
  doc.text(displaySchoolName, headerCenterX, pillY + 2.5, { align: 'center' })

  // Ligne 3 : Pilule Crème-Or — Centre d'écrit (à compléter si vide ou rempli)
  const centerPillW = 41.8
  const centerPillX = headerCenterX - centerPillW / 2
  const centerPillY = cardY + 8.05
  const centerPillH = 2.65
  doc.setFillColor(255, 251, 232)
  doc.setDrawColor(214, 155, 26)
  doc.setLineWidth(0.24)
  doc.roundedRect(centerPillX, centerPillY, centerPillW, centerPillH, 1.3, 1.3, 'FD')

  const cleanExamCenter = (data.examCenter || '').trim()
  const centerDisplayText = cleanExamCenter
    ? `Centre : ${cleanExamCenter}`
    : 'Centre : ........................................'
  doc.setFont('helvetica', 'bold')
  fitTextSize(doc, centerDisplayText, centerPillW - 4, 5.1, 3.8)
  doc.setTextColor(14, 27, 82)
  doc.text(centerDisplayText, headerCenterX, centerPillY + 1.85, { align: 'center' })

  // Ligne 4 : Grand bandeau Bleu Marine & Or "CARTE D'IDENTITÉ SCOLAIRE"
  const bannerY = cardY + 11.2
  const bannerH = 3.3
  const bannerW = 56.5
  const bannerX = headerCenterX - bannerW / 2

  // Ailes dorées fines à gauche et à droite du bandeau
  doc.setDrawColor(212, 160, 32)
  doc.setLineWidth(0.28)
  doc.line(cardX + 3.2, bannerY + bannerH / 2, bannerX, bannerY + bannerH / 2)
  doc.line(bannerX + bannerW, bannerY + bannerH / 2, cardX + cardW - 3.2, bannerY + bannerH / 2)

  doc.setFillColor(7, 30, 88)
  doc.setDrawColor(229, 184, 59)
  doc.setLineWidth(0.36)
  doc.roundedRect(bannerX, bannerY, bannerW, bannerH, 1.6, 1.6, 'FD')

  const rawBanner = (data.cardBannerTitle || '').trim()
  const bannerText =
    !rawBanner || rawBanner.toUpperCase() === "CARTE D'IDENTITE SCOLAIRE"
      ? "CARTE D'IDENTITÉ SCOLAIRE"
      : rawBanner.toUpperCase()
  doc.setFont(mapFontFamily(typo.bannerTitle.fontFamily), 'bold')
  fitTextSize(doc, bannerText, bannerW - 5, 7.2, 5.2)
  doc.setTextColor(255, 255, 255)
  doc.text(bannerText, headerCenterX, bannerY + 2.35, { align: 'center' })

  // 3. Colonne Gauche : Cadre Photo + "PHOTO DE L'ÉLÈVE" + Année Scolaire + QR Code
  const photoFrameX = cardX + 3.8
  const photoFrameY = cardY + 15.35
  const photoFrameW = 19.2
  const photoFrameH = 21.0
  const photoCaptionH = 4.3

  // Fond blanc & bordure magenta du cadre photo
  doc.setFillColor(255, 255, 255)
  doc.setDrawColor(168, 7, 68)
  doc.setLineWidth(0.42)
  doc.roundedRect(photoFrameX, photoFrameY, photoFrameW, photoFrameH, 1.5, 1.5, 'FD')

  const imgX = photoFrameX + 0.65
  const imgY = photoFrameY + 0.65
  const imgW = photoFrameW - 1.3
  const imgH = photoFrameH - photoCaptionH - 0.9

  if (assets.photoDataUrl) {
    try {
      doc.addImage(assets.photoDataUrl, 'PNG', imgX, imgY, imgW, imgH)
    } catch {
      drawPhotoSilhouetteFallback(doc, imgX, imgY, imgW, imgH)
    }
  } else {
    drawPhotoSilhouetteFallback(doc, imgX, imgY, imgW, imgH)
  }

  // Bandeau magenta en bas du cadre photo : "PHOTO DE L'ÉLÈVE"
  const capY = photoFrameY + photoFrameH - photoCaptionH
  doc.setFillColor(168, 7, 68)
  doc.roundedRect(photoFrameX + 0.45, capY, photoFrameW - 0.9, photoCaptionH - 0.35, 0.8, 0.8, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(4.45)
  doc.setTextColor(255, 255, 255)
  doc.text('PHOTO', photoFrameX + photoFrameW / 2, capY + 1.75, { align: 'center' })
  doc.text("DE L'ÉLÈVE", photoFrameX + photoFrameW / 2, capY + 3.45, { align: 'center' })

  // Pilule Année Scolaire sous la photo
  const yearBoxX = cardX + 3.8
  const yearBoxY = cardY + 37.05
  const yearBoxW = 19.2
  const yearBoxH = 4.95
  doc.setFillColor(255, 250, 224)
  doc.setDrawColor(214, 155, 26)
  doc.setLineWidth(0.32)
  doc.roundedRect(yearBoxX, yearBoxY, yearBoxW, yearBoxH, 1.5, 1.5, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(4.5)
  doc.setTextColor(14, 27, 82)
  doc.text('Année Scolaire', yearBoxX + yearBoxW / 2, yearBoxY + 1.9, { align: 'center' })

  const formattedYear = formatAcademicYearLabel(data.academicYear)
  doc.setFontSize(6.2)
  doc.setTextColor(166, 7, 68)
  doc.text(formattedYear, yearBoxX + yearBoxW / 2, yearBoxY + 4.15, { align: 'center' })

  // QR Code en bas à gauche (sur carré blanc)
  const qrSize = 9.4
  const qrBoxX = cardX + 4.3
  const qrBoxY = cardY + 42.7
  doc.setFillColor(255, 255, 255)
  doc.setDrawColor(148, 163, 184)
  doc.setLineWidth(0.24)
  doc.roundedRect(qrBoxX, qrBoxY, qrSize, qrSize, 0.8, 0.8, 'FD')

  const qrMatrix = generateQrMatrix(
    buildStudentQrPayload({
      matricule: data.matricule,
      lastName: data.lastName,
      firstName: data.firstName,
      className: data.className,
      schoolName: rawSchoolName,
      academicYear: data.academicYear,
      inspectionName: rawIepp,
    })
  )
  const qrPad = 0.7
  const qrDrawSize = qrSize - qrPad * 2
  const cell = qrDrawSize / qrMatrix.length
  doc.setFillColor(15, 23, 42)
  for (let r = 0; r < qrMatrix.length; r++) {
    for (let c = 0; c < qrMatrix.length; c++) {
      if (qrMatrix[r][c]) {
        doc.rect(qrBoxX + qrPad + c * cell, qrBoxY + qrPad + r * cell, cell + 0.015, cell + 0.015, 'F')
      }
    }
  }

  // 4. Colonne Centrale : Champs automatiques de l'élève
  const fieldStartX = cardX + 25.0
  const fieldEndX = cardX + 75.5
  const rowStartY = cardY + 18.0
  const rowStep = 3.72

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
    doc.setFontSize(6.65)
    doc.setTextColor(14, 27, 82)
    doc.text(label, fieldStartX, ry)

    const labelW = doc.getTextWidth(label)
    const valStartX = fieldStartX + labelW + 1.5
    const maxValW = fieldEndX - valStartX

    // Ligne pointillée discrète sous la zone de réponse
    doc.setDrawColor(100, 116, 139)
    doc.setLineWidth(0.2)
    for (let dx = valStartX; dx < fieldEndX; dx += 1.05) {
      doc.circle(dx, ry + 0.35, 0.12, 'F')
    }

    if (value.trim()) {
      doc.setFont(
        mapFontFamily(isProminentName ? typo.studentName.fontFamily : typo.studentDetails.fontFamily),
        isProminentName ? 'bold' : mapFontStyle(typo.studentDetails)
      )
      fitTextSize(doc, value, maxValW, isProminentName ? 6.9 : 6.5, 4.8)
      if (isProminentName) {
        doc.setTextColor(studentR, studentG, studentB)
      } else {
        doc.setTextColor(15, 23, 42)
      }
      doc.text(value, valStartX + 0.4, ry - 0.1)
    }
  }

  drawFieldRow(0, 'Matricule :', (data.matricule || '').trim())
  drawFieldRow(1, 'Nom :', (data.lastName || '').trim().toUpperCase(), true)
  drawFieldRow(2, 'Prénoms :', (data.firstName || '').trim(), true)
  drawFieldRow(3, 'Date de naissance :', dobText)
  drawFieldRow(4, 'Lieu de naissance :', birthPlaceText)

  // Ligne 5 : Sexe : [ ] Masculin   [ ] Féminin (cases à cocher automatiques)
  const sexRowY = rowStartY + 5 * rowStep
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6.65)
  doc.setTextColor(14, 27, 82)
  doc.text('Sexe :', fieldStartX, sexRowY)

  const genderCode = (data.gender || '').trim().toUpperCase()
  const isMale = genderCode === 'M' || genderCode.startsWith('MASC')
  const isFemale = genderCode === 'F' || genderCode.startsWith('FEM')

  const drawSexCheckbox = (boxX: number, label: string, checked: boolean) => {
    const boxY = sexRowY - 2.15
    const boxS = 2.5
    doc.setFillColor(checked ? 236 : 255, checked ? 253 : 255, checked ? 245 : 255)
    doc.setDrawColor(14, 27, 82)
    doc.setLineWidth(0.28)
    doc.roundedRect(boxX, boxY, boxS, boxS, 0.4, 0.4, 'FD')

    if (checked) {
      doc.setDrawColor(0, 122, 51)
      doc.setLineWidth(0.42)
      doc.line(boxX + 0.5, boxY + 1.3, boxX + 1.05, boxY + 1.95)
      doc.line(boxX + 1.05, boxY + 1.95, boxX + 2.05, boxY + 0.55)
    }

    doc.setFont('helvetica', checked ? 'bold' : 'normal')
    doc.setFontSize(6.35)
    doc.setTextColor(14, 27, 82)
    doc.text(label, boxX + boxS + 1.4, sexRowY)
  }

  drawSexCheckbox(fieldStartX + 10.6, 'Masculin', isMale)
  drawSexCheckbox(fieldStartX + 27.6, 'Féminin', isFemale)

  drawFieldRow(6, 'Classe :', (data.className || '').trim(), true)

  // 5. Pied de carte : Nom du Chef d'établissement + Signature du Directeur + Cachet
  const chiefX = cardX + 16.0
  const chiefY = cardY + 43.3
  const chiefW = 34.4
  const chiefH = 8.4

  doc.setFillColor(255, 253, 249)
  doc.setDrawColor(158, 5, 63)
  doc.setLineWidth(0.28)
  doc.roundedRect(chiefX, chiefY, chiefW, chiefH, 1.5, 1.5, 'FD')

  // Bandeau haut magenta dans le bloc Chef d'établissement
  doc.setFillColor(168, 7, 68)
  doc.roundedRect(chiefX + 0.25, chiefY + 0.25, chiefW - 0.5, 3.35, 1.1, 1.1, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(4.75)
  doc.setTextColor(255, 255, 255)
  doc.text("Nom du Chef d'établissement", chiefX + chiefW / 2, chiefY + 2.45, { align: 'center' })

  const directorText = (data.directorName || '').trim()
  if (directorText) {
    doc.setFont(mapFontFamily(typo.footerInfo.fontFamily), 'bold')
    fitTextSize(doc, directorText, chiefW - 3.2, 6.2, 4.4)
    doc.setTextColor(14, 27, 82)
    doc.text(directorText, chiefX + chiefW / 2, chiefY + 6.75, { align: 'center' })
  } else {
    doc.setDrawColor(100, 116, 139)
    doc.setLineWidth(0.2)
    for (let dx = chiefX + 2.4; dx < chiefX + chiefW - 2.4; dx += 1.05) {
      doc.circle(dx, chiefY + 6.9, 0.12, 'F')
    }
  }

  // Encadré Signature du Directeur (droite)
  const sigBoxX = cardX + 52.0
  const sigBoxY = cardY + 42.9
  const sigBoxW = 26.8
  const sigBoxH = 9.2

  doc.setFillColor(255, 253, 249)
  doc.setDrawColor(214, 155, 26)
  doc.setLineWidth(0.28)
  doc.roundedRect(sigBoxX, sigBoxY, sigBoxW, sigBoxH, 1.5, 1.5, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(4.75)
  doc.setTextColor(14, 27, 82)
  doc.text('Signature du Directeur', sigBoxX + sigBoxW / 2, sigBoxY + 2.15, { align: 'center' })

  if (assets.signatureDataUrl) {
    try {
      doc.addImage(assets.signatureDataUrl, 'PNG', sigBoxX + 4.4, sigBoxY + 2.5, 17.5, 6.0)
    } catch {
      // Ignorer si l'image est invalide
    }
  }

  // Cachet circulaire à cheval sur le bord droit du bloc signature
  const stampCx = cardX + 85.4
  const stampCy = cardY + 46.8
  const stampR = 5.6
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
  doc.circle(x + w / 2, y + h * 0.36, w * 0.24, 'F')
  doc.ellipse(x + w / 2, y + h * 0.88, w * 0.38, h * 0.24, 'F')
}
