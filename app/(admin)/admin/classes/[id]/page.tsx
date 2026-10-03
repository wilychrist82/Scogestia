import { ClassDetailsView } from '@/components/admin/ClassDetailsView'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function ClassDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
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

  // 1. Fetch class information
  const { data: classData, error: classError } = await supabase
    .from('classes')
    .select('id, name, level, capacity, academic_year')
    .eq('id', id)
    .eq('school_id', roleData.school_id)
    .single()

  if (classError || !classData) {
    return (
      <div className="p-8 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Classe introuvable</h2>
        <p className="text-slate-500 text-sm">Cette classe n'existe pas ou vous n'avez pas l'autorisation d'y accéder.</p>
        <Link href="/admin/classes" className="inline-block px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg text-sm font-semibold">
          Retour aux classes
        </Link>
      </div>
    )
  }

  // 2. Fetch all students in this class
  const { data: students } = await supabase
    .from('students')
    .select('id, matricule, first_name, last_name, gender, date_of_birth, parent_phone, status')
    .eq('class_id', id)
    .eq('school_id', roleData.school_id)
    .order('last_name', { ascending: true })

  return (
    <ClassDetailsView
      classInfo={classData}
      students={(students as any) || []}
    />
  )
}
