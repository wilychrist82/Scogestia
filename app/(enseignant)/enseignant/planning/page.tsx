import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PlanningDashboard } from '@/components/enseignant/planning/PlanningDashboard'

export const dynamic = 'force-dynamic'

export default async function EnseignantPlanningPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: roleData } = await supabase
    .from('user_school_roles')
    .select('school_id')
    .eq('user_id', user.id)
    .eq('role', 'enseignant')
    .limit(1).maybeSingle()

  if (!roleData) redirect('/')

  // Récupérer les emplois du temps de l'enseignant
  const { data: timetables, error } = await supabase
    .from('timetables')
    .select(`
      id,
      day_of_week,
      start_time,
      end_time,
      subject_name,
      room_name,
      class_id,
      classes (
        name
      )
    `)
    .eq('teacher_id', user.id)
    .order('day_of_week', { ascending: true })
    .order('start_time', { ascending: true })

  // It's possible the table doesn't exist yet on Vercel if migrations aren't pushed,
  // so we handle the error gracefully to avoid crashing the page.
  const safeTimetables = error ? [] : (timetables || [])

  return (
    <PlanningDashboard timetables={safeTimetables as any} />
  )
}
