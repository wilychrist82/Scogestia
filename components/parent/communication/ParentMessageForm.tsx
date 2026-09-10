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
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 bg-[var(--color-surface)] border-t border-[var(--color-outline-variant)] p-4">
      {error && (
        <div className="bg-[var(--color-status-retard-bg)] text-[var(--color-status-retard-text)] p-2 rounded text-xs font-medium">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-[#e6f4ea] text-[#1e8e3e] p-2 rounded text-xs font-medium flex items-center gap-1">
          <span className="material-symbols-outlined text-[16px]">check_circle</span>
          Message envoyé avec succès.
        </div>
      )}
      
      <div className="flex items-end gap-2">
        <div className="flex-1 bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-2xl flex flex-col p-1 focus-within:border-[var(--color-primary)] transition-colors">
          <textarea 
            name="message"
            placeholder="Écrire un message..." 
            className="w-full bg-transparent p-3 text-base outline-none resize-none min-h-[44px] max-h-[120px]"
            rows={1}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
            }}
          ></textarea>
          
          <div className="flex justify-between items-center px-2 pb-1 border-t border-transparent mt-1">
            <div className="scale-90 origin-left">
              <AudioRecorder onAudioReady={(url) => setAudioUrl(url)} />
            </div>
            
            <button 
              type="submit"
              className="w-10 h-10 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-50 shrink-0 shadow-sm" 
              disabled={isPending}
            >
              <span className="material-symbols-outlined text-[20px] ml-1">send</span>
            </button>
          </div>
        </div>
      </div>
      {/* Hidden subject field since it's a chat-like interface now */}
      <input type="hidden" name="subject" value="Message parent" />
    </form>
  )
}
