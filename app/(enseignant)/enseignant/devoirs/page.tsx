import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import HomeworkClient from './HomeworkClient'

export default async function DevoirsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/connexion')
  }

  // Verify the user is a teacher
  const { data: roles } = await supabase
    .from('user_school_roles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (!roles || roles.role !== 'enseignant' && roles.role !== 'admin' && roles.role !== 'super_admin') {
    redirect('/connexion')
  }

  // 1. Fetch classes and subjects for this teacher
  // We use the RPC 'teacher_class_subjects' if it exists, or fetch directly from the table
  const { data: classesData, error: classesError } = await supabase
    .from('teacher_class_subjects')
    .select('class_id, classes(name), subject_name')
    .eq('teacher_id', user.id)

  const classes = (classesData || []).map((c: any) => ({
    class_id: c.class_id,
    class_name: c.classes?.name || 'Inconnue',
    subject_name: c.subject_name
  }))

  // 2. Fetch published homeworks for the classes this teacher teaches
  // We want all homeworks where created_by = user.id, OR where class_id is in their classes
  // Let's just fetch homeworks created by this teacher for simplicity and data isolation in this view.
  const { data: homeworksData, error: homeworksError } = await supabase
    .from('homework')
    .select('id, title, subject_name, due_date, attachment_url, class_id, classes(name)')
    .eq('created_by', user.id)
    .order('due_date', { ascending: false })

  const homeworks = (homeworksData || []).map((hw: any) => ({
    id: hw.id,
    title: hw.title,
    subject_name: hw.subject_name,
    due_date: hw.due_date,
    attachment_url: hw.attachment_url,
    class_name: hw.classes?.name || 'Inconnue'
  }))

  return (
    <HomeworkClient 
      classes={classes} 
      homeworks={homeworks} 
    />
  )
}
