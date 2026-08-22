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
    .select('school_id, school:schools(name, logo_url, address, phone)')
    .eq('user_id', user.id)
    .single()

  if (!roleData?.school_id) {
    return <div className="p-8 text-[var(--color-status-retard-text)]">École introuvable.</div>
  }

  const schoolId = roleData.school_id
  const schoolDetails = roleData.school

  const { data: classes } = await supabase.from('classes').select('id, name, level').eq('school_id', schoolId).order('name')
  const { data: students } = await supabase.from('students').select('id, matricule, last_name, first_name, class_id').eq('school_id', schoolId).eq('status', 'actif').order('last_name')
  const { data: subjects } = await supabase.from('subjects').select('*').eq('school_id', schoolId)
  
  // We fetch all grades for the school to compute client side. 
  // In a huge real-world app, this would be behind a dedicated API route per student/class, but we keep it simple here.
  const { data: primaryGrades } = await supabase.from('primary_grades').select('*').eq('school_id', schoolId)
  const { data: secondaryGrades } = await supabase.from('secondary_grades').select('*').eq('school_id', schoolId)

  return (
    <BulletinsManager 
      classes={classes || []} 
      students={students || []} 
      subjects={subjects || []}
      primaryGrades={primaryGrades || []}
      secondaryGrades={secondaryGrades || []}
      schoolName={(schoolDetails as any)?.name || 'École'}
    />
  )
}
