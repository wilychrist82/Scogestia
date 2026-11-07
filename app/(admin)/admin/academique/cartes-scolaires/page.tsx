import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { sortClasses } from '@/lib/classes'
import { DataErrorCard } from '@/components/shared/DataErrorCard'
import { SchoolIdCardsManager } from '@/components/admin/academique/SchoolIdCardsManager'

export const dynamic = 'force-dynamic'

export default async function CartesScolairesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: roleData } = await supabase
    .from('user_school_roles')
    .select(
      'school_id, role, school:schools(id, name, logo_url, city, phone, email, current_academic_year, stamp_url, signature_url, director_name)'
    )
    .eq('user_id', user.id)
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
    redirect('/enseignant')
  }

  const schoolId = roleData.school_id
  const schoolDetails = (roleData.school as any) || null

  const [{ data: classes }, { data: students }] = await Promise.all([
    supabase
      .from('classes')
      .select('id, name, level, academic_year')
      .eq('school_id', schoolId)
      .order('name'),
    supabase
      .from('students')
      .select(
        'id, matricule, first_name, last_name, gender, date_of_birth, birth_place, blood_group, address, parent_phone, avatar_url, class_id'
      )
      .eq('school_id', schoolId)
      .order('last_name'),
  ])

  const sortedClasses = sortClasses(classes || [])

  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-sm font-semibold text-slate-500">
          Chargement du générateur de cartes scolaires...
        </div>
      }
    >
      <SchoolIdCardsManager
        classes={sortedClasses}
        students={students || []}
        schoolInfo={
          schoolDetails
            ? {
                id: schoolDetails.id || schoolId,
                name: schoolDetails.name,
                city: schoolDetails.city,
                phone: schoolDetails.phone,
                email: schoolDetails.email,
                current_academic_year: schoolDetails.current_academic_year,
                director_name: schoolDetails.director_name,
                logo_url: schoolDetails.logo_url,
                stamp_url: schoolDetails.stamp_url,
                signature_url: schoolDetails.signature_url,
              }
            : { id: schoolId }
        }
      />
    </Suspense>
  )
}

