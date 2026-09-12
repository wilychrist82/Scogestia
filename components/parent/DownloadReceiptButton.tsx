'use client'

import { generatePaymentReceipt } from '@/lib/pdf/receipt'
import { Download } from 'lucide-react'

type Props = {
  payment: any
  student: any
  schoolName: string
  schoolCity: string
  totalDue: number
  totalPaid: number
}

export function DownloadReceiptButton({ payment, student, schoolName, schoolCity, totalDue, totalPaid }: Props) {
  const handleDownload = () => {
    generatePaymentReceipt({
      schoolName,
      schoolCity,
      studentName: `${student.first_name} ${student.last_name}`,
      studentClass: student.classes?.name || 'Non assigné',
      paymentMethod: payment.payment_method || 'Paiement Espèces',
      amount: Number(payment.amount),
      date: new Date(payment.paid_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }),
      reference: payment.transaction_reference || `REC-${payment.id.substring(0, 8).toUpperCase()}`,
      totalDue,
      totalPaid
    })
  }

  return (
    <button 
      onClick={handleDownload}
      className="p-2 text-[var(--color-primary)] hover:bg-green-50 rounded-full transition-colors flex items-center justify-center"
      title="Télécharger le reçu"
    >
      <Download className="w-5 h-5" />
    </button>
  )
}
