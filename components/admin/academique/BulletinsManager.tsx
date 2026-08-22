'use client'

import { useState, useRef } from 'react'

type ClassItem = { id: string; name: string; level?: string }
type StudentItem = { id: string; last_name: string; first_name: string; matricule: string; class_id: string }
type SubjectItem = { id: string; name: string; cycle: string; category: string | null; coefficient: number }

type PrimaryGradeItem = { student_id: string; subject_id: string; month_number: number; score: number }
type SecondaryGradeItem = { student_id: string; subject_id: string; term: string; class_score: number | null; comp_score: number | null }

type Props = {
  classes: ClassItem[]
  students: StudentItem[]
  subjects: SubjectItem[]
  primaryGrades: PrimaryGradeItem[]
  secondaryGrades: SecondaryGradeItem[]
  schoolName: string
}

export function BulletinsManager({ classes, students, subjects, primaryGrades, secondaryGrades, schoolName }: Props) {
  const [selectedLevel, setSelectedLevel] = useState<string>('')
  const [selectedClass, setSelectedClass] = useState<string>('')
  const [selectedTerm, setSelectedTerm] = useState<string>('1er_trimestre')
  const [selectedStudent, setSelectedStudent] = useState<string>('')

  const printRef = useRef<HTMLDivElement>(null)

  const availableClasses = selectedLevel ? classes.filter(c => c.level === selectedLevel) : []
  const availableStudents = selectedClass ? students.filter(s => s.class_id === selectedClass) : []

  const handlePrint = () => {
    window.print()
  }

  const student = students.find(s => s.id === selectedStudent)
  const cls = classes.find(c => c.id === selectedClass)

  const renderPrimaryLivret = () => {
    if (!student || !cls) return null

    // Get subjects for primary
    const primarySubjects = subjects.filter(s => s.cycle === 'primaire')
    
    // Group by category
    const groupedSubjects: Record<string, SubjectItem[]> = {}
    primarySubjects.forEach(s => {
      const cat = s.category || 'Général'
      if (!groupedSubjects[cat]) groupedSubjects[cat] = []
      groupedSubjects[cat].push(s)
    })

    const months = Array.from({ length: 9 }, (_, i) => i + 1)

    const getScore = (subjectId: string, month: number) => {
      const grade = primaryGrades.find(g => g.student_id === student.id && g.subject_id === subjectId && g.month_number === month)
      return grade ? grade.score : null
    }

    return (
      <div className="bg-white p-8 rounded-xl shadow-sm border border-[var(--color-outline-variant)] text-black" ref={printRef}>
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-black pb-6 mb-6">
          <div className="w-1/3 text-center">
            <h2 className="font-bold text-lg uppercase">RÉPUBLIQUE TOGOLAISE</h2>
            <p className="text-sm italic">Travail - Liberté - Patrie</p>
          </div>
          <div className="w-1/3 text-center">
            <h1 className="font-black text-2xl uppercase">{schoolName}</h1>
            <p className="text-sm font-semibold">LIVRET SCOLAIRE</p>
          </div>
          <div className="w-1/3 text-right">
            <p className="font-bold">Année Scolaire : 2026 - 2027</p>
          </div>
        </div>

        {/* Student Info */}
        <div className="flex justify-between items-center mb-8 bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div>
            <p className="text-sm text-gray-600">Nom et Prénom(s)</p>
            <p className="text-lg font-bold">{student.last_name} {student.first_name}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Classe</p>
            <p className="text-lg font-bold">{cls.name}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Matricule</p>
            <p className="text-lg font-bold">{student.matricule}</p>
          </div>
        </div>

        {/* Grades Table */}
        <div className="overflow-x-auto mb-8">
          <table className="w-full text-sm border-collapse border border-black">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-black p-2 text-left w-1/4">DISCIPLINES</th>
                {months.map(m => (
                  <th key={m} className="border border-black p-2 text-center w-16">{m}e Mois</th>
                ))}
                <th className="border border-black p-2 text-center w-16 bg-gray-200">MOY.</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(groupedSubjects).map(([category, subjs]) => (
                <React.Fragment key={category}>
                  <tr className="bg-gray-50">
                    <td colSpan={11} className="border border-black p-2 font-bold italic">{category}</td>
                  </tr>
                  {subjs.map(subj => {
                    let total = 0
                    let count = 0
                    months.forEach(m => {
                      const score = getScore(subj.id, m)
                      if (score !== null) { total += score; count++ }
                    })
                    const avg = count > 0 ? (total / count).toFixed(2) : ''

                    return (
                      <tr key={subj.id}>
                        <td className="border border-black p-2 pl-6">{subj.name}</td>
                        {months.map(m => (
                          <td key={m} className="border border-black p-2 text-center font-medium">
                            {getScore(subj.id, m) ?? ''}
                          </td>
                        ))}
                        <td className="border border-black p-2 text-center font-bold bg-gray-100">{avg}</td>
                      </tr>
                    )
                  })}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-start mt-12 px-8">
          <div className="text-center">
            <p className="font-bold underline mb-16">Le Maître / La Maîtresse</p>
          </div>
          <div className="text-center">
            <p className="font-bold underline mb-16">Le Directeur / La Directrice</p>
          </div>
        </div>
      </div>
    )
  }

  const renderSecondaryBulletin = () => {
    if (!student || !cls) return null

    const secondarySubjects = subjects.filter(s => s.cycle === 'secondaire')
    let totalCoef = 0
    let totalProduct = 0

    const rows = secondarySubjects.map(subj => {
      const g = secondaryGrades.find(g => g.student_id === student.id && g.subject_id === subj.id && g.term === selectedTerm)
      
      const cScore = g?.class_score ?? null
      const compScore = g?.comp_score ?? null
      
      let moy = null
      if (cScore !== null && compScore !== null) {
        moy = (cScore + compScore) / 2
      } else if (cScore !== null) {
        moy = cScore
      } else if (compScore !== null) {
        moy = compScore
      }

      let produit = null
      if (moy !== null) {
        produit = moy * subj.coefficient
        totalCoef += subj.coefficient
        totalProduct += produit
      }

      return {
        ...subj,
        cScore,
        compScore,
        moy,
        produit,
        appr: moy !== null ? (moy >= 16 ? 'Très Bien' : moy >= 14 ? 'Bien' : moy >= 12 ? 'Assez Bien' : moy >= 10 ? 'Passable' : 'Insuffisant') : ''
      }
    })

    const termAvg = totalCoef > 0 ? (totalProduct / totalCoef).toFixed(2) : '0.00'

    return (
      <div className="bg-white p-8 rounded-xl shadow-sm border border-[var(--color-outline-variant)] text-black" ref={printRef}>
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-black pb-6 mb-6">
          <div className="w-1/3 text-center">
            <h2 className="font-bold text-lg uppercase">RÉPUBLIQUE TOGOLAISE</h2>
            <p className="text-sm italic">Travail - Liberté - Patrie</p>
          </div>
          <div className="w-1/3 text-center">
            <h1 className="font-black text-2xl uppercase">{schoolName}</h1>
            <p className="text-sm font-semibold">BULLETIN DE NOTES</p>
          </div>
          <div className="w-1/3 text-right">
            <p className="font-bold">Année Scolaire : 2026 - 2027</p>
            <p className="font-semibold text-gray-700">{selectedTerm.replace('_', ' ').toUpperCase()}</p>
          </div>
        </div>

        {/* Student Info */}
        <div className="flex justify-between items-center mb-8 bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div>
            <p className="text-sm text-gray-600">Nom et Prénom(s)</p>
            <p className="text-lg font-bold">{student.last_name} {student.first_name}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Classe</p>
            <p className="text-lg font-bold">{cls.name}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Matricule</p>
            <p className="text-lg font-bold">{student.matricule}</p>
          </div>
        </div>

        {/* Grades Table */}
        <div className="overflow-x-auto mb-8">
          <table className="w-full text-sm border-collapse border border-black">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-black p-2 text-left">MATIÈRES</th>
                <th className="border border-black p-2 text-center w-20">NOTE CL.</th>
                <th className="border border-black p-2 text-center w-20">COMPO.</th>
                <th className="border border-black p-2 text-center w-20 bg-gray-200">MOY. /20</th>
                <th className="border border-black p-2 text-center w-16">COEF</th>
                <th className="border border-black p-2 text-center w-20 bg-gray-200">PRODUIT</th>
                <th className="border border-black p-2 text-left pl-4">APPRÉCIATION</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.id}>
                  <td className="border border-black p-2 font-semibold">{row.name}</td>
                  <td className="border border-black p-2 text-center">{row.cScore !== null ? row.cScore.toFixed(2) : ''}</td>
                  <td className="border border-black p-2 text-center">{row.compScore !== null ? row.compScore.toFixed(2) : ''}</td>
                  <td className="border border-black p-2 text-center font-bold bg-gray-100">{row.moy !== null ? row.moy.toFixed(2) : ''}</td>
                  <td className="border border-black p-2 text-center">{row.coefficient}</td>
                  <td className="border border-black p-2 text-center font-bold bg-gray-100">{row.produit !== null ? row.produit.toFixed(2) : ''}</td>
                  <td className="border border-black p-2 text-left pl-4 italic">{row.appr}</td>
                </tr>
              ))}
              {/* Totals */}
              <tr className="bg-gray-100 font-bold border-t-2 border-black">
                <td colSpan={4} className="border border-black p-2 text-right">TOTAL</td>
                <td className="border border-black p-2 text-center">{totalCoef}</td>
                <td className="border border-black p-2 text-center">{totalProduct.toFixed(2)}</td>
                <td className="border border-black p-2"></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Results */}
        <div className="flex gap-8 mb-8">
          <div className="w-1/2 p-6 bg-gray-50 border border-gray-200 rounded-xl flex flex-col justify-center items-center">
            <p className="text-gray-600 font-semibold mb-2">MOYENNE TRIMESTRIELLE</p>
            <p className="text-4xl font-black text-black">{termAvg} <span className="text-xl text-gray-500 font-medium">/ 20</span></p>
          </div>
          <div className="w-1/2 p-6 bg-gray-50 border border-gray-200 rounded-xl flex flex-col justify-center items-center">
            <p className="text-gray-600 font-semibold mb-2">RANG</p>
            <p className="text-4xl font-black text-black">1<span className="text-xl">er</span> <span className="text-sm font-medium text-gray-500">/ {availableStudents.length}</span></p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-start mt-12 px-8">
          <div className="text-center w-1/3">
            <p className="font-bold underline mb-16">Le Professeur Principal</p>
          </div>
          <div className="text-center w-1/3">
            <div className="border border-black p-4 rounded-lg inline-block text-left w-full">
              <p className="font-bold mb-2 underline">Décision du conseil</p>
              <label className="flex items-center gap-2"><input type="checkbox" checked={Number(termAvg) >= 14} readOnly /> Félicitations</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={Number(termAvg) >= 12 && Number(termAvg) < 14} readOnly /> Encouragements</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={Number(termAvg) >= 10 && Number(termAvg) < 12} readOnly /> Tableau d'honneur</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={Number(termAvg) < 10} readOnly /> Avertissement</label>
            </div>
          </div>
          <div className="text-center w-1/3">
            <p className="font-bold underline mb-16">Le Chef d'Établissement</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-[var(--color-surface)] custom-scrollbar">
      <div className="max-w-[1280px] mx-auto space-y-6">
        
        {/* Header Options */}
        <div className="flex flex-col gap-4 bg-[var(--color-surface-container-lowest)] p-6 rounded-xl border border-[var(--color-outline-variant)]">
          <div>
            <h2 className="text-2xl font-bold text-[var(--color-on-surface)]">Bulletins & Livrets Scolaires</h2>
            <p className="text-base text-[var(--color-on-surface-variant)] mt-1">Générez et consultez les livrets scolaires ou bulletins par élève.</p>
          </div>

          <div className="flex flex-wrap gap-4 items-end mt-4">
            <div className="flex-1 min-w-[150px] flex flex-col gap-1.5">
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
            
            <div className="flex-1 min-w-[150px] flex flex-col gap-1.5">
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

            {selectedLevel === 'secondaire' && (
              <div className="flex-1 min-w-[150px] flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[var(--color-on-surface)]">Trimestre</label>
                <select 
                  value={selectedTerm} 
                  onChange={(e) => setSelectedTerm(e.target.value)}
                  className="w-full h-11 px-3 border border-[var(--color-outline-variant)] rounded-lg text-sm focus:border-[var(--color-primary)] outline-none bg-[var(--color-surface)]"
                >
                  <option value="1er_trimestre">1er Trimestre</option>
                  <option value="2e_trimestre">2e Trimestre</option>
                  <option value="3e_trimestre">3e Trimestre</option>
                  <option value="1er_semestre">1er Semestre</option>
                  <option value="2e_semestre">2e Semestre</option>
                </select>
              </div>
            )}

            <div className="flex-1 min-w-[150px] flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-[var(--color-on-surface)]">Élève</label>
              <select 
                value={selectedStudent} 
                onChange={(e) => setSelectedStudent(e.target.value)}
                className="w-full h-11 px-3 border border-[var(--color-outline-variant)] rounded-lg text-sm focus:border-[var(--color-primary)] outline-none bg-[var(--color-surface)]"
                disabled={!selectedClass}
              >
                <option value="">Sélectionner un élève...</option>
                {availableStudents.map(s => <option key={s.id} value={s.id}>{s.last_name} {s.first_name}</option>)}
              </select>
            </div>
          </div>
        </div>

        {selectedStudent ? (
          <div className="bg-[var(--color-surface-container-lowest)] p-6 rounded-xl border border-[var(--color-outline-variant)] shadow-sm">
            <div className="flex justify-end gap-3 mb-6">
              <button 
                onClick={handlePrint}
                className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-[var(--color-primary)] text-white hover:opacity-90 transition-colors flex items-center gap-2 shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">print</span>
                Imprimer / PDF
              </button>
            </div>
            
            {/* Render appropriate bulletin */}
            <div className="print-container overflow-x-auto custom-scrollbar pb-4">
              <div className="min-w-[800px]">
                {selectedLevel === 'primaire' ? renderPrimaryLivret() : renderSecondaryBulletin()}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-[var(--color-surface-container-lowest)] p-12 rounded-xl border border-[var(--color-outline-variant)] flex flex-col items-center justify-center text-[var(--color-on-surface-variant)] shadow-sm">
            <span className="material-symbols-outlined text-4xl mb-4 opacity-50">history_edu</span>
            <p className="text-lg font-medium">Sélectionnez un niveau, une classe et un élève</p>
            <p className="text-sm mt-1">Le document généré s'affichera ici.</p>
          </div>
        )}
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-container, .print-container * {
            visibility: visible;
          }
          .print-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  )
}
