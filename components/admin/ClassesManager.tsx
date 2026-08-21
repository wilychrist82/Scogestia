'use client'

import { useState, useTransition, FormEvent } from 'react'
import Link from 'next/link'
import { createClass, updateClass, deleteClass } from '@/app/actions/classes'
import { EmptyState } from '@/components/ui/EmptyState'
import { Presentation } from 'lucide-react'

export type ClassItem = {
  id: string
  name: string
  level: string
  capacity: number
  academic_year: string
  main_teacher_id: string | null
}

type Props = {
  classes: ClassItem[]
}

export function ClassesManager({ classes }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [classToEdit, setClassToEdit] = useState<ClassItem | null>(null)
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [classToDelete, setClassToDelete] = useState<ClassItem | null>(null)
  const [openActionId, setOpenActionId] = useState<string | null>(null)

  const [levelFilter, setLevelFilter] = useState('Tous les niveaux')

  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const filteredClasses = classes.filter(cls => {
    if (levelFilter === 'Tous les niveaux') return true;
    if (levelFilter === 'Maternelle') return ['section1', 'section2'].includes(cls.level);
    if (levelFilter === 'Primaire') return ['cp1', 'cp2', 'ce1', 'ce2', 'cm1', 'cm2'].includes(cls.level);
    if (levelFilter === 'Secondaire') return ['6eme', '5eme', '4eme', '3eme'].includes(cls.level);
    return true;
  })

  const openAddModal = () => {
    setClassToEdit(null)
    setError(null)
    setIsModalOpen(true)
  }

  const openEditModal = (cls: ClassItem) => {
    setClassToEdit(cls)
    setError(null)
    setIsModalOpen(true)
  }

  const openDeleteModal = (cls: ClassItem) => {
    setClassToDelete(cls)
    setError(null)
    setIsDeleteModalOpen(true)
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    
    startTransition(async () => {
      let result;
      if (classToEdit) {
        formData.append('classId', classToEdit.id)
        result = await updateClass(null, formData)
      } else {
        result = await createClass(null, formData)
      }

      if (result?.error) {
        setError(result.error)
      } else {
        setIsModalOpen(false)
      }
    })
  }

  const handleDelete = () => {
    if (!classToDelete) return
    setError(null)
    
    startTransition(async () => {
      const result = await deleteClass(classToDelete.id)
      if (result?.error) {
        setError(result.error)
      } else {
        setIsDeleteModalOpen(false)
      }
    })
  }

  return (
    <div className="flex flex-col relative w-full">
      {/* Page Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-on-surface)]">Classes</h1>
          <p className="text-base text-[var(--color-on-surface-variant)] mt-2">Gérez les classes, les niveaux et les affectations des enseignants.</p>
        </div>
        <button 
          onClick={openAddModal}
          className="bg-[var(--color-primary)] hover:opacity-90 text-white px-6 py-3 rounded-lg font-semibold text-sm flex items-center gap-2 transition-all shadow-sm"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          Ajouter une classe
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-[var(--color-status-retard-bg)] text-[var(--color-status-retard-text)] p-3 rounded text-sm font-medium">
          {error}
        </div>
      )}

      {/* Data Table Card */}
      <div className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-xl overflow-hidden shadow-sm">
        {/* Table Controls */}
        <div className="p-4 border-b border-[var(--color-outline-variant)] flex justify-between items-center bg-[var(--color-surface-bright)]">
          <div className="flex gap-2">
            <select 
              className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-lg px-3 py-1.5 text-sm text-[var(--color-on-surface)] focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] outline-none"
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
            >
              <option>Tous les niveaux</option>
              <option>Maternelle</option>
              <option>Primaire</option>
              <option>Secondaire</option>
            </select>
          </div>
          <span className="text-sm text-[var(--color-on-surface-variant)]">{filteredClasses.length} Classes au total</span>
        </div>

        {filteredClasses.length === 0 ? (
          <EmptyState 
            title="Aucune classe trouvée"
            description="Cliquez sur 'Ajouter une classe' pour commencer à structurer votre école."
            icon={Presentation}
            actionLabel="+ Ajouter une classe"
            onAction={openAddModal}
          />
        ) : (
          <div className="overflow-x-auto min-h-[300px] pb-32">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#eff4ff] border-b border-[var(--color-outline-variant)]">
                  <th className="py-3 px-6 text-sm font-semibold text-[var(--color-on-surface-variant)] whitespace-nowrap">Nom de la classe</th>
                  <th className="py-3 px-6 text-sm font-semibold text-[var(--color-on-surface-variant)] whitespace-nowrap">Niveau</th>
                  <th className="py-3 px-6 text-sm font-semibold text-[var(--color-on-surface-variant)] whitespace-nowrap text-right">Capacité</th>
                  <th className="py-3 px-6 text-sm font-semibold text-[var(--color-on-surface-variant)] whitespace-nowrap text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-base">
                {filteredClasses.map(cls => (
                  <tr key={cls.id} className="border-b border-[var(--color-outline-variant)]/50 hover:bg-[#eff4ff]/50 transition-colors bg-[var(--color-surface-container-lowest)]">
                    <td className="py-3 px-6 font-semibold text-[var(--color-on-surface)]">{cls.name}</td>
                    <td className="py-3 px-6 text-[var(--color-on-surface-variant)]">
                      {cls.level === 'section1' ? 'Section 1' :
                       cls.level === 'section2' ? 'Section 2' :
                       cls.level.toUpperCase()}
                    </td>
                    <td className="py-3 px-6 text-right text-[var(--color-on-surface-variant)]">{cls.capacity || 'Illimitée'}</td>
                    <td className="py-3 px-6 text-right relative">
                      <button 
                        onClick={() => setOpenActionId(openActionId === cls.id ? null : cls.id)}
                        className="p-2 text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] hover:bg-[#eff4ff] rounded-full transition-colors inline-block"
                      >
                        <span className="material-symbols-outlined text-[20px]">more_vert</span>
                      </button>

                      {openActionId === cls.id && (
                        <div className="absolute right-6 top-10 w-40 bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-lg shadow-lg z-20 flex flex-col overflow-hidden text-left py-1 animate-[fadeIn_0.1s_ease-out]">
                          <Link 
                            href={`/admin/classes/${cls.id}`} 
                            className="px-4 py-2 text-sm text-[var(--color-on-surface)] hover:bg-[#eff4ff] hover:text-[var(--color-primary)] flex items-center gap-2 transition-colors w-full text-left"
                            onClick={() => setOpenActionId(null)}
                          >
                            <span className="material-symbols-outlined text-[18px]">visibility</span>
                            Voir
                          </Link>
                          <button 
                            className="px-4 py-2 text-sm text-[var(--color-on-surface)] hover:bg-[#eff4ff] hover:text-[var(--color-primary)] flex items-center gap-2 transition-colors w-full text-left"
                            onClick={() => {
                              setOpenActionId(null);
                              openEditModal(cls);
                            }}
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                            Modifier
                          </button>
                          <button 
                            onClick={() => {
                              setOpenActionId(null);
                              openDeleteModal(cls);
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
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Overlay: Ajouter / Modifier une classe */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b1c30]/40 backdrop-blur-sm transition-opacity">
          <div className="bg-[var(--color-surface-container-lowest)] w-full max-w-lg rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-[var(--color-outline-variant)] flex flex-col overflow-hidden animate-[fadeIn_0.2s_ease-out]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[var(--color-outline-variant)] flex justify-between items-center bg-[var(--color-surface-bright)]">
              <h2 className="text-xl font-semibold text-[var(--color-on-surface)]">
                {classToEdit ? 'Modifier la classe' : 'Ajouter une nouvelle classe'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)] p-1 rounded-full hover:bg-[#dce9ff] transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            {/* Modal Body (Form) */}
            <form onSubmit={handleSubmit} className="flex flex-col">
              <div className="p-6 overflow-y-auto max-h-[70vh] custom-scrollbar space-y-6">
                {/* Input: Nom de la classe */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-[var(--color-on-surface)]" htmlFor="className">
                    Nom de la classe <span className="text-[var(--color-status-retard-text)]">*</span>
                  </label>
                  <input 
                    className="w-full px-4 py-3 bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-lg text-base focus:outline-none focus:border-[var(--color-primary)] focus:border-2 transition-all h-12" 
                    id="className" name="className" 
                    placeholder="ex: 6ème C" 
                    required 
                    defaultValue={classToEdit?.name || ''}
                    type="text"
                  />
                </div>
                {/* Input: Niveau */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-[var(--color-on-surface)]" htmlFor="classLevel">
                    Niveau <span className="text-[var(--color-status-retard-text)]">*</span>
                  </label>
                  <select 
                    className="w-full px-4 py-3 bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-lg text-base focus:outline-none focus:border-[var(--color-primary)] focus:border-2 transition-all h-12 appearance-none" 
                    id="classLevel" name="classLevel" 
                    required
                    defaultValue={classToEdit?.level || ''}
                  >
                    <option disabled value="">Sélectionner un niveau</option>
                    <optgroup label="Maternelle">
                      <option value="section1">Section 1</option>
                      <option value="section2">Section 2</option>
                    </optgroup>
                    <optgroup label="Primaire">
                      <option value="cp1">CP1</option>
                      <option value="cp2">CP2</option>
                      <option value="ce1">CE1</option>
                      <option value="ce2">CE2</option>
                      <option value="cm1">CM1</option>
                      <option value="cm2">CM2</option>
                    </optgroup>
                    <optgroup label="Secondaire">
                      <option value="6eme">6ème</option>
                      <option value="5eme">5ème</option>
                      <option value="4eme">4ème</option>
                      <option value="3eme">3ème</option>
                    </optgroup>
                  </select>
                </div>
                {/* Input: Capacité */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-[var(--color-on-surface)]" htmlFor="capacity">
                    Capacité d'élèves
                  </label>
                  <input 
                    className="w-full px-4 py-3 bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-lg text-base focus:outline-none focus:border-[var(--color-primary)] focus:border-2 transition-all h-12" 
                    id="capacity" name="capacity" 
                    placeholder="ex: 80 (laisser vide si illimité)" 
                    type="number"
                    min="1"
                    defaultValue={classToEdit?.capacity || ''}
                  />
                </div>
              </div>
              {/* Modal Footer (Actions) */}
              <div className="px-6 py-4 border-t border-[var(--color-outline-variant)] bg-[var(--color-surface-bright)] flex justify-end gap-3 mt-auto">
                <button 
                  onClick={() => setIsModalOpen(false)} 
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
                  {isPending ? 'Enregistrement...' : classToEdit ? 'Mettre à jour' : 'Créer la classe'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b1c30]/40 backdrop-blur-sm transition-opacity">
          <div className="bg-[var(--color-surface-container-lowest)] w-full max-w-sm rounded-xl shadow-lg border border-[var(--color-outline-variant)] flex flex-col overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-bold text-[var(--color-on-surface)] mb-2">Supprimer la classe</h2>
              <p className="text-sm text-[var(--color-on-surface-variant)]">
                Êtes-vous sûr de vouloir supprimer la classe <strong>{classToDelete?.name}</strong> ? Cette action est irréversible.
              </p>
            </div>
            <div className="px-6 py-4 border-t border-[var(--color-outline-variant)] bg-[var(--color-surface-bright)] flex justify-end gap-3">
              <button 
                onClick={() => setIsDeleteModalOpen(false)} 
                className="px-4 py-2 rounded-lg border border-[var(--color-outline)] text-[var(--color-on-surface)] font-semibold text-sm hover:bg-[#eff4ff] transition-colors" 
                type="button"
                disabled={isPending}
              >
                Annuler
              </button>
              <button 
                onClick={handleDelete}
                className="px-4 py-2 rounded-lg bg-[var(--color-status-retard-text)] text-white font-semibold text-sm hover:opacity-90 transition-colors disabled:opacity-50" 
                type="button"
                disabled={isPending}
              >
                {isPending ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
