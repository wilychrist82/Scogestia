'use client'

import { useState, useRef, FormEvent, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import EmojiPicker from 'emoji-picker-react'

interface Props {
  /** Appelé avec { text, audioUrl, fileUrl, fileType } lors de la soumission */
  onSend: (payload: { text: string; audioUrl: string | null; fileUrl?: string | null; fileType?: string | null }) => void
  isPending?: boolean
  placeholder?: string
}

export function WhatsAppInputBar({ onSend, isPending = false, placeholder = 'Message' }: Props) {
  const [text, setText] = useState('')
  const [audioUrl, setAudioUrl] = useState<string | null>(null) // Used if we want to preview, but here we auto-send
  const [isRecording, setIsRecording] = useState(false)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null)
  const emojiPickerRef = useRef<HTMLDivElement>(null)

  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const audioChunks = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  
  // To track if we should send or cancel on stop
  const shouldCancelRef = useRef<boolean>(false)

  // Le bouton vert affiche la flèche si du texte est saisi ou un fichier sélectionné
  const hasContent = text.trim().length > 0 || selectedFile !== null

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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

  // ── Envoi Texte et Fichiers ────────────────────────────────────────────────
  const sendText = async () => {
    if (!hasContent || isPending || isUploading) return
    setIsUploading(true)

    try {
      let fileUrl = null
      let fileType = null

      if (selectedFile) {
        const supabase = createClient()
        const ext = selectedFile.name.split('.').pop()
        const fileName = `attachment_${Date.now()}.${ext}`
        
        const { error } = await supabase.storage
          .from('communications')
          .upload(fileName, selectedFile)

        if (error) {
          toast.error("Erreur lors de l'envoi du fichier.")
          setIsUploading(false)
          return
        }

        const { data: { publicUrl } } = supabase.storage
          .from('communications')
          .getPublicUrl(fileName)

        fileUrl = publicUrl
        fileType = selectedFile.type
      }

      onSend({ text: text.trim(), audioUrl: null, fileUrl, fileType })
      
      // Cleanup
      setText('')
      setSelectedFile(null)
      if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl)
      setFilePreviewUrl(null)
      setShowEmojiPicker(false)
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    } catch(err) {
      toast.error("Une erreur s'est produite")
    } finally {
      setIsUploading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendText()
    }
  }

  const startXRef = useRef<number | null>(null)

  // ── Événements Bouton Micro ────────────────────────────────────────────────
  const handlePointerDown = (e: React.PointerEvent) => {
    if (hasContent) return
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    startXRef.current = e.clientX
    startRecording()
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isRecording || startXRef.current === null) return
    // Calcul de la distance parcourue vers la gauche
    const diff = startXRef.current - e.clientX
    if (diff > 50) {
      cancelRecording()
      toast("Enregistrement annulé", { icon: '🗑️', duration: 2000 })
      startXRef.current = null
      try { e.currentTarget.releasePointerCapture(e.pointerId) } catch (err) {}
    }
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    if (hasContent) return
    e.preventDefault()
    try { e.currentTarget.releasePointerCapture(e.pointerId) } catch (err) {}
    startXRef.current = null
    stopRecordingAndSend()
  }

  // Si on quitte vraiment la zone du bouton sans glisser
  const handlePointerLeave = (e: React.PointerEvent) => {
    // Optionnel: on le garde comme fallback de sécurité
    // mais le swipe est maintenant géré par handlePointerMove
  }

  // ── Gestion Fichiers ───────────────────────────────────────────────────────
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      // Si c'est une image, on crée une URL de preview
      if (file.type.startsWith('image/')) {
        setFilePreviewUrl(URL.createObjectURL(file))
      } else {
        setFilePreviewUrl(null)
      }
    }
    // Reset l'input pour pouvoir resélectionner le même fichier si on l'annule
    if (e.target) e.target.value = ''
  }

  const cancelFile = () => {
    setSelectedFile(null)
    if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl)
    setFilePreviewUrl(null)
  }

  // ── Rendu ──────────────────────────────────────────────────────────────────
  return (
    <div
      className="bg-[#f0f2f5] border-t border-[var(--color-outline-variant)] relative"
      style={{ fontFamily: 'inherit', touchAction: 'none' }} // touchAction: none évite le scroll pendant le maintien du bouton
    >
      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div ref={emojiPickerRef} className="absolute bottom-full left-2 mb-2 z-50 shadow-xl rounded-xl overflow-hidden">
          <EmojiPicker 
            onEmojiClick={(emojiData) => setText(prev => prev + emojiData.emoji)}
            searchDisabled={true}
            skinTonesDisabled={true}
            height={350}
            width={300}
          />
        </div>
      )}

      {/* Preview du fichier sélectionné */}
      {selectedFile && !isRecording && !isUploading && (
        <div className="mx-4 mt-3 mb-1 p-2 bg-white rounded-xl shadow-sm border border-[var(--color-outline-variant)] flex items-center justify-between animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center gap-3 overflow-hidden">
            {filePreviewUrl ? (
              <img src={filePreviewUrl} alt="Preview" className="w-12 h-12 object-cover rounded-md border" />
            ) : (
              <div className="w-12 h-12 bg-gray-100 rounded-md flex items-center justify-center">
                <span className="material-symbols-outlined text-gray-500">description</span>
              </div>
            )}
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-gray-800 truncate">{selectedFile.name}</span>
              <span className="text-xs text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
            </div>
          </div>
          <button 
            type="button"
            onClick={cancelFile}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
      )}
      {/* ── Barre d'enregistrement vocal en cours ── */}
      {isRecording && (
        <div className="flex items-center gap-3 px-3 py-2.5 h-[68px]">
          {/* Info glisser pour annuler */}
          <button 
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              cancelRecording();
              toast("Enregistrement annulé", { icon: '🗑️', duration: 2000 });
            }}
            className="flex items-center gap-2 text-gray-500 text-sm animate-pulse ml-2 cursor-pointer hover:text-red-500 transition-colors z-10"
          >
            <span className="material-symbols-outlined text-[20px]">chevron_left</span>
            Annuler
          </button>

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
            onPointerMove={handlePointerMove}
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
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="shrink-0 self-end mb-[10px] ml-2 text-gray-400 hover:text-gray-600 transition-colors"
              title="Émojis"
            >
              <span className="material-symbols-outlined text-[26px]">
                {showEmojiPicker ? 'keyboard' : 'sentiment_satisfied'}
              </span>
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
              onChange={handleFileSelect}
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
              onChange={handleFileSelect}
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
