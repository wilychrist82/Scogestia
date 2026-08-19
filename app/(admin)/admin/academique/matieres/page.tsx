import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MatieresManager } from '@/components/admin/academique/MatieresManager'

export const dynamic = 'force-dynamic'

export default async function MatieresPage() {
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

  const { data: subjectsRaw, error } = await supabase
    .from('teacher_class_subjects')
    .select(`
      id,
      subject_name,
      coefficient,
      class_id,
      teacher_id,
      class:classes(name)
    `)
    .eq('school_id', schoolId)
    .order('subject_name')

  const { data: classes } = await supabase
    .from('classes')
    .select('id, name')
    .eq('school_id', schoolId)
    .order('name')

  const { data: teachers } = await supabase
    .from('user_school_roles')
    .select('user_id, full_name')
    .eq('school_id', schoolId)
    .eq('role', 'enseignant')
    .order('full_name')

  const subjects = subjectsRaw?.map(sub => {
    const teacher = teachers?.find(t => t.user_id === sub.teacher_id)
    return {
      ...sub,
      teacher: teacher ? { full_name: teacher.full_name } : null
    }
  })

  if (error) {
    return <div className="p-8 text-[var(--color-status-retard-text)]">Erreur de récupération des matières.</div>
  }

  return (
    <MatieresManager 
      subjects={(subjects as any) || []} 
      classes={classes || []} 
      teachers={teachers || []} 
    />
  )
}
