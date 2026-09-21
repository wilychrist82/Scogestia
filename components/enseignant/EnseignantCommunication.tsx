'use client'

import { useState, useTransition, FormEvent, useEffect } from 'react'
import { sendCommunication } from '@/app/actions/communication'
import { AudioRecorder } from '@/components/ui/AudioRecorder'
import { WhatsAppInputBar } from '@/components/ui/WhatsAppInputBar'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

type Student = {
  id: string
  first_name: string
  last_name: string
  classes: { name: string } | null
}

type Communication = {
  id: string
  sender_id: string
  recipient_type: string
  recipient_id: string | null
  subject: string
  content: string
  audio_url: string | null
  created_at: string
}

type Props = {
  currentUserId: string
  students: Student[]
  communications: Communication[]
}

export function EnseignantCommunication({ currentUserId, students, communications }: Props) {
  const router = useRouter()
  const [recipientType, setRecipientType] = useState<'admin' | 'parent'>('admin')
  const [selectedParent, setSelectedParent] = useState('')
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Auto-refresh toutes les 10s pour récupérer les nouveaux messages
  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh()
    }, 10000)
    return () => clearInterval(interval)
  }, [router])

  const handleSend = (payload: { text: string; audioUrl: string | null }) => {
    setSuccess(false)
    setError(null)

    const formData = new FormData()
    formData.append('recipientType', recipientType)
    formData.append('subject', 'Message enseignant')
    formData.append('message', payload.text || 'Message vocal')
    if (recipientType === 'parent') {
      formData.append('selectedParent', selectedParent)
    }
    if (payload.audioUrl) {
      formData.append('audioUrl', payload.audioUrl)
    }

    startTransition(async () => {
      const result = await sendCommunication(formData)
      if (result.error) {
        setError(result.error)
        toast.error(result.error, { duration: 4000, position: 'top-center' })
      } else {
        toast.success('✅ Message envoyé avec succès !', {
          duration: 3000,
          position: 'top-center',
          style: { background: '#1e8e3e', color: '#fff', fontWeight: '600', fontSize: '14px', borderRadius: '12px', padding: '12px 16px' }
        })
        setAudioUrl(null)
      }
    })
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-[var(--color-surface)]">
      <div className="max-w-[1280px] mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[var(--color-surface-container-lowest)] p-6 rounded-xl border border-[var(--color-outline-variant)]">
          <div>
            <div className="flex items-center gap-2 text-[var(--color-on-surface-variant)] mb-2">
              <span className="material-symbols-outlined text-[var(--color-primary)]">forum</span>
              <span className="text-sm font-semibold text-[var(--color-on-surface)]">Messagerie</span>
            </div>
            <h2 className="text-3xl font-bold text-[var(--color-on-surface)]">Mes Messages</h2>
            <p className="text-base text-[var(--color-on-surface-variant)] mt-1">
              Communiquez avec l'administration et les parents d'élèves.
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-[var(--color-status-retard-bg)] text-[var(--color-status-retard-text)] p-4 rounded-xl border border-[var(--color-status-retard-text)] text-sm font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">error</span>
            {error}
          </div>
        )}

        {success && (
          <div className="bg-[#e6f4ea] text-[#1e8e3e] p-4 rounded-xl border border-[#ceead6] text-sm font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">check_circle</span>
            Message envoyé avec succès.
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Formulaire d'envoi style WhatsApp */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-[var(--color-outline-variant)] shadow-sm overflow-hidden flex flex-col h-[525px]">
            {/* Header / Destinataire */}
            <div className="p-3 border-b border-[var(--color-outline-variant)] bg-[var(--color-surface-bright)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--color-primary-container)] text-[var(--color-primary)] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">{recipientType === 'admin' ? 'admin_panel_settings' : 'family_restroom'}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-[var(--color-on-surface)]">
                    {recipientType === 'admin' ? 'Administration' : 'Contacter un parent'}
                  </span>
                  <span className="text-[11px] text-[var(--color-on-surface-variant)]">En ligne</span>
                </div>
              </div>
              <select
                value={recipientType}
                onChange={(e) => setRecipientType(e.target.value as 'admin' | 'parent')}
                className="text-xs bg-transparent border-none outline-none font-semibold text-[var(--color-primary)] cursor-pointer"
              >
                <option value="admin">Admin</option>
                <option value="parent">Parent</option>
              </select>
            </div>

            {/* Zone de sélection du parent si nécessaire */}
            {recipientType === 'parent' && (
              <div className="px-3 py-2 bg-[#f0f2f5] border-b border-[var(--color-outline-variant)]">
                <SearchableSelect
                  value={selectedParent}
                  onChange={(val) => setSelectedParent(val)}
                  placeholder="Sélectionner l'élève..."
                  options={students.map(s => ({
                    value: s.id,
                    label: `${s.first_name} ${s.last_name} ${s.classes?.name ? `(${s.classes.name})` : ''}`
                  }))}
                />
              </div>
            )}

            {/* Zone centrale (vide pour le moment ou pourrait afficher le chat actif spécifique) */}
            <div className="flex-1 bg-[#efeae2] relative overflow-hidden">
              <div className="absolute inset-0 opacity-40 mix-blend-multiply pointer-events-none" style={{ backgroundImage: 'url("https://web.whatsapp.com/img/bg-chat-tile-dark_a4be512e7195b6b733d9110b408f075d.png")' }}></div>
              <div className="h-full flex items-center justify-center p-6 text-center z-10 relative">
                 <span className="bg-white/80 px-4 py-1.5 rounded-lg text-xs font-semibold text-gray-500 shadow-sm backdrop-blur-sm">
                   Sélectionnez un destinataire et envoyez un message
                 </span>
              </div>
            </div>

            {/* WhatsApp Input Bar */}
            <WhatsAppInputBar 
              onSend={handleSend} 
              isPending={isPending} 
              placeholder={recipientType === 'parent' && !selectedParent ? "Sélectionnez un parent d'abord" : "Message"} 
            />
          </div>

          {/* Historique */}
          <div className="bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-outline-variant)] shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-4 border-b border-[var(--color-outline-variant)] bg-[var(--color-surface-bright)]">
              <h3 className="font-bold text-[var(--color-on-surface)] flex items-center gap-2">
                <span className="material-symbols-outlined text-[var(--color-on-surface-variant)]">history</span>
                Historique Récent
              </h3>
            </div>
            <div className="p-4 flex flex-col gap-4 flex-1 bg-[var(--color-surface)] overflow-y-auto max-h-[480px]">
              {communications.length === 0 ? (
                <div className="text-center text-sm text-[var(--color-on-surface-variant)] py-8">
                  Aucun message récent.
                </div>
              ) : (
                [...communications].reverse().map(comm => {
                  const isSentByMe = comm.sender_id === currentUserId
                  const isRead = (comm as any).is_read === true

                  let recipientText = ''
                  if (comm.recipient_type === 'admin') recipientText = 'Administration'
                  else if (comm.recipient_type === 'parent') recipientText = "Parent d'un élève"
                  else if (comm.recipient_type === 'all') recipientText = 'Tous les parents'
                  else if (comm.recipient_type === 'enseignant') recipientText = 'Enseignant'

                  return (
                    <div key={comm.id} className={`flex w-full ${isSentByMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] flex flex-col gap-1 ${isSentByMe ? 'items-end' : 'items-start'}`}>

                        {/* Bulle */}
                        <div className={`rounded-2xl overflow-hidden shadow-sm ${
                          isSentByMe
                            ? 'bg-[#dcf8c6] text-[#0b1c30] rounded-tr-sm'
                            : 'bg-white border border-[var(--color-outline-variant)] text-[#0b1c30] rounded-tl-sm'
                        }`}>
                          {comm.subject && comm.subject !== 'Message vocal' && comm.subject !== 'Message de l\'administration' && (
                            <p className="px-3 pt-2.5 text-[13px] font-bold">{comm.subject}</p>
                          )}
                          {(() => {
                            const contentStr = comm.content || '';
                            const parts = contentStr.split('|||FILE|||');
                            const displayContent = parts[0];
                            const fileUrl = parts[1];
                            const fileType = parts[2];
                            
                            return (
                              <>
                                {displayContent && displayContent !== 'Message vocal' && (
                                  <p className="px-3 pt-1 pb-1 text-sm whitespace-pre-wrap leading-relaxed">{displayContent}</p>
                                )}
                                {fileUrl && (
                                  <div className="px-2 pt-1 pb-1">
                                    {fileType?.startsWith('image/') ? (
                                      <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                                        <img src={fileUrl} alt="Pièce jointe" className="max-w-full h-auto rounded-lg max-h-48 object-cover border border-black/10" />
                                      </a>
                                    ) : (
                                      <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 bg-black/5 rounded-lg hover:bg-black/10 transition-colors">
                                        <span className="material-symbols-outlined text-[20px]">description</span>
                                        <span className="text-sm font-semibold truncate max-w-[150px]">Pièce jointe</span>
                                      </a>
                                    )}
                                  </div>
                                )}
                              </>
                            )
                          })()}
                          {comm.audio_url && (
                            <div className={`flex items-center gap-2 px-3 py-2 min-w-[180px] ${
                              comm.content && comm.content !== 'Message vocal' ? 'border-t border-black/5' : ''
                            }`}>
                              <span className="material-symbols-outlined text-[20px] text-[var(--color-primary)] shrink-0">mic</span>
                              <audio src={comm.audio_url} controls className="h-7 w-full flex-1" style={{ colorScheme: 'light' }} />
                            </div>
                          )}

                          {/* Heure + coches dans la bulle */}
                          <div className="flex items-center justify-end gap-1 pr-2 pb-1.5">
                            {isSentByMe && (
                              <span className="text-[10px] text-[var(--color-on-surface-variant)]">
                                À: {recipientText} •
                              </span>
                            )}
                            <span className="text-[10px] text-[var(--color-on-surface-variant)]">
                              {format(new Date(comm.created_at), 'HH:mm', { locale: fr })}
                            </span>
                            {isSentByMe && (
                              <svg
                                width="16" height="11" viewBox="0 0 16 11"
                                fill="none" xmlns="http://www.w3.org/2000/svg"
                                className="shrink-0"
                                aria-label={isRead ? 'Lu' : 'Envoyé'}
                              >
                                <path d="M1 5.5L4.5 9L11 2" stroke={isRead ? '#53bdeb' : '#8696a0'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M5 5.5L8.5 9L15 2" stroke={isRead ? '#53bdeb' : '#8696a0'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </div>
                        </div>

                        {!isSentByMe && (
                          <span className="text-[10px] text-[var(--color-on-surface-variant)] px-1">
                            De: Administration / Parent
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
