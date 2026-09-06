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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto pt-4">
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
                   <li className="flex items-start gap-3 text-emerald-50"><CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-amber-400" /> <span>Jusqu'à 400 élèves</span></li>
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
                  <li className="flex items-start gap-3 text-slate-300"><CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-400" /> <span>Jusqu'à 200 élèves</span></li>
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
        {/* Plan Devis / Entreprise */}
        <div className="bg-slate-800 rounded-3xl shadow-2xl border border-slate-700 p-8 flex flex-col relative overflow-hidden md:col-span-2 lg:col-span-1">
           <div className="mb-6 relative z-10">
              <h3 className="text-2xl font-bold text-white mb-2">Grandes Écoles</h3>
              <p className="text-slate-400">Plus de 400 élèves</p>
           </div>
           <div className="mb-6 relative z-10 whitespace-nowrap">
              <span className="text-3xl font-extrabold text-white">Sur Devis</span>
              <span className="text-slate-500 font-medium block mt-1">Abonnement Annuel</span>
           </div>
           <ul className="space-y-4 mb-8 flex-1 relative z-10 text-sm md:text-base">
              <li className="flex items-start gap-3 text-slate-300"><CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-blue-400" /> <span>Nombre d'élèves illimité</span></li>
              <li className="flex items-start gap-3 text-slate-300"><CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-blue-400" /> <span>Toutes les fonctionnalités Pro incluses</span></li>
              <li className="flex items-start gap-3 text-slate-300"><CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-blue-400" /> <span>Déploiement sécurisé sur serveur dédié</span></li>
              <li className="flex items-start gap-3 text-slate-300"><CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-blue-400" /> <span>Personnalisation avancée de l'interface</span></li>
              <li className="flex items-start gap-3 text-slate-300"><CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-blue-400" /> <span>Accès API pour intégration externe</span></li>
              <li className="flex items-start gap-3 text-slate-300"><CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-blue-400" /> <span>Formation continue de l'équipe sur site</span></li>
              <li className="flex items-start gap-3 text-slate-300"><CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-blue-400" /> <span>Support technique dédié (réponse rapide)</span></li>
           </ul>
           <a href="https://wa.me/22892102868" target="_blank" rel="noopener noreferrer" className="w-full py-4 rounded-xl bg-slate-700 font-bold text-white hover:bg-slate-600 transition-colors text-center relative z-10 shadow-md flex items-center justify-center gap-3 mt-auto">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="#25D366" viewBox="0 0 16 16">
                <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/>
              </svg>
              <span>Nous contacter sur WhatsApp</span>
           </a>
        </div>
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
