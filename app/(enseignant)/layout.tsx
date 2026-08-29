import { AdminLayoutWrapper } from '@/components/layout/AdminLayoutWrapper'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

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
      schools (
        name,
        city
      )
    `)
    .eq('user_id', user.id)
    .limit(1).maybeSingle()

  const school = roleData?.schools as any
  const schoolName = school?.name || 'École inconnue'
  const schoolCity = school?.city || ''

  return (
    <AdminLayoutWrapper 
      userFullName={roleData?.full_name || 'Enseignant'} 
      userRoleLabel="Enseignant"
      navVariant="enseignant"
      schoolName={schoolName}
      schoolCity={schoolCity}
    >
      {children}
    </AdminLayoutWrapper>
  )
}
