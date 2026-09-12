import jsPDF from 'jspdf'

export type ReceiptData = {
  schoolName: string
  schoolCity: string
  studentName: string
  studentClass: string
  paymentMethod: string
  amount: number
  date: string
  reference: string
  totalDue?: number
  totalPaid?: number
}

export function generatePaymentReceipt(data: ReceiptData) {
  const doc = new jsPDF()
  
  const balance = (data.totalDue || 0) - (data.totalPaid || 0)
  const balanceText = balance > 0 ? balance.toLocaleString('fr-FR') + ' FCFA' : 'Soldé (0 FCFA)'

  // Couleurs et Fonts
  doc.setFont("helvetica")
  
  // Header / Logo area
  doc.setFillColor(6, 95, 70) // --color-primary #065F46
  doc.rect(0, 0, 210, 40, 'F')
  
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(22)
  doc.setFont("helvetica", "bold")
  doc.text(data.schoolName, 105, 20, { align: 'center' })
  
  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.text(data.schoolCity, 105, 30, { align: 'center' })

  // Titre du Reçu
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(18)
  doc.setFont("helvetica", "bold")
  doc.text('REÇU DE PAIEMENT', 105, 60, { align: 'center' })
  
  // Réf & Date
  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(100, 100, 100)
  doc.text(`Réf: ${data.reference || 'N/A'}`, 14, 75)
  doc.text(`Date: ${data.date}`, 140, 75)
  
  // Ligne de séparation
  doc.setDrawColor(200, 200, 200)
  doc.line(14, 80, 196, 80)

  // Informations de l'élève
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(12)
  doc.setFont("helvetica", "bold")
  doc.text('INFORMATIONS DE L\'ÉLÈVE', 14, 95)
  
  doc.setFontSize(11)
  doc.setFont("helvetica", "normal")
  doc.text(`Nom de l'élève :`, 14, 105)
  doc.setFont("helvetica", "bold")
  doc.text(data.studentName, 60, 105)
  
  doc.setFont("helvetica", "normal")
  doc.text(`Classe :`, 14, 115)
  doc.setFont("helvetica", "bold")
  doc.text(data.studentClass, 60, 115)

  // Ligne de séparation
  doc.line(14, 125, 196, 125)

  // Détails du paiement
  doc.setFontSize(12)
  doc.setFont("helvetica", "bold")
  doc.text('DÉTAILS DU PAIEMENT', 14, 140)
  
  doc.setFontSize(11)
  doc.setFont("helvetica", "normal")
  doc.text(`Montant versé :`, 14, 150)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(46, 125, 50) // Vert pour le montant
  doc.text(`${data.amount.toLocaleString('fr-FR')} FCFA`, 60, 150)
  
  doc.setTextColor(0, 0, 0)
  doc.setFont("helvetica", "normal")
  doc.text(`Méthode :`, 14, 160)
  doc.setFont("helvetica", "bold")
  doc.text(data.paymentMethod, 60, 160)

  // Section Solde (si fourni)
  if (data.totalDue !== undefined) {
    doc.line(14, 170, 196, 170)
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.text('SITUATION FINANCIÈRE', 14, 185)
    
    doc.setFontSize(11)
    doc.setFont("helvetica", "normal")
    doc.text(`Reste à payer :`, 14, 195)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(data.totalDue - (data.totalPaid || 0) > 0 ? 220 : 46, data.totalDue - (data.totalPaid || 0) > 0 ? 50 : 125, 50)
    doc.text(balanceText, 60, 195)
    doc.setTextColor(0, 0, 0)
  }

  // Pied de page
  doc.setFontSize(9)
  doc.setFont("helvetica", "italic")
  doc.setTextColor(150, 150, 150)
  doc.text('Ce reçu est généré automatiquement et sert de preuve de paiement.', 105, 270, { align: 'center' })
  doc.text(`Généré le ${new Date().toLocaleString('fr-FR')} par Scogestia`, 105, 276, { align: 'center' })

  // Sauvegarder le PDF
  const filename = `Reçu_${data.studentName.replace(/\\s+/g, '_')}_${data.date.replace(/\\//g, '-')}.pdf`
  doc.save(filename)
}
