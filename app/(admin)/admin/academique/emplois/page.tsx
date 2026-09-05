import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { EmploisManager } from '@/components/admin/academique/EmploisManager'

export const dynamic = 'force-dynamic'

export default async function EmploisDuTempsPage() {
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
    .select('id, name, level')
    .eq('school_id', schoolId)
    .order('name')

  return <EmploisManager classes={classes || []} />
}
