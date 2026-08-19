'use client'

import { EmptyState } from '@/components/ui/EmptyState'
import { FileBarChart } from 'lucide-react'

export default function RapportsFinancePage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rapports Financiers</h1>
          <p className="text-gray-500">Consultez les bilans, les encaissements et les statistiques financières.</p>
        </div>
      </div>
      <EmptyState 
        title="Rapports non disponibles"
        description="Aucune donnée financière n'est encore suffisante pour générer un rapport complet."
        icon={FileBarChart}
        actionLabel="Générer un rapport estimatif"
        onAction={() => alert('Génération en cours...')}
      />
    </div>
  )
}
