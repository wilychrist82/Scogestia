import { StudentList } from '@/components/admin/StudentList'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string, classId?: string, search?: string }>
}) {
  const resolvedSearchParams = await searchParams;
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
  
  // Pagination & Filters
  const page = parseInt(resolvedSearchParams.page || '1')
  const itemsPerPage = 10
  const from = (page - 1) * itemsPerPage
  const to = from + itemsPerPage - 1

  let query = supabase
    .from('students')
    .select(`
      id,
      matricule,
      first_name,
      last_name,
      status,
      classes ( id, name )
    `, { count: 'exact' })
    .eq('school_id', schoolId)

  if (resolvedSearchParams.classId) {
    query = query.eq('class_id', resolvedSearchParams.classId)
  }

  if (resolvedSearchParams.search) {
    query = query.or(`first_name.ilike.%${resolvedSearchParams.search}%,last_name.ilike.%${resolvedSearchParams.search}%,matricule.ilike.%${resolvedSearchParams.search}%`)
  }

  query = query.order('created_at', { ascending: false }).range(from, to)

  const { data: students, count, error } = await query

  // Also fetch classes for the filter dropdown
  const { data: classes } = await supabase
    .from('classes')
    .select('id, name')
    .eq('school_id', schoolId)
    .order('name')

  if (error) {
    return <div className="p-8 text-[var(--color-status-retard-text)]">Erreur lors de la récupération des élèves.</div>
  }

  return (
    <StudentList 
      students={(students as any) || []} 
      classes={classes || []}
      totalCount={count || 0}
      currentPage={page}
      itemsPerPage={itemsPerPage}
    />
  )
}
