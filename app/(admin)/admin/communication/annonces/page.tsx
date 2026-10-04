import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AnnouncementsManager } from '@/components/admin/communication/AnnouncementsManager'
import { sortClasses } from '@/lib/classes'

export const dynamic = 'force-dynamic'

export default async function AnnoncesPage() {
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

  const [{ data: schoolData }, { data: announcements }, { data: classes }] = await Promise.all([
    supabase
      .from('schools')
      .select('id, name, logo_url')
      .eq('id', schoolId)
      .maybeSingle(),
    supabase
      .from('announcements')
      .select('*')
      .eq('school_id', schoolId)
      .order('created_at', { ascending: false }),
    supabase
      .from('classes')
      .select('id, name')
      .eq('school_id', schoolId)
      .order('name')
  ])

  return (
    <AnnouncementsManager
      announcements={announcements || []}
      classes={sortClasses(classes || [])}
      schoolLogo={schoolData?.logo_url || null}
      schoolName={schoolData?.name || 'École'}
    />
  )
}
