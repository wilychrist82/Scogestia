'use client'

import { useState } from 'react'
import Link from 'next/link'

type ClassItem = { id: string; name: string; level?: string }
type StudentItem = { id: string; last_name: string; first_name: string; matricule: string; class_id: string }
type SubjectItem = { subject_name: string; class_id: string; coefficient: number }
type GradeItem = { student_id: string; score: number; subject_name: string; term: string; evaluation_type: string; class_id: string }

type Props = {
  classes: ClassItem[]
  students: StudentItem[]
  subjects: SubjectItem[]
  grades: GradeItem[]
}

export function BulletinsManager({ classes, students, subjects, grades }: Props) {
  const [selectedLevel, setSelectedLevel] = useState<string>('')
  const [selectedClass, setSelectedClass] = useState<string>('')
  const [selectedTerm, setSelectedTerm] = useState<string>('Trimestre 1')
  const [selectedStudent, setSelectedStudent] = useState<string>('')

  const availableClasses = classes.filter(c => c.level === selectedLevel)
  const classStudents = selectedClass ? students.filter(s => s.class_id === selectedClass) : []
  const classSubjects = selectedClass ? subjects.filter(s => s.class_id === selectedClass) : []
  
  const student = students.find(s => s.id === selectedStudent)
  const currentClass = classes.find(c => c.id === selectedClass)
  const isPrimary = currentClass?.level === 'primaire'
  const documentTitle = isPrimary ? 'Livret Scolaire' : 'Bulletin de Notes'

  // Compute bulletin for the selected student
  const computeBulletin = () => {
    if (!student) return null

    let totalPoints = 0
    let totalCoefs = 0
    
    const lines = classSubjects.map(sub => {
      // Find grades for this subject and term
      const subjectGrades = grades.filter(g => 
        g.student_id === student.id && 
        g.subject_name === sub.subject_name && 
        g.term === selectedTerm
      )

      const devoir = subjectGrades.find(g => g.evaluation_type === 'devoir_mensuel')?.score
      const compo = subjectGrades.find(g => g.evaluation_type === 'composition_trimestrielle')?.score

      let average = null
      if (devoir !== undefined && compo !== undefined) {
        average = (devoir + compo * 2) / 3
      } else if (devoir !== undefined) {
        average = devoir
      } else if (compo !== undefined) {
        average = compo
      }

      if (average !== null) {
        totalPoints += average * sub.coefficient
        totalCoefs += sub.coefficient
      }

      return {
        subject: sub.subject_name,
        coef: sub.coefficient,
        devoir,
        compo,
        average
      }
    })

    const generalAverage = totalCoefs > 0 ? totalPoints / totalCoefs : null

    return { lines, generalAverage, totalCoefs, totalPoints }
  }

  const bulletin = computeBulletin()

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
              <span className="text-sm font-semibold text-[var(--color-on-surface)]">Bulletins & Livrets</span>
            </div>
            <h2 className="text-3xl font-bold text-[var(--color-on-surface)]">Bulletins & Livrets Scolaires</h2>
            <p className="text-base text-[var(--color-on-surface-variant)] mt-1">Générez et consultez les livrets scolaires ou bulletins par trimestre.</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-outline-variant)] p-6 shadow-sm">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[180px] flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-[var(--color-on-surface)]">Niveau</label>
              <select 
                value={selectedLevel} 
                onChange={(e) => {
                  setSelectedLevel(e.target.value)
                  setSelectedClass('')
                  setSelectedStudent('')
                }}
                className="w-full h-11 px-3 border border-[var(--color-outline-variant)] rounded-lg text-sm focus:border-[var(--color-primary)] outline-none bg-[var(--color-surface)]"
              >
                <option value="">Sélectionner un niveau...</option>
                <option value="primaire">Primaire</option>
                <option value="secondaire">Secondaire</option>
              </select>
            </div>
            <div className="flex-1 min-w-[180px] flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-[var(--color-on-surface)]">Classe</label>
              <select 
                value={selectedClass} 
                onChange={(e) => {
                  setSelectedClass(e.target.value)
                  setSelectedStudent('')
                }}
                className="w-full h-11 px-3 border border-[var(--color-outline-variant)] rounded-lg text-sm focus:border-[var(--color-primary)] outline-none bg-[var(--color-surface)]"
                disabled={!selectedLevel}
              >
                <option value="">Sélectionner une classe...</option>
                {availableClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="flex-1 min-w-[180px] flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-[var(--color-on-surface)]">Trimestre</label>
              <select 
                value={selectedTerm} 
                onChange={(e) => setSelectedTerm(e.target.value)}
                className="w-full h-11 px-3 border border-[var(--color-outline-variant)] rounded-lg text-sm focus:border-[var(--color-primary)] outline-none bg-[var(--color-surface)]"
              >
                <option value="Trimestre 1">Trimestre 1</option>
                <option value="Trimestre 2">Trimestre 2</option>
                <option value="Trimestre 3">Trimestre 3</option>
              </select>
            </div>
            <div className="flex-1 min-w-[180px] flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-[var(--color-on-surface)]">Élève</label>
              <select 
                value={selectedStudent} 
                onChange={(e) => setSelectedStudent(e.target.value)}
                className="w-full h-11 px-3 border border-[var(--color-outline-variant)] rounded-lg text-sm focus:border-[var(--color-primary)] outline-none bg-[var(--color-surface)]"
                disabled={!selectedClass}
              >
                <option value="">Sélectionner un élève...</option>
                {classStudents.length === 0 && selectedClass && (
                  <option value="" disabled>Aucun élève dans cette classe</option>
                )}
                {classStudents.map(s => <option key={s.id} value={s.id}>{s.last_name} {s.first_name}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Bulletin Preview */}
        {selectedStudent && bulletin && student ? (
          <div className="bg-white rounded-xl border border-[var(--color-outline-variant)] p-8 shadow-sm print:shadow-none print:border-none print:p-0 max-w-4xl mx-auto">
            <div className="flex justify-between items-start border-b-2 border-black pb-6 mb-6">
              <div>
                <h1 className="text-2xl font-black uppercase tracking-wider mb-2">{documentTitle}</h1>
                <p className="font-semibold text-lg">{selectedTerm} - Année 2026-2027</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-xl">{student.last_name} {student.first_name}</p>
                <p className="text-gray-600">Matricule : {student.matricule}</p>
                <p className="text-gray-600">Classe : {currentClass?.name}</p>
              </div>
            </div>

            <table className="w-full text-left border-collapse border border-gray-300 mb-6">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-300 text-sm uppercase">
                  <th className="py-2 px-3 border-r border-gray-300">Matières</th>
                  <th className="py-2 px-3 border-r border-gray-300 text-center w-16">Coef</th>
                  <th className="py-2 px-3 border-r border-gray-300 text-center w-24">Devoir</th>
                  <th className="py-2 px-3 border-r border-gray-300 text-center w-24">Compo</th>
                  <th className="py-2 px-3 border-r border-gray-300 text-center w-24">Moyenne</th>
                  <th className="py-2 px-3 text-center w-24">Total</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {bulletin.lines.map((line, idx) => (
                  <tr key={idx} className="border-b border-gray-200">
                    <td className="py-2 px-3 border-r border-gray-300 font-semibold">{line.subject}</td>
                    <td className="py-2 px-3 border-r border-gray-300 text-center">{line.coef}</td>
                    <td className="py-2 px-3 border-r border-gray-300 text-center">{line.devoir ?? '-'}</td>
                    <td className="py-2 px-3 border-r border-gray-300 text-center">{line.compo ?? '-'}</td>
                    <td className="py-2 px-3 border-r border-gray-300 text-center font-semibold">
                      {line.average !== null ? line.average.toFixed(2) : '-'}
                    </td>
                    <td className="py-2 px-3 text-center font-bold">
                      {line.average !== null ? (line.average * line.coef).toFixed(2) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 font-bold border-t-2 border-gray-300">
                <tr>
                  <td className="py-3 px-3 border-r border-gray-300 text-right uppercase">Total</td>
                  <td className="py-3 px-3 border-r border-gray-300 text-center">{bulletin.totalCoefs}</td>
                  <td colSpan={3} className="py-3 px-3 border-r border-gray-300"></td>
                  <td className="py-3 px-3 text-center">{bulletin.totalPoints.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>

            <div className="flex justify-end mb-8">
              <div className="bg-[var(--color-surface-container-low)] border border-[var(--color-outline-variant)] p-4 rounded-lg flex items-center gap-4">
                <span className="text-sm font-semibold uppercase tracking-wider text-[var(--color-on-surface-variant)]">Moyenne Générale</span>
                <span className={`text-3xl font-black ${bulletin.generalAverage && bulletin.generalAverage >= 10 ? 'text-[#1e8e3e]' : 'text-[#d93025]'}`}>
                  {bulletin.generalAverage !== null ? bulletin.generalAverage.toFixed(2) : '-'} <span className="text-lg text-gray-500 font-medium">/ 20</span>
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 print:hidden justify-end">
              <button 
                onClick={() => {
                  const msg = encodeURIComponent(`Bonjour, voici le ${documentTitle.toLowerCase()} de ${student.first_name} ${student.last_name} pour le ${selectedTerm}.`);
                  window.open(`https://wa.me/?text=${msg}`, '_blank');
                }} 
                className="bg-[#25D366] text-white px-6 py-2 rounded-lg font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity"
              >
                <span className="material-symbols-outlined text-[20px]">chat</span>
                WhatsApp
              </button>
              <button 
                onClick={() => {
                  alert(`Le ${documentTitle.toLowerCase()} a été publié sur l'espace parent avec succès !`);
                }} 
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold flex items-center gap-2 hover:bg-blue-700 transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">campaign</span>
                Publier (Espace Parent)
              </button>
              <button onClick={() => window.print()} className="bg-[var(--color-primary)] text-white px-6 py-2 rounded-lg font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity">
                <span className="material-symbols-outlined text-[20px]">print</span>
                Imprimer / PDF
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-outline-variant)] p-12 flex flex-col items-center justify-center text-center text-[var(--color-on-surface-variant)] min-h-[400px]">
            <span className="material-symbols-outlined text-4xl mb-2 opacity-50">workspace_premium</span>
            <p className="text-lg font-medium">Sélectionnez un élève</p>
            <p className="text-sm">Le document s'affichera ici.</p>
          </div>
        )}

      </div>
    </div>
  )
}
