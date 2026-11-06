'use client'

import React, { useState, useTransition } from 'react'
import { saveClassAttendance, AttendanceStatus, AttendanceSavePayload } from '@/app/actions/attendance'
import { useRouter } from 'next/navigation'
import { Calendar, CheckCircle2, Clock, XCircle, Loader2, Save } from 'lucide-react'

type Student = {
  id: string
  matricule: string
  first_name: string
  last_name: string
  photo_url: string | null
  gender?: string
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
      {/* En-tête Exécutif — Stripe Royal Indigo & Sapphire */}
      <div className="relative flex flex-col justify-between gap-5 overflow-hidden rounded-2xl bg-gradient-to-r from-[#1E293B] via-[#312E81] to-[#4338CA] px-6 py-5 text-white shadow-[0_14px_34px_-12px_rgba(67,56,202,0.45)] ring-1 ring-indigo-400/25 sm:px-7 sm:py-6 lg:flex-row lg:items-center mb-6">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -right-12 -top-16 h-56 w-56 rounded-full bg-indigo-400/25 blur-3xl" />
          <div className="absolute -bottom-20 left-1/3 h-48 w-72 rounded-full bg-sky-400/15 blur-3xl" />
        </div>
        <div className="relative z-10">
          <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-indigo-50 ring-1 ring-inset ring-white/25 backdrop-blur-md">
            <Calendar className="w-3.5 h-3.5 text-sky-300" />
            {capitalizedDate}
          </p>
          <h2 className="text-xl font-extrabold tracking-tight text-white sm:text-2xl">Appel : {className}</h2>
        </div>
        
        {/* Quick Stats Bento */}
        <div className="relative z-10 flex flex-wrap gap-2.5">
          <div className="rounded-xl bg-white/12 ring-1 ring-white/20 backdrop-blur-md px-4 py-2.5 min-w-[90px] flex flex-col items-center justify-center">
            <span className="text-[10px] font-bold text-indigo-200 uppercase tracking-wider">Total</span>
            <span className="text-lg font-extrabold text-white tabular-nums">{total}</span>
          </div>
          <div className="rounded-xl bg-emerald-400/20 ring-1 ring-emerald-300/35 backdrop-blur-md px-4 py-2.5 min-w-[90px] flex flex-col items-center justify-center">
            <span className="text-[10px] font-bold text-emerald-100 uppercase tracking-wider">Présents</span>
            <span className="text-lg font-extrabold text-emerald-200 tabular-nums">{presents}</span>
          </div>
          <div className="rounded-xl bg-rose-400/20 ring-1 ring-rose-300/35 backdrop-blur-md px-4 py-2.5 min-w-[90px] flex flex-col items-center justify-center">
            <span className="text-[10px] font-bold text-rose-100 uppercase tracking-wider">Absents</span>
            <span className="text-lg font-extrabold text-rose-200 tabular-nums">{absents}</span>
          </div>
          <div className="rounded-xl bg-amber-400/20 ring-1 ring-amber-300/35 backdrop-blur-md px-4 py-2.5 min-w-[90px] flex flex-col items-center justify-center">
            <span className="text-[10px] font-bold text-amber-100 uppercase tracking-wider">Retards</span>
            <span className="text-lg font-extrabold text-amber-200 tabular-nums">{retards}</span>
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

            // Déterminer le genre et la couleur
            const isFille = student.gender?.toLowerCase().startsWith('f')
            const nameColor = isFille ? 'text-red-600' : 'text-[var(--color-on-surface)]'
            const sexLabel = isFille ? 'F' : 'M'

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
                    <div className="flex items-center gap-2">
                      <p className={`font-semibold text-base ${nameColor}`}>{student.first_name} {student.last_name}</p>
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded bg-gray-100 ${nameColor}`}>
                        {sexLabel}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--color-on-surface-variant)]">ID: {student.matricule}</p>
                  </div>
                </div>

                {/* Segmented Toggle Control */}
                <div className={`flex w-full sm:w-auto justify-between sm:justify-start bg-[var(--color-surface-container-high)] rounded-lg p-1 gap-1 ${status === 'non_defini' ? 'border border-[var(--color-outline-variant)]/50' : ''}`}>
                  {/* Présent */}
                  <button 
                    onClick={() => handleStatusChange(student.id, 'present')}
                    className={`flex-1 sm:flex-initial px-3 sm:px-6 py-2 rounded-md font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 ${
                      status === 'present' 
                        ? 'bg-[var(--color-primary)] text-white shadow-sm' 
                        : 'text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-highest)]'
                    }`}
                  >
                    {status === 'present' && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                    Présent
                  </button>
                  
                  {/* Retard */}
                  <button 
                    onClick={() => handleStatusChange(student.id, 'retard')}
                    className={`flex-1 sm:flex-initial px-3 sm:px-6 py-2 rounded-md font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 ${
                      status === 'retard' 
                        ? 'bg-[#e65100] text-white shadow-sm' 
                        : 'text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-highest)]'
                    }`}
                  >
                    {status === 'retard' && <Clock className="w-3.5 h-3.5 shrink-0" />}
                    Retard
                  </button>
                  
                  {/* Absent */}
                  <button 
                    onClick={() => handleStatusChange(student.id, 'absent')}
                    className={`flex-1 sm:flex-initial px-3 sm:px-6 py-2 rounded-md font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 ${
                      (status === 'absent' || status === 'absent_justifie')
                        ? 'bg-[var(--color-error)] text-white shadow-sm' 
                        : 'text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-highest)]'
                    }`}
                  >
                    {(status === 'absent' || status === 'absent_justifie') && <XCircle className="w-3.5 h-3.5 shrink-0" />}
                    Absent
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 md:left-64 right-0 bg-[var(--color-surface-container-lowest)] border-t border-[var(--color-outline-variant)] p-3 sm:p-4 flex justify-between sm:justify-end items-center gap-3 sm:gap-4 shadow-[0_-4px_6px_-1px_rgb(0,0,0,0.05)] z-20 px-4 sm:px-8">
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
          {isPending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          {isPending ? "Enregistrement..." : "Enregistrer l'appel"}
        </button>
      </div>
    </div>
  )
}
