'use client'

import { useState, useTransition, FormEvent } from 'react'
import { recordPayment } from '@/app/actions/finance'
import Link from 'next/link'

type PaymentItem = {
  id: string
  amount: number
  payment_method: string
  transaction_reference: string
  paid_at: string
  schedule: {
    label: string
  } | null
  student: {
    last_name: string
    first_name: string
    classes: { name: string } | null
  } | null
  recorded_by_user: {
    full_name: string
  } | null
}

type ScheduleItem = {
  id: string
  label: string
  amount_due: number
  status: string
  student: { last_name: string, first_name: string, matricule: string } | null
}

type Props = {
  payments: PaymentItem[]
  pendingSchedules: ScheduleItem[]
}

export function PaiementsManager({ payments, pendingSchedules, basePath = "/admin/finance" }: Props & { basePath?: string }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [isSmsPending, setIsSmsPending] = useState(false)

  const handleTriggerSMS = async () => {
    setIsSmsPending(true)
    setError(null)
    try {
      const res = await fetch('/api/cron/payment-reminders')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur lors de l\'envoi')
      alert(`Relances terminées : ${data.data?.stats?.['j-3_sent'] || 0} rappels J-3, ${data.data?.stats?.['overdue_sent'] || 0} rappels en retard envoyés.`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSmsPending(false)
    }
  }

  const openAddModal = () => {
    setError(null)
    setIsModalOpen(true)
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    
    startTransition(async () => {
      const result = await recordPayment(null, formData)
      if (result?.error) {
        setError(result.error)
      } else {
        setIsModalOpen(false)
      }
    })
  }

  const formatCFA = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(amount).replace('XOF', 'FCFA')
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-[var(--color-surface)]">
      <div className="max-w-[1280px] mx-auto space-y-6">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[var(--color-surface-container-lowest)] p-6 rounded-xl border border-[var(--color-outline-variant)]">
          <div>
            <div className="flex items-center gap-2 text-[var(--color-on-surface-variant)] mb-2">
              <Link href={basePath} className="hover:text-[var(--color-primary)] transition-colors text-sm font-semibold">
                Finance
              </Link>
              <span className="material-symbols-outlined text-sm">chevron_right</span>
              <span className="text-sm font-semibold text-[var(--color-on-surface)]">Paiements</span>
            </div>
            <h2 className="text-3xl font-bold text-[var(--color-on-surface)]">Historique des Paiements</h2>
            <p className="text-base text-[var(--color-on-surface-variant)] mt-1">Consultez et enregistrez les paiements reçus.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <button onClick={handleTriggerSMS} disabled={isSmsPending} className="flex items-center justify-center gap-2 bg-[var(--color-surface-container-high)] text-[var(--color-on-surface)] h-12 px-6 rounded-full text-sm font-semibold hover:bg-[var(--color-surface-container-highest)] transition-colors shadow-sm w-full sm:w-auto shrink-0 border border-[var(--color-outline-variant)] disabled:opacity-50">
              <span className="material-symbols-outlined text-[20px]">sms</span>
              {isSmsPending ? 'Envoi...' : 'Relances SMS'}
            </button>
            <button onClick={openAddModal} className="flex items-center justify-center gap-2 bg-[var(--color-primary)] text-white h-12 px-6 rounded-full text-sm font-semibold hover:opacity-90 transition-colors shadow-sm w-full sm:w-auto shrink-0">
              <span className="material-symbols-outlined text-[20px]">payments</span>
              Enregistrer un paiement
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-[var(--color-status-retard-bg)] text-[var(--color-status-retard-text)] p-3 rounded text-sm font-medium">
            {error}
          </div>
        )}

        {/* Data Table Container */}
        <div className="bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-outline-variant)] overflow-hidden shadow-sm flex flex-col min-h-[500px]">
          <div className="p-4 border-b border-[var(--color-outline-variant)] flex flex-col sm:flex-row gap-4 bg-[var(--color-surface-bright)] justify-between items-center">
            <div className="relative flex-grow max-w-md">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-on-surface-variant)]">search</span>
              <input className="w-full pl-10 pr-4 py-2.5 bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-lg text-sm focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] outline-none transition-all" placeholder="Rechercher (élève, référence)..." type="text"/>
            </div>
            <span className="text-sm font-medium text-[var(--color-on-surface-variant)]">{payments.length} paiements</span>
          </div>

          {payments.length === 0 ? (
             <div className="p-12 flex flex-col items-center justify-center text-center text-[var(--color-on-surface-variant)] flex-1">
               <span className="material-symbols-outlined text-4xl mb-2 opacity-50">account_balance_wallet</span>
               <p className="text-lg font-medium">Aucun paiement trouvé</p>
               <p className="text-sm">Enregistrez votre premier paiement.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[var(--color-surface-container-low)] border-b border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] text-sm">
                    <th className="py-4 px-6 font-semibold">Date</th>
                    <th className="py-4 px-6 font-semibold">Élève</th>
                    <th className="py-4 px-6 font-semibold">Classe</th>
                    <th className="py-4 px-6 font-semibold">Frais</th>
                    <th className="py-4 px-6 font-semibold text-right">Montant</th>
                    <th className="py-4 px-6 font-semibold">Moyen</th>
                    <th className="py-4 px-6 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-outline-variant)] text-base">
                  {payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-[var(--color-surface-container-lowest)]/50 transition-colors bg-[var(--color-surface-container-lowest)]">
                      <td className="py-3 px-6 text-[var(--color-on-surface-variant)]">
                        {new Date(payment.paid_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-6 font-medium text-[var(--color-on-surface)]">
                        {payment.student?.last_name} {payment.student?.first_name}
                      </td>
                      <td className="py-3 px-6 text-[var(--color-on-surface-variant)]">
                        {payment.student?.classes?.name || '-'}
                      </td>
                      <td className="py-3 px-6 text-[var(--color-on-surface-variant)]">{payment.schedule?.label || '-'}</td>
                      <td className="py-3 px-6 text-right font-medium text-[var(--color-on-surface)]">{formatCFA(payment.amount)}</td>
                      <td className="py-3 px-6">
                        <span className="px-2.5 py-1 rounded border border-[var(--color-outline-variant)] text-xs font-semibold bg-[var(--color-surface-container-low)] text-[var(--color-on-surface)] capitalize">
                          {payment.payment_method}
                        </span>
                      </td>
                      <td className="py-3 px-6 text-right flex justify-end gap-2">
                        <button className="text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] transition-colors p-1 flex items-center gap-1 text-sm font-semibold bg-[var(--color-surface-container-high)] hover:bg-[#eff4ff] rounded px-3 py-1.5" title="Reçu">
                          <span className="material-symbols-outlined text-[18px]">receipt</span>
                          Reçu
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Enregistrer un paiement */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b1c30]/40 backdrop-blur-sm transition-opacity">
          <div className="bg-[var(--color-surface-container-lowest)] w-full max-w-lg rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-[var(--color-outline-variant)] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--color-outline-variant)] flex justify-between items-center bg-[var(--color-surface-bright)]">
              <h2 className="text-xl font-semibold text-[var(--color-on-surface)] flex items-center gap-2">
                <span className="material-symbols-outlined text-[var(--color-primary)]">payments</span>
                Enregistrer un paiement
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)] p-1 rounded-full hover:bg-[#dce9ff] transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex flex-col">
              <div className="p-6 overflow-y-auto max-h-[70vh] custom-scrollbar space-y-6">
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-[var(--color-on-surface)]" htmlFor="scheduleId">
                    Échéance / Facture concernée <span className="text-[var(--color-status-retard-text)]">*</span>
                  </label>
                  <select className="w-full h-12 px-4 border border-[var(--color-outline-variant)] rounded-lg text-base focus:border-[var(--color-primary)] outline-none appearance-none bg-[var(--color-surface)]" id="scheduleId" name="scheduleId" required>
                    <option value="">Sélectionner une échéance en attente</option>
                    {pendingSchedules.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.student?.last_name} {s.student?.first_name} - {s.label} ({formatCFA(s.amount_due)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-[var(--color-on-surface)]" htmlFor="amount">
                    Montant encaissé (FCFA) <span className="text-[var(--color-status-retard-text)]">*</span>
                  </label>
                  <input className="w-full h-12 px-4 border border-[var(--color-outline-variant)] rounded-lg text-base focus:border-[var(--color-primary)] outline-none bg-[var(--color-surface)]" id="amount" name="amount" type="number" min="1" placeholder="Ex: 50000" required />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-[var(--color-on-surface)]" htmlFor="paymentMethod">
                    Moyen de paiement <span className="text-[var(--color-status-retard-text)]">*</span>
                  </label>
                  <select className="w-full h-12 px-4 border border-[var(--color-outline-variant)] rounded-lg text-base focus:border-[var(--color-primary)] outline-none appearance-none bg-[var(--color-surface)]" id="paymentMethod" name="paymentMethod" required>
                    <option value="especes">Espèces</option>
                    <option value="tmoney">T-Money</option>
                    <option value="flooz">Flooz</option>
                    <option value="wave">Wave</option>
                    <option value="banque">Virement bancaire</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-[var(--color-on-surface)]" htmlFor="transactionRef">
                    Référence de transaction (Optionnel)
                  </label>
                  <input className="w-full h-12 px-4 border border-[var(--color-outline-variant)] rounded-lg text-base focus:border-[var(--color-primary)] outline-none bg-[var(--color-surface)]" id="transactionRef" name="transactionRef" type="text" placeholder="Ex: TXN-12345678" />
                </div>

              </div>
              
              <div className="px-6 py-4 border-t border-[var(--color-outline-variant)] bg-[var(--color-surface-bright)] flex justify-end gap-3 mt-auto">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-lg border border-[var(--color-outline)] text-[var(--color-on-surface)] font-semibold text-sm hover:bg-[#eff4ff] transition-colors" disabled={isPending}>Annuler</button>
                <button type="submit" className="px-5 py-2.5 rounded-lg bg-[var(--color-primary)] text-white font-semibold text-sm hover:opacity-90 transition-colors shadow-sm disabled:opacity-50" disabled={isPending}>
                  {isPending ? 'Enregistrement...' : 'Encaisser le paiement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
