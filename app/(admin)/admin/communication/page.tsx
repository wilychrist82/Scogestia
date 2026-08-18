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
    .single()

  if (!roleData?.school_id) {
    return <div className="p-8 text-[var(--color-status-retard-text)]">École introuvable.</div>
  }

  const schoolId = roleData.school_id

  const { data: classes } = await supabase
    .from('classes')
    .select('id, name')
    .eq('school_id', schoolId)
    .order('name')

  const { data: parents } = await supabase
    .from('user_school_roles')
    .select('user_id, full_name')
    .eq('school_id', schoolId)
    .eq('role', 'parent')
    .order('full_name')

  return (
    <CommunicationManager 
      classes={classes || []} 
      parents={parents || []} 
    />
  )
}
