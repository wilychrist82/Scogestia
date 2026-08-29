'use client'

import { useState, useTransition, FormEvent } from 'react'
import { EmptyState } from '@/components/ui/EmptyState'
import { Banknote, X, Tag, Calendar, Hash } from 'lucide-react'

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
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 })
    .format(amount)
    .replace('XOF', 'FCFA')

export function FraisManager({ feeTypes, onAdd, onDelete }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [localFees, setLocalFees] = useState<FeeType[]>(feeTypes)

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const form = e.currentTarget
    const formData = new FormData(form)
    const label = formData.get('label') as string
    const amount = parseFloat(formData.get('amount') as string)
    const periodicity = formData.get('periodicity') as string
    const target = formData.get('target') as string

    if (!label || !amount || !periodicity || !target) {
      setError('Veuillez remplir tous les champs obligatoires.')
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
      // Ajouter localement pour un retour immédiat
      setLocalFees(prev => [
        ...prev,
        { id: Date.now().toString(), label, amount, periodicity, target, created_at: new Date().toISOString() }
      ])
      setSuccess(true)
      form.reset()
      setTimeout(() => {
        setIsModalOpen(false)
        setSuccess(false)
      }, 800)
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Frais scolaires</h1>
          <p className="text-gray-500">Gérez les structures tarifaires et les catégories de frais.</p>
        </div>
        <button
          onClick={() => { setIsModalOpen(true); setError(null); setSuccess(false) }}
          className="flex items-center gap-2 bg-[var(--color-primary)] text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:opacity-90 transition-all shadow-sm w-full sm:w-auto justify-center"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          Ajouter un type de frais
        </button>
      </div>

      {/* Content */}
      {localFees.length === 0 ? (
        <EmptyState
          title="Aucun frais configuré"
          description="Vous n'avez pas encore défini de structure de frais (ex: Scolarité, Cantine, Transport)."
          icon={Banknote}
          actionLabel="+ Ajouter un type de frais"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {localFees.map((fee) => (
            <div key={fee.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center">
                  <Banknote size={20} className="text-[var(--color-primary)]" />
                </div>
                {onDelete && (
                  <button
                    onClick={() => {
                      startTransition(async () => {
                        if (onDelete) await onDelete(fee.id)
                        setLocalFees(prev => prev.filter(f => f.id !== fee.id))
                      })
                    }}
                    className="text-gray-400 hover:text-red-500 transition-colors p-1"
                    title="Supprimer"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">{fee.label}</h3>
                <p className="text-[var(--color-primary)] font-bold text-xl mt-1">{formatCFA(fee.amount)}</p>
              </div>
              <div className="flex flex-wrap gap-2 mt-auto pt-3 border-t border-gray-100">
                <span className="flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                  <Calendar size={12} />
                  {PERIODICITIES.find(p => p.value === fee.periodicity)?.label || fee.periodicity}
                </span>
                <span className="flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                  <Hash size={12} />
                  {TARGETS.find(t => t.value === fee.target)?.label || fee.target}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Ajouter un type de frais */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white w-full max-w-md rounded-xl shadow-xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-bold text-gray-900">Nouveau type de frais</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 transition-colors p-1 rounded-full hover:bg-gray-200"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-medium">
                  {error}
                </div>
              )}
              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  Type de frais ajouté avec succès !
                </div>
              )}

              {/* Libellé */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-700" htmlFor="label">
                  Libellé <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Tag size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    id="label"
                    name="label"
                    type="text"
                    placeholder="ex: Scolarité 2024-2025"
                    required
                    className="w-full pl-9 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all"
                  />
                </div>
              </div>

              {/* Montant */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-700" htmlFor="amount">
                  Montant (FCFA) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Banknote size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    id="amount"
                    name="amount"
                    type="number"
                    min="0"
                    step="500"
                    placeholder="ex: 75000"
                    required
                    className="w-full pl-9 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all"
                  />
                </div>
              </div>

              {/* Périodicité */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-700" htmlFor="periodicity">
                  Périodicité <span className="text-red-500">*</span>
                </label>
                <select
                  id="periodicity"
                  name="periodicity"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm appearance-none focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all bg-white"
                >
                  <option value="">Sélectionner...</option>
                  {PERIODICITIES.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>

              {/* Cible */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-700" htmlFor="target">
                  Applicable à <span className="text-red-500">*</span>
                </label>
                <select
                  id="target"
                  name="target"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm appearance-none focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all bg-white"
                >
                  <option value="">Sélectionner...</option>
                  {TARGETS.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isPending}
                  className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isPending || success}
                  className="px-5 py-2.5 rounded-lg bg-[var(--color-primary)] text-white font-semibold text-sm hover:opacity-90 transition-colors shadow-sm disabled:opacity-60 flex items-center gap-2"
                >
                  {isPending ? (
                    <>
                      <span className="material-symbols-outlined text-[16px] animate-spin">refresh</span>
                      Enregistrement...
                    </>
                  ) : 'Créer le type de frais'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
