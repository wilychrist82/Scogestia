'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Mic, X, Square, Disc } from 'lucide-react'

interface Props {
  onAudioReady: (url: string | null) => void
  /** Si true, le bouton mic est rendu en mode "inline" (rond, sans label) */
  compact?: boolean
}

export function AudioRecorder({ onAudioReady, compact = false }: Props) {
  const [isRecording, setIsRecording] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [recordingSeconds, setRecordingSeconds] = useState(0)

  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const audioChunks = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorder.current = new MediaRecorder(stream)
      audioChunks.current = []

      mediaRecorder.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.current.push(e.data)
      }

      mediaRecorder.current.onstop = async () => {
        const blob = new Blob(audioChunks.current, { type: 'audio/webm' })
        setIsUploading(true)
        try {
          const supabase = createClient()
          const fileName = `message_${Date.now()}.webm`
          const { error } = await supabase.storage
            .from('communications')
            .upload(fileName, blob)
          if (error) {
            alert("Erreur lors de l'envoi du fichier audio.")
            return
          }
          const { data: { publicUrl } } = supabase.storage
            .from('communications')
            .getPublicUrl(fileName)
          setAudioUrl(publicUrl)
          onAudioReady(publicUrl)
        } finally {
          setIsUploading(false)
        }
      }

      mediaRecorder.current.start()
      setIsRecording(true)
      setRecordingSeconds(0)
      timerRef.current = setInterval(() => setRecordingSeconds(p => p + 1), 1000)
    } catch {
      alert("Veuillez autoriser l'accès au microphone.")
    }
  }

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop()
      mediaRecorder.current.stream.getTracks().forEach(t => t.stop())
      setIsRecording(false)
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    }
  }

  const removeAudio = () => {
    setAudioUrl(null)
    onAudioReady(null)
  }

  /* ── En cours d'upload ── */
  if (isUploading) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-[var(--color-primary)] font-semibold">
        <Loader2 className="w-4 h-4 animate-spin" />
        Envoi…
      </div>
    )
  }

  /* ── Audio prêt → aperçu slim ── */
  if (audioUrl) {
    return (
      <div className="flex items-center gap-2 bg-[#dcf8c6] border border-[#b7dfb0] rounded-xl px-3 py-2 max-w-[220px]">
        <Mic className="w-4 h-4 text-[var(--color-primary)] shrink-0" />
        <audio src={audioUrl} controls className="h-7 flex-1 min-w-0" />
        <button
          type="button"
          onClick={removeAudio}
          className="shrink-0 text-red-500 hover:text-red-700 transition-colors"
          title="Supprimer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    )
  }

  /* ── En cours d'enregistrement ── */
  if (isRecording) {
    return (
      <button
        type="button"
        onClick={stopRecording}
        className="flex items-center gap-2 bg-red-500 text-white rounded-full px-3 py-2 text-xs font-semibold hover:bg-red-600 transition-colors shadow-sm"
        title="Arrêter l'enregistrement"
      >
        <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
        {formatTime(recordingSeconds)}
        <Square className="w-3.5 h-3.5 fill-white" />
      </button>
    )
  }

  /* ── Bouton mic par défaut ── */
  if (compact) {
    // Mode compact : icône ronde seule, à placer à côté du bouton Envoyer
    return (
      <button
        type="button"
        onClick={startRecording}
        className="w-10 h-10 rounded-full flex items-center justify-center text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)] hover:text-[var(--color-primary)] transition-colors shrink-0"
        title="Enregistrer un message vocal"
      >
        <Mic className="w-5 h-5" />
      </button>
    )
  }

  // Mode standard (formulaires admin/enseignant)
  return (
    <button
      type="button"
      onClick={startRecording}
      className="flex items-center gap-2 px-4 py-2 border border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] rounded-lg hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors text-sm font-semibold w-full sm:w-auto justify-center"
    >
      <Mic className="w-4 h-4" />
      Ajouter un message vocal
    </button>
  )
}
