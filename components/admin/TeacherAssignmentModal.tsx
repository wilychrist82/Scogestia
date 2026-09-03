'use client'

import { useState, useTransition, useEffect, FormEvent } from 'react'
import { getTeacherAssignments, assignTeacherToClass, removeTeacherAssignment, getSchoolClassesAndSubjects } from '@/app/actions/staff'

type Props = {
  isOpen: boolean
  onClose: () => void
  teacherId: string
  teacherName: string
}

export function TeacherAssignmentModal({ isOpen, onClose, teacherId, teacherName }: Props) {
  const [isPending, startTransition] = useTransition()
  const [assignments, setAssignments] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [selectedClassId, setSelectedClassId] = useState<string>('')

  useEffect(() => {
    if (isOpen && teacherId) {
      loadData()
      setSelectedClassId('')
    }
  }, [isOpen, teacherId])

  const loadData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [assignmentsData, metaData] = await Promise.all([
        getTeacherAssignments(teacherId),
        getSchoolClassesAndSubjects()
      ])
      setAssignments(assignmentsData)
      setClasses(metaData.classes)
      setSubjects(metaData.subjects)
    } catch (err: any) {
      setError("Erreur de chargement des données.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAssign = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    formData.append('teacherUserId', teacherId)
    
    startTransition(async () => {
      const result = await assignTeacherToClass(null, formData)
      if (result?.error) {
        setError(result.error)
      } else {
        await loadData() // Refresh list
        const form = e.target as HTMLFormElement
        form.reset() // Clear form after success
        setSelectedClassId('')
      }
    })
  }

  const selectedClassObj = classes.find(c => c.id === selectedClassId)
  const isPrimary = selectedClassObj ? ['cp1', 'cp2', 'ce1', 'ce2', 'cm1', 'cm2', 'primaire', 'maternelle', 's1', 's2'].includes(selectedClassObj.level?.toLowerCase()) : false


  const handleRemove = (assignmentId: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir retirer cette classe à l'enseignant ?")) return
    
    startTransition(async () => {
      const result = await removeTeacherAssignment(assignmentId)
      if (result?.error) {
        setError(result.error)
      } else {
        await loadData()
      }
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0b1c30]/40  transition-opacity">
      <div className="bg-[var(--color-surface-container-lowest)] w-full max-w-2xl max-h-[90vh] rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-[var(--color-outline-variant)] flex flex-col overflow-hidden animate-[fadeIn_0.2s_ease-out]">
        <div className="px-6 py-4 border-b border-[var(--color-outline-variant)] flex justify-between items-center bg-[var(--color-surface-bright)]">
          <div>
            <h2 className="text-xl font-semibold text-[var(--color-on-surface)]">
              Affectations de l'enseignant
            </h2>
            <p className="text-sm text-[var(--color-on-surface-variant)] mt-1">{teacherName}</p>
          </div>
          <button onClick={onClose} className="text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)] p-1 rounded-full hover:bg-[#dce9ff] transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {error && (
            <div className="bg-[var(--color-status-retard-bg)] text-[var(--color-status-retard-text)] p-3 rounded text-sm font-medium">
              {error}
            </div>
          )}

          {/* Formulaire d'ajout */}
          <div className="bg-[var(--color-surface-container-highest)] p-5 rounded-xl border border-[var(--color-outline-variant)]">
            <h3 className="text-sm font-bold text-[var(--color-on-surface)] mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              Ajouter une classe
            </h3>
            <form onSubmit={handleAssign} className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1 w-full">
                <label className="text-xs font-semibold text-[var(--color-on-surface-variant)] block mb-1">Classe</label>
                <select 
                  name="classId"
                  required
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-lg text-sm focus:outline-none focus:border-[var(--color-primary)] focus:border-2 transition-all h-10"
                  disabled={classes.length === 0}
                >
                  <option value="">
                    {classes.length === 0 ? "Aucune classe disponible" : "Sélectionner une classe..."}
                  </option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name} {c.level && `(${c.level})`}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1 w-full">
                <label className="text-xs font-semibold text-[var(--color-on-surface-variant)] block mb-1">Matière</label>
                {isPrimary ? (
                  <>
                    <input type="hidden" name="subjectName" value="Toutes les matières" />
                    <div className="w-full px-3 py-2 bg-[var(--color-surface-container-high)] border border-[var(--color-outline-variant)] rounded-lg text-sm text-[var(--color-on-surface-variant)] h-10 flex items-center cursor-not-allowed">
                      Toutes les matières (Primaire)
                    </div>
                  </>
                ) : (
                  <select 
                    name="subjectName"
                    required
                    className="w-full px-3 py-2 bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-lg text-sm focus:outline-none focus:border-[var(--color-primary)] focus:border-2 transition-all h-10"
                    disabled={subjects.length === 0}
                  >
                    <option value="">
                      {subjects.filter(s => s.cycle === 'secondaire').length === 0 ? "Aucune matière disponible" : "Sélectionner une matière..."}
                    </option>
                    {subjects.filter(s => s.cycle === 'secondaire').map(s => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                )}
              </div>
              <button 
                type="submit" 
                disabled={isPending || isLoading}
                className="w-full sm:w-auto px-5 h-10 rounded-lg bg-[var(--color-primary)] text-white font-semibold text-sm hover:opacity-90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isPending ? 'Ajout...' : 'Ajouter'}
              </button>
            </form>
          </div>

          {/* Liste des affectations */}
          <div>
            <h3 className="text-sm font-bold text-[var(--color-on-surface)] mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">list_alt</span>
              Classes assignées
            </h3>
            
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]"></div>
              </div>
            ) : assignments.length === 0 ? (
              <div className="text-center py-8 bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] border-dashed rounded-xl">
                <span className="material-symbols-outlined text-[32px] text-[var(--color-on-surface-variant)] mb-2">assignment_ind</span>
                <p className="text-sm text-[var(--color-on-surface-variant)]">Aucune classe n'est assignée à cet enseignant.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {assignments.map(assignment => (
                  <div key={assignment.id} className="flex items-center justify-between p-4 bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-lg hover:shadow-sm transition-shadow">
                    <div>
                      <h4 className="font-bold text-[var(--color-on-surface)] flex items-center gap-2">
                        {assignment.classes?.name}
                        {assignment.classes?.level && <span className="text-xs font-normal px-2 py-0.5 bg-[var(--color-surface-variant)] text-[var(--color-on-surface-variant)] rounded-full">{assignment.classes.level}</span>}
                      </h4>
                      <p className="text-sm text-[var(--color-on-surface-variant)] mt-1 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">book</span>
                        {assignment.subject_name}
                      </p>
                    </div>
                    <button 
                      onClick={() => handleRemove(assignment.id)}
                      disabled={isPending}
                      className="p-2 text-[var(--color-status-retard-text)] hover:bg-red-50 rounded-full transition-colors disabled:opacity-50"
                      title="Retirer cette classe"
                    >
                      <span className="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
