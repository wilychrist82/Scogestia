'use client'

import { useState, useTransition } from 'react'
import { createAnnouncement, updateAnnouncement, deleteAnnouncement } from '@/app/actions/announcements'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

type Announcement = {
  id: string
  title: string
  content: string
  target_type: string
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
}

export function AnnouncementsManager({ announcements: initialAnnouncements, classes }: Props) {
  const [announcements, setAnnouncements] = useState(initialAnnouncements)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Form fields
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [targetType, setTargetType] = useState('all')
  const [targetClassId, setTargetClassId] = useState('')

  const resetForm = () => {
    setTitle('')
    setContent('')
    setTargetType('all')
    setTargetClassId('')
    setEditingId(null)
    setShowForm(false)
    setError(null)
  }

  const handleEdit = (a: Announcement) => {
    setTitle(a.title)
    setContent(a.content)
    setTargetType(a.target_type)
    setTargetClassId(a.target_class_id || '')
    setEditingId(a.id)
    setShowForm(true)
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (editingId) {
      startTransition(async () => {
        const result = await updateAnnouncement(editingId, {
          title,
          content,
          target_type: targetType,
          target_class_id: targetType === 'class' ? targetClassId : null,
        })
        if (result.error) {
          setError(result.error)
        } else {
          setAnnouncements(prev =>
            prev.map(a => a.id === editingId ? { ...a, title, content, target_type: targetType, target_class_id: targetType === 'class' ? targetClassId : null } : a)
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
      formData.set('targetType', targetType)
      if (targetType === 'class' && targetClassId) formData.set('targetClassId', targetClassId)

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
    if (a.target_type === 'all') return 'Toute l\'école'
    if (a.target_type === 'class') {
      const cls = classes.find(c => c.id === a.target_class_id)
      return cls ? cls.name : 'Classe inconnue'
    }
    return a.target_type
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-[var(--color-surface)]">
      <div className="max-w-[1280px] mx-auto space-y-6">

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
                  <label className="text-sm font-semibold text-[var(--color-on-surface)]">Destinataires</label>
                  <select
                    value={targetType}
                    onChange={e => setTargetType(e.target.value)}
                    className="w-full h-12 px-4 border border-[var(--color-outline-variant)] rounded-lg text-base focus:border-[var(--color-primary)] outline-none bg-[var(--color-surface)]"
                  >
                    <option value="all">Toute l&apos;école</option>
                    <option value="class">Une classe spécifique</option>
                  </select>
                </div>

                {targetType === 'class' && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-[var(--color-on-surface)]">Classe</label>
                    <select
                      value={targetClassId}
                      onChange={e => setTargetClassId(e.target.value)}
                      className="w-full h-12 px-4 border border-[var(--color-outline-variant)] rounded-lg text-base focus:border-[var(--color-primary)] outline-none bg-[var(--color-surface)]"
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
                    <div className="flex items-start gap-4 min-w-0">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        a.is_published ? 'bg-[var(--color-primary-container)] text-[var(--color-primary)]' : 'bg-orange-50 text-orange-500'
                      }`}>
                        <span className="material-symbols-outlined">{a.is_published ? 'campaign' : 'visibility_off'}</span>
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-[var(--color-on-surface)] text-base leading-snug">{a.title}</h3>
                        <p className="text-sm text-[var(--color-on-surface-variant)] mt-1.5 line-clamp-2 whitespace-pre-line">{a.content}</p>
                        <div className="flex items-center gap-3 mt-3 flex-wrap">
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-[var(--color-surface-bright)] text-[var(--color-on-surface-variant)] border border-[var(--color-outline-variant)]">
                            <span className="material-symbols-outlined text-[14px]">group</span>
                            {getTargetLabel(a)}
                          </span>
                          <span className="text-[11px] text-[var(--color-on-surface-variant)]">
                            {format(new Date(a.published_at || a.created_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                          </span>
                          {!a.is_published && (
                            <span className="text-[11px] font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-md">Brouillon</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => handleTogglePublish(a)}
                        className="p-2 rounded-lg hover:bg-[var(--color-surface-bright)] transition-colors text-[var(--color-on-surface-variant)]"
                        title={a.is_published ? 'Masquer' : 'Publier'}
                      >
                        <span className="material-symbols-outlined text-[20px]">{a.is_published ? 'visibility_off' : 'visibility'}</span>
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
      </div>
    </div>
  )
}
