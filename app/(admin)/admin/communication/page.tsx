import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CommunicationManager } from '@/components/admin/communication/CommunicationManager'
import { Suspense } from 'react'

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

  const { data: studentsRaw } = await supabase
    .from('students')
    .select('id, first_name, last_name, classes(name)')
    .eq('school_id', schoolId)
    .order('last_name')

  // Normaliser classes (Supabase retourne un tableau ou null selon la config)
  const students = studentsRaw?.map(s => ({
    ...s,
    classes: Array.isArray(s.classes) ? s.classes[0] ?? null : s.classes
  })) || []

  // Charger les enseignants de l'école
  const { data: teachersRaw } = await supabase
    .from('user_school_roles')
    .select('user_id, full_name')
    .eq('school_id', schoolId)
    .eq('role', 'enseignant')
    .order('full_name')

  const teachers = teachersRaw?.map(t => ({
    id: t.user_id,
    full_name: t.full_name || 'Enseignant'
  })) || []

  const { data: communications } = await supabase
    .from('communications')
    .select('*')
    .eq('school_id', schoolId)
    .order('created_at', { ascending: false })
    .limit(20)

  return (
    <Suspense fallback={<div className="p-8">Chargement...</div>}>
      <CommunicationManager 
        currentUserId={user.id}
        classes={classes || []} 
        students={students as any}
        teachers={teachers}
        recentCommunications={communications || []}
      />
    </Suspense>
  )
}
