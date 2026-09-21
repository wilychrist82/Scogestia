import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { ParentMessageForm } from '@/components/parent/communication/ParentMessageForm'
import { AutoRefresh } from '@/components/ui/AutoRefresh'

import { ReadReceiptTrigger } from '@/components/ui/ReadReceiptTrigger'
import { MessageActions } from '@/components/ui/MessageActions'

export const dynamic = 'force-dynamic'

export default async function ParentMessagesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: roleData } = await supabase
    .from('user_school_roles')
    .select('school_id')
    .eq('user_id', user.id)
    .eq('role', 'parent')
    .limit(1).maybeSingle()

  if (!roleData) redirect('/')

  const schoolId = roleData.school_id

  // Get parent's children's classes to filter class messages
  const { data: links } = await supabase
    .from('parent_student_links')
    .select(`
      student_id,
      students!inner(class_id)
    `)
    .eq('parent_user_id', user.id)
    .eq('school_id', schoolId)

  const classIds = links?.map(l => (l.students as any).class_id).filter(Boolean) || []

  // Build the OR query for RLS or just direct query. RLS is already handling it, but let's be explicit.
  // Actually, since RLS is enabled, we can just query all communications for this school, and RLS will filter out what the parent shouldn't see!
  const { data: messages } = await supabase
    .from('communications')
    .select('*')
    .eq('school_id', schoolId)
    .order('created_at', { ascending: false })
    
  const unreadMessageIds = messages
    ? messages.filter(msg => msg.sender_id !== user.id && !(msg.read_by || []).includes(user.id)).map(msg => msg.id)
    : []

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-[#f0f2f5]">
      <AutoRefresh />
      <ReadReceiptTrigger messageIds={unreadMessageIds} />
      
      {/* Header */}
      <div className="shrink-0 bg-[var(--color-surface)] px-4 py-3 flex items-center shadow-sm z-10 border-b border-[var(--color-outline-variant)]">
        <div>
          <h2 className="text-xl font-bold text-[var(--color-on-surface)]">Messages</h2>
          <p className="text-xs text-[var(--color-on-surface-variant)] mt-0.5">Contactez l'administration de l'école.</p>
        </div>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col-reverse custom-scrollbar">
        <div className="space-y-4 max-w-3xl mx-auto w-full">
          {!messages || messages.length === 0 ? (
            <div className="bg-[var(--color-surface-container-lowest)] p-12 rounded-xl border border-[var(--color-outline-variant)] text-center my-auto">
              <span className="material-symbols-outlined text-5xl text-[var(--color-on-surface-variant)] mb-4 opacity-50">drafts</span>
              <h3 className="text-xl font-bold text-[var(--color-on-surface)]">Aucun message</h3>
              <p className="text-[var(--color-on-surface-variant)] mt-2">Vous n'avez reçu aucun message pour le moment.</p>
            </div>
          ) : (
            [...messages].reverse().map(msg => {
              // Filtrer si j'ai supprimé pour moi
              const deletedBy = msg.deleted_by || []
              if (deletedBy.includes(user.id)) return null

              const isSentByMe = msg.sender_id === user.id
              const senderText = isSentByMe ? 'Vous' : 'Administration'
              const readBy = msg.read_by || []
              const isRead = readBy.length > 0 && (!isSentByMe ? readBy.includes(user.id) : true)
              const isDeletedForEveryone = msg.is_deleted_for_everyone === true

              return (
                <div key={msg.id} className={`flex w-full ${isSentByMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] sm:max-w-[70%] flex flex-col gap-1 ${isSentByMe ? 'items-end' : 'items-start'}`}>

                    {/* Bubble */}
                    <div className={`relative group rounded-2xl shadow-sm overflow-visible ${
                      isSentByMe
                        ? 'bg-[#dcf8c6] text-[#0b1c30] rounded-tr-sm'
                        : 'bg-white border border-[var(--color-outline-variant)] text-[#0b1c30] rounded-tl-sm'
                    }`}>

                      <MessageActions messageId={msg.id} isSentByMe={isSentByMe} />

                      {isDeletedForEveryone ? (
                        <div className="px-3 py-2 text-[14px] text-gray-500 italic flex items-center gap-2">
                          <span className="material-symbols-outlined text-[18px]">block</span>
                          Ce message a été supprimé
                        </div>
                      ) : (
                        <>
                          {/* Texte et Fichiers */}
                          {(() => {
                            const contentStr = msg.content || '';
                            const parts = contentStr.split('|||FILE|||');
                            const displayContent = parts[0];
                            let fileUrl, fileType, fileName = 'Pièce jointe';
                            
                            if (parts[1]) {
                              const fileParts = parts[1].split('|||');
                              fileUrl = fileParts[0];
                              fileType = fileParts[1];
                              try {
                                const path = new URL(fileUrl).pathname;
                                let extractedName = decodeURIComponent(path.split('/').pop() || '');
                                if (extractedName) fileName = extractedName.replace(/_\d+\./, '.');
                              } catch (e) {}
                            }
                            
                            return (
                              <>
                                {displayContent && displayContent !== 'Message vocal' && (
                                  <div className="px-3 pt-2.5 pb-1">
                                    {msg.subject && msg.subject !== 'Message vocal' && msg.subject !== 'Message parent' && (
                                      <p className="text-[13px] font-bold mb-0.5 pr-6">{msg.subject}</p>
                                    )}
                                    <p className="text-[15px] whitespace-pre-wrap leading-relaxed pr-6">{displayContent}</p>
                                  </div>
                                )}
                                {fileUrl && (
                                  <div className="px-2 pt-1 pb-1 pr-6">
                                    {fileType?.startsWith('image/') ? (
                                      <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                                        <img src={fileUrl} alt={fileName} className="max-w-full h-auto rounded-lg max-h-48 object-cover border border-black/10" />
                                      </a>
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

                          {/* Message vocal – style WhatsApp */}
                          {msg.audio_url && (
                            <div className={`flex items-center gap-2 px-3 py-2 min-w-[200px] pr-6 ${
                              msg.content && msg.content !== 'Message vocal' ? 'border-t border-black/5' : ''
                            }`}>
                              <span className="material-symbols-outlined text-[22px] text-[var(--color-primary)] shrink-0">mic</span>
                              <audio
                                src={msg.audio_url}
                                controls
                                className="h-8 w-full flex-1"
                                style={{ colorScheme: 'light' }}
                              />
                            </div>
                          )}
                        </>
                      )}

                      {/* Heure + coches DANS la bulle, alignés à droite en bas */}
                      <div className={`flex items-center justify-end gap-1 pr-2 pb-1.5 ${
                        isDeletedForEveryone || ((!msg.content || msg.content === 'Message vocal') && !msg.audio_url) ? 'pt-1' : ''
                      }`}>
                        <span className="text-[11px] text-[var(--color-on-surface-variant)]">
                          {format(new Date(msg.created_at), 'HH:mm', { locale: fr })}
                        </span>
                        {isSentByMe && (
                          // Double coche SVG – gris si non lu, bleu si lu
                          <svg
                            width="16" height="11" viewBox="0 0 16 11"
                            fill="none" xmlns="http://www.w3.org/2000/svg"
                            className="shrink-0"
                            aria-label={isRead ? 'Lu' : 'Envoyé'}
                          >
                            {/* Première coche (fond) */}
                            <path
                              d="M1 5.5L4.5 9L11 2"
                              stroke={isRead ? '#53bdeb' : '#8696a0'}
                              strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                            />
                            {/* Deuxième coche (décalée) */}
                            <path
                              d="M5 5.5L8.5 9L15 2"
                              stroke={isRead ? '#53bdeb' : '#8696a0'}
                              strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </div>
                    </div>

                    {/* Expéditeur sous la bulle (messages reçus seulement) */}
                    {!isSentByMe && (
                      <span className="text-[11px] text-[var(--color-on-surface-variant)] px-1">{senderText}</span>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="shrink-0 bg-[var(--color-surface)]">
        <div className="max-w-3xl mx-auto w-full">
          <ParentMessageForm />
        </div>
      </div>
    </div>
  )
}
