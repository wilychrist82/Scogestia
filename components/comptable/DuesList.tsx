'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

type Due = {
  id: string
  label: string
  amount: number
  due_date: string
  status: 'en_attente' | 'paye' | 'en_retard' | 'partiel'
  student: {
    first_name: string
    last_name: string
    class: { name: string } | null
  } | null
}

type Props = {
  dues: Due[]
  classes: { id: string, name: string }[]
}

const statusColors = {
  'paye': 'bg-[#D1FAE5] text-[#065F46]',
  'en_retard': 'bg-[#FEE2E2] text-[#B91C1C]',
  'en_attente': 'bg-[#F3F4F6] text-[#374151]',
  'partiel': 'bg-[#FFEDD5] text-[#9A3412]'
}

const statusLabels = {
  'paye': 'Payé',
  'en_retard': 'En retard',
  'en_attente': 'En attente',
  'partiel': 'Partiel'
}

export function DuesList({ dues, classes }: Props) {
  const [classFilter, setClassFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const filteredDues = dues.filter(due => {
    if (classFilter && due.student?.class?.name !== classFilter) return false
    if (statusFilter && due.status !== statusFilter) return false
    return true
  })

  return (
    <div className="space-y-6">
      {/* Page Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[var(--color-on-background)]">Liste des échéances de paiement</h2>
          <p className="text-base text-[var(--color-on-surface-variant)] mt-1">Gérez et suivez les paiements des élèves.</p>
        </div>
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <select 
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="appearance-none w-full sm:w-48 bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] text-[var(--color-on-surface)] text-sm font-semibold py-2 pl-3 pr-10 rounded-md focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)] transition-colors cursor-pointer"
            >
              <option value="">Toutes les classes</option>
              {classes.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-on-surface-variant)] pointer-events-none text-sm">expand_more</span>
          </div>
          
          <div className="relative">
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none w-full sm:w-48 bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] text-[var(--color-on-surface)] text-sm font-semibold py-2 pl-3 pr-10 rounded-md focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)] transition-colors cursor-pointer"
            >
              <option value="">Tous les statuts</option>
              <option value="paye">Payé</option>
              <option value="en_attente">En attente</option>
              <option value="en_retard">En retard</option>
              <option value="partiel">Partiel</option>
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-on-surface-variant)] pointer-events-none text-sm">expand_more</span>
          </div>
        </div>
      </div>

      {/* Data Table Card */}
      <div className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-[var(--color-surface)] border-b border-[var(--color-outline-variant)]">
                <th className="py-3 px-4 text-sm font-semibold text-[var(--color-on-surface-variant)] w-32">Échéance</th>
                <th className="py-3 px-4 text-sm font-semibold text-[var(--color-on-surface-variant)]">Élève</th>
                <th className="py-3 px-4 text-sm font-semibold text-[var(--color-on-surface-variant)] w-24">Classe</th>
                <th className="py-3 px-4 text-sm font-semibold text-[var(--color-on-surface-variant)]">Libellé</th>
                <th className="py-3 px-4 text-sm font-semibold text-[var(--color-on-surface-variant)] text-right w-32">Montant</th>
                <th className="py-3 px-4 text-sm font-semibold text-[var(--color-on-surface-variant)] w-40 text-center">Statut</th>
                <th className="py-3 px-4 w-12"></th>
              </tr>
            </thead>
            <tbody className="text-base text-[var(--color-on-background)]">
              {filteredDues.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[var(--color-on-surface-variant)]">
                    Aucune échéance trouvée.
                  </td>
                </tr>
              ) : (
                filteredDues.map((due) => (
                  <tr key={due.id} className="border-b border-[var(--color-outline-variant)] hover:bg-[var(--color-surface-container-low)] transition-colors even:bg-[var(--color-surface)]">
                    <td className="py-3 px-4">{format(new Date(due.due_date), 'dd MMM yyyy', { locale: fr })}</td>
                    <td className="py-3 px-4 font-medium">{due.student?.first_name} {due.student?.last_name}</td>
                    <td className="py-3 px-4">{due.student?.class?.name || '-'}</td>
                    <td className="py-3 px-4 text-[var(--color-on-surface-variant)]">{due.label}</td>
                    <td className="py-3 px-4 text-right">{due.amount.toLocaleString('fr-FR')} FCFA</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold ${statusColors[due.status]}`}>
                        {statusLabels[due.status]}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button className="text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] transition-colors p-1 rounded-full hover:bg-[var(--color-surface-container-high)]">
                        <span className="material-symbols-outlined text-[20px]">more_vert</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Table Footer */}
        <div className="bg-[var(--color-surface-container-lowest)] px-4 py-3 border-t border-[var(--color-outline-variant)] flex items-center justify-between">
          <span className="text-base text-[var(--color-on-surface-variant)]">Affichage de {filteredDues.length} échéances</span>
          {/* <div className="flex gap-2">
            <button className="px-3 py-1 border border-[var(--color-outline-variant)] rounded text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container-low)] disabled:opacity-50 transition-colors text-sm font-semibold" disabled>Précédent</button>
            <button className="px-3 py-1 border border-[var(--color-outline-variant)] rounded text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container-low)] transition-colors text-sm font-semibold">Suivant</button>
          </div> */}
        </div>
      </div>
    </div>
  )
}
