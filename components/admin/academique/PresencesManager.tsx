'use client'

import { useState, useTransition, FormEvent } from 'react'
import { saveAttendance } from '@/app/actions/academique'
import Link from 'next/link'

type ClassItem = { id: string; name: string }
type StudentItem = { id: string; last_name: string; first_name: string; matricule: string; class_id: string }
type AttendanceItem = { student_id: string; status: string }

type Props = {
  classes: ClassItem[]
  students: StudentItem[]
  existingAttendance: AttendanceItem[]
}

export function PresencesManager({ classes, students, existingAttendance }: Props) {
  const [selectedClass, setSelectedClass] = useState<string>('')
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])

  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<boolean>(false)

  const filteredStudents = selectedClass ? students.filter(s => s.class_id === selectedClass) : []

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    const formData = new FormData(e.currentTarget)
    
    startTransition(async () => {
      const result = await saveAttendance(null, formData)
      if (result?.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      }
    })
  }

  const getStudentStatus = (studentId: string) => {
    const record = existingAttendance.find(a => a.student_id === studentId)
    return record ? record.status : 'present' // Default to present for new records
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
              <span className="text-sm font-semibold text-[var(--color-on-surface)]">Présences</span>
            </div>
            <h2 className="text-3xl font-bold text-[var(--color-on-surface)]">Feuille de Présence</h2>
            <p className="text-base text-[var(--color-on-surface-variant)] mt-1">Gérez l'appel et suivez l'assiduité des élèves.</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-outline-variant)] p-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-[var(--color-on-surface)]">Classe</label>
              <select 
                value={selectedClass} 
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full h-11 px-3 border border-[var(--color-outline-variant)] rounded-lg text-sm focus:border-[var(--color-primary)] outline-none bg-[var(--color-surface)]"
              >
                <option value="">Sélectionner une classe...</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-[var(--color-on-surface)]">Date de l'appel</label>
              <input 
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full h-11 px-3 border border-[var(--color-outline-variant)] rounded-lg text-sm focus:border-[var(--color-primary)] outline-none bg-[var(--color-surface)]"
              />
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
            Appel enregistré avec succès.
          </div>
        )}

        {/* Data Table */}
        {selectedClass ? (
          <form onSubmit={handleSubmit} className="bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-outline-variant)] overflow-hidden shadow-sm flex flex-col">
            <input type="hidden" name="classId" value={selectedClass} />
            <input type="hidden" name="date" value={selectedDate} />

            <div className="p-4 border-b border-[var(--color-outline-variant)] bg-[var(--color-surface-bright)] flex justify-between items-center">
              <h3 className="font-semibold text-[var(--color-on-surface)]">
                Liste des élèves ({filteredStudents.length})
              </h3>
              <button 
                type="submit" 
                disabled={isPending}
                className="bg-[var(--color-primary)] text-white px-6 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-colors disabled:opacity-50"
              >
                {isPending ? 'Enregistrement...' : "Valider l'appel"}
              </button>
            </div>

            <div className="overflow-x-auto max-h-[60vh] custom-scrollbar">
              <table className="w-full text-left border-collapse relative">
                <thead className="sticky top-0 bg-[var(--color-surface-container-low)] z-10 shadow-sm">
                  <tr className="border-b border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] text-sm">
                    <th className="py-3 px-6 font-semibold w-16 text-center">N°</th>
                    <th className="py-3 px-6 font-semibold w-32">Matricule</th>
                    <th className="py-3 px-6 font-semibold">Nom & Prénoms</th>
                    <th className="py-3 px-6 font-semibold w-[400px] text-center">Statut (Présent, Absent, Retard)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-outline-variant)] text-base">
                  {filteredStudents.map((student, index) => {
                    const defaultStatus = getStudentStatus(student.id)
                    return (
                      <tr key={student.id} className="hover:bg-[var(--color-surface-container-lowest)]/50 transition-colors bg-[var(--color-surface-container-lowest)]">
                        <td className="py-3 px-6 text-center text-[var(--color-on-surface-variant)] text-sm">
                          {index + 1}
                        </td>
                        <td className="py-3 px-6 text-sm font-mono text-[var(--color-on-surface-variant)]">
                          {student.matricule}
                        </td>
                        <td className="py-3 px-6 font-medium text-[var(--color-on-surface)]">
                          {student.last_name} {student.first_name}
                        </td>
                        <td className="py-3 px-6 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input type="radio" name={\`attendance_\${student.id}\`} value="present" defaultChecked={defaultStatus === 'present'} className="w-4 h-4 text-[#1e8e3e] border-gray-300 focus:ring-[#1e8e3e]" />
                              <span className="text-sm font-medium text-[var(--color-on-surface)]">Présent</span>
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer ml-4">
                              <input type="radio" name={\`attendance_\${student.id}\`} value="absent" defaultChecked={defaultStatus === 'absent'} className="w-4 h-4 text-[#d93025] border-gray-300 focus:ring-[#d93025]" />
                              <span className="text-sm font-medium text-[var(--color-on-surface)]">Absent</span>
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer ml-4">
                              <input type="radio" name={\`attendance_\${student.id}\`} value="retard" defaultChecked={defaultStatus === 'retard'} className="w-4 h-4 text-[#e37400] border-gray-300 focus:ring-[#e37400]" />
                              <span className="text-sm font-medium text-[var(--color-on-surface)]">Retard</span>
                            </label>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </form>
        ) : (
          <div className="bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-outline-variant)] p-12 flex flex-col items-center justify-center text-center text-[var(--color-on-surface-variant)] min-h-[400px]">
            <span className="material-symbols-outlined text-4xl mb-2 opacity-50">fact_check</span>
            <p className="text-lg font-medium">Sélectionnez une classe pour commencer l'appel</p>
            <p className="text-sm">La liste des élèves s'affichera ici.</p>
          </div>
        )}

      </div>
    </div>
  )
}
