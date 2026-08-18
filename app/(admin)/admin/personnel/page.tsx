import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PersonnelManager } from '@/components/admin/PersonnelManager'

export const dynamic = 'force-dynamic'

export default async function PersonnelPage() {
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

  // Fetch staff list for this school
  const { data: staffList, error } = await supabase
    .from('user_school_roles')
    .select('id, full_name, role, phone, is_active, user_id')
    .eq('school_id', schoolId)
    .in('role', ['admin', 'comptable', 'enseignant']) // Only staff roles
    .order('created_at', { ascending: false })

  if (error) {
    return <div className="p-8 text-[var(--color-status-retard-text)]">Erreur lors de la récupération du personnel.</div>
  }

  return (
    <PersonnelManager staffList={staffList || []} />
  )
}
