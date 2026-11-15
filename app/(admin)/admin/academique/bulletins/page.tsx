import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BulletinsManager } from '@/components/admin/academique/BulletinsManager'
import { sortClasses } from '@/lib/classes'
import { DataErrorCard } from '@/components/shared/DataErrorCard'
import { ADMIN_SPACE_ROLES } from '@/lib/roles'
import { chunkArray } from '@/lib/collections'
import { ensureDefaultSubjects } from '@/lib/default-subjects'

export const dynamic = 'force-dynamic'

export default async function BulletinsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: roleData } = await supabase
    .from('user_school_roles')
    .select('school_id, role, school:schools(name, logo_url, city, phone, stamp_url, signature_url, director_name)')
    .eq('user_id', user.id)
    .in('role', [...ADMIN_SPACE_ROLES, 'enseignant'])
    .limit(1)
    .maybeSingle()

  if (!roleData?.school_id) {
    return (
      <DataErrorCard
        title="Établissement introuvable"
        message="Impossible d'identifier votre établissement. Veuillez vous reconnecter ou contacter l'assistance."
      />
    )
  }

  if (roleData.role === 'enseignant') {
    redirect('/enseignant/notes')
  }

  const schoolId = roleData.school_id
  const schoolDetails = roleData.school as {
    name?: string | null
    logo_url?: string | null
    city?: string | null
    phone?: string | null
    stamp_url?: string | null
    signature_url?: string | null
    director_name?: string | null
  } | null

  const [
    { data: classes },
    { data: students },
    { data: rawSubjects },
    { data: primaryGrades },
    { data: secondaryGrades },
  ] = await Promise.all([
    supabase.from('classes').select('id, name, level').eq('school_id', schoolId).order('name'),
    supabase.from('students').select('id, matricule, last_name, first_name, class_id').eq('school_id', schoolId).order('last_name'),
    supabase.from('subjects').select('*').eq('school_id', schoolId),
    supabase.from('primary_grades').select('*').eq('school_id', schoolId),
    supabase.from('secondary_grades').select('*').eq('school_id', schoolId),
  ])

  const subjects = await ensureDefaultSubjects(supabase, schoolId, rawSubjects)

  const studentIds = (students ?? []).map((s) => s.id)
  const studentChunks = chunkArray(studentIds, 200)

  const [rankResponses, infoResponses] = studentChunks.length > 0
    ? await Promise.all([
        Promise.all(
          studentChunks.map((chunk) =>
            supabase.from('primary_monthly_ranks').select('*').in('student_id', chunk),
          ),
        ),
        Promise.all(
          studentChunks.map((chunk) =>
            supabase.from('primary_bulletin_info').select('*').in('student_id', chunk),
          ),
        ),
      ])
    : [[], []]

  const primaryRanks = rankResponses.flatMap((res) => res.data ?? [])
  const primaryInfo = infoResponses.flatMap((res) => res.data ?? [])

  return (
    <BulletinsManager
      classes={sortClasses(classes || [])}
      students={students || []}
      subjects={subjects}
      primaryGrades={primaryGrades || []}
      secondaryGrades={secondaryGrades || []}
      primaryRanks={primaryRanks}
      primaryInfo={primaryInfo}
      schoolName={schoolDetails?.name || 'École'}
      schoolLogo={schoolDetails?.logo_url || null}
      schoolStamp={schoolDetails?.stamp_url || null}
      schoolSignature={schoolDetails?.signature_url || null}
      schoolDirector={schoolDetails?.director_name || null}
      schoolCity={schoolDetails?.city || null}
      schoolPhone={schoolDetails?.phone || null}
      schoolId={schoolId}
    />
  )
}
