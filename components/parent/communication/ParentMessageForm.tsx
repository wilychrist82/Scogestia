'use client'

import { useState, useTransition, FormEvent } from 'react'
import { sendCommunication } from '@/app/actions/communication'
import { AudioRecorder } from '@/components/ui/AudioRecorder'

export function ParentMessageForm() {
  const [isOpen, setIsOpen] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  
  const [isPending, startTransition] = useTransition()
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSuccess(false)
    setError(null)
    
    const form = e.currentTarget
    const formData = new FormData(form)
    formData.append('recipientType', 'admin') // Always send to admin
    if (audioUrl) formData.append('audioUrl', audioUrl)
    
    startTransition(async () => {
      const result = await sendCommunication(formData)
      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        setTimeout(() => {
          setSuccess(false)
          setIsOpen(false)
        }, 3000)
        form.reset()
        setAudioUrl(null)
      }
    })
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="bg-[var(--color-primary)] text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity flex items-center gap-2 shadow-sm"
      >
        <span className="material-symbols-outlined text-[20px]">add_comment</span>
        Nouveau Message
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0b1c30]/40  transition-opacity p-4">
          <div className="bg-[var(--color-surface-container-lowest)] w-full max-w-lg rounded-xl shadow-lg border border-[var(--color-outline-variant)] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--color-outline-variant)] flex justify-between items-center bg-[var(--color-surface-bright)]">
              <h2 className="text-xl font-semibold text-[var(--color-on-surface)] flex items-center gap-2">
                <span className="material-symbols-outlined text-[var(--color-primary)]">chat</span>
                Contacter l'administration
              </h2>
              <button onClick={() => setIsOpen(false)} className="text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)] p-1 rounded-full hover:bg-[#dce9ff] transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex flex-col">
              <div className="p-6 space-y-5">
                {error && (
                  <div className="bg-[var(--color-status-retard-bg)] text-[var(--color-status-retard-text)] p-3 rounded text-sm font-medium">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="bg-[#e6f4ea] text-[#1e8e3e] p-3 rounded text-sm font-medium flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px]">check_circle</span>
                    Message envoyé avec succès à l'administration.
                  </div>
                )}
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-[var(--color-on-surface)]">Objet</label>
                  <input 
                    type="text" 
                    name="subject"
                    placeholder="Sujet du message (ex: Retard, Absence, Question...)" 
                    className="w-full h-12 px-4 border border-[var(--color-outline-variant)] rounded-lg text-base focus:border-[var(--color-primary)] outline-none bg-[var(--color-surface)]"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-[var(--color-on-surface)]">Message texte (Optionnel si vocal)</label>
                  <textarea 
                    name="message"
                    placeholder="Rédigez votre message ici..." 
                    className="w-full p-4 border border-[var(--color-outline-variant)] rounded-lg text-base focus:border-[var(--color-primary)] outline-none bg-[var(--color-surface)] min-h-[120px]"
                  ></textarea>
                </div>

                <div className="flex flex-col gap-1.5 border-t border-[var(--color-outline-variant)] pt-4 mt-2">
                  <label className="text-sm font-semibold text-[var(--color-on-surface)] flex justify-between items-center">
                    Message vocal
                  </label>
                  <AudioRecorder onAudioReady={(url) => setAudioUrl(url)} />
                </div>
              </div>
              
              <div className="px-6 py-4 border-t border-[var(--color-outline-variant)] bg-[var(--color-surface-bright)] flex justify-end gap-3 shrink-0">
                <button 
                  type="button"
                  onClick={() => setIsOpen(false)} 
                  className="px-5 py-2.5 rounded-lg border border-[var(--color-outline)] text-[var(--color-on-surface)] font-semibold text-sm hover:bg-[#eff4ff] transition-colors" 
                  disabled={isPending}
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-[var(--color-primary)] text-white font-semibold text-sm hover:opacity-90 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2" 
                  disabled={isPending}
                >
                  <span className="material-symbols-outlined text-[18px]">send</span>
                  {isPending ? 'Envoi...' : 'Envoyer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
