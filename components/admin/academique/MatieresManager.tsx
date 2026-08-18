'use client'

import { useState, useTransition, FormEvent } from 'react'
import { addSubject } from '@/app/actions/academique'
import Link from 'next/link'

type ClassItem = { id: string; name: string }
type TeacherItem = { user_id: string; full_name: string }
type SubjectItem = {
  id: string
  subject_name: string
  coefficient: number
  class: { name: string } | null
  teacher: { full_name: string } | null
}

type Props = {
  subjects: SubjectItem[]
  classes: ClassItem[]
  teachers: TeacherItem[]
}

export function MatieresManager({ subjects, classes, teachers }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  
  const [selectedClassId, setSelectedClassId] = useState<string>('')

  const openAddModal = () => {
    setError(null)
    setIsModalOpen(true)
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    
    startTransition(async () => {
      const result = await addSubject(null, formData)
      if (result?.error) {
        setError(result.error)
      } else {
        setIsModalOpen(false)
      }
    })
  }
  
  const filteredSubjects = selectedClassId 
    ? subjects.filter(s => s.class?.name === classes.find(c => c.id === selectedClassId)?.name)
    : subjects

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-[var(--color-surface)]">
      <div className="max-w-[1280px] mx-auto space-y-6">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[var(--color-surface-container-lowest)] p-6 rounded-xl border border-[var(--color-outline-variant)]">
          <div>
            <div className="flex items-center gap-2 text-[var(--color-on-surface-variant)] mb-2">
              <Link href="/admin/academique" className="hover:text-[var(--color-primary)] transition-colors text-sm font-semibold">
                Académique
              </Link>
              <span className="material-symbols-outlined text-sm">chevron_right</span>
              <span className="text-sm font-semibold text-[var(--color-on-surface)]">Matières</span>
            </div>
            <h2 className="text-3xl font-bold text-[var(--color-on-surface)]">Gestion des Matières</h2>
            <p className="text-base text-[var(--color-on-surface-variant)] mt-1">Configurez le programme par classe et assignez les enseignants.</p>
          </div>
          <button onClick={openAddModal} className="flex items-center justify-center gap-2 bg-[var(--color-primary)] text-white h-12 px-6 rounded-full text-sm font-semibold hover:opacity-90 transition-colors shadow-sm w-full sm:w-auto shrink-0">
            <span className="material-symbols-outlined text-[20px]">add_box</span>
            Ajouter une matière
          </button>
        </div>

        {error && (
          <div className="bg-[var(--color-status-retard-bg)] text-[var(--color-status-retard-text)] p-3 rounded text-sm font-medium">
            {error}
          </div>
        )}

        {/* Data Table Container */}
        <div className="bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-outline-variant)] overflow-hidden shadow-sm flex flex-col min-h-[500px]">
          <div className="p-4 border-b border-[var(--color-outline-variant)] flex flex-col sm:flex-row gap-4 bg-[var(--color-surface-bright)] justify-between items-center">
            <div className="flex gap-2 w-full sm:w-auto">
              <select 
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-lg px-4 py-2.5 text-sm text-[var(--color-on-surface)] focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] outline-none"
              >
                <option value="">Toutes les classes</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <span className="text-sm font-medium text-[var(--color-on-surface-variant)]">{filteredSubjects.length} matières</span>
          </div>

          {filteredSubjects.length === 0 ? (
             <div className="p-12 flex flex-col items-center justify-center text-center text-[var(--color-on-surface-variant)] flex-1">
               <span className="material-symbols-outlined text-4xl mb-2 opacity-50">book</span>
               <p className="text-lg font-medium">Aucune matière configurée</p>
               <p className="text-sm">Ajoutez des matières pour structurer l'année scolaire.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[var(--color-surface-container-low)] border-b border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] text-sm">
                    <th className="py-4 px-6 font-semibold">Classe</th>
                    <th className="py-4 px-6 font-semibold">Matière</th>
                    <th className="py-4 px-6 font-semibold text-center">Coefficient</th>
                    <th className="py-4 px-6 font-semibold">Enseignant associé</th>
                    <th className="py-4 px-6 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-outline-variant)] text-base">
                  {filteredSubjects.map((subject) => (
                    <tr key={subject.id} className="hover:bg-[var(--color-surface-container-lowest)]/50 transition-colors bg-[var(--color-surface-container-lowest)]">
                      <td className="py-3 px-6 font-medium text-[var(--color-on-surface)]">
                        {subject.class?.name || '-'}
                      </td>
                      <td className="py-3 px-6 text-[var(--color-on-surface)] font-semibold">
                        {subject.subject_name}
                      </td>
                      <td className="py-3 px-6 text-center">
                        <span className="px-3 py-1 bg-[var(--color-surface-container-high)] rounded-full text-sm font-bold text-[var(--color-on-surface)]">
                          {subject.coefficient}
                        </span>
                      </td>
                      <td className="py-3 px-6 text-[var(--color-on-surface-variant)] flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">person</span>
                        {subject.teacher?.full_name || '-'}
                      </td>
                      <td className="py-3 px-6 text-right">
                        <button className="p-2 text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] hover:bg-[var(--color-surface-container-high)] rounded-full transition-colors">
                          <span className="material-symbols-outlined text-[20px]">edit</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Ajouter une matière */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b1c30]/40 backdrop-blur-sm transition-opacity">
          <div className="bg-[var(--color-surface-container-lowest)] w-full max-w-md rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-[var(--color-outline-variant)] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--color-outline-variant)] flex justify-between items-center bg-[var(--color-surface-bright)]">
              <h2 className="text-xl font-semibold text-[var(--color-on-surface)] flex items-center gap-2">
                <span className="material-symbols-outlined text-[var(--color-primary)]">add_box</span>
                Ajouter une matière
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)] p-1 rounded-full hover:bg-[#dce9ff] transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex flex-col">
              <div className="p-6 space-y-4">
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-[var(--color-on-surface)]" htmlFor="classId">
                    Classe <span className="text-[var(--color-status-retard-text)]">*</span>
                  </label>
                  <select className="w-full h-12 px-4 border border-[var(--color-outline-variant)] rounded-lg text-base focus:border-[var(--color-primary)] outline-none bg-[var(--color-surface)]" id="classId" name="classId" required>
                    <option value="">Sélectionner une classe</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-[var(--color-on-surface)]" htmlFor="subjectName">
                    Nom de la matière <span className="text-[var(--color-status-retard-text)]">*</span>
                  </label>
                  <input className="w-full h-12 px-4 border border-[var(--color-outline-variant)] rounded-lg text-base focus:border-[var(--color-primary)] outline-none bg-[var(--color-surface)]" id="subjectName" name="subjectName" type="text" placeholder="Ex: Mathématiques" required />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-[var(--color-on-surface)]" htmlFor="coefficient">
                    Coefficient <span className="text-[var(--color-status-retard-text)]">*</span>
                  </label>
                  <input className="w-full h-12 px-4 border border-[var(--color-outline-variant)] rounded-lg text-base focus:border-[var(--color-primary)] outline-none bg-[var(--color-surface)]" id="coefficient" name="coefficient" type="number" step="0.5" min="0.5" defaultValue="1" required />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-[var(--color-on-surface)]" htmlFor="teacherId">
                    Enseignant associé <span className="text-[var(--color-status-retard-text)]">*</span>
                  </label>
                  <select className="w-full h-12 px-4 border border-[var(--color-outline-variant)] rounded-lg text-base focus:border-[var(--color-primary)] outline-none bg-[var(--color-surface)]" id="teacherId" name="teacherId" required>
                    <option value="">Sélectionner un enseignant</option>
                    {teachers.map(t => <option key={t.user_id} value={t.user_id}>{t.full_name}</option>)}
                  </select>
                </div>

              </div>
              
              <div className="px-6 py-4 border-t border-[var(--color-outline-variant)] bg-[var(--color-surface-bright)] flex justify-end gap-3 mt-auto">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-lg border border-[var(--color-outline)] text-[var(--color-on-surface)] font-semibold text-sm hover:bg-[#eff4ff] transition-colors" disabled={isPending}>Annuler</button>
                <button type="submit" className="px-5 py-2.5 rounded-lg bg-[var(--color-primary)] text-white font-semibold text-sm hover:opacity-90 transition-colors shadow-sm disabled:opacity-50" disabled={isPending}>
                  {isPending ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
