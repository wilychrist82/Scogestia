'use client'

import { useEffect, useState, useTransition, FormEvent } from 'react'
import Link from 'next/link'
import { EmptyState } from '@/components/ui/EmptyState'
import { Banknote, X, Tag, Calendar, Users2, Plus, Trash2, ChevronRight, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'

type FeeType = {
  id: string
  label: string
  amount: number
  periodicity: string
  target: string
  created_at: string
}

type Props = {
  feeTypes: FeeType[]
  onAdd?: (data: { label: string; amount: number; periodicity: string; target: string }) => Promise<{ error?: string }>
  onDelete?: (id: string) => Promise<{ error?: string }>
  basePath?: string
}

const PERIODICITIES = [
  { value: 'annuel', label: 'Annuel' },
  { value: 'trimestriel', label: 'Trimestriel (3×)' },
  { value: 'mensuel', label: 'Mensuel (10×)' },
  { value: 'unique', label: 'Paiement unique' },
]

const TARGETS = [
  { value: 'tous', label: 'Tous les élèves' },
  { value: 'primaire', label: 'Primaire seulement' },
  { value: 'secondaire', label: 'Secondaire seulement' },
]

const formatCFA = (amount: number) =>
  `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(amount)} FCFA`

const inputCls =
  'w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 outline-none transition-all'

export function FraisManager({ feeTypes, onAdd, onDelete, basePath = '/admin/finance' }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [localFees, setLocalFees] = useState<FeeType[]>(feeTypes)

  useEffect(() => {
    setLocalFees(feeTypes)
  }, [feeTypes])

  useEffect(() => {
    if (!isModalOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !isPending) setIsModalOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isModalOpen, isPending])

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const form = e.currentTarget
    const formData = new FormData(form)
    const label = (formData.get('label') as string)?.trim()
    const amount = parseFloat(formData.get('amount') as string)
    const periodicity = formData.get('periodicity') as string
    const target = formData.get('target') as string

    if (!label || !amount || amount <= 0 || !periodicity || !target) {
      setError('Veuillez remplir tous les champs avec des valeurs valides.')
      return
    }

    startTransition(async () => {
      if (onAdd) {
        const result = await onAdd({ label, amount, periodicity, target })
        if (result?.error) {
          setError(result.error)
          return
        }
      }
      setLocalFees(prev => [
        { id: Date.now().toString(), label, amount, periodicity, target, created_at: new Date().toISOString() },
        ...prev
      ])
      setSuccess(true)
      form.reset()
      setTimeout(() => {
        setIsModalOpen(false)
        setSuccess(false)
      }, 600)
    })
  }

  const handleDelete = (id: string) => {
    if (!window.confirm('Supprimer cette configuration de frais ?')) return
    setActionError(null)

    startTransition(async () => {
      if (onDelete) {
        const result = await onDelete(id)
        if (result?.error) {
          setActionError(result.error)
          return
        }
      }
      setLocalFees(prev => prev.filter(f => f.id !== id))
    })
  }

  return (
    <div className="max-w-[1280px] mx-auto space-y-6 pb-8">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <nav className="flex items-center gap-1 text-xs text-slate-500 mb-1.5" aria-label="Fil d'Ariane">
            <Link href={basePath} className="hover:text-slate-800 transition-colors">Finance</Link>
            <ChevronRight size={12} />
            <span className="text-slate-800 font-medium">Frais scolaires</span>
          </nav>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Grille des frais scolaires</h1>
          <p className="text-sm text-slate-500 mt-1">Définissez les tarifs de scolarité, inscriptions, cantine ou transport.</p>
        </div>
        <button
          type="button"
          onClick={() => { setIsModalOpen(true); setError(null); setSuccess(false) }}
          className="inline-flex items-center gap-2 h-9 px-3.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium shadow-sm transition-colors self-start sm:self-auto"
        >
          <Plus size={15} /> Ajouter un type de frais
        </button>
      </div>

      {actionError && (
        <div role="alert" className="flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-800 px-4 py-3 text-sm">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <p className="flex-1">{actionError}</p>
          <button type="button" onClick={() => setActionError(null)} aria-label="Fermer" className="opacity-60 hover:opacity-100"><X size={14} /></button>
        </div>
      )}

      {/* Grille des frais */}
      {localFees.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <EmptyState
            title="Aucun frais configuré"
            description="Vous n'avez pas encore défini de structure tarifaire (scolarité, cantine, transport, etc.)."
            icon={Banknote}
            actionLabel="+ Ajouter un premier type de frais"
            onAction={() => setIsModalOpen(true)}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {localFees.map((fee) => (
            <div key={fee.id} className="bg-white rounded-xl border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:border-slate-300 transition-colors p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center shrink-0">
                    <Banknote size={18} />
                  </div>
                  {onDelete && (
                    <button
                      type="button"
                      onClick={() => handleDelete(fee.id)}
                      className="text-slate-400 hover:text-rose-600 transition-colors p-1 rounded-md hover:bg-rose-50"
                      title="Supprimer ce type de frais"
                      aria-label="Supprimer"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>

                <div className="mt-4">
                  <h3 className="font-semibold text-slate-900 text-base leading-snug">{fee.label}</h3>
                  <p className="text-xl font-bold text-slate-900 tabular-nums mt-1">{formatCFA(fee.amount)}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-5 pt-3.5 border-t border-slate-100">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-md">
                  <Calendar size={12} className="text-slate-400" />
                  {PERIODICITIES.find(p => p.value === fee.periodicity)?.label || fee.periodicity}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-md">
                  <Users2 size={12} className="text-slate-400" />
                  {TARGETS.find(t => t.value === fee.target)?.label || fee.target}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Ajouter un type de frais */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-[2px]"
          onMouseDown={(e) => { if (e.target === e.currentTarget && !isPending) setIsModalOpen(false) }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="fee-modal-title"
            className="bg-white w-full max-w-md rounded-xl shadow-[0_20px_50px_rgba(15,23,42,0.25)] border border-slate-200 flex flex-col overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
              <h2 id="fee-modal-title" className="text-base font-semibold text-slate-900">Nouveau type de frais</h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
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
                {success && (
                  <div role="status" className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 px-3 py-2.5 text-sm">
                    <CheckCircle2 size={15} className="mt-0.5 shrink-0" />
                    Type de frais enregistré avec succès !
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-700" htmlFor="label">
                    Libellé <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Tag size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="label"
                      name="label"
                      type="text"
                      placeholder="Ex : Scolarité annuelle"
                      required
                      className={`${inputCls} pl-9`}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-700" htmlFor="amount">
                    Montant (FCFA) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Banknote size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="amount"
                      name="amount"
                      type="number"
                      min="500"
                      step="500"
                      placeholder="Ex : 75000"
                      required
                      className={`${inputCls} pl-9`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-700" htmlFor="periodicity">
                      Périodicité <span className="text-rose-500">*</span>
                    </label>
                    <select id="periodicity" name="periodicity" required className={inputCls}>
                      <option value="">Sélectionner</option>
                      {PERIODICITIES.map(p => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-700" htmlFor="target">
                      Applicable à <span className="text-rose-500">*</span>
                    </label>
                    <select id="target" name="target" required className={inputCls}>
                      <option value="">Sélectionner</option>
                      {TARGETS.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50/60 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isPending}
                  className="h-9 px-4 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isPending || success}
                  className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium shadow-sm transition-colors disabled:opacity-60"
                >
                  {isPending && <Loader2 size={14} className="animate-spin" />}
                  {isPending ? 'Enregistrement…' : 'Créer le type de frais'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
