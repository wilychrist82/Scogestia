'use client'

import { useState, useMemo, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { FinanceNavTabs } from '@/components/admin/finance/FinanceNavTabs'
import { FinanceExecutiveBanner } from '@/components/admin/finance/FinanceExecutiveBanner'
import { addSchoolExpense, deleteSchoolExpense } from '@/app/actions/finance'
import {
  TrendingDown,
  TrendingUp,
  Wallet,
  Plus,
  Search,
  Trash2,
  Download,
  X,
  Loader2,
  Calendar,
  User,
  FileText,
  Printer,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { generateExpenseVoucherPDF } from '@/lib/pdf/student-documents'

export interface SchoolExpenseItem {
  id: string
  category: string
  label: string
  amount: number
  payment_method: string
  beneficiary: string | null
  expense_date: string
  notes: string | null
  created_at: string
}

interface DepensesManagerProps {
  expenses: SchoolExpenseItem[]
  totalCollected: number
  schoolInfo?: {
    name?: string | null
    city?: string | null
    phone?: string | null
    director_name?: string | null
  } | null
}

const EXPENSE_CATEGORIES = [
  'Salaires & Vacations',
  'Fournitures & Pédagogie',
  'Électricité, Eau & Internet',
  'Entretien & Réparations',
  'Loyer & Charges',
  'Événements scolaires',
  'Fonctionnement',
  'Autre',
]

const PAYMENT_METHODS: Record<string, string> = {
  especes: 'Espèces (Caisse)',
  mobile_money: 'Mobile Money',
  virement: 'Virement bancaire',
  cheque: 'Chèque',
}

export function DepensesManager({ expenses, totalCollected, schoolInfo = null }: DepensesManagerProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('ALL')

  const totalExpenses = useMemo(
    () => expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [expenses]
  )
  const netBalance = totalCollected - totalExpenses

  const filteredExpenses = useMemo(() => {
    return expenses.filter((item) => {
      const matchesSearch =
        item.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.beneficiary || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory =
        selectedCategory === 'ALL' || item.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [expenses, searchTerm, selectedCategory])

  const handleCreateExpense = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const res = await addSchoolExpense(formData)
      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success('Dépense enregistrée avec succès !')
        setIsModalOpen(false)
        router.refresh()
      }
    })
  }

  const handleDelete = (id: string, label: string) => {
    if (!window.confirm(`Supprimer la dépense "${label}" ?`)) return
    startTransition(async () => {
      const res = await deleteSchoolExpense(id)
      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success('Dépense supprimée.')
        router.refresh()
      }
    })
  }

  const handleExportCSV = () => {
    if (filteredExpenses.length === 0) return
    const headers = ['Date', 'Catégorie', 'Libellé', 'Bénéficiaire', 'Mode', 'Montant (FCFA)', 'Notes']
    const rows = filteredExpenses.map((e) => [
      e.expense_date,
      e.category,
      e.label,
      e.beneficiary || '',
      PAYMENT_METHODS[e.payment_method] || e.payment_method,
      String(e.amount),
      e.notes || '',
    ])
    const csvContent = [
      headers.join(','),
      ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.setAttribute('download', `depenses_ecole_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      <FinanceNavTabs />

      <FinanceExecutiveBanner
        badge="TRÉSORERIE & DÉCAISSEMENTS"
        badgeIcon={TrendingDown}
        title="Dépenses & Décaissements"
        subtitle="Suivez les sorties de caisse (salaires, fournitures, charges) et le solde net disponible."
        stats={[
          { label: 'Opérations', value: expenses.length },
          { label: 'Total sorties', value: `${totalExpenses.toLocaleString('fr-FR')} F`, color: 'rose' },
        ]}
        actions={
          <div className="flex items-center gap-2.5 flex-wrap">
            {expenses.length > 0 && (
              <button
                type="button"
                onClick={handleExportCSV}
                className="px-4 py-2.5 rounded-xl bg-white/15 ring-1 ring-white/25 text-white text-xs sm:text-sm font-bold hover:bg-white/25 transition-colors flex items-center gap-2 backdrop-blur-md"
              >
                <Download size={16} />
                Exporter CSV
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-white text-indigo-950 text-xs sm:text-sm font-extrabold hover:bg-indigo-50 transition-colors flex items-center gap-2 shadow-md"
            >
              <Plus size={16} className="text-indigo-700" />
              Enregistrer une dépense
            </button>
          </div>
        }
      />

      {/* KPI Cards : Entrées vs Sorties vs Solde Net */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              Total Encaissé (Entrées)
            </p>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {totalCollected.toLocaleString('fr-FR')} <span className="text-sm font-bold text-slate-500">FCFA</span>
            </p>
            <p className="text-xs text-slate-500 mt-1">Scolarités & frais perçus</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-rose-200 p-5 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-rose-700">
              Total Dépenses (Sorties)
            </p>
            <p className="text-2xl font-black text-rose-700 mt-1">
              {totalExpenses.toLocaleString('fr-FR')} <span className="text-sm font-bold text-rose-500">FCFA</span>
            </p>
            <p className="text-xs text-slate-500 mt-1">{expenses.length} décaissement(s) enregistré(s)</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200">
            <TrendingDown className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Solde Net en Caisse
            </p>
            <p
              className={`text-2xl font-black mt-1 ${
                netBalance >= 0 ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              {netBalance.toLocaleString('fr-FR')} <span className="text-sm font-bold">FCFA</span>
            </p>
            <p className="text-xs text-slate-500 mt-1">Entrées moins sorties</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-800 flex items-center justify-center border border-slate-200">
            <Wallet className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filters & Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50/60">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
            <div className="relative w-full sm:w-72">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher un motif, bénéficiaire..."
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-emerald-600"
            >
              <option value="ALL">Toutes les catégories</option>
              {EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <span className="text-xs font-semibold text-slate-500">
            {filteredExpenses.length} dépense(s)
          </span>
        </div>

        {filteredExpenses.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
              <TrendingDown className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-800">Aucune dépense enregistrée</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Enregistrez vos sorties de caisse (salaires, achats de craies/fournitures, factures d&apos;électricité, entretien) pour suivre votre trésorerie nette.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
                <tr>
                  <th className="py-3.5 px-5">Date</th>
                  <th className="py-3.5 px-4">Catégorie</th>
                  <th className="py-3.5 px-4">Motif / Libellé</th>
                  <th className="py-3.5 px-4">Bénéficiaire</th>
                  <th className="py-3.5 px-4">Mode</th>
                  <th className="py-3.5 px-4 text-right">Montant</th>
                  <th className="py-3.5 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-5 text-xs text-slate-600 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(exp.expense_date).toLocaleDateString('fr-FR')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900">{exp.label}</p>
                      {exp.notes && <p className="text-xs text-slate-500 mt-0.5">{exp.notes}</p>}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      {exp.beneficiary ? (
                        <span className="inline-flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          {exp.beneficiary}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-medium text-slate-600">
                      {PAYMENT_METHODS[exp.payment_method] || exp.payment_method}
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-rose-700 whitespace-nowrap">
                      -{Number(exp.amount).toLocaleString('fr-FR')} FCFA
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            generateExpenseVoucherPDF({
                              id: exp.id,
                              category: exp.category,
                              label: exp.label,
                              amount: exp.amount,
                              paymentMethod: PAYMENT_METHODS[exp.payment_method] || exp.payment_method,
                              beneficiary: exp.beneficiary,
                              expenseDate: exp.expense_date,
                              notes: exp.notes,
                              schoolName: schoolInfo?.name || 'Établissement Scolaire',
                              schoolCity: schoolInfo?.city || null,
                              schoolPhone: schoolInfo?.phone || null,
                              directorName: schoolInfo?.director_name || null,
                            })
                            toast.success('Bon de décaissement / Reçu PDF généré !')
                          }}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors inline-flex items-center gap-1"
                          title="Télécharger le Bon de Caisse ou Reçu de Paie en PDF"
                        >
                          <Printer className="w-3.5 h-3.5 text-emerald-700" />
                          Pièce PDF
                        </button>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleDelete(exp.id, exp.label)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Supprimer cette dépense"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Enregistrer une dépense */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100">
            <div className="px-6 py-4 bg-emerald-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-emerald-300" />
                <h3 className="font-bold text-base">Nouveau Décaissement / Dépense</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-emerald-200 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Catégorie *
                  </label>
                  <select
                    name="category"
                    required
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-600"
                  >
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Date de sortie *
                  </label>
                  <input
                    type="date"
                    name="expense_date"
                    defaultValue={new Date().toISOString().split('T')[0]}
                    required
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Libellé / Motif de la dépense *
                </label>
                <input
                  type="text"
                  name="label"
                  required
                  placeholder="Ex: Achat de rames de papier A4 et boîtes de craies"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Montant décaissé (FCFA) *
                  </label>
                  <input
                    type="number"
                    name="amount"
                    min={1}
                    required
                    placeholder="Ex: 25000"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mode de règlement
                  </label>
                  <select
                    name="payment_method"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-600"
                  >
                    <option value="especes">Espèces (Caisse)</option>
                    <option value="mobile_money">Mobile Money</option>
                    <option value="virement">Virement bancaire</option>
                    <option value="cheque">Chèque</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Bénéficiaire / Fournisseur
                </label>
                <input
                  type="text"
                  name="beneficiary"
                  placeholder="Ex: Papeterie Centrale / M. Kouassi"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Observation / N° Pièce justificative (Optionnel)
                </label>
                <textarea
                  name="notes"
                  rows={2}
                  placeholder="Ex: Facture N° 2026-084"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isPending}
                  className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-emerald-700 text-white hover:bg-emerald-800 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Valider la dépense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

