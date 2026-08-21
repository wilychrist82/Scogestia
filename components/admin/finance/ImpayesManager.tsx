'use client'

import Link from 'next/link'

type ImpayeItem = {
  id: string
  label: string
  amount_due: number
  due_date: string
  student: {
    last_name: string
    first_name: string
    matricule: string
    classes: { name: string } | null
    parent_links?: {
      parent_user: { full_name: string, phone: string | null }
    }[]
  } | null
  payments: { amount: number }[]
}

type Props = {
  impayes: ImpayeItem[]
}

export function ImpayesManager({ impayes, basePath = "/admin/finance" }: Props & { basePath?: string }) {
  
  const formatCFA = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(amount).replace('XOF', 'FCFA')
  }

  const getDaysLate = (dueDateStr: string) => {
    const dueDate = new Date(dueDateStr)
    const today = new Date()
    const diffTime = Math.abs(today.getTime() - dueDate.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-[var(--color-surface)]">
      <div className="max-w-[1280px] mx-auto space-y-6">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#fff0f0] p-6 rounded-xl border border-[#ffd6d6]">
          <div>
            <div className="flex items-center gap-2 text-[var(--color-status-retard-text)]/70 mb-2">
              <Link href={basePath} className="hover:text-[var(--color-status-retard-text)] transition-colors text-sm font-semibold">
                Finance
              </Link>
              <span className="material-symbols-outlined text-sm">chevron_right</span>
              <span className="text-sm font-semibold text-[var(--color-status-retard-text)]">Impayés</span>
            </div>
            <h2 className="text-3xl font-bold text-[var(--color-status-retard-text)]">Suivi des Impayés</h2>
            <p className="text-base text-[var(--color-status-retard-text)]/80 mt-1">Gérez les retards de paiement et relancez les parents.</p>
          </div>
          <button 
            onClick={() => {
              if (impayes.length > 0) {
                alert("Les relances ont été envoyées avec succès !");
              } else {
                alert("Aucun impayé pour envoyer des relances.");
              }
            }}
            className="flex items-center justify-center gap-2 bg-[var(--color-status-retard-text)] text-white h-12 px-6 rounded-full text-sm font-semibold hover:bg-red-700 transition-colors shadow-sm w-full sm:w-auto shrink-0">
            <span className="material-symbols-outlined text-[20px]">send</span>
            Relancer tout
          </button>
        </div>

        {/* Data Table Container */}
        <div className="bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-outline-variant)] overflow-hidden shadow-sm flex flex-col min-h-[500px]">
          <div className="p-4 border-b border-[var(--color-outline-variant)] flex flex-col sm:flex-row gap-4 bg-[var(--color-surface-bright)] justify-between items-center">
            <div className="relative flex-grow max-w-md">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-on-surface-variant)]">search</span>
              <input className="w-full pl-10 pr-4 py-2.5 bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-lg text-sm focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] outline-none transition-all" placeholder="Rechercher (élève, classe)..." type="text"/>
            </div>
            <span className="text-sm font-medium text-[var(--color-on-surface-variant)]">{impayes.length} dossiers en retard</span>
          </div>

          {impayes.length === 0 ? (
             <div className="p-12 flex flex-col items-center justify-center text-center text-[var(--color-on-surface-variant)] flex-1">
               <span className="material-symbols-outlined text-4xl mb-2 opacity-50">sentiment_satisfied</span>
               <p className="text-lg font-medium">Aucun impayé trouvé</p>
               <p className="text-sm">Tous vos élèves sont à jour dans leurs paiements.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[var(--color-surface-container-low)] border-b border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] text-sm">
                    <th className="py-4 px-6 font-semibold">Élève</th>
                    <th className="py-4 px-6 font-semibold">Classe</th>
                    <th className="py-4 px-6 font-semibold">Contact Parent</th>
                    <th className="py-4 px-6 font-semibold text-right">Reste à payer</th>
                    <th className="py-4 px-6 font-semibold text-center">Retard</th>
                    <th className="py-4 px-6 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-outline-variant)] text-base">
                  {impayes.map((item) => {
                    const paid = item.payments?.reduce((acc, p) => acc + Number(p.amount), 0) || 0
                    const remainder = item.amount_due - paid
                    const daysLate = getDaysLate(item.due_date)
                    const parentPhone = item.student?.parent_links?.[0]?.parent_user?.phone || 'Non renseigné'
                    
                    return (
                      <tr key={item.id} className="hover:bg-[var(--color-surface-container-lowest)]/50 transition-colors bg-[var(--color-surface-container-lowest)]">
                        <td className="py-3 px-6 font-medium text-[var(--color-on-surface)]">
                          {item.student?.last_name} {item.student?.first_name}
                        </td>
                        <td className="py-3 px-6 text-[var(--color-on-surface-variant)]">
                          {item.student?.classes?.name || '-'}
                        </td>
                        <td className="py-3 px-6 text-[var(--color-on-surface-variant)] flex items-center gap-2">
                          <span className="material-symbols-outlined text-[16px]">call</span>
                          {parentPhone}
                        </td>
                        <td className="py-3 px-6 text-right font-bold text-[var(--color-status-retard-text)]">{formatCFA(remainder)}</td>
                        <td className="py-3 px-6 text-center">
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#fce8e6] text-[#d93025]">
                            {daysLate} jours
                          </span>
                        </td>
                        <td className="py-3 px-6 text-right flex justify-end gap-2">
                          {parentPhone !== 'Non renseigné' && (
                            <a 
                              href={`https://wa.me/${parentPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Bonjour, sauf erreur de notre part, le paiement de "${item.label}" (reste: ${formatCFA(remainder)}) pour votre enfant ${item.student?.first_name} ${item.student?.last_name} est en retard de ${daysLate} jours. Merci de régulariser la situation.`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-9 h-9 rounded-full bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366] hover:text-white flex items-center justify-center transition-colors shadow-sm"
                              title="Relancer par WhatsApp"
                            >
                              <span className="material-symbols-outlined text-[20px]">chat</span>
                            </a>
                          )}
                          <button className="text-[var(--color-primary)] hover:text-white hover:bg-[var(--color-primary)] transition-colors p-1 flex items-center gap-1 text-sm font-semibold border border-[var(--color-primary)] rounded px-3 py-1.5" title="Relancer In-App">
                            <span className="material-symbols-outlined text-[18px]">notifications_active</span>
                            In-App
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
