'use client'

import { useState, useTransition, FormEvent } from 'react'
import { saveGrades } from '@/app/actions/academique'
import Link from 'next/link'

type ClassItem = { id: string; name: string }
type SubjectItem = { id: string; subject_name: string; class_id: string }
type StudentItem = { id: string; last_name: string; first_name: string; matricule: string; class_id: string }
type GradeItem = { student_id: string; score: number; subject_name: string; term: string; evaluation_type: string; class_id: string }

type Props = {
  classes: ClassItem[]
  subjects: SubjectItem[]
  students: StudentItem[]
  existingGrades: GradeItem[]
}

export function NotesManager({ classes, subjects, students, existingGrades }: Props) {
  const [selectedClass, setSelectedClass] = useState<string>('')
  const [selectedSubject, setSelectedSubject] = useState<string>('')
  const [term, setTerm] = useState<string>('Trimestre 1')
  const [evaluation, setEvaluation] = useState<string>('devoir_mensuel')

  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<boolean>(false)

  const filteredStudents = selectedClass ? students.filter(s => s.class_id === selectedClass) : []
  const availableSubjects = selectedClass ? subjects.filter(s => s.class_id === selectedClass) : []

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    const formData = new FormData(e.currentTarget)
    
    startTransition(async () => {
      const result = await saveGrades(null, formData)
      if (result?.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      }
    })
  }

  const getStudentScore = (studentId: string) => {
    const grade = existingGrades.find(g => 
      g.student_id === studentId &&
      g.class_id === selectedClass &&
      g.subject_name === selectedSubject &&
      g.term === term &&
      g.evaluation_type === evaluation
    )
    return grade ? grade.score : ''
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
              <span className="text-sm font-semibold text-[var(--color-on-surface)]">Notes</span>
            </div>
            <h2 className="text-3xl font-bold text-[var(--color-on-surface)]">Saisie des Notes</h2>
            <p className="text-base text-[var(--color-on-surface-variant)] mt-1">Saisissez les notes d'évaluation par classe et matière.</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-outline-variant)] p-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-[var(--color-on-surface)]">Classe</label>
              <select 
                value={selectedClass} 
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full h-11 px-3 border border-[var(--color-outline-variant)] rounded-lg text-sm focus:border-[var(--color-primary)] outline-none bg-[var(--color-surface)]"
              >
                <option value="">Sélectionner...</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-[var(--color-on-surface)]">Matière</label>
              <select 
                value={selectedSubject} 
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full h-11 px-3 border border-[var(--color-outline-variant)] rounded-lg text-sm focus:border-[var(--color-primary)] outline-none bg-[var(--color-surface)]"
                disabled={!selectedClass}
              >
                <option value="">Sélectionner...</option>
                {availableSubjects.map(s => <option key={s.id} value={s.subject_name}>{s.subject_name}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-[var(--color-on-surface)]">Trimestre / Période</label>
              <select 
                value={term} 
                onChange={(e) => setTerm(e.target.value)}
                className="w-full h-11 px-3 border border-[var(--color-outline-variant)] rounded-lg text-sm focus:border-[var(--color-primary)] outline-none bg-[var(--color-surface)]"
              >
                <option value="Trimestre 1">Trimestre 1</option>
                <option value="Trimestre 2">Trimestre 2</option>
                <option value="Trimestre 3">Trimestre 3</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-[var(--color-on-surface)]">Évaluation</label>
              <select 
                value={evaluation} 
                onChange={(e) => setEvaluation(e.target.value)}
                className="w-full h-11 px-3 border border-[var(--color-outline-variant)] rounded-lg text-sm focus:border-[var(--color-primary)] outline-none bg-[var(--color-surface)]"
              >
                <option value="devoir_mensuel">Devoir (Interrogation)</option>
                <option value="composition_trimestrielle">Composition</option>
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-[var(--color-status-retard-bg)] text-[var(--color-status-retard-text)] p-3 rounded text-sm font-medium">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-[#e6f4ea] text-[#1e8e3e] p-3 rounded text-sm font-medium flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">check_circle</span>
            Notes enregistrées avec succès.
          </div>
        )}

        {/* Data Table */}
        {selectedClass && selectedSubject ? (
          <form onSubmit={handleSubmit} className="bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-outline-variant)] overflow-hidden shadow-sm flex flex-col">
            <input type="hidden" name="classId" value={selectedClass} />
            <input type="hidden" name="subjectName" value={selectedSubject} />
            <input type="hidden" name="term" value={term} />
            <input type="hidden" name="evaluationType" value={evaluation} />

            <div className="p-4 border-b border-[var(--color-outline-variant)] bg-[var(--color-surface-bright)] flex justify-between items-center">
              <h3 className="font-semibold text-[var(--color-on-surface)]">
                Grille de saisie ({filteredStudents.length} élèves)
              </h3>
              <button 
                type="submit" 
                disabled={isPending}
                className="bg-[var(--color-primary)] text-white px-6 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-colors disabled:opacity-50"
              >
                {isPending ? 'Enregistrement...' : 'Enregistrer les notes'}
              </button>
            </div>

            <div className="overflow-x-auto max-h-[60vh] custom-scrollbar">
              <table className="w-full text-left border-collapse relative">
                <thead className="sticky top-0 bg-[var(--color-surface-container-low)] z-10 shadow-sm">
                  <tr className="border-b border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] text-sm">
                    <th className="py-3 px-6 font-semibold w-16 text-center">N°</th>
                    <th className="py-3 px-6 font-semibold w-32">Matricule</th>
                    <th className="py-3 px-6 font-semibold">Nom & Prénoms</th>
                    <th className="py-3 px-6 font-semibold w-48 text-center">Note / 20</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-outline-variant)] text-base">
                  {filteredStudents.map((student, index) => (
                    <tr key={student.id} className="hover:bg-[var(--color-surface-container-lowest)]/50 transition-colors bg-[var(--color-surface-container-lowest)]">
                      <td className="py-2 px-6 text-center text-[var(--color-on-surface-variant)] text-sm">
                        {index + 1}
                      </td>
                      <td className="py-2 px-6 text-sm font-mono text-[var(--color-on-surface-variant)]">
                        {student.matricule}
                      </td>
                      <td className="py-2 px-6 font-medium text-[var(--color-on-surface)]">
                        {student.last_name} {student.first_name}
                      </td>
                      <td className="py-2 px-6">
                        <input 
                          type="number" 
                          step="0.25" 
                          min="0" 
                          max="20"
                          name={`grade_${student.id}`}
                          defaultValue={getStudentScore(student.id)}
                          className="w-full h-10 px-3 text-center font-semibold border border-[var(--color-outline-variant)] rounded text-base focus:border-[var(--color-primary)] outline-none bg-white transition-all"
                          placeholder="-"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </form>
        ) : (
          <div className="bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-outline-variant)] p-12 flex flex-col items-center justify-center text-center text-[var(--color-on-surface-variant)] min-h-[400px]">
            <span className="material-symbols-outlined text-4xl mb-2 opacity-50">edit_document</span>
            <p className="text-lg font-medium">Sélectionnez une classe et une matière</p>
            <p className="text-sm">La grille de saisie s'affichera ici.</p>
          </div>
        )}

      </div>
    </div>
  )
}
