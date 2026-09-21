'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { sendCommunication } from '@/app/actions/communication'
import { MessageActions } from '@/components/ui/MessageActions'
import { ReadReceiptTrigger } from '@/components/ui/ReadReceiptTrigger'
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
  read_by?: string[]
  deleted_by?: string[]
  is_deleted_for_everyone?: boolean
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
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const chatBottomRef = useRef<HTMLDivElement>(null)

  // Auto-refresh toutes les 10s pour récupérer les nouveaux messages
  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh()
    }, 10000)
    return () => clearInterval(interval)
  }, [router])

  // Scroll vers le bas à chaque changement de messages ou de destinataire
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [communications, recipientType, selectedParent])

  // ─── Filtrage des messages selon le destinataire actif ───────────────────
  const filteredMessages = communications.filter(comm => {
    const deletedBy = comm.deleted_by || []
    if (deletedBy.includes(currentUserId)) return false

    if (recipientType === 'admin') {
      // Conversation avec l'admin :
      // - Messages que J'ai envoyés à l'admin (recipient_type = 'admin')
      // - Messages que l'admin m'a envoyés (recipient_type = 'enseignant' AND recipient_id = moi)
      // - Annonces à tous les enseignants (recipient_type = 'all_teachers')
      // EXCLURE explicitement les messages envoyés à des parents
      const iSentToAdmin = comm.sender_id === currentUserId && comm.recipient_type === 'admin'
      const adminSentToMe =
        comm.sender_id !== currentUserId &&
        (
          (comm.recipient_type === 'enseignant' && comm.recipient_id === currentUserId) ||
          comm.recipient_type === 'all_teachers'
        )
      return iSentToAdmin || adminSentToMe
    }

    if (recipientType === 'parent') {
      if (!selectedParent) return false
      // Messages que J'ai envoyés à un parent (recipient_type = 'parent')
      // On affiche tous mes messages vers des parents quand un élève est sélectionné
      // (filtre par recipient_id exact nécessiterait le parent_user_id côté client)
      return comm.sender_id === currentUserId && comm.recipient_type === 'parent'
    }

    return false
  })

  // IDs non lus dans la conversation active
  const unreadIds = filteredMessages
    .filter(msg => msg.sender_id !== currentUserId && !(msg.read_by || []).includes(currentUserId))
    .map(msg => msg.id)

  const handleSend = (payload: { text: string; audioUrl: string | null; fileUrl?: string | null; fileType?: string | null }) => {
    setError(null)

    if (recipientType === 'parent' && !selectedParent) {
      toast.error("Veuillez sélectionner un élève/parent avant d'envoyer.", { position: 'top-center' })
      return
    }

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
    if (payload.fileUrl) {
      formData.append('fileUrl', payload.fileUrl)
    }
    if (payload.fileType) {
      formData.append('fileType', payload.fileType)
    }
    if ((payload as any).originalFileName) {
      formData.append('originalFileName', (payload as any).originalFileName)
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
        // Recharger les données serveur pour afficher le nouveau message
        router.refresh()
      }
    })
  }

  const selectedStudentLabel = selectedParent
    ? students.find(s => s.id === selectedParent)
      ? (() => { const s = students.find(st => st.id === selectedParent)!; return `${s.first_name} ${s.last_name}` })()
      : ''
    : ''

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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Zone de chat principale style WhatsApp */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-[var(--color-outline-variant)] shadow-sm overflow-hidden flex flex-col h-[525px]">

            {/* Header / Sélection du destinataire */}
            <div className="p-3 border-b border-[var(--color-outline-variant)] bg-[var(--color-surface-bright)] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--color-primary-container)] text-[var(--color-primary)] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">
                    {recipientType === 'admin' ? 'admin_panel_settings' : 'family_restroom'}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-[var(--color-on-surface)]">
                    {recipientType === 'admin'
                      ? 'Administration'
                      : selectedStudentLabel
                        ? `Parent de ${selectedStudentLabel}`
                        : 'Contacter un parent'}
                  </span>
                  <span className="text-[11px] text-[var(--color-on-surface-variant)]">En ligne</span>
                </div>
              </div>
              <select
                value={recipientType}
                onChange={(e) => {
                  setRecipientType(e.target.value as 'admin' | 'parent')
                  setSelectedParent('')
                }}
                className="text-xs bg-transparent border-none outline-none font-semibold text-[var(--color-primary)] cursor-pointer"
              >
                <option value="admin">Admin</option>
                <option value="parent">Parent</option>
              </select>
            </div>

            {/* Sélection du parent si nécessaire */}
            {recipientType === 'parent' && (
              <div className="px-3 py-2 bg-[#f0f2f5] border-b border-[var(--color-outline-variant)] shrink-0">
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

            {/* Zone de messages scrollable */}
            <div className="flex-1 bg-[#efeae2] relative overflow-y-auto">
              <div
                className="absolute inset-0 opacity-40 mix-blend-multiply pointer-events-none"
                style={{ backgroundImage: 'url("https://web.whatsapp.com/img/bg-chat-tile-dark_a4be512e7195b6b733d9110b408f075d.png")' }}
              />

              {/* Trigger read receipts */}
              <ReadReceiptTrigger messageIds={unreadIds} />

              <div className="relative z-10 flex flex-col gap-2 p-3 min-h-full justify-end">
                {filteredMessages.length === 0 ? (
                  <div className="flex items-center justify-center h-full py-12">
                    <span className="bg-white/80 px-4 py-1.5 rounded-lg text-xs font-semibold text-gray-500 shadow-sm backdrop-blur-sm">
                      {recipientType === 'parent' && !selectedParent
                        ? "Sélectionnez un parent pour voir la conversation"
                        : "Aucun message pour le moment. Commencez la conversation !"}
                    </span>
                  </div>
                ) : (
                  [...filteredMessages].reverse().map(comm => {
                    const isSentByMe = comm.sender_id === currentUserId
                    const readBy = comm.read_by || []
                    const isRead = readBy.length > 0 && (!isSentByMe ? readBy.includes(currentUserId) : true)
                    const isDeletedForEveryone = comm.is_deleted_for_everyone === true

                    return (
                      <div key={comm.id} className={`flex w-full ${isSentByMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] flex flex-col gap-1 ${isSentByMe ? 'items-end' : 'items-start'}`}>

                          {/* Bulle */}
                          <div className={`relative group rounded-2xl overflow-visible shadow-sm ${
                            isSentByMe
                              ? 'bg-[#dcf8c6] text-[#0b1c30] rounded-tr-sm'
                              : 'bg-white border border-[var(--color-outline-variant)] text-[#0b1c30] rounded-tl-sm'
                          }`}>
                            <MessageActions messageId={comm.id} isSentByMe={isSentByMe} />

                            {isDeletedForEveryone ? (
                              <div className="px-3 py-2 text-[14px] text-gray-500 italic flex items-center gap-2">
                                <span className="material-symbols-outlined text-[18px]">block</span>
                                Ce message a été supprimé
                              </div>
                            ) : (
                              <>
                                {comm.subject && comm.subject !== 'Message vocal' && comm.subject !== 'Message enseignant' && (
                                  <p className="px-3 pt-2.5 text-[13px] font-bold pr-6">{comm.subject}</p>
                                )}
                                {(() => {
                                  const contentStr = comm.content || ''
                                  const parts = contentStr.split('|||FILE|||')
                                  const displayContent = parts[0]
                                  let fileUrl: string | undefined, fileType: string | undefined, fileName = 'Pièce jointe'

                                  if (parts[1]) {
                                    const fileParts = parts[1].split('|||')
                                    fileUrl = fileParts[0]
                                    fileType = fileParts[1]
                                    const originalName = fileParts[2]
                                    if (originalName) {
                                      fileName = originalName
                                    } else {
                                      try {
                                        const path = new URL(fileUrl).pathname
                                        const extractedName = decodeURIComponent(path.split('/').pop() || '')
                                        if (extractedName) fileName = extractedName.replace(/_\d+\./, '.')
                                      } catch {}
                                    }
                                  }

                                  return (
                                    <>
                                      {displayContent && displayContent !== 'Message vocal' && (
                                        <p className="px-3 pt-1 pb-1 text-sm whitespace-pre-wrap leading-relaxed pr-6">{displayContent}</p>
                                      )}
                                      {fileUrl && (
                                        <div className="px-2 pt-1 pb-1 pr-6">
                                          {fileType?.startsWith('image/') ? (
                                            <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                                              <img src={fileUrl} alt={fileName} className="max-w-full h-auto rounded-lg max-h-48 object-cover border border-black/10" />
                                            </a>
                                          ) : fileType?.startsWith('video/') ? (
                                            <video src={fileUrl} controls className="max-w-full h-auto rounded-lg max-h-48 border border-black/10" />
                                          ) : (
                                            <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 bg-black/5 rounded-lg hover:bg-black/10 transition-colors">
                                              <span className="material-symbols-outlined text-[20px]">description</span>
                                              <span className="text-sm font-semibold truncate max-w-[150px]" title={fileName}>{fileName}</span>
                                            </a>
                                          )}
                                        </div>
                                      )}
                                    </>
                                  )
                                })()}
                                {comm.audio_url && (
                                  <div className={`flex items-center gap-2 px-3 py-2 min-w-[180px] pr-6 ${
                                    comm.content && comm.content !== 'Message vocal' ? 'border-t border-black/5' : ''
                                  }`}>
                                    <span className="material-symbols-outlined text-[20px] text-[var(--color-primary)] shrink-0">mic</span>
                                    <audio src={comm.audio_url} controls className="h-7 w-full flex-1" style={{ colorScheme: 'light' }} />
                                  </div>
                                )}
                              </>
                            )}

                            {/* Heure + coches */}
                            <div className="flex items-center justify-end gap-1 pr-2 pb-1.5">
                              <span className="text-[10px] text-[var(--color-on-surface-variant)]">
                                {format(new Date(comm.created_at), 'HH:mm', { locale: fr })}
                              </span>
                              {isSentByMe && (
                                <svg width="16" height="11" viewBox="0 0 16 11" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0" aria-label={isRead ? 'Lu' : 'Envoyé'}>
                                  <path d="M1 5.5L4.5 9L11 2" stroke={isRead ? '#53bdeb' : '#8696a0'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                  <path d="M5 5.5L8.5 9L15 2" stroke={isRead ? '#53bdeb' : '#8696a0'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              )}
                            </div>
                          </div>

                          {/* Label expéditeur sous la bulle */}
                          {!isSentByMe && (
                            <span className="text-[10px] text-[var(--color-on-surface-variant)] px-1">
                              {comm.recipient_type === 'all_teachers' ? 'À tous les enseignants' : 'Administration'}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={chatBottomRef} />
              </div>
            </div>

            {/* Barre de saisie */}
            <WhatsAppInputBar
              onSend={handleSend}
              isPending={isPending}
              placeholder={recipientType === 'parent' && !selectedParent ? "Sélectionnez un parent d'abord" : "Message"}
            />
          </div>

          {/* Historique complet (tous messages envoyés/reçus) */}
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
                  const deletedBy = comm.deleted_by || []
                  if (deletedBy.includes(currentUserId)) return null

                  const isSentByMe = comm.sender_id === currentUserId
                  const readBy = comm.read_by || []
                  const isRead = readBy.length > 0 && (!isSentByMe ? readBy.includes(currentUserId) : true)
                  const isDeletedForEveryone = comm.is_deleted_for_everyone === true

                  let recipientText = ''
                  if (comm.recipient_type === 'admin') recipientText = 'Administration'
                  else if (comm.recipient_type === 'parent') recipientText = "Parent d'un élève"
                  else if (comm.recipient_type === 'all') recipientText = 'Tous les parents'
                  else if (comm.recipient_type === 'enseignant') recipientText = 'Enseignant'
                  else if (comm.recipient_type === 'all_teachers') recipientText = 'Tous les enseignants'

                  return (
                    <div key={comm.id} className={`flex w-full ${isSentByMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] flex flex-col gap-1 ${isSentByMe ? 'items-end' : 'items-start'}`}>

                        <div className={`relative group rounded-2xl overflow-visible shadow-sm ${
                          isSentByMe
                            ? 'bg-[#dcf8c6] text-[#0b1c30] rounded-tr-sm'
                            : 'bg-white border border-[var(--color-outline-variant)] text-[#0b1c30] rounded-tl-sm'
                        }`}>
                          <MessageActions messageId={comm.id} isSentByMe={isSentByMe} />

                          {isDeletedForEveryone ? (
                            <div className="px-3 py-2 text-[14px] text-gray-500 italic flex items-center gap-2">
                              <span className="material-symbols-outlined text-[18px]">block</span>
                              Ce message a été supprimé
                            </div>
                          ) : (
                            <>
                              {comm.subject && comm.subject !== 'Message vocal' && comm.subject !== 'Message de l\'administration' && (
                                <p className="px-3 pt-2.5 text-[13px] font-bold pr-6">{comm.subject}</p>
                              )}
                              {(() => {
                                const contentStr = comm.content || ''
                                const parts = contentStr.split('|||FILE|||')
                                const displayContent = parts[0]
                                let fileUrl: string | undefined, fileType: string | undefined, fileName = 'Pièce jointe'

                                if (parts[1]) {
                                  const fileParts = parts[1].split('|||')
                                  fileUrl = fileParts[0]
                                  fileType = fileParts[1]
                                  const originalName = fileParts[2]
                                  if (originalName) {
                                    fileName = originalName
                                  } else {
                                    try {
                                      const path = new URL(fileUrl).pathname
                                      const extractedName = decodeURIComponent(path.split('/').pop() || '')
                                      if (extractedName) fileName = extractedName.replace(/_\d+\./, '.')
                                    } catch {}
                                  }
                                }

                                return (
                                  <>
                                    {displayContent && displayContent !== 'Message vocal' && (
                                      <p className="px-3 pt-1 pb-1 text-sm whitespace-pre-wrap leading-relaxed pr-6">{displayContent}</p>
                                    )}
                                    {fileUrl && (
                                      <div className="px-2 pt-1 pb-1 pr-6">
                                        {fileType?.startsWith('image/') ? (
                                          <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                                            <img src={fileUrl} alt={fileName} className="max-w-full h-auto rounded-lg max-h-48 object-cover border border-black/10" />
                                          </a>
                                        ) : fileType?.startsWith('video/') ? (
                                          <video src={fileUrl} controls className="max-w-full h-auto rounded-lg max-h-48 border border-black/10" />
                                        ) : (
                                          <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 bg-black/5 rounded-lg hover:bg-black/10 transition-colors">
                                            <span className="material-symbols-outlined text-[20px]">description</span>
                                            <span className="text-sm font-semibold truncate max-w-[150px]" title={fileName}>{fileName}</span>
                                          </a>
                                        )}
                                      </div>
                                    )}
                                  </>
                                )
                              })()}
                              {comm.audio_url && (
                                <div className={`flex items-center gap-2 px-3 py-2 min-w-[180px] pr-6 ${
                                  comm.content && comm.content !== 'Message vocal' ? 'border-t border-black/5' : ''
                                }`}>
                                  <span className="material-symbols-outlined text-[20px] text-[var(--color-primary)] shrink-0">mic</span>
                                  <audio src={comm.audio_url} controls className="h-7 w-full flex-1" style={{ colorScheme: 'light' }} />
                                </div>
                              )}
                            </>
                          )}

                          <div className="flex items-center justify-end gap-1 pr-2 pb-1.5">
                            <span className="text-[10px] text-[var(--color-on-surface-variant)]">
                              {format(new Date(comm.created_at), 'HH:mm', { locale: fr })}
                            </span>
                            {isSentByMe && (
                              <svg width="16" height="11" viewBox="0 0 16 11" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0" aria-label={isRead ? 'Lu' : 'Envoyé'}>
                                <path d="M1 5.5L4.5 9L11 2" stroke={isRead ? '#53bdeb' : '#8696a0'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M5 5.5L8.5 9L15 2" stroke={isRead ? '#53bdeb' : '#8696a0'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </div>
                        </div>

                        <span className="text-[10px] text-[var(--color-on-surface-variant)] px-1">
                          {isSentByMe ? `À : ${recipientText}` : 'Administration'}
                        </span>
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
