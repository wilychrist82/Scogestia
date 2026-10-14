import { StudentDetailTabs } from '@/components/admin/StudentDetailTabs'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
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
    .limit(1).maybeSingle()

  if (!roleData?.school_id) {
    return <div className="p-8 text-[var(--color-status-retard-text)]">École introuvable.</div>
  }

  // Fetch student details
  const { data: student, error } = await supabase
    .from('students')
    .select(`
      id,
      school_id,
      matricule,
      first_name,
      last_name,
      date_of_birth,
      birth_place,
      gender,
      blood_group,
      address,
      parent_phone,
      avatar_url,
      classes ( name )
    `)
    .eq('id', id)
    .eq('school_id', roleData.school_id)
    .limit(1).maybeSingle()

  if (error || !student) {
    return (
      <div className="p-8 text-center text-[var(--color-on-surface-variant)]">
        Élève introuvable ou vous n'avez pas l'autorisation de voir cette fiche.
      </div>
    )
  }

  // Fetch grades
  const { data: grades } = await supabase
    .from('grades')
    .select('*')
    .eq('student_id', id)
    .order('created_at', { ascending: false })

  // Fetch attendances
  const { data: attendances } = await supabase
    .from('attendance')
    .select('*')
    .eq('student_id', id)
    .order('date', { ascending: false })

  // Fetch payment schedules
  const { data: schedules } = await supabase
    .from('payment_schedules')
    .select('*')
    .eq('student_id', id)
    .order('due_date', { ascending: true })

  // Fetch payments
  const { data: payments } = await supabase
    .from('payments')
    .select('*, schedule:payment_schedules(label)')
    .eq('student_id', id)
    .order('paid_at', { ascending: false })

  // Fetch linked parent accounts (with phone/email credentials)
  const adminClient = createAdminClient()
  const { data: parentLinks } = await adminClient
    .from('parent_student_links')
    .select('id, parent_user_id, relationship, created_at')
    .eq('student_id', id)

  const linkedParents: any[] = []
  if (parentLinks && parentLinks.length > 0) {
    for (const link of parentLinks) {
      const { data: userData } = await adminClient.auth.admin.getUserById(link.parent_user_id)
      const { data: parentRole } = await adminClient
        .from('user_school_roles')
        .select('full_name, phone')
        .eq('user_id', link.parent_user_id)
        .eq('school_id', roleData.school_id)
        .maybeSingle()

      linkedParents.push({
        linkId: link.id,
        userId: link.parent_user_id,
        relationship: link.relationship,
        createdAt: link.created_at,
        phone: userData?.user?.phone || parentRole?.phone || null,
        email: userData?.user?.email || null,
        fullName: parentRole?.full_name || userData?.user?.user_metadata?.full_name || 'Parent'
      })
    }
  }

  // Fetch active invitation code if any
  const { data: activeCode } = await adminClient
    .from('parent_invitation_codes')
    .select('code, expires_at, created_at')
    .eq('student_id', id)
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-[var(--color-on-surface-variant)] mb-4">
        <Link href="/admin/eleves" className="hover:text-[var(--color-primary)] font-semibold transition-colors">
          Élèves
        </Link>
        <span className="text-slate-400">/</span>
        <span className="text-[var(--color-on-surface)] font-semibold">{student.first_name} {student.last_name}</span>
      </div>

      <StudentDetailTabs 
        student={student as any} 
        grades={grades || []}
        attendances={attendances || []}
        schedules={schedules || []}
        payments={payments || []}
        linkedParents={linkedParents}
        initialInvitationCode={activeCode?.code || null}
      />
    </div>
  )
}
