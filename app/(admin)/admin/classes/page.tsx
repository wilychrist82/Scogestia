import { ClassesManager } from '@/components/admin/ClassesManager'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic' // Ensure fresh data

export default async function ClassesPage() {
  const supabase = await createClient()

  // 1. Get authenticated user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/connexion')
  }

  // 2. Resolve the active school_id for this admin
  const { data: roleData, error: roleError } = await supabase
    .from('user_school_roles')
    .select('school_id')
    .eq('user_id', user.id)
    .single()

  if (roleError || !roleData?.school_id) {
    return <div className="p-8 text-[var(--color-status-retard-text)]">Erreur: École introuvable.</div>
  }

  // 3. Fetch classes for this school
  const { data: classes, error: classesError } = await supabase
    .from('classes')
    .select('*')
    .eq('school_id', roleData.school_id)
    .order('created_at', { ascending: false })

  if (classesError) {
    return <div className="p-8 text-[var(--color-status-retard-text)]">Erreur lors de la récupération des classes.</div>
  }

  return (
    <ClassesManager classes={classes || []} />
  )
}
