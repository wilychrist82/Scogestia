import jsPDF from 'jspdf'

export type CardFontFamily =
  | 'times'
  | 'helvetica'
  | 'courier'
  | 'georgia'
  | 'palatino'
  | 'verdana'

export interface CardZoneTextStyle {
  fontFamily: CardFontFamily
  sizeScale: number // 0.75 à 1.45 (1 = normal)
  bold: boolean
  italic: boolean
  underline: boolean
  uppercase: boolean
  color: string // Hex ex: '#B41218'
}

export interface CardTypographyConfig {
  schoolName: CardZoneTextStyle
  headerOfficial: CardZoneTextStyle
  bannerTitle: CardZoneTextStyle
  bannerBgColor: string
  studentName: CardZoneTextStyle
  studentDetails: CardZoneTextStyle
  footerInfo: CardZoneTextStyle
  letterColors?: Record<string, string[]>
}

export const DEFAULT_CARD_TYPOGRAPHY: CardTypographyConfig = {
  schoolName: {
    fontFamily: 'times',
    sizeScale: 1,
    bold: true,
    italic: false,
    underline: false,
    uppercase: true,
    color: '#B41218',
  },
  headerOfficial: {
    fontFamily: 'times',
    sizeScale: 1,
    bold: true,
    italic: false,
    underline: false,
    uppercase: false,
    color: '#0F1D5F',
  },
  bannerTitle: {
    fontFamily: 'times',
    sizeScale: 1,
    bold: true,
    italic: true,
    underline: true,
    uppercase: true,
    color: '#122AB9',
  },
  bannerBgColor: '#FDE0C6',
  studentName: {
    fontFamily: 'times',
    sizeScale: 1,
    bold: true,
    italic: false,
    underline: false,
    uppercase: false,
    color: '#99121C',
  },
  studentDetails: {
    fontFamily: 'times',
    sizeScale: 1,
    bold: true,
    italic: false,
    underline: false,
    uppercase: false,
    color: '#0F172A',
  },
  footerInfo: {
    fontFamily: 'times',
    sizeScale: 1,
    bold: true,
    italic: true,
    underline: false,
    uppercase: false,
    color: '#A5181C',
  },
  letterColors: {
    ministryAcronym: ['#0F172A', '#0F172A', '#DC2626', '#F59E0B', '#1D4ED8'],
  },
}

export interface StudentDocumentData {
  studentId: string
  matricule: string
  firstName: string
  lastName: string
  dateOfBirth?: string | null
  birthPlace?: string | null
  gender?: string | null
  bloodGroup?: string | null
  className: string
  classLevel?: string | null
  parentPhone?: string | null
  address?: string | null
  avatarUrl?: string | null
  schoolName: string
  schoolCity?: string | null
  schoolPhone?: string | null
  schoolEmail?: string | null
  academicYear: string
  directorName?: string | null
  schoolLogoUrl?: string | null
  schoolStampUrl?: string | null
  schoolSignatureUrl?: string | null
  inspectionName?: string | null
  examCenter?: string | null
  ministryAcronym?: string | null
  republicTitle?: string | null
  republicMotto?: string | null
  cardBannerTitle?: string | null
  examCenterLabel?: string | null
  hideFallbackEmblem?: boolean
  hideFallbackStamp?: boolean
  themeBackgroundUrl?: string | null
  typography?: CardTypographyConfig | null
}

/**
 * Convertit n'importe quelle URL d'image (PNG, JPG, WebP, DataURL) en PNG Base64 compatible jsPDF.
 * Si `transparentWhiteAndCrop` est activé (pour les captures de cachets et signatures),
 * supprime automatiquement le fond blanc papier et recadre au plus près du dessin.
 */
async function loadImageAsPngDataUrl(
  url?: string | null,
  options?: { transparentWhiteAndCrop?: boolean }
): Promise<string | null> {
  if (!url || typeof window === 'undefined') return null
  return new Promise((resolve) => {
    const img = new Image()
    if (!url.startsWith('data:')) {
      img.crossOrigin = 'anonymous'
    }
    const timeout = setTimeout(() => resolve(null), 6500)

    img.onload = () => {
      clearTimeout(timeout)
      try {
        const w = img.naturalWidth || 300
        const h = img.naturalHeight || 300
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(null)
          return
        }
        ctx.drawImage(img, 0, 0, w, h)

        if (options?.transparentWhiteAndCrop) {
          const imgData = ctx.getImageData(0, 0, w, h)
          const d = imgData.data
          let minX = w
          let minY = h
          let maxX = 0
          let maxY = 0
          let foundInk = false

          for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
              const idx = (y * w + x) * 4
              const r = d[idx]
              const g = d[idx + 1]
              const b = d[idx + 2]
              const a = d[idx + 3]

              if (a > 0 && r > 234 && g > 234 && b > 234) {
                d[idx + 3] = 0
              } else if (a > 25) {
                foundInk = true
                if (x < minX) minX = x
                if (y < minY) minY = y
                if (x > maxX) maxX = x
                if (y > maxY) maxY = y
              }
            }
          }

          ctx.putImageData(imgData, 0, 0)

          if (foundInk && maxX > minX && maxY > minY) {
            const pad = 4
            const cropX = Math.max(0, minX - pad)
            const cropY = Math.max(0, minY - pad)
            const cropW = Math.min(w - cropX, maxX - minX + 1 + pad * 2)
            const cropH = Math.min(h - cropY, maxY - minY + 1 + pad * 2)
            const cropped = document.createElement('canvas')
            cropped.width = cropW
            cropped.height = cropH
            const croppedCtx = cropped.getContext('2d')
            if (croppedCtx) {
              croppedCtx.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH)
              resolve(cropped.toDataURL('image/png'))
              return
            }
          }
        }

        resolve(canvas.toDataURL('image/png'))
      } catch {
        resolve(url.startsWith('data:image/') ? url : null)
      }
    }

    img.onerror = () => {
      clearTimeout(timeout)
      resolve(url.startsWith('data:image/') ? url : null)
    }

    img.src = url
  })
}

/**
 * Charge une image de thème (arrière-plan de carte) et l'adapte au format horizontal de la carte (94x53.5mm)
 * avec un voile de lisibilité calibré au centre pour que les textes (Nom, Prénoms, École...) ressortent parfaitement.
 */
async function loadCardThemeAsPngDataUrl(url?: string | null): Promise<string | null> {
  if (!url || typeof window === 'undefined') return null
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    const timeout = setTimeout(() => resolve(null), 4500)

    img.onload = () => {
      clearTimeout(timeout)
      try {
        const targetW = 940
        const targetH = 535
        const canvas = document.createElement('canvas')
        canvas.width = targetW
        canvas.height = targetH
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(null)
          return
        }

        // Fond blanc de base
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, targetW, targetH)

        // Dessiner l'image du thème sur toute la surface intérieure de la carte
        ctx.drawImage(img, 0, 0, targetW, targetH)

        // Voile léger global (28%) pour adoucir les contrastes forts du thème
        ctx.fillStyle = 'rgba(255, 255, 255, 0.28)'
        ctx.fillRect(0, 0, targetW, targetH)

        // Halo central doux derrière les écritures d'en-tête et d'état civil pour une lisibilité parfaite à l'impression
        const grad = ctx.createRadialGradient(
          targetW * 0.58,
          targetH * 0.52,
          targetH * 0.08,
          targetW * 0.58,
          targetH * 0.52,
          targetW * 0.52
        )
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.62)')
        grad.addColorStop(0.65, 'rgba(255, 255, 255, 0.38)')
        grad.addColorStop(1, 'rgba(255, 255, 255, 0.08)')
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, targetW, targetH)

        resolve(canvas.toDataURL('image/png'))
      } catch {
        resolve(null)
      }
    }

    img.onerror = () => {
      clearTimeout(timeout)
      resolve(null)
    }

    img.src = url
  })
}
/**
 * Détecte si la classe est une classe d'examen officiel (CEPD, BEPC, BAC 1, BAC 2)
 */
export function detectOfficialExamLabel(className?: string | null, classLevel?: string | null): string | null {
  const combined = `${className || ''} ${classLevel || ''}`.toLowerCase()
  if (/\bcm\s*2\b/.test(combined)) return 'EXAMEN : CEPD'
  if (/\b(3e|3ème|3eme|troisieme|troisième)\b/.test(combined)) return 'EXAMEN : BEPC'
  if (/\b(1ere|1ère|premiere|première)\b/.test(combined)) return 'EXAMEN : BAC 1'
  if (/\b(tle|terminale|term)\b/.test(combined)) return 'EXAMEN : BAC 2'
  return null
}

function saveOrSharePdf(doc: jsPDF, filename: string, title: string) {
  try {
    const isNativeMobile =
      typeof window !== 'undefined' &&
      Boolean((window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.())
    if (isNativeMobile && typeof navigator !== 'undefined' && navigator.share) {
      const pdfBlob = doc.output('blob')
      const pdfFile = new File([pdfBlob], filename, { type: 'application/pdf' })
      if (!navigator.canShare || navigator.canShare({ files: [pdfFile] })) {
        navigator
          .share({
            title,
            text: title,
            files: [pdfFile],
          })
          .catch(() => {
            doc.save(filename)
          })
        return
      }
    }
  } catch {
    // Fallback sur doc.save
  }
  doc.save(filename)
}

/**
 * Dessine un cachet circulaire officiel vectoriel si l'école n'a pas encore uploadé d'image de cachet
 */
function drawOfficialVectorStamp(doc: jsPDF, centerX: number, centerY: number, radius: number, schoolName: string, city?: string | null) {
  doc.setDrawColor(29, 78, 216) // Bleu cachet officiel
  doc.setLineWidth(0.45)
  doc.circle(centerX, centerY, radius, 'S')
  doc.setLineWidth(0.2)
  doc.circle(centerX, centerY, radius - 1.2, 'S')

  doc.setTextColor(29, 78, 216)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(radius > 8 ? 5.2 : 3.8)
  const shortSchool = schoolName.toUpperCase().slice(0, 22)
  doc.text(shortSchool, centerX, centerY - radius * 0.35, { align: 'center' })

  doc.setFontSize(radius > 8 ? 4.8 : 3.5)
  doc.text('LA DIRECTION', centerX, centerY + 0.8, { align: 'center' })

  if (city) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(radius > 8 ? 4.2 : 3.2)
    doc.text(city.toUpperCase().slice(0, 16), centerX, centerY + radius * 0.48, { align: 'center' })
  }
}

/**
 * Dessine un mini QR-Code / Matrice de sécurité vectoriel déterministe basé sur le matricule
 */
function drawSecurityMatrixCode(doc: jsPDF, x: number, y: number, size: number, seedText: string) {
  const cells = 11
  const cellSize = size / cells
  doc.setFillColor(255, 255, 255)
  doc.setDrawColor(15, 23, 42)
  doc.setLineWidth(0.2)
  doc.rect(x - 0.8, y - 0.8, size + 1.6, size + 1.6, 'FD')

  doc.setFillColor(15, 23, 42)
  const isFinder = (r: number, c: number) =>
    (r < 3 && c < 3) || (r < 3 && c >= cells - 3) || (r >= cells - 3 && c < 3)

  let hash = 2166136261
  for (let i = 0; i < seedText.length; i++) {
    hash ^= seedText.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }

  for (let r = 0; r < cells; r++) {
    for (let c = 0; c < cells; c++) {
      if (isFinder(r, c)) {
        doc.rect(x + c * cellSize, y + r * cellSize, cellSize, cellSize, 'F')
      } else {
        const bit = ((hash >>> ((r * cells + c) % 28)) ^ (r * 7 + c * 13)) & 1
        if (bit === 1) {
          doc.rect(x + c * cellSize, y + r * cellSize, cellSize, cellSize, 'F')
        }
      }
    }
  }
}

/**
 * Génère un Certificat de Scolarité officiel au format A4 (avec Logo, Cachet et Signature)
 */
export async function generateSchoolCertificatePDF(data: StudentDocumentData) {
  const [logoDataUrl, stampDataUrl, signatureDataUrl, photoDataUrl] = await Promise.all([
    loadImageAsPngDataUrl(data.schoolLogoUrl),
    loadImageAsPngDataUrl(data.schoolStampUrl),
    loadImageAsPngDataUrl(data.schoolSignatureUrl),
    loadImageAsPngDataUrl(data.avatarUrl),
  ])

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const today = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
  const refNumber = `CS-${data.academicYear.replace(/[^0-9]/g, '').slice(0, 4)}-${data.matricule}`

  // Cadre institutionnel double
  doc.setDrawColor(6, 95, 70) // #065F46
  doc.setLineWidth(1.2)
  doc.rect(12, 12, 186, 273)
  doc.setLineWidth(0.3)
  doc.rect(14.5, 14.5, 181, 268)

  // Bandeau supérieur
  doc.setFillColor(6, 95, 70)
  doc.rect(14.5, 14.5, 181, 30, 'F')

  if (logoDataUrl) {
    try {
      doc.setFillColor(255, 255, 255)
      doc.roundedRect(18, 17.5, 22, 22, 2, 2, 'F')
      doc.addImage(logoDataUrl, 'PNG', 19, 18.5, 20, 20)
    } catch {
      // Ignore erreur image
    }
  }

  doc.setTextColor(209, 250, 229)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.text('RÉPUBLIQUE TOGOLAISE — Travail • Liberté • Patrie', 105, 21, { align: 'center' })

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15.5)
  doc.text(data.schoolName.toUpperCase(), 105, 29.5, { align: 'center' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  const subHeader = [
    data.schoolCity ? `Ville : ${data.schoolCity}` : null,
    data.schoolPhone ? `Tél : ${data.schoolPhone}` : null,
    `Année académique : ${data.academicYear}`,
  ]
    .filter(Boolean)
    .join('  •  ')
  doc.text(subHeader, 105, 38, { align: 'center' })

  // Référence et date
  doc.setTextColor(80, 80, 80)
  doc.setFontSize(9.5)
  doc.text(`Réf : ${refNumber}`, 22, 55)
  doc.text(`${data.schoolCity || 'Fait'}, le ${today}`, 188, 55, { align: 'right' })

  // Titre principal
  doc.setFillColor(240, 253, 244)
  doc.setDrawColor(16, 185, 129)
  doc.setLineWidth(0.5)
  doc.roundedRect(35, 66, 140, 18, 3, 3, 'FD')

  doc.setTextColor(6, 95, 70)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text('CERTIFICAT DE SCOLARITÉ', 105, 78, { align: 'center' })

  // Corps du certificat
  doc.setTextColor(30, 41, 59)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11.5)
  doc.text(
    `Le Chef d'Établissement de ${data.schoolName.toUpperCase()} certifie par la présente que :`,
    22,
    100
  )

  // Encadré Identité de l'élève (+ Photo passeport à droite si présente)
  doc.setFillColor(248, 250, 252)
  doc.setDrawColor(203, 213, 225)
  doc.roundedRect(22, 108, 166, 70, 3, 3, 'FD')

  if (photoDataUrl) {
    try {
      doc.setDrawColor(6, 95, 70)
      doc.setLineWidth(0.4)
      doc.rect(154, 114, 28, 36)
      doc.addImage(photoDataUrl, 'PNG', 154.5, 114.5, 27, 35)
    } catch {
      // Ignore
    }
  }

  const startY = 120
  const lineSpacing = 10.5
  const examBadge = detectOfficialExamLabel(data.className, data.classLevel)
  const rows: [string, string][] = [
    ['Nom et Prénoms :', `${data.lastName.toUpperCase()} ${data.firstName}`],
    ['N° Matricule :', data.matricule],
    [
      'Date et lieu de naissance :',
      `${data.dateOfBirth ? new Date(data.dateOfBirth).toLocaleDateString('fr-FR') : 'Non renseignée'}${
        data.birthPlace ? ` à ${data.birthPlace}` : ''
      }`,
    ],
    ['Sexe :', data.gender === 'F' ? 'Féminin' : data.gender === 'M' ? 'Masculin' : 'Non renseigné'],
    ['Classe fréquentée :', `${data.className || 'Non assignée'}${examBadge ? ` (${examBadge})` : ''}`],
    ['Année scolaire :', data.academicYear],
  ]

  rows.forEach(([label, value], idx) => {
    const y = startY + idx * lineSpacing
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 116, 139)
    doc.text(label, 28, y)

    doc.setFont('helvetica', 'bold')
    doc.setTextColor(15, 23, 42)
    doc.text(value, 86, y)
  })

  // Mention légale de fréquentation
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11.5)
  doc.setTextColor(30, 41, 59)
  const attestationText =
    `Est régulièrement inscrit(e) dans les registres de notre établissement pour le compte de l'année académique ${data.academicYear} et suit assidûment les cours dans la classe de ${data.className}.\n\n` +
    `En foi de quoi, le présent certificat lui est délivré pour servir et valoir ce que de droit.`
  const splitText = doc.splitTextToSize(attestationText, 166)
  doc.text(splitText, 22, 192)

  // QR Code de contrôle en bas à gauche
  drawSecurityMatrixCode(doc, 24, 230, 22, `${data.schoolName}|${data.matricule}|${data.academicYear}`)
  doc.setFontSize(7.5)
  doc.setTextColor(100, 116, 139)
  doc.text(`Code contrôle : ${data.matricule}`, 24, 256)

  // Bloc Signature & Cachet Officiel (droite)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(15, 23, 42)
  doc.text('Le Chef d\'Établissement', 150, 226, { align: 'center' })

  if (stampDataUrl) {
    try {
      doc.addImage(stampDataUrl, 'PNG', 122, 230, 28, 28)
    } catch {
      drawOfficialVectorStamp(doc, 136, 244, 13, data.schoolName, data.schoolCity)
    }
  } else {
    drawOfficialVectorStamp(doc, 136, 244, 13, data.schoolName, data.schoolCity)
  }

  if (signatureDataUrl) {
    try {
      doc.addImage(signatureDataUrl, 'PNG', 145, 232, 32, 18)
    } catch {
      // Ignore
    }
  }

  if (data.directorName) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(15, 23, 42)
    doc.text(data.directorName, 150, 263, { align: 'center' })
  }

  // Pied de page de sécurité
  doc.setDrawColor(226, 232, 240)
  doc.line(22, 270, 188, 270)
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(8.5)
  doc.setTextColor(100, 116, 139)
  doc.text(
    `Document officiel généré via Scogestia ERP • Réf: ${refNumber} • Toute rature ou surcharge annule le présent certificat.`,
    105,
    276,
    { align: 'center' }
  )

  const filename = `Certificat_Scolarite_${data.lastName}_${data.firstName}_${data.academicYear.replace(/\//g, '-')}.pdf`
  saveOrSharePdf(doc, filename, `Certificat de scolarité — ${data.firstName} ${data.lastName}`)
}

/**
 * Dessine l'emblème officiel de la République Togolaise (RT) vectoriel en haut à gauche de la carte
 */
function drawTogoleseEmblemVector(doc: jsPDF, cx: number, cy: number, rx: number, ry: number) {
  // Couronne ovale verte extérieure
  doc.setDrawColor(22, 163, 74)
  doc.setFillColor(255, 255, 255)
  doc.setLineWidth(0.35)
  doc.ellipse(cx, cy, rx, ry, 'FD')

  // Petits drapeaux croisés (Vert / Jaune / Rouge)
  doc.setFillColor(0, 122, 51)
  doc.rect(cx - rx * 0.62, cy - ry * 0.42, rx * 0.45, ry * 0.32, 'F')
  doc.rect(cx + rx * 0.17, cy - ry * 0.42, rx * 0.45, ry * 0.32, 'F')

  doc.setFillColor(255, 206, 0)
  doc.rect(cx - rx * 0.62, cy - ry * 0.31, rx * 0.45, ry * 0.11, 'F')
  doc.rect(cx + rx * 0.17, cy - ry * 0.31, rx * 0.45, ry * 0.11, 'F')

  doc.setFillColor(210, 16, 52)
  doc.rect(cx - rx * 0.62, cy - ry * 0.42, rx * 0.18, ry * 0.18, 'F')
  doc.rect(cx + rx * 0.17, cy - ry * 0.42, rx * 0.18, ry * 0.18, 'F')

  // Bandeau supérieur "TRAVAIL - LIBERTÉ - PATRIE"
  doc.setDrawColor(15, 23, 42)
  doc.setLineWidth(0.18)
  doc.line(cx - rx * 0.55, cy - ry * 0.62, cx + rx * 0.55, cy - ry * 0.62)

  // Écu central doré "RT"
  doc.setFillColor(255, 206, 0)
  doc.setDrawColor(217, 119, 6)
  doc.setLineWidth(0.25)
  doc.circle(cx, cy + ry * 0.08, rx * 0.36, 'FD')

  doc.setTextColor(15, 23, 42)
  doc.setFont('times', 'bold')
  doc.setFontSize(5.2)
  doc.text('RT', cx, cy + ry * 0.16, { align: 'center' })

  // Deux lions stylisés (gauche et droite en bas de l'écu)
  doc.setFillColor(217, 119, 6)
  doc.circle(cx - rx * 0.48, cy + ry * 0.42, rx * 0.16, 'F')
  doc.circle(cx + rx * 0.48, cy + ry * 0.42, rx * 0.16, 'F')
}

/**
 * Dessine le cachet circulaire bleu officiel "REPUBLIQUE TOGOLAISE + NOM ÉCOLE" fidèle au modèle officiel
 */
function drawTogoleseCardOfficialStamp(
  doc: jsPDF,
  centerX: number,
  centerY: number,
  radius: number,
  schoolName: string
) {
  const blueR = 18
  const blueG = 42
  const blueB = 190

  // Double cercle extérieur et intérieur
  doc.setDrawColor(blueR, blueG, blueB)
  doc.setLineWidth(0.42)
  doc.circle(centerX, centerY, radius, 'S')
  doc.setLineWidth(0.2)
  doc.circle(centerX, centerY, radius - 0.7, 'S')
  doc.setLineWidth(0.25)
  doc.circle(centerX, centerY, radius * 0.56, 'S')

  doc.setTextColor(blueR, blueG, blueB)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(3.7)
  doc.text('REPUBLIQUE TOGOLAISE', centerX, centerY - radius * 0.68, { align: 'center' })

  // Étoiles latérales dans la couronne du cachet
  doc.setFontSize(4.2)
  doc.text('*', centerX - radius * 0.76, centerY + 0.6, { align: 'center' })
  doc.text('*', centerX + radius * 0.76, centerY + 0.6, { align: 'center' })

  // Centre "RT" + emblème
  doc.setFontSize(4.3)
  doc.text('RT', centerX, centerY + 0.6, { align: 'center' })
  doc.setLineWidth(0.18)
  doc.line(centerX - radius * 0.28, centerY - radius * 0.22, centerX + radius * 0.28, centerY - radius * 0.22)
  doc.line(centerX - radius * 0.25, centerY + radius * 0.26, centerX + radius * 0.25, centerY + radius * 0.26)

  // Nom de l'école en bas de la couronne
  doc.setFontSize(3.5)
  const shortSchool = schoolName.toUpperCase().slice(0, 21)
  doc.text(shortSchool, centerX, centerY + radius * 0.81, { align: 'center' })
}

function hexToRgbTuple(hex: string, fallback: [number, number, number]): [number, number, number] {
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

function mapPdfFontFamily(fontFamily: CardFontFamily): 'times' | 'helvetica' | 'courier' {
  if (fontFamily === 'helvetica' || fontFamily === 'verdana') return 'helvetica'
  if (fontFamily === 'courier') return 'courier'
  return 'times'
}

function mapPdfFontStyle(style: CardZoneTextStyle): 'normal' | 'bold' | 'italic' | 'bolditalic' {
  if (style.bold && style.italic) return 'bolditalic'
  if (style.bold) return 'bold'
  if (style.italic) return 'italic'
  return 'normal'
}

function applyPdfZoneStyle(
  doc: jsPDF,
  zone: CardZoneTextStyle,
  baseFontSize: number,
  overrideColorHex?: string
) {
  doc.setFont(mapPdfFontFamily(zone.fontFamily), mapPdfFontStyle(zone))
  const scale = Math.max(0.65, Math.min(1.6, zone.sizeScale || 1))
  doc.setFontSize(Number((baseFontSize * scale).toFixed(2)))
  const [r, g, b] = hexToRgbTuple(overrideColorHex || zone.color, [15, 23, 42])
  doc.setTextColor(r, g, b)
}

function drawUnderlineForText(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  colorHex: string,
  align: 'left' | 'center' | 'right' = 'left'
) {
  if (!text) return
  const w = doc.getTextWidth(text)
  const [r, g, b] = hexToRgbTuple(colorHex, [15, 23, 42])
  doc.setDrawColor(r, g, b)
  doc.setLineWidth(0.24)
  let startX = x
  if (align === 'center') startX = x - w / 2
  else if (align === 'right') startX = x - w
  doc.line(startX, y + 0.42, startX + w, y + 0.42)
}

/**
 * Dessine un texte lettre par lettre avec couleurs personnalisées par caractère si définies
 */
function drawMulticolorTextPdf(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  defaultColorHex: string,
  letterColors?: string[],
  align: 'left' | 'center' | 'right' = 'left'
) {
  if (!text) return
  const hasCustomColors =
    Array.isArray(letterColors) &&
    letterColors.some((c) => Boolean(c && c.trim()))
  if (!hasCustomColors) {
    const [r, g, b] = hexToRgbTuple(defaultColorHex, [15, 23, 42])
    doc.setTextColor(r, g, b)
    doc.text(text, x, y, { align })
    return
  }

  const chars = Array.from(text)
  const charWidths = chars.map((ch) => doc.getTextWidth(ch))
  const totalW = charWidths.reduce((acc, w) => acc + w, 0)
  let curX = x
  if (align === 'center') curX = x - totalW / 2
  else if (align === 'right') curX = x - totalW

  chars.forEach((ch, idx) => {
    const colHex = letterColors?.[idx] || defaultColorHex
    const [r, g, b] = hexToRgbTuple(colHex, [15, 23, 42])
    doc.setTextColor(r, g, b)
    doc.text(ch, curX, y)
    curX += charWidths[idx]
  })
}

/**
 * Dessine une Carte d'Identité Scolaire Officielle Togolaise (RECTO UNIQUEMENT)
 * Format optimisé pour planche de 10 cartes par page A4 (2 colonnes x 5 lignes)
 */
function drawStudentIdCardRecto(
  doc: jsPDF,
  data: StudentDocumentData,
  cardX: number,
  cardY: number,
  cardW: number,
  cardH: number,
  assets: {
    photoDataUrl: string | null
    logoDataUrl: string | null
    stampDataUrl: string | null
    signatureDataUrl: string | null
    themeDataUrl?: string | null
  }
) {
  const typo: CardTypographyConfig = {
    ...DEFAULT_CARD_TYPOGRAPHY,
    ...(data.typography || {}),
  }

  // Repères de découpe très fins aux 4 coins
  doc.setDrawColor(203, 213, 225)
  doc.setLineWidth(0.15)
  doc.rect(cardX, cardY, cardW, cardH, 'S')

  // 1. Cadre extérieur Vert Togolais (#007A33) + Bordure Jaune Or (#FFCE00)
  doc.setFillColor(0, 122, 51)
  doc.rect(cardX, cardY, cardW, cardH, 'F')

  // Bandes verticales Jaune Or sur les côtés gauche et droit (style officiel)
  doc.setFillColor(255, 206, 0)
  doc.rect(cardX + 0.9, cardY + 0.9, cardW - 1.8, cardH - 1.8, 'F')

  // Fond principal intérieur : soit Thème personnalisé, soit Bleu glacier / Blanc cassé classique
  const innerX = cardX + 2.1
  const innerY = cardY + 1.0
  const innerW = cardW - 4.2
  const innerH = cardH - 2.0
  const headerH = 16.8

  if (assets.themeDataUrl) {
    try {
      doc.setFillColor(255, 255, 255)
      doc.rect(innerX, innerY, innerW, innerH, 'F')
      doc.addImage(assets.themeDataUrl, 'PNG', innerX, innerY, innerW, innerH)
    } catch {
      doc.setFillColor(238, 244, 250)
      doc.rect(innerX, innerY, innerW, headerH, 'F')
      doc.setFillColor(248, 250, 252)
      doc.rect(innerX, innerY + headerH, innerW, innerH - headerH, 'F')
    }
  } else {
    // Fond en-tête (bleu glacier très clair #EEF4FA)
    doc.setFillColor(238, 244, 250)
    doc.rect(innerX, innerY, innerW, headerH, 'F')

    // Fond corps de carte (#F8FAFC)
    doc.setFillColor(248, 250, 252)
    doc.rect(innerX, innerY + headerH, innerW, innerH - headerH, 'F')
  }

  // 2. EN-TÊTE GAUCHE : Sigle du Ministère (ex: "MEPST" ou personnalisé, avec couleur lettre par lettre !) + Logo école
  const mepstY = innerY + 3.2
  const ministryStr =
    data.ministryAcronym !== undefined ? (data.ministryAcronym || '').trim() : 'MEPST'

  if (ministryStr.length > 0) {
    const customMinistryColors = typo.letterColors?.ministryAcronym
    const defaultMepstColors =
      ministryStr.toUpperCase() === 'MEPST'
        ? ['#0F172A', '#0F172A', '#D21034', '#EA8A00', '#1D4ED8']
        : undefined
    const effectiveMinistryColors =
      Array.isArray(customMinistryColors) && customMinistryColors.length > 0
        ? customMinistryColors
        : defaultMepstColors

    applyPdfZoneStyle(doc, typo.headerOfficial, 7.6, typo.headerOfficial.color)
    const minFormatted = typo.headerOfficial.uppercase
      ? ministryStr.toUpperCase().slice(0, 12)
      : ministryStr.slice(0, 12)

    drawMulticolorTextPdf(
      doc,
      minFormatted,
      innerX + 1.4,
      mepstY,
      typo.headerOfficial.color || '#0F172A',
      effectiveMinistryColors,
      'left'
    )
    if (typo.headerOfficial.underline) {
      drawUnderlineForText(doc, minFormatted, innerX + 1.4, mepstY, typo.headerOfficial.color, 'left')
    }
  }

  // Logo de l'établissement (ou Emblème RT si activé, sinon reste blanc) sous le sigle du ministère
  const emblemCenterX = innerX + 7.2
  const emblemCenterY = innerY + 10.1
  if (assets.logoDataUrl) {
    try {
      doc.setFillColor(255, 255, 255)
      doc.setDrawColor(22, 163, 74)
      doc.setLineWidth(0.3)
      doc.circle(emblemCenterX, emblemCenterY, 5.6, 'FD')
      doc.addImage(assets.logoDataUrl, 'PNG', emblemCenterX - 4.8, emblemCenterY - 4.8, 9.6, 9.6)
    } catch {
      if (!data.hideFallbackEmblem) {
        drawTogoleseEmblemVector(doc, emblemCenterX, emblemCenterY, 5.4, 6.0)
      }
    }
  } else if (!data.hideFallbackEmblem) {
    drawTogoleseEmblemVector(doc, emblemCenterX, emblemCenterY, 5.4, 6.0)
  }

  // 3. EN-TÊTE DROITE : REPUBLIQUE TOGOLAISE / Travail-Liberté-Patrie
  const rightHeaderCenterX = innerX + innerW - 22.5
  const republicStr =
    data.republicTitle !== undefined
      ? (data.republicTitle || '').trim()
      : 'REPUBLIQUE TOGOLAISE'
  const mottoStr =
    data.republicMotto !== undefined
      ? (data.republicMotto || '').trim()
      : 'Travail-Liberté-Patrie'

  if (republicStr) {
    applyPdfZoneStyle(doc, typo.headerOfficial, 6.6, '#0F172A')
    const repOut = (typo.headerOfficial.uppercase ? republicStr.toUpperCase() : republicStr).slice(0, 28)
    drawMulticolorTextPdf(
      doc,
      repOut,
      rightHeaderCenterX,
      innerY + 3.1,
      '#0F172A',
      typo.letterColors?.republicTitle,
      'center'
    )
  }

  if (mottoStr) {
    applyPdfZoneStyle(doc, typo.headerOfficial, 5.7, '#0F172A')
    drawMulticolorTextPdf(
      doc,
      mottoStr.slice(0, 32),
      rightHeaderCenterX,
      innerY + 5.6,
      '#0F172A',
      typo.letterColors?.republicMotto,
      'center'
    )
  }

  // 4. EN-TÊTE CENTRAL : IEPP / Inspection + NOM DE L'ÉCOLE + Centre d'Écrit
  const titleCenterX = innerX + innerW * 0.54

  // Ligne Inspection / DRE / IEPP (si vide, reste blanc)
  const inspectionText =
    data.inspectionName !== undefined
      ? (data.inspectionName || '').trim()
      : data.schoolCity
        ? `DRE / INSPECTION — ${data.schoolCity.toUpperCase()}`
        : 'MINISTÈRE DES ENSEIGNEMENTS (MEPST)'

  if (inspectionText) {
    applyPdfZoneStyle(doc, typo.headerOfficial, 6.4)
    const inspOut = (
      typo.headerOfficial.uppercase ? inspectionText.toUpperCase() : inspectionText
    ).slice(0, 38)
    drawMulticolorTextPdf(
      doc,
      inspOut,
      titleCenterX,
      innerY + 8.7,
      typo.headerOfficial.color,
      typo.letterColors?.inspectionName,
      'center'
    )
    if (typo.headerOfficial.underline) {
      drawUnderlineForText(doc, inspOut, titleCenterX, innerY + 8.7, typo.headerOfficial.color, 'center')
    }
  }

  // Nom de l'Établissement (Zone schoolName)
  const schoolRaw = (data.schoolName || '').trim()
  if (schoolRaw) {
    const schoolOut = (typo.schoolName.uppercase ? schoolRaw.toUpperCase() : schoolRaw).slice(0, 34)
    const baseSchoolSize = schoolOut.length > 28 ? 7.4 : schoolOut.length > 22 ? 8.4 : 9.5
    applyPdfZoneStyle(doc, typo.schoolName, baseSchoolSize)
    drawMulticolorTextPdf(
      doc,
      schoolOut,
      titleCenterX,
      innerY + 12.4,
      typo.schoolName.color,
      typo.letterColors?.schoolName,
      'center'
    )
    if (typo.schoolName.underline) {
      drawUnderlineForText(doc, schoolOut, titleCenterX, innerY + 12.4, typo.schoolName.color, 'center')
    }
  }

  // Ligne Centre d'Écrit : [Ville / Centre] (si vide, reste blanc)
  const centerValue =
    data.examCenter !== undefined
      ? (data.examCenter || '').trim().slice(0, 26)
      : (data.schoolCity?.trim() || data.schoolName || 'Lomé').slice(0, 26)

  if (centerValue) {
    const centerLabel =
      data.examCenterLabel !== undefined ? data.examCenterLabel || '' : "Centre d'Ecrit: "
    applyPdfZoneStyle(doc, typo.headerOfficial, 6.8, '#0F172A')
    const labelW = doc.getTextWidth(centerLabel)
    const valW = doc.getTextWidth(centerValue)
    const totalCenterW = labelW + valW
    const startCenterX = titleCenterX - totalCenterW / 2

    doc.text(centerLabel, startCenterX, innerY + 15.5)
    applyPdfZoneStyle(doc, typo.headerOfficial, 6.8)
    drawMulticolorTextPdf(
      doc,
      centerValue,
      startCenterX + labelW,
      innerY + 15.5,
      typo.headerOfficial.color,
      typo.letterColors?.examCenter,
      'left'
    )
    if (typo.headerOfficial.underline) {
      drawUnderlineForText(
        doc,
        centerValue,
        startCenterX + labelW,
        innerY + 15.5,
        typo.headerOfficial.color,
        'left'
      )
    }
  }

  // 5. SÉPARATEUR HORIZONTAL TRICOLORE (Rouge / Vert / Jaune)
  const sepY = innerY + headerH
  doc.setDrawColor(185, 28, 28)
  doc.setLineWidth(0.35)
  doc.line(innerX, sepY - 0.35, innerX + innerW, sepY - 0.35)
  doc.setDrawColor(0, 122, 51)
  doc.setLineWidth(0.45)
  doc.line(innerX, sepY + 0.1, innerX + innerW, sepY + 0.1)
  doc.setDrawColor(255, 206, 0)
  doc.setLineWidth(0.3)
  doc.line(innerX, sepY + 0.45, innerX + innerW, sepY + 0.45)

  // 6. ZONE PHOTO PASSEPORT (GAUCHE — Pleine hauteur du corps de la carte)
  const bodyTopY = sepY + 0.7
  const bodyH = innerY + innerH - bodyTopY - 0.4
  const photoX = innerX + 0.4
  const photoY = bodyTopY
  const photoW = 28.5
  const photoH = bodyH

  // Cadre photo terracotta/rouge & blanc comme sur le modèle officiel
  doc.setFillColor(235, 242, 250)
  doc.setDrawColor(194, 65, 12)
  doc.setLineWidth(0.45)
  doc.rect(photoX, photoY, photoW, photoH, 'FD')

  if (assets.photoDataUrl) {
    try {
      doc.addImage(assets.photoDataUrl, 'PNG', photoX + 0.35, photoY + 0.35, photoW - 0.7, photoH - 0.7)
    } catch {
      // Fallback initiales si l'image échoue
    }
  } else {
    // Silhouette / Placeholder propre si aucune photo n'est encore chargée
    doc.setFillColor(219, 234, 254)
    doc.rect(photoX + 0.5, photoY + 0.5, photoW - 1, photoH - 1, 'F')
    doc.setFillColor(147, 197, 253)
    doc.circle(photoX + photoW / 2, photoY + photoH * 0.36, 5.2, 'F')
    doc.ellipse(photoX + photoW / 2, photoY + photoH * 0.78, 8.5, 6.2, 'F')

    doc.setTextColor(30, 58, 138)
    doc.setFont('times', 'bold')
    doc.setFontSize(9.5)
    const initials = `${(data.lastName[0] || '').toUpperCase()}${(data.firstName[0] || '').toUpperCase()}`
    doc.text(initials, photoX + photoW / 2, photoY + photoH * 0.4, { align: 'center' })

    doc.setFontSize(4.8)
    doc.setTextColor(30, 64, 175)
    doc.text('PHOTO ÉLÈVE', photoX + photoW / 2, photoY + photoH - 2.2, { align: 'center' })
  }

  // 7. COLONNE DROITE : Bandeau "CARTE D'IDENTITE SCOLAIRE" + Informations de l'élève
  const rightX = photoX + photoW + 0.5
  const rightW = innerX + innerW - rightX - 0.2

  // Bandeau sous le séparateur (couleur personnalisable via typo.bannerBgColor)
  const bannerH = 4.3
  const [bgR, bgG, bgB] = hexToRgbTuple(typo.bannerBgColor || '#FDE0C6', [253, 224, 198])
  doc.setFillColor(bgR, bgG, bgB)
  doc.rect(rightX, bodyTopY, rightW, bannerH, 'F')

  const bannerTitle =
    data.cardBannerTitle !== undefined
      ? (data.cardBannerTitle || '').trim()
      : "CARTE D'IDENTITE SCOLAIRE"
  const bannerCenterX = rightX + rightW / 2
  if (bannerTitle) {
    const bannerOut = (typo.bannerTitle.uppercase ? bannerTitle.toUpperCase() : bannerTitle).slice(0, 34)
    applyPdfZoneStyle(doc, typo.bannerTitle, 7.1)
    drawMulticolorTextPdf(
      doc,
      bannerOut,
      bannerCenterX,
      bodyTopY + 3.0,
      typo.bannerTitle.color,
      typo.letterColors?.bannerTitle,
      'center'
    )

    if (typo.bannerTitle.underline) {
      drawUnderlineForText(doc, bannerOut, bannerCenterX, bodyTopY + 3.0, typo.bannerTitle.color, 'center')
    }
  }

  // Champs d'état civil de l'élève
  const fieldsX = rightX + 1.2
  let lineY = bodyTopY + bannerH + 3.8
  const lineStep = 4.15

  // Nom: ADAM
  applyPdfZoneStyle(doc, typo.studentDetails, 7.8)
  const nomLabel = 'Nom: '
  doc.text(nomLabel, fieldsX, lineY)
  const nomLabelW = doc.getTextWidth(nomLabel)

  applyPdfZoneStyle(doc, typo.studentName, 7.8)
  const lastNameOut = (
    typo.studentName.uppercase ? (data.lastName || '').toUpperCase() : (data.lastName || '').toUpperCase()
  ).slice(0, 22)
  doc.text(lastNameOut, fieldsX + nomLabelW, lineY)
  if (typo.studentName.underline) {
    drawUnderlineForText(doc, lastNameOut, fieldsX + nomLabelW, lineY, typo.studentName.color, 'left')
  }

  // Prénoms: Rachida
  lineY += lineStep
  applyPdfZoneStyle(doc, typo.studentDetails, 7.6)
  const prenomLabel = 'Prénoms: '
  doc.text(prenomLabel, fieldsX, lineY)
  const prenomLabelW = doc.getTextWidth(prenomLabel)

  applyPdfZoneStyle(doc, typo.studentName, 7.6)
  const firstNameOut = (
    typo.studentName.uppercase ? (data.firstName || '').toUpperCase() : data.firstName || ''
  ).slice(0, 25)
  doc.text(firstNameOut, fieldsX + prenomLabelW, lineY)
  if (typo.studentName.underline) {
    drawUnderlineForText(doc, firstNameOut, fieldsX + prenomLabelW, lineY, typo.studentName.color, 'left')
  }

  // Né (e) le 19/6/2014 à Lomé
  lineY += lineStep
  applyPdfZoneStyle(doc, typo.studentDetails, 7.2)
  const dobFormatted = data.dateOfBirth
    ? new Date(data.dateOfBirth).toLocaleDateString('fr-FR')
    : 'Non renseigné'
  const birthPlaceStr = data.birthPlace?.trim() || data.schoolCity?.trim() || 'Lomé'
  const birthRaw = `Né (e) le ${dobFormatted} à ${birthPlaceStr}`
  const birthLine = (typo.studentDetails.uppercase ? birthRaw.toUpperCase() : birthRaw).slice(0, 36)
  doc.text(birthLine, fieldsX, lineY)
  if (typo.studentDetails.underline) {
    drawUnderlineForText(doc, birthLine, fieldsX, lineY, typo.studentDetails.color, 'left')
  }

  // Sexe : F   (+ Matricule discret à droite)
  lineY += lineStep
  applyPdfZoneStyle(doc, typo.studentDetails, 7.5, '#D94619')
  const sexeLabel = 'Sexe '
  doc.text(sexeLabel, fieldsX, lineY)
  const sexeW = doc.getTextWidth(sexeLabel)
  applyPdfZoneStyle(doc, typo.studentDetails, 7.5)
  doc.text(': ', fieldsX + sexeW, lineY)
  const colonW = doc.getTextWidth(': ')
  applyPdfZoneStyle(doc, typo.studentName, 7.5, '#122AB9')
  const genderChar = data.gender?.toUpperCase() === 'F' ? 'F' : data.gender?.toUpperCase() === 'M' ? 'M' : '—'
  doc.text(genderChar, fieldsX + sexeW + colonW, lineY)

  if (data.matricule && data.matricule !== 'N/A') {
    doc.setFont('times', 'bold')
    doc.setFontSize(5.5)
    doc.setTextColor(100, 116, 139)
    doc.text(`Mle: ${data.matricule}`, rightX + rightW - 1.5, lineY, { align: 'right' })
  }

  // 8. BAS GAUCHE DE LA COLONNE DROITE : Année Scolaire + 2025-2026 + Classe
  const yearLabelY = bodyTopY + bodyH - 8.8
  applyPdfZoneStyle(doc, typo.footerInfo, 6.8, '#0F172A')
  const anneePart1 = 'Année '
  const anneePart2 = 'Scolaire'
  doc.text(anneePart1, fieldsX, yearLabelY)
  const anneePart1W = doc.getTextWidth(anneePart1)
  applyPdfZoneStyle(doc, typo.footerInfo, 6.8, '#122AB9')
  doc.text(anneePart2, fieldsX + anneePart1W, yearLabelY)
  const anneeTotalW = anneePart1W + doc.getTextWidth(anneePart2)

  // Soulignement sous Année Scolaire
  doc.setDrawColor(18, 42, 185)
  doc.setLineWidth(0.25)
  doc.line(fieldsX, yearLabelY + 0.5, fieldsX + anneeTotalW, yearLabelY + 0.5)

  // Valeur Année Scolaire (ex: 2025-2026)
  const yearValY = yearLabelY + 3.8
  applyPdfZoneStyle(doc, typo.footerInfo, 8.2)
  const yearValStr = data.academicYear || '2025-2026'
  doc.text(yearValStr, fieldsX + 1.2, yearValY)
  if (typo.footerInfo.underline) {
    drawUnderlineForText(doc, yearValStr, fieldsX + 1.2, yearValY, typo.footerInfo.color, 'left')
  }

  // Classe : CM2
  const classY = bodyTopY + bodyH - 1.1
  applyPdfZoneStyle(doc, typo.footerInfo, 7.6, '#0F172A')
  const classeLabel = 'Classe : '
  doc.text(classeLabel, fieldsX, classY)
  const classeLabelW = doc.getTextWidth(classeLabel)
  applyPdfZoneStyle(doc, typo.footerInfo, 7.6, '#192AB9')
  const classValStr = (
    typo.footerInfo.uppercase ? (data.className || '').toUpperCase() : data.className || ''
  ).slice(0, 12)
  doc.text(classValStr, fieldsX + classeLabelW, classY)
  if (typo.footerInfo.underline) {
    drawUnderlineForText(doc, classValStr, fieldsX + classeLabelW, classY, '#192AB9', 'left')
  }

  // 9. BAS DROITE DE LA COLONNE DROITE : Cachet + Signature (issus de Paramètres ou importés) + Nom du Directeur
  const stampCenterX = rightX + rightW - 18.5
  const stampCenterY = bodyTopY + bodyH - 8.2
  const stampRadius = 7.4

  if (assets.stampDataUrl) {
    try {
      doc.addImage(
        assets.stampDataUrl,
        'PNG',
        stampCenterX - stampRadius,
        stampCenterY - stampRadius,
        stampRadius * 2,
        stampRadius * 2
      )
    } catch {
      if (!data.hideFallbackStamp) {
        drawTogoleseCardOfficialStamp(doc, stampCenterX, stampCenterY, stampRadius, data.schoolName)
      }
    }
  } else if (!data.hideFallbackStamp) {
    drawTogoleseCardOfficialStamp(doc, stampCenterX, stampCenterY, stampRadius, data.schoolName)
  }

  if (assets.signatureDataUrl) {
    try {
      doc.addImage(assets.signatureDataUrl, 'PNG', rightX + rightW - 17, stampCenterY - 3.8, 16, 7.2)
    } catch {
      // Ignore
    }
  }

  // Nom du Directeur en bas à droite (si vide, reste blanc)
  const directorText =
    data.directorName !== undefined
      ? (data.directorName || '').trim().slice(0, 24)
      : 'Le Directeur'
  if (directorText) {
    const dirOut = typo.footerInfo.uppercase ? directorText.toUpperCase() : directorText
    applyPdfZoneStyle(doc, typo.footerInfo, 6.8)
    doc.text(dirOut, rightX + rightW - 1.0, classY, { align: 'right' })
    if (typo.footerInfo.underline) {
      drawUnderlineForText(doc, dirOut, rightX + rightW - 1.0, classY, typo.footerInfo.color, 'right')
    }
  }
}

/**
 * Génère la Carte d'Identité Scolaire individuelle d'un élève (Recto uniquement — Modèle Officiel Togolais)
 * Option `tenUpSheet`: si true, génère 10 exemplaires sur la même page A4 pour impression groupée.
 */
export async function generateStudentIdCardPDF(
  data: StudentDocumentData,
  options?: { tenUpSheet?: boolean }
) {
  const [photoDataUrl, logoDataUrl, stampDataUrl, signatureDataUrl, themeDataUrl] =
    await Promise.all([
      loadImageAsPngDataUrl(data.avatarUrl),
      loadImageAsPngDataUrl(data.schoolLogoUrl),
      loadImageAsPngDataUrl(data.schoolStampUrl, { transparentWhiteAndCrop: true }),
      loadImageAsPngDataUrl(data.schoolSignatureUrl, { transparentWhiteAndCrop: true }),
      loadCardThemeAsPngDataUrl(data.themeBackgroundUrl),
    ])

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const cardW = 94
  const cardH = 53.5

  if (options?.tenUpSheet) {
    const colX = [8.5, 107.5]
    const rowY = [10, 66, 122, 178, 234]
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 2; c++) {
        drawStudentIdCardRecto(doc, data, colX[c], rowY[r], cardW, cardH, {
          photoDataUrl,
          logoDataUrl,
          stampDataUrl,
          signatureDataUrl,
          themeDataUrl,
        })
      }
    }
  } else {
    // 1 Carte Recto centrée en haut de la feuille A4 prête à découper
    drawStudentIdCardRecto(doc, data, (210 - cardW) / 2, 22, cardW, cardH, {
      photoDataUrl,
      logoDataUrl,
      stampDataUrl,
      signatureDataUrl,
      themeDataUrl,
    })
  }

  const filename = `Carte_Scolaire_${data.lastName}_${data.firstName}_${data.matricule}.pdf`
  saveOrSharePdf(doc, filename, `Carte scolaire — ${data.firstName} ${data.lastName}`)
}

/**
 * Génère en 1 seul clic un PDF multi-pages contenant 10 CARTES SCOLAIRES DE 10 ÉLÈVES DIFFÉRENTS PAR PAGE A4
 * Disposition : 2 colonnes × 5 lignes = 10 cartes Recto par page A4 (Modèle Officiel Togolais, sans verso)
 */
export async function generateClassStudentIdCardsPDF(
  className: string,
  studentsData: StudentDocumentData[]
) {
  if (!studentsData.length) return

  const first = studentsData[0]
  const [logoDataUrl, stampDataUrl, signatureDataUrl, themeDataUrl, ...photoDataUrls] =
    await Promise.all([
      loadImageAsPngDataUrl(first.schoolLogoUrl),
      loadImageAsPngDataUrl(first.schoolStampUrl, { transparentWhiteAndCrop: true }),
      loadImageAsPngDataUrl(first.schoolSignatureUrl, { transparentWhiteAndCrop: true }),
      loadCardThemeAsPngDataUrl(first.themeBackgroundUrl),
      ...studentsData.map((s) => loadImageAsPngDataUrl(s.avatarUrl)),
    ])

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const cardsPerPage = 10
  const cardW = 94
  const cardH = 53.5
  const colX = [8.5, 107.5]
  const rowY = [10, 66, 122, 178, 234]

  for (let i = 0; i < studentsData.length; i++) {
    const slotIndex = i % cardsPerPage
    if (i > 0 && slotIndex === 0) {
      doc.addPage()
    }

    const col = slotIndex % 2
    const row = Math.floor(slotIndex / 2)
    const student = studentsData[i]

    drawStudentIdCardRecto(doc, student, colX[col], rowY[row], cardW, cardH, {
      photoDataUrl: photoDataUrls[i] || null,
      logoDataUrl,
      stampDataUrl,
      signatureDataUrl,
      themeDataUrl,
    })
  }

  const cleanClass = className.replace(/\s+/g, '_')
  const filename = `Planche_10_Cartes_Scolaires_${cleanClass}_${first.academicYear.replace(/\//g, '-')}.pdf`
  saveOrSharePdf(doc, filename, `Planche 10 Cartes scolaires — Classe ${className}`)
}

/**
 * Génère un Bon de Sortie de Caisse / Reçu de Paie ou Vacation officiel au format PDF
 */
export function generateExpenseVoucherPDF(expense: {
  id: string
  category: string
  label: string
  amount: number
  paymentMethod: string
  beneficiary?: string | null
  expenseDate: string
  notes?: string | null
  schoolName: string
  schoolCity?: string | null
  schoolPhone?: string | null
  directorName?: string | null
}) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const ref = `DEC-${expense.expenseDate.replace(/-/g, '')}-${expense.id.slice(0, 6).toUpperCase()}`
  const isSalary = expense.category.toLowerCase().includes('salaire')

  // Cadre du bon
  doc.setDrawColor(6, 95, 70)
  doc.setLineWidth(0.8)
  doc.roundedRect(14, 14, 182, 132, 3, 3, 'S')

  // Bandeau
  doc.setFillColor(6, 95, 70)
  doc.roundedRect(14, 14, 182, 22, 3, 3, 'F')
  doc.rect(14, 30, 182, 6, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.text(expense.schoolName.toUpperCase(), 22, 24)
  doc.setFontSize(9.5)
  doc.text(
    isSalary ? 'BULLETIN / REÇU DE PAIE & VACATION' : 'BON DE SORTIE DE CAISSE (DÉCAISSEMENT)',
    22,
    31
  )

  doc.setFontSize(9)
  doc.text(`Réf : ${ref}`, 188, 24, { align: 'right' })
  doc.text(
    `Date : ${new Date(expense.expenseDate).toLocaleDateString('fr-FR')}`,
    188,
    31,
    { align: 'right' }
  )

  // Montant encadré
  doc.setFillColor(240, 253, 244)
  doc.setDrawColor(16, 185, 129)
  doc.roundedRect(132, 42, 56, 16, 2, 2, 'FD')
  doc.setTextColor(6, 95, 70)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.text('MONTANT DÉCAISSÉ', 160, 47.5, { align: 'center' })
  doc.setFontSize(12)
  doc.text(`${Number(expense.amount).toLocaleString('fr-FR')} FCFA`, 160, 54.5, { align: 'center' })

  // Détails
  const rows: [string, string][] = [
    ['Catégorie :', expense.category],
    ['Bénéficiaire :', expense.beneficiary || 'Non spécifié'],
    ['Objet / Motif :', expense.label],
    ['Mode de règlement :', expense.paymentMethod.toUpperCase()],
    ['Observation :', expense.notes || ' R.A.S.'],
  ]

  let y = 47
  rows.forEach(([label, val]) => {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9.5)
    doc.setTextColor(100, 116, 139)
    doc.text(label, 22, y)

    doc.setFont('helvetica', 'bold')
    doc.setTextColor(15, 23, 42)
    doc.text(String(val).slice(0, 48), 62, y)
    y += 9
  })

  // Signatures (Caissier, Bénéficiaire, Direction)
  doc.setDrawColor(226, 232, 240)
  doc.line(22, 98, 188, 98)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(30, 41, 59)
  doc.text('La Comptabilité / Caisse', 42, 106, { align: 'center' })
  doc.text('Pour Acquit (Le Bénéficiaire)', 105, 106, { align: 'center' })
  doc.text('Visa de la Direction', 165, 106, { align: 'center' })

  drawOfficialVectorStamp(doc, 165, 122, 10, expense.schoolName, expense.schoolCity)

  doc.setFont('helvetica', 'italic')
  doc.setFontSize(7.5)
  doc.setTextColor(100, 116, 139)
  doc.text(
    `Pièce comptable officielle générée par Scogestia ERP • Réf : ${ref}`,
    105,
    141,
    { align: 'center' }
  )

  const filename = `${isSalary ? 'Recu_Paie' : 'Bon_Caisse'}_${ref}.pdf`
  saveOrSharePdf(doc, filename, `Pièce de caisse ${ref}`)
}

export interface HonorRollStudentData extends StudentDocumentData {
  average?: number | null
  periodLabel?: string | null
  rankLabel?: string | null
}

function drawHonorRollPage(
  doc: jsPDF,
  data: HonorRollStudentData,
  assets: {
    photoDataUrl: string | null
    logoDataUrl: string | null
    stampDataUrl: string | null
    signatureDataUrl: string | null
  }
) {
  const W = 297
  const H = 210

  // Fond parchemin très subtil
  doc.setFillColor(255, 253, 247)
  doc.rect(0, 0, W, H, 'F')

  // Cadre extérieur Bleu Nuit Royal
  doc.setDrawColor(30, 41, 59)
  doc.setLineWidth(1.6)
  doc.rect(10, 10, W - 20, H - 20, 'S')

  // Double cadre intérieur Or Royal (#C9A227)
  doc.setDrawColor(201, 162, 39)
  doc.setLineWidth(0.9)
  doc.rect(13.5, 13.5, W - 27, H - 27, 'S')
  doc.setLineWidth(0.35)
  doc.rect(15.5, 15.5, W - 31, H - 31, 'S')

  // Ornements aux 4 coins
  const corners = [
    [13.5, 13.5],
    [W - 19.5, 13.5],
    [13.5, H - 19.5],
    [W - 19.5, H - 19.5],
  ]
  doc.setFillColor(201, 162, 39)
  corners.forEach(([cx, cy]) => {
    doc.rect(cx, cy, 6, 6, 'F')
  })

  // En-tête République & Ministère
  doc.setTextColor(30, 41, 59)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9.5)
  doc.text('RÉPUBLIQUE TOGOLAISE', 30, 26)
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(8)
  doc.setTextColor(100, 116, 139)
  doc.text('Travail - Liberté - Patrie', 30, 30.5)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(30, 41, 59)
  doc.text(`ANNÉE SCOLAIRE : ${data.academicYear}`, W - 30, 26, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(100, 116, 139)
  doc.text(data.periodLabel || 'Bilan Pédagogique Officiel', W - 30, 30.5, { align: 'right' })

  // Logo de l'école au centre haut
  if (assets.logoDataUrl) {
    try {
      doc.addImage(assets.logoDataUrl, 'PNG', W / 2 - 10, 18, 20, 20)
    } catch {
      // ignore
    }
  }

  // Nom de l'établissement en majuscules centré
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.setTextColor(30, 46, 129)
  doc.text(data.schoolName.toUpperCase(), W / 2, 45, { align: 'center' })

  if (data.schoolCity || data.schoolPhone) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(100, 116, 139)
    doc.text(
      [data.schoolCity, data.schoolPhone ? `Tél : ${data.schoolPhone}` : null].filter(Boolean).join(' • '),
      W / 2,
      50,
      { align: 'center' }
    )
  }

  // Ruban Or / Indigo du Titre "TABLEAU D'HONNEUR"
  const avg = typeof data.average === 'number' && !isNaN(data.average) ? data.average : null
  let distinctionTitle = "TABLEAU D'HONNEUR OFFICIEL"
  let distinctionSubtitle = 'DÉCERNÉ POUR SON TRAVAIL, SA DISCIPLINE ET SES RÉSULTATS SCOLAIRES'
  if (avg !== null && avg >= 16) {
    distinctionTitle = "TABLEAU D'HONNEUR & FÉLICITATIONS"
    distinctionSubtitle = "DÉCERNÉ AVEC LES FÉLICITATIONS DU CONSEIL DES PROFESSEURS POUR L'EXCELLENCE DE SES RÉSULTATS"
  } else if (avg !== null && avg >= 14) {
    distinctionTitle = "TABLEAU D'HONNEUR & ENCOURAGEMENTS"
    distinctionSubtitle = 'DÉCERNÉ AVEC LES ENCOURAGEMENTS DU CONSEIL POUR LA QUALITÉ DE SON TRAVAIL SCOLAIRE'
  }

  doc.setFillColor(30, 41, 59)
  doc.roundedRect(W / 2 - 92, 56, 184, 15, 3, 3, 'F')
  doc.setDrawColor(201, 162, 39)
  doc.setLineWidth(0.7)
  doc.roundedRect(W / 2 - 92, 56, 184, 15, 3, 3, 'S')

  doc.setFont('times', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(253, 224, 71)
  doc.text(distinctionTitle, W / 2, 66, { align: 'center' })

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(100, 116, 139)
  doc.text(distinctionSubtitle, W / 2, 78, { align: 'center' })

  // Photo passeport de l'élève à gauche si disponible
  if (assets.photoDataUrl) {
    try {
      doc.setFillColor(255, 255, 255)
      doc.setDrawColor(201, 162, 39)
      doc.setLineWidth(0.6)
      doc.roundedRect(30, 86, 30, 36, 2, 2, 'FD')
      doc.addImage(assets.photoDataUrl, 'PNG', 31, 87, 28, 34)
    } catch {
      // ignore
    }
  }

  // Corps du diplôme
  doc.setFont('times', 'italic')
  doc.setFontSize(13)
  doc.setTextColor(51, 65, 85)
  doc.text("Le Chef d'Établissement et le Conseil des Enseignants certifient que l'élève :", W / 2, 91, {
    align: 'center',
  })

  // Nom & Prénoms de l'élève en très grand
  doc.setFont('times', 'bold')
  doc.setFontSize(25)
  doc.setTextColor(15, 23, 42)
  doc.text(`${data.lastName.toUpperCase()} ${data.firstName}`, W / 2, 105, { align: 'center' })

  // Ligne dorée sous le nom
  doc.setDrawColor(201, 162, 39)
  doc.setLineWidth(0.6)
  doc.line(W / 2 - 65, 109, W / 2 + 65, 109)

  // Détails Classe & Matricule
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11.5)
  doc.setTextColor(49, 46, 129)
  doc.text(
    `Classe : ${data.className}   •   Matricule : ${data.matricule || 'N/A'}`,
    W / 2,
    118,
    { align: 'center' }
  )

  // Encadré Moyenne / Mention si fourni
  if (avg !== null) {
    const mention =
      avg >= 16
        ? 'Mention : Très Bien'
        : avg >= 14
        ? 'Mention : Bien'
        : avg >= 12
        ? 'Mention : Assez Bien'
        : 'Mérite Scolaire'

    doc.setFillColor(254, 249, 195)
    doc.setDrawColor(201, 162, 39)
    doc.setLineWidth(0.5)
    doc.roundedRect(W / 2 - 58, 124, 116, 12, 2.5, 2.5, 'FD')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(133, 77, 14)
    doc.text(
      `Moyenne Générale : ${avg.toFixed(2).replace('.', ',')} / 20   —   ${mention}`,
      W / 2,
      131.5,
      { align: 'center' }
    )
  } else {
    doc.setFont('times', 'italic')
    doc.setFontSize(12)
    doc.setTextColor(71, 85, 105)
    doc.text(
      "S'est particulièrement distingué(e) par son assiduité, sa conduite exemplaire et son ardeur au travail.",
      W / 2,
      131,
      { align: 'center' }
    )
  }

  // Pied : Date, Cachet Officiel, Médaille Or & Signature du Directeur
  const todayStr = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  doc.setTextColor(71, 85, 105)
  doc.text(`Fait à ${data.schoolCity || 'Lomé'}, le ${todayStr}`, 48, 156, { align: 'center' })

  // Sceau d'or central (Médaille d'honneur)
  doc.setFillColor(201, 162, 39)
  doc.circle(W / 2, 165, 13, 'F')
  doc.setFillColor(254, 240, 138)
  doc.circle(W / 2, 165, 10.5, 'F')
  doc.setDrawColor(161, 98, 7)
  doc.setLineWidth(0.5)
  doc.circle(W / 2, 165, 9.2, 'S')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6.2)
  doc.setTextColor(133, 77, 14)
  doc.text('EXCELLENCE', W / 2, 163.5, { align: 'center' })
  doc.text('SCOLAIRE', W / 2, 167.5, { align: 'center' })

  // Zone Signature & Cachet du Directeur à droite
  const sigX = W - 62
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(30, 41, 59)
  doc.text("Le Chef d'Établissement", sigX, 152, { align: 'center' })

  if (assets.stampDataUrl) {
    try {
      doc.addImage(assets.stampDataUrl, 'PNG', sigX - 24, 154, 26, 26)
    } catch {
      drawOfficialVectorStamp(doc, sigX - 12, 168, 11, data.schoolName, data.schoolCity)
    }
  } else {
    drawOfficialVectorStamp(doc, sigX - 12, 168, 11, data.schoolName, data.schoolCity)
  }

  if (assets.signatureDataUrl) {
    try {
      doc.addImage(assets.signatureDataUrl, 'PNG', sigX - 4, 156, 28, 16)
    } catch {
      // ignore
    }
  }

  if (data.directorName) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9.5)
    doc.setTextColor(15, 23, 42)
    doc.text(data.directorName, sigX, 184, { align: 'center' })
  }
}

/**
 * Génère un Diplôme de Tableau d'Honneur individuel (A4 Paysage)
 */
export async function generateHonorRollPDF(data: HonorRollStudentData) {
  const [photoDataUrl, logoDataUrl, stampDataUrl, signatureDataUrl] = await Promise.all([
    loadImageAsPngDataUrl(data.avatarUrl),
    loadImageAsPngDataUrl(data.schoolLogoUrl),
    loadImageAsPngDataUrl(data.schoolStampUrl),
    loadImageAsPngDataUrl(data.schoolSignatureUrl),
  ])

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  drawHonorRollPage(doc, data, {
    photoDataUrl,
    logoDataUrl,
    stampDataUrl,
    signatureDataUrl,
  })

  const filename = `Tableau_Honneur_${data.lastName}_${data.firstName}.pdf`
  saveOrSharePdf(doc, filename, `Tableau d'Honneur — ${data.firstName} ${data.lastName}`)
}

/**
 * Génère les Tableaux d'Honneur de toute une classe en un seul fichier PDF multi-pages (A4 Paysage)
 */
export async function generateClassHonorRollPDF(
  className: string,
  studentsData: HonorRollStudentData[]
) {
  if (!studentsData.length) return
  const first = studentsData[0]
  const [logoDataUrl, stampDataUrl, signatureDataUrl] = await Promise.all([
    loadImageAsPngDataUrl(first.schoolLogoUrl),
    loadImageAsPngDataUrl(first.schoolStampUrl),
    loadImageAsPngDataUrl(first.schoolSignatureUrl),
  ])

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

  for (let i = 0; i < studentsData.length; i++) {
    if (i > 0) doc.addPage('a4', 'landscape')
    const st = studentsData[i]
    const photoDataUrl = await loadImageAsPngDataUrl(st.avatarUrl)
    drawHonorRollPage(doc, st, {
      photoDataUrl,
      logoDataUrl,
      stampDataUrl,
      signatureDataUrl,
    })
  }

  const cleanClass = className.replace(/\s+/g, '_')
  const filename = `Tableaux_Honneur_Classe_${cleanClass}_${first.academicYear.replace(/\//g, '-')}.pdf`
  saveOrSharePdf(doc, filename, `Tableaux d'Honneur — Classe ${className}`)
}

/**
 * Génère la Liste Officielle des Candidats aux Examens (CEPD, BEPC, BAC 1, BAC 2) ou Liste Officielle de Classe (A4 Portrait)
 */
export async function generateOfficialExamCandidatesPDF(
  className: string,
  classLevel: string,
  studentsData: StudentDocumentData[]
) {
  if (!studentsData.length) return
  const first = studentsData[0]
  const examBadge = detectOfficialExamLabel(className, classLevel)

  const [logoDataUrl, stampDataUrl, signatureDataUrl] = await Promise.all([
    loadImageAsPngDataUrl(first.schoolLogoUrl),
    loadImageAsPngDataUrl(first.schoolStampUrl),
    loadImageAsPngDataUrl(first.schoolSignatureUrl),
  ])

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const sorted = [...studentsData].sort((a, b) =>
    `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`, 'fr')
  )

  const girlsCount = sorted.filter((s) => (s.gender || '').toUpperCase().startsWith('F')).length
  const boysCount = sorted.filter((s) => (s.gender || '').toUpperCase().startsWith('M')).length

  const rowsPerPage = 25
  const totalPages = Math.max(1, Math.ceil(sorted.length / rowsPerPage))

  for (let page = 0; page < totalPages; page++) {
    if (page > 0) doc.addPage()

    // En-tête officiel République Togolaise
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor(15, 23, 42)
    doc.text('RÉPUBLIQUE TOGOLAISE', 14, 14)
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(7.5)
    doc.setTextColor(100, 116, 139)
    doc.text('Travail - Liberté - Patrie', 14, 18)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.text('Ministère des Enseignements Primaire, Secondaire et Technique', 14, 22)

    if (logoDataUrl) {
      try {
        doc.addImage(logoDataUrl, 'PNG', 97, 10, 16, 16)
      } catch {
        // ignore
      }
    }

    // Infos Établissement à droite
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(30, 46, 129)
    doc.text(first.schoolName.toUpperCase(), 196, 14, { align: 'right' })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(71, 85, 105)
    doc.text(
      [first.schoolCity, first.schoolPhone ? `Tél: ${first.schoolPhone}` : null].filter(Boolean).join(' • ') ||
        'Établissement Scolaire Officiel',
      196,
      18,
      { align: 'right' }
    )
    doc.setFont('helvetica', 'bold')
    doc.text(`Année Académique : ${first.academicYear}`, 196, 22, { align: 'right' })

    // Bandeau Titre Officiel
    doc.setFillColor(30, 41, 59)
    doc.roundedRect(14, 28, 182, 14, 2, 2, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(255, 255, 255)
    const mainTitle = examBadge
      ? `LISTE OFFICIELLE DES CANDIDATS — ${examBadge} (CLASSE : ${className.toUpperCase()})`
      : `LISTE NOMINATIVE OFFICIELLE DES ÉLÈVES — CLASSE : ${className.toUpperCase()}`
    doc.text(mainTitle, 105, 34, { align: 'center' })

    doc.setFontSize(8)
    doc.setTextColor(199, 210, 254)
    doc.text(
      `Effectif Total : ${sorted.length} élève(s)   •   Filles : ${girlsCount}   •   Garçons : ${boysCount}   •   Page ${page + 1}/${totalPages}`,
      105,
      39.5,
      { align: 'center' }
    )

    // En-tête du tableau
    let y = 46
    doc.setFillColor(241, 245, 249)
    doc.setDrawColor(203, 213, 225)
    doc.setLineWidth(0.3)
    doc.rect(14, y, 182, 7.5, 'FD')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(30, 41, 59)
    doc.text('N°', 18, y + 5, { align: 'center' })
    doc.text('MATRICULE', 35, y + 5, { align: 'center' })
    doc.text('NOM & PRÉNOMS', 52, y + 5)
    doc.text('SEXE', 124, y + 5, { align: 'center' })
    doc.text('DATE DE NAISS.', 145, y + 5, { align: 'center' })
    doc.text('TÉL. PARENT', 176, y + 5, { align: 'center' })

    y += 7.5

    const slice = sorted.slice(page * rowsPerPage, (page + 1) * rowsPerPage)
    slice.forEach((st, idx) => {
      const globalIdx = page * rowsPerPage + idx + 1
      const rowH = 7.2
      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252)
        doc.rect(14, y, 182, rowH, 'F')
      }
      doc.setDrawColor(226, 232, 240)
      doc.rect(14, y, 182, rowH, 'S')

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7.5)
      doc.setTextColor(71, 85, 105)
      doc.text(String(globalIdx).padStart(2, '0'), 18, y + 4.8, { align: 'center' })

      doc.setFont('courier', 'bold')
      doc.setTextColor(30, 46, 129)
      doc.text((st.matricule || '—').slice(0, 14), 35, y + 4.8, { align: 'center' })

      doc.setFont('helvetica', 'bold')
      doc.setTextColor(15, 23, 42)
      doc.text(`${st.lastName.toUpperCase()} ${st.firstName}`.slice(0, 38), 52, y + 4.8)

      doc.setFont('helvetica', 'bold')
      doc.setTextColor(51, 65, 85)
      const genderCode = (st.gender || '').toUpperCase().startsWith('F')
        ? 'F'
        : (st.gender || '').toUpperCase().startsWith('M')
        ? 'M'
        : '—'
      doc.text(genderCode, 124, y + 4.8, { align: 'center' })

      doc.setFont('helvetica', 'normal')
      const dobStr = st.dateOfBirth
        ? new Date(st.dateOfBirth).toLocaleDateString('fr-FR')
        : 'Non renseignée'
      doc.text(dobStr, 145, y + 4.8, { align: 'center' })

      doc.text((st.parentPhone || '—').slice(0, 16), 176, y + 4.8, { align: 'center' })

      y += rowH
    })

    // Si dernière page, ajouter l'arrêté officiel + signature et cachet
    if (page === totalPages - 1) {
      const footerY = Math.min(242, y + 8)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8.5)
      doc.setTextColor(30, 41, 59)
      doc.text(
        `Arrêté la présente liste officielle à ${sorted.length} élève(s), dont ${girlsCount} fille(s) et ${boysCount} garçon(s).`,
        14,
        footerY
      )

      const todayStr = new Date().toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8.5)
      doc.text(`Fait à ${first.schoolCity || 'Lomé'}, le ${todayStr}`, 155, footerY + 6, { align: 'center' })
      doc.setFont('helvetica', 'bold')
      doc.text("Le Chef d'Établissement", 155, footerY + 11, { align: 'center' })

      if (stampDataUrl) {
        try {
          doc.addImage(stampDataUrl, 'PNG', 132, footerY + 13, 22, 22)
        } catch {
          drawOfficialVectorStamp(doc, 142, footerY + 24, 9.5, first.schoolName, first.schoolCity)
        }
      } else {
        drawOfficialVectorStamp(doc, 142, footerY + 24, 9.5, first.schoolName, first.schoolCity)
      }

      if (signatureDataUrl) {
        try {
          doc.addImage(signatureDataUrl, 'PNG', 152, footerY + 15, 24, 14)
        } catch {
          // ignore
        }
      }

      if (first.directorName) {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(8.5)
        doc.text(first.directorName, 155, footerY + 36, { align: 'center' })
      }
    }
  }

  const cleanClass = className.replace(/\s+/g, '_')
  const filename = examBadge
    ? `Liste_Officielle_Candidats_${cleanClass}_${first.academicYear.replace(/\//g, '-')}.pdf`
    : `Liste_Officielle_Classe_${cleanClass}_${first.academicYear.replace(/\//g, '-')}.pdf`
  saveOrSharePdf(doc, filename, `Liste officielle — Classe ${className}`)
}

