'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Cookie, X, Shield, ChevronDown, ChevronUp } from 'lucide-react'

const COOKIE_KEY = 'scogestia_cookie_consent'

type ConsentState = 'accepted' | 'refused' | 'custom' | null

interface CookiePrefs {
  essential: boolean
  analytics: boolean
  marketing: boolean
}

export function CookieBanner() {
  const [consent, setConsent] = useState<ConsentState>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [prefs, setPrefs] = useState<CookiePrefs>({
    essential: true, // toujours activé
    analytics: false,
    marketing: false,
  })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem(COOKIE_KEY)
    if (saved) {
      setConsent(JSON.parse(saved).consent)
    }
  }, [])

  const save = (state: ConsentState, customPrefs?: CookiePrefs) => {
    localStorage.setItem(COOKIE_KEY, JSON.stringify({
      consent: state,
      prefs: customPrefs || prefs,
      timestamp: Date.now(),
    }))
    setConsent(state)
  }

  const acceptAll = () => {
    save('accepted', { essential: true, analytics: true, marketing: true })
  }

  const refuseAll = () => {
    save('refused', { essential: true, analytics: false, marketing: false })
  }

  const saveCustom = () => {
    save('custom', prefs)
  }

  if (!mounted || consent !== null) return null

  return (
    <AnimatePresence>
      <motion.div
        key="cookie-banner"
        initial={{ y: 120, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 120, opacity: 0 }}
        transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
        className="fixed bottom-0 left-0 right-0 z-[9000] p-4 md:p-6 pointer-events-none"
      >
        <div className="max-w-4xl mx-auto pointer-events-auto">
          {/* Outer bezel */}
          <div className="rounded-2xl bg-white/10 ring-1 ring-white/20 p-1 shadow-2xl backdrop-blur-2xl"
            style={{ backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)' }}
          >
            {/* Inner card */}
            <div
              className="rounded-[calc(1rem-2px)] overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #0b0f19 0%, #0f1823 100%)',
                boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.08)',
              }}
            >
              {/* Main content */}
              <div className="p-5 md:p-6">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(5,150,105,0.15)', border: '1px solid rgba(5,150,105,0.3)' }}
                  >
                    <Cookie className="w-5 h-5 text-emerald-400" />
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] uppercase tracking-[0.2em] font-medium text-emerald-400 px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(5,150,105,0.15)', border: '1px solid rgba(5,150,105,0.2)' }}
                      >
                        Confidentialité
                      </span>
                    </div>
                    <h3 className="text-white font-semibold text-sm md:text-base leading-snug">
                      Nous respectons votre vie privée
                    </h3>
                    <p className="text-slate-400 text-xs md:text-sm mt-1 leading-relaxed">
                      Scogestia utilise des cookies pour améliorer votre expérience. Les cookies essentiels sont nécessaires au fonctionnement de la plateforme.{' '}
                      <a href="/confidentialite" className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2 transition-colors">
                        Politique de confidentialité
                      </a>
                    </p>

                    {/* Expandable details */}
                    <AnimatePresence>
                      {showDetails && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
                          className="overflow-hidden"
                        >
                          <div className="mt-4 space-y-3 border-t border-white/10 pt-4">
                            {/* Essential */}
                            <CookieToggle
                              label="Cookies essentiels"
                              description="Authentification, session, sécurité. Ne peuvent pas être désactivés."
                              checked={true}
                              disabled={true}
                              onChange={() => {}}
                            />
                            {/* Analytics */}
                            <CookieToggle
                              label="Cookies analytiques"
                              description="Mesure d'audience anonymisée pour améliorer Scogestia."
                              checked={prefs.analytics}
                              disabled={false}
                              onChange={(v) => setPrefs(p => ({ ...p, analytics: v }))}
                            />
                            {/* Marketing */}
                            <CookieToggle
                              label="Cookies marketing"
                              description="Personnalisation des communications et offres commerciales."
                              checked={prefs.marketing}
                              disabled={false}
                              onChange={(v) => setPrefs(p => ({ ...p, marketing: v }))}
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div
                className="px-5 md:px-6 pb-5 md:pb-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3"
                style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
              >
                {/* Personnaliser */}
                <button
                  onClick={() => setShowDetails(v => !v)}
                  className="flex items-center justify-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors duration-200 px-3 py-2 rounded-xl hover:bg-white/5"
                >
                  {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  Personnaliser
                </button>

                <div className="flex-1" />

                {/* Refuser */}
                <button
                  onClick={refuseAll}
                  className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white rounded-full transition-all duration-300 hover:bg-white/10"
                  style={{ border: '1px solid rgba(255,255,255,0.15)' }}
                >
                  Refuser
                </button>

                {/* Enregistrer si personnalisé */}
                {showDetails && (
                  <button
                    onClick={saveCustom}
                    className="px-4 py-2 text-xs font-semibold rounded-full transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                    style={{
                      background: 'rgba(5,150,105,0.2)',
                      border: '1px solid rgba(5,150,105,0.5)',
                      color: '#34d399',
                    }}
                  >
                    Enregistrer mes choix
                  </button>
                )}

                {/* Accepter tout */}
                <button
                  onClick={acceptAll}
                  className="group flex items-center gap-2 px-5 py-2 text-xs font-bold text-white rounded-full transition-all duration-300 hover:scale-[1.03] active:scale-[0.97]"
                  style={{
                    background: 'linear-gradient(135deg, #059669 0%, #065F46 100%)',
                    boxShadow: '0 4px 24px rgba(5,150,105,0.35)',
                  }}
                >
                  <Shield className="w-3.5 h-3.5" />
                  Accepter tout
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:translate-x-0.5"
                    style={{ background: 'rgba(255,255,255,0.15)' }}
                  >
                    <span className="text-[8px]">✓</span>
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

// ──────────────────────────────────────────
function CookieToggle({
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  disabled: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-start gap-3">
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`relative flex-shrink-0 mt-0.5 w-10 h-5 rounded-full transition-all duration-300 ${
          disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
        }`}
        style={{
          background: checked
            ? 'linear-gradient(135deg, #059669, #065F46)'
            : 'rgba(255,255,255,0.1)',
          boxShadow: checked ? '0 0 8px rgba(5,150,105,0.4)' : 'none',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <span
          className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-300"
          style={{ transform: checked ? 'translateX(20px)' : 'translateX(2px)' }}
        />
      </button>
      <div>
        <p className="text-xs font-semibold text-white">{label}</p>
        <p className="text-xs text-slate-500 mt-0.5">{description}</p>
      </div>
    </div>
  )
}
