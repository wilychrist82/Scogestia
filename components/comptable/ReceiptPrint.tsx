'use client'

import { useRef } from 'react'

type ReceiptData = {
  receiptNumber: string
  date: string
  studentName: string
  className: string
  paymentMethod: string
  label: string
  amountPaid: number
  remaining: number
  schoolName: string
  schoolLogo?: string
  directorSignature?: string
  schoolStamp?: string
  cashierName: string
}

export function ReceiptPrint({ data, onClose }: { data: ReceiptData, onClose: () => void }) {
  const printRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    window.print()
  }

  const renderReceiptBox = (isSouche: boolean = false) => (
    <div className="relative bg-white print:p-0">
      {/* En-tête du reçu (École) */}
      <div className="flex justify-between items-start border-b-2 border-gray-800 pb-4 mb-4">
        <div className="flex items-center gap-4">
          {data.schoolLogo ? (
            <img src={data.schoolLogo} alt="Logo" className="h-16 w-16 object-contain" />
          ) : (
            <div className="h-16 w-16 bg-gray-200 rounded flex items-center justify-center font-bold text-gray-400">LOGO</div>
          )}
          <div>
            <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">{data.schoolName}</h2>
            <p className="text-xs text-gray-600 font-medium">Reçu de Paiement {isSouche && <span className="text-gray-400 ml-2">(SOUCHE)</span>}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold text-gray-800">N° {data.receiptNumber}</p>
          <p className="text-[10px] text-gray-500 mt-1">Date : {data.date}</p>
        </div>
      </div>

      {/* Informations Élève */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-1">Élève</p>
            <p className="font-bold text-gray-900 text-sm">{data.studentName}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-1">Classe</p>
            <p className="font-bold text-gray-900 text-sm">{data.className}</p>
          </div>
        </div>
      </div>

      {/* Détails du paiement */}
      <table className="w-full mb-4">
        <thead>
          <tr className="border-b border-gray-300">
            <th className="text-left py-1 text-[10px] text-gray-600 font-semibold uppercase">Motif du versement</th>
            <th className="text-right py-1 text-[10px] text-gray-600 font-semibold uppercase">Montant</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-gray-100">
            <td className="py-2 text-sm text-gray-800 font-medium">{data.label}</td>
            <td className="py-2 text-sm text-right font-bold text-gray-900">{data.amountPaid.toLocaleString('fr-FR')} FCFA</td>
          </tr>
        </tbody>
      </table>

      {/* Résumé Financier */}
      <div className="flex justify-end mb-4">
        <div className="w-56 space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-gray-600">Mode de paiement:</span>
            <span className="font-semibold text-gray-900 capitalize">{data.paymentMethod}</span>
          </div>
          <div className="flex justify-between text-xs pt-1 border-t border-gray-200">
            <span className="text-gray-600 font-medium">Reste à payer:</span>
            <span className="font-bold text-red-600">{data.remaining.toLocaleString('fr-FR')} FCFA</span>
          </div>
        </div>
      </div>

      {/* Signatures & Cachet */}
      <div className="flex justify-between items-end mt-8 pt-4">
        <div className="text-center">
          <p className="text-[10px] font-semibold text-gray-500 uppercase mb-6">Signature Parent / Élève</p>
          <div className="w-24 border-b border-gray-400 border-dashed mx-auto"></div>
        </div>
        
        <div className="text-center relative">
          <p className="text-[10px] font-semibold text-gray-500 uppercase mb-2">{data.cashierName}</p>
          
          <div className="h-16 w-32 flex items-center justify-center relative mx-auto">
            {data.directorSignature && (
              <img src={data.directorSignature} alt="Signature" className="absolute z-10 max-h-12 opacity-90 rotate-[-5deg]" />
            )}
            {data.schoolStamp && (
              <img src={data.schoolStamp} alt="Cachet" className="absolute z-0 max-h-16 opacity-40 -ml-4 rotate-[15deg]" />
            )}
          </div>
          
          <div className="w-24 border-b border-gray-400 mx-auto mt-2 hidden print:block"></div>
        </div>
      </div>
      
      <div className="text-center mt-4 text-[9px] text-gray-400 print:block">
        Document généré par Scogestia - ERP Scolaire
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* En-tête de la modale (non imprimable) */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50 print:hidden">
          <h3 className="font-bold text-gray-800">Reçu généré avec succès</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Zone imprimable du reçu */}
        <div className="p-8 overflow-y-auto bg-white print:p-0 print:m-0" ref={printRef} id="printable-receipt">
          {/* Style d'impression injecté */}
          <style dangerouslySetInnerHTML={{__html: `
            @media print {
              @page { margin: 15mm; size: A4 portrait; }
              body * { visibility: hidden; }
              #printable-receipt, #printable-receipt * { visibility: visible; }
              #printable-receipt { position: absolute; left: 0; top: 0; width: 100%; }
            }
          `}} />

          {renderReceiptBox(false)}

          {/* Ligne de découpe */}
          <div className="my-8 relative flex items-center print:my-12">
            <div className="flex-grow border-t-2 border-dashed border-gray-400"></div>
            <span className="mx-4 text-gray-400 text-xs tracking-[0.2em] font-medium uppercase">✂ Découper ici</span>
            <div className="flex-grow border-t-2 border-dashed border-gray-400"></div>
          </div>

          {renderReceiptBox(true)}
        </div>

        {/* Actions (non imprimables) */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3 print:hidden">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Fermer
          </button>
          <button 
            onClick={handlePrint}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg flex items-center gap-2 hover:bg-blue-700"
          >
            <span className="material-symbols-outlined text-[18px]">print</span>
            Imprimer le reçu
          </button>
        </div>
      </div>
    </div>
  )
}
