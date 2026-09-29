import { AdminLayoutWrapper } from '@/components/layout/AdminLayoutWrapper'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { UnauthorizedAccess } from '@/components/shared/UnauthorizedAccess'
import { SchoolSuspendedScreen } from '@/components/shared/SchoolSuspendedScreen'
import { getSchoolSubscriptionStatus } from '@/lib/subscription'

export default async function EnseignantLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/connexion')
  }

  const { data: roleData } = await supabase
    .from('user_school_roles')
    .select(`
      full_name, 
      role,
      school_id,
      schools (
        name,
        city
      )
    `)
    .eq('user_id', user.id)
    .eq('role', 'enseignant')
    .limit(1).maybeSingle()

  if (!roleData) {
    return <UnauthorizedAccess role="enseignant" />
  }

  const schoolJoin = roleData.schools as unknown as { name: string; city: string | null } | { name: string; city: string | null }[] | null
  const school = Array.isArray(schoolJoin) ? schoolJoin[0] ?? null : schoolJoin
  const schoolName = school?.name || 'École inconnue'
  const schoolCity = school?.city || ''

  // Vérifier si l'établissement est actif
  if (roleData.school_id) {
    const subStatus = await getSchoolSubscriptionStatus(supabase, roleData.school_id)
    if (subStatus.isExpired) {
      return <SchoolSuspendedScreen schoolName={schoolName} userRole="enseignant" />
    }
  }

  const userAvatar = user?.user_metadata?.avatar_url || null

  return (
    <AdminLayoutWrapper 
      userFullName={roleData?.full_name || 'Enseignant'} 
      userRoleLabel="Enseignant"
      userAvatar={userAvatar}
      navVariant="enseignant"
      schoolName={schoolName}
      schoolCity={schoolCity}
    >
      {children}
    </AdminLayoutWrapper>
  )
}
