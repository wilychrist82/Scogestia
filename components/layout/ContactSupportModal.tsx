'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, CheckCircle2, MessageSquare } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { sendSupportMessage } from '@/app/actions/support'

export type ContactSupportModalProps = {
  isOpen: boolean
  onClose: () => void
}

export function ContactSupportModal({ isOpen, onClose }: ContactSupportModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-2xl z-[101] overflow-hidden"
          >
            {/* Header */}
            <div className="bg-[var(--color-sidebar-bg)] p-6 text-white relative">
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-4">
                <MessageSquare size={24} className="text-white" />
              </div>
              <h3 className="text-xl font-bold mb-1">Contacter le support</h3>
              <p className="text-white/70 text-sm">Notre équipe vous répondra dans les plus brefs délais.</p>
            </div>

            {/* Body */}
            <div className="p-6">
              {isSuccess ? (
                <div className="py-8 flex flex-col items-center justify-center text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 15 }}
                  >
                    <CheckCircle2 size={64} className="text-green-500 mb-4" />
                  </motion.div>
                  <h4 className="text-lg font-bold text-gray-900 mb-2">Message envoyé !</h4>
                  <p className="text-gray-500 text-sm">Nous avons bien reçu votre demande et reviendrons vers vous très vite.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="userEmail" className="block text-sm font-medium text-gray-700 mb-1">Votre email de réponse</label>
                    <input 
                      id="userEmail"
                      name="userEmail"
                      type="email"
                      required
                      placeholder="ex: vous@ecole.com"
                      className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[var(--color-sidebar-bg)] focus:border-transparent outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">Sujet</label>
                    <select 
                      id="subject" 
                      name="subject"
                      required
                      className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[var(--color-sidebar-bg)] focus:border-transparent outline-none transition-all"
                    >
                      <option value="">Sélectionnez un sujet...</option>
                      <option value="bug">Signaler un bug</option>
                      <option value="feature">Suggérer une fonctionnalité</option>
                      <option value="billing">Question sur la facturation</option>
                      <option value="other">Autre</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                    <textarea 
                      id="message"
                      name="message" 
                      rows={4} 
                      required
                      placeholder="Décrivez votre problème en détail..."
                      className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[var(--color-sidebar-bg)] focus:border-transparent outline-none transition-all resize-none"
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full bg-[var(--color-sidebar-bg)] text-white font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 hover:bg-[var(--color-sidebar-hover)] transition-colors disabled:opacity-70"
                  >
                    {isSubmitting ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send size={18} />
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
