'use client'

import { useEffect, useMemo, useState, useTransition, FormEvent } from 'react'
import Link from 'next/link'
import { Download, Plus, Search, FileText, X, ChevronRight, Loader2, AlertCircle, Wallet, BellRing } from 'lucide-react'
import { recordPayment } from '@/app/actions/finance'
import { generatePaymentReceipt } from '@/lib/pdf/receipt'

type PaymentItem = {
  id: string
  amount: number
  payment_method: string
  transaction_reference: string | null
  paid_at: string
  schedule: {
    label: string
    amount_due?: number
    payments?: { amount: number }[] | null
  } | null
  student: {
    last_name: string
    first_name: string
    classes: { name: string } | null
  } | null
}

type ScheduleItem = {
  id: string
  label: string
  amount_due: number
  status: string
  student: { last_name: string, first_name: string, matricule: string } | null
  payments?: { amount: number }[] | null
}

type Props = {
  payments: PaymentItem[]
  pendingSchedules: ScheduleItem[]
  schoolName?: string
  schoolCity?: string
  loadError?: boolean
}

const METHOD_LABELS: Record<string, string> = {
  especes: 'Espèces',
  tmoney: 'T-Money',
  flooz: 'Flooz',
  wave: 'Wave',
  banque: 'Virement',
  autre: 'Autre',
}

const methodLabel = (m: string) => METHOD_LABELS[m] ?? m

const formatCFA = (amount: number) =>
  `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(amount)} FCFA`

const inputCls =
  'w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 outline-none transition-all'

const sumPayments = (list?: { amount: number }[] | null) =>
  (list || []).reduce((acc, p) => acc + Number(p.amount || 0), 0)

export function PaiementsManager({
  payments,
  pendingSchedules,
  schoolName = 'Établissement',
  schoolCity = '',
  loadError = false,
  basePath = '/admin/finance',
}: Props & { basePath?: string }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedScheduleId, setSelectedScheduleId] = useState('')

  const selectedSchedule = pendingSchedules.find(s => s.id === selectedScheduleId)
  const selectedRemaining = selectedSchedule
    ? Math.max(0, Number(selectedSchedule.amount_due) - sumPayments(selectedSchedule.payments))
    : undefined

  // Fermeture à la touche Échap
  useEffect(() => {
    if (!isModalOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !isPending) closeModal() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isModalOpen, isPending])

  const filteredPayments = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return payments
    return payments.filter(p => {
      const fullName = `${p.student?.first_name || ''} ${p.student?.last_name || ''}`.toLowerCase()
      const ref = (p.transaction_reference || '').toLowerCase()
      return fullName.includes(term) || ref.includes(term)
    })
  }, [payments, searchTerm])

  const totalFiltered = filteredPayments.reduce((acc, p) => acc + Number(p.amount || 0), 0)

  const openModal = () => {
    setError(null)
    setSelectedScheduleId('')
    setIsModalOpen(true)
  }
  const closeModal = () => setIsModalOpen(false)

  const handleExportCSV = () => {
    if (filteredPayments.length === 0) return
    const headers = ['Date', 'Élève', 'Classe', 'Motif', 'Montant (FCFA)', 'Moyen', 'Référence']
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
    const rows = filteredPayments.map(p => [
      new Date(p.paid_at).toLocaleDateString('fr-FR'),
      `${p.student?.last_name || ''} ${p.student?.first_name || ''}`.trim(),
      p.student?.classes?.name || '',
      p.schedule?.label || '',
      p.amount,
      methodLabel(p.payment_method),
      p.transaction_reference || '',
    ])
    const csv = [headers, ...rows].map(r => r.map(esc).join(';')).join('\r\n')
    // BOM UTF-8 + séparateur « ; » : accents et colonnes corrects à l'ouverture dans Excel (FR)
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `paiements_scogestia_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(link.href)
  }

  const handleReceipt = (p: PaymentItem) => {
    const totalDue = Number(p.schedule?.amount_due ?? 0)
    generatePaymentReceipt({
      schoolName,
      schoolCity,
      studentName: `${p.student?.first_name || ''} ${p.student?.last_name || ''}`.trim(),
      studentClass: p.student?.classes?.name || 'Non assigné',
      paymentMethod: methodLabel(p.payment_method),
      amount: Number(p.amount),
      date: new Date(p.paid_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }),
      reference: p.transaction_reference || `REC-${p.id.substring(0, 8).toUpperCase()}`,
      totalDue: p.schedule?.amount_due !== undefined ? totalDue : undefined,
      totalPaid: p.schedule?.amount_due !== undefined ? sumPayments(p.schedule?.payments) : undefined,
    })
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
        closeModal()
      }
    })
  }

  return (
    <div className="max-w-[1280px] mx-auto space-y-6 pb-8">

      {/* En-tête de page */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <nav className="flex items-center gap-1 text-xs text-slate-500 mb-1.5" aria-label="Fil d'Ariane">
            <Link href={basePath} className="hover:text-slate-800 transition-colors">Finance</Link>
            <ChevronRight size={12} />
            <span className="text-slate-800 font-medium">Paiements</span>
          </nav>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Historique des paiements</h1>
          <p className="text-sm text-slate-500 mt-1">Consultez, exportez et enregistrez les paiements reçus.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`${basePath}/impayes`}
            className="inline-flex items-center gap-2 h-9 px-3.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-sm font-medium transition-colors"
          >
            <BellRing size={15} /> Relances
          </Link>
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={filteredPayments.length === 0}
            className="inline-flex items-center gap-2 h-9 px-3.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={15} /> Exporter
          </button>
          <button
            type="button"
            onClick={openModal}
            className="inline-flex items-center gap-2 h-9 px-3.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium shadow-sm transition-colors"
          >
            <Plus size={15} /> Enregistrer un paiement
          </button>
        </div>
      </div>

      {loadError && (
        <div role="alert" className="flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-800 px-4 py-3 text-sm">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          Impossible de charger l&apos;historique des paiements. Actualisez la page ou réessayez dans un instant.
        </div>
      )}

      {/* Tableau */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)] overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3 justify-between sm:items-center">
          <div className="relative w-full sm:max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="w-full h-9 pl-9 pr-3 bg-white border border-slate-200 rounded-lg text-sm placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 outline-none transition-all"
              placeholder="Rechercher un élève ou une référence…"
              type="search"
              aria-label="Rechercher dans les paiements"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <p className="text-xs text-slate-500">
            {filteredPayments.length} paiement{filteredPayments.length > 1 ? 's' : ''}
            {filteredPayments.length > 0 && <> · <span className="font-medium text-slate-700">{formatCFA(totalFiltered)}</span></>}
          </p>
        </div>

        {filteredPayments.length === 0 ? (
          <div className="py-16 flex flex-col items-center text-center px-4">
            <div className="w-10 h-10 rounded-lg bg-slate-50 text-slate-400 border border-slate-200 flex items-center justify-center mb-3">
              <Wallet size={20} />
            </div>
            <p className="text-sm font-medium text-slate-800">{searchTerm ? 'Aucun résultat' : 'Aucun paiement enregistré'}</p>
            <p className="text-xs text-slate-500 mt-1">
              {searchTerm ? `Aucun paiement ne correspond à « ${searchTerm} ».` : 'Enregistrez votre premier paiement pour le voir apparaître ici.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500">
                  <th className="py-3 px-5 font-medium">Date</th>
                  <th className="py-3 px-5 font-medium">Élève</th>
                  <th className="py-3 px-5 font-medium">Classe</th>
                  <th className="py-3 px-5 font-medium">Frais</th>
                  <th className="py-3 px-5 font-medium text-right">Montant</th>
                  <th className="py-3 px-5 font-medium">Moyen</th>
                  <th className="py-3 px-5 font-medium text-right">Reçu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-5 text-slate-600 whitespace-nowrap">
                      {new Date(payment.paid_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      <span className="block text-[11px] text-slate-400">
                        {new Date(payment.paid_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td className="py-3 px-5 font-medium text-slate-900">
                      {payment.student?.last_name} {payment.student?.first_name}
                    </td>
                    <td className="py-3 px-5 text-slate-600">{payment.student?.classes?.name || '—'}</td>
                    <td className="py-3 px-5 text-slate-600">{payment.schedule?.label || '—'}</td>
                    <td className="py-3 px-5 text-right font-semibold text-slate-900 tabular-nums whitespace-nowrap">{formatCFA(payment.amount)}</td>
                    <td className="py-3 px-5">
                      <span className="inline-flex px-2 py-0.5 rounded-md border border-slate-200 bg-slate-50 text-xs font-medium text-slate-700">
                        {methodLabel(payment.payment_method)}
                      </span>
                    </td>
                    <td className="py-3 px-5">
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleReceipt(payment)}
                          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-50 hover:border-slate-300 transition-colors"
                          title="Télécharger le reçu (PDF)"
                        >
                          <FileText size={13} /> Reçu
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Modale : enregistrer un paiement */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-[2px]"
          onMouseDown={(e) => { if (e.target === e.currentTarget && !isPending) closeModal() }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="payment-modal-title"
            className="bg-white w-full max-w-lg rounded-xl shadow-[0_20px_50px_rgba(15,23,42,0.25)] border border-slate-200 flex flex-col overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
              <h2 id="payment-modal-title" className="text-base font-semibold text-slate-900">Enregistrer un paiement</h2>
              <button
                type="button"
                onClick={closeModal}
                disabled={isPending}
                aria-label="Fermer"
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-md hover:bg-slate-100 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col">
              <div className="p-5 overflow-y-auto max-h-[70vh] space-y-4">

                {error && (
                  <div role="alert" className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 text-rose-800 px-3 py-2.5 text-sm">
                    <AlertCircle size={15} className="mt-0.5 shrink-0" />
                    {error}
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-700" htmlFor="scheduleId">
                    Échéance concernée <span className="text-rose-500">*</span>
                  </label>
                  <select
                    className={inputCls}
                    id="scheduleId"
                    name="scheduleId"
                    required
                    value={selectedScheduleId}
                    onChange={(e) => setSelectedScheduleId(e.target.value)}
                  >
                    <option value="">Sélectionner une échéance en attente</option>
                    {pendingSchedules.map(s => {
                      const remaining = Math.max(0, Number(s.amount_due) - sumPayments(s.payments))
                      return (
                        <option key={s.id} value={s.id}>
                          {s.student?.last_name} {s.student?.first_name} — {s.label} (reste {formatCFA(remaining)})
                        </option>
                      )
                    })}
                  </select>
                  {pendingSchedules.length === 0 && (
                    <p className="text-xs text-slate-500">Aucune échéance en attente. Générez d&apos;abord des échéances.</p>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-700" htmlFor="amount">
                    Montant encaissé (FCFA) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    className={inputCls}
                    id="amount"
                    name="amount"
                    type="number"
                    min="1"
                    max={selectedRemaining && selectedRemaining > 0 ? selectedRemaining : undefined}
                    placeholder="Ex : 50000"
                    required
                  />
                  {selectedRemaining !== undefined && (
                    <p className="text-xs text-slate-500">Reste dû sur cette échéance : <span className="font-medium text-slate-700">{formatCFA(selectedRemaining)}</span></p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-700" htmlFor="paymentMethod">
                      Moyen de paiement <span className="text-rose-500">*</span>
                    </label>
                    <select className={inputCls} id="paymentMethod" name="paymentMethod" required>
                      {Object.entries(METHOD_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-700" htmlFor="transactionRef">
                      Référence <span className="text-slate-400 font-normal">(optionnel)</span>
                    </label>
                    <input className={inputCls} id="transactionRef" name="transactionRef" type="text" placeholder="Ex : TXN-12345678" />
                  </div>
                </div>
              </div>

              <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50/60 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isPending}
                  className="h-9 px-4 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium shadow-sm transition-colors disabled:opacity-60"
                >
                  {isPending && <Loader2 size={14} className="animate-spin" />}
                  {isPending ? 'Enregistrement…' : 'Encaisser le paiement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
