'use client'

import Link from 'next/link'
import { Lock, Sparkles, CheckCircle2, ShieldAlert, LogOut, ArrowRight } from 'lucide-react'
import { logout } from '@/app/actions/auth'

type Props = {
  schoolName?: string
  daysRemaining?: number
}

export function PaywallOverlay({ schoolName, daysRemaining = 0 }: Props) {
  const isTrialFinished = daysRemaining <= 0

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
      <div className="w-full max-w-3xl bg-[var(--color-surface-container-lowest)] rounded-3xl border border-red-200/60 dark:border-red-900/40 shadow-2xl p-6 sm:p-10 relative overflow-hidden">
        {/* Glow de fond */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-red-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />

        <div className="relative z-10 text-center max-w-xl mx-auto mb-8">
          {/* Badge Icon */}
          <div className="w-20 h-20 mx-auto rounded-3xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-center justify-center text-red-600 shadow-inner mb-6">
            <ShieldAlert size={38} strokeWidth={2.2} />
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 text-xs font-bold uppercase tracking-wider mb-3">
            <Lock size={13} />
            <span>Accès suspendu • Abonnement requis</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-on-surface)] tracking-tight mb-3">
            {isTrialFinished
              ? "Votre période d'essai gratuit est terminée"
              : "Abonnement expiré"}
          </h2>

          <p className="text-sm sm:text-base text-[var(--color-on-surface-variant)] leading-relaxed">
            {schoolName ? <strong className="text-[var(--color-on-surface)]">{schoolName}</strong> : "Votre établissement"} doit 
            activer ou renouveler son abonnement pour débloquer l'accès à la plateforme (élèves, notes, bulletins, caisse et rapports).
          </p>

          <div className="mt-4 p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 text-xs text-emerald-800 dark:text-emerald-300 font-medium">
            🔒 <strong>Vos données sont protégées :</strong> Tous vos élèves, inscriptions et notes déjà saisis restent sauvegardés et seront immédiatement réactivés dès votre paiement.
          </div>
        </div>

        {/* Comparatif rapide des 2 plans */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* Plan Standard */}
          <div className="p-5 rounded-2xl border border-[var(--color-outline-variant)] bg-[var(--color-surface)] hover:border-slate-400 transition-colors flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm text-[var(--color-on-surface)]">Plan Standard</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 font-semibold text-[var(--color-on-surface-variant)]">Petites écoles</span>
              </div>
              <div className="text-xl font-black text-[var(--color-on-surface)] mb-3">
                7 000 <span className="text-xs font-semibold text-[var(--color-on-surface-variant)]">FCFA / mois</span>
              </div>
              <ul className="space-y-2 text-xs text-[var(--color-on-surface-variant)]">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                  <span>Jusqu'à <strong>200 élèves</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                  <span>Gestion des notes & bulletins</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                  <span>Caisse & reçus automatiques</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Plan Pro */}
          <div className="p-5 rounded-2xl border-2 border-emerald-500/70 bg-emerald-50/20 dark:bg-emerald-950/20 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-2 right-2 text-[10px] font-bold uppercase tracking-wider bg-emerald-600 text-white px-2 py-0.5 rounded-full">
              Recommandé
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Sparkles size={14} className="text-amber-500" />
                <span className="font-bold text-sm text-[var(--color-on-surface)]">Plan Pro</span>
              </div>
              <div className="text-xl font-black text-emerald-700 dark:text-emerald-400 mb-3">
                9 900 <span className="text-xs font-semibold text-[var(--color-on-surface-variant)]">FCFA / mois</span>
              </div>
              <ul className="space-y-2 text-xs text-[var(--color-on-surface-variant)]">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                  <span>Jusqu'à <strong>400 élèves</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                  <span>Gestion multi-campus & RH / Paie</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                  <span>Support prioritaire WhatsApp 24/7</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/admin/abonnement"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg hover:shadow-emerald-600/20 hover:-translate-y-0.5 transition-all"
          >
            <span>Choisir un plan & Réactiver mon accès</span>
            <ArrowRight size={18} />
          </Link>

          <button
            onClick={() => logout()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-outline-variant)] hover:bg-[var(--color-surface-container-highest)] text-[var(--color-on-surface-variant)] font-semibold text-sm transition-colors"
          >
            <LogOut size={16} />
            <span>Se déconnecter</span>
          </button>
        </div>
      </div>
    </div>
  )
}
