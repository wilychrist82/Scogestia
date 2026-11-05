import jsPDF from 'jspdf'

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
}

/**
 * Convertit n'importe quelle URL d'image (PNG, JPG, WebP) en PNG Base64 compatible jsPDF
 */
async function loadImageAsPngDataUrl(url?: string | null): Promise<string | null> {
  if (!url || typeof window === 'undefined') return null
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    const timeout = setTimeout(() => resolve(null), 4500)

    img.onload = () => {
      clearTimeout(timeout)
      try {
        const canvas = document.createElement('canvas')
        canvas.width = img.naturalWidth || 300
        canvas.height = img.naturalHeight || 300
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(null)
          return
        }
        ctx.drawImage(img, 0, 0)
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
 * Dessine une Carte d'Identité Scolaire complète (Recto + Verso côte à côte) à la position verticale cardY
 */
function drawStudentIdCardPairOnPage(
  doc: jsPDF,
  data: StudentDocumentData,
  cardY: number,
  assets: {
    photoDataUrl: string | null
    logoDataUrl: string | null
    stampDataUrl: string | null
    signatureDataUrl: string | null
  }
) {
  const cardW = 88
  const cardH = 56
  const rectoX = 15
  const versoX = 107
  const examLabel = detectOfficialExamLabel(data.className, data.classLevel)

  // ── RECTO (MODÈLE OFFICIEL EXAMENS CEPD / BEPC / BAC 1 / BAC 2) ──
  doc.setDrawColor(6, 95, 70)
  doc.setLineWidth(0.6)
  doc.setFillColor(255, 255, 255)
  doc.roundedRect(rectoX, cardY, cardW, cardH, 2.5, 2.5, 'FD')

  // Bordure intérieure fine officielle
  doc.setDrawColor(167, 243, 208)
  doc.setLineWidth(0.2)
  doc.roundedRect(rectoX + 1.2, cardY + 1.2, cardW - 2.4, cardH - 2.4, 2, 2, 'S')

  // Bandeau supérieur institutionnel
  doc.setFillColor(6, 95, 70)
  doc.roundedRect(rectoX, cardY, cardW, 14.5, 2.5, 2.5, 'F')
  doc.rect(rectoX, cardY + 10, cardW, 4.5, 'F')

  // Logo école en haut à gauche du bandeau
  if (assets.logoDataUrl) {
    try {
      doc.setFillColor(255, 255, 255)
      doc.roundedRect(rectoX + 2.2, cardY + 1.8, 10.5, 10.5, 1.5, 1.5, 'F')
      doc.addImage(assets.logoDataUrl, 'PNG', rectoX + 2.7, cardY + 2.3, 9.5, 9.5)
    } catch {
      // Ignore
    }
  }

  // Devise + Nom de l'établissement en MAJUSCULE centré en haut
  const headerCenterX = assets.logoDataUrl ? rectoX + cardW / 2 + 3 : rectoX + cardW / 2
  doc.setTextColor(209, 250, 229)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(5.2)
  doc.text('RÉPUBLIQUE TOGOLAISE — Travail • Liberté • Patrie', headerCenterX, cardY + 3.8, { align: 'center' })

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.2)
  doc.text(data.schoolName.toUpperCase().slice(0, 34), headerCenterX, cardY + 8.3, { align: 'center' })

  // Sous-bandeau titre Carte d'Identité Scolaire + Badge Examen (CEPD / BEPC / BAC1 / BAC2)
  doc.setFontSize(6.3)
  doc.setTextColor(254, 240, 138) // Or clair
  const cardTitle = examLabel
    ? `CARTE SCOLAIRE (${examLabel}) • ${data.academicYear}`
    : `CARTE D'IDENTITÉ SCOLAIRE • ANNÉE ${data.academicYear}`
  doc.text(cardTitle, headerCenterX, cardY + 12.6, { align: 'center' })

  // Cadre Rectangulaire Officiel Photo Passeport (Gauche : 22mm x 28mm)
  const photoX = rectoX + 3.2
  const photoY = cardY + 16.5
  const photoW = 22
  const photoH = 28

  doc.setFillColor(248, 250, 252)
  doc.setDrawColor(6, 95, 70)
  doc.setLineWidth(0.45)
  doc.rect(photoX, photoY, photoW, photoH, 'FD')

  if (assets.photoDataUrl) {
    try {
      doc.addImage(assets.photoDataUrl, 'PNG', photoX + 0.4, photoY + 0.4, photoW - 0.8, photoH - 0.8)
    } catch {
      // Fallback initiales
    }
  } else {
    doc.setDrawColor(203, 213, 225)
    doc.setLineWidth(0.2)
    doc.rect(photoX + 1.2, photoY + 1.2, photoW - 2.4, photoH - 2.4, 'S')
    doc.setTextColor(6, 95, 70)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    const initials = `${(data.lastName[0] || '').toUpperCase()}${(data.firstName[0] || '').toUpperCase()}`
    doc.text(initials, photoX + photoW / 2, photoY + 13, { align: 'center' })
    doc.setFontSize(4.8)
    doc.setTextColor(100, 116, 139)
    doc.text('PHOTO', photoX + photoW / 2, photoY + 19, { align: 'center' })
    doc.text('PASSEPORT', photoX + photoW / 2, photoY + 22, { align: 'center' })
  }

  // Informations Officielles de l'élève (Droite)
  const infoX = rectoX + 27.5
  let lineY = cardY + 19.5

  const drawField = (label: string, value: string, highlight = false) => {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.2)
    doc.setTextColor(100, 116, 139)
    doc.text(label, infoX, lineY)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(highlight ? 7.4 : 6.7)
    doc.setTextColor(highlight ? 6 : 15, highlight ? 95 : 23, highlight ? 70 : 42)
    doc.text(value, infoX + 16.5, lineY)
    lineY += 4.3
  }

  drawField('Nom :', data.lastName.toUpperCase().slice(0, 22), true)
  drawField('Prénoms :', data.firstName.slice(0, 24))
  drawField('Matricule :', data.matricule, true)
  const birthStr = `${data.dateOfBirth ? new Date(data.dateOfBirth).toLocaleDateString('fr-FR') : 'N/R'}${
    data.birthPlace ? ` à ${data.birthPlace.slice(0, 12)}` : ''
  }`
  drawField('Né(e) le :', birthStr)
  drawField('Sexe :', `${data.gender === 'F' ? 'Féminin (F)' : data.gender === 'M' ? 'Masculin (M)' : 'N/R'}   •   Classe : ${data.className}`)

  // Zone Cachet de l'école & Signature du Directeur (en bas à droite du Recto)
  const sigCenterX = rectoX + cardW - 19
  const stampCenterX = rectoX + cardW - 35
  const stampCenterY = cardY + 46.5

  if (assets.stampDataUrl) {
    try {
      doc.addImage(assets.stampDataUrl, 'PNG', stampCenterX - 7.5, stampCenterY - 7.5, 15, 15)
    } catch {
      drawOfficialVectorStamp(doc, stampCenterX, stampCenterY, 7, data.schoolName, data.schoolCity)
    }
  } else {
    drawOfficialVectorStamp(doc, stampCenterX, stampCenterY, 7, data.schoolName, data.schoolCity)
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(5.4)
  doc.setTextColor(15, 23, 42)
  doc.text('Le Directeur', sigCenterX, cardY + 42, { align: 'center' })

  if (assets.signatureDataUrl) {
    try {
      doc.addImage(assets.signatureDataUrl, 'PNG', sigCenterX - 9, cardY + 42.8, 18, 7.5)
    } catch {
      // Ignore
    }
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(5.2)
  doc.setTextColor(30, 41, 59)
  doc.text(
    (data.directorName || 'Cachet & Signature').slice(0, 22),
    sigCenterX,
    cardY + 52.5,
    { align: 'center' }
  )

  // Matricule en bas sous la photo
  doc.setFillColor(240, 253, 244)
  doc.setDrawColor(167, 243, 208)
  doc.roundedRect(photoX, cardY + 46, photoW, 7, 1.2, 1.2, 'FD')
  doc.setTextColor(6, 95, 70)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(5.8)
  doc.text(`ID: ${data.matricule}`, photoX + photoW / 2, cardY + 50.5, { align: 'center' })

  // ── VERSO (URGENCE, GROUPE SANGUIN, QR DE CONTRÔLE & CACHET) ──
  doc.setDrawColor(6, 95, 70)
  doc.setLineWidth(0.6)
  doc.setFillColor(255, 255, 255)
  doc.roundedRect(versoX, cardY, cardW, cardH, 2.5, 2.5, 'FD')

  doc.setFillColor(240, 253, 244)
  doc.roundedRect(versoX + 0.5, cardY + 0.5, cardW - 1, 9, 2, 2, 'F')
  doc.setTextColor(6, 95, 70)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6.8)
  doc.text("INFORMATIONS D'URGENCE & CONTRÔLE OFFICIEL", versoX + cardW / 2, cardY + 6, { align: 'center' })

  doc.setTextColor(30, 41, 59)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.4)
  doc.text(`Parent / Tuteur (Urgence) : ${data.parentPhone || 'Non renseigné'}`, versoX + 4.5, cardY + 15)
  doc.text(`Groupe Sanguin : ${data.bloodGroup || 'Non renseigné'}`, versoX + 4.5, cardY + 20)
  doc.text(`Adresse : ${(data.address || data.schoolCity || 'Non renseignée').slice(0, 34)}`, versoX + 4.5, cardY + 25)
  doc.text(`Tél. Établissement : ${data.schoolPhone || 'Direction'}`, versoX + 4.5, cardY + 30)

  // QR Code / Matrice de sécurité à droite du Verso
  drawSecurityMatrixCode(
    doc,
    versoX + cardW - 21,
    cardY + 13,
    16,
    `${data.schoolName}|${data.matricule}|${data.lastName}|${data.academicYear}`
  )
  doc.setFontSize(4.8)
  doc.setTextColor(100, 116, 139)
  doc.text('VÉRIFICATION', versoX + cardW - 13, cardY + 32, { align: 'center' })

  // Mention officielle au verso
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(5.6)
  doc.setTextColor(71, 85, 105)
  const rulesText = doc.splitTextToSize(
    "Cette carte d'identité scolaire est strictement personnelle et exigée lors des contrôles et examens officiels (CEPD, BEPC, BAC 1, BAC 2). Toute personne trouvant cette carte est priée de la remettre à la direction de l'établissement.",
    cardW - 9
  )
  doc.text(rulesText, versoX + 4.5, cardY + 37.5)

  // Bandeau pied Verso
  doc.setFillColor(6, 95, 70)
  doc.rect(versoX, cardY + cardH - 6, cardW, 6, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(5.8)
  doc.text(
    `${data.schoolName.toUpperCase().slice(0, 32)} • ANNÉE SCOLAIRE ${data.academicYear}`,
    versoX + cardW / 2,
    cardY + cardH - 2.2,
    { align: 'center' }
  )
}

/**
 * Génère la Carte d'Identité Scolaire individuelle d'un élève (Recto / Verso avec Photo Passeport, Cachet et Signature)
 */
export async function generateStudentIdCardPDF(data: StudentDocumentData) {
  const [photoDataUrl, logoDataUrl, stampDataUrl, signatureDataUrl] = await Promise.all([
    loadImageAsPngDataUrl(data.avatarUrl),
    loadImageAsPngDataUrl(data.schoolLogoUrl),
    loadImageAsPngDataUrl(data.schoolStampUrl),
    loadImageAsPngDataUrl(data.schoolSignatureUrl),
  ])

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(15, 23, 42)
  doc.text(`CARTE D'IDENTITÉ SCOLAIRE OFFICIELLE — ${data.schoolName.toUpperCase()}`, 105, 20, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.8)
  doc.setTextColor(100, 116, 139)
  doc.text(
    'Planche Recto / Verso prête à découper, plier au centre et plastifier (Format officiel CR80)',
    105,
    26,
    { align: 'center' }
  )

  drawStudentIdCardPairOnPage(doc, data, 36, {
    photoDataUrl,
    logoDataUrl,
    stampDataUrl,
    signatureDataUrl,
  })

  const filename = `Carte_Scolaire_${data.lastName}_${data.firstName}_${data.matricule}.pdf`
  saveOrSharePdf(doc, filename, `Carte scolaire — ${data.firstName} ${data.lastName}`)
}

/**
 * Génère en 1 seul clic un PDF multi-pages contenant les Cartes Scolaires de TOUTE UNE CLASSE (4 élèves par page A4)
 */
export async function generateClassStudentIdCardsPDF(
  className: string,
  studentsData: StudentDocumentData[]
) {
  if (!studentsData.length) return

  const first = studentsData[0]
  const [logoDataUrl, stampDataUrl, signatureDataUrl] = await Promise.all([
    loadImageAsPngDataUrl(first.schoolLogoUrl),
    loadImageAsPngDataUrl(first.schoolStampUrl),
    loadImageAsPngDataUrl(first.schoolSignatureUrl),
  ])

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const cardsPerPage = 4
  const yPositions = [24, 88, 152, 216]

  for (let i = 0; i < studentsData.length; i++) {
    const slotIndex = i % cardsPerPage
    if (i > 0 && slotIndex === 0) {
      doc.addPage()
    }

    if (slotIndex === 0) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.setTextColor(15, 23, 42)
      doc.text(
        `PLANCHE DE CARTES SCOLAIRES — CLASSE : ${className.toUpperCase()} (${first.academicYear})`,
        105,
        13,
        { align: 'center' }
      )
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7.5)
      doc.setTextColor(100, 116, 139)
      doc.text(
        `Page ${Math.floor(i / cardsPerPage) + 1} / ${Math.ceil(studentsData.length / cardsPerPage)} • Découpez chaque bande Recto/Verso et pliez au centre pour plastification`,
        105,
        18,
        { align: 'center' }
      )
    }

    const student = studentsData[i]
    const photoDataUrl = await loadImageAsPngDataUrl(student.avatarUrl)

    drawStudentIdCardPairOnPage(doc, student, yPositions[slotIndex], {
      photoDataUrl,
      logoDataUrl,
      stampDataUrl,
      signatureDataUrl,
    })
  }

  const cleanClass = className.replace(/\s+/g, '_')
  const filename = `Cartes_Scolaires_Classe_${cleanClass}_${first.academicYear.replace(/\//g, '-')}.pdf`
  saveOrSharePdf(doc, filename, `Cartes scolaires — Classe ${className}`)
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
