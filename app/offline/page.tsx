'use client'

import React from 'react'
import Link from 'next/link'
import { WifiOff, RefreshCw, ArrowLeft, ShieldCheck } from 'lucide-react'

export default function OfflinePage() {
  const handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] text-white flex flex-col items-center justify-center p-6 text-center select-none">
      <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-xl shadow-2xl flex flex-col items-center">
        
        {/* Animated Icon badge */}
        <div className="w-20 h-20 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-6 text-amber-400">
          <WifiOff className="w-10 h-10 animate-pulse" />
        </div>

        <span className="px-3 py-1 bg-amber-500/20 text-amber-300 text-xs font-semibold rounded-full border border-amber-500/30 uppercase tracking-wider mb-3">
          Connexion interrompue
        </span>

        <h1 className="text-2xl font-black tracking-tight mb-2">
          Mode Hors-Ligne Actif
        </h1>
        
        <p className="text-sm text-gray-400 mb-8 leading-relaxed">
          Scogestia fonctionne même sans connexion Internet. Vos saisies locales (comme les présences) sont conservées en toute sécurité sur votre appareil et se synchroniseront automatiquement dès le retour du réseau.
        </p>

        {/* Action buttons */}
        <div className="w-full space-y-3">
          <button
            onClick={handleReload}
            className="w-full py-3 px-4 bg-[#005841] hover:bg-[#004532] text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#005841]/20 active:scale-[0.98]"
          >
            <RefreshCw className="w-4 h-4" />
            Réessayer la connexion
          </button>

          <Link
            href="/"
            className="w-full py-3 px-4 bg-white/10 hover:bg-white/15 text-gray-200 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 text-sm border border-white/10"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à l'accueil
          </Link>
        </div>

        <div className="mt-8 pt-6 border-t border-white/10 w-full flex items-center justify-center gap-2 text-xs text-gray-500">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Scogestia SafeSync &bull; Données protégées</span>
        </div>
      </div>
    </div>
  )
}
