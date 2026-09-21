'use client'

import { useState, useRef, FormEvent } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

interface Props {
  /** Appelé avec { text, audioUrl } lors de la soumission */
  onSend: (payload: { text: string; audioUrl: string | null }) => void
  isPending?: boolean
  placeholder?: string
}

export function WhatsAppInputBar({ onSend, isPending = false, placeholder = 'Message' }: Props) {
  const [text, setText] = useState('')
  const [audioUrl, setAudioUrl] = useState<string | null>(null) // Used if we want to preview, but here we auto-send
  const [isRecording, setIsRecording] = useState(false)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const [isUploading, setIsUploading] = useState(false)

  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const audioChunks = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  
  // To track if we should send or cancel on stop
  const shouldCancelRef = useRef<boolean>(false)

  // Le bouton vert affiche la flèche si du texte est saisi
  const hasContent = text.trim().length > 0

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  // ── Enregistrement ─────────────────────────────────────────────────────────
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorder.current = new MediaRecorder(stream)
      audioChunks.current = []
      shouldCancelRef.current = false

      mediaRecorder.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.current.push(e.data)
      }

      mediaRecorder.current.onstop = async () => {
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
        
        if (shouldCancelRef.current) {
          setIsRecording(false)
          setRecordingSeconds(0)
          return
        }

        // Si l'enregistrement est trop court, on annule
        if (audioChunks.current.length === 0) {
          setIsRecording(false)
          return
        }

        const blob = new Blob(audioChunks.current, { type: 'audio/webm' })
        setIsUploading(true)
        setIsRecording(false) // Cache l'UI d'enregistrement pendant l'envoi
        try {
          const supabase = createClient()
          const fileName = `message_${Date.now()}.webm`
          const { error } = await supabase.storage
            .from('communications')
            .upload(fileName, blob)
          if (error) { toast.error("Erreur lors de l'envoi audio."); return }
          const { data: { publicUrl } } = supabase.storage
            .from('communications')
            .getPublicUrl(fileName)
          
          // Envoi direct sans aperçu !
          onSend({ text: '', audioUrl: publicUrl })
          
        } catch(e) {
          toast.error("Erreur d'envoi.")
        } finally {
          setIsUploading(false)
          setRecordingSeconds(0)
        }
      }

      mediaRecorder.current.start()
      setIsRecording(true)
      setRecordingSeconds(0)
      timerRef.current = setInterval(() => setRecordingSeconds(p => p + 1), 1000)
    } catch {
      toast.error("Veuillez autoriser l'accès au microphone.", { position: 'top-center' })
    }
  }

  const stopRecordingAndSend = () => {
    if (mediaRecorder.current && isRecording) {
      shouldCancelRef.current = false
      mediaRecorder.current.stop()
      mediaRecorder.current.stream.getTracks().forEach(t => t.stop())
    }
  }

  const cancelRecording = () => {
    if (mediaRecorder.current && isRecording) {
      shouldCancelRef.current = true
      mediaRecorder.current.stop()
      mediaRecorder.current.stream.getTracks().forEach(t => t.stop())
    }
  }

  // ── Envoi Texte ────────────────────────────────────────────────────────────
  const sendText = () => {
    if (!hasContent || isPending || isUploading) return
    onSend({ text: text.trim(), audioUrl: null })
    setText('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendText()
    }
  }

  // ── Événements Bouton Micro ────────────────────────────────────────────────
  const handlePointerDown = (e: React.PointerEvent) => {
    if (hasContent) return
    e.preventDefault()
    startRecording()
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    if (hasContent) return
    e.preventDefault()
    stopRecordingAndSend()
  }

  // Si on glisse le doigt hors du bouton, on peut soit annuler, soit envoyer.
  // Pour plus de sûreté, si on quitte la zone du bouton, on annule (comme le "Glisser pour annuler" de WhatsApp)
  const handlePointerLeave = (e: React.PointerEvent) => {
    if (isRecording) {
      // Glisser le doigt en dehors = annuler (comportement mobile classique)
      cancelRecording()
      toast("Enregistrement annulé", { icon: '🗑️', duration: 2000 })
    }
  }

  // ── Rendu ──────────────────────────────────────────────────────────────────
  return (
    <div
      className="bg-[#f0f2f5] border-t border-[var(--color-outline-variant)]"
      style={{ fontFamily: 'inherit', touchAction: 'none' }} // touchAction: none évite le scroll pendant le maintien du bouton
    >
      {/* ── Barre d'enregistrement vocal en cours ── */}
      {isRecording && (
        <div className="flex items-center gap-3 px-3 py-2.5 h-[68px]">
          {/* Info glisser pour annuler */}
          <div className="flex items-center gap-2 text-gray-500 text-sm animate-pulse ml-2">
            <span className="material-symbols-outlined text-[20px]">chevron_left</span>
            Glisser pour annuler
          </div>

          {/* Waveform + timer aligné à droite */}
          <div className="flex-1 flex justify-end items-center gap-3 pr-4">
            <span className="material-symbols-outlined text-[16px] text-red-500 animate-pulse shrink-0">
              radio_button_checked
            </span>
            <span className="text-sm font-mono font-bold text-gray-700 shrink-0">
              {formatTime(recordingSeconds)}
            </span>
          </div>

          {/* Le bouton micro reste visible pour maintenir l'appui */}
          <button
            type="button"
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerLeave}
            className="shrink-0 w-12 h-12 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center shadow-md scale-110 transition-transform cursor-pointer"
            title="Relâcher pour envoyer"
          >
            <span className="material-symbols-outlined text-[25px]">mic</span>
          </button>
        </div>
      )}

      {/* ── Upload en cours ── */}
      {isUploading && (
        <div className="flex items-center gap-2 px-4 py-4 text-[14px] text-[var(--color-primary)] font-semibold h-[68px]">
          <span className="material-symbols-outlined text-[18px] animate-spin">sync</span>
          Envoi du vocal en cours…
        </div>
      )}

      {/* ── Barre principale (masquée pendant l'enregistrement) ── */}
      {!isRecording && !isUploading && (
        <div className="flex items-end gap-2 px-2 py-2">

          {/* INPUT PILL ─────────────────────────────────────────────── */}
          <div className="flex-1 flex items-end bg-white rounded-[26px] border border-[rgba(0,0,0,0.08)] shadow-sm overflow-hidden min-w-0">

            {/* Emoji */}
            <button
              type="button"
              className="shrink-0 self-end mb-[10px] ml-2 text-gray-400 hover:text-gray-600 transition-colors"
              title="Émojis"
            >
              <span className="material-symbols-outlined text-[26px]">sentiment_satisfied</span>
            </button>

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              onInput={(e) => {
                const t = e.target as HTMLTextAreaElement
                t.style.height = 'auto'
                t.style.height = `${Math.min(t.scrollHeight, 140)}px`
              }}
              placeholder={placeholder}
              className="flex-1 bg-transparent text-[15px] outline-none resize-none py-[10px] px-2 leading-relaxed min-h-[44px] max-h-[140px] text-[#111]"
              rows={1}
            />

            {/* Trombone ─ pièce jointe */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="shrink-0 self-end mb-[10px] text-gray-400 hover:text-gray-600 transition-colors"
              title="Joindre un fichier"
            >
              <span className="material-symbols-outlined text-[24px]">attach_file</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="*/*"
            />

            {/* Caméra */}
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="shrink-0 self-end mb-[10px] ml-1 mr-2 text-gray-400 hover:text-gray-600 transition-colors"
              title="Photo / Caméra"
            >
              <span className="material-symbols-outlined text-[24px]">photo_camera</span>
            </button>
            <input
              ref={cameraInputRef}
              type="file"
              className="hidden"
              accept="image/*"
              capture="environment"
            />
          </div>

          {/* ── BOUTON VERT ───────────────────────────────────────────── */}
          {hasContent ? (
            /* Flèche → message texte */
            <button
              type="button"
              disabled={isPending}
              onClick={sendText}
              className="shrink-0 w-12 h-12 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center shadow-md hover:brightness-110 active:scale-95 transition-all disabled:opacity-60"
              title="Envoyer le message"
            >
              <span className="material-symbols-outlined text-[22px] ml-0.5">send</span>
            </button>
          ) : (
            /* Micro → vocal (Maintenir pour parler) */
            <button
              type="button"
              disabled={isPending}
              onPointerDown={handlePointerDown}
              className="shrink-0 w-12 h-12 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center shadow-md hover:brightness-110 transition-all disabled:opacity-60 touch-none cursor-pointer"
              title="Maintenir pour enregistrer"
            >
              <span className="material-symbols-outlined text-[25px]">mic</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
