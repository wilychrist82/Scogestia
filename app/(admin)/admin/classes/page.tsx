import { ClassesManager } from '@/components/admin/ClassesManager'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { sortClasses } from '@/lib/classes'

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
    .limit(1).maybeSingle()

  if (roleError || !roleData?.school_id) {
    return <div className="p-8 text-[var(--color-status-retard-text)]">Erreur: École introuvable.</div>
  }

  // 3. Fetch classes for this school with student count
  const { data: classes, error: classesError } = await supabase
    .from('classes')
    .select(`
      id,
      name,
      level,
      capacity,
      academic_year,
      main_teacher_id,
      students (count)
    `)
    .eq('school_id', roleData.school_id)
    .order('name', { ascending: true })

  if (classesError) {
    return <div className="p-8 text-[var(--color-status-retard-text)]">Erreur lors de la récupération des classes.</div>
  }

  const formattedClasses = (classes || []).map((c: any) => ({
    id: c.id,
    name: c.name,
    level: c.level,
    capacity: c.capacity,
    academic_year: c.academic_year,
    main_teacher_id: c.main_teacher_id,
    student_count: c.students?.[0]?.count ?? 0
  }))

  return (
    <ClassesManager classes={sortClasses(formattedClasses)} />
  )
}
