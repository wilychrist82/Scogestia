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
  parentPhone?: string | null
  address?: string | null
  schoolName: string
  schoolCity?: string | null
  schoolPhone?: string | null
  schoolEmail?: string | null
  academicYear: string
  directorName?: string | null
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
 * Génère un Certificat de Scolarité officiel au format A4
 */
export function generateSchoolCertificatePDF(data: StudentDocumentData) {
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
  doc.rect(14.5, 14.5, 181, 28, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text(data.schoolName.toUpperCase(), 105, 26, { align: 'center' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  const subHeader = [
    data.schoolCity ? `Ville : ${data.schoolCity}` : null,
    data.schoolPhone ? `Tél : ${data.schoolPhone}` : null,
    `Année académique : ${data.academicYear}`,
  ]
    .filter(Boolean)
    .join('  •  ')
  doc.text(subHeader, 105, 35, { align: 'center' })

  // Référence et date
  doc.setTextColor(80, 80, 80)
  doc.setFontSize(9.5)
  doc.text(`Réf : ${refNumber}`, 22, 54)
  doc.text(`${data.schoolCity || 'Fait'}, le ${today}`, 188, 54, { align: 'right' })

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
    `Le Chef d'Établissement de ${data.schoolName} certifie par la présente que :`,
    22,
    102
  )

  // Encadré Identité de l'élève
  doc.setFillColor(248, 250, 252)
  doc.setDrawColor(203, 213, 225)
  doc.roundedRect(22, 110, 166, 68, 3, 3, 'FD')

  const startY = 122
  const lineSpacing = 11
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
    ['Classe fréquentée :', data.className || 'Non assignée'],
    ['Année scolaire :', data.academicYear],
  ]

  rows.forEach(([label, value], idx) => {
    const y = startY + idx * lineSpacing
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 116, 139)
    doc.text(label, 28, y)

    doc.setFont('helvetica', 'bold')
    doc.setTextColor(15, 23, 42)
    doc.text(value, 88, y)
  })

  // Mention légale de fréquentation
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11.5)
  doc.setTextColor(30, 41, 59)
  const attestationText =
    `Est régulièrement inscrit(e) dans les registres de notre établissement pour le compte de l'année académique ${data.academicYear} et suit assidûment les cours dans la classe de ${data.className}.\n\n` +
    `En foi de quoi, le présent certificat lui est délivré pour servir et valoir ce que de droit.`
  const splitText = doc.splitTextToSize(attestationText, 166)
  doc.text(splitText, 22, 194)

  // Bloc Signature & Cachet
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('La Direction', 150, 232, { align: 'center' })
  if (data.directorName) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text(data.directorName, 150, 260, { align: 'center' })
  } else {
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(9)
    doc.setTextColor(148, 163, 184)
    doc.text('(Cachet et signature)', 150, 248, { align: 'center' })
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
 * Génère une Carte d'Identité Scolaire (Recto / Verso côte à côte prêts à imprimer et plastifier)
 */
export function generateStudentIdCardPDF(data: StudentDocumentData) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  // Titre de la planche d'impression
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(15, 23, 42)
  doc.text(`CARTE D'IDENTITÉ SCOLAIRE — ${data.schoolName.toUpperCase()}`, 105, 22, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(100, 116, 139)
  doc.text('Découpez le long des bordures et pliez au centre pour plastification (Format CR80 : 86 x 54 mm)', 105, 28, {
    align: 'center',
  })

  // Dimensions carte : 86mm x 54mm
  // Recto : x=18, y=40 | Verso : x=106, y=40
  const cardW = 86
  const cardH = 54
  const rectoX = 18
  const versoX = 106
  const cardY = 40

  // ── RECTO ──
  doc.setDrawColor(6, 95, 70)
  doc.setLineWidth(0.5)
  doc.setFillColor(255, 255, 255)
  doc.roundedRect(rectoX, cardY, cardW, cardH, 3, 3, 'FD')

  // Bandeau haut Recto
  doc.setFillColor(6, 95, 70)
  doc.roundedRect(rectoX, cardY, cardW, 13, 3, 3, 'F')
  doc.rect(rectoX, cardY + 8, cardW, 5, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.text(data.schoolName.toUpperCase().slice(0, 34), rectoX + cardW / 2, cardY + 5.5, { align: 'center' })
  doc.setFontSize(6.8)
  doc.setFont('helvetica', 'normal')
  doc.text(`CARTE SCOLAIRE • ANNÉE ${data.academicYear}`, rectoX + cardW / 2, cardY + 10.5, { align: 'center' })

  // Cadre Photo (gauche)
  doc.setFillColor(240, 253, 244)
  doc.setDrawColor(167, 243, 208)
  doc.roundedRect(rectoX + 4, cardY + 16, 22, 27, 2, 2, 'FD')
  doc.setTextColor(6, 95, 70)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  const initials = `${(data.firstName[0] || '').toUpperCase()}${(data.lastName[0] || '').toUpperCase()}`
  doc.text(initials, rectoX + 15, cardY + 31, { align: 'center' })
  doc.setFontSize(5.5)
  doc.text('PHOTO', rectoX + 15, cardY + 39, { align: 'center' })

  // Informations élève (droite)
  const infoX = rectoX + 29
  doc.setTextColor(15, 23, 42)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.text(data.lastName.toUpperCase().slice(0, 22), infoX, cardY + 19.5)
  doc.setFontSize(8)
  doc.text(data.firstName.slice(0, 24), infoX, cardY + 24)

  doc.setFontSize(6.8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(71, 85, 105)
  doc.text(`Matricule : ${data.matricule}`, infoX, cardY + 29.5)
  doc.text(`Classe : ${data.className}`, infoX, cardY + 34)
  doc.text(
    `Né(e) le : ${data.dateOfBirth ? new Date(data.dateOfBirth).toLocaleDateString('fr-FR') : 'N/R'}`,
    infoX,
    cardY + 38.5
  )
  doc.text(
    `Sexe : ${data.gender || 'N/R'}   •   Groupe sanguin : ${data.bloodGroup || 'N/R'}`,
    infoX,
    cardY + 43
  )

  // Pied Recto
  doc.setFillColor(241, 245, 249)
  doc.rect(rectoX + 0.5, cardY + cardH - 6.5, cardW - 1, 6, 'F')
  doc.setTextColor(6, 95, 70)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6.5)
  doc.text(`ID #${data.matricule} • VALIDE POUR L'ANNÉE ${data.academicYear}`, rectoX + cardW / 2, cardY + cardH - 2.5, {
    align: 'center',
  })

  // ── VERSO ──
  doc.setDrawColor(6, 95, 70)
  doc.setLineWidth(0.5)
  doc.setFillColor(255, 255, 255)
  doc.roundedRect(versoX, cardY, cardW, cardH, 3, 3, 'FD')

  doc.setTextColor(6, 95, 70)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.text('INFORMATIONS D\'URGENCE & RÈGLEMENT', versoX + cardW / 2, cardY + 7, { align: 'center' })
  doc.setDrawColor(226, 232, 240)
  doc.line(versoX + 5, cardY + 9, versoX + cardW - 5, cardY + 9)

  doc.setTextColor(30, 41, 59)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.8)
  doc.text(`Contact Parent / Tuteur : ${data.parentPhone || 'Non renseigné'}`, versoX + 5, cardY + 15)
  doc.text(`Adresse : ${(data.address || data.schoolCity || 'Non renseignée').slice(0, 38)}`, versoX + 5, cardY + 20)
  doc.text(`Tél. Établissement : ${data.schoolPhone || 'Direction'}`, versoX + 5, cardY + 25)

  doc.setFont('helvetica', 'italic')
  doc.setFontSize(6)
  doc.setTextColor(100, 116, 139)
  const rulesText = doc.splitTextToSize(
    'Cette carte est strictement personnelle et doit être présentée à toute réquisition au sein de l\'établissement. Toute personne trouvant cette carte est priée de la remettre à la direction de l\'école.',
    cardW - 10
  )
  doc.text(rulesText, versoX + 5, cardY + 32)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6.5)
  doc.setTextColor(15, 23, 42)
  doc.text('Cachet et Signature :', versoX + cardW - 22, cardY + 45, { align: 'center' })

  const filename = `Carte_Scolaire_${data.lastName}_${data.firstName}_${data.matricule}.pdf`
  saveOrSharePdf(doc, filename, `Carte scolaire — ${data.firstName} ${data.lastName}`)
}

