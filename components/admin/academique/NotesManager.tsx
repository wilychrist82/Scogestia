'use client'

import { useState, useTransition, FormEvent } from 'react'
import { savePrimaryGrades, saveSecondaryGrades } from '@/app/actions/academique'
import Link from 'next/link'

type ClassItem = { id: string; name: string; level?: string }
type SubjectItem = { id: string; name: string; cycle: string }
type StudentItem = { id: string; last_name: string; first_name: string; matricule: string; class_id: string }

type PrimaryGradeItem = { student_id: string; subject_id: string; month_number: number; score: number }
type SecondaryGradeItem = { student_id: string; subject_id: string; term: string; class_score: number | null; comp_score: number | null }

type Props = {
  classes: ClassItem[]
  subjects: SubjectItem[]
  students: StudentItem[]
  primaryGrades: PrimaryGradeItem[]
  secondaryGrades: SecondaryGradeItem[]
}

export function NotesManager({ classes, subjects, students, primaryGrades, secondaryGrades }: Props) {
  const [selectedCycle, setSelectedCycle] = useState<string>('primaire')
  const [selectedClass, setSelectedClass] = useState<string>('')
  const [selectedSubject, setSelectedSubject] = useState<string>('')
  const [selectedTerm, setSelectedTerm] = useState<string>('1er_trimestre') // only for secondary

  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<boolean>(false)

  const filteredClasses = classes.filter(c => {
    if (!c.level) return false;
    const l = c.level.toLowerCase();
    const isPrimary = ['cp1', 'cp2', 'ce1', 'ce2', 'cm1', 'cm2', 'primaire', 'maternelle', 's1', 's2'].includes(l);
    const isSecondary = ['6eme', '5eme', '4eme', '3eme', 'secondaire', 'college', 'collège'].includes(l);
    
    if (selectedCycle === 'primaire') return isPrimary;
    if (selectedCycle === 'secondaire') return isSecondary;
    return false;
  })
  const filteredSubjects = subjects.filter(s => s.cycle === selectedCycle)
  const filteredStudents = selectedClass ? students.filter(s => s.class_id === selectedClass) : []

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    const formData = new FormData(e.currentTarget)
    
    startTransition(async () => {
      let result;
      if (selectedCycle === 'primaire') {
        result = await savePrimaryGrades(null, formData)
      } else {
        result = await saveSecondaryGrades(null, formData)
      }

      if (result?.error) {
        setError(result.error)
      } else if (result?.success) {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      }
    })
  }

  // Pre-fill helpers
  const getPrimaryScore = (studentId: string, month: number) => {
    const g = primaryGrades.find(g => g.student_id === studentId && g.subject_id === selectedSubject && g.month_number === month)
    return g ? g.score : ''
  }

  const getSecondaryScore = (studentId: string, type: 'class' | 'comp') => {
    const g = secondaryGrades.find(g => g.student_id === studentId && g.subject_id === selectedSubject && g.term === selectedTerm)
    if (!g) return ''
    return type === 'class' ? (g.class_score ?? '') : (g.comp_score ?? '')
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-[var(--color-surface)] custom-scrollbar">
      <div className="max-w-[1280px] mx-auto space-y-6">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[var(--color-surface-container-lowest)] p-6 rounded-xl border border-[var(--color-outline-variant)]">
          <div>
            <div className="flex items-center gap-2 text-[var(--color-on-surface-variant)] mb-2">
              <Link href="/admin/academique" className="hover:text-[var(--color-primary)] transition-colors text-sm font-semibold">
                Académique
              </Link>
              <span className="material-symbols-outlined text-sm">chevron_right</span>
              <span className="text-sm font-semibold text-[var(--color-on-surface)]">Saisie des Notes</span>
            </div>
            <h2 className="text-3xl font-bold text-[var(--color-on-surface)]">Grille de saisie</h2>
            <p className="text-base text-[var(--color-on-surface-variant)] mt-1">Saisissez les notes de toute la classe comme sur Excel.</p>
          </div>
        </div>

        {error && (
          <div className="bg-[var(--color-status-retard-bg)] text-[var(--color-status-retard-text)] p-3 rounded text-sm font-medium">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-[var(--color-status-paye-bg)] text-[var(--color-status-paye-text)] p-3 rounded text-sm font-medium">
            Notes sauvegardées avec succès !
          </div>
        )}

        <div className="bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-outline-variant)] shadow-sm flex flex-col overflow-hidden">
          {/* Filters */}
          <div className="p-4 border-b border-[var(--color-outline-variant)] flex flex-wrap gap-4 bg-[var(--color-surface-bright)] items-end">
            <div className="flex flex-col gap-1.5 flex-1 min-w-[150px]">
              <label className="text-sm font-semibold text-[var(--color-on-surface)]">Cycle</label>
              <select 
                value={selectedCycle} 
                onChange={(e) => {
                  setSelectedCycle(e.target.value)
                  setSelectedClass('')
                  setSelectedSubject('')
                }}
                className="h-11 px-3 border border-[var(--color-outline-variant)] rounded-lg text-sm focus:border-[var(--color-primary)] outline-none bg-[var(--color-surface)]"
              >
                <option value="primaire">Primaire (Mensuel)</option>
                <option value="secondaire">Secondaire (Trimestriel)</option>
              </select>
            </div>
            
            <div className="flex flex-col gap-1.5 flex-1 min-w-[150px]">
              <label className="text-sm font-semibold text-[var(--color-on-surface)]">Classe</label>
              <select 
                value={selectedClass} 
                onChange={(e) => setSelectedClass(e.target.value)}
                className="h-11 px-3 border border-[var(--color-outline-variant)] rounded-lg text-sm focus:border-[var(--color-primary)] outline-none bg-[var(--color-surface)]"
              >
                <option value="">Sélectionner...</option>
                {filteredClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1.5 flex-1 min-w-[150px]">
              <label className="text-sm font-semibold text-[var(--color-on-surface)]">Matière</label>
              <select 
                value={selectedSubject} 
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="h-11 px-3 border border-[var(--color-outline-variant)] rounded-lg text-sm focus:border-[var(--color-primary)] outline-none bg-[var(--color-surface)]"
              >
                <option value="">Sélectionner...</option>
                {filteredSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            {selectedCycle === 'secondaire' && (
              <div className="flex flex-col gap-1.5 flex-1 min-w-[150px]">
                <label className="text-sm font-semibold text-[var(--color-on-surface)]">Trimestre</label>
                <select 
                  value={selectedTerm} 
                  onChange={(e) => setSelectedTerm(e.target.value)}
                  className="h-11 px-3 border border-[var(--color-outline-variant)] rounded-lg text-sm focus:border-[var(--color-primary)] outline-none bg-[var(--color-surface)]"
                >
                  <option value="1er_trimestre">1er Trimestre</option>
                  <option value="2e_trimestre">2e Trimestre</option>
                  <option value="3e_trimestre">3e Trimestre</option>
                  <option value="1er_semestre">1er Semestre</option>
                  <option value="2e_semestre">2e Semestre</option>
                </select>
              </div>
            )}
          </div>

          {/* Grid */}
          {!selectedClass || !selectedSubject ? (
            <div className="p-12 flex flex-col items-center justify-center text-center text-[var(--color-on-surface-variant)] flex-1 min-h-[300px]">
              <span className="material-symbols-outlined text-4xl mb-2 opacity-50">table</span>
              <p className="text-lg font-medium">Sélectionnez une classe et une matière</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="p-12 flex flex-col items-center justify-center text-center text-[var(--color-on-surface-variant)] flex-1 min-h-[300px]">
              <p className="text-lg font-medium">Aucun élève dans cette classe.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col">
              <input type="hidden" name="classId" value={selectedClass} />
              <input type="hidden" name="subjectId" value={selectedSubject} />
              {selectedCycle === 'secondaire' && <input type="hidden" name="term" value={selectedTerm} />}
              
              <div className="overflow-x-auto min-h-[400px] custom-scrollbar">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="bg-[var(--color-surface-container-low)] border-b border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] text-sm">
                      <th className="py-3 px-4 font-semibold sticky left-0 bg-[var(--color-surface-container-low)] z-10 border-r border-[var(--color-outline-variant)] shadow-[1px_0_0_var(--color-outline-variant)] min-w-[200px]">
                        Élève
                      </th>
                      {selectedCycle === 'primaire' ? (
                        Array.from({ length: 9 }).map((_, i) => (
                          <th key={i} className="py-3 px-2 font-semibold text-center w-[80px]">
                            Mois {i + 1}
                            <div className="text-[10px] font-normal opacity-70">/ 10</div>
                          </th>
                        ))
                      ) : (
                        <>
                          <th className="py-3 px-4 font-semibold text-center w-[120px]">
                            Note Classe
                            <div className="text-[10px] font-normal opacity-70">/ 20</div>
                          </th>
                          <th className="py-3 px-4 font-semibold text-center w-[120px]">
                            Composition
                            <div className="text-[10px] font-normal opacity-70">/ 20</div>
                          </th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-outline-variant)] text-sm">
                    {filteredStudents.map((student) => (
                      <tr key={student.id} className="hover:bg-[var(--color-surface-container-lowest)]/50 bg-[var(--color-surface-container-lowest)]">
                        <td className="py-2 px-4 font-medium text-[var(--color-on-surface)] sticky left-0 bg-[var(--color-surface-container-lowest)] z-10 border-r border-[var(--color-outline-variant)] shadow-[1px_0_0_var(--color-outline-variant)] truncate max-w-[200px]">
                          {student.last_name} {student.first_name}
                        </td>
                        
                        {selectedCycle === 'primaire' ? (
                          Array.from({ length: 9 }).map((_, i) => {
                            const month = i + 1;
                            return (
                              <td key={i} className="py-2 px-1 text-center">
                                <input 
                                  type="number" 
                                  step="0.25"
                                  min="0"
                                  max="10"
                                  name={`score_${month}_${student.id}`}
                                  defaultValue={getPrimaryScore(student.id, month)}
                                  className="w-16 h-9 text-center border border-[var(--color-outline-variant)] rounded bg-[var(--color-surface)] focus:border-[var(--color-primary)] outline-none"
                                />
                              </td>
                            )
                          })
                        ) : (
                          <>
                            <td className="py-2 px-2 text-center">
                              <input 
                                type="number" 
                                step="0.25"
                                min="0"
                                max="20"
                                name={`class_score_${student.id}`}
                                defaultValue={getSecondaryScore(student.id, 'class')}
                                className="w-20 h-9 text-center border border-[var(--color-outline-variant)] rounded bg-[var(--color-surface)] focus:border-[var(--color-primary)] outline-none mx-auto block"
                              />
                            </td>
                            <td className="py-2 px-2 text-center">
                              <input 
                                type="number" 
                                step="0.25"
                                min="0"
                                max="20"
                                name={`comp_score_${student.id}`}
                                defaultValue={getSecondaryScore(student.id, 'comp')}
                                className="w-20 h-9 text-center border border-[var(--color-outline-variant)] rounded bg-[var(--color-surface)] focus:border-[var(--color-primary)] outline-none mx-auto block"
                              />
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="p-4 border-t border-[var(--color-outline-variant)] bg-[var(--color-surface-bright)] flex justify-end">
                <button type="submit" disabled={isPending} className="px-6 py-3 rounded-lg text-sm font-semibold bg-[var(--color-primary)] text-white hover:opacity-90 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm">
                  {isPending ? <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span> : <span className="material-symbols-outlined text-[18px]">save</span>}
                  Enregistrer les notes
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
