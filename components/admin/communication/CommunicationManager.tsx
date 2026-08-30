'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { sendCommunication } from '@/app/actions/communication'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { AudioRecorder } from '@/components/ui/AudioRecorder'
import { SearchableSelect } from '@/components/ui/SearchableSelect'

type ClassItem = { id: string; name: string }
type StudentItem = { id: string; first_name: string; last_name: string; classes: { name: string } | null }

type Props = {
  currentUserId: string
  classes: ClassItem[]
  students: StudentItem[]
  recentCommunications?: any[]
}

export function CommunicationManager({ currentUserId, classes, students, recentCommunications = [] }: Props) {
  const [recipientType, setRecipientType] = useState('all') // all, class, parent
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedParent, setSelectedParent] = useState('')
  const [sendSmsOption, setSendSmsOption] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  
  const [isPending, startTransition] = useTransition()
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  // Auto-refresh the page data every 10 seconds to get new messages without a hard reload
  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh()
    }, 10000)
    return () => clearInterval(interval)
  }, [router])

  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSuccess(false)
    setError(null)
    const form = e.currentTarget
    const formData = new FormData(form)
    formData.append('recipientType', recipientType)
    if (recipientType === 'class') formData.append('selectedClass', selectedClass)
    if (recipientType === 'parent') formData.append('selectedParent', selectedParent)
    if (sendSmsOption) formData.append('sendSms', 'true')
    if (audioUrl) formData.append('audioUrl', audioUrl)
    
    startTransition(async () => {
      const result = await sendCommunication(formData)
      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
        form.reset()
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
            <p className="text-base text-[var(--color-on-surface-variant)] mt-1">Envoyez des messages, SMS et notifications aux parents d'élèves.</p>
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
          {/* Nouveau Message Form */}
          <div className="lg:col-span-2 bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-outline-variant)] shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-[var(--color-outline-variant)] bg-[var(--color-surface-bright)]">
              <h3 className="font-bold text-[var(--color-on-surface)] flex items-center gap-2">
                <span className="material-symbols-outlined text-[var(--color-primary)]">send</span>
                Nouveau Message
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
              
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[var(--color-on-surface)]">Destinataires</label>
                <select 
                  value={recipientType}
                  onChange={(e) => setRecipientType(e.target.value)}
                  className="w-full h-12 px-4 border border-[var(--color-outline-variant)] rounded-lg text-base focus:border-[var(--color-primary)] outline-none bg-[var(--color-surface)]"
                >
                  <option value="all">Tous les parents</option>
                  <option value="class">Une classe spécifique</option>
                  <option value="parent">Parent d'un élève précis</option>
                </select>
              </div>

              {recipientType === 'class' && (
                <div className="flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-2">
                  <label className="text-sm font-semibold text-[var(--color-on-surface)]">Sélectionnez la classe</label>
                  <select 
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full h-12 px-4 border border-[var(--color-outline-variant)] rounded-lg text-base focus:border-[var(--color-primary)] outline-none bg-[var(--color-surface)]"
                    required
                  >
                    <option value="">Sélectionner...</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}

              {recipientType === 'parent' && (
                <div className="flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-2">
                  <label className="text-sm font-semibold text-[var(--color-on-surface)]">Rechercher un élève (pour contacter son parent)</label>
                  <SearchableSelect 
                    value={selectedParent}
                    onChange={(val) => setSelectedParent(val)}
                    placeholder="Taper le nom de l'élève..."
                    required
                    options={students.map(s => ({
                      value: s.id,
                      label: `Parent de ${s.first_name} ${s.last_name} ${s.classes?.name ? `(${s.classes.name})` : ''}`
                    }))}
                  />
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[var(--color-on-surface)]">Objet</label>
                <input 
                  type="text" 
                  name="subject"
                  placeholder="Objet du message..." 
                  className="w-full h-12 px-4 border border-[var(--color-outline-variant)] rounded-lg text-base focus:border-[var(--color-primary)] outline-none bg-[var(--color-surface)]"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[var(--color-on-surface)]">Message texte (Optionnel si vocal)</label>
                <textarea 
                  name="message"
                  placeholder="Rédigez votre message ici..." 
                  className="w-full p-4 border border-[var(--color-outline-variant)] rounded-lg text-base focus:border-[var(--color-primary)] outline-none bg-[var(--color-surface)] min-h-[120px]"
                ></textarea>
              </div>

              <div className="flex flex-col gap-1.5 border-t border-[var(--color-outline-variant)] pt-4 mt-2">
                <label className="text-sm font-semibold text-[var(--color-on-surface)]">Message vocal</label>
                <AudioRecorder onAudioReady={(url) => setAudioUrl(url)} />
              </div>

              <div className="flex items-center gap-2 mt-2">
                <input 
                  type="checkbox" 
                  id="sendSms" 
                  checked={sendSmsOption}
                  onChange={(e) => setSendSmsOption(e.target.checked)}
                  className="w-5 h-5 rounded border-[var(--color-outline-variant)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                />
                <label htmlFor="sendSms" className="text-sm font-semibold text-[var(--color-on-surface)] cursor-pointer">
                  Envoyer également une notification par SMS (coûts applicables)
                </label>
              </div>

              <div className="flex justify-end gap-3 mt-2">
                <button 
                  type="submit" 
                  disabled={isPending}
                  className="bg-[var(--color-primary)] text-white px-8 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[20px]">send</span>
                  {isPending ? 'Envoi en cours...' : 'Envoyer le message'}
                </button>
              </div>
            </form>
          </div>

          {/* Sidebar Info/Historique Rapide */}
          <div className="bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-outline-variant)] shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-4 border-b border-[var(--color-outline-variant)] bg-[var(--color-surface-bright)]">
              <h3 className="font-bold text-[var(--color-on-surface)] flex items-center gap-2">
                <span className="material-symbols-outlined text-[var(--color-on-surface-variant)]">history</span>
                Historique Récent
              </h3>
            </div>
            <div className="p-4 flex flex-col gap-4 flex-1 bg-[var(--color-surface)]">
              {recentCommunications.length === 0 ? (
                <div className="text-center text-sm text-[var(--color-on-surface-variant)] py-8">
                  Aucun message récent.
                </div>
              ) : (
                recentCommunications.slice(0, 5).map(comm => {
                  const isSentByMe = comm.sender_id === currentUserId
                  
                  let recipientText = ''
                  if (comm.recipient_type === 'all') recipientText = 'Tous les parents'
                  else if (comm.recipient_type === 'class') {
                    const c = classes.find(cl => cl.id === comm.recipient_id)
                    recipientText = c ? `Classe ${c.name}` : 'Classe inconnue'
                  } else if (comm.recipient_type === 'parent') {
                    recipientText = 'Parent(s) d\'un élève'
                  } else if (comm.recipient_type === 'admin') {
                    recipientText = 'Administration'
                  }

                  return (
                    <div key={comm.id} className={`flex w-full ${isSentByMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] flex flex-col gap-1 ${isSentByMe ? 'items-end' : 'items-start'}`}>
                        {/* Bubble */}
                        <div className={`p-3 rounded-2xl ${isSentByMe ? 'bg-[#dcf8c6] text-[#0b1c30] rounded-tr-sm' : 'bg-white border border-[var(--color-outline-variant)] text-[#0b1c30] rounded-tl-sm shadow-sm'}`}>
                          {comm.subject && comm.subject !== 'Message vocal' && (
                            <h4 className="font-bold text-sm mb-1">{comm.subject}</h4>
                          )}
                          {comm.content && comm.content !== 'Message vocal' && (
                            <p className="text-sm whitespace-pre-wrap">{comm.content}</p>
                          )}
                          
                          {comm.audio_url && (
                            <div className="mt-2 min-w-[200px]">
                              <audio controls src={comm.audio_url} className="w-full h-8" />
                            </div>
                          )}
                        </div>
                        {/* Metadata */}
                        <div className="text-[10px] text-[var(--color-on-surface-variant)] flex items-center gap-1">
                          {isSentByMe ? (
                            <>
                              <span>À: {recipientText}</span>
                              <span>•</span>
                              <span>{formatDistanceToNow(new Date(comm.created_at), { locale: fr })}</span>
                              <span className="material-symbols-outlined text-[12px] text-blue-500">done_all</span>
                            </>
                          ) : (
                            <>
                              <span>{formatDistanceToNow(new Date(comm.created_at), { locale: fr })}</span>
                              <span>•</span>
                              <span>De: {recipientText}</span>
                            </>
                          )}
                        </div>
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
