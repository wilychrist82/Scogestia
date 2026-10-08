'use client'

import { useState } from 'react'
import Link from 'next/link'
import { TrendingUp, Banknote, Users, Receipt, AlertTriangle, ChevronRight, FileText, Printer, FileSpreadsheet } from 'lucide-react'
import { FinanceNavTabs } from './FinanceNavTabs'
import { FinancePageBanner } from './FinancePageBanner'
import { FinancialReportDocument, SchoolInfo } from './FinancialReportDocument'

type Stats = {
  totalEncaisse: number
  totalAttendu: number
  nbImpayes: number
  nbEleves: number
  nbPaiements: number
  repartitionMethode: Record<string, number>
}

type PaymentItem = {
  amount: number
  paid_at: string
  payment_method: string | null
}

type ScheduleItem = {
  amount_due: number
  status: string
  due_date: string
}

type Props = {
  school?: SchoolInfo
  userFullName?: string
  stats: Stats
  payments: PaymentItem[]
  schedules: ScheduleItem[]
  basePath?: string
}

const formatCFA = (amount: number) =>
  `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(amount)} FCFA`

const METHOD_LABELS: Record<string, string> = {
  especes: 'Espèces',
  tmoney: 'T-Money',
  flooz: 'Flooz',
  wave: 'Wave',
  virement: 'Virement bancaire',
  cheque: 'Chèque',
  Autre: 'Autre',
}

export function RapportsFinanciers({ school, userFullName, stats, payments, schedules, basePath = '/admin/finance' }: Props) {
  const [showDocumentModal, setShowDocumentModal] = useState(false)
  const [isExportingExcel, setIsExportingExcel] = useState(false)

  // Taux plafonné à 100%
  const tauxRecouvrement = stats.totalAttendu > 0
    ? Math.min(100, Math.round((stats.totalEncaisse / stats.totalAttendu) * 100))
    : 0

  const soldeRestant = Math.max(0, stats.totalAttendu - stats.totalEncaisse)

  // Grouper paiements par mois
  const parMois: Record<string, number> = {}
  payments.forEach(p => {
    if (!p.paid_at) return
    const mois = new Date(p.paid_at).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })
    parMois[mois] = (parMois[mois] || 0) + Number(p.amount)
  })
  const derniersMois = Object.entries(parMois).slice(-6)

  // Export Excel direct
  const handleExportExcel = async () => {
    setIsExportingExcel(true)
    try {
      const xlsx = await import('xlsx')
      const wb = xlsx.utils.book_new()
      const schoolName = school?.name || 'Scogestia'
      const academicYear = school?.current_academic_year || '2024-2025'
      const dateStr = new Date().toLocaleDateString('fr-FR')

      const wsData = [
        ['RÉPUBLIQUE SCOGESTIA - ÉTABLISSEMENT ' + schoolName.toUpperCase()],
        ['BILAN ET SYNTHÈSE FINANCIÈRE OFFICIELLE'],
        [`Année Scolaire : ${academicYear}`, `Date d'exportation : ${dateStr}`],
        [`Édité par : ${userFullName || 'Direction'}`],
        [],
        ['--- SYNTHÈSE GLOBALE ---'],
        ['Indicateur', 'Montant / Valeur', 'Observations'],
        ['Total Attendu (Prévisionnel)', stats.totalAttendu, 'Somme globale des échéances'],
        ['Total Encaissé (Réalisé)', stats.totalEncaisse, 'Montant effectif perçu'],
        ['Solde Restant à Recouvrer', soldeRestant, 'Créances restantes'],
        ['Taux de Recouvrement', `${tauxRecouvrement}%`, 'Niveau d\'avancement'],
        ['Effectif Élèves Actifs', stats.nbEleves, 'Nombre total d\'élèves inscrits'],
        ['Dossiers en Retard (Impayés)', stats.nbImpayes, 'Dossiers à relancer'],
        ['Nombre de Règlements Enregistrés', stats.nbPaiements, 'Transactions enregistrées'],
        [],
        ['--- RÉPARTITION PAR MODE DE RÈGLEMENT ---'],
        ['Mode de Règlement', 'Montant Encaissé (FCFA)', 'Part (%)'],
        ...Object.entries(stats.repartitionMethode).map(([method, amount]) => {
          const pct = stats.totalEncaisse > 0 ? Math.round((amount / stats.totalEncaisse) * 100) : 0
          return [METHOD_LABELS[method] || method, amount, `${pct}%`]
        }),
        ['TOTAL GÉNÉRAL', stats.totalEncaisse, '100%'],
      ]

      if (derniersMois.length > 0) {
        wsData.push([])
        wsData.push(['--- ENCAISSEMENTS MENSUELS RÉCENTS ---'])
        wsData.push(['Mois', 'Montant Encaissé (FCFA)'])
        derniersMois.forEach(([m, amt]) => {
          wsData.push([m, amt])
        })
      }

      const ws = xlsx.utils.aoa_to_sheet(wsData)
      ws['!cols'] = [{ wch: 35 }, { wch: 25 }, { wch: 35 }]
      xlsx.utils.book_append_sheet(wb, ws, 'Bilan Financier')

      const sanitizedSchool = schoolName.replace(/[^a-zA-Z0-9]/g, '_')
      xlsx.writeFile(wb, `Bilan_Financier_${sanitizedSchool}_${new Date().toISOString().slice(0, 10)}.xlsx`)
    } catch (err) {
      console.error('[Excel Export Error]', err)
    } finally {
      setIsExportingExcel(false)
    }
  }

  const kpis = [
    { label: 'Total encaissé', value: formatCFA(stats.totalEncaisse), icon: TrendingUp, tint: 'bg-emerald-50 text-emerald-700 border-emerald-100', valueCls: 'text-emerald-700' },
    { label: 'Total attendu', value: formatCFA(stats.totalAttendu), icon: Banknote, tint: 'bg-slate-100 text-slate-700 border-slate-200', valueCls: 'text-slate-900' },
    { label: 'Impayés en retard', value: `${stats.nbImpayes} dossier${stats.nbImpayes > 1 ? 's' : ''}`, icon: AlertTriangle, tint: 'bg-rose-50 text-rose-700 border-rose-100', valueCls: 'text-rose-600' },
    { label: 'Élèves actifs', value: `${stats.nbEleves} élève${stats.nbEleves > 1 ? 's' : ''}`, icon: Users, tint: 'bg-blue-50 text-blue-700 border-blue-100', valueCls: 'text-slate-900' },
  ]

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-8 px-1">
      {/* Barre de navigation d'onglets */}
      <FinanceNavTabs basePath={basePath} />

      {/* Bannière Prestige Sombre */}
      <FinancePageBanner
        title="Rapports & Synthèse Financière"
        subtitle="Consultez les bilans d'encaissement, les flux de trésorerie consolidés et éditez le bilan officiel."
        badge="BILANS & AUDIT FINANCIER"
        icon={FileText}
        stats={[
          { label: 'Total Encaissé', value: formatCFA(stats.totalEncaisse), color: 'text-emerald-400' },
          { label: 'Élèves', value: stats.nbEleves, color: 'text-white' },
        ]}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setShowDocumentModal(true)}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-white text-slate-900 hover:bg-slate-100 text-xs font-bold transition-all shadow-sm cursor-pointer"
              title="Ouvrir la fiche officielle de comptabilité avec en-tête et signatures"
            >
              <Printer size={14} className="text-blue-600" />
              <span>Bilan Officiel (PDF / Imprimer)</span>
            </button>

            <button
              type="button"
              onClick={handleExportExcel}
              disabled={isExportingExcel}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-emerald-600/90 hover:bg-emerald-600 border border-emerald-500/30 text-white text-xs font-bold transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
              title="Télécharger le fichier Excel (.xlsx)"
            >
              <FileSpreadsheet size={14} />
              <span>{isExportingExcel ? 'Export...' : 'Export Excel (.xlsx)'}</span>
            </button>
          </div>
        }
      />

      {/* Cartes KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(({ label, value, icon: Icon, tint, valueCls }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-slate-500">{label}</p>
              <span className={`w-7 h-7 rounded-md border flex items-center justify-center ${tint}`}>
                <Icon size={14} />
              </span>
            </div>
            <p className={`text-xl font-semibold tabular-nums tracking-tight mt-3 ${valueCls}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Taux de recouvrement */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)] p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Taux de recouvrement global</h2>
            <p className="text-xs text-slate-500 mt-0.5">Proportion des paiements effectivement encaissés sur l&apos;année</p>
          </div>
          <span className={`text-2xl font-bold tabular-nums ${tauxRecouvrement >= 80 ? 'text-emerald-700' : tauxRecouvrement >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>
            {tauxRecouvrement}%
          </span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
          <div
            className={`h-3 rounded-full transition-all duration-700 ${tauxRecouvrement >= 80 ? 'bg-emerald-600' : tauxRecouvrement >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
            style={{ width: `${Math.min(tauxRecouvrement, 100)}%` }}
          />
        </div>
        <div className="flex justify-between mt-2.5 text-xs text-slate-500">
          <span>0%</span>
          <span>Solde restant : <strong className="text-slate-800 font-semibold">{formatCFA(soldeRestant)}</strong></span>
          <span>100%</span>
        </div>
      </section>

      {/* Grille détaillée */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Paiements par méthode */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)] p-6">
          <h2 className="text-sm font-semibold text-slate-900 mb-1">Répartition par moyen de paiement</h2>
          <p className="text-xs text-slate-500 mb-4">Volume total encaissé par canal</p>

          {Object.keys(stats.repartitionMethode).length === 0 ? (
            <p className="text-slate-400 text-xs italic text-center py-8">Aucun paiement enregistré.</p>
          ) : (
            <div className="space-y-3.5">
              {Object.entries(stats.repartitionMethode).map(([method, amount]) => {
                const pct = stats.totalEncaisse > 0 ? Math.round((amount / stats.totalEncaisse) * 100) : 0
                return (
                  <div key={method}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="font-medium text-slate-700">{METHOD_LABELS[method] || method}</span>
                      <span className="text-slate-900 font-semibold tabular-nums">
                        {formatCFA(amount)} <span className="text-slate-400 font-normal">({pct}%)</span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div className="h-2 rounded-full bg-emerald-700" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Historique mensuel */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)] p-6">
          <h2 className="text-sm font-semibold text-slate-900 mb-1">Encaissements mensuels récents</h2>
          <p className="text-xs text-slate-500 mb-4">Évolution des encaissements sur les derniers mois</p>

          {derniersMois.length === 0 ? (
            <p className="text-slate-400 text-xs italic text-center py-8">Aucun paiement enregistré.</p>
          ) : (
            <div className="space-y-3.5">
              {derniersMois.map(([mois, montant]) => {
                const maxMontant = Math.max(...derniersMois.map(([, m]) => m)) || 1
                const pct = Math.round((montant / maxMontant) * 100)
                return (
                  <div key={mois}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="font-medium text-slate-700 capitalize">{mois}</span>
                      <span className="text-slate-900 font-semibold tabular-nums">{formatCFA(montant)}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div className="h-2 rounded-full bg-emerald-600" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>

      {/* Récapitulatif chiffres clés */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)] p-6">
        <div className="flex items-center gap-2 mb-4">
          <Receipt size={17} className="text-emerald-700" />
          <h2 className="text-sm font-semibold text-slate-900">Indicateurs de gestion</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Paiements enregistrés', value: stats.nbPaiements.toString(), color: 'text-slate-900' },
            { label: 'Dossiers en retard', value: stats.nbImpayes.toString(), color: stats.nbImpayes > 0 ? 'text-rose-600' : 'text-slate-900' },
            { label: 'Élèves actifs', value: stats.nbEleves.toString(), color: 'text-slate-900' },
            { label: 'Recouvrement', value: `${tauxRecouvrement}%`, color: 'text-emerald-700' },
          ].map(item => (
            <div key={item.label} className="p-3.5 bg-slate-50 border border-slate-100 rounded-lg text-center">
              <p className={`text-xl font-bold tabular-nums ${item.color}`}>{item.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Modal Bilan Officiel Imprimable / PDF */}
      {showDocumentModal && (
        <FinancialReportDocument
          school={school}
          userFullName={userFullName}
          stats={stats}
          payments={payments}
          onClose={() => setShowDocumentModal(false)}
        />
      )}
    </div>
  )
}
