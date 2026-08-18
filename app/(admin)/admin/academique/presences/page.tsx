import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PresencesManager } from '@/components/admin/academique/PresencesManager'

export const dynamic = 'force-dynamic'

export default async function PresencesPage() {
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
    
  // Fetch existing attendance for today by default to populate the grid.
  // In a robust app, we'd fetch this via API on date change.
  const today = new Date().toISOString().split('T')[0]
  const { data: attendance } = await supabase
    .from('attendance')
    .select('student_id, status')
    .eq('school_id', schoolId)
    .eq('date', today)

  return (
    <PresencesManager 
      classes={classes || []} 
      students={students || []} 
      existingAttendance={attendance || []}
    />
  )
}
