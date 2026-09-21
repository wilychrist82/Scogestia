'use client'

import { useState, useTransition, useEffect, FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { sendCommunication, SendResponse } from '@/app/actions/communication'
import { formatDistanceToNow, format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { AudioRecorder } from '@/components/ui/AudioRecorder'
import { WhatsAppInputBar } from '@/components/ui/WhatsAppInputBar'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { MessageActions } from '@/components/ui/MessageActions'
import { ReadReceiptTrigger } from '@/components/ui/ReadReceiptTrigger'
import toast from 'react-hot-toast'

type ClassItem = { id: string; name: string }
type StudentItem = { id: string; first_name: string; last_name: string; classes: { name: string } | null }
type TeacherItem = { id: string; full_name: string }

type Props = {
  currentUserId: string
  classes: ClassItem[]
  students: StudentItem[]
  teachers?: TeacherItem[]
  recentCommunications?: any[]
}

export function CommunicationManager({ currentUserId, classes, students, teachers = [], recentCommunications = [] }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const initialStudentId = searchParams.get('student_id')
  
  const [recipientType, setRecipientType] = useState(initialStudentId ? 'parent' : 'all')
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedParent, setSelectedParent] = useState(initialStudentId || '')
  const [selectedEnseignant, setSelectedEnseignant] = useState('')
  const [sendSmsOption, setSendSmsOption] = useState(false)
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

  const handleSend = (payload: { text: string; audioUrl: string | null; fileUrl?: string | null; fileType?: string | null }) => {
    setSuccess(false)
    setError(null)
    const formData = new FormData()
    formData.append('recipientType', recipientType)
    formData.append('subject', 'Message de l\'administration')
    formData.append('message', payload.text || 'Message vocal')
    if (recipientType === 'class') formData.append('selectedClass', selectedClass)
    if (recipientType === 'parent') formData.append('selectedParent', selectedParent)
    if (recipientType === 'enseignant') formData.append('selectedEnseignant', selectedEnseignant)
    if (sendSmsOption) formData.append('sendSms', 'true')
    if (payload.audioUrl) formData.append('audioUrl', payload.audioUrl)
    if (payload.fileUrl) formData.append('fileUrl', payload.fileUrl)
    if (payload.fileType) formData.append('fileType', payload.fileType)
    if ((payload as any).originalFileName) formData.append('originalFileName', (payload as any).originalFileName)
    
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
        setSelectedParent('')
        setSelectedEnseignant('')
      }
    })
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-[var(--color-surface)]">
      <div className="max-w-[1280px] mx-auto space-y-6">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[var(--color-surface-container-lowest)] p-6 rounded-xl border border-[var(--color-outline-variant)]">
          <div>
            <div className="flex items-center gap-2 text-[var(--color-on-surface-variant)] mb-2">
              <span className="text-sm font-semibold text-[var(--color-on-surface)]">Communication</span>
            </div>
            <h2 className="text-3xl font-bold text-[var(--color-on-surface)]">Centre de Communication</h2>
            <p className="text-base text-[var(--color-on-surface-variant)] mt-1">
              Envoyez des messages, SMS et notifications aux parents, enseignants et plus.
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
          {/* Nouveau Message Form Style WhatsApp */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-[var(--color-outline-variant)] shadow-sm overflow-hidden flex flex-col h-[600px]">
            {/* Header / Destinataires */}
            <div className="p-3 border-b border-[var(--color-outline-variant)] bg-[var(--color-surface-bright)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--color-primary-container)] text-[var(--color-primary)] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">
                    {recipientType === 'all' || recipientType === 'class' || recipientType === 'parent' ? 'family_restroom' : 'school'}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-[var(--color-on-surface)]">
                    Contacter
                  </span>
                  <span className="text-[11px] text-[var(--color-on-surface-variant)]">En ligne</span>
                </div>
              </div>
              <select 
                value={recipientType}
                onChange={(e) => setRecipientType(e.target.value)}
                className="text-xs bg-transparent border-none outline-none font-semibold text-[var(--color-primary)] cursor-pointer"
              >
                <optgroup label="Parents">
                  <option value="all">Tous les parents</option>
                  <option value="class">Parents d'une classe</option>
                  <option value="parent">Parent d'un élève</option>
                </optgroup>
                <optgroup label="Enseignants">
                  <option value="all_teachers">Tous les enseignants</option>
                  <option value="enseignant">Un enseignant précis</option>
                </optgroup>
              </select>
            </div>

            {/* Zone de sélection additionnelle (classe, parent, enseignant) */}
            <div className="flex flex-col border-b border-[var(--color-outline-variant)] bg-[#f0f2f5]">
              {recipientType === 'class' && (
                <div className="px-3 py-2">
                  <select 
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full h-10 px-3 border border-[var(--color-outline-variant)] rounded-lg text-sm focus:border-[var(--color-primary)] outline-none bg-white"
                  >
                    <option value="">Sélectionner une classe...</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}
              {recipientType === 'parent' && (
                <div className="px-3 py-2">
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
              {recipientType === 'enseignant' && (
                <div className="px-3 py-2">
                  <SearchableSelect 
                    value={selectedEnseignant}
                    onChange={(val) => setSelectedEnseignant(val)}
                    placeholder="Sélectionner l'enseignant..."
                    options={teachers.map(t => ({
                      value: t.id,
                      label: t.full_name
                    }))}
                  />
                </div>
              )}

              {/* SMS uniquement pour les parents */}
              {(recipientType === 'all' || recipientType === 'class' || recipientType === 'parent') && (
                <div className="px-4 py-2 border-t border-[var(--color-outline-variant)] flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="sendSms" 
                    checked={sendSmsOption}
                    onChange={(e) => setSendSmsOption(e.target.checked)}
                    className="w-4 h-4 rounded border-[var(--color-outline-variant)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                  />
                  <label htmlFor="sendSms" className="text-xs font-semibold text-[var(--color-on-surface-variant)] cursor-pointer">
                    Envoyer aussi par SMS (coûts applicables)
                  </label>
                </div>
              )}
            </div>

            {/* Zone centrale (Background WhatsApp) */}
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
              placeholder={
                (recipientType === 'class' && !selectedClass) ||
                (recipientType === 'parent' && !selectedParent) ||
                (recipientType === 'enseignant' && !selectedEnseignant)
                  ? "Sélectionnez d'abord un destinataire..."
                  : "Message"
              } 
            />
          </div>

          {/* Sidebar Historique */}
          <div className="bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-outline-variant)] shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-4 border-b border-[var(--color-outline-variant)] bg-[var(--color-surface-bright)]">
              <h3 className="font-bold text-[var(--color-on-surface)] flex items-center gap-2">
                <span className="material-symbols-outlined text-[var(--color-on-surface-variant)]">history</span>
                Historique Récent
              </h3>
            </div>
            <div className="p-4 flex flex-col gap-4 flex-1 bg-[var(--color-surface)]">
              {(() => {
                const unreadIds = recentCommunications
                  .filter(msg => msg.sender_id !== currentUserId && !(msg.read_by || []).includes(currentUserId))
                  .map(msg => msg.id);
                
                return <ReadReceiptTrigger messageIds={unreadIds} />
              })()}

              {recentCommunications.length === 0 ? (
                <div className="text-center text-sm text-[var(--color-on-surface-variant)] py-8">
                  Aucun message récent.
                </div>
              ) : (
                recentCommunications.slice(0, 5).map(comm => {
                  const deletedBy = comm.deleted_by || []
                  if (deletedBy.includes(currentUserId)) return null

                  const isSentByMe = comm.sender_id === currentUserId
                  
                  let recipientText = ''
                  if (comm.recipient_type === 'all') recipientText = 'Tous les parents'
                  else if (comm.recipient_type === 'all_teachers') recipientText = 'Tous les enseignants'
                  else if (comm.recipient_type === 'class') {
                    const c = classes.find(cl => cl.id === comm.recipient_id)
                    recipientText = c ? `Classe ${c.name}` : 'Classe'
                  } else if (comm.recipient_type === 'parent') {
                    recipientText = 'Parent d\'un élève'
                  } else if (comm.recipient_type === 'enseignant') {
                    const t = teachers.find(te => te.id === comm.recipient_id)
                    recipientText = t ? t.full_name : 'Enseignant'
                  } else if (comm.recipient_type === 'admin') {
                    recipientText = 'Administration'
                  }

                  const readBy = comm.read_by || []
                  const isRead = readBy.length > 0 && (!isSentByMe ? readBy.includes(currentUserId) : true)
                  const isDeletedForEveryone = comm.is_deleted_for_everyone === true

                  return (
                    <div key={comm.id} className={`flex w-full ${isSentByMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] flex flex-col gap-1 ${isSentByMe ? 'items-end' : 'items-start'}`}>
                        {/* Bulle WhatsApp */}
                        <div className={`relative group rounded-2xl shadow-sm overflow-visible ${
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
                                const contentStr = comm.content || '';
                                const parts = contentStr.split('|||FILE|||');
                                const displayContent = parts[0];
                                let fileUrl, fileType, fileName = 'Pièce jointe';
                                
                                if (parts[1]) {
                                  const fileParts = parts[1].split('|||');
                                  fileUrl = fileParts[0];
                                  fileType = fileParts[1];
                                  let originalName = fileParts[2];
                                  
                                  if (originalName) {
                                    fileName = originalName;
                                  } else {
                                    try {
                                      const path = new URL(fileUrl).pathname;
                                      let extractedName = decodeURIComponent(path.split('/').pop() || '');
                                      if (extractedName) fileName = extractedName.replace(/_\d+\./, '.');
                                    } catch (e) {}
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
                                <div className={`flex items-center gap-2 px-3 py-2 min-w-[200px] pr-6 ${
                                  comm.content && comm.content !== 'Message vocal' ? 'border-t border-black/5' : ''
                                }`}>
                                  <span className="material-symbols-outlined text-[20px] text-[var(--color-primary)] shrink-0">mic</span>
                                  <audio src={comm.audio_url} controls className="h-7 w-full flex-1" style={{ colorScheme: 'light' }} />
                                </div>
                              )}
                            </>
                          )}

                          {/* Heure + coches dans la bulle */}
                          <div className={`flex items-center justify-end gap-1 pr-2 pb-1.5 ${
                            isDeletedForEveryone || ((!comm.content || comm.content === 'Message vocal') && !comm.audio_url) ? 'pt-1' : ''
                          }`}>
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

                        {isSentByMe && recipientText ? (
                          <span className="text-[10px] text-[var(--color-on-surface-variant)] px-1">
                            À : {recipientText}
                          </span>
                        ) : !isSentByMe ? (
                          <span className="text-[10px] text-[var(--color-on-surface-variant)] px-1">
                            De: Parent/Enseignant
                          </span>
                        ) : null}
                      </div>
                    </div>
                  )
                })
              )}

              {recentCommunications.length > 5 && (
                <div className="mt-auto pt-6 border-t border-[var(--color-outline-variant)]">
                  <Link href="/admin/communication/historique" className="w-full inline-block text-center text-sm font-semibold text-[var(--color-primary)] hover:underline">
                    Voir tout l'historique
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
