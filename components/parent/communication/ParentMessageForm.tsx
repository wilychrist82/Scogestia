'use client'

import { useState, useTransition, FormEvent } from 'react'
import { sendCommunication } from '@/app/actions/communication'
import { AudioRecorder } from '@/components/ui/AudioRecorder'
import toast from 'react-hot-toast'

export function ParentMessageForm() {
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    const form = e.currentTarget
    const formData = new FormData(form)
    formData.append('recipientType', 'admin')
    if (audioUrl) formData.append('audioUrl', audioUrl)

    startTransition(async () => {
      const result = await sendCommunication(formData)
      if (result.error) {
        setError(result.error)
        toast.error(result.error, { duration: 4000, position: 'top-center' })
      } else {
        toast.success('✅ Message envoyé !', {
          duration: 4000,
          position: 'top-center',
          style: {
            background: '#1e8e3e', color: '#fff',
            fontWeight: '600', fontSize: '14px',
            borderRadius: '12px', padding: '12px 16px',
          },
        })
        form.reset()
        setAudioUrl(null)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="bg-[var(--color-surface)] border-t border-[var(--color-outline-variant)]">
      {error && (
        <div className="px-4 pt-3 text-xs font-medium text-[var(--color-status-retard-text)] bg-[var(--color-status-retard-bg)] border-b border-[var(--color-outline-variant)]">
          {error}
        </div>
      )}

      {/* Aperçu audio si enregistré */}
      {audioUrl && (
        <div className="px-4 pt-3">
          <AudioRecorder onAudioReady={(url) => setAudioUrl(url)} compact />
        </div>
      )}

      {/* Barre principale : textarea + actions */}
      <div className="flex items-end gap-2 px-3 py-3">
        {/* Zone de texte */}
        <div className="flex-1 bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-2xl focus-within:border-[var(--color-primary)] transition-colors px-4 py-2.5">
          <textarea
            name="message"
            placeholder="Écrire un message..."
            className="w-full bg-transparent text-base outline-none resize-none min-h-[22px] max-h-[120px] leading-relaxed"
            rows={1}
            onInput={(e) => {
              const t = e.target as HTMLTextAreaElement
              t.style.height = 'auto'
              t.style.height = `${Math.min(t.scrollHeight, 120)}px`
            }}
          />
        </div>

        {/* Bouton microphone – à côté du bouton Envoyer, PAS à l'intérieur du textarea */}
        {!audioUrl && (
          <AudioRecorder
            onAudioReady={(url) => setAudioUrl(url)}
            compact
          />
        )}

        {/* Bouton Envoyer */}
        <button
          type="submit"
          disabled={isPending}
          className="w-10 h-10 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-50 shrink-0 shadow-sm"
          title="Envoyer"
        >
          <span className="material-symbols-outlined text-[20px] ml-0.5">send</span>
        </button>
      </div>

      <input type="hidden" name="subject" value="Message parent" />
    </form>
  )
}
