import { StudentList } from '@/components/admin/StudentList'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getSchoolSubscriptionStatus } from '@/lib/subscription'
import { sortClasses } from '@/lib/classes'

export const dynamic = 'force-dynamic'

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string, classId?: string, search?: string, niveau?: string }>
}) {
  const resolvedSearchParams = await searchParams;
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: roleData } = await supabase
    .from('user_school_roles')
    .select('school_id')
    .eq('user_id', user.id)
    .limit(1).maybeSingle()

  if (!roleData?.school_id) {
    return <div className="p-8 text-[var(--color-status-retard-text)]">École introuvable.</div>
  }

  const schoolId = roleData.school_id
  
  // Pagination & Filters
  const page = parseInt(resolvedSearchParams.page || '1')
  const itemsPerPage = 10
  const from = (page - 1) * itemsPerPage
  const to = from + itemsPerPage - 1

  const niveau = resolvedSearchParams.niveau || 'Tous'

  // Apply niveau filter
  let levels: string[] = []
  if (niveau === 'Maternelle') {
    levels = ['s1', 's2', 'section1', 'section2', 'maternelle', 'Maternelle']
  } else if (niveau === 'Primaire') {
    levels = ['cp1', 'cp2', 'ce1', 'ce2', 'cm1', 'cm2', 'primaire', 'Primaire', 'CP1', 'CP2', 'CE1', 'CE2', 'CM1', 'CM2']
  } else if (niveau === 'Collège' || niveau === 'Secondaire') {
    levels = ['6eme', '5eme', '4eme', '3eme', 'secondaire', 'Secondaire', 'Collège', 'college', 'collège', '6ème', '5ème', '4ème', '3ème']
  } else if (niveau === 'Lycée') {
    levels = ['2nde', '1ere', '1ère', 'tle', 'terminale', 'seconde', 'premiere', 'première', 'lycee', 'lycée', 'Lycée', 'Seconde', 'Première', 'Terminale']
  }

  const selectFields = levels.length > 0
    ? `
      id,
      matricule,
      first_name,
      last_name,
      status,
      classes!inner ( id, name, level )
    `
    : `
      id,
      matricule,
      first_name,
      last_name,
      status,
      classes ( id, name, level )
    `

  let query = supabase
    .from('students')
    .select(selectFields, { count: 'exact' })
    .eq('school_id', schoolId)

  if (levels.length > 0) {
    query = query.in('classes.level', levels)
  }

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
    .select('id, name, level')
    .eq('school_id', schoolId)
    .order('name')

  // Total student count across the school for capacity quota
  const { count: totalSchoolStudents } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true })
    .eq('school_id', schoolId)

  const subStatus = await getSchoolSubscriptionStatus(supabase, schoolId)

  const studentQuota = {
    current: totalSchoolStudents || 0,
    max: subStatus.maxStudents,
    planName: subStatus.planName,
    isPro: subStatus.isPro,
  }

  if (error) {
    return <div className="p-8 text-[var(--color-status-retard-text)]">Erreur lors de la récupération des élèves.</div>
  }

  return (
    <StudentList 
      students={(students as any) || []} 
      classes={sortClasses(classes || [])}
      totalCount={count || 0}
      currentPage={page}
      itemsPerPage={itemsPerPage}
      studentQuota={studentQuota}
    />
  )
}
