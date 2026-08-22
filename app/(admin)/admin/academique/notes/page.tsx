import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { NotesManager } from '@/components/admin/academique/NotesManager'

export const dynamic = 'force-dynamic'

export default async function NotesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: roleData } = await supabase
    .from('user_school_roles')
    .select('school_id')
    .eq('user_id', user.id)
    .single()

  if (!roleData?.school_id) return <div className="p-8">École introuvable.</div>
  const schoolId = roleData.school_id

  const { data: classes } = await supabase.from('classes').select('id, name, level').eq('school_id', schoolId).order('name')
  const { data: subjects } = await supabase.from('subjects').select('id, name, cycle').eq('school_id', schoolId).order('name')
  const { data: students } = await supabase.from('students').select('id, first_name, last_name, matricule, class_id').eq('school_id', schoolId).order('last_name')
  
  const { data: primaryGrades } = await supabase.from('primary_grades').select('*').eq('school_id', schoolId)
  const { data: secondaryGrades } = await supabase.from('secondary_grades').select('*').eq('school_id', schoolId)

  return (
    <NotesManager 
      classes={classes || []} 
      subjects={subjects || []} 
      students={students || []} 
      primaryGrades={primaryGrades || []}
      secondaryGrades={secondaryGrades || []}
    />
  )
}
