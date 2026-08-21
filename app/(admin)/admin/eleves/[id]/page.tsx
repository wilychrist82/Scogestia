import { StudentDetailTabs } from '@/components/admin/StudentDetailTabs'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
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

  // Fetch student details
  const { data: student, error } = await supabase
    .from('students')
    .select(`
      id,
      matricule,
      first_name,
      last_name,
      date_of_birth,
      classes ( name )
    `)
    .eq('id', id)
    .eq('school_id', roleData.school_id)
    .single()

  if (error || !student) {
    return (
      <div className="p-8 text-center text-[var(--color-on-surface-variant)]">
        Élève introuvable ou vous n'avez pas l'autorisation de voir cette fiche.
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-[var(--color-on-surface-variant)] mb-4">
        <Link href="/admin/eleves" className="hover:text-[var(--color-primary)] font-semibold transition-colors">
          Élèves
        </Link>
        <span className="material-symbols-outlined text-sm">chevron_right</span>
        <span className="text-[var(--color-on-surface)] font-semibold">{student.first_name} {student.last_name}</span>
      </div>

      <StudentDetailTabs student={student as any} />
    </div>
  )
}
