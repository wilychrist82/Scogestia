import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CommunicationManager } from '@/components/admin/communication/CommunicationManager'

export const dynamic = 'force-dynamic'

export default async function CommunicationPage() {
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

  const { data: classes } = await supabase
    .from('classes')
    .select('id, name')
    .eq('school_id', schoolId)
    .order('name')

  const { data: students } = await supabase
    .from('students')
    .select('id, first_name, last_name, classes(name)')
    .eq('school_id', schoolId)
    .order('last_name')

  const { data: communications } = await supabase
    .from('communications')
    .select('*')
    .eq('school_id', schoolId)
    .order('created_at', { ascending: false })
    .limit(10)

  return (
    <CommunicationManager 
      classes={classes || []} 
      students={students || []} 
      recentCommunications={communications || []}
    />
  )
}
