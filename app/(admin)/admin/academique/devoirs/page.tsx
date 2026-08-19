import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DevoirsManager } from '@/components/admin/academique/DevoirsManager'

export const dynamic = 'force-dynamic'

export default async function DevoirsPage() {
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

  const { data: homeworks } = await supabase
    .from('homework')
    .select(`
      id,
      title,
      subject_name,
      due_date,
      created_at,
      class:classes(name),
      creator:users!homework_created_by_fkey(full_name)
    `)
    .eq('school_id', schoolId)
    .order('created_at', { ascending: false })

  const { data: classes } = await supabase
    .from('classes')
    .select('id, name')
    .eq('school_id', schoolId)
    .order('name')

  const { data: subjects } = await supabase
    .from('teacher_class_subjects')
    .select('subject_name, class_id')
    .eq('school_id', schoolId)

  // Needs manual matching for full_name due to auth.users limitations (same as matieres)
  const { data: users } = await supabase
    .from('user_school_roles')
    .select('user_id, full_name')
    .eq('school_id', schoolId)

  const homeworksMapped = homeworks?.map((hw: any) => {
    // Assuming hw.creator wasn't fetched correctly due to missing full_name in auth.users
    // But we actually only have created_by in the table homework, let's fetch created_by and map it
    return hw; // Will fix the query in the next step
  })

  // Actually let's fetch raw
  const { data: homeworksRaw, error } = await supabase
    .from('homework')
    .select(`
      id,
      title,
      subject_name,
      due_date,
      created_at,
      created_by,
      class:classes(name)
    `)
    .eq('school_id', schoolId)
    .order('created_at', { ascending: false })

  const homeworksFinal = homeworksRaw?.map(hw => {
    const creator = users?.find(u => u.user_id === hw.created_by)
    return {
      ...hw,
      creator: creator ? { full_name: creator.full_name } : null
    }
  })

  if (error) {
    return <div className="p-8 text-[var(--color-status-retard-text)]">Erreur de récupération des devoirs.</div>
  }

  return (
    <DevoirsManager 
      homeworks={(homeworksFinal as any) || []} 
      classes={classes || []} 
      subjects={subjects || []}
    />
  )
}
