'use client'

import { useState, useTransition } from 'react'
import { createAnnouncement, updateAnnouncement, deleteAnnouncement } from '@/app/actions/announcements'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { CommunicationNavTabs } from './CommunicationNavTabs'

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
      <span className="material-symbols-outlined text-[24px]">
        {isPublished ? 'campaign' : 'visibility_off'}
      </span>
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

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[var(--color-surface-container-lowest)] p-6 rounded-xl border border-[var(--color-outline-variant)]">
          <div>
            <div className="flex items-center gap-2 text-[var(--color-on-surface-variant)] mb-2">
              <span className="text-sm font-semibold text-[var(--color-on-surface)]">Communication</span>
              <span className="text-[var(--color-on-surface-variant)]">/</span>
              <span className="text-sm font-semibold text-[var(--color-on-surface)]">Annonces</span>
            </div>
            <h2 className="text-3xl font-bold text-[var(--color-on-surface)]">Annonces</h2>
            <p className="text-base text-[var(--color-on-surface-variant)] mt-1">
              Publiez des annonces visibles par tous les parents (réunions, événements, fermetures...).
            </p>
          </div>
          <button
            onClick={() => { resetForm(); setShowForm(true) }}
            className="flex items-center gap-2 bg-[var(--color-primary)] text-white h-12 px-6 rounded-full text-sm font-semibold hover:opacity-90 transition-colors shadow-sm w-full sm:w-auto shrink-0"
          >
            <span className="material-symbols-outlined text-[20px]">campaign</span>
            Nouvelle Annonce
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="bg-[var(--color-status-retard-bg)] text-[var(--color-status-retard-text)] p-3 rounded-xl border border-[var(--color-status-retard-bg)] text-sm font-medium">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-[#e6f4ea] text-[#1e8e3e] p-3 rounded-xl border border-[#ceead6] text-sm font-medium flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">check_circle</span>
            Annonce enregistrée avec succès.
          </div>
        )}

        {/* Create / Edit Form */}
        {showForm && (
          <div className="bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-outline-variant)] shadow-sm overflow-hidden">
            <div className="p-4 border-b border-[var(--color-outline-variant)] bg-[var(--color-surface-bright)]">
              <h3 className="font-bold text-[var(--color-on-surface)] flex items-center gap-2">
                <span className="material-symbols-outlined text-[var(--color-primary)]">edit_note</span>
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
              <span className="material-symbols-outlined text-[32px] text-[var(--color-primary)]">campaign</span>
            </div>
            <h3 className="text-lg font-bold text-[var(--color-on-surface)] mb-2">Aucune annonce publiée</h3>
            <p className="text-sm text-[var(--color-on-surface-variant)] max-w-md mx-auto mb-6">
              Créez votre première annonce pour informer les parents d&apos;un événement, d&apos;une réunion ou d&apos;un changement important.
            </p>
            <button
              onClick={() => { resetForm(); setShowForm(true) }}
              className="inline-flex items-center gap-2 bg-[var(--color-primary)] text-white px-6 py-3 rounded-full text-sm font-semibold hover:opacity-90 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Publier une annonce
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {announcements.map(a => (
              <div
                key={a.id}
                className={`bg-[var(--color-surface-container-lowest)] rounded-xl border shadow-sm overflow-hidden transition-all ${
                  a.is_published ? 'border-[var(--color-outline-variant)]' : 'border-orange-200 opacity-70'
                }`}
              >
                <div className="p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 min-w-0 flex-1">
                      <AnnouncementLogo
                        logoUrl={schoolLogo}
                        schoolName={schoolName}
                        isPublished={a.is_published}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3
                            onClick={() => setSelectedViewAnnouncement(a)}
                            className="font-bold text-[var(--color-on-surface)] text-base leading-snug cursor-pointer hover:text-[var(--color-primary)] transition-colors"
                          >
                            {a.title}
                          </h3>
                        </div>
                        <p className="text-sm text-[var(--color-on-surface-variant)] mt-1.5 line-clamp-2 whitespace-pre-line leading-relaxed">
                          {a.content}
                        </p>
                        <div className="flex items-center gap-3 mt-3 flex-wrap">
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-[var(--color-surface-bright)] text-[var(--color-on-surface-variant)] border border-[var(--color-outline-variant)]">
                            <span className="material-symbols-outlined text-[14px]">group</span>
                            {getTargetLabel(a)}
                          </span>
                          <span className="text-[11px] text-[var(--color-on-surface-variant)] flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px]">schedule</span>
                            {format(new Date(a.published_at || a.created_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                          </span>
                          {!a.is_published && (
                            <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                              Brouillon masqué
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => setSelectedViewAnnouncement(a)}
                            className="text-[11px] font-semibold text-[var(--color-primary)] hover:underline ml-auto sm:ml-0"
                          >
                            Lire l&apos;annonce complète
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => setSelectedViewAnnouncement(a)}
                        className="p-2 rounded-lg hover:bg-[var(--color-surface-bright)] transition-colors text-[var(--color-on-surface-variant)]"
                        title="Consulter l'annonce"
                      >
                        <span className="material-symbols-outlined text-[20px]">visibility</span>
                      </button>
                      <button
                        onClick={() => handleTogglePublish(a)}
                        className="p-2 rounded-lg hover:bg-[var(--color-surface-bright)] transition-colors text-[var(--color-on-surface-variant)]"
                        title={a.is_published ? 'Masquer aux parents' : 'Publier et notifier'}
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          {a.is_published ? 'visibility_off' : 'campaign'}
                        </span>
                      </button>
                      <button
                        onClick={() => handleEdit(a)}
                        className="p-2 rounded-lg hover:bg-[var(--color-surface-bright)] transition-colors text-[var(--color-on-surface-variant)]"
                        title="Modifier"
                      >
                        <span className="material-symbols-outlined text-[20px]">edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete(a.id)}
                        className="p-2 rounded-lg hover:bg-[#fce8e6] transition-colors text-[var(--color-on-surface-variant)] hover:text-[#d93025]"
                        title="Supprimer"
                      >
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
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
                  <span className="material-symbols-outlined text-[22px]">close</span>
                </button>
              </div>

              <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className="inline-flex items-center gap-1 font-semibold px-2.5 py-1 rounded-lg bg-[var(--color-surface-bright)] text-[var(--color-on-surface-variant)] border border-[var(--color-outline-variant)]">
                    <span className="material-symbols-outlined text-[14px]">group</span>
                    Destinataires : {getTargetLabel(selectedViewAnnouncement)}
                  </span>
                  <span className={`inline-flex items-center gap-1 font-bold px-2.5 py-1 rounded-lg border ${
                    selectedViewAnnouncement.is_published
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    <span className="material-symbols-outlined text-[14px]">
                      {selectedViewAnnouncement.is_published ? 'check_circle' : 'visibility_off'}
                    </span>
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
