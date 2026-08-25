import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DevoirsManager } from '@/components/admin/academique/DevoirsManager'

export const dynamic = 'force-dynamic'

export default async function EnseignantDevoirsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: roleData } = await supabase
    .from('user_school_roles')
    .select('school_id')
    .eq('user_id', user.id)
    .eq('role', 'enseignant')
    .limit(1).maybeSingle()

  if (!roleData) redirect('/')

  const schoolId = roleData.school_id

  // 1. Classes assignées
  const { data: assignments } = await supabase
    .from('teacher_class_subjects')
    .select(`class_id, subject_name, classes (name, level)`)
    .eq('teacher_id', user.id)

  if (!assignments || assignments.length === 0) {
    return <div className="p-8">Aucune classe assignée.</div>
  }

  // Fetch actual subjects from DB to get their cycle
  const { data: allSubjects } = await supabase
    .from('subjects')
    .select('id, name, cycle')
    .eq('school_id', schoolId)

  const classesMap = new Map()
  const subjectsMap = new Map()

  assignments.forEach((a: any) => {
    if (!classesMap.has(a.class_id)) {
      classesMap.set(a.class_id, { id: a.class_id, name: a.classes?.name, level: a.classes?.level })
    }
    
    const realSubject = allSubjects?.find(s => s.name === a.subject_name)
    if (realSubject) {
      if (!subjectsMap.has(realSubject.id)) {
        subjectsMap.set(realSubject.id, { id: realSubject.id, name: realSubject.name, cycle: realSubject.cycle })
      }
    } else {
      // Fallback if subject not found in subjects table (legacy)
      const subjId = `${a.class_id}-${a.subject_name}`
      if (!subjectsMap.has(subjId)) {
        subjectsMap.set(subjId, { id: subjId, name: a.subject_name, cycle: 'secondaire' })
      }
    }
  })

  const classes = Array.from(classesMap.values())
  const subjects = Array.from(subjectsMap.values())
  const classIds = classes.map(c => c.id)

  // 2. Devoirs existants
  const { data: homeworks } = await supabase
    .from('homework')
    .select('*')
    .eq('school_id', schoolId)
    .in('class_id', classIds)
    .order('due_date', { ascending: false })

  return (
    <DevoirsManager 
      classes={classes}
      subjects={subjects}
      homeworks={homeworks as any || []}
    />
  )
}
