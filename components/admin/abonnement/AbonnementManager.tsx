'use client'

import { useState } from 'react'
import { ChariowProduct } from '@/lib/chariow/api'
import { ChariowCheckout } from './ChariowCheckout'
import { CheckCircle2, PackageX, FlaskConical } from 'lucide-react'
import toast from 'react-hot-toast'

type Props = {
  plans: ChariowProduct[]
  testPlan?: ChariowProduct | null
  isOwnerTester?: boolean
}

export function AbonnementManager({ plans, testPlan = null, isOwnerTester = false }: Props) {
  const [selectedPlan, setSelectedPlan] = useState<ChariowProduct | null>(null)

  // S'il n'y a pas de plans retournés par l'API (ex: clé non configurée)
  if (!plans || plans.length === 0) {
    return (
      <div className="bg-[var(--color-surface-container-lowest)] p-8 rounded-xl border border-[var(--color-outline-variant)] text-center shadow-sm">
        <PackageX className="w-10 h-10 text-[var(--color-on-surface-variant)] mb-2 mx-auto" />
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
                toast.error("Le Plan Annuel n'a pas été trouvé dans votre catalogue de produits Chariow. Veuillez le créer dans votre tableau de bord Chariow.")
              }
            }}
            className="w-full py-4 rounded-xl bg-blue-600 font-bold text-white hover:bg-blue-500 transition-colors text-center relative z-10 shadow-md block mt-auto"
          >
            S'abonner au Plan Annuel
          </button>
        </div>

      </div>

      {/* Espace Recette réservé exclusivement aux comptes de test / Propriétaire */}
      {isOwnerTester && (
        <div className="mt-8 max-w-5xl mx-auto rounded-2xl border border-dashed border-amber-300 bg-amber-50/70 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm font-bold text-amber-950">
                  Mode Recette Paiement (Compte test autorisé)
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-200/80 text-amber-900">
                  Invisible pour les autres écoles
                </span>
              </div>
              {testPlan ? (
                <p className="text-xs text-amber-900/90 mt-1">
                  Produit Chariow de test détecté : <strong>{testPlan.name}</strong> ({Number(testPlan.price).toLocaleString('fr-FR')} {testPlan.currency || 'FCFA'}). Valide le paiement réel sur ce compte école pour vérifier le passage de « Essai Gratuit » à « Actif ».
                </p>
              ) : (
                <p className="text-xs text-amber-900/90 mt-1">
                  Crée un produit distinct actif nommé <strong>« Plan Test SCOGESTIA »</strong> à <strong>600 FCFA</strong> dans ton dashboard Chariow (et veille à laisser le Plan Annuel à 80 900 FCFA) — il apparaîtra ici sous 1 minute pour tes comptes de test uniquement.
                </p>
              )}
            </div>
          </div>

          {testPlan && (
            <button
              type="button"
              onClick={() => setSelectedPlan(testPlan)}
              className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm transition-colors shrink-0 cursor-pointer"
            >
              Tester ({Number(testPlan.price).toLocaleString('fr-FR')} {testPlan.currency || 'FCFA'})
            </button>
          )}
        </div>
      )}

      {selectedPlan && (
        <ChariowCheckout
          plan={selectedPlan}
          onClose={() => setSelectedPlan(null)}
        />
      )}
    </>
  )
}
