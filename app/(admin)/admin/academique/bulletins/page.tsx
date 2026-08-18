import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BulletinsManager } from '@/components/admin/academique/BulletinsManager'

export const dynamic = 'force-dynamic'

export default async function BulletinsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: roleData } = await supabase
    .from('user_school_roles')
    .select('school_id')
    .eq('user_id', user.id)
    .single()

  if (!roleData?.school_id) {
    return <div className="p-8 text-[var(--color-status-retard-text)]">École introuvable.</div>
  }

  const schoolId = roleData.school_id

  const { data: classes } = await supabase
    .from('classes')
    .select('id, name')
    .eq('school_id', schoolId)
    .order('name')

  const { data: students } = await supabase
    .from('students')
    .select('id, matricule, last_name, first_name, class_id')
    .eq('school_id', schoolId)
    .eq('status', 'actif')
    .order('last_name')
    
  const { data: subjects } = await supabase
    .from('teacher_class_subjects')
    .select('subject_name, class_id, coefficient')
    .eq('school_id', schoolId)

  // Fetch all grades for the school to compute averages client side.
  // In a large app, we would fetch only for the selected student via an API route.
  const { data: grades } = await supabase
    .from('grades')
    .select('student_id, score, subject_name, term, evaluation_type, class_id')
    .eq('school_id', schoolId)

  return (
    <BulletinsManager 
      classes={classes || []} 
      students={students || []} 
      subjects={subjects || []}
      grades={grades || []}
    />
  )
}
