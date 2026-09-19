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

  // Dédupliquer : garder UNE SEULE carte par type (Standard et Pro)
  // On prend le premier produit dont le nom contient "standard" et le premier "pro"
  const standardPlan = plans.find(p => p.name?.toLowerCase().includes('standard'))
  const proPlan = plans.find(p => p.name?.toLowerCase().includes('pro'))
  const annuelPlan = plans.find(p => p.name?.toLowerCase().includes('annuel') || p.name?.toLowerCase().includes('annual'))

  // Prix avec fallback
  const standardPrice = standardPlan && standardPlan.price != null && standardPlan.price > 0
    ? Number(standardPlan.price).toLocaleString('fr-FR')
    : '7 000'
  const proPrice = proPlan && proPlan.price != null && proPlan.price > 0
    ? Number(proPlan.price).toLocaleString('fr-FR')
    : '9 900'
  const annuelPrice = annuelPlan && annuelPlan.price != null && annuelPlan.price > 0
    ? Number(annuelPlan.price).toLocaleString('fr-FR')
    : '80 900'

  return (
    <>
      {/* Grille 3 colonnes — toujours alignées au même niveau */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto pt-4 items-stretch">

        {/* ── Carte 1 : Plan Standard ── */}
        {standardPlan && (
          <div className="bg-slate-900 rounded-3xl shadow-2xl border border-slate-700 p-8 flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-amber-400 text-amber-950 text-xs font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">Populaire</div>
            <div className="mb-8 relative z-10">
              <h3 className="text-2xl font-bold text-white mb-2">Plan Standard</h3>
              <p className="text-slate-400">Pour les petites écoles</p>
            </div>
            <div className="mb-8 relative z-10">
              <span className="text-4xl font-extrabold text-white">{standardPrice} FCFA</span>
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
            <button
              onClick={() => setSelectedPlan(standardPlan)}
              className="w-full py-4 rounded-xl bg-emerald-600 font-bold text-white hover:bg-emerald-500 transition-colors text-center relative z-10 shadow-md block mt-auto"
            >
              S'abonner au Plan Standard
            </button>
            {/* Background decoration */}
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-emerald-900 rounded-full blur-3xl opacity-30 pointer-events-none"></div>
          </div>
        )}

        {/* ── Carte 2 : Plan Pro ── */}
        {proPlan && (
          <div className="bg-[#006039] rounded-3xl shadow-2xl p-8 flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-emerald-100 text-[#006039] text-xs font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">Recommandé</div>
            <div className="mb-8 relative z-10">
              <h3 className="text-2xl font-bold text-white mb-2">Plan Pro</h3>
              <p className="text-emerald-100/80">Pour les grands établissements</p>
            </div>
            <div className="mb-8 relative z-10">
              <span className="text-4xl font-extrabold text-white">{proPrice} FCFA</span>
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
            <button
              onClick={() => setSelectedPlan(proPlan)}
              className="w-full py-4 rounded-xl bg-white font-bold text-[#006039] hover:bg-slate-50 transition-colors text-center relative z-10 shadow-lg block mt-auto"
            >
              S'abonner au Plan Pro
            </button>
            {/* Background decoration */}
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-emerald-600 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
            <div className="absolute -top-20 -left-20 w-40 h-40 bg-emerald-500 rounded-full blur-3xl opacity-40 pointer-events-none"></div>
          </div>
        )}

        {/* ── Carte 3 : Plan Annuel ── */}
        <div className="bg-slate-800 rounded-3xl shadow-2xl border border-slate-700 p-8 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-slate-600 text-white text-xs font-bold px-4 py-1.5 rounded-bl-xl z-20 uppercase tracking-wider">
            Annuel
          </div>
          <div className="mb-8 relative z-10">
            <h3 className="text-2xl font-bold text-white mb-2">Plan Annuel</h3>
            <p className="text-slate-400">Pour une tranquillité totale</p>
          </div>
          <div className="mb-8 relative z-10">
            <span className="text-4xl font-extrabold text-white">{annuelPrice} FCFA</span>
            <span className="text-slate-500 font-medium"> / an</span>
          </div>
          <ul className="space-y-4 mb-10 flex-1 relative z-10 text-sm md:text-base">
            <li className="flex items-start gap-3 text-slate-300"><CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-blue-400" /> <span className="font-medium">Nombre d'élèves illimité</span></li>
            <li className="flex items-start gap-3 text-slate-300"><CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-blue-400" /> <span>Toutes les fonctionnalités Pro incluses</span></li>
            <li className="flex items-start gap-3 text-slate-300"><CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-blue-400" /> <span>Déploiement sécurisé sur serveur dédié</span></li>
            <li className="flex items-start gap-3 text-slate-300"><CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-blue-400" /> <span>Personnalisation avancée de l'interface</span></li>
            <li className="flex items-start gap-3 text-slate-300"><CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-blue-400" /> <span>Support technique prioritaire 24/7</span></li>
          </ul>
          <button
            onClick={() => {
              if (annuelPlan) {
                setSelectedPlan(annuelPlan)
              } else {
                alert("Le Plan Annuel n'a pas été trouvé dans votre catalogue de produits Chariow. Veuillez le créer dans votre tableau de bord Chariow.")
              }
            }}
            className="w-full py-4 rounded-xl bg-blue-600 font-bold text-white hover:bg-blue-500 transition-colors text-center relative z-10 shadow-md block mt-auto"
          >
            S'abonner au Plan Annuel
          </button>
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
