'use client'

import { useState, useTransition } from 'react'
import { createAnnouncement, updateAnnouncement, deleteAnnouncement } from '@/app/actions/announcements'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { CommunicationNavTabs } from './CommunicationNavTabs'
import { Megaphone, EyeOff, CheckCircle2, FileEdit, Plus, Users, Clock, Eye, Edit2, Trash2, X } from 'lucide-react'

type Announcement = {
  id: string
  title: string
  content: string
  target_type: string
  target_level?: string | null
  target_class_id: string | null
  is_published: boolean
  published_at: string
  created_at: string
}

type ClassItem = {
  id: string
  name: string
}

type Props = {
  announcements: Announcement[]
  classes: ClassItem[]
  schoolLogo?: string | null
  schoolName?: string
}

function AnnouncementLogo({
  logoUrl,
  schoolName,
  isPublished,
}: {
  logoUrl?: string | null
  schoolName?: string
  isPublished: boolean
}) {
  const [hasError, setHasError] = useState(false)

  if (logoUrl && !hasError) {
    return (
      <div className="w-12 h-12 rounded-xl border border-[var(--color-outline-variant)] bg-white p-1 flex items-center justify-center shrink-0 shadow-xs overflow-hidden">
        <img
          src={logoUrl}
          alt={schoolName || 'Logo établissement'}
          className="w-full h-full object-contain"
          onError={() => setHasError(true)}
        />
      </div>
    )
  }

  return (
    <div
      className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-xs border ${
        isPublished
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
          : 'bg-amber-50 text-amber-700 border-amber-200'
      }`}
      title={isPublished ? 'Annonce publiée' : 'Brouillon'}
    >
      {isPublished ? <Megaphone className="w-6 h-6" /> : <EyeOff className="w-6 h-6" />}
    </div>
  )
}

export function AnnouncementsManager({ announcements: initialAnnouncements, classes, schoolLogo, schoolName }: Props) {
  const [announcements, setAnnouncements] = useState(initialAnnouncements)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedViewAnnouncement, setSelectedViewAnnouncement] = useState<Announcement | null>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Form fields
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [targetAudience, setTargetAudience] = useState('parents')
  const [targetClassId, setTargetClassId] = useState('')

  const resetForm = () => {
    setTitle('')
    setContent('')
    setTargetAudience('parents')
    setTargetClassId('')
    setEditingId(null)
    setShowForm(false)
    setError(null)
  }

  const handleEdit = (a: Announcement) => {
    setTitle(a.title)
    setContent(a.content)
    if (a.target_type === 'class') {
      setTargetAudience('class')
    } else if (a.target_level === 'teachers') {
      setTargetAudience('teachers')
    } else if (a.target_level === 'all') {
      setTargetAudience('all')
    } else {
      setTargetAudience('parents')
    }
    setTargetClassId(a.target_class_id || '')
    setEditingId(a.id)
    setShowForm(true)
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    let targetType = 'all'
    let targetLevel: string | null = null

    if (targetAudience === 'class') {
      targetType = 'class'
      targetLevel = null
    } else if (targetAudience === 'teachers') {
      targetType = 'all'
      targetLevel = 'teachers'
    } else if (targetAudience === 'all') {
      targetType = 'all'
      targetLevel = 'all'
    } else {
      targetType = 'all'
      targetLevel = 'parents'
    }

    if (editingId) {
      startTransition(async () => {
        const result = await updateAnnouncement(editingId, {
          title,
          content,
          target_type: targetType,
          target_level: targetLevel,
          target_class_id: targetAudience === 'class' ? targetClassId : null,
        })
        if (result.error) {
          setError(result.error)
        } else {
          setAnnouncements(prev =>
            prev.map(a => a.id === editingId ? {
              ...a,
              title,
              content,
              target_type: targetType,
              target_level: targetLevel,
              target_class_id: targetAudience === 'class' ? targetClassId : null
            } : a)
          )
          setSuccess(true)
          setTimeout(() => setSuccess(false), 3000)
          resetForm()
        }
      })
    } else {
      const formData = new FormData()
      formData.set('title', title)
      formData.set('content', content)
      formData.set('targetAudience', targetAudience)
      if (targetAudience === 'class' && targetClassId) formData.set('targetClassId', targetClassId)

      startTransition(async () => {
        const result = await createAnnouncement({}, formData)
        if (result.error) {
          setError(result.error)
        } else {
          setSuccess(true)
          setTimeout(() => setSuccess(false), 3000)
          resetForm()
          // Reload data
          window.location.reload()
        }
      })
    }
  }

  const handleDelete = (id: string) => {
    if (!confirm('Supprimer cette annonce ?')) return
    startTransition(async () => {
      const result = await deleteAnnouncement(id)
      if (result.error) {
        setError(result.error)
      } else {
        setAnnouncements(prev => prev.filter(a => a.id !== id))
      }
    })
  }

  const handleTogglePublish = (a: Announcement) => {
    startTransition(async () => {
      const result = await updateAnnouncement(a.id, { is_published: !a.is_published })
      if (result.error) {
        setError(result.error)
      } else {
        setAnnouncements(prev =>
          prev.map(ann => ann.id === a.id ? { ...ann, is_published: !ann.is_published } : ann)
        )
      }
    })
  }

  const getTargetLabel = (a: Announcement) => {
    if (a.target_type === 'class') {
      const cls = classes.find(c => c.id === a.target_class_id)
      return cls ? `Classe : ${cls.name}` : 'Classe ciblée'
    }
    if (a.target_level === 'teachers') return '👨‍🏫 Enseignants uniquement'
    if (a.target_level === 'all') return '🏫 Toute l\'école (Parents & Enseignants)'
    return '👨‍👩‍👧 Parents d\'élèves'
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-[var(--color-surface)]">
      <div className="max-w-[1280px] mx-auto space-y-6">

        {/* Navigation Tabs */}
        <CommunicationNavTabs />

        {/* Bannière Style Stripe — Royal Indigo & Sapphire */}
        <div className="relative flex flex-col justify-between gap-5 overflow-hidden rounded-2xl bg-gradient-to-r from-[#1E293B] via-[#312E81] to-[#4338CA] px-6 py-5 text-white shadow-[0_14px_34px_-12px_rgba(67,56,202,0.45)] ring-1 ring-indigo-400/25 sm:px-7 sm:py-6 lg:flex-row lg:items-center">
          <div aria-hidden className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full bg-indigo-400/20 blur-2xl" />
          <div aria-hidden className="pointer-events-none absolute -left-12 -bottom-16 h-40 w-40 rounded-full bg-sky-400/15 blur-2xl" />

          <div className="relative z-10 flex items-start sm:items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white ring-1 ring-white/25 backdrop-blur-md shadow-inner">
              <Megaphone className="h-6 w-6 text-indigo-100" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-100 ring-1 ring-white/20">
                  Diffusion officielle
                </span>
                <span className="text-xs font-semibold text-indigo-100/90">
                  • {announcements.filter(a => a.is_published).length} annonce(s) active(s)
                </span>
              </div>
              <h2 className="mt-1 text-xl font-extrabold tracking-tight text-white sm:text-2xl">
                Tableau d&apos;Annonces Officielles
              </h2>
              <p className="mt-0.5 text-xs font-medium text-indigo-100/90 sm:text-sm">
                Informez les familles et les enseignants (réunions, examens, communiqués de la direction).
              </p>
            </div>
          </div>

          <div className="relative z-10 flex flex-wrap items-center gap-3 self-start lg:self-center">
            <div className="hidden sm:flex items-center gap-2">
              <div className="rounded-xl bg-white/12 px-3.5 py-2 ring-1 ring-white/20 backdrop-blur-md">
                <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-100">Publiées</p>
                <p className="text-base font-extrabold leading-tight text-white tabular-nums">
                  {announcements.filter(a => a.is_published).length}
                </p>
              </div>
              <div className="rounded-xl bg-white/12 px-3.5 py-2 ring-1 ring-white/20 backdrop-blur-md">
                <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-100">Total</p>
                <p className="text-base font-extrabold leading-tight text-white tabular-nums">
                  {announcements.length}
                </p>
              </div>
            </div>

            <button
              onClick={() => { resetForm(); setShowForm(true) }}
              className="flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs sm:text-sm font-extrabold text-indigo-950 shadow-md transition-all hover:bg-indigo-50 active:scale-[0.98] w-full sm:w-auto shrink-0"
            >
              <Plus className="w-4 h-4 text-indigo-700" />
              Nouvelle Annonce
            </button>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="bg-[var(--color-status-retard-bg)] text-[var(--color-status-retard-text)] p-3 rounded-xl border border-[var(--color-status-retard-bg)] text-sm font-medium">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-[#e6f4ea] text-[#1e8e3e] p-3 rounded-xl border border-[#ceead6] text-sm font-medium flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            Annonce enregistrée avec succès.
          </div>
        )}

        {/* Create / Edit Form */}
        {showForm && (
          <div className="bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-outline-variant)] shadow-sm overflow-hidden">
            <div className="p-4 border-b border-[var(--color-outline-variant)] bg-[var(--color-surface-bright)]">
              <h3 className="font-bold text-[var(--color-on-surface)] flex items-center gap-2">
                <FileEdit className="w-5 h-5 text-[var(--color-primary)]" />
                {editingId ? 'Modifier l\'annonce' : 'Nouvelle annonce'}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[var(--color-on-surface)]">
                  Titre <span className="text-[var(--color-status-retard-text)]">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full h-12 px-4 border border-[var(--color-outline-variant)] rounded-lg text-base focus:border-[var(--color-primary)] outline-none bg-[var(--color-surface)]"
                  placeholder="Ex: Réunion de parents d'élèves"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[var(--color-on-surface)]">
                  Contenu <span className="text-[var(--color-status-retard-text)]">*</span>
                </label>
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-[var(--color-outline-variant)] rounded-lg text-base focus:border-[var(--color-primary)] outline-none bg-[var(--color-surface)] resize-none"
                  placeholder="Décrivez l'annonce en détail..."
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-[var(--color-on-surface)]">Audience / Destinataires</label>
                  <select
                    value={targetAudience}
                    onChange={e => setTargetAudience(e.target.value)}
                    className="w-full h-12 px-4 border border-[var(--color-outline-variant)] rounded-lg text-base focus:border-[var(--color-primary)] outline-none bg-[var(--color-surface)] font-medium"
                  >
                    <option value="parents">👨‍👩‍👧 Parents d&apos;élèves uniquement (Toute l&apos;école)</option>
                    <option value="all">🏫 Toute la communauté (Parents &amp; Enseignants)</option>
                    <option value="teachers">👨‍🏫 Enseignants uniquement</option>
                    <option value="class">🎓 Une classe spécifique (Parents de la classe)</option>
                  </select>
                </div>

                {targetAudience === 'class' && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-[var(--color-on-surface)]">Classe ciblée</label>
                    <select
                      value={targetClassId}
                      onChange={e => setTargetClassId(e.target.value)}
                      className="w-full h-12 px-4 border border-[var(--color-outline-variant)] rounded-lg text-base focus:border-[var(--color-primary)] outline-none bg-[var(--color-surface)] font-medium"
                      required
                    >
                      <option value="">Sélectionner une classe</option>
                      {classes.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-2 pt-4 border-t border-[var(--color-outline-variant)]">
                <button type="button" onClick={resetForm} className="px-6 py-3 rounded-lg text-sm font-semibold text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-bright)] transition-colors">
                  Annuler
                </button>
                <button type="submit" disabled={isPending} className="bg-[var(--color-primary)] text-white px-8 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">
                  {isPending ? 'Publication...' : editingId ? 'Modifier' : 'Publier l\'annonce'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Announcements list */}
        {announcements.length === 0 ? (
          <div className="bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-outline-variant)] p-12 text-center">
            <div className="w-16 h-16 bg-[var(--color-primary-container)] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Megaphone className="w-8 h-8 text-[var(--color-primary)]" />
            </div>
            <h3 className="text-lg font-bold text-[var(--color-on-surface)] mb-2">Aucune annonce publiée</h3>
            <p className="text-sm text-[var(--color-on-surface-variant)] max-w-md mx-auto mb-6">
              Créez votre première annonce pour informer les parents d&apos;un événement, d&apos;une réunion ou d&apos;un changement important.
            </p>
            <button
              onClick={() => { resetForm(); setShowForm(true) }}
              className="inline-flex items-center gap-2 bg-[var(--color-primary)] text-white px-6 py-3 rounded-full text-sm font-semibold hover:opacity-90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Publier une annonce
            </button>
          </div>
        ) : (
          <div className="space-y-3.5">
            {announcements.map(a => {
              const isTeachersOnly = a.target_level === 'teachers'
              const accentClass = !a.is_published
                ? 'border-l-amber-500'
                : isTeachersOnly
                ? 'border-l-indigo-600'
                : 'border-l-emerald-600'

              return (
                <div
                  key={a.id}
                  className={`group relative rounded-2xl border border-slate-200/90 border-l-4 ${accentClass} bg-white shadow-[0_2px_10px_-4px_rgba(15,23,42,0.06)] hover:shadow-[0_10px_28px_-10px_rgba(15,23,42,0.12)] hover:border-slate-300 transition-all overflow-hidden ${
                    !a.is_published ? 'opacity-80 bg-amber-50/10' : ''
                  }`}
                >
                  <div className="p-5 sm:px-6 sm:py-5">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex items-start gap-4 min-w-0 flex-1">
                        <AnnouncementLogo
                          logoUrl={schoolLogo}
                          schoolName={schoolName}
                          isPublished={a.is_published}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <h3
                              onClick={() => setSelectedViewAnnouncement(a)}
                              className="font-extrabold text-slate-900 text-base sm:text-lg leading-snug cursor-pointer hover:text-emerald-700 transition-colors"
                            >
                              {a.title}
                            </h3>
                            {a.is_published ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200/80">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                Publiée
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 border border-amber-200">
                                Brouillon masqué
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-600 mt-1.5 line-clamp-2 whitespace-pre-line leading-relaxed">
                            {a.content}
                          </p>
                          <div className="flex items-center gap-3 mt-3.5 flex-wrap">
                            <span
                              className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-lg border ${
                                isTeachersOnly
                                  ? 'bg-indigo-50/80 text-indigo-800 border-indigo-200/80'
                                  : 'bg-slate-100/80 text-slate-700 border-slate-200/80'
                              }`}
                            >
                              <Users className="w-3.5 h-3.5" />
                              {getTargetLabel(a)}
                            </span>
                            <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              {format(new Date(a.published_at || a.created_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                            </span>
                            <button
                              type="button"
                              onClick={() => setSelectedViewAnnouncement(a)}
                              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline ml-auto sm:ml-1"
                            >
                              Lire l&apos;annonce complète →
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 self-end sm:self-start shrink-0 rounded-xl bg-slate-50 p-1 border border-slate-200/80">
                        <button
                          onClick={() => setSelectedViewAnnouncement(a)}
                          className="p-2 rounded-lg hover:bg-white hover:shadow-2xs transition-all text-slate-600 hover:text-emerald-700"
                          title="Consulter l'annonce"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleTogglePublish(a)}
                          className="p-2 rounded-lg hover:bg-white hover:shadow-2xs transition-all text-slate-600 hover:text-amber-700"
                          title={a.is_published ? 'Masquer aux parents' : 'Publier et notifier'}
                        >
                          {a.is_published ? <EyeOff className="w-4 h-4" /> : <Megaphone className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleEdit(a)}
                          className="p-2 rounded-lg hover:bg-white hover:shadow-2xs transition-all text-slate-600 hover:text-blue-700"
                          title="Modifier"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(a.id)}
                          className="p-2 rounded-lg hover:bg-rose-50 transition-all text-slate-500 hover:text-rose-600"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Modal de consultation détaillée de l'annonce */}
        {selectedViewAnnouncement && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl border border-[var(--color-outline-variant)] shadow-2xl max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-[var(--color-outline-variant)] flex items-start justify-between gap-4 bg-[var(--color-surface-bright)]">
                <div className="flex items-center gap-3">
                  <AnnouncementLogo
                    logoUrl={schoolLogo}
                    schoolName={schoolName}
                    isPublished={selectedViewAnnouncement.is_published}
                  />
                  <div>
                    <h3 className="font-bold text-lg text-[var(--color-on-surface)] leading-snug">
                      {selectedViewAnnouncement.title}
                    </h3>
                    <p className="text-xs text-[var(--color-on-surface-variant)] mt-0.5">
                      {schoolName || 'Établissement'} • {format(new Date(selectedViewAnnouncement.published_at || selectedViewAnnouncement.created_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedViewAnnouncement(null)}
                  className="p-2 rounded-lg hover:bg-[var(--color-surface)] text-[var(--color-on-surface-variant)] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className="inline-flex items-center gap-1 font-semibold px-2.5 py-1 rounded-lg bg-[var(--color-surface-bright)] text-[var(--color-on-surface-variant)] border border-[var(--color-outline-variant)]">
                    <Users className="w-3.5 h-3.5" />
                    Destinataires : {getTargetLabel(selectedViewAnnouncement)}
                  </span>
                  <span className={`inline-flex items-center gap-1 font-bold px-2.5 py-1 rounded-lg border ${
                    selectedViewAnnouncement.is_published
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {selectedViewAnnouncement.is_published ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <EyeOff className="w-3.5 h-3.5" />
                    )}
                    {selectedViewAnnouncement.is_published ? 'Diffusée aux familles' : 'Brouillon privé'}
                  </span>
                </div>

                <div className="text-sm sm:text-base text-[var(--color-on-surface)] whitespace-pre-line leading-relaxed bg-[var(--color-surface)] p-4 rounded-xl border border-[var(--color-outline-variant)]">
                  {selectedViewAnnouncement.content}
                </div>
              </div>

              <div className="p-4 border-t border-[var(--color-outline-variant)] flex justify-end gap-3 bg-[var(--color-surface-bright)]">
                <button
                  onClick={() => setSelectedViewAnnouncement(null)}
                  className="px-5 py-2.5 rounded-xl font-semibold text-sm bg-[var(--color-primary)] text-white hover:opacity-90 transition-opacity"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
