'use client'

import { useState, useTransition, useMemo, FormEvent } from 'react'
import { inviteStaff, deleteStaff, editStaff } from '@/app/actions/staff'
import { TeacherAssignmentModal } from '@/components/admin/TeacherAssignmentModal'
import toast from 'react-hot-toast'
import { UserPlus, Search, Clock, MoreVertical, Edit2, ListOrdered, Trash2, ChevronLeft, ChevronRight, X, MailCheck, Copy, Users, UserCheck, GraduationCap, Briefcase, AlertTriangle } from 'lucide-react'
import { KpiCard } from './KpiCard'

export type StaffItem = {
  id: string
  full_name: string
  role: string
  phone: string | null
  is_active: boolean
  user_id: string
}

type Props = {
  staffList: StaffItem[]
}

const labelCls = 'text-xs font-bold uppercase tracking-wider text-slate-700'
const fieldCls =
  'w-full h-12 px-4 bg-white border border-slate-200 rounded-xl text-base font-medium text-slate-900 placeholder:text-slate-500 outline-none transition-all focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20'
const toolbarFieldCls =
  'h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 placeholder:text-slate-500 outline-none transition-all focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20'

const ROLE_TONES: Record<string, string> = {
  admin: 'bg-violet-50 text-violet-800 ring-violet-200',
  enseignant: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  comptable: 'bg-amber-50 text-amber-800 ring-amber-200',
  secretaire: 'bg-blue-50 text-blue-800 ring-blue-200',
  conseiller: 'bg-rose-50 text-rose-800 ring-rose-200',
}

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

export function PersonnelManager({ staffList }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [openActionId, setOpenActionId] = useState<string | null>(null)

  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [generatedCode, setGeneratedCode] = useState<string | null>(null)

  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [staffToEdit, setStaffToEdit] = useState<StaffItem | null>(null)

  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false)
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null)
  const [selectedTeacherName, setSelectedTeacherName] = useState<string>('')

  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const filteredStaff = useMemo(() => {
    return (staffList || []).filter(staff => {
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim()
        const matchName = (staff.full_name || '').toLowerCase().includes(q)
        const matchPhone = (staff.phone || '').includes(q)
        if (!matchName && !matchPhone) return false
      }
      if (roleFilter && staff.role !== roleFilter) {
        return false
      }
      if (statusFilter) {
        const isActive = statusFilter === 'actif'
        if (staff.is_active !== isActive) return false
      }
      return true
    })
  }, [staffList, searchTerm, roleFilter, statusFilter])

  const openAddModal = () => {
    setError(null)
    setIsModalOpen(true)
  }

  const handleDelete = (id: string, name: string) => {
    // Toast de confirmation en lieu et place de window.confirm()
    toast(
      (t) => (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-extrabold text-slate-900">Supprimer {name} ?</p>
          <p className="text-xs font-medium text-slate-700">Cette action est irréversible.</p>
          <div className="flex gap-2 mt-1">
            <button
              onClick={() => {
                toast.dismiss(t.id)
                startTransition(async () => {
                  const result = await deleteStaff(id)
                  if (result?.error) {
                    toast.error(result.error)
                  } else {
                    toast.success(`${name} a été supprimé avec succès.`)
                  }
                })
              }}
              className="flex-1 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-rose-700"
            >
              Supprimer
            </button>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="flex-1 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-800 transition-colors hover:bg-slate-200"
            >
              Annuler
            </button>
          </div>
        </div>
      ),
      { duration: 8000, style: { maxWidth: '300px' } }
    )
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await inviteStaff(null, formData)

      if (result?.error) {
        setError(result.error)
      } else if (result?.code) {
        setGeneratedCode(result.code)
      } else {
        setIsModalOpen(false)
      }
    })
  }

  const handleEditSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!staffToEdit) return
    setError(null)
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await editStaff(staffToEdit.id, formData)
      if (result?.error) {
        setError(result.error)
      } else {
        setIsEditModalOpen(false)
        setStaffToEdit(null)
      }
    })
  }

  const formatRole = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrateur'
      case 'comptable': return 'Comptable'
      case 'enseignant': return 'Enseignant'
      case 'secretaire': return 'Secrétaire'
      case 'conseiller': return 'Conseiller'
      default: return role
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

  const totalStaff = staffList?.length || 0
  const activeStaff = staffList?.filter(s => s.is_active).length || 0
  const teacherCount = staffList?.filter(s => s.role === 'enseignant').length || 0
  const adminStaffCount = totalStaff - teacherCount

  return (
    <div className="flex-1 overflow-y-auto bg-[var(--color-surface)] p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-[1280px] space-y-6">
        {/* En-tête de page */}
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">Personnel</h2>
            <p className="mt-1 text-sm font-medium text-slate-600">Gérez le personnel administratif et enseignant de votre établissement.</p>
          </div>
          <button onClick={openAddModal} className="group inline-flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#006039] to-emerald-600 px-5 text-sm font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:from-[#004d2e] hover:to-emerald-700 hover:shadow-lg active:scale-95 sm:w-auto">
            <UserPlus className="h-5 w-5 transition-transform group-hover:scale-110" />
            Inviter un membre
          </button>
        </div>

        {/* Cartes KPI */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <KpiCard label="Membres" value={totalStaff} icon={Users} tone="emerald" hint="Personnel total" />
          <KpiCard label="Actifs" value={activeStaff} icon={UserCheck} tone="blue" hint={`${totalStaff - activeStaff} en attente`} />
          <KpiCard label="Enseignants" value={teacherCount} icon={GraduationCap} tone="violet" hint="Corps professoral" />
          <KpiCard label="Administratif" value={adminStaffCount} icon={Briefcase} tone="amber" hint="Direction & support" />
        </div>

        {error && (
          <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-rose-300 bg-rose-50 p-3.5 text-sm font-semibold text-rose-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Barre d'outils */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-grow">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`${toolbarFieldCls} w-full pl-10 pr-4`}
              placeholder="Rechercher par nom..."
              type="text"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className={`${toolbarFieldCls} min-w-[150px]`}
            >
              <option value="">Tous les rôles</option>
              <option value="enseignant">Enseignant</option>
              <option value="comptable">Comptable</option>
              <option value="secretaire">Secrétaire</option>
              <option value="conseiller">Conseiller</option>
              <option value="admin">Administrateur</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`${toolbarFieldCls} min-w-[150px]`}
            >
              <option value="">Tous les statuts</option>
              <option value="actif">Actif</option>
              <option value="inactif">Inactif</option>
            </select>
          </div>
        </div>

        {/* Conteneur du tableau */}
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_2px_12px_rgba(15,23,42,0.03)]">
          <div className="min-h-[300px] overflow-x-auto pb-32">
            <table className="w-full min-w-[800px] border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  <th className="px-6 py-3.5">Nom</th>
                  <th className="px-6 py-3.5">Rôle</th>
                  <th className="hidden px-6 py-3.5 md:table-cell">Téléphone</th>
                  <th className="px-6 py-3.5">Statut</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {filteredStaff.map((staff) => (
                  <tr key={staff.id} className="border-b border-slate-100 transition-colors last:border-b-0 hover:bg-emerald-50/30">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-extrabold ring-1 ring-inset ${avatarTone(staff.id)}`}>
                          {getInitials(staff.full_name)}
                        </div>
                        <span className="font-extrabold text-slate-900">{staff.full_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${ROLE_TONES[staff.role] || 'bg-slate-100 text-slate-800 ring-slate-200'}`}>
                        {formatRole(staff.role)}
                      </span>
                    </td>
                    <td className="hidden px-6 py-3.5 font-semibold tabular-nums text-slate-800 md:table-cell">{staff.phone || '-'}</td>
                    <td className="px-6 py-3.5">
                      {staff.is_active ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800 ring-1 ring-inset ring-emerald-300">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600"></span>
                          Actif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-800 ring-1 ring-inset ring-slate-300">
                          <Clock className="h-3.5 w-3.5" />
                          Inactif
                        </span>
                      )}
                    </td>
                    <td className="relative px-6 py-3.5 text-right">
                      <button
                        onClick={() => setOpenActionId(openActionId === staff.id ? null : staff.id)}
                        aria-label="Actions"
                        className="inline-block rounded-xl p-2 text-slate-700 transition-all hover:bg-slate-100 hover:text-slate-900"
                      >
                        <MoreVertical className="h-5 w-5" />
                      </button>

                      {openActionId === staff.id && (
                        <div className="absolute right-6 top-12 z-10 flex w-44 animate-[fadeIn_0.1s_ease-out] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white p-1 text-left shadow-xl">
                          <button
                            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-semibold text-slate-800 transition-colors hover:bg-emerald-50 hover:text-emerald-900"
                            onClick={() => {
                              setOpenActionId(null);
                              setStaffToEdit(staff);
                              setError(null);
                              setIsEditModalOpen(true);
                            }}
                          >
                            <Edit2 className="h-4 w-4" />
                            Modifier
                          </button>

                          {staff.role === 'enseignant' && (
                            <button
                              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-semibold text-slate-800 transition-colors hover:bg-emerald-50 hover:text-emerald-900"
                              onClick={() => {
                                setOpenActionId(null);
                                setSelectedTeacherId(staff.user_id);
                                setSelectedTeacherName(staff.full_name);
                                setIsAssignmentModalOpen(true);
                              }}
                            >
                              <ListOrdered className="h-4 w-4" />
                              Affectations
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setOpenActionId(null);
                              handleDelete(staff.id, staff.full_name);
                            }}
                            disabled={isPending}
                            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-semibold text-rose-700 transition-colors hover:bg-rose-50 disabled:opacity-50"
                          >
                            <Trash2 className="h-4 w-4" />
                            Supprimer
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredStaff.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-sm font-semibold text-slate-700">
                      {staffList?.length === 0 ? 'Aucun membre du personnel enregistré.' : 'Aucun membre ne correspond à votre recherche.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-slate-200/80 bg-slate-50/70 px-6 py-4">
            <span className="text-sm font-medium text-slate-700">
              Affichage {filteredStaff.length ? '1' : '0'} à {filteredStaff.length} sur {staffList?.length || 0} membres
            </span>
            <div className="flex gap-1">
              <button className="rounded-lg p-1.5 text-slate-600 transition-colors hover:bg-white hover:text-slate-900 disabled:opacity-40" disabled>
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button className="rounded-lg p-1.5 text-slate-600 transition-colors hover:bg-white hover:text-slate-900 disabled:opacity-40" disabled>
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Overlay: Ajouter un membre */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm transition-opacity">
          <div className="flex w-full max-w-lg animate-[fadeIn_0.2s_ease-out] flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <h2 className="text-xl font-extrabold tracking-tight text-slate-900">
                Inviter un membre du personnel
              </h2>
              <button onClick={() => {setIsModalOpen(false); setGeneratedCode(null);}} aria-label="Fermer" className="rounded-full p-1.5 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900">
                <X className="h-5 w-5" />
              </button>
            </div>

            {generatedCode ? (
              <div className="flex flex-col items-center space-y-4 p-6 text-center">
                <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 ring-1 ring-inset ring-emerald-200">
                  <MailCheck className="h-8 w-8 text-emerald-700" />
                </div>
                <h3 className="text-lg font-extrabold text-slate-900">Invitation générée avec succès</h3>
                <p className="text-sm font-medium text-slate-700">Envoyez ce code au membre du personnel pour qu&apos;il active son compte via WhatsApp ou SMS.</p>

                <div className="flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <span className="font-mono text-2xl font-extrabold tracking-widest text-emerald-800">{generatedCode}</span>
                  <button
                    onClick={() => {
                      const link = `${window.location.origin}/activer-personnel?code=${generatedCode}`;
                      navigator.clipboard.writeText(`Bonjour ! Voici ton lien d'activation pour ton espace Scogestia : ${link}`)
                        .then(() => toast.success('Lien copié dans le presse-papier !'))
                        .catch(() => toast.error('Impossible de copier le lien.'))
                    }}
                    className="flex items-center gap-2 rounded-xl border border-emerald-600 bg-white px-3 py-2 text-sm font-bold text-emerald-800 transition-colors hover:bg-emerald-50"
                  >
                    <Copy className="h-4 w-4" />
                    Copier le lien
                  </button>
                </div>

                <button onClick={() => {setIsModalOpen(false); setGeneratedCode(null);}} className="mt-4 h-11 rounded-xl bg-gradient-to-r from-[#006039] to-emerald-600 px-6 text-sm font-bold text-white shadow-sm transition-all hover:from-[#004d2e] hover:to-emerald-700">
                  Terminer
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col">
                <div className="custom-scrollbar max-h-[70vh] space-y-5 overflow-y-auto p-6">

                  <div className="flex flex-col gap-2">
                    <label className={labelCls} htmlFor="fullName">
                      Nom complet <span className="text-rose-600">*</span>
                    </label>
                    <input
                      className={fieldCls}
                      id="fullName" name="fullName"
                      placeholder="ex: Jean Dupont"
                      required
                      type="text"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className={labelCls} htmlFor="email">
                      Adresse email
                    </label>
                    <input
                      className={fieldCls}
                      id="email" name="email"
                      placeholder="ex: jean.dupont@ecole.com"
                      type="email"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className={labelCls} htmlFor="phone">
                      Téléphone
                    </label>
                    <input
                      className={fieldCls}
                      id="phone" name="phone"
                      placeholder="ex: +228 90 00 00 00"
                      type="tel"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className={labelCls} htmlFor="role">
                      Rôle <span className="text-rose-600">*</span>
                    </label>
                    <select
                      className={fieldCls}
                      id="role" name="role"
                      required
                      defaultValue=""
                    >
                      <option disabled value="">Sélectionner un rôle</option>
                      <option value="enseignant">Enseignant</option>
                      <option value="comptable">Comptable</option>
                      <option value="secretaire">Secrétaire</option>
                      <option value="conseiller">Conseiller</option>
                      <option value="admin">Administrateur</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <label className={labelCls} htmlFor="password">
                      Mot de passe (Optionnel)
                    </label>
                    <input
                      className={fieldCls}
                      id="password" name="password"
                      placeholder="ex: scogestia2026"
                      type="text"
                    />
                    <p className="mt-1 text-xs font-medium leading-relaxed text-slate-700">
                      Si vous remplissez ce champ, le compte sera créé immédiatement avec ce mot de passe. Si vous le laissez vide, un code d&apos;invitation sera généré pour WhatsApp.
                    </p>
                  </div>

                </div>
                {/* Modal Footer (Actions) */}
                <div className="mt-auto flex justify-end gap-3 border-t border-slate-100 bg-slate-50/60 px-6 py-4">
                  <button
                    onClick={() => {setIsModalOpen(false); setGeneratedCode(null);}}
                    className="h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-800 transition-all hover:bg-slate-50 hover:text-slate-900"
                    type="button"
                    disabled={isPending}
                  >
                    Annuler
                  </button>
                  <button
                    className="h-11 rounded-xl bg-gradient-to-r from-[#006039] to-emerald-600 px-5 text-sm font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:from-[#004d2e] hover:to-emerald-700 hover:shadow-md active:scale-95 disabled:opacity-50"
                    type="submit"
                    disabled={isPending}
                  >
                    {isPending ? 'Envoi...' : 'Inviter'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal Overlay: Modifier un membre */}
      {isEditModalOpen && staffToEdit && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm transition-opacity">
          <div className="flex w-full max-w-lg animate-[fadeIn_0.2s_ease-out] flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <h2 className="text-xl font-extrabold tracking-tight text-slate-900">
                Modifier le membre
              </h2>
              <button onClick={() => { setIsEditModalOpen(false); setStaffToEdit(null); }} aria-label="Fermer" className="rounded-full p-1.5 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="flex flex-col">
              <div className="space-y-5 p-6">
                <div className="flex flex-col gap-2">
                  <label className={labelCls} htmlFor="edit-fullName">
                    Nom complet <span className="text-rose-600">*</span>
                  </label>
                  <input
                    className={fieldCls}
                    id="edit-fullName" name="fullName"
                    defaultValue={staffToEdit.full_name}
                    required
                    type="text"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className={labelCls} htmlFor="edit-phone">
                    Téléphone
                  </label>
                  <input
                    className={fieldCls}
                    id="edit-phone" name="phone"
                    defaultValue={staffToEdit.phone || ''}
                    type="tel"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className={labelCls} htmlFor="edit-role">
                    Rôle <span className="text-rose-600">*</span>
                  </label>
                  <select
                    className={fieldCls}
                    id="edit-role" name="role"
                    required
                    defaultValue={staffToEdit.role}
                  >
                    <option value="enseignant">Enseignant</option>
                    <option value="comptable">Comptable</option>
                    <option value="secretaire">Secrétaire</option>
                    <option value="conseiller">Conseiller</option>
                    <option value="admin">Administrateur</option>
                  </select>
                </div>

                <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <label className={labelCls} htmlFor="edit-password">
                    Nouveau mot de passe (Optionnel)
                  </label>
                  <input
                    className={fieldCls}
                    id="edit-password" name="password"
                    placeholder="Laissez vide pour conserver l'actuel"
                    type="text"
                  />
                  <p className="mt-1 text-xs font-medium leading-relaxed text-slate-700">
                    Si vous remplissez ce champ, le mot de passe actuel de ce membre sera écrasé. Vous pourrez ensuite lui communiquer ce nouveau code d&apos;accès.
                  </p>
                </div>
              </div>
              <div className="mt-auto flex justify-end gap-3 border-t border-slate-100 bg-slate-50/60 px-6 py-4">
                <button
                  onClick={() => { setIsEditModalOpen(false); setStaffToEdit(null); }}
                  className="h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-800 transition-all hover:bg-slate-50 hover:text-slate-900"
                  type="button"
                  disabled={isPending}
                >
                  Annuler
                </button>
                <button
                  className="h-11 rounded-xl bg-gradient-to-r from-[#006039] to-emerald-600 px-5 text-sm font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:from-[#004d2e] hover:to-emerald-700 hover:shadow-md active:scale-95 disabled:opacity-50"
                  type="submit"
                  disabled={isPending}
                >
                  {isPending ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal Overlay: Affectations de l'enseignant */}
      <TeacherAssignmentModal
        isOpen={isAssignmentModalOpen}
        onClose={() => setIsAssignmentModalOpen(false)}
        teacherId={selectedTeacherId || ''}
        teacherName={selectedTeacherName}
      />

    </div>
  )
}
