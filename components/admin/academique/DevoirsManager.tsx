'use client'

import { useState, useTransition, FormEvent } from 'react'
import { publishHomework } from '@/app/actions/academique'
import Link from 'next/link'

type ClassItem = { id: string; name: string; level: string }
type SubjectItem = { id: string; name: string; cycle: string }
type StudentItem = { id: string; first_name: string; last_name: string; class_id: string }
type HomeworkItem = {
  id: string
  title: string
  subject_name: string
  due_date: string
  created_at: string
  attachment_url?: string
  target_students?: string[]
  class: { name: string } | null
  creator: { full_name: string } | null
}

type Props = {
  homeworks: HomeworkItem[]
  classes: ClassItem[]
  subjects: SubjectItem[]
  students?: StudentItem[]
}

export function DevoirsManager({ homeworks, classes, subjects, students = [] }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [selectedClassId, setSelectedClassId] = useState<string>('')
  const [assignmentMode, setAssignmentMode] = useState<'all' | 'selective'>('all')
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  
  const selectedClass = classes.find(c => c.id === selectedClassId)
  let classCycle = ''
  if (selectedClass) {
    if (selectedClass.level.toLowerCase().match(/cp|ce|cm/)) classCycle = 'primaire'
    else classCycle = 'secondaire'
  }
  const availableSubjects = classCycle ? subjects.filter(s => s.cycle === classCycle) : subjects
  const availableStudents = students.filter(s => s.class_id === selectedClassId)

  const openAddModal = () => {
    setError(null)
    setIsModalOpen(true)
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    
    if (assignmentMode === 'selective') {
      if (selectedStudents.length === 0) {
        setError("Veuillez sélectionner au moins un élève.");
        return;
      }
      formData.append('targetStudents', JSON.stringify(selectedStudents));
    }
    
    startTransition(async () => {
      const result = await publishHomework(null, formData)
      if (result?.error) {
        setError(result.error)
      } else {
        setIsModalOpen(false)
      }
    })
  }

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
              <span className="text-sm font-semibold text-[var(--color-on-surface)]">Devoirs</span>
            </div>
            <h2 className="text-3xl font-bold text-[var(--color-on-surface)]">Devoirs et Travaux</h2>
            <p className="text-base text-[var(--color-on-surface-variant)] mt-1">Publiez les devoirs à faire à la maison pour vos élèves.</p>
          </div>
          <button onClick={openAddModal} className="flex items-center justify-center gap-2 bg-[var(--color-primary)] text-white h-12 px-6 rounded-full text-sm font-semibold hover:opacity-90 transition-colors shadow-sm w-full sm:w-auto shrink-0">
            <span className="material-symbols-outlined text-[20px]">assignment_add</span>
            Publier un devoir
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
            <div className="relative flex-grow max-w-md">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-on-surface-variant)]">search</span>
              <input className="w-full pl-10 pr-4 py-2.5 bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-lg text-sm focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] outline-none transition-all" placeholder="Rechercher un devoir..." type="text"/>
            </div>
            <span className="text-sm font-medium text-[var(--color-on-surface-variant)]">{homeworks.length} devoirs</span>
          </div>

          {homeworks.length === 0 ? (
             <div className="p-12 flex flex-col items-center justify-center text-center text-[var(--color-on-surface-variant)] flex-1">
               <span className="material-symbols-outlined text-4xl mb-2 opacity-50">menu_book</span>
               <p className="text-lg font-medium">Aucun devoir publié</p>
               <p className="text-sm">Commencez par publier un devoir pour une classe.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
              {homeworks.map((hw) => (
                <div key={hw.id} className="bg-white border border-[var(--color-outline-variant)] rounded-xl p-5 hover:shadow-md transition-shadow flex flex-col">
                  <div className="flex justify-between items-start mb-3">
                    <span className="px-2.5 py-1 bg-[var(--color-surface-container-high)] text-[var(--color-on-surface)] rounded text-xs font-semibold uppercase tracking-wider">
                      {hw.subject_name}
                    </span>
                    <span className="px-2.5 py-1 bg-[#fff8e1] text-[#f57f17] rounded-full text-xs font-bold border border-[#ffe082]">
                      À rendre le {new Date(hw.due_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  <h3 className="font-bold text-[var(--color-on-surface)] text-lg mb-1 leading-tight">{hw.title}</h3>
                  <p className="text-sm text-[var(--color-on-surface-variant)] mb-4 flex-1">
                    Classe : {hw.class?.name || '-'} {hw.target_students ? <span className="text-xs bg-[#e0f7fa] text-[#006064] px-2 py-0.5 rounded-full ml-2">{hw.target_students.length} ciblés</span> : null}<br/>
                    Publié le : {new Date(hw.created_at).toLocaleDateString('fr-FR')} par {hw.creator?.full_name || 'Admin'}
                  </p>
                  <div className="flex gap-2 mt-auto">
                    {hw.attachment_url && (
                      <a href={hw.attachment_url.startsWith('http') ? hw.attachment_url : `https://mxttnddswkntrryshqzl.supabase.co/storage/v1/object/public/homework-attachments/${hw.attachment_url}`} target="_blank" rel="noreferrer" className="flex-1 bg-[#f0f4ff] text-[var(--color-primary)] border border-[#cce0ff] hover:bg-[#e0edff] py-2 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-1">
                        <span className="material-symbols-outlined text-[18px]">attachment</span> Pièce jointe
                      </a>
                    )}
                    <button className="flex-1 bg-[var(--color-surface-bright)] text-[var(--color-on-surface)] border border-[var(--color-outline-variant)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] py-2 rounded-lg text-sm font-semibold transition-colors">
                      Voir
                    </button>
                    <button className="px-3 bg-[var(--color-surface-bright)] text-[var(--color-status-retard-text)] border border-[var(--color-outline-variant)] hover:border-[var(--color-status-retard-text)] hover:bg-[#fff0f0] rounded-lg transition-colors flex items-center justify-center">
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal: Ajouter un devoir */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b1c30]/40 backdrop-blur-sm transition-opacity">
          <div className="bg-[var(--color-surface-container-lowest)] w-full max-w-lg rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-[var(--color-outline-variant)] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--color-outline-variant)] flex justify-between items-center bg-[var(--color-surface-bright)]">
              <h2 className="text-xl font-semibold text-[var(--color-on-surface)] flex items-center gap-2">
                <span className="material-symbols-outlined text-[var(--color-primary)]">assignment_add</span>
                Publier un devoir
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)] p-1 rounded-full hover:bg-[#dce9ff] transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex flex-col">
              <div className="p-6 overflow-y-auto max-h-[70vh] custom-scrollbar space-y-4">
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-[var(--color-on-surface)]" htmlFor="classId">
                    Classe <span className="text-[var(--color-status-retard-text)]">*</span>
                  </label>
                  <select 
                    className="w-full h-12 px-4 border border-[var(--color-outline-variant)] rounded-lg text-base focus:border-[var(--color-primary)] outline-none bg-[var(--color-surface)]" 
                    id="classId" 
                    name="classId" 
                    required
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                  >
                    <option value="">Sélectionner une classe</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-[var(--color-on-surface)]" htmlFor="subjectName">
                    Matière <span className="text-[var(--color-status-retard-text)]">*</span>
                  </label>
                  <select 
                    className="w-full h-12 px-4 border border-[var(--color-outline-variant)] rounded-lg text-base focus:border-[var(--color-primary)] outline-none bg-[var(--color-surface)]" 
                    id="subjectName" 
                    name="subjectName" 
                    required
                    disabled={!selectedClassId}
                  >
                    <option value="">Sélectionner une matière</option>
                    {availableSubjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-[var(--color-on-surface)]">
                    Pièce jointe (Optionnel)
                  </label>
                  <div className="flex flex-wrap gap-3 mt-1">
                    <button 
                      type="button" 
                      onClick={() => {
                        const input = document.getElementById('attachment_input') as HTMLInputElement;
                        if (input) {
                          input.removeAttribute('capture');
                          input.setAttribute('accept', 'image/*');
                          input.setAttribute('capture', 'environment');
                          input.click();
                        }
                      }}
                      className="flex-1 flex items-center justify-center gap-2 bg-[var(--color-surface-container-high)] text-[var(--color-on-surface)] border border-[var(--color-outline-variant)] py-2.5 px-4 rounded-lg text-sm font-semibold hover:bg-[#eff4ff] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-all"
                    >
                      <span className="material-symbols-outlined text-[20px]">photo_camera</span>
                      Prendre une photo
                    </button>

                    <button 
                      type="button" 
                      onClick={() => {
                        const input = document.getElementById('attachment_input') as HTMLInputElement;
                        if (input) {
                          input.removeAttribute('capture');
                          input.setAttribute('accept', '.pdf,.doc,.docx,image/*');
                          input.click();
                        }
                      }}
                      className="flex-1 flex items-center justify-center gap-2 bg-[var(--color-surface-container-high)] text-[var(--color-on-surface)] border border-[var(--color-outline-variant)] py-2.5 px-4 rounded-lg text-sm font-semibold hover:bg-[#eff4ff] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-all"
                    >
                      <span className="material-symbols-outlined text-[20px]">attach_file</span>
                      Joindre un document
                    </button>
                  </div>
                  
                  <input 
                    id="attachment_input" 
                    name="attachment" 
                    type="file" 
                    className="hidden" 
                    onChange={(e) => {
                      const fileLabel = document.getElementById('attachment_label');
                      if (fileLabel && e.target.files && e.target.files.length > 0) {
                        fileLabel.textContent = e.target.files[0].name;
                        fileLabel.classList.remove('hidden');
                      } else if (fileLabel) {
                        fileLabel.textContent = '';
                        fileLabel.classList.add('hidden');
                      }
                    }}
                  />
                  <div id="attachment_label" className="hidden mt-2 text-sm text-[var(--color-primary)] font-medium flex items-center gap-2 bg-[#eff4ff] p-2 rounded-lg border border-[var(--color-primary)]/20">
                    <span className="material-symbols-outlined text-[18px]">draft</span>
                    Fichier sélectionné
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-[var(--color-on-surface)]" htmlFor="title">
                    Titre du devoir <span className="text-[var(--color-status-retard-text)]">*</span>
                  </label>
                  <input className="w-full h-12 px-4 border border-[var(--color-outline-variant)] rounded-lg text-base focus:border-[var(--color-primary)] outline-none bg-[var(--color-surface)]" id="title" name="title" type="text" placeholder="Ex: Exercices sur les fractions" required />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-[var(--color-on-surface)]" htmlFor="description">
                    Description / Consignes
                  </label>
                  <textarea className="w-full p-4 border border-[var(--color-outline-variant)] rounded-lg text-base focus:border-[var(--color-primary)] outline-none bg-[var(--color-surface)] min-h-[100px]" id="description" name="description" placeholder="Détaillez le travail à faire..."></textarea>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-[var(--color-on-surface)]" htmlFor="dueDate">
                    Date limite de rendu <span className="text-[var(--color-status-retard-text)]">*</span>
                  </label>
                  <input className="w-full h-12 px-4 border border-[var(--color-outline-variant)] rounded-lg text-base focus:border-[var(--color-primary)] outline-none bg-[var(--color-surface)]" id="dueDate" name="dueDate" type="date" required />
                </div>

                {selectedClassId && (
                  <div className="flex flex-col gap-3 mt-2 border-t pt-4 border-[var(--color-outline-variant)]">
                    <label className="text-sm font-semibold text-[var(--color-on-surface)]">
                      Destinataires
                    </label>
                    <div className="flex flex-col gap-2">
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input type="radio" name="assignmentMode" checked={assignmentMode === 'all'} onChange={() => setAssignmentMode('all')} className="w-4 h-4 text-[var(--color-primary)] focus:ring-[var(--color-primary)]" />
                        Toute la classe
                      </label>
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input type="radio" name="assignmentMode" checked={assignmentMode === 'selective'} onChange={() => setAssignmentMode('selective')} className="w-4 h-4 text-[var(--color-primary)] focus:ring-[var(--color-primary)]" />
                        Élèves spécifiques
                      </label>
                    </div>

                    {assignmentMode === 'selective' && (
                      <div className="p-3 border border-[var(--color-outline-variant)] rounded-lg max-h-48 overflow-y-auto bg-[var(--color-surface-bright)]">
                        {availableStudents.length === 0 ? (
                          <p className="text-sm text-gray-500">Aucun élève trouvé dans cette classe.</p>
                        ) : (
                          availableStudents.map(student => (
                            <label key={student.id} className="flex items-center gap-3 p-2 hover:bg-[#f0f4ff] rounded cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={selectedStudents.includes(student.id)}
                                onChange={(e) => {
                                  if (e.target.checked) setSelectedStudents([...selectedStudents, student.id])
                                  else setSelectedStudents(selectedStudents.filter(id => id !== student.id))
                                }}
                                className="rounded text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                              />
                              <span className="text-sm">{student.last_name} {student.first_name}</span>
                            </label>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}

              </div>
              
              <div className="px-6 py-4 border-t border-[var(--color-outline-variant)] bg-[var(--color-surface-bright)] flex justify-end gap-3 mt-auto">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-lg border border-[var(--color-outline)] text-[var(--color-on-surface)] font-semibold text-sm hover:bg-[#eff4ff] transition-colors" disabled={isPending}>Annuler</button>
                <button type="submit" className="px-5 py-2.5 rounded-lg bg-[var(--color-primary)] text-white font-semibold text-sm hover:opacity-90 transition-colors shadow-sm disabled:opacity-50" disabled={isPending}>
                  {isPending ? 'Publication...' : 'Publier le devoir'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
