import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CommunicationHistoryManager } from '@/components/admin/communication/CommunicationHistoryManager'
import { sortClasses } from '@/lib/classes'

export const dynamic = 'force-dynamic'

export default async function CommunicationHistoryPage() {
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

  const [{ data: classesRaw }, { data: rolesRaw }, { data: communicationsRaw }] = await Promise.all([
    supabase
      .from('classes')
      .select('id, name')
      .eq('school_id', schoolId)
      .order('name'),
    supabase
      .from('user_school_roles')
      .select('user_id, full_name, role')
      .eq('school_id', schoolId),
    supabase
      .from('communications')
      .select('*')
      .eq('school_id', schoolId)
      .order('created_at', { ascending: false })
  ])

  return (
    <CommunicationHistoryManager
      initialCommunications={communicationsRaw || []}
      classes={sortClasses(classesRaw || [])}
      roles={rolesRaw || []}
    />
  )
}
