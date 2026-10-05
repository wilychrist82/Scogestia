'use client'

import { useState, useTransition, useMemo } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { 
  History, 
  Trash2, 
  Search, 
  Filter, 
  AlertTriangle, 
  CheckSquare, 
  Square, 
  Volume2, 
  FileText, 
  Send,
  Users,
  GraduationCap,
  School,
  X
} from 'lucide-react'
import toast from 'react-hot-toast'
import { CommunicationNavTabs } from './CommunicationNavTabs'
import { 
  deleteCommunicationPermanently, 
  deleteMultipleCommunications, 
  clearAllCommunicationsHistory 
} from '@/app/actions/communication'

export type CommunicationItem = {
  id: string
  school_id: string
  sender_id: string | null
  recipient_type: string
  recipient_id: string | null
  subject: string | null
  content: string | null
  audio_url: string | null
  file_url?: string | null
  file_type?: string | null
  created_at: string
  read_by?: string[] | null
  is_deleted_for_everyone?: boolean
}

export type ClassItem = {
  id: string
  name: string
}

export type RoleItem = {
  user_id: string
  full_name: string | null
  role: string
}

type Props = {
  initialCommunications: CommunicationItem[]
  classes: ClassItem[]
  roles: RoleItem[]
  schoolId?: string
}

type ModalType = 
  | { type: 'single'; id: string; subject: string }
  | { type: 'bulk'; count: number }
  | { type: 'clear_all' }
  | null

export function CommunicationHistoryManager({ initialCommunications, classes, roles, schoolId }: Props) {
  const [communications, setCommunications] = useState<CommunicationItem[]>(initialCommunications)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [modalState, setModalState] = useState<ModalType>(null)
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Mappage rapide pour retrouver une classe ou un utilisateur
  const classesMap = useMemo(() => new Map(classes.map(c => [c.id, c.name])), [classes])
  const rolesMap = useMemo(() => new Map(roles.map(r => [r.user_id, r])), [roles])

  // Déterminer le libellé du destinataire
  const getRecipientInfo = (comm: CommunicationItem) => {
    if (comm.recipient_type === 'all') {
      return { label: 'Tous les parents', color: 'bg-rose-50 text-rose-700 border-rose-200', icon: Users }
    }
    if (comm.recipient_type === 'all_teachers') {
      return { label: 'Tous les enseignants', color: 'bg-purple-50 text-purple-700 border-purple-200', icon: School }
    }
    if (comm.recipient_type === 'class') {
      const name = comm.recipient_id ? classesMap.get(comm.recipient_id) || 'Classe' : 'Classe'
      return { label: `Classe : ${name}`, color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: GraduationCap }
    }
    if (comm.recipient_type === 'enseignant') {
      const sender = comm.recipient_id ? rolesMap.get(comm.recipient_id) : null
      const name = sender?.full_name || 'Enseignant'
      return { label: `Enseignant : ${name}`, color: 'bg-blue-50 text-blue-700 border-blue-200', icon: School }
    }
    if (comm.recipient_type === 'parent') {
      const parent = comm.recipient_id ? rolesMap.get(comm.recipient_id) : null
      const name = parent?.full_name || 'Parent'
      return { label: `Parent : ${name}`, color: 'bg-sky-50 text-sky-700 border-sky-200', icon: Users }
    }
    if (comm.recipient_type === 'admin') {
      return { label: 'Administration', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: School }
    }
    return { label: 'Destinataire', color: 'bg-slate-100 text-slate-700 border-slate-200', icon: Users }
  }

  // Déterminer l'expéditeur
  const getSenderName = (comm: CommunicationItem) => {
    if (!comm.sender_id) return 'Administration'
    const roleInfo = rolesMap.get(comm.sender_id)
    if (!roleInfo) return 'Système'
    const roleLabel = roleInfo.role === 'admin' || roleInfo.role === 'super_admin' ? 'Admin' : roleInfo.role === 'enseignant' ? 'Enseignant' : 'Parent'
    return `${roleInfo.full_name || 'Utilisateur'} (${roleLabel})`
  }

  // Filtrage réactif
  const filteredCommunications = useMemo(() => {
    return communications.filter(comm => {
      // Filtre catégorie
      if (filterType !== 'all') {
        if (filterType === 'all_parents' && comm.recipient_type !== 'all') return false
        if (filterType === 'all_teachers' && comm.recipient_type !== 'all_teachers') return false
        if (filterType === 'class' && comm.recipient_type !== 'class') return false
        if (filterType === 'parent' && comm.recipient_type !== 'parent') return false
        if (filterType === 'enseignant' && comm.recipient_type !== 'enseignant') return false
      }

      // Filtre recherche
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim()
        const subject = (comm.subject || '').toLowerCase()
        const content = (comm.content || '').toLowerCase()
        const recipient = getRecipientInfo(comm).label.toLowerCase()
        const sender = getSenderName(comm).toLowerCase()
        const dateStr = format(new Date(comm.created_at), 'dd MMMM yyyy HH:mm', { locale: fr }).toLowerCase()

        return subject.includes(query) || content.includes(query) || recipient.includes(query) || sender.includes(query) || dateStr.includes(query)
      }

      return true
    })
  }, [communications, filterType, searchQuery, classesMap, rolesMap])

  // Gestion de la sélection
  const allFilteredSelected = filteredCommunications.length > 0 && filteredCommunications.every(c => selectedIds.has(c.id))

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredCommunications.map(c => c.id)))
    }
  }

  const toggleSelectRow = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Actions de suppression
  const handleConfirmAction = () => {
    if (!modalState) return

    if (modalState.type === 'single') {
      const targetId = modalState.id
      startTransition(async () => {
        const res = await deleteCommunicationPermanently(targetId, schoolId)
        if (res.error) {
          toast.error(res.error)
        } else {
          setCommunications(prev => prev.filter(c => c.id !== targetId))
          setSelectedIds(prev => {
            const next = new Set(prev)
            next.delete(targetId)
            return next
          })
          toast.success('Message supprimé avec succès.')
        }
        setModalState(null)
      })
    } else if (modalState.type === 'bulk') {
      const idsToDelete = Array.from(selectedIds)
      startTransition(async () => {
        const res = await deleteMultipleCommunications(idsToDelete, schoolId)
        if (res.error) {
          toast.error(res.error)
        } else {
          setCommunications(prev => prev.filter(c => !selectedIds.has(c.id)))
          setSelectedIds(new Set())
          toast.success(`${idsToDelete.length} message(s) supprimé(s).`)
        }
        setModalState(null)
      })
    } else if (modalState.type === 'clear_all') {
      startTransition(async () => {
        const res = await clearAllCommunicationsHistory(schoolId)
        if (res.error) {
          toast.error(res.error)
        } else {
          setCommunications([])
          setSelectedIds(new Set())
          toast.success("L'historique complet a été vidé.")
        }
        setModalState(null)
      })
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-[var(--color-surface)]">
      <div className="max-w-[1280px] mx-auto space-y-6">

        {/* Navigation Tabs */}
        <CommunicationNavTabs />

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[var(--color-surface-container-lowest)] p-6 rounded-2xl border border-[var(--color-outline-variant)] shadow-xs">
          <div>
            <div className="flex items-center gap-2 text-[var(--color-on-surface-variant)] mb-2">
              <span className="text-sm font-semibold text-[var(--color-on-surface)]">Communication</span>
              <span>/</span>
              <span className="text-sm font-semibold text-[var(--color-primary)]">Historique des envois</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-[var(--color-on-surface)] tracking-tight">
              Historique des Messages
            </h2>
            <p className="text-sm md:text-base text-[var(--color-on-surface-variant)] mt-1">
              Consultez, recherchez et gérez tous les messages et échanges envoyés depuis votre établissement.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {communications.length > 0 && (
              <button
                type="button"
                onClick={() => setModalState({ type: 'clear_all' })}
                disabled={isPending}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-rose-200 bg-rose-50/70 hover:bg-rose-100 text-rose-700 text-sm font-semibold transition-all shadow-2xs hover:shadow-xs active:scale-98 disabled:opacity-50"
              >
                <Trash2 size={16} className="text-rose-600" />
                Vider tout l'historique
              </button>
            )}
            <Link
              href="/admin/communication"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark,var(--color-primary))] text-white text-sm font-semibold transition-all shadow-sm active:scale-98"
            >
              <Send size={16} />
              Nouveau message
            </Link>
          </div>
        </div>

        {/* Barre de filtres et recherche */}
        <div className="bg-[var(--color-surface-container-lowest)] p-4 rounded-xl border border-[var(--color-outline-variant)] flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-on-surface-variant)]" size={17} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par mot-clé, destinataire, expéditeur ou date..."
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-white rounded-xl border border-[var(--color-outline-variant)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 outline-none text-[var(--color-on-surface)] transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={15} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="relative flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-[var(--color-outline-variant)]">
              <Filter size={15} className="text-[var(--color-on-surface-variant)]" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="text-sm font-medium bg-transparent border-none outline-none text-[var(--color-on-surface)] cursor-pointer pr-2"
              >
                <option value="all">Tous les destinataires</option>
                <option value="all_parents">Tous les parents</option>
                <option value="class">Parents d'une classe</option>
                <option value="parent">Parent d'un élève</option>
                <option value="all_teachers">Tous les enseignants</option>
                <option value="enseignant">Un enseignant</option>
              </select>
            </div>
            
            <span className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)] whitespace-nowrap">
              {filteredCommunications.length} message{filteredCommunications.length > 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Barre d'action groupée si sélection active */}
        {selectedIds.size > 0 && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 p-3.5 rounded-xl flex items-center justify-between animate-fadeIn transition-all">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                {selectedIds.size}
              </span>
              <span className="text-sm font-bold text-emerald-950">
                {selectedIds.size} message{selectedIds.size > 1 ? 's' : ''} sélectionné{selectedIds.size > 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedIds(new Set())}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-white/60 transition-colors"
              >
                Désélectionner
              </button>
              <button
                type="button"
                onClick={() => setModalState({ type: 'bulk', count: selectedIds.size })}
                disabled={isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs active:scale-98 disabled:opacity-50"
              >
                <Trash2 size={14} />
                Supprimer la sélection ({selectedIds.size})
              </button>
            </div>
          </div>
        )}

        {/* Table de l'historique */}
        <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl border border-[var(--color-outline-variant)] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--color-surface-bright)] border-b border-[var(--color-outline-variant)] text-[12px] font-bold text-[var(--color-on-surface-variant)] uppercase tracking-wider">
                  <th className="p-4 w-12 text-center">
                    <button
                      type="button"
                      onClick={toggleSelectAll}
                      className="text-slate-500 hover:text-[var(--color-primary)] transition-colors inline-flex"
                      title={allFilteredSelected ? 'Tout désélectionner' : 'Tout sélectionner'}
                    >
                      {allFilteredSelected ? (
                        <CheckSquare size={18} className="text-[var(--color-primary)]" />
                      ) : (
                        <Square size={18} />
                      )}
                    </button>
                  </th>
                  <th className="p-4 whitespace-nowrap">Date & Heure</th>
                  <th className="p-4 whitespace-nowrap">Destinataire</th>
                  <th className="p-4 whitespace-nowrap">Expéditeur</th>
                  <th className="p-4 whitespace-nowrap">Objet / Type</th>
                  <th className="p-4 w-1/3">Message</th>
                  <th className="p-4 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-outline-variant)]">
                {filteredCommunications.length > 0 ? (
                  filteredCommunications.map((comm) => {
                    const recipientInfo = getRecipientInfo(comm)
                    const RecipientIcon = recipientInfo.icon
                    const isSelected = selectedIds.has(comm.id)
                    const isAudio = Boolean(comm.audio_url)
                    const senderName = getSenderName(comm)
                    const isPlaying = playingAudioId === comm.id

                    return (
                      <tr 
                        key={comm.id} 
                        className={`transition-colors group ${
                          isSelected 
                            ? 'bg-emerald-50/60' 
                            : 'hover:bg-[var(--color-surface-bright)]'
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="p-4 text-center">
                          <button
                            type="button"
                            onClick={() => toggleSelectRow(comm.id)}
                            className="text-slate-400 hover:text-[var(--color-primary)] transition-colors inline-flex"
                          >
                            {isSelected ? (
                              <CheckSquare size={18} className="text-[var(--color-primary)]" />
                            ) : (
                              <Square size={18} />
                            )}
                          </button>
                        </td>

                        {/* Date & Heure */}
                        <td className="p-4 text-xs md:text-sm text-[var(--color-on-surface)] whitespace-nowrap font-medium">
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-800">
                              {format(new Date(comm.created_at), 'dd MMM yyyy', { locale: fr })}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              {format(new Date(comm.created_at), 'HH:mm', { locale: fr })}
                            </span>
                          </div>
                        </td>

                        {/* Destinataire */}
                        <td className="p-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${recipientInfo.color}`}>
                            <RecipientIcon size={13} />
                            {recipientInfo.label}
                          </span>
                        </td>

                        {/* Expéditeur */}
                        <td className="p-4 text-xs md:text-sm text-[var(--color-on-surface-variant)] whitespace-nowrap">
                          <span className="font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                            {senderName}
                          </span>
                        </td>

                        {/* Objet / Type */}
                        <td className="p-4 text-xs md:text-sm font-semibold text-[var(--color-on-surface)] whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {isAudio ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 text-[11px] font-bold">
                                <Volume2 size={13} />
                                Vocal
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium">
                                <FileText size={13} />
                                Texte
                              </span>
                            )}
                            <span className="truncate max-w-[180px]" title={comm.subject || 'Sans objet'}>
                              {comm.subject || 'Message'}
                            </span>
                          </div>
                        </td>

                        {/* Contenu */}
                        <td className="p-4 text-xs md:text-sm text-[var(--color-on-surface-variant)]">
                          <div className="max-w-md">
                            {isAudio && comm.audio_url ? (
                              <div className="flex items-center gap-3 py-1">
                                <audio 
                                  src={comm.audio_url} 
                                  controls 
                                  preload="none"
                                  className="h-8 max-w-[260px] rounded-lg"
                                />
                              </div>
                            ) : (
                              <p className="line-clamp-2 text-slate-700 font-normal leading-relaxed" title={comm.content || ''}>
                                {comm.content || <span className="italic text-slate-400">Aucun texte</span>}
                              </p>
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="p-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setModalState({ 
                                type: 'single', 
                                id: comm.id, 
                                subject: comm.subject || 'Message sans objet' 
                              })}
                              disabled={isPending}
                              title="Supprimer ce message"
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all active:scale-95 disabled:opacity-40"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="p-12 text-center">
                      <div className="max-w-sm mx-auto flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
                          <History size={32} />
                        </div>
                        <h4 className="text-base font-bold text-slate-800">
                          {searchQuery || filterType !== 'all' 
                            ? 'Aucun message ne correspond à vos filtres' 
                            : 'Historique des envois vide'}
                        </h4>
                        <p className="text-xs text-slate-500 mt-1">
                          {searchQuery || filterType !== 'all'
                            ? 'Essayez de modifier votre recherche ou réinitialisez les filtres.'
                            : 'Les messages et communications envoyés depuis votre établissement apparaîtront ici.'}
                        </p>
                        {(searchQuery || filterType !== 'all') && (
                          <button
                            type="button"
                            onClick={() => {
                              setSearchQuery('')
                              setFilterType('all')
                            }}
                            className="mt-4 px-3 py-1.5 text-xs font-semibold text-[var(--color-primary)] hover:underline"
                          >
                            Réinitialiser les filtres
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Confirmation Modal */}
      {modalState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {modalState.type === 'clear_all' && "Vider tout l'historique ?"}
                  {modalState.type === 'bulk' && `Supprimer ${modalState.count} message(s) ?`}
                  {modalState.type === 'single' && 'Supprimer ce message ?'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Cette action est irréversible.</p>
              </div>
            </div>

            <div className="text-sm text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 leading-relaxed">
              {modalState.type === 'clear_all' && (
                <p>
                  Êtes-vous sûr de vouloir supprimer <strong>l'ensemble des messages</strong> de l'historique ? Tous les anciens messages enregistrés seront effacés définitivement.
                </p>
              )}
              {modalState.type === 'bulk' && (
                <p>
                  Vous êtes sur le point de supprimer <strong>{modalState.count} message(s)</strong> sélectionné(s) de façon permanente.
                </p>
              )}
              {modalState.type === 'single' && (
                <p>
                  Confirmez-vous la suppression du message : <br />
                  <span className="font-semibold text-slate-800">« {modalState.subject} »</span> ?
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setModalState(null)}
                disabled={isPending}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                disabled={isPending}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold transition-all shadow-sm active:scale-98 disabled:opacity-50"
              >
                {isPending ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Suppression...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    {modalState.type === 'clear_all' ? 'Confirmer et tout vider' : 'Supprimer définitivement'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
