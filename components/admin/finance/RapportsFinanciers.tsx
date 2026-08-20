'use client'

import { TrendingUp, TrendingDown, Banknote, Users, Receipt, AlertTriangle, Download } from 'lucide-react'

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
  stats: Stats
  payments: PaymentItem[]
  schedules: ScheduleItem[]
}

const formatCFA = (amount: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 })
    .format(amount)
    .replace('XOF', 'FCFA')

const METHOD_LABELS: Record<string, string> = {
  especes: 'Espèces',
  mobile_money: 'Mobile Money',
  virement: 'Virement bancaire',
  cheque: 'Chèque',
  Autre: 'Autre',
}

export function RapportsFinanciers({ stats, payments, schedules }: Props) {
  const tauxRecouvrement = stats.totalAttendu > 0
    ? Math.round((stats.totalEncaisse / stats.totalAttendu) * 100)
    : 0

  const soldeRestant = stats.totalAttendu - stats.totalEncaisse

  // Grouper paiements par mois
  const parMois: Record<string, number> = {}
  payments.forEach(p => {
    const mois = new Date(p.paid_at).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })
    parMois[mois] = (parMois[mois] || 0) + Number(p.amount)
  })
  const derniersMois = Object.entries(parMois).slice(-6)

  const handleExport = () => {
    const lines = [
      'Rapport Financier Scogestia',
      `Généré le : ${new Date().toLocaleDateString('fr-FR')}`,
      '',
      '--- SYNTHÈSE ---',
      `Total attendu : ${formatCFA(stats.totalAttendu)}`,
      `Total encaissé : ${formatCFA(stats.totalEncaisse)}`,
      `Solde restant : ${formatCFA(soldeRestant)}`,
      `Taux de recouvrement : ${tauxRecouvrement}%`,
      `Nombre d'impayés : ${stats.nbImpayes}`,
      `Nombre de paiements : ${stats.nbPaiements}`,
      `Nombre d'élèves actifs : ${stats.nbEleves}`,
      '',
      '--- RÉPARTITION PAR MÉTHODE ---',
      ...Object.entries(stats.repartitionMethode).map(
        ([method, amount]) => `${METHOD_LABELS[method] || method} : ${formatCFA(amount)}`
      ),
    ]

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `rapport-financier-${new Date().toISOString().split('T')[0]}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6 max-w-[1280px] mx-auto pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rapports Financiers</h1>
          <p className="text-gray-500">Consultez les bilans, encaissements et statistiques financières.</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 bg-[var(--color-primary)] text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:opacity-90 transition-all shadow-sm w-full sm:w-auto justify-center"
        >
          <Download size={16} />
          Exporter le rapport
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center shrink-0">
            <TrendingUp size={22} className="text-green-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium mb-0.5">Total encaissé</p>
            <p className="text-xl font-bold text-gray-900 leading-tight">{formatCFA(stats.totalEncaisse)}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
            <Banknote size={22} className="text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium mb-0.5">Total attendu</p>
            <p className="text-xl font-bold text-gray-900 leading-tight">{formatCFA(stats.totalAttendu)}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-red-200 shadow-sm p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center shrink-0">
            <AlertTriangle size={22} className="text-red-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium mb-0.5">Impayés en retard</p>
            <p className="text-xl font-bold text-red-600 leading-tight">{stats.nbImpayes} dossiers</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
            <Users size={22} className="text-purple-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium mb-0.5">Élèves actifs</p>
            <p className="text-xl font-bold text-gray-900 leading-tight">{stats.nbEleves}</p>
          </div>
        </div>
      </div>

      {/* Taux de recouvrement */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Taux de recouvrement global</h2>
            <p className="text-sm text-gray-500">Proportion des paiements effectivement encaissés</p>
          </div>
          <span className={`text-3xl font-black ${tauxRecouvrement >= 80 ? 'text-green-600' : tauxRecouvrement >= 50 ? 'text-orange-500' : 'text-red-600'}`}>
            {tauxRecouvrement}%
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
          <div
            className={`h-4 rounded-full transition-all duration-700 ${tauxRecouvrement >= 80 ? 'bg-green-500' : tauxRecouvrement >= 50 ? 'bg-orange-400' : 'bg-red-500'}`}
            style={{ width: `${Math.min(tauxRecouvrement, 100)}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>0%</span>
          <span>Solde restant : <strong className="text-gray-900">{formatCFA(soldeRestant)}</strong></span>
          <span>100%</span>
        </div>
      </div>

      {/* Grille bas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Paiements par méthode */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Répartition par méthode de paiement</h2>
          {Object.keys(stats.repartitionMethode).length === 0 ? (
            <p className="text-gray-400 text-sm italic text-center py-8">Aucun paiement enregistré.</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(stats.repartitionMethode).map(([method, amount]) => {
                const pct = Math.round((amount / stats.totalEncaisse) * 100)
                return (
                  <div key={method}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700">{METHOD_LABELS[method] || method}</span>
                      <span className="text-gray-900 font-bold">{formatCFA(amount)} <span className="text-gray-400 font-normal">({pct}%)</span></span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-[var(--color-primary)]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Historique mensuel */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Encaissements par mois</h2>
          {derniersMois.length === 0 ? (
            <p className="text-gray-400 text-sm italic text-center py-8">Aucun paiement enregistré.</p>
          ) : (
            <div className="space-y-3">
              {derniersMois.map(([mois, montant]) => {
                const maxMontant = Math.max(...derniersMois.map(([, m]) => m))
                const pct = Math.round((montant / maxMontant) * 100)
                return (
                  <div key={mois}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700 capitalize">{mois}</span>
                      <span className="text-gray-900 font-bold">{formatCFA(montant)}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-green-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Récapitulatif */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Receipt size={20} className="text-[var(--color-primary)]" />
          <h2 className="text-lg font-bold text-gray-900">Récapitulatif global</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Paiements reçus', value: stats.nbPaiements.toString(), color: 'text-green-600' },
            { label: 'Dossiers impayés', value: stats.nbImpayes.toString(), color: 'text-red-600' },
            { label: 'Élèves actifs', value: stats.nbEleves.toString(), color: 'text-blue-600' },
            { label: 'Taux recouvrement', value: `${tauxRecouvrement}%`, color: tauxRecouvrement >= 80 ? 'text-green-600' : 'text-orange-500' },
          ].map(item => (
            <div key={item.label} className="text-center p-4 bg-gray-50 rounded-xl">
              <p className={`text-2xl font-black ${item.color}`}>{item.value}</p>
              <p className="text-xs text-gray-500 mt-1 font-medium">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
