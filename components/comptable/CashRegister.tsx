'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { processCashPayment } from '@/app/actions/cash_register'
import { ReceiptPrint } from './ReceiptPrint'
import {
  Search,
  ChevronRight,
  Loader2,
  Banknote,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  Users,
  CalendarClock,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react'

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
  cashierName: string
}

const AVATAR_TONES = [
  'bg-emerald-100 text-emerald-800 ring-emerald-200',
  'bg-sky-100 text-sky-800 ring-sky-200',
  'bg-violet-100 text-violet-800 ring-violet-200',
  'bg-amber-100 text-amber-800 ring-amber-200',
  'bg-rose-100 text-rose-800 ring-rose-200',
  'bg-teal-100 text-teal-800 ring-teal-200',
]

const avatarTone = (seed: string) => {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return AVATAR_TONES[h % AVATAR_TONES.length]
}

const initialsOf = (s: { first_name: string; last_name: string }) =>
  `${s.first_name?.[0] ?? ''}${s.last_name?.[0] ?? ''}`.toUpperCase() || '?'

const fcfa = (n: number) => n.toLocaleString('fr-FR')

const PAYMENT_METHODS: { value: 'especes' | 'cheque'; label: string; icon: typeof Banknote }[] = [
  { value: 'especes', label: 'Espèces', icon: Banknote },
  { value: 'cheque', label: 'Chèque', icon: FileText },
]

function DueStatusBadge({ due }: { due: DueData }) {
  const remaining = due.amount - due.paid_amount
  const isPaid = remaining <= 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dueDate = due.due_date ? new Date(due.due_date) : null
  const isLate = !isPaid && dueDate !== null && !isNaN(dueDate.getTime()) && dueDate < today

  if (isPaid) {
    return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-emerald-800 ring-1 ring-inset ring-emerald-300">Soldé</span>
  }
  if (isLate) {
    return <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-rose-800 ring-1 ring-inset ring-rose-300"><span className="h-1.5 w-1.5 rounded-full bg-rose-600" />En retard</span>
  }
  if (due.paid_amount > 0) {
    return <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-sky-800 ring-1 ring-inset ring-sky-300"><span className="h-1.5 w-1.5 rounded-full bg-sky-600" />Partiel</span>
  }
  return <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-amber-900 ring-1 ring-inset ring-amber-300"><span className="h-1.5 w-1.5 rounded-full bg-amber-600" />En attente</span>
}

export function CashRegister({ students, schoolData, cashierName }: Props) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)

  const [selectedDue, setSelectedDue] = useState<DueData | null>(null)
  const [amountToPay, setAmountToPay] = useState<string>('')
  const [paymentMethod, setPaymentMethod] = useState<'especes' | 'cheque'>('especes')

  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [receiptData, setReceiptData] = useState<any | null>(null)

  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const typing = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable)
      if (e.key === '/' && !typing && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

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
          schoolStamp: schoolData.stamp_url,
          cashierName: cashierName
        })

        // Update local state (optimistic or wait for refresh)
        // Here we just let the page refresh via revalidatePath, but we clear the modal
        setSelectedDue(null)
      }
    })
  }

  const modalRemaining = selectedDue ? selectedDue.amount - selectedDue.paid_amount : 0
  const typedAmount = Number(amountToPay)
  const afterPayment = Number.isFinite(typedAmount) && typedAmount > 0 ? Math.max(modalRemaining - typedAmount, 0) : modalRemaining

  return (
    <div className="space-y-6">
      {/* Recherche et sélection de l'élève */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.06),0_8px_24px_-12px_rgba(15,23,42,0.12)]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-800">Étape 1</p>
            <h2 className="text-lg font-bold tracking-tight text-slate-900">Rechercher un élève</h2>
          </div>
          <span className="hidden items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 sm:inline-flex">
            <Users className="h-3.5 w-3.5" /> {students.length} élève{students.length > 1 ? 's' : ''}
          </span>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-600" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Nom ou prénom de l'élève..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-14 w-full rounded-xl border border-slate-300 bg-white pl-12 pr-16 text-base font-medium text-slate-900 placeholder:text-slate-500 outline-none transition-all focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/15"
          />
          <kbd className="pointer-events-none absolute right-4 top-1/2 hidden h-7 min-w-7 -translate-y-1/2 items-center justify-center rounded-md border border-slate-300 bg-slate-50 px-2 text-xs font-bold text-slate-700 shadow-[0_1px_0_rgba(15,23,42,0.15)] sm:inline-flex">/</kbd>
        </div>
        <p className="mt-2 text-xs font-medium text-slate-600">Tapez au moins 2 lettres. Appuyez sur « / » pour placer le curseur ici.</p>

        {searchTerm.length > 1 && !selectedStudentId && (
          <div className="mt-3 max-h-72 space-y-2 overflow-y-auto rounded-xl bg-slate-50 p-2">
            {filteredStudents.length > 0 ? filteredStudents.map(student => (
              <button
                key={student.id}
                onClick={() => setSelectedStudentId(student.id)}
                className="group flex w-full items-center gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left transition-all hover:border-emerald-500 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-600/20"
              >
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-extrabold ring-1 ring-inset ${avatarTone(student.id)}`}>
                  {initialsOf(student)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-bold text-slate-900">{student.first_name} {student.last_name}</div>
                  <span className="mt-1 inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-800 ring-1 ring-inset ring-slate-300">{student.class_name}</span>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-500 transition-transform group-hover:translate-x-0.5 group-hover:text-emerald-700" />
              </button>
            )) : (
              <div className="p-6 text-center text-sm font-medium text-slate-700">Aucun élève trouvé.</div>
            )}
          </div>
        )}
      </div>

      {/* Détails de l'élève et échéances */}
      {selectedStudent && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.06),0_8px_24px_-12px_rgba(15,23,42,0.12)]">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-800">Étape 2</p>

          <div className="mb-6 flex flex-col gap-4 rounded-xl border-2 border-emerald-600 bg-emerald-50/60 p-4 ring-4 ring-emerald-600/10 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-extrabold ring-1 ring-inset ${avatarTone(selectedStudent.id)}`}>
                {initialsOf(selectedStudent)}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-extrabold tracking-tight text-slate-900">{selectedStudent.first_name} {selectedStudent.last_name}</h2>
                  <CheckCircle2 className="h-5 w-5 text-emerald-700" />
                </div>
                <span className="mt-1 inline-flex items-center rounded-md bg-white px-2 py-0.5 text-xs font-bold text-slate-800 ring-1 ring-inset ring-slate-300">Classe : {selectedStudent.class_name}</span>
              </div>
            </div>
            <button
              onClick={() => { setSelectedStudentId(null); setSearchTerm(''); }}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-900 shadow-sm transition-colors hover:border-emerald-600 hover:text-emerald-800"
            >
              <Search className="h-4 w-4" />
              Changer d'élève
            </button>
          </div>

          <h3 className="mb-4 text-sm font-extrabold uppercase tracking-[0.12em] text-slate-800">Situation Financière</h3>

          <div className="space-y-3">
            {selectedStudent.dues.length > 0 ? selectedStudent.dues.map(due => {
              const remaining = due.amount - due.paid_amount
              const isPaid = remaining <= 0
              const progress = due.amount > 0 ? Math.min(100, Math.round((due.paid_amount / due.amount) * 100)) : 0

              return (
                <div key={due.id} className={`rounded-xl border p-5 transition-shadow hover:shadow-md ${isPaid ? 'border-emerald-300 bg-emerald-50/60' : 'border-slate-200 bg-white'}`}>
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <h4 className="text-base font-extrabold text-slate-900">{due.label}</h4>
                        <DueStatusBadge due={due} />
                      </div>
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-slate-800">
                        <span>Total : <strong className="font-bold tabular-nums text-slate-900">{fcfa(due.amount)} F</strong></span>
                        <span>Déjà payé : <strong className="font-bold tabular-nums text-emerald-800">{fcfa(due.paid_amount)} F</strong></span>
                        {due.due_date && (
                          <span className="inline-flex items-center gap-1.5 text-slate-700">
                            <CalendarClock className="h-4 w-4" />
                            {new Date(due.due_date).toLocaleDateString('fr-FR')}
                          </span>
                        )}
                      </div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
                        <div className="h-full rounded-full bg-emerald-600 transition-all duration-500" style={{ width: `${progress}%` }} />
                      </div>
                    </div>

                    <div className="flex w-full items-center justify-between gap-5 md:w-auto md:justify-end">
                      <div className="text-left md:text-right">
                        <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-700">Reste à payer</div>
                        <div className={`text-2xl font-black tabular-nums tracking-tight ${isPaid ? 'text-emerald-700' : 'text-slate-900'}`}>
                          {fcfa(remaining)} <span className="text-sm font-bold text-slate-700">FCFA</span>
                        </div>
                      </div>
                      {!isPaid && (
                        <button
                          onClick={() => handlePayClick(due)}
                          className="inline-flex h-12 items-center gap-2 whitespace-nowrap rounded-xl bg-emerald-700 px-5 text-sm font-bold text-white shadow-[0_6px_16px_-6px_rgba(4,120,87,0.7)] transition-all hover:bg-emerald-800 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-600/30"
                        >
                          Encaisser
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            }) : (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 py-10 text-center font-medium text-slate-700">
                Aucune échéance trouvée pour cet élève.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modale de Paiement */}
      {selectedDue && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-[0_30px_80px_-20px_rgba(15,23,42,0.5)] ring-1 ring-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-800">Étape 3</p>
                <h3 className="text-lg font-extrabold tracking-tight text-slate-900">Encaisser un paiement</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDue(null)}
                disabled={isPending}
                aria-label="Fermer"
                className="rounded-lg p-1.5 text-slate-700 transition-colors hover:bg-slate-200 hover:text-slate-900 disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handlePaymentSubmit} className="p-6">
              <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <div className="text-sm font-semibold text-slate-800">{selectedDue.label}</div>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-700">Reste à payer</span>
                  <span className="text-2xl font-black tabular-nums tracking-tight text-slate-900">{fcfa(modalRemaining)} <span className="text-sm font-bold text-slate-700">FCFA</span></span>
                </div>
              </div>

              {error && (
                <div role="alert" className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-300 bg-rose-50 p-3 text-sm font-semibold text-rose-900">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <div className="mb-6 space-y-5">
                <div>
                  <label htmlFor="amount-to-pay" className="mb-1.5 block text-sm font-bold text-slate-900">Montant versé</label>
                  <div className="relative">
                    <input
                      id="amount-to-pay"
                      type="number"
                      inputMode="numeric"
                      value={amountToPay}
                      onChange={(e) => setAmountToPay(e.target.value)}
                      required
                      min="1"
                      max={selectedDue.amount - selectedDue.paid_amount}
                      className="h-14 w-full rounded-xl border border-slate-300 bg-white pl-4 pr-20 text-2xl font-extrabold tabular-nums text-slate-900 outline-none transition-all focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/15"
                    />
                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 rounded-md bg-slate-100 px-2 py-1 text-xs font-extrabold tracking-wide text-slate-800">FCFA</span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setAmountToPay(modalRemaining.toString())}
                      className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-emerald-800"
                    >
                      Payer la totalité
                    </button>
                    <button
                      type="button"
                      onClick={() => setAmountToPay(Math.floor(modalRemaining / 2).toString())}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-900 transition-colors hover:border-emerald-600 hover:text-emerald-800"
                    >
                      50 %
                    </button>
                    <span className="ml-auto text-xs font-semibold text-slate-700">
                      Reste après : <span className="font-bold tabular-nums text-slate-900">{fcfa(afterPayment)} F</span>
                    </span>
                  </div>
                </div>

                <div>
                  <span id="payment-method-label" className="mb-1.5 block text-sm font-bold text-slate-900">Mode de paiement</span>
                  <div role="radiogroup" aria-labelledby="payment-method-label" className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 ring-1 ring-inset ring-slate-200">
                    {PAYMENT_METHODS.map(({ value, label, icon: Icon }) => {
                      const active = paymentMethod === value
                      return (
                        <button
                          key={value}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          onClick={() => setPaymentMethod(value)}
                          className={`inline-flex h-11 items-center justify-center gap-2 rounded-lg text-sm font-bold transition-all ${
                            active
                              ? 'bg-white text-emerald-800 shadow-[0_1px_3px_rgba(15,23,42,0.2)] ring-1 ring-emerald-600'
                              : 'text-slate-800 hover:bg-white/70'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          {label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedDue(null)}
                  disabled={isPending}
                  className="h-12 rounded-xl border border-slate-300 bg-white px-5 text-sm font-bold text-slate-900 transition-colors hover:bg-slate-100 disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-700 text-base font-extrabold text-white shadow-[0_8px_20px_-8px_rgba(4,120,87,0.8)] transition-all hover:bg-emerald-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-80 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-600/30"
                >
                  {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
                  {isPending ? 'Encaissement…' : 'Valider le paiement'}
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
