'use client'

import React, { useState, useTransition } from 'react'
import { saveClassAttendance, AttendanceStatus, AttendanceSavePayload } from '@/app/actions/attendance'
import { useRouter } from 'next/navigation'

type Student = {
  id: string
  matricule: string
  first_name: string
  last_name: string
  photo_url: string | null
}

type Props = {
  classId: string
  className: string
  date: string
  students: Student[]
  initialAttendance: Record<string, AttendanceStatus>
}

export function AttendanceList({ classId, className, date, students, initialAttendance }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [attendances, setAttendances] = useState<Record<string, AttendanceStatus>>(() => {
    // Initialise avec 'non_defini' si non existant
    const map: Record<string, AttendanceStatus> = {}
    students.forEach(s => {
      map[s.id] = initialAttendance[s.id] || 'non_defini'
    })
    return map
  })

  // Calcul des stats
  const total = students.length
  const presents = Object.values(attendances).filter(v => v === 'present').length
  const absents = Object.values(attendances).filter(v => v === 'absent' || v === 'absent_justifie').length
  const retards = Object.values(attendances).filter(v => v === 'retard').length

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    // Si on clique sur le statut déjà actif, on l'enlève (revient à non_defini)
    setAttendances(prev => ({
      ...prev,
      [studentId]: prev[studentId] === status ? 'non_defini' : status
    }))
  }

  const handleSave = () => {
    startTransition(async () => {
      const payload: AttendanceSavePayload[] = Object.entries(attendances).map(([student_id, status]) => ({
        student_id,
        status
      }))

      const result = await saveClassAttendance(classId, date, payload)
      if (result.error) {
        alert(result.error)
      } else {
        alert("L'appel a été enregistré avec succès.")
        router.refresh()
      }
    })
  }

  // Formatage de la date (ex: Lundi, 12 Octobre 2023)
  const dateObj = new Date(date)
  const formattedDate = dateObj.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1)

  return (
    <div className="flex flex-col h-full relative pb-24">
      {/* Header Section: Context & Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <p className="font-semibold text-sm text-[var(--color-on-surface-variant)] mb-1 flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">calendar_today</span>
            {capitalizedDate}
          </p>
          <h2 className="text-3xl font-bold text-[var(--color-on-surface)]">Appel : {className}</h2>
        </div>
        
        {/* Quick Stats Bento */}
        <div className="flex flex-wrap gap-4">
          <div className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-lg p-4 min-w-[100px] flex flex-col items-center justify-center">
            <span className="text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Total</span>
            <span className="text-2xl font-bold text-[var(--color-on-surface)]">{total}</span>
          </div>
          <div className="bg-[rgba(6,95,70,0.1)] border border-[rgba(6,95,70,0.2)] rounded-lg p-4 min-w-[100px] flex flex-col items-center justify-center">
            <span className="text-xs font-semibold text-[var(--color-primary)] uppercase tracking-wider">Présents</span>
            <span className="text-2xl font-bold text-[var(--color-primary)]">{presents}</span>
          </div>
          <div className="bg-[var(--color-error-container)] border border-[rgba(186,26,26,0.2)] rounded-lg p-4 min-w-[100px] flex flex-col items-center justify-center">
            <span className="text-xs font-semibold text-[var(--color-error)] uppercase tracking-wider">Absents</span>
            <span className="text-2xl font-bold text-[var(--color-error)]">{absents}</span>
          </div>
          <div className="bg-[var(--color-surface-variant)] border border-[var(--color-secondary-fixed-dim)] rounded-lg p-4 min-w-[100px] flex flex-col items-center justify-center">
            <span className="text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Retards</span>
            <span className="text-2xl font-bold text-[var(--color-on-surface-variant)]">{retards}</span>
          </div>
        </div>
      </div>

      {/* Students List Container */}
      <div className="bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-outline-variant)] shadow-sm overflow-hidden mb-8">
        <div className="divide-y divide-[var(--color-outline-variant)]">
          {students.map(student => {
            const status = attendances[student.id]
            
            // Déterminer les classes CSS de la ligne en fonction du statut
            let rowClass = "flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 transition-colors group gap-4 "
            if (status === 'absent' || status === 'absent_justifie') {
              rowClass += "bg-[rgba(186,26,26,0.05)] hover:bg-[rgba(186,26,26,0.1)]"
            } else if (status === 'retard') {
              rowClass += "bg-[rgba(27,107,81,0.05)] hover:bg-[rgba(27,107,81,0.1)]" // orange/variant bg in mockup
            } else {
              rowClass += "hover:bg-[var(--color-surface-container-lowest)]"
            }

            // Initiale Avatar
            const initials = student.first_name[0] + student.last_name[0]

            return (
              <div key={student.id} className={rowClass}>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    {student.photo_url ? (
                      <img className="w-12 h-12 rounded-full object-cover border border-[var(--color-outline-variant)]" src={student.photo_url} alt="" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-[var(--color-surface-container-highest)] flex items-center justify-center font-bold text-[var(--color-on-surface-variant)] border border-[var(--color-outline-variant)]">
                        {initials}
                      </div>
                    )}
                    
                    {/* Status Dot */}
                    {status === 'present' && <div className="absolute bottom-0 right-0 w-3 h-3 bg-[var(--color-primary)] rounded-full border-2 border-[var(--color-surface-container-lowest)]"></div>}
                    {status === 'retard' && <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#e65100] rounded-full border-2 border-[var(--color-surface-container-lowest)]"></div>}
                    {(status === 'absent' || status === 'absent_justifie') && <div className="absolute bottom-0 right-0 w-3 h-3 bg-[var(--color-error)] rounded-full border-2 border-[var(--color-surface-container-lowest)]"></div>}
                  </div>
                  <div>
                    <p className="font-semibold text-base text-[var(--color-on-surface)]">{student.first_name} {student.last_name}</p>
                    <p className="text-sm text-[var(--color-on-surface-variant)]">ID: {student.matricule}</p>
                  </div>
                </div>

                {/* Segmented Toggle Control */}
                <div className={`flex bg-[var(--color-surface-container-high)] rounded-lg p-1 gap-1 ${status === 'non_defini' ? 'border border-[var(--color-outline-variant)]/50' : ''}`}>
                  {/* Présent */}
                  <button 
                    onClick={() => handleStatusChange(student.id, 'present')}
                    className={`px-4 sm:px-6 py-2 rounded-md font-semibold text-sm transition-all flex items-center gap-2 ${
                      status === 'present' 
                        ? 'bg-[var(--color-primary)] text-white shadow-sm' 
                        : 'text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-highest)]'
                    }`}
                  >
                    {status === 'present' && <span className="material-symbols-outlined text-[18px]">check_circle</span>}
                    Présent
                  </button>
                  
                  {/* Retard */}
                  <button 
                    onClick={() => handleStatusChange(student.id, 'retard')}
                    className={`px-4 sm:px-6 py-2 rounded-md font-semibold text-sm transition-all flex items-center gap-2 ${
                      status === 'retard' 
                        ? 'bg-[#e65100] text-white shadow-sm' 
                        : 'text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-highest)]'
                    }`}
                  >
                    {status === 'retard' && <span className="material-symbols-outlined text-[18px]">schedule</span>}
                    Retard
                  </button>
                  
                  {/* Absent */}
                  <button 
                    onClick={() => handleStatusChange(student.id, 'absent')}
                    className={`px-4 sm:px-6 py-2 rounded-md font-semibold text-sm transition-all flex items-center gap-2 ${
                      (status === 'absent' || status === 'absent_justifie')
                        ? 'bg-[var(--color-error)] text-white shadow-sm' 
                        : 'text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-highest)]'
                    }`}
                  >
                    {(status === 'absent' || status === 'absent_justifie') && <span className="material-symbols-outlined text-[18px]">cancel</span>}
                    Absent
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 left-64 right-0 bg-[var(--color-surface-container-lowest)] border-t border-[var(--color-outline-variant)] p-4 flex justify-end items-center gap-4 shadow-[0_-4px_6px_-1px_rgb(0,0,0,0.05)] z-10 px-8">
        <button 
          onClick={() => {
            // Remettre à l'état initial
            const map: Record<string, AttendanceStatus> = {}
            students.forEach(s => { map[s.id] = initialAttendance[s.id] || 'non_defini' })
            setAttendances(map)
          }}
          className="px-6 py-3 rounded-lg font-semibold text-sm text-[var(--color-on-surface-variant)] border border-[var(--color-outline-variant)] hover:bg-[var(--color-surface-container-low)] transition-colors"
          disabled={isPending}
        >
          Annuler
        </button>
        <button 
          onClick={handleSave}
          disabled={isPending}
          className="px-8 py-3 rounded-lg font-semibold text-sm bg-[var(--color-primary)] text-white hover:opacity-90 transition-opacity flex items-center gap-2 min-h-[48px] disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[20px]">
            {isPending ? 'progress_activity' : 'save'}
          </span>
          {isPending ? "Enregistrement..." : "Enregistrer l'appel"}
        </button>
      </div>
    </div>
  )
}
