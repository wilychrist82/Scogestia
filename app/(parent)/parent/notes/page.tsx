import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ResultatsTabs } from '@/components/parent/ResultatsTabs'
import { UserX, ArrowLeft, BookOpen } from 'lucide-react'

import { resolveStudentId } from '@/lib/parent-utils'
import { ChildSwitchBar } from '@/components/parent/ChildSwitchBar'
import { getCoefficientForSubject, getPrimarySubjectMaxScore } from '@/lib/academic-curriculum'

export const dynamic = 'force-dynamic'

export default async function ParentNotesPage({
  searchParams,
}: {
  searchParams: Promise<{ child?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/connexion')

  const resolvedSearchParams = await searchParams;
  const { childrenList, selectedChild, selectedChildId } = await resolveStudentId(supabase, user.id, resolvedSearchParams)

  if (!selectedChildId) {
    return (
      <div className="p-6 text-center flex flex-col items-center justify-center min-h-[70vh]">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <UserX className="w-8 h-8 text-slate-400" />
        </div>
        <h2 className="text-xl font-bold text-[var(--color-on-surface)] mb-2">Aucun élève lié</h2>
        <p className="text-[var(--color-on-surface-variant)] mb-6">Vous n'avez aucun enfant lié à votre compte.</p>
        <Link href="/parent" className="bg-[var(--color-primary)] text-white px-6 py-2 rounded-full font-semibold">
          Retour à l'accueil
        </Link>
      </div>
    )
  }

  const childId = selectedChildId
  const student = selectedChild

  // Si on veut être sûr que le student complet existe (pour classes, etc.)
  const { data: fullStudent } = await supabase
    .from('students')
    .select('first_name, last_name, class_id, classes(name)')
    .eq('id', childId)
    .single()

  if (!fullStudent) {
    return (
      <div className="p-6 text-center">
        <p>Informations de l'élève introuvables.</p>
      </div>
    )
  }

  // Récupérer les notes de l'élève depuis secondary_grades, primary_grades et grades
  const [
    { data: secGrades },
    { data: primGrades },
    { data: legacyGrades }
  ] = await Promise.all([
    supabase
      .from('secondary_grades')
      .select('id, term, class_score, comp_score, max_score, subjects(name, coefficient)')
      .eq('student_id', childId)
      .order('term', { ascending: true }),
    supabase
      .from('primary_grades')
      .select('id, month_number, score, max_score, subjects(name, category)')
      .eq('student_id', childId)
      .order('month_number', { ascending: true }),
    supabase
      .from('grades')
      .select('*')
      .eq('student_id', childId)
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

  secGrades?.forEach((g: any) => {
    const sName = g.subjects?.name || 'Matière';
    const coef = getCoefficientForSubject(sName, (fullStudent.classes as any)?.name, undefined, g.subjects?.coefficient || 2);
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
    const officialMax = getPrimarySubjectMaxScore(sName, (fullStudent.classes as any)?.name, (fullStudent.classes as any)?.level) || g.max_score || 10;
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

  // Grouper les notes par trimestre / période
  const gradesByTerm = allGradesList.reduce((acc: Record<string, any[]>, grade) => {
    const term = grade.term || 'Période inconnue';
    if (!acc[term]) acc[term] = [];
    acc[term].push(grade);
    return acc;
  }, {});

  // Trier les trimestres
  const sortedTerms = Object.keys(gradesByTerm).sort();

  return (
    <div className="p-4 space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-2">
      <div className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-sm border border-[var(--color-outline-variant)]">
        <Link href="/parent" className="text-[var(--color-on-surface-variant)] hover:text-emerald-700 transition-colors p-1 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-[var(--color-on-surface)]">Résultats Scolaires</h1>
          <p className="text-sm text-[var(--color-primary)] font-medium">
            {fullStudent.first_name} {fullStudent.last_name} • {(fullStudent.classes as any)?.name}
          </p>
        </div>
      </div>

      {childrenList.length > 0 && (
        <ChildSwitchBar
          childrenList={childrenList}
          selectedChildId={childId}
          title="Élève"
        />
      )}

      <ResultatsTabs />

      {sortedTerms.length === 0 ? (
        <div className="bg-white p-8 rounded-xl shadow-sm border border-[var(--color-outline-variant)] text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
            <BookOpen className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-lg font-bold text-[var(--color-on-surface)] mb-1">Aucune note</h2>
          <p className="text-[var(--color-on-surface-variant)] text-sm">Les notes de cet élève n'ont pas encore été saisies.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedTerms.map(term => (
            <div key={term} className="bg-white rounded-xl shadow-sm border border-[var(--color-outline-variant)] overflow-hidden">
              <div className="bg-[var(--color-primary)] px-4 py-3 text-white font-bold text-lg flex items-center justify-between">
                {term}
                <span className="bg-white text-[var(--color-primary)] text-xs px-2 py-1 rounded-full">
                  {gradesByTerm[term].length} note(s)
                </span>
              </div>
              <div className="divide-y divide-[var(--color-outline-variant)]">
                {gradesByTerm[term].map((grade: any) => {
                  const percentage = (grade.score / grade.max_score) * 20;
                  const colorClass = percentage >= 15 ? 'text-green-600 bg-green-50 border-green-200' 
                                   : percentage >= 10 ? 'text-orange-600 bg-orange-50 border-orange-200' 
                                   : 'text-red-600 bg-red-50 border-red-200';
                  
                  return (
                    <div key={grade.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <div>
                        <h3 className="font-bold text-[var(--color-on-surface)]">{grade.subject_name}</h3>
                        <p className="text-xs text-[var(--color-on-surface-variant)] uppercase tracking-wide mt-1">
                          {grade.evaluation_type} • Coef {grade.coefficient}
                        </p>
                      </div>
                      <div className={`px-3 py-1.5 rounded-lg border font-bold text-lg flex items-baseline gap-1 ${colorClass}`}>
                        {grade.score} <span className="text-xs opacity-70 font-medium">/ {grade.max_score}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
