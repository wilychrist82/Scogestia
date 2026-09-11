'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, ExternalLink, HelpCircle, Headphones } from 'lucide-react'

declare global {
  interface Window {
    Tawk_API?: {
      toggle?: () => void
      maximize?: () => void
      minimize?: () => void
      hideWidget?: () => void
      showWidget?: () => void
    }
    Tawk_LoadStart?: Date
  }
}

interface SupportWidgetProps {
  /** ID du widget Tawk.to. Si absent, affiche un fallback élégant. */
  tawkPropertyId?: string
  tawkWidgetId?: string
  userFullName?: string
  userEmail?: string
}

export function SupportWidget({
  tawkPropertyId,
  tawkWidgetId,
  userFullName,
  userEmail,
}: SupportWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [tawkLoaded, setTawkLoaded] = useState(false)
  const [pulse, setPulse] = useState(true)

  // Arrêter le pulse après 8 secondes
  useEffect(() => {
    const t = setTimeout(() => setPulse(false), 8000)
    return () => clearTimeout(t)
  }, [])

  // Charger Tawk.to si configuré
  useEffect(() => {
    if (!tawkPropertyId || !tawkWidgetId || typeof window === 'undefined') return

    window.Tawk_API = window.Tawk_API || {}
    window.Tawk_LoadStart = new Date()

    const script = document.createElement('script')
    script.async = true
    script.src = `https://embed.tawk.to/${tawkPropertyId}/${tawkWidgetId}`
    script.charset = 'UTF-8'
    script.setAttribute('crossorigin', '*')
    script.onload = () => {
      setTawkLoaded(true)
      // Cacher le widget natif de Tawk (on utilise notre propre bouton)
      window.Tawk_API?.hideWidget?.()
    }
    document.head.appendChild(script)

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script)
      }
    }
  }, [tawkPropertyId, tawkWidgetId])

  const handleToggle = () => {
    if (tawkLoaded && window.Tawk_API?.toggle) {
      window.Tawk_API.toggle()
    } else {
      setIsOpen(v => !v)
    }
  }

  const faqs = [
    { q: 'Comment ajouter un élève ?', href: '/admin/eleves' },
    { q: 'Générer un bulletin de notes', href: '/admin/academique/bulletins' },
    { q: 'Gérer les paiements', href: '/admin/finance' },
    { q: 'Paramètres de l\'école', href: '/admin/parametres' },
  ]

  return (
    <div className="fixed bottom-6 right-6 z-[8000] flex flex-col items-end gap-3">
      {/* Panel d'aide (si Tawk pas configuré ou pas encore chargé) */}
      <AnimatePresence>
        {isOpen && !tawkLoaded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 12 }}
            transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
            className="origin-bottom-right"
          >
            {/* Outer bezel */}
            <div
              className="rounded-2xl p-0.5 shadow-2xl"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.04))',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
              }}
            >
              {/* Inner card */}
              <div
                className="w-72 rounded-[calc(1rem-2px)] overflow-hidden"
                style={{ background: 'linear-gradient(160deg, #0f1823 0%, #0b0f19 100%)' }}
              >
                {/* Header */}
                <div
                  className="px-4 py-4 flex items-center justify-between"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ background: 'rgba(5,150,105,0.2)', border: '1px solid rgba(5,150,105,0.3)' }}
                    >
                      <Headphones className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-white text-xs font-bold">Support Scogestia</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-emerald-400 text-[10px] font-medium">En ligne</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="w-6 h-6 rounded-full flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 transition-all duration-200"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Body */}
                <div className="p-4">
                  <p className="text-slate-400 text-xs mb-3 leading-relaxed">
                    {userFullName ? `Bonjour ${userFullName.split(' ')[0]} 👋 —` : 'Bonjour 👋 —'}{' '}
                    Comment pouvons-nous vous aider ?
                  </p>

                  {/* FAQ rapide */}
                  <div className="space-y-1.5 mb-4">
                    {faqs.map((faq) => (
                      <a
                        key={faq.href}
                        href={faq.href}
                        className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-white transition-all duration-200 group"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                      >
                        <span>{faq.q}</span>
                        <ExternalLink className="w-3 h-3 text-slate-600 group-hover:text-emerald-400 transition-colors flex-shrink-0" />
                      </a>
                    ))}
                  </div>

                  {/* Contact email */}
                  <a
                    href="mailto:support@scogestia.com"
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-full text-xs font-bold text-white transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                    style={{
                      background: 'linear-gradient(135deg, #059669 0%, #065F46 100%)',
                      boxShadow: '0 4px 20px rgba(5,150,105,0.35)',
                    }}
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    Nous écrire par email
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB Button */}
      <div className="relative">
        {/* Pulse ring */}
        {pulse && (
          <span
            className="absolute inset-0 rounded-full animate-ping"
            style={{ background: 'rgba(5,150,105,0.3)' }}
          />
        )}

        <motion.button
          onClick={handleToggle}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.93 }}
          transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
          className="relative w-14 h-14 rounded-full flex items-center justify-center text-white shadow-2xl"
          style={{
            background: 'linear-gradient(135deg, #059669 0%, #065F46 100%)',
            boxShadow: '0 8px 32px rgba(5,150,105,0.45)',
          }}
          aria-label="Ouvrir le support"
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.span
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <X className="w-5 h-5" />
              </motion.span>
            ) : (
              <motion.span
                key="open"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <HelpCircle className="w-5 h-5" />
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </div>
  )
}
