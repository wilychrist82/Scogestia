import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SecuritySettings } from '@/components/admin/parametres/SecuritySettings'
import { DataErrorCard } from '@/components/shared/DataErrorCard'
import { ADMIN_SPACE_ROLES } from '@/lib/roles'
import { isOwnerEmail } from '@/lib/owner'

export const dynamic = 'force-dynamic'

export default async function SecurityPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const [{ data: roleData }, { data: isSuperAdmin }] = await Promise.all([
    supabase
      .from('user_school_roles')
      .select('school_id, role')
      .eq('user_id', user.id)
      .in('role', [...ADMIN_SPACE_ROLES, 'super_admin'])
      .limit(1)
      .maybeSingle(),
    supabase.rpc('is_super_admin'),
  ])

  const isPrivileged = Boolean(isSuperAdmin) || isOwnerEmail(user.email)

  if (!roleData?.school_id || (!isPrivileged && !['admin', 'super_admin'].includes(roleData.role))) {
    return <DataErrorCard title="Accès restreint" message="Cette section de sécurité est exclusivement réservée à l'administrateur de l'école." />
  }

  // Fetch users with roles for this school
  const { data: users } = await supabase
    .from('user_school_roles')
    .select('id, user_id, full_name, role, phone, is_active, created_at')
    .eq('school_id', roleData.school_id)
    .order('created_at', { ascending: false })

  return (
    <SecuritySettings
      users={users || []}
      schoolId={roleData.school_id}
    />
  )
}
