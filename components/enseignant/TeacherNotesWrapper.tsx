'use client'

import React, { useState } from 'react'
import { NotesManager } from '@/components/admin/academique/NotesManager'
import { BulletinsManager } from '@/components/admin/academique/BulletinsManager'

export function TeacherNotesWrapper(props: any) {
  const hasPrimary = props.classes.some((c: any) => c.level && ['cp1', 'cp2', 'ce1', 'ce2', 'cm1', 'cm2', 'primaire', 'maternelle', 's1', 's2'].includes(c.level.toLowerCase()))
  const hasSecondary = props.classes.some((c: any) => c.level && ['6eme', '5eme', '4eme', '3eme', 'secondaire', 'college', 'collège'].includes(c.level.toLowerCase()))

  const [mode, setMode] = useState<'primary' | 'secondary'>(hasPrimary ? 'primary' : 'secondary')

  return (
    <div className="flex flex-col h-full w-full">
      {hasPrimary && hasSecondary && (
        <div className="flex justify-center p-4 bg-[var(--color-surface)] border-b border-[var(--color-outline-variant)]">
          <div className="flex bg-[var(--color-surface-container-highest)] p-1 rounded-lg">
            <button 
              onClick={() => setMode('primary')}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${mode === 'primary' ? 'bg-[var(--color-primary)] text-white shadow' : 'text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)]'}`}
            >
              Primaire (Livret par Élève)
            </button>
            <button 
              onClick={() => setMode('secondary')}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${mode === 'secondary' ? 'bg-[var(--color-primary)] text-white shadow' : 'text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)]'}`}
            >
              Secondaire (Saisie par Matière)
            </button>
          </div>
        </div>
      )}

      {mode === 'primary' ? (
        <BulletinsManager 
          classes={props.classes}
          subjects={props.allSubjects}
          students={props.students}
          primaryGrades={props.primaryGrades}
          secondaryGrades={props.secondaryGrades}
          primaryRanks={props.primaryRanks}
          primaryInfo={props.primaryInfo}
          schoolName={props.schoolName}
          schoolId={props.schoolId}
        />
      ) : (
        <NotesManager 
          classes={props.classes}
          subjects={props.assignedSubjects}
          students={props.students}
          primaryGrades={props.primaryGrades}
          secondaryGrades={props.secondaryGrades}
        />
      )}
    </div>
  )
}
