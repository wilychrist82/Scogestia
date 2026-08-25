'use client'

import { useState, useTransition, FormEvent } from 'react'
import { inviteStaff, deleteStaff, editStaff } from '@/app/actions/staff'
import { TeacherAssignmentModal } from '@/components/admin/TeacherAssignmentModal'

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

  const openAddModal = () => {
    setError(null)
    setIsModalOpen(true)
  }

  const handleDelete = (id: string, name: string) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer ${name} ?`)) return
    
    startTransition(async () => {
      const result = await deleteStaff(id)
      if (result?.error) {
        alert(result.error)
      }
    })
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

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-[var(--color-surface)]">
      <div className="max-w-[1280px] mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[var(--color-surface-container-lowest)] p-6 rounded-xl border border-[var(--color-outline-variant)]">
          <div>
            <h2 className="text-3xl font-bold text-[var(--color-on-surface)]">Personnel</h2>
            <p className="text-base text-[var(--color-on-surface-variant)] mt-1">Gérez le personnel administratif et enseignant de votre établissement.</p>
          </div>
          <button onClick={openAddModal} className="flex items-center justify-center gap-2 bg-[var(--color-primary-container)] text-[var(--color-on-primary)] h-12 px-6 rounded-full text-sm font-semibold hover:bg-[var(--color-primary)] transition-colors active:opacity-90 w-full sm:w-auto shrink-0 shadow-sm">
            <span className="material-symbols-outlined" data-icon="person_add">person_add</span>
            Inviter un membre
          </button>
        </div>

        {error && (
          <div className="bg-[var(--color-status-retard-bg)] text-[var(--color-status-retard-text)] p-3 rounded text-sm font-medium">
            {error}
          </div>
        )}

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="relative flex-grow">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-on-surface-variant)]" data-icon="search">search</span>
            <input className="w-full pl-10 pr-4 py-3 bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-lg text-base focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] outline-none transition-all" placeholder="Rechercher par nom..." type="text"/>
          </div>
          <div className="flex gap-2">
            <select className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-lg px-4 py-3 text-base text-[var(--color-on-surface)] focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] outline-none min-w-[150px]">
              <option value="">Tous les rôles</option>
              <option value="enseignant">Enseignant</option>
              <option value="comptable">Comptable</option>
              <option value="secretaire">Secrétaire</option>
              <option value="conseiller">Conseiller</option>
              <option value="admin">Administrateur</option>
            </select>
            <select className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-lg px-4 py-3 text-base text-[var(--color-on-surface)] focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] outline-none min-w-[150px]">
              <option value="">Tous les statuts</option>
              <option value="actif">Actif</option>
              <option value="inactif">Inactif</option>
            </select>
          </div>
        </div>

        {/* Data Table Container */}
        <div className="bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-outline-variant)] overflow-hidden shadow-sm">
          <div className="overflow-x-auto min-h-[300px] pb-32">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-[var(--color-surface-container-low)] border-b border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] text-sm">
                  <th className="py-4 px-6 font-semibold">Nom</th>
                  <th className="py-4 px-6 font-semibold">Rôle</th>
                  <th className="py-4 px-6 font-semibold hidden md:table-cell">Téléphone</th>
                  <th className="py-4 px-6 font-semibold">Statut</th>
                  <th className="py-4 px-6 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-outline-variant)] text-base">
                {staffList?.map((staff) => (
                  <tr key={staff.id} className="hover:bg-[var(--color-surface-container-lowest)]/50 transition-colors bg-[var(--color-surface-container-lowest)]">
                    <td className="py-3 px-6">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-[var(--color-secondary-container)] text-[var(--color-on-secondary-container)] flex items-center justify-center font-bold text-sm">
                          {getInitials(staff.full_name)}
                        </div>
                        <span className="font-medium text-[var(--color-on-surface)]">{staff.full_name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-6 text-[var(--color-on-surface-variant)]">{formatRole(staff.role)}</td>
                    <td className="py-3 px-6 text-[var(--color-on-surface-variant)] hidden md:table-cell">{staff.phone || '-'}</td>
                    <td className="py-3 px-6">
                      {staff.is_active ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[var(--color-primary-fixed)] text-[var(--color-on-primary-fixed-variant)]">
                          <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary-container)]"></span>
                          Actif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[var(--color-surface-variant)] text-[var(--color-on-surface-variant)] border border-[var(--color-outline-variant)]">
                          <span className="material-symbols-outlined text-[14px]" data-icon="schedule">schedule</span>
                          Inactif
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-6 text-right relative">
                      <button 
                        onClick={() => setOpenActionId(openActionId === staff.id ? null : staff.id)}
                        className="p-2 text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] hover:bg-[var(--color-surface-container-high)] rounded-full transition-colors inline-block"
                      >
                        <span className="material-symbols-outlined text-[20px]" data-icon="more_vert">more_vert</span>
                      </button>

                      {openActionId === staff.id && (
                        <div className="absolute right-6 top-10 w-40 bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-lg shadow-lg z-10 flex flex-col overflow-hidden text-left py-1 animate-[fadeIn_0.1s_ease-out]">
                          <button 
                            className="px-4 py-2 text-sm text-[var(--color-on-surface)] hover:bg-[#eff4ff] hover:text-[var(--color-primary)] flex items-center gap-2 transition-colors w-full text-left"
                            onClick={() => {
                              setOpenActionId(null);
                              setStaffToEdit(staff);
                              setError(null);
                              setIsEditModalOpen(true);
                            }}
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                            Modifier
                          </button>
                          
                          {staff.role === 'enseignant' && (
                            <button 
                              className="px-4 py-2 text-sm text-[var(--color-on-surface)] hover:bg-[#eff4ff] hover:text-[var(--color-primary)] flex items-center gap-2 transition-colors w-full text-left"
                              onClick={() => {
                                setOpenActionId(null);
                                setSelectedTeacherId(staff.user_id);
                                setSelectedTeacherName(staff.full_name);
                                setIsAssignmentModalOpen(true);
                              }}
                            >
                              <span className="material-symbols-outlined text-[18px]">assignment</span>
                              Affectations
                            </button>
                          )}
                          <button 
                            onClick={() => {
                              setOpenActionId(null);
                              handleDelete(staff.id, staff.full_name);
                            }}
                            disabled={isPending}
                            className="px-4 py-2 text-sm text-[var(--color-status-retard-text)] hover:bg-red-50 flex items-center gap-2 transition-colors w-full text-left disabled:opacity-50"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                            Supprimer
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {staffList?.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-[var(--color-on-surface-variant)]">
                      Aucun membre du personnel trouvé.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="px-6 py-4 border-t border-[var(--color-outline-variant)] flex items-center justify-between bg-[var(--color-surface-container-lowest)]">
            <span className="text-sm text-[var(--color-on-surface-variant)]">
              Affichage {staffList?.length ? '1' : '0'} à {staffList?.length || 0} sur {staffList?.length || 0} éléments
            </span>
            <div className="flex gap-1">
              <button className="p-1 rounded-md text-[var(--color-outline)] hover:text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container-high)] transition-colors disabled:opacity-50" disabled>
                <span className="material-symbols-outlined" data-icon="chevron_left">chevron_left</span>
              </button>
              <button className="p-1 rounded-md text-[var(--color-outline)] hover:text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container-high)] transition-colors disabled:opacity-50" disabled>
                <span className="material-symbols-outlined" data-icon="chevron_right">chevron_right</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Overlay: Ajouter un membre */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b1c30]/40 backdrop-blur-sm transition-opacity">
          <div className="bg-[var(--color-surface-container-lowest)] w-full max-w-lg rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-[var(--color-outline-variant)] flex flex-col overflow-hidden animate-[fadeIn_0.2s_ease-out]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[var(--color-outline-variant)] flex justify-between items-center bg-[var(--color-surface-bright)]">
              <h2 className="text-xl font-semibold text-[var(--color-on-surface)]">
                Inviter un membre du personnel
              </h2>
              <button onClick={() => {setIsModalOpen(false); setGeneratedCode(null);}} className="text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)] p-1 rounded-full hover:bg-[#dce9ff] transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {generatedCode ? (
              <div className="p-6 flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 bg-[#e8f0fe] rounded-full flex items-center justify-center mb-2">
                  <span className="material-symbols-outlined text-[32px] text-[var(--color-primary)]">mark_email_read</span>
                </div>
                <h3 className="text-lg font-bold text-[var(--color-on-surface)]">Invitation générée avec succès</h3>
                <p className="text-sm text-[var(--color-on-surface-variant)]">Envoyez ce code au membre du personnel pour qu'il active son compte via WhatsApp ou SMS.</p>
                
                <div className="bg-[var(--color-surface-container-highest)] p-4 rounded-lg border border-[var(--color-outline-variant)] w-full flex items-center justify-between">
                  <span className="font-mono text-2xl font-bold tracking-widest text-[var(--color-primary)]">{generatedCode}</span>
                  <button 
                    onClick={() => {
                      const link = `${window.location.origin}/activer-personnel?code=${generatedCode}`;
                      navigator.clipboard.writeText(`Bonjour ! Voici ton lien d'activation pour ton espace Scogestia : ${link}`);
                      alert("Lien copié dans le presse-papier !");
                    }}
                    className="flex items-center gap-2 bg-white text-[var(--color-primary)] px-3 py-2 rounded-lg border border-[var(--color-primary)] text-sm font-bold hover:bg-[#eff4ff]"
                  >
                    <span className="material-symbols-outlined text-[18px]">content_copy</span>
                    Copier le lien
                  </button>
                </div>

                <button onClick={() => {setIsModalOpen(false); setGeneratedCode(null);}} className="mt-4 px-6 py-2.5 bg-[var(--color-primary)] text-white rounded-lg font-semibold text-sm hover:opacity-90">
                  Terminer
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col">
                <div className="p-6 overflow-y-auto max-h-[70vh] custom-scrollbar space-y-6">
                  
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-[var(--color-on-surface)]" htmlFor="fullName">
                      Nom complet <span className="text-[var(--color-status-retard-text)]">*</span>
                    </label>
                    <input 
                      className="w-full px-4 py-3 bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-lg text-base focus:outline-none focus:border-[var(--color-primary)] focus:border-2 transition-all h-12" 
                      id="fullName" name="fullName" 
                      placeholder="ex: Jean Dupont" 
                      required 
                      type="text"
                    />
                  </div>
                  
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-[var(--color-on-surface)]" htmlFor="email">
                      Adresse email
                    </label>
                    <input 
                      className="w-full px-4 py-3 bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-lg text-base focus:outline-none focus:border-[var(--color-primary)] focus:border-2 transition-all h-12" 
                      id="email" name="email" 
                      placeholder="ex: jean.dupont@ecole.com" 
                      type="email"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-[var(--color-on-surface)]" htmlFor="phone">
                      Téléphone
                    </label>
                    <input 
                      className="w-full px-4 py-3 bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-lg text-base focus:outline-none focus:border-[var(--color-primary)] focus:border-2 transition-all h-12" 
                      id="phone" name="phone" 
                      placeholder="ex: +228 90 00 00 00" 
                      type="tel"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-[var(--color-on-surface)]" htmlFor="role">
                      Rôle <span className="text-[var(--color-status-retard-text)]">*</span>
                    </label>
                    <select 
                      className="w-full px-4 py-3 bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-lg text-base focus:outline-none focus:border-[var(--color-primary)] focus:border-2 transition-all h-12 appearance-none" 
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

                  <div className="flex flex-col gap-1.5 bg-[#f8f9fa] p-4 rounded-lg border border-[var(--color-outline-variant)]">
                    <label className="text-sm font-semibold text-[var(--color-on-surface)]" htmlFor="password">
                      Mot de passe (Optionnel)
                    </label>
                    <input 
                      className="w-full px-4 py-3 bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-lg text-base focus:outline-none focus:border-[var(--color-primary)] focus:border-2 transition-all h-12" 
                      id="password" name="password" 
                      placeholder="ex: scogestia2026" 
                      type="text"
                    />
                    <p className="text-xs text-[var(--color-on-surface-variant)] mt-1">
                      Si vous remplissez ce champ, le compte sera créé immédiatement avec ce mot de passe. Si vous le laissez vide, un code d'invitation sera généré pour WhatsApp.
                    </p>
                  </div>
                  
                </div>
                {/* Modal Footer (Actions) */}
                <div className="px-6 py-4 border-t border-[var(--color-outline-variant)] bg-[var(--color-surface-bright)] flex justify-end gap-3 mt-auto">
                  <button 
                    onClick={() => {setIsModalOpen(false); setGeneratedCode(null);}} 
                    className="px-5 py-2.5 rounded-lg border border-[var(--color-outline)] text-[var(--color-on-surface)] font-semibold text-sm hover:bg-[#eff4ff] transition-colors" 
                    type="button"
                    disabled={isPending}
                  >
                    Annuler
                  </button>
                  <button 
                    className="px-5 py-2.5 rounded-lg bg-[var(--color-primary)] text-white font-semibold text-sm hover:opacity-90 transition-colors shadow-sm disabled:opacity-50" 
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b1c30]/40 backdrop-blur-sm transition-opacity">
          <div className="bg-[var(--color-surface-container-lowest)] w-full max-w-lg rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-[var(--color-outline-variant)] flex flex-col overflow-hidden animate-[fadeIn_0.2s_ease-out]">
            <div className="px-6 py-4 border-b border-[var(--color-outline-variant)] flex justify-between items-center bg-[var(--color-surface-bright)]">
              <h2 className="text-xl font-semibold text-[var(--color-on-surface)]">
                Modifier le membre
              </h2>
              <button onClick={() => { setIsEditModalOpen(false); setStaffToEdit(null); }} className="text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)] p-1 rounded-full hover:bg-[#dce9ff] transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="flex flex-col">
              <div className="p-6 space-y-6">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-[var(--color-on-surface)]" htmlFor="edit-fullName">
                    Nom complet <span className="text-[var(--color-status-retard-text)]">*</span>
                  </label>
                  <input 
                    className="w-full px-4 py-3 bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-lg text-base focus:outline-none focus:border-[var(--color-primary)] focus:border-2 transition-all h-12" 
                    id="edit-fullName" name="fullName" 
                    defaultValue={staffToEdit.full_name}
                    required 
                    type="text"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-[var(--color-on-surface)]" htmlFor="edit-phone">
                    Téléphone
                  </label>
                  <input 
                    className="w-full px-4 py-3 bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-lg text-base focus:outline-none focus:border-[var(--color-primary)] focus:border-2 transition-all h-12" 
                    id="edit-phone" name="phone" 
                    defaultValue={staffToEdit.phone || ''}
                    type="tel"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-[var(--color-on-surface)]" htmlFor="edit-role">
                    Rôle <span className="text-[var(--color-status-retard-text)]">*</span>
                  </label>
                  <select 
                    className="w-full px-4 py-3 bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-lg text-base focus:outline-none focus:border-[var(--color-primary)] focus:border-2 transition-all h-12 appearance-none" 
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
              </div>
              <div className="px-6 py-4 border-t border-[var(--color-outline-variant)] bg-[var(--color-surface-bright)] flex justify-end gap-3 mt-auto">
                <button 
                  onClick={() => { setIsEditModalOpen(false); setStaffToEdit(null); }} 
                  className="px-5 py-2.5 rounded-lg border border-[var(--color-outline)] text-[var(--color-on-surface)] font-semibold text-sm hover:bg-[#eff4ff] transition-colors" 
                  type="button"
                  disabled={isPending}
                >
                  Annuler
                </button>
                <button 
                  className="px-5 py-2.5 rounded-lg bg-[var(--color-primary)] text-white font-semibold text-sm hover:opacity-90 transition-colors shadow-sm disabled:opacity-50" 
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
