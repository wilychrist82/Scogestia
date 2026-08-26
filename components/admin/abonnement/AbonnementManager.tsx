'use client'

import { useState } from 'react'
import { ChariowProduct } from '@/lib/chariow/api'
import { ChariowCheckout } from './ChariowCheckout'

type Props = {
  plans: ChariowProduct[]
}

export function AbonnementManager({ plans }: Props) {
  const [selectedPlan, setSelectedPlan] = useState<ChariowProduct | null>(null)

  // S'il n'y a pas de plans retournés par l'API (ex: clé non configurée)
  if (!plans || plans.length === 0) {
    return (
      <div className="bg-[var(--color-surface-container-lowest)] p-8 rounded-xl border border-[var(--color-outline-variant)] text-center shadow-sm">
        <span className="material-symbols-outlined text-4xl text-[var(--color-on-surface-variant)] mb-2">production_quantity_limits</span>
        <p className="text-[var(--color-on-surface-variant)]">Aucun plan d'abonnement disponible pour le moment.</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {plans.map((plan) => (
          <div key={plan.id} className="bg-[var(--color-surface-container-lowest)] rounded-2xl border-2 border-[var(--color-outline-variant)] p-8 shadow-sm hover:shadow-md transition-shadow flex flex-col relative overflow-hidden">
            {plan.name.toLowerCase().includes('pro') && (
              <div className="absolute top-0 right-0 bg-[var(--color-primary)] text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                RECOMMANDÉ
              </div>
            )}
            <h4 className="text-xl font-bold text-[var(--color-on-surface)] mb-2">{plan.name}</h4>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-4xl font-black text-[var(--color-primary)]">{plan.price.toLocaleString('fr-FR')}</span>
              <span className="text-sm font-semibold text-[var(--color-on-surface-variant)]">{plan.currency} / mois</span>
            </div>
            
            <ul className="space-y-3 mb-8 flex-1">
              <li className="flex items-start gap-2 text-sm text-[var(--color-on-surface)]">
                <span className="material-symbols-outlined text-[var(--color-primary)] text-[20px]">check_circle</span>
                Gestion illimitée des élèves et classes
              </li>
              <li className="flex items-start gap-2 text-sm text-[var(--color-on-surface)]">
                <span className="material-symbols-outlined text-[var(--color-primary)] text-[20px]">check_circle</span>
                Bulletins et notes centralisés
              </li>
              <li className="flex items-start gap-2 text-sm text-[var(--color-on-surface)]">
                <span className="material-symbols-outlined text-[var(--color-primary)] text-[20px]">check_circle</span>
                Suivi financier basique
              </li>
              {plan.name.toLowerCase().includes('pro') && (
                <>
                  <li className="flex items-start gap-2 text-sm text-[var(--color-on-surface)]">
                    <span className="material-symbols-outlined text-[var(--color-primary)] text-[20px]">check_circle</span>
                    Notifications SMS incluses
                  </li>
                  <li className="flex items-start gap-2 text-sm text-[var(--color-on-surface)]">
                    <span className="material-symbols-outlined text-[var(--color-primary)] text-[20px]">check_circle</span>
                    Support prioritaire 7j/7
                  </li>
                </>
              )}
            </ul>

            <button 
              onClick={() => setSelectedPlan(plan)}
              className={`w-full py-3 rounded-xl font-bold transition-colors ${
                plan.name.toLowerCase().includes('pro') 
                  ? 'bg-[var(--color-primary)] text-white hover:opacity-90'
                  : 'bg-[var(--color-surface-bright)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white border border-[var(--color-primary)]'
              }`}
            >
              Souscrire à ce plan
            </button>
          </div>
        ))}
      </div>

      {selectedPlan && (
        <ChariowCheckout 
          plan={selectedPlan} 
          onClose={() => setSelectedPlan(null)} 
        />
      )}
    </>
  )
}
