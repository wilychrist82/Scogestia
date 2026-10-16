'use client'

import { useState, useTransition, useEffect, FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { sendCommunication } from '@/app/actions/communication'
import { formatDistanceToNow, format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { AudioRecorder } from '@/components/ui/AudioRecorder'
import { WhatsAppInputBar } from '@/components/ui/WhatsAppInputBar'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { MessageActions } from '@/components/ui/MessageActions'
import { ReadReceiptTrigger } from '@/components/ui/ReadReceiptTrigger'
import toast from 'react-hot-toast'
import { CommunicationNavTabs } from './CommunicationNavTabs'
import { AlertCircle, CheckCircle2, Users, School, History, Ban, FileText, Mic, ChevronDown, Check, GraduationCap, Sparkles } from 'lucide-react'

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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  // Fermeture du menu de sélection au clic extérieur
  useEffect(() => {
    if (!isDropdownOpen) return
    const handleClickOutside = () => setIsDropdownOpen(false)
    window.addEventListener('click', handleClickOutside)
    return () => window.removeEventListener('click', handleClickOutside)
  }, [isDropdownOpen])

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

    // Marquer l'horodatage d'envoi pour bloquer les auto-alertes sonores
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('scogestia_last_sent_msg_time', Date.now().toString())
    }

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
        
        {/* Navigation Tabs */}
        <CommunicationNavTabs />

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200/60">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                Échanges & Messagerie directe
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Centre de Communication
            </h1>
            <p className="text-sm text-slate-500 mt-1 font-medium">
              Envoyez des messages directs, diffusions ciblées et notifications aux parents et enseignants.
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-[var(--color-status-retard-bg)] text-[var(--color-status-retard-text)] p-4 rounded-xl border border-[var(--color-status-retard-text)] text-sm font-semibold flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {success && (
          <div className="bg-[#e6f4ea] text-[#1e8e3e] p-4 rounded-xl border border-[#ceead6] text-sm font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            Message envoyé avec succès.
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Nouveau Message Form Style WhatsApp */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-[var(--color-outline-variant)] shadow-sm overflow-hidden flex flex-col h-[600px]">
            {/* Header / Destinataires */}
            <div className="p-3.5 border-b border-slate-200/90 bg-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 via-amber-600 to-emerald-700 text-white flex items-center justify-center shadow-xs">
                    {recipientType === 'all' || recipientType === 'class' || recipientType === 'parent' ? (
                      <Users className="w-5 h-5 text-white" />
                    ) : (
                      <School className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                    Contacter
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-full">
                      <Sparkles size={10} className="text-amber-600" />
                      Messagerie active
                    </span>
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">Canal instantané & notifications</span>
                </div>
              </div>

              {/* Sélecteur de Destinataires Customisé */}
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="inline-flex items-center gap-2 h-9 px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-800 text-xs font-semibold shadow-2xs transition-all focus:outline-none"
                >
                  <span className="text-slate-500 text-[11px] font-medium hidden sm:inline">Destinataire :</span>
                  <span className="text-slate-900 font-bold text-[12px]">
                    {recipientType === 'all' && 'Tous les parents'}
                    {recipientType === 'class' && 'Parents d\'une classe'}
                    {recipientType === 'parent' && 'Parent d\'un élève'}
                    {recipientType === 'all_teachers' && 'Tous les enseignants'}
                    {recipientType === 'enseignant' && 'Un enseignant précis'}
                  </span>
                  <ChevronDown
                    size={14}
                    className={`text-slate-500 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180 text-slate-900' : ''}`}
                  />
                </button>

                {isDropdownOpen && (
                  <>
                    {/* Backdrop pour fermer au clic en dehors */}
                    <div 
                      className="fixed inset-0 z-20" 
                      onClick={() => setIsDropdownOpen(false)} 
                    />
                    
                    <div className="absolute right-0 mt-2 w-68 bg-white rounded-2xl shadow-[0_16px_40px_rgba(15,23,42,0.16)] border border-slate-200 p-2 z-30 animate-in fade-in zoom-in-95 duration-150">
                      {/* GROUPE PARENTS */}
                      <div className="px-2.5 py-1.5 mb-1 rounded-lg bg-slate-100/90 border border-slate-200/70 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Users size={13} className="text-slate-900" />
                          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-900">Parents</span>
                        </div>
                        <span className="text-[10px] font-medium text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200/60">Familles</span>
                      </div>
                      <div className="space-y-0.5">
                        <button
                          type="button"
                          onClick={() => { setRecipientType('all'); setIsDropdownOpen(false) }}
                          className={`w-full text-left px-3 py-2 rounded-xl text-[12.5px] font-semibold flex items-center justify-between transition-colors ${
                            recipientType === 'all' 
                              ? 'bg-slate-900 text-white font-bold shadow-xs' 
                              : 'text-slate-800 hover:bg-slate-100 hover:text-slate-950'
                          }`}
                        >
                          <span>Tous les parents</span>
                          {recipientType === 'all' && <Check size={14} className="text-white" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => { setRecipientType('class'); setIsDropdownOpen(false) }}
                          className={`w-full text-left px-3 py-2 rounded-xl text-[12.5px] font-semibold flex items-center justify-between transition-colors ${
                            recipientType === 'class' 
                              ? 'bg-slate-900 text-white font-bold shadow-xs' 
                              : 'text-slate-800 hover:bg-slate-100 hover:text-slate-950'
                          }`}
                        >
                          <span>Parents d'une classe</span>
                          {recipientType === 'class' && <Check size={14} className="text-white" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => { setRecipientType('parent'); setIsDropdownOpen(false) }}
                          className={`w-full text-left px-3 py-2 rounded-xl text-[12.5px] font-semibold flex items-center justify-between transition-colors ${
                            recipientType === 'parent' 
                              ? 'bg-slate-900 text-white font-bold shadow-xs' 
                              : 'text-slate-800 hover:bg-slate-100 hover:text-slate-950'
                          }`}
                        >
                          <span>Parent d'un élève</span>
                          {recipientType === 'parent' && <Check size={14} className="text-white" />}
                        </button>
                      </div>

                      <div className="h-px bg-slate-100 my-1.5" />

                      {/* GROUPE ENSEIGNANTS */}
                      <div className="px-2.5 py-1.5 mb-1 rounded-lg bg-slate-100/90 border border-slate-200/70 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <GraduationCap size={13} className="text-slate-900" />
                          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-900">Enseignants</span>
                        </div>
                        <span className="text-[10px] font-medium text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200/60">Équipe</span>
                      </div>
                      <div className="space-y-0.5">
                        <button
                          type="button"
                          onClick={() => { setRecipientType('all_teachers'); setIsDropdownOpen(false) }}
                          className={`w-full text-left px-3 py-2 rounded-xl text-[12.5px] font-semibold flex items-center justify-between transition-colors ${
                            recipientType === 'all_teachers' 
                              ? 'bg-slate-900 text-white font-bold shadow-xs' 
                              : 'text-slate-800 hover:bg-slate-100 hover:text-slate-950'
                          }`}
                        >
                          <span>Tous les enseignants</span>
                          {recipientType === 'all_teachers' && <Check size={14} className="text-white" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => { setRecipientType('enseignant'); setIsDropdownOpen(false) }}
                          className={`w-full text-left px-3 py-2 rounded-xl text-[12.5px] font-semibold flex items-center justify-between transition-colors ${
                            recipientType === 'enseignant' 
                              ? 'bg-slate-900 text-white font-bold shadow-xs' 
                              : 'text-slate-800 hover:bg-slate-100 hover:text-slate-950'
                          }`}
                        >
                          <span>Un enseignant précis</span>
                          {recipientType === 'enseignant' && <Check size={14} className="text-white" />}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
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
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden flex flex-col h-full">
            <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <History className="w-4 h-4 text-amber-600" />
                Historique Récent
              </h3>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-full">
                5 derniers
              </span>
            </div>
            <div className="p-4 flex flex-col gap-4 flex-1 bg-slate-50/30">
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
                              <Ban className="w-4 h-4" />
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
                                  const originalName = fileParts[2];
                                  
                                  if (originalName) {
                                    fileName = originalName;
                                  } else {
                                    try {
                                      const path = new URL(fileUrl).pathname;
                                      const extractedName = decodeURIComponent(path.split('/').pop() || '');
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
                                            <FileText className="w-5 h-5 text-gray-600" />
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
                                }}`}>
                                  <Mic className="w-5 h-5 text-[var(--color-primary)] shrink-0" />
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
                          <span className="text-[10px] font-semibold text-slate-500 bg-slate-100/80 px-2 py-0.5 rounded-full border border-slate-200/50">
                            À : {recipientText}
                          </span>
                        ) : !isSentByMe ? (
                          <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/50">
                            De : Parent / Enseignant
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
