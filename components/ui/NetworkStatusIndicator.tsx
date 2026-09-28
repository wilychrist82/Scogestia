'use client'

import { useState, useEffect } from 'react'
import { Wifi, WifiOff } from 'lucide-react'

export function NetworkStatusIndicator() {
  const [isOnline, setIsOnline] = useState<boolean>(true)
  const [showBanner, setShowBanner] = useState<boolean>(false)

  useEffect(() => {
    // Initial check
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine)
    }

    const handleOnline = () => {
      setIsOnline(true)
      setShowBanner(true)
      setTimeout(() => setShowBanner(false), 3500)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowBanner(true)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return (
    <>
      {/* Petit indicateur visuel discret dans le header */}
      <div 
        className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors bg-white/5"
        title={isOnline ? 'Connexion Internet active' : 'Connexion Internet interrompue'}
      >
        <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
        <span className={isOnline ? 'text-slate-500' : 'text-rose-600 font-bold'}>
          {isOnline ? 'En ligne' : 'Hors-ligne'}
        </span>
      </div>

      {/* Bannière d'alerte contextuelle en cas de coupure (contexte Togo / réseau instable) */}
      {!isOnline && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-rose-600 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-3 text-xs font-semibold animate-bounce">
          <WifiOff size={16} />
          <span>Connexion Internet interrompue. Vos saisies locales sont protégées.</span>
        </div>
      )}

      {isOnline && showBanner && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-4 py-2 rounded-xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-in fade-in duration-300">
          <Wifi size={15} />
          <span>Connexion rétablie avec succès.</span>
        </div>
      )}
    </>
  )
}
