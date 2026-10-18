'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { sendCommunication } from '@/app/actions/communication'
import { format, isToday, isYesterday } from 'date-fns'
import { fr } from 'date-fns/locale'
import { WhatsAppInputBar } from '@/components/ui/WhatsAppInputBar'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { MessageActions } from '@/components/ui/MessageActions'
import { ReadReceiptTrigger } from '@/components/ui/ReadReceiptTrigger'
import toast from 'react-hot-toast'
import { CommunicationNavTabs } from './CommunicationNavTabs'
import {
  AlertCircle,
  CheckCircle2,
  Users,
  School,
  Ban,
  FileText,
  Mic,
  GraduationCap,
  UserCheck,
  User,
  MessageSquare,
  Download,
  X,
  ArrowRight,
} from 'lucide-react'

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

type RecipientType = 'all' | 'class' | 'parent' | 'all_teachers' | 'enseignant'

const RECIPIENT_OPTIONS: { value: RecipientType; label: string; icon: typeof Users }[] = [
  { value: 'all', label: 'Tous les parents', icon: Users },
  { value: 'class', label: 'Une classe', icon: School },
  { value: 'parent', label: 'Un élève', icon: User },
  { value: 'all_teachers', label: 'Tous les profs', icon: GraduationCap },
  { value: 'enseignant', label: 'Un prof', icon: UserCheck },
]

const AVATAR_TONES = [
  'bg-emerald-100 text-emerald-900 ring-emerald-300',
  'bg-sky-100 text-sky-900 ring-sky-300',
  'bg-violet-100 text-violet-900 ring-violet-300',
  'bg-amber-100 text-amber-900 ring-amber-300',
  'bg-rose-100 text-rose-900 ring-rose-300',
  'bg-teal-100 text-teal-900 ring-teal-300',
]

const avatarTone = (seed: string) => {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return AVATAR_TONES[h % AVATAR_TONES.length]
}

const initialsOf = (label: string) => {
  const parts = label.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/** Découpe le contenu stocké en texte + pièce jointe éventuelle. */
const parseContent = (comm: any) => {
  const contentStr = comm.content || ''
  const parts = contentStr.split('|||FILE|||')
  const displayContent: string = parts[0]
  let fileUrl: string | undefined
  let fileType: string | undefined
  let fileName = 'Pièce jointe'

  if (parts[1]) {
    const fileParts = parts[1].split('|||')
    fileUrl = fileParts[0]
    fileType = fileParts[1]
    const originalName = fileParts[2]

    if (originalName) {
      fileName = originalName
    } else {
      try {
        const path = new URL(fileUrl as string).pathname
        const extractedName = decodeURIComponent(path.split('/').pop() || '')
        if (extractedName) fileName = extractedName.replace(/_\d+\./, '.')
      } catch (e) {}
    }
  }
  return { displayContent, fileUrl, fileType, fileName }
}

const dayLabel = (d: Date) => {
  if (isToday(d)) return "Aujourd'hui"
  if (isYesterday(d)) return 'Hier'
  const s = format(d, 'EEEE d MMMM', { locale: fr })
  return s.charAt(0).toUpperCase() + s.slice(1)
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

  const [activeThread, setActiveThread] = useState<string | null>(null)
  const chatScrollRef = useRef<HTMLDivElement>(null)

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

  // ── Présentation : libellés, fils de discussion, fil actif ──
  const recipientLabelOf = (comm: any) => {
    if (comm.recipient_type === 'all') return 'Tous les parents'
    if (comm.recipient_type === 'all_teachers') return 'Tous les enseignants'
    if (comm.recipient_type === 'class') {
      const c = classes.find(cl => cl.id === comm.recipient_id)
      return c ? `Classe ${c.name}` : 'Classe'
    }
    if (comm.recipient_type === 'parent') return 'Parent d\'un élève'
    if (comm.recipient_type === 'enseignant') {
      const t = teachers.find(te => te.id === comm.recipient_id)
      return t ? t.full_name : 'Enseignant'
    }
    if (comm.recipient_type === 'admin') return 'Administration'
    return ''
  }

  const threadKeyOf = (comm: any) =>
    comm.sender_id !== currentUserId
      ? `from:${comm.sender_id}`
      : `${comm.recipient_type}:${comm.recipient_id || ''}`

  const unreadIds: string[] = recentCommunications
    .filter(msg => msg.sender_id !== currentUserId && !(msg.read_by || []).includes(currentUserId))
    .map(msg => msg.id)

  const visibleComms = recentCommunications.filter(c => !(c.deleted_by || []).includes(currentUserId))

  type Thread = { key: string; label: string; last: any; unread: number; comm: any }
  const threadMap = new Map<string, Thread>()
  visibleComms.forEach(comm => {
    const key = threadKeyOf(comm)
    const received = comm.sender_id !== currentUserId
    const label = received ? 'Parent / Enseignant' : recipientLabelOf(comm) || 'Conversation'
    const isUnread = received && !(comm.read_by || []).includes(currentUserId)
    const existing = threadMap.get(key)
    if (existing) {
      if (isUnread) existing.unread += 1
    } else {
      threadMap.set(key, { key, label, last: comm, unread: isUnread ? 1 : 0, comm })
    }
  })
  const threads = Array.from(threadMap.values())

  const openThread = (t: Thread) => {
    setActiveThread(t.key)
    const c = t.comm
    if (c.sender_id === currentUserId) {
      if (c.recipient_type === 'all' || c.recipient_type === 'all_teachers') {
        setRecipientType(c.recipient_type)
      } else if (c.recipient_type === 'class' && c.recipient_id) {
        setRecipientType('class')
        setSelectedClass(c.recipient_id)
      } else if (c.recipient_type === 'parent' && c.recipient_id) {
        setRecipientType('parent')
        setSelectedParent(c.recipient_id)
      } else if (c.recipient_type === 'enseignant' && c.recipient_id) {
        setRecipientType('enseignant')
        setSelectedEnseignant(c.recipient_id)
      }
    }
  }

  const feed = (activeThread ? visibleComms.filter(c => threadKeyOf(c) === activeThread) : visibleComms).slice().reverse()
  const activeThreadLabel = activeThread ? threads.find(t => t.key === activeThread)?.label : null
  const lastFeedId = feed.length > 0 ? feed[feed.length - 1].id : null

  useEffect(() => {
    const el = chatScrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [lastFeedId, activeThread])

  const studentLabel = (id: string) => {
    const s = students.find(st => st.id === id)
    return s ? `${s.first_name} ${s.last_name}` : ''
  }

  let targetLabel = 'Tous les parents'
  let targetHint = 'Diffusion à toutes les familles'
  let TargetIcon: typeof Users = Users
  if (recipientType === 'class') {
    const c = classes.find(cl => cl.id === selectedClass)
    targetLabel = c ? `Parents de la classe ${c.name}` : 'Parents d\'une classe'
    targetHint = c ? 'Diffusion à la classe' : 'Choisissez une classe à gauche'
    TargetIcon = School
  } else if (recipientType === 'parent') {
    const name = selectedParent ? studentLabel(selectedParent) : ''
    targetLabel = name ? `Parent de ${name}` : selectedParent ? 'Parent sélectionné' : 'Parent d\'un élève'
    targetHint = selectedParent ? 'Message direct' : 'Choisissez un élève à gauche'
    TargetIcon = User
  } else if (recipientType === 'all_teachers') {
    targetLabel = 'Tous les enseignants'
    targetHint = 'Diffusion à l\'équipe pédagogique'
    TargetIcon = GraduationCap
  } else if (recipientType === 'enseignant') {
    const t = teachers.find(te => te.id === selectedEnseignant)
    targetLabel = t ? t.full_name : 'Un enseignant précis'
    targetHint = t ? 'Message direct' : 'Choisissez un enseignant à gauche'
    TargetIcon = UserCheck
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-[var(--color-surface)]">
      <div className="max-w-[1280px] mx-auto space-y-6">

        {/* Navigation Tabs */}
        <CommunicationNavTabs />

        {/* Bannière Prestige */}
        <div className="relative flex flex-col justify-between gap-6 overflow-hidden rounded-3xl bg-[#050B18] p-6 shadow-[0_30px_80px_-30px_rgba(5,11,24,0.8)] ring-1 ring-white/10 sm:p-8 lg:flex-row lg:items-center">
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute -left-20 -top-32 h-[380px] w-[480px] rounded-full bg-emerald-500/20 blur-[120px]" />
            <div className="absolute -bottom-40 right-0 h-[340px] w-[440px] rounded-full bg-cyan-400/10 blur-[130px]" />
            <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_at_left,black_20%,transparent_75%)]" />
          </div>

          <div className="relative z-10 max-w-2xl">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-amber-300/10 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-amber-200 ring-1 ring-inset ring-amber-300/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)]">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-300 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-300" />
              </span>
              Échanges & Messagerie directe
            </span>
            <h1 className="text-2xl font-extrabold leading-[1.1] tracking-[-0.03em] text-white sm:text-3xl">
              Centre de Communication
            </h1>
            <p className="mt-2.5 max-w-xl text-sm font-medium leading-relaxed text-slate-200 sm:text-base">
              Envoyez des messages directs, diffusions ciblées et notifications aux parents et enseignants.
            </p>
          </div>

          <div className="relative z-10 flex flex-wrap items-center gap-2.5 self-start lg:self-center">
            {[
              { label: 'Non lus', value: unreadIds.length, cls: unreadIds.length > 0 ? 'text-emerald-300' : 'text-white' },
              { label: 'Conversations', value: threads.length, cls: 'text-white' },
              { label: 'Messages', value: visibleComms.length, cls: 'text-white' },
            ].map(s => (
              <div key={s.label} className="min-w-[104px] rounded-xl bg-white/[0.05] px-4 py-3 ring-1 ring-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] backdrop-blur-md">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-200">{s.label}</p>
                <p className={`text-lg font-extrabold leading-none tabular-nums tracking-tight ${s.cls}`}>{s.value}</p>
              </div>
            ))}
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

        {/* Messagerie à 2 panneaux */}
        <div className="grid grid-cols-1 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.06),0_20px_50px_-24px_rgba(15,23,42,0.25)] lg:h-[calc(100vh-17rem)] lg:min-h-[600px] lg:max-h-[780px] lg:grid-cols-[350px_minmax(0,1fr)]">

          {/* ── PANNEAU GAUCHE : destinataire + fils ── */}
          <aside className="flex min-h-0 flex-col border-b border-slate-200 bg-white max-lg:max-h-[460px] lg:border-b-0 lg:border-r">
            <div className="border-b border-slate-200 p-4">
              <h2 className="mb-3 text-base font-extrabold tracking-tight text-slate-900">Nouveau message</h2>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-700">Destinataire</p>
              <div role="radiogroup" aria-label="Type de destinataire" className="flex flex-wrap gap-1.5">
                {RECIPIENT_OPTIONS.map(({ value, label, icon: Icon }) => {
                  const active = recipientType === value
                  return (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setRecipientType(value)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
                        active
                          ? 'bg-emerald-700 text-white shadow-[0_4px_12px_-4px_rgba(4,120,87,0.7)]'
                          : 'bg-slate-100 text-slate-900 ring-1 ring-inset ring-slate-300 hover:bg-white hover:ring-emerald-600'
                      }`}
                    >
                      <Icon size={13} />
                      {label}
                    </button>
                  )
                })}
              </div>

              {recipientType === 'class' && (
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="mt-3 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-medium text-slate-900 outline-none transition-all focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/15"
                >
                  <option value="">Sélectionner une classe...</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              )}
              {recipientType === 'parent' && (
                <div className="mt-3">
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
                <div className="mt-3">
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
            </div>

            <div className="flex items-center justify-between px-4 pb-2 pt-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-700">Discussions</p>
              {activeThread && (
                <button
                  type="button"
                  onClick={() => setActiveThread(null)}
                  className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-900 ring-1 ring-inset ring-slate-300 hover:bg-white"
                >
                  <X size={12} /> Tout afficher
                </button>
              )}
            </div>

            <div className="min-h-0 flex-1 space-y-1 overflow-y-auto px-2 pb-2">
              {threads.length === 0 ? (
                <div className="px-4 py-10 text-center text-sm font-semibold text-slate-700">
                  Aucun message récent.
                </div>
              ) : (
                threads.map(t => {
                  const active = activeThread === t.key
                  const preview = (() => {
                    const last = t.last
                    if (last.is_deleted_for_everyone === true) return 'Ce message a été supprimé'
                    const { displayContent, fileUrl } = parseContent(last)
                    if (displayContent && displayContent !== 'Message vocal') return displayContent
                    if (last.audio_url) return '🎤 Message vocal'
                    if (fileUrl) return '📎 Pièce jointe'
                    return 'Message vocal'
                  })()
                  const sentByMe = t.last.sender_id === currentUserId
                  const when = new Date(t.last.created_at)
                  const type = t.comm.sender_id === currentUserId ? t.comm.recipient_type : 'from'
                  const GroupIcon = type === 'all' ? Users : type === 'class' ? School : type === 'all_teachers' ? GraduationCap : null

                  return (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => openThread(t)}
                      className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-all ${
                        active
                          ? 'bg-emerald-50 ring-1 ring-inset ring-emerald-600'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-extrabold ring-1 ring-inset ${avatarTone(t.key)}`}>
                        {GroupIcon ? <GroupIcon size={20} /> : type === 'parent' || type === 'from' ? <User size={20} /> : initialsOf(t.label)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline justify-between gap-2">
                          <span className="truncate text-sm font-extrabold text-slate-900">{t.label}</span>
                          <span className={`shrink-0 text-[11px] font-bold tabular-nums ${t.unread > 0 ? 'text-emerald-700' : 'text-slate-700'}`}>
                            {isToday(when) ? format(when, 'HH:mm') : format(when, 'dd/MM')}
                          </span>
                        </span>
                        <span className="mt-0.5 flex items-center justify-between gap-2">
                          <span className="truncate text-[13px] font-medium text-slate-800">
                            {sentByMe && <span className="font-bold text-slate-900">Vous : </span>}
                            {preview}
                          </span>
                          {t.unread > 0 && (
                            <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 px-1.5 text-[11px] font-extrabold tabular-nums text-white">
                              {t.unread}
                            </span>
                          )}
                        </span>
                      </span>
                    </button>
                  )
                })
              )}
            </div>

            {recentCommunications.length > 5 && (
              <div className="border-t border-slate-200 p-3">
                <Link href="/admin/communication/historique" className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-100 py-2.5 text-sm font-bold text-slate-900 ring-1 ring-inset ring-slate-300 transition-colors hover:bg-white hover:ring-emerald-600">
                  Voir tout l'historique
                  <ArrowRight size={14} />
                </Link>
              </div>
            )}
          </aside>

          {/* ── ZONE CENTRALE : fil de discussion actif ── */}
          <section className="flex min-h-[620px] min-w-0 flex-col lg:min-h-0">
            {/* En-tête du chat */}
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="relative shrink-0">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-emerald-600 to-emerald-800 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)]">
                    <TargetIcon className="h-5 w-5" />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-extrabold tracking-tight text-slate-900">{targetLabel}</p>
                  <p className="flex items-center gap-1.5 truncate text-xs font-semibold text-emerald-800">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                    En ligne · Actif
                    <span className="font-medium text-slate-700">· {targetHint}</span>
                  </p>
                </div>
              </div>

              {/* SMS uniquement pour les parents */}
              {(recipientType === 'all' || recipientType === 'class' || recipientType === 'parent') && (
                <label
                  htmlFor="sendSms"
                  title="Envoyer aussi par SMS (coûts applicables)"
                  className="inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-900 ring-1 ring-inset ring-slate-300 transition-colors hover:bg-white hover:ring-emerald-600"
                >
                  <input
                    type="checkbox"
                    id="sendSms"
                    checked={sendSmsOption}
                    onChange={(e) => setSendSmsOption(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-400 text-emerald-700 focus:ring-emerald-600"
                  />
                  <span><span className="hidden sm:inline">Envoyer aussi par </span>SMS<span className="hidden xl:inline"> (coûts applicables)</span></span>
                </label>
              )}
            </div>

            {activeThreadLabel && (
              <div className="flex items-center justify-between gap-2 border-b border-emerald-200 bg-emerald-50 px-4 py-1.5 text-xs font-bold text-emerald-900">
                <span>Fil affiché : {activeThreadLabel}</span>
                <button type="button" onClick={() => setActiveThread(null)} className="inline-flex items-center gap-1 underline underline-offset-2">
                  <X size={12} /> Voir toutes les conversations
                </button>
              </div>
            )}

            {/* Corps du chat */}
            <div
              ref={chatScrollRef}
              className="relative min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-6"
              style={{
                backgroundColor: '#efeae2',
                backgroundImage: 'radial-gradient(rgba(11,20,26,0.08) 1px, transparent 1.3px)',
                backgroundSize: '18px 18px',
              }}
            >
              <ReadReceiptTrigger messageIds={unreadIds} />

              {feed.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/90 text-emerald-800 shadow-sm ring-1 ring-slate-200">
                    <MessageSquare size={26} />
                  </div>
                  <p className="rounded-xl bg-white/90 px-4 py-2 text-sm font-bold text-slate-900 shadow-sm">
                    Aucun message pour le moment
                  </p>
                  <p className="mt-2 max-w-xs rounded-xl bg-white/80 px-3 py-1.5 text-xs font-semibold text-slate-800">
                    Choisissez un destinataire à gauche puis écrivez votre premier message ci-dessous.
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {feed.map((comm, idx) => {
                    const created = new Date(comm.created_at)
                    const prev = idx > 0 ? new Date(feed[idx - 1].created_at) : null
                    const showDay = !prev || format(prev, 'yyyy-MM-dd') !== format(created, 'yyyy-MM-dd')

                    const isSentByMe = comm.sender_id === currentUserId
                    const recipientText = recipientLabelOf(comm)
                    const readBy = comm.read_by || []
                    const isRead = readBy.length > 0 && (!isSentByMe ? readBy.includes(currentUserId) : true)
                    const isDeletedForEveryone = comm.is_deleted_for_everyone === true
                    const { displayContent, fileUrl, fileType, fileName } = parseContent(comm)
                    const hasText = Boolean(displayContent && displayContent !== 'Message vocal')

                    return (
                      <div key={comm.id}>
                        {showDay && (
                          <div className="my-3 flex justify-center">
                            <span className="rounded-lg bg-white/95 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-slate-800 shadow-sm ring-1 ring-slate-200">
                              {dayLabel(created)}
                            </span>
                          </div>
                        )}

                        <div className={`flex w-full ${isSentByMe ? 'justify-end' : 'justify-start'}`}>
                          <div className={`relative group max-w-[85%] overflow-visible rounded-2xl shadow-[0_1px_1px_rgba(11,20,26,0.18)] sm:max-w-[70%] ${
                            isSentByMe
                              ? 'bg-[#d9fdd3] text-slate-900 rounded-tr-sm'
                              : 'bg-white text-slate-900 rounded-tl-sm'
                          }`}>
                            <MessageActions messageId={comm.id} isSentByMe={isSentByMe} />

                            {isDeletedForEveryone ? (
                              <div className="flex items-center gap-2 px-3 py-2 text-[14px] font-medium italic text-slate-700">
                                <Ban className="h-4 w-4" />
                                Ce message a été supprimé
                              </div>
                            ) : (
                              <>
                                <p className={`px-3 pt-2 pr-8 text-[12px] font-extrabold tracking-tight ${isSentByMe ? 'text-emerald-900' : 'text-sky-800'}`}>
                                  {isSentByMe ? (recipientText ? `À : ${recipientText}` : 'Vous') : 'Parent / Enseignant'}
                                </p>

                                {comm.subject && comm.subject !== 'Message vocal' && comm.subject !== 'Message de l\'administration' && (
                                  <p className="px-3 pt-1 pr-8 text-[13px] font-bold">{comm.subject}</p>
                                )}

                                {hasText && (
                                  <p className="whitespace-pre-wrap px-3 pb-1 pt-1 pr-8 text-[14.5px] font-medium leading-relaxed">{displayContent}</p>
                                )}

                                {fileUrl && (
                                  <div className="px-2 pb-1 pt-1">
                                    {fileType?.startsWith('image/') ? (
                                      <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-xl ring-1 ring-black/10">
                                        <img src={fileUrl} alt={fileName} className="max-h-64 w-full object-cover" />
                                      </a>
                                    ) : fileType?.startsWith('video/') ? (
                                      <video src={fileUrl} controls className="max-h-64 w-full rounded-xl ring-1 ring-black/10" />
                                    ) : (
                                      <a
                                        href={fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-3 rounded-xl bg-black/5 p-2.5 transition-colors hover:bg-black/10"
                                      >
                                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-800 ring-1 ring-inset ring-rose-300">
                                          <FileText className="h-5 w-5" />
                                        </span>
                                        <span className="min-w-0 flex-1">
                                          <span className="block max-w-[200px] truncate text-sm font-bold text-slate-900" title={fileName}>{fileName}</span>
                                          <span className="text-[11px] font-semibold text-slate-700">Ouvrir le document</span>
                                        </span>
                                        <Download className="h-4 w-4 shrink-0 text-slate-800" />
                                      </a>
                                    )}
                                  </div>
                                )}

                                {comm.audio_url && (
                                  <div className="flex min-w-[240px] items-center gap-2.5 px-2.5 py-2">
                                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-white shadow-sm">
                                      <Mic className="h-4 w-4" />
                                    </span>
                                    <audio src={comm.audio_url} controls className="h-8 w-full flex-1" style={{ colorScheme: 'light' }} />
                                  </div>
                                )}
                              </>
                            )}

                            {/* Heure + coches */}
                            <div className={`flex items-center justify-end gap-1 pb-1.5 pr-2.5 ${
                              isDeletedForEveryone || (!hasText && !comm.audio_url && !fileUrl) ? 'pt-1' : ''
                            }`}>
                              <span className="text-[11px] font-semibold tabular-nums text-slate-700">
                                {format(created, 'HH:mm', { locale: fr })}
                              </span>
                              {isSentByMe && (
                                <svg
                                  width="16" height="11" viewBox="0 0 16 11"
                                  fill="none" xmlns="http://www.w3.org/2000/svg"
                                  className="shrink-0"
                                  aria-label={isRead ? 'Lu' : 'Envoyé'}
                                >
                                  <path d="M1 5.5L4.5 9L11 2" stroke={isRead ? '#53bdeb' : '#667781'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                  <path d="M5 5.5L8.5 9L15 2" stroke={isRead ? '#53bdeb' : '#667781'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Barre de saisie */}
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
          </section>
        </div>

      </div>
    </div>
  )
}
