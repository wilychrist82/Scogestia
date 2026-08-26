'use client'

import { useState, useTransition } from 'react'
import { processCashPayment } from '@/app/actions/cash_register'
import { ReceiptPrint } from './ReceiptPrint'

type DueData = {
  id: string
  label: string
  amount: number
  status: string
  due_date: string
  paid_amount: number // calculé côté serveur
}

type StudentData = {
  id: string
  first_name: string
  last_name: string
  class_name: string
  dues: DueData[]
}

type Props = {
  students: StudentData[]
  schoolData: {
    name: string
    logo_url?: string
    director_signature_url?: string
    stamp_url?: string
  }
}

export function CashRegister({ students, schoolData }: Props) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  
  const [selectedDue, setSelectedDue] = useState<DueData | null>(null)
  const [amountToPay, setAmountToPay] = useState<string>('')
  const [paymentMethod, setPaymentMethod] = useState<'especes' | 'cheque'>('especes')
  
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  
  const [receiptData, setReceiptData] = useState<any | null>(null)

  const filteredStudents = students.filter(s => 
    `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const selectedStudent = students.find(s => s.id === selectedStudentId)

  const handlePayClick = (due: DueData) => {
    setSelectedDue(due)
    setAmountToPay((due.amount - due.paid_amount).toString()) // Par défaut, solde total
    setError(null)
  }

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDue || !selectedStudent) return

    const numAmount = Number(amountToPay)
    const remaining = selectedDue.amount - selectedDue.paid_amount

    if (numAmount <= 0) {
      setError("Le montant doit être supérieur à 0")
      return
    }
    if (numAmount > remaining) {
      setError(`Le montant saisi (${numAmount}) dépasse le reste à payer (${remaining})`)
      return
    }

    setError(null)
    startTransition(async () => {
      const result = await processCashPayment({
        due_id: selectedDue.id,
        amount_paid: numAmount,
        payment_method: paymentMethod
      })

      if (result.error) {
        setError(result.error)
      } else if (result.success) {
        // Préparer les données pour le reçu
        setReceiptData({
          receiptNumber: result.payment.receipt_number,
          date: new Date().toLocaleDateString('fr-FR'),
          studentName: `${selectedStudent.first_name} ${selectedStudent.last_name}`,
          className: selectedStudent.class_name,
          paymentMethod: paymentMethod,
          label: selectedDue.label,
          amountPaid: numAmount,
          remaining: result.remaining,
          schoolName: schoolData.name,
          schoolLogo: schoolData.logo_url,
          directorSignature: schoolData.director_signature_url,
          schoolStamp: schoolData.stamp_url
        })
        
        // Update local state (optimistic or wait for refresh)
        // Here we just let the page refresh via revalidatePath, but we clear the modal
        setSelectedDue(null)
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Recherche et sélection de l'élève */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Rechercher un élève</h2>
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-3 text-gray-400">search</span>
          <input 
            type="text" 
            placeholder="Nom ou prénom de l'élève..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
          />
        </div>

        {searchTerm.length > 1 && !selectedStudentId && (
          <div className="mt-2 border border-gray-200 rounded-lg overflow-hidden divide-y divide-gray-100 max-h-60 overflow-y-auto">
            {filteredStudents.length > 0 ? filteredStudents.map(student => (
              <button 
                key={student.id}
                onClick={() => setSelectedStudentId(student.id)}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 flex justify-between items-center"
              >
                <div>
                  <div className="font-semibold text-gray-800">{student.first_name} {student.last_name}</div>
                  <div className="text-xs text-gray-500">Classe : {student.class_name}</div>
                </div>
                <span className="material-symbols-outlined text-gray-400">chevron_right</span>
              </button>
            )) : (
              <div className="p-4 text-center text-sm text-gray-500">Aucun élève trouvé.</div>
            )}
          </div>
        )}
      </div>

      {/* Détails de l'élève et échéances */}
      {selectedStudent && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start mb-6 pb-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{selectedStudent.first_name} {selectedStudent.last_name}</h2>
              <p className="text-gray-500">Classe : {selectedStudent.class_name}</p>
            </div>
            <button 
              onClick={() => { setSelectedStudentId(null); setSearchTerm(''); }}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
            >
              Changer d'élève
            </button>
          </div>

          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">Situation Financière</h3>
          
          <div className="space-y-4">
            {selectedStudent.dues.length > 0 ? selectedStudent.dues.map(due => {
              const remaining = due.amount - due.paid_amount
              const isPaid = remaining <= 0

              return (
                <div key={due.id} className={`p-4 rounded-xl border flex flex-col md:flex-row justify-between items-center gap-4 ${isPaid ? 'border-green-200 bg-green-50/50' : 'border-gray-200 bg-white'}`}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-gray-800">{due.label}</h4>
                      {isPaid ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 uppercase tracking-wider">Soldé</span>
                      ) : due.paid_amount > 0 ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-100 text-yellow-700 uppercase tracking-wider">Partiel</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 uppercase tracking-wider">Impayé</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 flex gap-4">
                      <span>Total: {due.amount.toLocaleString()} F</span>
                      <span>Payé: {due.paid_amount.toLocaleString()} F</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="text-right">
                      <div className="text-xs text-gray-500">Reste à payer</div>
                      <div className={`font-black text-lg ${isPaid ? 'text-green-600' : 'text-red-600'}`}>
                        {remaining.toLocaleString()} F
                      </div>
                    </div>
                    {!isPaid && (
                      <button 
                        onClick={() => handlePayClick(due)}
                        className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm whitespace-nowrap"
                      >
                        Encaisser
                      </button>
                    )}
                  </div>
                </div>
              )
            }) : (
              <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl border border-gray-100 border-dashed">
                Aucune échéance trouvée pour cet élève.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modale de Paiement */}
      {selectedDue && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Encaisser un paiement</h3>
            
            <div className="bg-blue-50 border border-blue-100 text-blue-800 p-3 rounded-lg text-sm mb-6">
              <strong>Échéance :</strong> {selectedDue.label}<br />
              <strong>Reste à payer :</strong> {(selectedDue.amount - selectedDue.paid_amount).toLocaleString()} FCFA
            </div>

            <form onSubmit={handlePaymentSubmit}>
              {error && (
                <div className="p-3 mb-4 text-sm text-red-600 bg-red-50 rounded-lg border border-red-200">
                  {error}
                </div>
              )}

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Montant versé (FCFA)</label>
                  <input 
                    type="number" 
                    value={amountToPay}
                    onChange={(e) => setAmountToPay(e.target.value)}
                    required
                    min="1"
                    max={selectedDue.amount - selectedDue.paid_amount}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mode de paiement</label>
                  <select 
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as 'especes' | 'cheque')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    <option value="especes">Espèces</option>
                    <option value="cheque">Chèque</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <button 
                  type="button" 
                  onClick={() => setSelectedDue(null)}
                  disabled={isPending}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  disabled={isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  {isPending && <span className="material-symbols-outlined animate-spin text-[16px]">sync</span>}
                  Valider le paiement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modale du Reçu */}
      {receiptData && (
        <ReceiptPrint 
          data={receiptData} 
          onClose={() => setReceiptData(null)} 
        />
      )}
    </div>
  )
}
