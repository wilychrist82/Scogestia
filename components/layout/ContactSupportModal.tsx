'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, CheckCircle2, MessageSquare } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { sendSupportMessage } from '@/app/actions/support'

export type ContactSupportModalProps = {
  isOpen: boolean
  onClose: () => void
  defaultUserEmail?: string
}

export function ContactSupportModal({ isOpen, onClose, defaultUserEmail = '' }: ContactSupportModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('contact@scogestia.com')
    setCopied(true)
    toast.success('Adresse email copiée (contact@scogestia.com) !')
    setTimeout(() => setCopied(false), 2500)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    const formData = new FormData(e.currentTarget)
    // Add default target email from the user request context
    formData.append('targetEmail', 'wilfried2025@gmail.com')

    const result = await sendSupportMessage(formData)
    
    setIsSubmitting(false)
    
    if (result.error) {
      toast.error(result.error)
      return
    }

    setIsSuccess(true)
    toast.success('Message envoyé avec succès !')
    
    setTimeout(() => {
      setIsSuccess(false)
      onClose()
    }, 2000)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-[9998]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-2xl z-[9999] overflow-hidden"
          >
            {/* Header */}
            <div className="bg-[var(--color-primary)] p-5 text-white relative">
              <button 
                type="button"
                onClick={onClose}
                className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
                aria-label="Fermer"
              >
                <X size={20} />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MessageSquare size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Contacter le support</h3>
                  <p className="text-white/80 text-xs">Notre équipe vous répondra dans les plus brefs délais.</p>
                </div>
              </div>
            </div>

            {/* Quick action bar */}
            <div className="bg-slate-50 border-b border-slate-100 px-4 py-2.5 flex items-center justify-between text-xs text-slate-600">
              <span className="font-medium text-slate-500">contact@scogestia.com</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className="px-2.5 py-1 bg-white border border-slate-200 hover:border-emerald-500 hover:text-emerald-600 rounded-lg text-[11px] font-semibold transition-all shadow-sm"
                >
                  {copied ? '✓ Copié' : 'Copier l\'email'}
                </button>
                <a
                  href="https://mail.google.com/mail/?view=cm&fs=1&to=contact@scogestia.com&su=Support%20Scogestia"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 bg-white border border-slate-200 hover:border-emerald-500 hover:text-emerald-600 rounded-lg text-[11px] font-semibold transition-all shadow-sm"
                >
                  Gmail Web ↗
                </a>
              </div>
            </div>

            {/* Body */}
            <div className="p-5">
              {isSuccess ? (
                <div className="py-8 flex flex-col items-center justify-center text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 15 }}
                  >
                    <CheckCircle2 size={56} className="text-emerald-500 mb-3" />
                  </motion.div>
                  <h4 className="text-base font-bold text-gray-900 mb-1">Message envoyé !</h4>
                  <p className="text-gray-500 text-xs">Nous avons bien reçu votre demande et reviendrons vers vous très vite.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3.5">
                  <div>
                    <label htmlFor="userEmail" className="block text-xs font-semibold text-gray-700 mb-1">Votre email de réponse</label>
                    <input 
                      id="userEmail"
                      name="userEmail"
                      type="email"
                      required
                      defaultValue={defaultUserEmail}
                      placeholder="ex: vous@ecole.com"
                      className="w-full border border-gray-200 rounded-lg px-3.5 py-2 text-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label htmlFor="subject" className="block text-xs font-semibold text-gray-700 mb-1">Sujet</label>
                    <select 
                      id="subject" 
                      name="subject"
                      required
                      defaultValue=""
                      className="w-full border border-gray-200 rounded-lg px-3.5 py-2 text-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none transition-all"
                    >
                      <option value="" disabled>Sélectionnez un sujet...</option>
                      <option value="bug">Signaler un bug</option>
                      <option value="feature">Suggérer une fonctionnalité</option>
                      <option value="billing">Question sur la facturation</option>
                      <option value="other">Autre demande</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="message" className="block text-xs font-semibold text-gray-700 mb-1">Message</label>
                    <textarea 
                      id="message"
                      name="message" 
                      rows={4} 
                      required
                      placeholder="Décrivez votre demande en détail..."
                      className="w-full border border-gray-200 rounded-lg px-3.5 py-2 text-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none transition-all resize-none"
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full bg-[var(--color-primary)] text-white font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 hover:bg-[#044d38] transition-colors disabled:opacity-70 text-sm shadow-sm cursor-pointer"
                  >
                    {isSubmitting ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send size={16} />
                        Envoyer le message
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
