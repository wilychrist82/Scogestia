import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SecuritySettings } from '@/components/admin/parametres/SecuritySettings'

export const dynamic = 'force-dynamic'

export default async function SecurityPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: roleData } = await supabase
    .from('user_school_roles')
    .select('school_id, role')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!roleData || roleData.role !== 'admin') {
    return <div className="p-8 text-[var(--color-status-retard-text)]">Accès refusé. Vous devez être administrateur.</div>
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
