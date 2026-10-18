'use client'

import { useEffect, useMemo, useState, useTransition, FormEvent } from 'react'
import Link from 'next/link'
import { Download, Plus, Search, FileText, X, ChevronRight, Loader2, AlertCircle, Wallet, BellRing, Receipt, Banknote, Smartphone, Landmark } from 'lucide-react'
import { recordPayment } from '@/app/actions/finance'
import { generatePaymentReceipt } from '@/lib/pdf/receipt'
import { FinanceNavTabs } from './FinanceNavTabs'
import { FinancePageBanner } from './FinancePageBanner'

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

const METHOD_STYLES: Record<string, { tone: string; icon: typeof Banknote }> = {
  especes: { tone: 'bg-emerald-50 text-emerald-900 ring-emerald-300', icon: Banknote },
  wave: { tone: 'bg-sky-50 text-sky-900 ring-sky-300', icon: Smartphone },
  tmoney: { tone: 'bg-amber-50 text-amber-900 ring-amber-300', icon: Smartphone },
  flooz: { tone: 'bg-indigo-50 text-indigo-900 ring-indigo-300', icon: Smartphone },
  banque: { tone: 'bg-violet-50 text-violet-900 ring-violet-300', icon: Landmark },
}
const methodStyle = (m: string) =>
  METHOD_STYLES[m] ?? { tone: 'bg-slate-100 text-slate-900 ring-slate-300', icon: Wallet }

const AVATAR_TONES = [
  'bg-emerald-100 text-emerald-900 ring-emerald-300',
  'bg-sky-100 text-sky-900 ring-sky-300',
  'bg-violet-100 text-violet-900 ring-violet-300',
  'bg-amber-100 text-amber-900 ring-amber-300',
  'bg-rose-100 text-rose-900 ring-rose-300',
  'bg-teal-100 text-teal-900 ring-teal-300',
]
const avatarTone = (seed: string) => {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return AVATAR_TONES[h % AVATAR_TONES.length]
}

const formatCFA = (amount: number) =>
  `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(amount)} FCFA`

const inputCls =
  'w-full h-11 px-3 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-600 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/15 outline-none transition-all'

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
    <div className="max-w-[1400px] mx-auto space-y-6 pb-8 px-1">
      {/* Barre de navigation d'onglets */}
      <FinanceNavTabs basePath={basePath} />

      {/* Bannière Prestige Sombre */}
      <FinancePageBanner
        title="Journal & Historique des Paiements"
        subtitle="Consultez tous les versements reçus, filtrez par élève ou classe et éditez les reçus de caisse officiels."
        badge="COMPTABILITÉ & REÇUS"
        icon={Receipt}
        stats={[
          { label: 'Total Encaissé', value: formatCFA(totalFiltered), color: 'text-emerald-400' },
          { label: 'Paiements', value: filteredPayments.length, color: 'text-white' },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`${basePath}/impayes`}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-bold transition-colors"
            >
              <BellRing size={14} /> Relances
            </Link>
            <button
              type="button"
              onClick={handleExportCSV}
              disabled={filteredPayments.length === 0}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-bold transition-colors disabled:opacity-50"
            >
              <Download size={14} /> Exporter Excel
            </button>
            <button
              type="button"
              onClick={openModal}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-colors"
            >
              <Plus size={14} /> Nouveau paiement
            </button>
          </div>
        }
      />

      {loadError && (
        <div role="alert" className="flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-800 px-4 py-3 text-sm">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          Impossible de charger l&apos;historique des paiements. Actualisez la page ou réessayez dans un instant.
        </div>
      )}

      {/* Tableau */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.06),0_10px_30px_-18px_rgba(15,23,42,0.18)]">
        <div className="flex flex-col justify-between gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:p-5">
          <div className="relative w-full sm:max-w-sm">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" />
            <input
              className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-600 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/15"
              placeholder="Rechercher un élève ou une référence…"
              type="search"
              aria-label="Rechercher dans les paiements"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <p className="text-sm font-semibold text-slate-800">
            {filteredPayments.length} paiement{filteredPayments.length > 1 ? 's' : ''}
            {filteredPayments.length > 0 && <> · <span className="font-extrabold tabular-nums text-emerald-800">{formatCFA(totalFiltered)}</span></>}
          </p>
        </div>

        {filteredPayments.length === 0 ? (
          <div className="flex flex-col items-center px-4 py-16 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-800 ring-1 ring-inset ring-slate-300">
              <Wallet size={22} />
            </div>
            <p className="text-sm font-extrabold text-slate-900">{searchTerm ? 'Aucun résultat' : 'Aucun paiement enregistré'}</p>
            <p className="mt-1 text-sm font-medium text-slate-700">
              {searchTerm ? `Aucun paiement ne correspond à « ${searchTerm} ».` : 'Enregistrez votre premier paiement pour le voir apparaître ici.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-800">
                  <th className="px-5 py-3.5">Date & heure</th>
                  <th className="px-5 py-3.5">Élève</th>
                  <th className="px-5 py-3.5">Tranche réglée</th>
                  <th className="px-5 py-3.5">Mode</th>
                  <th className="px-5 py-3.5 text-right">Montant</th>
                  <th className="px-5 py-3.5 text-right">Reçu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredPayments.map((payment) => {
                  const style = methodStyle(payment.payment_method)
                  const MethodIcon = style.icon
                  const studentName = `${payment.student?.last_name || ''} ${payment.student?.first_name || ''}`.trim()
                  const initials = `${payment.student?.last_name?.charAt(0) || ''}${payment.student?.first_name?.charAt(0) || ''}`.toUpperCase() || '?'

                  return (
                    <tr key={payment.id} className="transition-colors hover:bg-slate-50">
                      <td className="whitespace-nowrap px-5 py-4">
                        <p className="font-bold text-slate-900">
                          {new Date(payment.paid_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </p>
                        <p className="mt-0.5 text-xs font-semibold tabular-nums text-slate-700">
                          {new Date(payment.paid_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-extrabold ring-1 ring-inset ${avatarTone(payment.id)}`}>
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-extrabold text-slate-900">{studentName || '—'}</p>
                            <span className="mt-0.5 inline-flex rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-bold text-slate-800 ring-1 ring-inset ring-slate-300">
                              {payment.student?.classes?.name || 'Sans classe'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-900">{payment.schedule?.label || '—'}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${style.tone}`}>
                          <MethodIcon size={13} />
                          {methodLabel(payment.payment_method)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-right text-base font-extrabold tabular-nums tracking-tight text-slate-900">{formatCFA(payment.amount)}</td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleReceipt(payment)}
                            className="group inline-flex h-9 items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3 text-xs font-extrabold text-emerald-900 transition-all hover:border-emerald-700 hover:bg-emerald-700 hover:text-white"
                            title="Télécharger le reçu certifié (PDF)"
                          >
                            <FileText size={14} /> Reçu
                            <Download size={13} className="opacity-70 transition-transform group-hover:translate-y-0.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
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
                className="text-slate-700 hover:text-slate-900 p-1.5 rounded-md hover:bg-slate-100 transition-colors"
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
                  <label className="text-sm font-bold text-slate-900" htmlFor="scheduleId">
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
                    <p className="text-xs font-medium text-slate-700">Aucune échéance en attente. Générez d&apos;abord des échéances.</p>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-bold text-slate-900" htmlFor="amount">
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
                    <p className="text-xs font-medium text-slate-700">Reste dû sur cette échéance : <span className="font-medium text-slate-700">{formatCFA(selectedRemaining)}</span></p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-bold text-slate-900" htmlFor="paymentMethod">
                      Moyen de paiement <span className="text-rose-500">*</span>
                    </label>
                    <select className={inputCls} id="paymentMethod" name="paymentMethod" required>
                      {Object.entries(METHOD_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-bold text-slate-900" htmlFor="transactionRef">
                      Référence <span className="text-slate-600 font-normal">(optionnel)</span>
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
