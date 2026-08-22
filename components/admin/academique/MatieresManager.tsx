'use client'

import { useState, useTransition, FormEvent } from 'react'
import { saveSchoolSubject } from '@/app/actions/academique'
import Link from 'next/link'

export type SubjectItem = {
  id: string
  name: string
  cycle: string
  category: string | null
  coefficient: number
}

type Props = {
  subjects: SubjectItem[]
}

export function MatieresManager({ subjects }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  
  const [selectedCycle, setSelectedCycle] = useState<string>('primaire')
  const [formCycle, setFormCycle] = useState<string>('primaire')

  const openAddModal = () => {
    setError(null)
    setIsModalOpen(true)
    setFormCycle('primaire')
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    
    startTransition(async () => {
      const result = await saveSchoolSubject(null, formData)
      if (result?.error) {
        setError(result.error)
      } else {
        setIsModalOpen(false)
      }
    })
  }
  
  const filteredSubjects = subjects.filter(s => s.cycle === selectedCycle)

  // Primary categories
  const primaryCategories = [
    'Français',
    'Mathématiques',
    'Sciences et technologies',
    'Sciences humaines',
    'Education sociale',
    'EAC',
    'EPS'
  ]

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-[var(--color-surface)] custom-scrollbar">
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
            <p className="text-base text-[var(--color-on-surface-variant)] mt-1">Configurez les matières par cycle pour les livrets et bulletins.</p>
          </div>
          <button onClick={openAddModal} className="flex items-center justify-center gap-2 bg-[var(--color-primary)] text-white h-12 px-6 rounded-full text-sm font-semibold hover:opacity-90 transition-colors shadow-sm w-full sm:w-auto shrink-0">
            <span className="material-symbols-outlined text-[20px]">add</span>
            Nouvelle matière
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
                value={selectedCycle}
                onChange={(e) => setSelectedCycle(e.target.value)}
                className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-lg px-4 py-2.5 text-sm font-semibold text-[var(--color-on-surface)] focus:border-[var(--color-primary)] outline-none"
              >
                <option value="primaire">Cycle Primaire</option>
                <option value="secondaire">Cycle Secondaire</option>
              </select>
            </div>
            <span className="text-sm font-medium text-[var(--color-on-surface-variant)]">{filteredSubjects.length} matières trouvées</span>
          </div>

          {filteredSubjects.length === 0 ? (
             <div className="p-12 flex flex-col items-center justify-center text-center text-[var(--color-on-surface-variant)] flex-1">
               <span className="material-symbols-outlined text-4xl mb-2 opacity-50">book</span>
               <p className="text-lg font-medium">Aucune matière configurée</p>
               <p className="text-sm">Ajoutez des matières pour commencer à saisir les notes.</p>
            </div>
          ) : (
            <div className="overflow-x-auto min-h-[250px] custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[var(--color-surface-container-low)] border-b border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] text-sm">
                    <th className="py-4 px-6 font-semibold">Matière</th>
                    {selectedCycle === 'primaire' && <th className="py-4 px-6 font-semibold">Catégorie</th>}
                    {selectedCycle === 'secondaire' && <th className="py-4 px-6 font-semibold text-center">Coefficient</th>}
                    <th className="py-4 px-6 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-outline-variant)] text-base">
                  {filteredSubjects.map((sub) => (
                    <tr key={sub.id} className="hover:bg-[var(--color-surface-container-lowest)]/50 transition-colors bg-[var(--color-surface-container-lowest)]">
                      <td className="py-3 px-6 font-medium text-[var(--color-on-surface)]">
                        {sub.name}
                      </td>
                      {selectedCycle === 'primaire' && (
                        <td className="py-3 px-6 text-[var(--color-on-surface-variant)]">
                          <span className="bg-[var(--color-surface-container-high)] px-3 py-1 rounded-full text-xs font-semibold">
                            {sub.category || 'Général'}
                          </span>
                        </td>
                      )}
                      {selectedCycle === 'secondaire' && (
                        <td className="py-3 px-6 text-center text-[var(--color-on-surface-variant)] font-semibold">
                          {sub.coefficient}
                        </td>
                      )}
                      <td className="py-3 px-6 text-right">
                        <button className="p-2 text-[var(--color-on-surface-variant)] hover:text-[var(--color-status-retard-text)] rounded-full transition-colors" title="Supprimer">
                          <span className="material-symbols-outlined text-[20px]">delete</span>
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

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--color-surface)] rounded-xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-6 border-b border-[var(--color-outline-variant)]">
              <h3 className="text-xl font-bold text-[var(--color-on-surface)]">Ajouter une matière</h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)]">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[var(--color-on-surface)]">
                  Cycle d'enseignement <span className="text-[var(--color-status-retard-text)]">*</span>
                </label>
                <div className="flex gap-2">
                  <label className="flex-1 cursor-pointer">
                    <input type="radio" name="cycle" value="primaire" className="peer sr-only" checked={formCycle === 'primaire'} onChange={() => setFormCycle('primaire')} />
                    <div className="py-2 text-center text-sm font-semibold rounded-lg border border-[var(--color-outline-variant)] peer-checked:bg-[var(--color-primary)] peer-checked:text-white peer-checked:border-[var(--color-primary)] transition-all">
                      Primaire
                    </div>
                  </label>
                  <label className="flex-1 cursor-pointer">
                    <input type="radio" name="cycle" value="secondaire" className="peer sr-only" checked={formCycle === 'secondaire'} onChange={() => setFormCycle('secondaire')} />
                    <div className="py-2 text-center text-sm font-semibold rounded-lg border border-[var(--color-outline-variant)] peer-checked:bg-[var(--color-primary)] peer-checked:text-white peer-checked:border-[var(--color-primary)] transition-all">
                      Secondaire
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[var(--color-on-surface)]" htmlFor="name">
                  Nom de la matière <span className="text-[var(--color-status-retard-text)]">*</span>
                </label>
                <input 
                  className="w-full h-12 px-4 border border-[var(--color-outline-variant)] rounded-lg text-base focus:border-[var(--color-primary)] outline-none bg-[var(--color-surface-container-lowest)]" 
                  id="name" 
                  name="name" 
                  type="text" 
                  placeholder={formCycle === 'primaire' ? "Ex: Calcul mental, Dictée..." : "Ex: Mathématiques, SVT..."}
                  required 
                />
              </div>

              {formCycle === 'primaire' && (
                <div className="flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-2">
                  <label className="text-sm font-semibold text-[var(--color-on-surface)]" htmlFor="category">
                    Catégorie (Groupe) <span className="text-[var(--color-status-retard-text)]">*</span>
                  </label>
                  <select className="w-full h-12 px-4 border border-[var(--color-outline-variant)] rounded-lg text-base focus:border-[var(--color-primary)] outline-none bg-[var(--color-surface-container-lowest)]" id="category" name="category" required>
                    <option value="">Sélectionner une catégorie...</option>
                    {primaryCategories.map(c => <option key={c} value={c}>{c}</option>)}
                    <option value="Autre">Autre</option>
                  </select>
                </div>
              )}

              {formCycle === 'secondaire' && (
                <div className="flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-2">
                  <label className="text-sm font-semibold text-[var(--color-on-surface)]" htmlFor="coefficient">
                    Coefficient <span className="text-[var(--color-status-retard-text)]">*</span>
                  </label>
                  <input className="w-full h-12 px-4 border border-[var(--color-outline-variant)] rounded-lg text-base focus:border-[var(--color-primary)] outline-none bg-[var(--color-surface-container-lowest)]" id="coefficient" name="coefficient" type="number" step="0.5" min="1" defaultValue="1" required />
                </div>
              )}

              <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-lg text-sm font-semibold text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)] transition-colors">
                  Annuler
                </button>
                <button type="submit" disabled={isPending} className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-[var(--color-primary)] text-white hover:opacity-90 transition-colors disabled:opacity-50 flex items-center gap-2">
                  {isPending ? <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span> : null}
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
