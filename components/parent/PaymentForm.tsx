'use client'

import Link from 'next/link'
import { ArrowLeft, Building2, FileText, ShieldCheck, Wallet } from 'lucide-react'

type Props = {
  dueId?: string
  label?: string
  amount?: number
}

export function PaymentForm({ label = 'Tranche de scolarité', amount = 0 }: Props) {
  return (
    <div className="flex-1 flex flex-col gap-6 md:p-8">
      {/* Récapitulatif de la tranche */}
      <section className="bg-white border border-slate-200/80 rounded-2xl p-5 md:p-6 shadow-sm">
        <div className="flex items-center justify-between gap-2 mb-2">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Récapitulatif de l&apos;échéance
          </h2>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            Règlement au guichet
          </span>
        </div>
        <div className="flex justify-between items-baseline gap-4 mt-1">
          <p className="text-lg md:text-xl text-slate-900 font-bold">{label}</p>
          <div className="text-right flex items-baseline gap-1.5 shrink-0">
            <p className="text-2xl md:text-3xl text-slate-900 font-extrabold tabular-nums">
              {Number(amount).toLocaleString('fr-FR')}
            </p>
            <p className="text-xs text-slate-500 font-semibold">FCFA</p>
          </div>
        </div>
      </section>

      {/* Carte d'information Paiement Main à Main */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        <div className="bg-[#0B0F19] text-white p-5 md:p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 block">
                  Modalité de paiement actuelle
                </span>
                <h3 className="font-bold text-base md:text-lg text-white">
                  Paiement à la caisse de l&apos;école (Main à main)
                </h3>
              </div>
            </div>
          </div>
          <p className="text-slate-300 text-xs md:text-sm mt-3 leading-relaxed">
            Les règlements de frais de scolarité s&apos;effectuent directement auprès du secrétariat ou de la comptabilité de l&apos;établissement.
          </p>
        </div>

        <div className="p-5 md:p-6 space-y-4">
          <div className="space-y-3 text-xs md:text-sm text-slate-600">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                <Wallet className="w-4 h-4" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">1. Règlement au guichet</p>
                <p className="text-slate-600 mt-0.5">
                  Effectuez votre versement (espèces, chèque ou reçu de dépôt) directement à la caisse de l&apos;école.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">2. Reçu officiel numérique instantané</p>
                <p className="text-slate-600 mt-0.5">
                  Dès l&apos;enregistrement par le comptable, votre reçu officiel PDF est disponible et téléchargeable dans votre espace Parent.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">3. Suivi en temps réel</p>
                <p className="text-slate-600 mt-0.5">
                  Votre solde restant et l&apos;historique des paiements sont automatiquement mis à jour avec notification.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <Link
              href="/parent/paiements"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour à l&apos;échéancier & aux reçus
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default PaymentForm
