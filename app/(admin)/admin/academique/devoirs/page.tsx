import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DevoirsManager } from '@/components/admin/academique/DevoirsManager'
import { sortClasses } from '@/lib/classes'
import { DataErrorCard } from '@/components/shared/DataErrorCard'

export const dynamic = 'force-dynamic'

export default async function DevoirsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: roleData } = await supabase
    .from('user_school_roles')
    .select('school_id')
    .eq('user_id', user.id)
    .limit(1).maybeSingle()

  if (!roleData?.school_id) {
    return <DataErrorCard title="Établissement introuvable" message="Impossible d'identifier votre établissement. Veuillez vous reconnecter ou contacter l'assistance." />
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
    .select('id, name, level')
    .eq('school_id', schoolId)
    .order('name')

  const { data: subjects } = await supabase
    .from('subjects')
    .select('id, name, cycle')
    .eq('school_id', schoolId)
    
  const { data: students } = await supabase
    .from('students')
    .select('id, first_name, last_name, class_id')
    .eq('school_id', schoolId)
    .eq('status', 'actif')
    .order('last_name')

  // Needs manual matching for full_name due to auth.users limitations (same as matieres)
  const { data: users } = await supabase
    .from('user_school_roles')
    .select('user_id, full_name')
    .eq('school_id', schoolId)

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
      attachment_url,
      target_students,
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
    return <DataErrorCard title="Erreur de chargement" message="Impossible de récupérer les devoirs pour le moment. Veuillez rafraîchir la page." />
  }

  return (
    <DevoirsManager 
      homeworks={(homeworksFinal as any) || []} 
      classes={sortClasses(classes || [])} 
      subjects={subjects || []}
      students={students || []}
    />
  )
}
