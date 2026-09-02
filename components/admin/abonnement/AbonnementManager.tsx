'use client'

import { useState } from 'react'
import { ChariowProduct } from '@/lib/chariow/api'
import { ChariowCheckout } from './ChariowCheckout'
import { CheckCircle2 } from 'lucide-react'

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

  // Triez les plans pour mettre le Standard en premier
  const sortedPlans = [...plans].sort((a, b) => {
    const aName = a.name?.toLowerCase() || ''
    const bName = b.name?.toLowerCase() || ''
    if (aName.includes('standard') && !bName.includes('standard')) return -1
    if (!aName.includes('standard') && bName.includes('standard')) return 1
    return 0
  })

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto pt-4">
        {sortedPlans.map((plan) => {
          const isPro = plan.name?.toLowerCase().includes('pro')
          const price = plan.price != null && plan.price > 0 ? Number(plan.price).toLocaleString('fr-FR') : (isPro ? '9 900' : '7 000')

          if (isPro) {
            return (
              <div key={plan.id} className="bg-[#006039] rounded-3xl shadow-2xl p-8 flex flex-col relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-emerald-100 text-[#006039] text-xs font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">Recommandé</div>
                <div className="mb-8 relative z-10">
                   <h3 className="text-2xl font-bold text-white mb-2">Plan Pro</h3>
                   <p className="text-emerald-100/80">Pour les grands établissements</p>
                </div>
                <div className="mb-8 relative z-10 whitespace-nowrap">
                   <span className="text-4xl font-extrabold text-white">{price} FCFA</span>
                   <span className="text-emerald-200 font-medium"> / mois</span>
                </div>
                <ul className="space-y-4 mb-10 flex-1 relative z-10 text-sm md:text-base">
                   <li className="flex items-start gap-3 text-emerald-50"><CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-amber-400" /> <span>Élèves et classes illimités</span></li>
                   <li className="flex items-start gap-3 text-emerald-50"><CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-amber-400" /> <span>Toutes les fonctionnalités Standard</span></li>
                   <li className="flex items-start gap-3 text-emerald-50"><CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-amber-400" /> <span>Gestion multi-campus / multi-sites</span></li>
                   <li className="flex items-start gap-3 text-emerald-50"><CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-amber-400" /> <span>Gestion des Ressources Humaines (Paie)</span></li>
                   <li className="flex items-start gap-3 text-emerald-50"><CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-amber-400" /> <span>Envoi de SMS et Emails aux parents</span></li>
                   <li className="flex items-start gap-3 text-emerald-50"><CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-amber-400" /> <span>Tableaux de bord et analytics poussés</span></li>
                   <li className="flex items-start gap-3 text-emerald-50"><CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-amber-400" /> <span>Accompagnement et formation de l'équipe</span></li>
                   <li className="flex items-start gap-3 text-emerald-50"><CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-amber-400" /> <span>Support prioritaire 24/7 (WhatsApp/Appel)</span></li>
                </ul>
                <button onClick={() => setSelectedPlan(plan)} className="w-full py-4 rounded-xl bg-white font-bold text-[#006039] hover:bg-slate-50 transition-colors text-center relative z-10 shadow-lg block mt-auto">
                   S'abonner au Plan Pro
                </button>
                {/* Background decoration */}
                <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-emerald-600 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
                <div className="absolute -top-20 -left-20 w-40 h-40 bg-emerald-500 rounded-full blur-3xl opacity-40 pointer-events-none"></div>
              </div>
            )
          }

          // Plan Standard
          return (
            <div key={plan.id} className="bg-slate-900 rounded-3xl shadow-2xl border border-slate-700 p-8 flex flex-col relative overflow-hidden">
               <div className="absolute top-0 right-0 bg-amber-400 text-amber-950 text-xs font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">Populaire</div>
               <div className="mb-8 relative z-10">
                  <h3 className="text-2xl font-bold text-white mb-2">Plan Standard</h3>
                  <p className="text-slate-400">Pour les petites écoles</p>
               </div>
               <div className="mb-8 relative z-10 whitespace-nowrap">
                  <span className="text-4xl font-extrabold text-white">{price} FCFA</span>
                  <span className="text-slate-500 font-medium"> / mois</span>
               </div>
               <ul className="space-y-4 mb-10 flex-1 relative z-10 text-sm md:text-base">
                  <li className="flex items-start gap-3 text-slate-300"><CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-400" /> <span>Jusqu'à 500 élèves</span></li>
                  <li className="flex items-start gap-3 text-slate-300"><CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-400" /> <span>Gestion des inscriptions et classes</span></li>
                  <li className="flex items-start gap-3 text-slate-300"><CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-400" /> <span>Suivi de la comptabilité et paiements</span></li>
                  <li className="flex items-start gap-3 text-slate-300"><CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-400" /> <span>Génération des reçus automatisée</span></li>
                  <li className="flex items-start gap-3 text-slate-300"><CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-400" /> <span>Saisie des notes et bulletins scolaires</span></li>
                  <li className="flex items-start gap-3 text-slate-300"><CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-400" /> <span>Portail Parents (Notes & Absences)</span></li>
                  <li className="flex items-start gap-3 text-slate-300"><CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-400" /> <span>Support client par chat / email</span></li>
               </ul>
               <button onClick={() => setSelectedPlan(plan)} className="w-full py-4 rounded-xl bg-emerald-600 font-bold text-white hover:bg-emerald-500 transition-colors text-center relative z-10 shadow-md block mt-auto">
                  S'abonner au Plan Standard
               </button>
               {/* Background decoration */}
               <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-emerald-900 rounded-full blur-3xl opacity-30 pointer-events-none"></div>
            </div>
          )
        })}
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
