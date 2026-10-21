import { StudentDetailTabs } from '@/components/admin/StudentDetailTabs'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCoefficientForSubject, getPrimarySubjectMaxScore } from '@/lib/academic-curriculum'
import { DataErrorCard } from '@/components/shared/DataErrorCard'

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
    return <DataErrorCard title="Établissement introuvable" message="Impossible d'identifier votre établissement. Veuillez vous reconnecter ou contacter l'assistance." />
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
      <DataErrorCard
        title="Élève introuvable"
        message="Ce dossier scolaire n'existe pas ou vous n'avez pas l'autorisation d'y accéder."
        actionHref="/admin/eleves"
        actionLabel="Retour au registre des élèves"
      />
    )
  }

  // Fetch grades (secondary, primary and legacy)
  const [
    { data: secGrades },
    { data: primGrades },
    { data: legacyGrades }
  ] = await Promise.all([
    supabase
      .from('secondary_grades')
      .select('id, term, class_score, comp_score, max_score, subjects(name, coefficient)')
      .eq('student_id', id)
      .order('term', { ascending: true }),
    supabase
      .from('primary_grades')
      .select('id, month_number, score, max_score, subjects(name, category)')
      .eq('student_id', id)
      .order('month_number', { ascending: true }),
    supabase
      .from('grades')
      .select('*')
      .eq('student_id', id)
      .order('created_at', { ascending: false })
  ]);

  const allGradesList: Array<{
    id: string;
    term: string;
    subject_name: string;
    evaluation_type: string;
    coefficient: number;
    score: number;
    max_score: number;
  }> = []

  const formatTerm = (t: string) => {
    if (t === '1er_trimestre') return '1er Trimestre';
    if (t === '2e_trimestre') return '2e Trimestre';
    if (t === '3e_trimestre') return '3e Trimestre';
    if (t === '1er_semestre') return '1er Semestre';
    if (t === '2e_semestre') return '2e Semestre';
    return (t || '').replace(/_/g, ' ');
  };

  const className = (student.classes as any)?.name;
  const classLevel = (student.classes as any)?.level;

  secGrades?.forEach((g: any) => {
    const sName = g.subjects?.name || 'Matière';
    const coef = getCoefficientForSubject(sName, className, classLevel, g.subjects?.coefficient || 2);
    const term = formatTerm(g.term);
    if (g.class_score !== null && g.class_score !== undefined) {
      allGradesList.push({
        id: `${g.id}_class`,
        term,
        subject_name: sName,
        evaluation_type: 'Devoir / Note de classe',
        coefficient: coef,
        score: Number(g.class_score),
        max_score: g.max_score || 20
      });
    }
    if (g.comp_score !== null && g.comp_score !== undefined) {
      allGradesList.push({
        id: `${g.id}_comp`,
        term,
        subject_name: sName,
        evaluation_type: 'Composition',
        coefficient: coef,
        score: Number(g.comp_score),
        max_score: g.max_score || 20
      });
    }
  });

  primGrades?.forEach((g: any) => {
    const sName = g.subjects?.name || 'Discipline';
    const officialMax = getPrimarySubjectMaxScore(sName, className, classLevel) || g.max_score || 10;
    allGradesList.push({
      id: g.id,
      term: `Mois ${g.month_number}`,
      subject_name: sName,
      evaluation_type: g.subjects?.category ? `Évaluation (${g.subjects.category})` : 'Évaluation Mensuelle',
      coefficient: 1,
      score: Number(g.score),
      max_score: officialMax
    });
  });

  legacyGrades?.forEach((g: any) => {
    allGradesList.push({
      id: g.id,
      term: formatTerm(g.term || 'Trimestre 1'),
      subject_name: g.subject_name || 'Matière',
      evaluation_type: g.evaluation_type || 'Évaluation',
      coefficient: g.coefficient || 1,
      score: Number(g.score),
      max_score: g.max_score || 20
    });
  });

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
        grades={allGradesList}
        attendances={attendances || []}
        schedules={schedules || []}
        payments={payments || []}
        linkedParents={linkedParents}
        initialInvitationCode={activeCode?.code || null}
      />
    </div>
  )
}
