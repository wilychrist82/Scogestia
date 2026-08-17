'use client'

import { useState, useTransition } from 'react'
import { sendManualReminder } from '@/app/actions/accounting'

type UnpaidDue = {
  id: string
  label: string
  amount: number
  due_date: string
  student: {
    first_name: string
    last_name: string
    class: { name: string } | null
  } | null
}

type Props = {
  totalExpected: number
  totalCollected: number
  unpaidDues: UnpaidDue[]
}

export function AccountingDashboard({ totalExpected, totalCollected, unpaidDues }: Props) {
  const [isPending, startTransition] = useTransition()
  const [loadingDueId, setLoadingDueId] = useState<string | null>(null)
  
  const recoveryRate = totalExpected > 0 ? (totalCollected / totalExpected) * 100 : 0
  const recoveryRateFormatted = recoveryRate.toFixed(1)

  const handleReminder = (dueId: string) => {
    setLoadingDueId(dueId)
    startTransition(async () => {
      const result = await sendManualReminder(dueId)
      if (result?.error) {
        alert(result.error)
      } else {
        alert('Relance envoyée avec succès.')
      }
      setLoadingDueId(null)
    })
  }

  const handleExportCSV = () => {
    if (unpaidDues.length === 0) {
      alert("Aucune donnée à exporter.")
      return
    }

    const headers = ['Élève', 'Classe', 'Libellé', 'Montant (FCFA)', 'Date d\'échéance', 'Jours de retard']
    
    const rows = unpaidDues.map(due => {
      const delayDays = Math.max(0, Math.floor((new Date().getTime() - new Date(due.due_date).getTime()) / (1000 * 60 * 60 * 24)))
      return [
        `"${due.student?.first_name} ${due.student?.last_name}"`,
        `"${due.student?.class?.name || ''}"`,
        `"${due.label}"`,
        due.amount,
        due.due_date,
        delayDays
      ]
    })

    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `impayes_scogestia_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="mb-4">
        <h1 className="text-3xl font-bold text-[var(--color-on-surface)]">Tableau de bord comptable</h1>
        <p className="text-[var(--color-on-surface-variant)] text-base mt-1">Aperçu financier et suivi des recouvrements</p>
      </header>

      {/* Summary Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Expected Total */}
        <div className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Total Attendu</span>
            <div className="w-10 h-10 rounded-full bg-[var(--color-surface-container)] flex items-center justify-center text-[var(--color-primary)]">
              <span className="material-symbols-outlined">account_balance_wallet</span>
            </div>
          </div>
          <div>
            <h2 className="text-4xl font-bold text-[var(--color-on-surface)]">{totalExpected.toLocaleString('fr-FR')}</h2>
            <span className="text-xs font-medium text-[var(--color-on-surface-variant)]">FCFA (Année en cours)</span>
          </div>
        </div>

        {/* Collected Total */}
        <div className="bg-[var(--color-primary)] border border-[var(--color-primary-container)] rounded-xl p-4 shadow-sm flex flex-col justify-between text-white">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold opacity-90 uppercase tracking-wider">Total Encaissé</span>
            <div className="w-10 h-10 rounded-full bg-[var(--color-primary-container)] bg-opacity-30 flex items-center justify-center">
              <span className="material-symbols-outlined">payments</span>
            </div>
          </div>
          <div>
            <h2 className="text-4xl font-bold">{totalCollected.toLocaleString('fr-FR')}</h2>
            <span className="text-xs font-medium opacity-80">FCFA ({recoveryRateFormatted}% de l'objectif)</span>
          </div>
        </div>

        {/* Recovery Rate */}
        <div className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Taux de Recouvrement</span>
            <div className="w-10 h-10 rounded-full bg-[var(--color-secondary-container)] flex items-center justify-center text-[var(--color-on-secondary-container)]">
              <span className="material-symbols-outlined">trending_up</span>
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <h2 className="text-4xl font-bold text-[var(--color-primary)]">{recoveryRateFormatted}%</h2>
            </div>
            <div className="w-full bg-[var(--color-surface-container-high)] rounded-full h-2.5 mt-4">
              <div className="bg-[var(--color-primary)] h-2.5 rounded-full transition-all duration-500" style={{ width: `${Math.min(recoveryRate, 100)}%` }}></div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Chart Section (Simplified visual representation) */}
        <section className="lg:col-span-1 bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-xl p-4 shadow-sm flex flex-col">
          <h3 className="text-xl font-semibold text-[var(--color-on-surface)] mb-6">Attendu vs Encaissé</h3>
          <div className="flex-1 flex flex-col justify-center gap-6">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-semibold text-[var(--color-on-surface)]">Attendu</span>
                <span className="text-sm font-bold text-[var(--color-on-surface)]">{totalExpected > 0 ? (totalExpected/1000000).toFixed(1) + 'M' : '0'}</span>
              </div>
              <div className="w-full bg-[var(--color-surface-container-high)] rounded-sm h-6 overflow-hidden">
                <div className="bg-[var(--color-secondary)] h-full w-full"></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-semibold text-[var(--color-on-surface)]">Encaissé</span>
                <span className="text-sm font-bold text-[var(--color-primary)]">{totalCollected > 0 ? (totalCollected/1000000).toFixed(1) + 'M' : '0'}</span>
              </div>
              <div className="w-full bg-[var(--color-surface-container-high)] rounded-sm h-6 overflow-hidden">
                <div className="bg-[var(--color-primary)] h-full transition-all duration-500" style={{ width: `${Math.min(recoveryRate, 100)}%` }}></div>
              </div>
            </div>
          </div>
        </section>

        {/* Urgent Unpaid Table */}
        <section className="lg:col-span-2 bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-xl overflow-hidden shadow-sm flex flex-col">
          <div className="p-4 border-b border-[var(--color-outline-variant)] flex justify-between items-center bg-[var(--color-surface-bright)]">
            <h3 className="text-xl font-semibold text-[var(--color-on-surface)]">Impayés Urgents</h3>
            <button 
              onClick={handleExportCSV}
              className="text-[var(--color-primary)] text-sm font-semibold hover:underline flex items-center gap-1"
            >
              Export CSV <span className="material-symbols-outlined text-sm">download</span>
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-[var(--color-surface-container-low)] text-[var(--color-on-surface-variant)] text-sm border-b border-[var(--color-outline-variant)]">
                  <th className="py-3 px-4 font-semibold">Élève</th>
                  <th className="py-3 px-4 font-semibold">Classe</th>
                  <th className="py-3 px-4 font-semibold text-right">Montant</th>
                  <th className="py-3 px-4 font-semibold text-center">Retard</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-base text-[var(--color-on-background)]">
                {unpaidDues.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-[var(--color-on-surface-variant)]">
                      Aucun impayé urgent trouvé.
                    </td>
                  </tr>
                ) : (
                  unpaidDues.map(due => {
                    const delayDays = Math.max(0, Math.floor((new Date().getTime() - new Date(due.due_date).getTime()) / (1000 * 60 * 60 * 24)))
                    
                    // Couleur en fonction de la gravité du retard
                    let delayColorClass = "bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)]"
                    if (delayDays > 30) {
                      delayColorClass = "bg-[var(--color-status-retard-bg)] text-[var(--color-status-retard-text)]"
                    } else if (delayDays > 15) {
                      delayColorClass = "bg-[#fff3e0] text-[#e65100]" // Orange
                    }

                    return (
                      <tr key={due.id} className="border-b border-[var(--color-outline-variant)] hover:bg-[var(--color-surface-container-high)] transition-colors odd:bg-[var(--color-surface-bright)] even:bg-[var(--color-surface-container-lowest)]">
                        <td className="py-3 px-4 font-medium text-[var(--color-on-surface)]">{due.student?.first_name} {due.student?.last_name}</td>
                        <td className="py-3 px-4 text-[var(--color-on-surface-variant)]">{due.student?.class?.name || '-'}</td>
                        <td className="py-3 px-4 text-right font-semibold text-[var(--color-error)]">{due.amount.toLocaleString('fr-FR')} FCFA</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-bold ${delayColorClass}`}>
                            {delayDays} jours
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button 
                            onClick={() => handleReminder(due.id)}
                            disabled={isPending && loadingDueId === due.id}
                            className="text-[var(--color-primary)] hover:bg-[var(--color-surface-container)] p-2 rounded-md transition-colors disabled:opacity-50" 
                            title="Relancer"
                          >
                            <span className="material-symbols-outlined">{isPending && loadingDueId === due.id ? 'hourglass_empty' : 'send'}</span>
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}
