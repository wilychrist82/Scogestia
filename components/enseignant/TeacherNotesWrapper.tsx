'use client'

import React from 'react'
import { NotesManager } from '@/components/admin/academique/NotesManager'

export function TeacherNotesWrapper(props: any) {
  return (
    <div className="flex flex-col h-full w-full">
      <NotesManager 
        classes={props.classes}
        subjects={props.assignedSubjects || props.subjects || []}
        students={props.students}
        primaryGrades={props.primaryGrades}
        secondaryGrades={props.secondaryGrades}
        isTeacher={true}
      />
    </div>
  )
}
