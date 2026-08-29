'use client'

import React, { useState, useRef, useEffect, useTransition } from 'react'
import { saveBulletinPrimaryGrades, saveBulletinSecondaryGrades, publishBulletinPDF } from '@/app/actions/academique'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { createClient } from '@/lib/supabase/client'

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
  primaryRanks?: any[]
  primaryInfo?: any[]
  schoolName: string
  schoolId: string
}

export function BulletinsManager({ classes, students, subjects, primaryGrades, secondaryGrades, primaryRanks, primaryInfo, schoolName, schoolId }: Props) {
  const [selectedLevel, setSelectedLevel] = useState<string>('')
  const [selectedClass, setSelectedClass] = useState<string>('')
  const [selectedTerm, setSelectedTerm] = useState<string>('1er_trimestre')
  const [selectedStudent, setSelectedStudent] = useState<string>('')

  const [isPending, startTransition] = useTransition()
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [publishStatus, setPublishStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [stampText, setStampText] = useState(schoolName.toUpperCase())

  useEffect(() => {
    setStampText(schoolName.toUpperCase())
  }, [schoolName])

  // Local state for interactive editing
  const [localPrimGrades, setLocalPrimGrades] = useState<Record<string, string>>({})
  const [localPrimRanks, setLocalPrimRanks] = useState<Record<number, string>>({})
  const [localPrimInfo, setLocalPrimInfo] = useState<{ appreciation: string, decision: string }>({ appreciation: '', decision: '' })
  
  const [localSecGrades, setLocalSecGrades] = useState<Record<string, { cScore: string, compScore: string }>>({})
  const [secAppr, setSecAppr] = useState<Record<string, string>>({})
  const [secTeachers, setSecTeachers] = useState<Record<string, string>>({})
  const [secFooterInfo, setSecFooterInfo] = useState<{ appreciation: string, decision: string }>({ appreciation: '', decision: '' })
  const [secRank, setSecRank] = useState<string>('')
  const [secStats, setSecStats] = useState<{ min: string, max: string, annual: string, t1: string, t2: string, annual_t3: string }>({ min: '', max: '', annual: '', t1: '', t2: '', annual_t3: '' })

  const printRef = useRef<HTMLDivElement>(null)

  const availableClasses = classes.filter(c => {
    if (!selectedLevel) return false;
    if (!c.level) return false;
    const l = c.level.toLowerCase();
    const isPrimary = ['cp1', 'cp2', 'ce1', 'ce2', 'cm1', 'cm2', 'primaire', 'maternelle', 's1', 's2'].includes(l);
    const isSecondary = ['6eme', '5eme', '4eme', '3eme', 'secondaire', 'college', 'collège'].includes(l);
    
    if (selectedLevel === 'primaire') return isPrimary;
    if (selectedLevel === 'secondaire') return isSecondary;
    if (selectedLevel === 'maternelle') return ['s1', 's2', 'maternelle'].includes(l);
    return false;
  })
  const availableStudents = selectedClass ? students.filter(s => s.class_id === selectedClass) : []
  const student = students.find(s => s.id === selectedStudent)
  const cls = classes.find(c => c.id === selectedClass)

  // Initialize local state when student changes
  useEffect(() => {
    if (!student) return
    if (selectedLevel === 'primaire' || selectedLevel === 'maternelle') {
      const newPrim: Record<string, string> = {}
      primaryGrades.forEach(g => {
        if (g.student_id === student.id) {
          newPrim[`${g.subject_id}_${g.month_number}`] = g.score.toString()
        }
      })
      setLocalPrimGrades(newPrim)

      const newRanks: Record<number, string> = {}
      if (primaryRanks) {
        primaryRanks.forEach(r => {
          if (r.student_id === student.id) {
            newRanks[r.month_number] = r.rank_text || ''
          }
        })
      }
      setLocalPrimRanks(newRanks)

      if (primaryInfo) {
        const info = primaryInfo.find(i => i.student_id === student.id)
        setLocalPrimInfo({
          appreciation: info?.appreciation || '',
          decision: info?.director_decision || ''
        })
      } else {
        setLocalPrimInfo({ appreciation: '', decision: '' })
      }
    } else {
      const newSec: Record<string, { cScore: string, compScore: string }> = {}
      secondaryGrades.forEach(g => {
        if (g.student_id === student.id && g.term === selectedTerm) {
          newSec[g.subject_id] = {
            cScore: g.class_score !== null ? g.class_score.toString() : '',
            compScore: g.comp_score !== null ? g.comp_score.toString() : ''
          }
        }
      })
      setLocalSecGrades(newSec)
    }
  }, [student, selectedLevel, selectedTerm, primaryGrades, secondaryGrades])

  const handlePrint = () => {
    window.print()
  }

  const handleSavePrimary = () => {
    if (!student || !cls) return
    setSaveSuccess(false)
    startTransition(async () => {
      const res = await saveBulletinPrimaryGrades(student.id, localPrimGrades, localPrimRanks, localPrimInfo)
      if (res?.success) {
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
      } else {
        alert(res?.error || 'Erreur lors de la sauvegarde')
      }
    })
  }

  const handleSaveSecondary = () => {
    if (!student || !cls) return
    setSaveSuccess(false)
    startTransition(async () => {
      const res = await saveBulletinSecondaryGrades(student.id, selectedTerm, localSecGrades)
      if (res?.success) {
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
      } else {
        alert(res?.error || 'Erreur lors de la sauvegarde')
      }
    })
  }

  const buildStudentBulletinData = (stuId: string) => {
    const stu = students.find(s => s.id === stuId)
    const cl = classes.find(c => c.id === (stu?.class_id || selectedClass))
    if (!stu || !cl) return null
    
    const isPrimary = selectedLevel === 'primaire' || selectedLevel === 'maternelle'
    
    const data: any = {
      level: selectedLevel,
      student: { id: stu.id, first_name: stu.first_name, last_name: stu.last_name, matricule: stu.matricule },
      cls: { name: cl.name },
      schoolName,
      academicYear: "2026-2027",
      termOrMonth: selectedTerm
    }

    if (isPrimary) {
      const primarySubjects = subjects.filter(s => s.cycle === 'primaire' || s.cycle === 'maternelle')
      const groupedSubjects: Record<string, any[]> = {}
      
      const months = Array.from({ length: 9 }, (_, i) => i + 1)
      data.months = months
      
      primarySubjects.forEach(s => {
        const cat = s.category || 'Général'
        if (!groupedSubjects[cat]) groupedSubjects[cat] = []
        
        const monthScores: Record<string, string> = {}
        let total = 0, count = 0
        months.forEach(m => {
          // Si c'est l'élève actuellement sélectionné, on prend le local state, sinon les props
          let valStr = ''
          if (stuId === selectedStudent && localPrimGrades[`${s.id}_${m}`] !== undefined) {
            valStr = localPrimGrades[`${s.id}_${m}`]
          } else {
            const g = primaryGrades.find(g => g.student_id === stuId && g.subject_id === s.id && g.month_number === m)
            valStr = g ? g.score.toString() : ''
          }
          monthScores[m] = valStr
          const val = parseFloat(valStr)
          if (!isNaN(val)) { total += val; count++ }
        })
        const avg = count > 0 ? (total / count).toFixed(2) : ''
        
        groupedSubjects[cat].push({
          id: s.id, name: s.name, monthScores, avg
        })
      })
      data.primaryCategories = groupedSubjects
      
      // Totals
      data.monthTotals = {}
      data.monthAvgs = {}
      data.monthRanks = {}
      months.forEach(m => {
        let mTotal = 0, count = 0
        primarySubjects.forEach(s => {
          let valStr = ''
          if (stuId === selectedStudent && localPrimGrades[`${s.id}_${m}`] !== undefined) valStr = localPrimGrades[`${s.id}_${m}`]
          else {
            const g = primaryGrades.find(g => g.student_id === stuId && g.subject_id === s.id && g.month_number === m)
            valStr = g ? g.score.toString() : ''
          }
          const val = parseFloat(valStr)
          if (!isNaN(val)) { mTotal += val; count++ }
        })
        data.monthTotals[m] = mTotal > 0 ? mTotal.toString() : ''
        data.monthAvgs[m] = count > 0 ? (mTotal / count).toFixed(2) : ''
        
        if (stuId === selectedStudent && localPrimRanks[m] !== undefined) data.monthRanks[m] = localPrimRanks[m]
        else {
          const r = primaryRanks?.find(r => r.student_id === stuId && r.month_number === m)
          data.monthRanks[m] = r ? r.rank_text : ''
        }
      })
      
      if (stuId === selectedStudent) {
        data.footerInfo = localPrimInfo
      } else {
        const info = primaryInfo?.find(i => i.student_id === stuId)
        data.footerInfo = { appreciation: info?.appreciation || '', decision: info?.director_decision || '' }
      }
      
    } else {
      // Secondary
      const secondarySubjects = subjects.filter(s => s.cycle === 'secondaire')
      let totalCoef = 0, totalProduct = 0
      
      data.secondaryRows = secondarySubjects.map(s => {
        let cScore = '', compScore = ''
        if (stuId === selectedStudent && localSecGrades[s.id]) {
          cScore = localSecGrades[s.id].cScore
          compScore = localSecGrades[s.id].compScore
        } else {
          const g = secondaryGrades.find(g => g.student_id === stuId && g.subject_id === s.id && g.term === selectedTerm)
          if (g) {
            cScore = g.class_score !== null ? g.class_score.toString() : ''
            compScore = g.comp_score !== null ? g.comp_score.toString() : ''
          }
        }
        const cVal = parseFloat(cScore)
        const compVal = parseFloat(compScore)
        let moy = null
        if (!isNaN(cVal) && !isNaN(compVal)) moy = (cVal + compVal) / 2
        else if (!isNaN(cVal)) moy = cVal
        else if (!isNaN(compVal)) moy = compVal
        
        let produit = null
        if (moy !== null) {
          produit = moy * s.coefficient
          totalCoef += s.coefficient
          totalProduct += produit
        }
        
        let defaultAppr = ''
        if (moy !== null) {
          if (moy >= 16) defaultAppr = 'Très Bien'
          else if (moy >= 14) defaultAppr = 'Bien'
          else if (moy >= 12) defaultAppr = 'Assez Bien'
          else if (moy >= 10) defaultAppr = 'Passable'
          else defaultAppr = 'Insuffisant'
        }
        
        return {
          id: s.id, name: s.name, cScore, compScore, moy, coefficient: s.coefficient, produit,
          appr: stuId === selectedStudent && secAppr[s.id] !== undefined ? secAppr[s.id] : defaultAppr
        }
      })
      
      data.totalCoef = totalCoef
      data.totalProduct = totalProduct
      data.termAvg = totalCoef > 0 ? (totalProduct / totalCoef).toFixed(2) : '0.00'
      data.rank = stuId === selectedStudent ? secRank : '-'
      data.totalStudents = students.filter(s => s.class_id === cl.id).length
      data.stats = stuId === selectedStudent ? secStats : { min: '-', max: '-', annual: '-' }
      data.footerInfo = stuId === selectedStudent ? secFooterInfo : { appreciation: '', decision: '' }
    }
    
    return data
  }

  const handlePublishPDF = async () => {
    if (!selectedStudent) return;
    
    try {
      setPublishStatus('loading')
      
      // Auto-save currently selected student
      if (selectedLevel === 'primaire' || selectedLevel === 'maternelle') {
        await saveBulletinPrimaryGrades(selectedStudent, localPrimGrades, localPrimRanks, localPrimInfo)
      } else {
        await saveBulletinSecondaryGrades(selectedStudent, selectedTerm, localSecGrades)
      }

      const dataList = [buildStudentBulletinData(selectedStudent)]
      
      const response = await fetch('/api/bulletins/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataList, action: 'publish' })
      })
      
      if (!response.ok) throw new Error("Erreur de génération API")
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Bulletin_${student?.first_name}_${selectedTerm}.pdf`
      a.click()
      
      setPublishStatus('success')
      setTimeout(() => setPublishStatus('idle'), 3000)
    } catch (err: any) {
      console.error(err)
      setPublishStatus('error')
      alert("Erreur: " + err.message)
      setTimeout(() => setPublishStatus('idle'), 3000)
    }
  }

  const handleGenerateClassPDF = async () => {
    if (!selectedClass) return;
    try {
      setPublishStatus('loading')
      
      // Auto-save currently selected student if any
      if (selectedStudent) {
        if (selectedLevel === 'primaire' || selectedLevel === 'maternelle') {
          await saveBulletinPrimaryGrades(selectedStudent, localPrimGrades, localPrimRanks, localPrimInfo)
        } else {
          await saveBulletinSecondaryGrades(selectedStudent, selectedTerm, localSecGrades)
        }
      }

      const classStudents = students.filter(s => s.class_id === selectedClass)
      const dataList = classStudents.map(s => buildStudentBulletinData(s.id)).filter(Boolean)
      
      const response = await fetch('/api/bulletins/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataList, action: 'download' })
      })
      
      if (!response.ok) throw new Error("Erreur de génération API")
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Bulletins_Classe_${cls?.name}_${selectedTerm}.pdf`
      a.click()
      
      setPublishStatus('success')
      setTimeout(() => setPublishStatus('idle'), 3000)
    } catch (err: any) {
      console.error(err)
      setPublishStatus('error')
      alert("Erreur: " + err.message)
      setTimeout(() => setPublishStatus('idle'), 3000)
    }
  }


  const renderStamp = () => {
    return (
      <div className="flex flex-col items-center mt-2">
        <input 
          type="text" 
          value={stampText} 
          onChange={e => setStampText(e.target.value)} 
          placeholder="Texte du cachet (vide = cacher)"
          className="print-input print:hidden text-center text-xs border-b border-gray-300 focus:border-blue-500 outline-none mb-2 text-blue-800 bg-transparent w-48"
        />
        {stampText && (
          <div className="relative w-28 h-28 text-blue-800 flex flex-col items-center justify-center opacity-90" style={{ border: '4px double #1e40af', borderRadius: '50%' }}>
            <span className="text-[10px] font-black uppercase tracking-widest mt-1">Direction</span>
            <div className="w-12 h-px bg-blue-800 my-1"></div>
            <span className="material-symbols-outlined text-xl">verified</span>
            <div className="w-12 h-px bg-blue-800 my-1"></div>
            <span className="text-[8px] font-bold uppercase text-center px-2 leading-tight">
              {stampText}
            </span>
          </div>
        )}
      </div>
    )
  }

  const renderPrimaryLivret = () => {
    if (!student || !cls) return null

    const primarySubjects = subjects.filter(s => s.cycle === 'primaire' || s.cycle === 'maternelle')
    const groupedSubjects: Record<string, SubjectItem[]> = {}
    primarySubjects.forEach(s => {
      const cat = s.category || 'Général'
      if (!groupedSubjects[cat]) groupedSubjects[cat] = []
      groupedSubjects[cat].push(s)
    })

    const months = Array.from({ length: 9 }, (_, i) => i + 1)

    return (
      <div className="bg-white p-8 print:p-4 rounded-xl shadow-sm border border-[var(--color-outline-variant)] print:border-none text-black relative bulletin-page" ref={printRef}>
        
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-black pb-6 print:pb-2 mb-6 print:mb-4">
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
        <div className="flex justify-between items-center mb-8 print:mb-4 bg-gray-50 p-4 print:p-2 rounded-lg border border-gray-200">
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
        <div className="overflow-x-auto mb-8 print:mb-4">
          <table className="w-full text-sm border-collapse border border-black bulletin-table">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-black p-2 text-left w-1/4">DISCIPLINES</th>
                {months.map(m => (
                  <th key={m} className="border border-black p-2 text-center w-12">{m}e</th>
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
                      const key = `${subj.id}_${m}`
                      const val = parseFloat(localPrimGrades[key])
                      if (!isNaN(val)) { total += val; count++ }
                    })
                    const avg = count > 0 ? (total / count).toFixed(2) : ''

                    return (
                      <tr key={subj.id}>
                        <td className="border border-black p-2 pl-6 font-medium">{subj.name}</td>
                        {months.map(m => {
                          const key = `${subj.id}_${m}`
                          return (
                            <td key={m} className="border border-black p-0 text-center">
                              <input 
                                type="text"
                                className="w-full h-full p-2 text-center outline-none bg-transparent hover:bg-gray-50 focus:bg-blue-50 font-medium print-input"
                                value={localPrimGrades[key] || ''}
                                onChange={e => setLocalPrimGrades({...localPrimGrades, [key]: e.target.value})}
                              />
                            </td>
                          )
                        })}
                        <td className="border border-black p-2 text-center font-bold bg-gray-100">{avg}</td>
                      </tr>
                    )
                  })}
                </React.Fragment>
              ))}
              
              {/* Totals & Averages for Primary */}
              <tr className="bg-gray-100 font-bold border-t-2 border-black">
                <td className="border border-black p-2 text-right uppercase">Total des points</td>
                {months.map(m => {
                  let monthTotal = 0;
                  primarySubjects.forEach(subj => {
                    const val = parseFloat(localPrimGrades[`${subj.id}_${m}`]);
                    if (!isNaN(val)) monthTotal += val;
                  });
                  return (
                    <td key={`total-${m}`} className="border border-black p-2 text-center">
                      {monthTotal > 0 ? monthTotal : ''}
                    </td>
                  );
                })}
                <td className="border border-black p-2 bg-gray-200"></td>
              </tr>
              <tr className="bg-gray-100 font-bold">
                <td className="border border-black p-2 text-right uppercase">Moyenne / 10</td>
                {months.map(m => {
                  let monthTotal = 0;
                  let count = 0;
                  primarySubjects.forEach(subj => {
                    const val = parseFloat(localPrimGrades[`${subj.id}_${m}`]);
                    if (!isNaN(val)) {
                      monthTotal += val;
                      count++;
                    }
                  });
                  // Divide by total number of subjects to get the true average, or number of inputted grades?
                  // Generally it's divided by total number of subjects tested. Let's use count.
                  const avg = count > 0 ? (monthTotal / count).toFixed(2) : '';
                  return (
                    <td key={`avg-${m}`} className="border border-black p-2 text-center text-blue-800">
                      {avg}
                    </td>
                  );
                })}
                <td className="border border-black p-2 bg-gray-200"></td>
              </tr>
              <tr className="bg-gray-100 font-bold">
                <td className="border border-black p-2 text-right uppercase">Rang</td>
                {months.map(m => (
                  <td key={`rank-${m}`} className="border border-black p-0 text-center">
                    <input 
                      type="text"
                      className="w-full h-full p-2 text-center outline-none bg-transparent hover:bg-gray-50 focus:bg-blue-50 font-bold print-input"
                      value={localPrimRanks[m] || ''}
                      onChange={e => setLocalPrimRanks({...localPrimRanks, [m]: e.target.value})}
                    />
                  </td>
                ))}
                <td className="border border-black p-2 bg-gray-200"></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-start mt-12 print:mt-4 px-8 print:px-2">
          <div className="text-center flex flex-col items-center w-1/3">
            <p className="font-bold underline mb-10">Le Titulaire</p>
            <input 
              type="text" 
              placeholder="Saisir le nom..." 
              className="print-input text-center font-bold text-gray-800 outline-none hover:bg-gray-50 focus:bg-blue-50 p-2 w-56 border-b border-transparent focus:border-gray-300"
            />
            <div className="mt-4 flex flex-col items-center w-full">
              <span className="text-sm font-semibold mb-1">Appréciation :</span>
              <input 
                type="text"
                placeholder="Ex: Passable, Bien..."
                className="print-input text-center text-gray-800 outline-none hover:bg-gray-50 focus:bg-blue-50 p-1 w-full border-b border-gray-300 focus:border-[var(--color-primary)]"
                value={localPrimInfo.appreciation}
                onChange={e => setLocalPrimInfo({...localPrimInfo, appreciation: e.target.value})}
              />
            </div>
          </div>
          <div className="w-1/3 flex justify-center">
            {renderStamp()}
          </div>
          <div className="text-center flex flex-col items-center w-1/3">
            <p className="font-bold underline mb-10">Le Directeur / La Directrice</p>
            <input 
              type="text" 
              placeholder="Saisir le nom..." 
              className="print-input text-center font-bold text-gray-800 outline-none hover:bg-gray-50 focus:bg-blue-50 p-2 w-56 border-b border-transparent focus:border-gray-300"
            />
            <div className="mt-4 flex flex-col items-center w-full">
              <span className="text-sm font-semibold mb-1">Décision du directeur :</span>
              <input 
                type="text"
                placeholder="Décision finale..."
                className="print-input text-center text-gray-800 outline-none hover:bg-gray-50 focus:bg-blue-50 p-1 w-full border-b border-gray-300 focus:border-[var(--color-primary)]"
                value={localPrimInfo.decision}
                onChange={e => setLocalPrimInfo({...localPrimInfo, decision: e.target.value})}
              />
            </div>
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
      const grades = localSecGrades[subj.id] || { cScore: '', compScore: '' }
      const cScore = parseFloat(grades.cScore)
      const compScore = parseFloat(grades.compScore)
      
      let moy = null
      if (!isNaN(cScore) && !isNaN(compScore)) {
        moy = (cScore + compScore) / 2
      } else if (!isNaN(cScore)) {
        moy = cScore
      } else if (!isNaN(compScore)) {
        moy = compScore
      }

      let produit = null
      if (moy !== null) {
        produit = moy * subj.coefficient
        totalCoef += subj.coefficient
        totalProduct += produit
      }

      let defaultAppr = ''
      if (moy !== null) {
        if (moy >= 16) defaultAppr = 'Très Bien'
        else if (moy >= 14) defaultAppr = 'Bien'
        else if (moy >= 12) defaultAppr = 'Assez Bien'
        else if (moy >= 10) defaultAppr = 'Passable'
        else defaultAppr = 'Insuffisant'
      }

      return {
        ...subj,
        cScore: grades.cScore,
        compScore: grades.compScore,
        moy,
        produit,
        appr: secAppr[subj.id] !== undefined ? secAppr[subj.id] : defaultAppr
      }
    })

    const termAvg = totalCoef > 0 ? (totalProduct / totalCoef).toFixed(2) : '0.00'

    return (
      <div className="bg-white p-8 print:p-4 rounded-xl shadow-sm border border-[var(--color-outline-variant)] print:border-none text-black relative bulletin-page" ref={printRef}>
        
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
          <table className="w-full text-sm border-collapse border border-black bulletin-table">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-black p-2 text-left">MATIÈRES</th>
                <th className="border border-black p-2 text-center w-16">NOTE CL.</th>
                <th className="border border-black p-2 text-center w-16">COMPO.</th>
                <th className="border border-black p-2 text-center w-16 bg-gray-200">MOY. /20</th>
                <th className="border border-black p-2 text-center w-12">COEF</th>
                <th className="border border-black p-2 text-center w-20 bg-gray-200">PRODUIT</th>
                <th className="border border-black p-2 text-left w-32">NOM DES PROFESSEURS</th>
                <th className="border border-black p-2 text-left pl-4">APPRÉCIATION</th>
                <th className="border border-black p-2 text-center w-24">SIGNATURE</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.id}>
                  <td className="border border-black p-2 font-semibold">{row.name}</td>
                  <td className="border border-black p-0 text-center">
                    <input 
                      type="text"
                      className="w-full h-full p-2 text-center outline-none bg-transparent hover:bg-gray-50 focus:bg-blue-50 font-medium print-input"
                      value={row.cScore}
                      onChange={e => setLocalSecGrades({...localSecGrades, [row.id]: { ...localSecGrades[row.id], cScore: e.target.value }})}
                    />
                  </td>
                  <td className="border border-black p-0 text-center">
                    <input 
                      type="text"
                      className="w-full h-full p-2 text-center outline-none bg-transparent hover:bg-gray-50 focus:bg-blue-50 font-medium print-input"
                      value={row.compScore}
                      onChange={e => setLocalSecGrades({...localSecGrades, [row.id]: { ...localSecGrades[row.id], compScore: e.target.value }})}
                    />
                  </td>
                  <td className="border border-black p-2 text-center font-bold bg-gray-100">{row.moy !== null ? row.moy.toFixed(2) : ''}</td>
                  <td className="border border-black p-2 text-center">{row.coefficient}</td>
                  <td className="border border-black p-2 text-center font-bold bg-gray-100">{row.produit !== null ? row.produit.toFixed(2) : ''}</td>
                  <td className="border border-black p-0 text-left">
                     <input 
                      type="text"
                      className="w-full h-full p-2 outline-none bg-transparent hover:bg-gray-50 focus:bg-blue-50 text-xs print-input text-left"
                      value={secTeachers[row.id] || ''}
                      onChange={e => setSecTeachers({...secTeachers, [row.id]: e.target.value})}
                    />
                  </td>
                  <td className="border border-black p-0 text-left">
                     <input 
                      type="text"
                      className="w-full h-full p-2 pl-4 outline-none bg-transparent hover:bg-gray-50 focus:bg-blue-50 italic print-input text-left"
                      value={row.appr}
                      onChange={e => setSecAppr({...secAppr, [row.id]: e.target.value})}
                    />
                  </td>
                  <td className="border border-black p-2"></td>
                </tr>
              ))}
              {/* Totals */}
              <tr className="bg-gray-100 font-bold border-t-2 border-black">
                <td colSpan={4} className="border border-black p-2 text-right">TOTAL</td>
                <td className="border border-black p-2 text-center">{totalCoef}</td>
                <td className="border border-black p-2 text-center">{totalProduct.toFixed(2)}</td>
                <td colSpan={3} className="border border-black p-2"></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Results */}
        <div className="flex gap-8 mb-8">
          <div className="w-1/2 p-6 bg-gray-50 border border-gray-200 rounded-xl flex flex-col justify-center items-center relative overflow-hidden">
            <p className="text-gray-600 font-semibold mb-2 relative z-10">MOYENNE TRIMESTRIELLE</p>
            <p className="text-4xl font-black text-black relative z-10">{termAvg} <span className="text-xl text-gray-500 font-medium">/ 20</span></p>
          </div>
          <div className="w-1/2 p-6 bg-gray-50 border border-gray-200 rounded-xl flex flex-col justify-center items-center">
            <p className="text-gray-600 font-semibold mb-2">RANG</p>
            <div className="text-4xl font-black text-black flex items-center justify-center">
              <input 
                type="text"
                className="w-16 text-center bg-transparent outline-none border-b-2 border-transparent hover:border-gray-300 focus:border-[var(--color-primary)] print-input"
                placeholder="-"
                value={secRank}
                onChange={e => setSecRank(e.target.value)}
              />
              <span className="text-sm font-medium text-gray-500 ml-1">/ {availableStudents.length}</span>
            </div>
          </div>
        </div>

        {/* Statistics Block */}
        {selectedTerm === '3eme_trimestre' ? (
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-50 border border-gray-200 p-3 rounded-xl text-center">
              <p className="text-xs text-gray-600 font-semibold uppercase">Moy. 1er Trim.</p>
              <input type="text" className="w-full text-center font-bold bg-transparent outline-none mt-1 print-input" placeholder="-" value={secStats.t1} onChange={e => setSecStats({...secStats, t1: e.target.value})} />
            </div>
            <div className="bg-gray-50 border border-gray-200 p-3 rounded-xl text-center">
              <p className="text-xs text-gray-600 font-semibold uppercase">Moy. 2ème Trim.</p>
              <input type="text" className="w-full text-center font-bold bg-transparent outline-none mt-1 print-input" placeholder="-" value={secStats.t2} onChange={e => setSecStats({...secStats, t2: e.target.value})} />
            </div>
            <div className="bg-gray-50 border border-gray-200 p-3 rounded-xl text-center">
              <p className="text-xs text-gray-600 font-semibold uppercase">Moy. 3ème Trim.</p>
              <div className="text-center font-bold mt-1">{termAvg}</div>
            </div>
            <div className="bg-gray-50 border border-gray-200 p-3 rounded-xl text-center">
              <p className="text-xs text-gray-600 font-semibold uppercase">Moy. Annuelle</p>
              <input type="text" className="w-full text-center font-bold bg-transparent outline-none mt-1 print-input" placeholder="-" value={secStats.annual_t3} onChange={e => setSecStats({...secStats, annual_t3: e.target.value})} />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-gray-50 border border-gray-200 p-3 rounded-xl text-center">
              <p className="text-xs text-gray-600 font-semibold uppercase">Moyenne la plus faible</p>
              <input type="text" className="w-full text-center font-bold bg-transparent outline-none mt-1 print-input" placeholder="-" value={secStats.min} onChange={e => setSecStats({...secStats, min: e.target.value})} />
            </div>
            <div className="bg-gray-50 border border-gray-200 p-3 rounded-xl text-center">
              <p className="text-xs text-gray-600 font-semibold uppercase">Moyenne la plus forte</p>
              <input type="text" className="w-full text-center font-bold bg-transparent outline-none mt-1 print-input" placeholder="-" value={secStats.max} onChange={e => setSecStats({...secStats, max: e.target.value})} />
            </div>
            <div className="bg-gray-50 border border-gray-200 p-3 rounded-xl text-center">
              <p className="text-xs text-gray-600 font-semibold uppercase">Moyenne Annuelle</p>
              <input type="text" className="w-full text-center font-bold bg-transparent outline-none mt-1 print-input" placeholder="-" value={secStats.annual} onChange={e => setSecStats({...secStats, annual: e.target.value})} />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-between items-start mt-12 print:mt-4 px-8 print:px-2">
          <div className="text-center w-1/3 flex flex-col items-center">
            <p className="font-bold underline mb-10">Le Professeur Principal</p>
            <input 
              type="text" 
              placeholder="Saisir le nom..." 
              className="print-input text-center font-bold text-gray-800 outline-none hover:bg-gray-50 focus:bg-blue-50 p-2 w-56 border-b border-transparent focus:border-gray-300 mb-4"
            />
            <div className="w-full text-left flex flex-col items-center">
              <p className="font-bold underline mb-2">Appréciation :</p>
              <input 
                type="text"
                placeholder="Appréciation..."
                className="print-input text-center text-gray-800 outline-none hover:bg-gray-50 focus:bg-blue-50 p-1 w-full border-b border-gray-300 focus:border-[var(--color-primary)]"
                value={secFooterInfo.appreciation}
                onChange={e => setSecFooterInfo({...secFooterInfo, appreciation: e.target.value})}
              />
            </div>
          </div>
          <div className="text-center w-1/3 flex flex-col items-center">
            <div className="border border-black p-4 rounded-lg inline-block text-left w-full mb-4">
              <p className="font-bold mb-2 underline">Décision du conseil</p>
              <label className="flex items-center gap-2"><input type="checkbox" checked={Number(termAvg) >= 14} readOnly className="print-checkbox" /> Félicitations</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={Number(termAvg) >= 12 && Number(termAvg) < 14} readOnly className="print-checkbox" /> Encouragements</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={Number(termAvg) >= 10 && Number(termAvg) < 12} readOnly className="print-checkbox" /> Tableau d'honneur</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={Number(termAvg) > 0 && Number(termAvg) < 10} readOnly className="print-checkbox" /> Avertissement</label>
            </div>
            {renderStamp()}
          </div>
          <div className="text-center w-1/3 flex flex-col items-center">
            <p className="font-bold underline mb-10">Le Chef d'Établissement</p>
             <input 
              type="text" 
              placeholder="Saisir le nom..." 
              className="print-input text-center font-bold text-gray-800 outline-none hover:bg-gray-50 focus:bg-blue-50 p-2 w-56 border-b border-transparent focus:border-gray-300 mb-4"
            />
            <div className="w-full text-left flex flex-col items-center">
              <p className="font-bold underline mb-2">Décision du chef d'établissement :</p>
              <input 
                type="text"
                placeholder="Décision..."
                className="print-input text-center text-gray-800 outline-none hover:bg-gray-50 focus:bg-blue-50 p-1 w-full border-b border-gray-300 focus:border-[var(--color-primary)]"
                value={secFooterInfo.decision}
                onChange={e => setSecFooterInfo({...secFooterInfo, decision: e.target.value})}
              />
            </div>
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
            <p className="text-base text-[var(--color-on-surface-variant)] mt-1">Saisissez les notes directement sur le bulletin et imprimez.</p>
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
                <option value="maternelle">Maternelle</option>
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
            
            {selectedClass && (
              <button
                onClick={handleGenerateClassPDF}
                disabled={publishStatus === 'loading'}
                className="h-11 px-6 bg-[#004532] text-white font-bold rounded-lg hover:opacity-90 disabled:opacity-50 transition-colors flex items-center gap-2 shadow-sm"
              >
                <span className="material-symbols-outlined">picture_as_pdf</span>
                {publishStatus === 'loading' ? 'Génération...' : 'Bulletins de la classe'}
              </button>
            )}
          </div>
        </div>

        {selectedStudent ? (
          <div className="bg-[var(--color-surface-container-lowest)] p-6 rounded-xl border border-[var(--color-outline-variant)] shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <p className="text-sm text-[var(--color-on-surface-variant)]">
                💡 Vous pouvez cliquer sur les cases du tableau ci-dessous pour saisir les notes directement.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={handlePublishPDF}
                  disabled={!selectedStudent || publishStatus === 'loading'}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {publishStatus === 'loading' ? 'Génération...' : publishStatus === 'success' ? '✔ Publié' : publishStatus === 'error' ? '✖ Erreur' : 'Publier vers Espace Parent'}
                </button>
                <button 
                  onClick={handlePrint}
                  disabled={!selectedStudent}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  Imprimer / PDF
                </button>
                <button 
                  onClick={selectedLevel === 'primaire' || selectedLevel === 'maternelle' ? handleSavePrimary : handleSaveSecondary}
                  disabled={isPending || !selectedStudent}
                  className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:bg-opacity-90 disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  {isPending ? 'Enregistrement...' : saveSuccess ? 'Enregistré ✔' : 'Enregistrer'}
                </button>
              </div>
            </div>
            
            {/* Render appropriate bulletin */}
            <div className="print-container overflow-x-auto custom-scrollbar pb-4">
              <div className="min-w-[800px]">
                {selectedLevel === 'primaire' || selectedLevel === 'maternelle' ? renderPrimaryLivret() : renderSecondaryBulletin()}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-[var(--color-surface-container-lowest)] p-12 rounded-xl border border-[var(--color-outline-variant)] flex flex-col items-center justify-center text-[var(--color-on-surface-variant)] shadow-sm">
            <span className="material-symbols-outlined text-4xl mb-4 opacity-50">history_edu</span>
            <p className="text-lg font-medium">Sélectionnez un niveau, une classe et un élève</p>
            <p className="text-sm mt-1">Le bulletin s'affichera ici. Vous pourrez y saisir les notes directement.</p>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
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
          .print-input {
            border: none !important;
            background: transparent !important;
            color: black !important;
            padding: 0 !important;
          }
          /* Print checkboxes beautifully */
          .print-checkbox {
            appearance: none;
            width: 14px;
            height: 14px;
            border: 1px solid black;
            display: inline-block;
            position: relative;
          }
          .print-checkbox:checked::after {
            content: "X";
            position: absolute;
            top: -2px;
            left: 2px;
            font-size: 14px;
            font-weight: bold;
          }
        }
      `}} />
    </div>
  )
}
