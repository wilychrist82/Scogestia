'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

export function AudioRecorder({ onAudioReady }: { onAudioReady: (url: string | null) => void }) {
  const [isRecording, setIsRecording] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  
  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const audioChunks = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorder.current = new MediaRecorder(stream)
      audioChunks.current = []

      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.current.push(event.data)
        }
      }

      mediaRecorder.current.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' })
        setIsUploading(true)
        try {
          const supabase = createClient()
          const fileName = `message_${Date.now()}.webm`
          const { data, error } = await supabase.storage
            .from('communications')
            .upload(fileName, audioBlob)
          
          if (error) {
            console.error('Error uploading audio:', error)
            alert('Erreur lors de l\'envoi du fichier audio.')
            return
          }

          const { data: { publicUrl } } = supabase.storage
            .from('communications')
            .getPublicUrl(fileName)

          setAudioUrl(publicUrl)
          onAudioReady(publicUrl)
        } catch (err) {
          console.error('Error:', err)
        } finally {
          setIsUploading(false)
        }
      }

      mediaRecorder.current.start()
      setIsRecording(true)
      setRecordingSeconds(0)
      
      timerRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1)
      }, 1000)
    } catch (err) {
      console.error('Microphone access denied:', err)
      alert('Veuillez autoriser l\'accès au microphone pour enregistrer un message vocal.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop()
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop())
      setIsRecording(false)
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }

  const removeAudio = () => {
    setAudioUrl(null)
    onAudioReady(null)
  }

  if (isUploading) {
    return <div className="text-sm font-semibold text-[var(--color-primary)] flex items-center gap-2"><span className="material-symbols-outlined animate-spin">sync</span> Envoi de l'audio en cours...</div>
  }

  if (audioUrl) {
    return (
      <div className="flex flex-col gap-2 p-4 border border-[var(--color-primary)] bg-[#eff4ff] rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-sm font-semibold text-[var(--color-primary)]">Message vocal enregistré</span>
          <button type="button" onClick={removeAudio} className="text-red-500 hover:text-red-700">
            <span className="material-symbols-outlined text-sm">delete</span>
          </button>
        </div>
        <audio controls src={audioUrl} className="w-full h-10" />
      </div>
    )
  }

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div>
      {!isRecording ? (
        <button 
          type="button" 
          onClick={startRecording}
          className="flex items-center gap-2 px-4 py-2 border border-[var(--color-primary)] text-[var(--color-primary)] rounded-lg hover:bg-[#eff4ff] transition-colors text-sm font-semibold w-full sm:w-auto justify-center"
        >
          <span className="material-symbols-outlined">mic</span>
          Ajouter un message vocal
        </button>
      ) : (
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button 
            type="button" 
            onClick={stopRecording}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-semibold animate-pulse"
          >
            <span className="material-symbols-outlined">stop_circle</span>
            Arrêter l'enregistrement
          </button>
          <div className="flex items-center gap-2 text-red-500 font-mono font-semibold px-3 py-2 bg-red-50 rounded-lg border border-red-200">
            <span className="material-symbols-outlined text-[18px] animate-pulse">radio_button_checked</span>
            {formatTime(recordingSeconds)}
          </div>
        </div>
      )}
    </div>
  )
}
