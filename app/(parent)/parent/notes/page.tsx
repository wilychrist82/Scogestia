import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

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
  const childId = resolvedSearchParams.child

  if (!childId) {
    return (
      <div className="p-6 text-center flex flex-col items-center justify-center min-h-[70vh]">
        <span className="material-symbols-outlined text-5xl text-gray-300 mb-4">person_search</span>
        <h2 className="text-xl font-bold text-[var(--color-on-surface)] mb-2">Élève non spécifié</h2>
        <p className="text-[var(--color-on-surface-variant)] mb-6">Veuillez sélectionner un enfant depuis le tableau de bord pour voir ses notes.</p>
        <Link href="/parent" className="bg-[var(--color-primary)] text-white px-6 py-2 rounded-full font-semibold">
          Retour à l'accueil
        </Link>
      </div>
    )
  }

  // Vérifier le lien parent-enfant
  const { data: link } = await supabase
    .from('parent_student_links')
    .select('student_id')
    .eq('parent_user_id', user.id)
    .eq('student_id', childId)
    .single()

  if (!link) {
    return (
      <div className="p-6 text-center flex flex-col items-center justify-center min-h-[70vh]">
        <span className="material-symbols-outlined text-5xl text-red-300 mb-4">error</span>
        <h2 className="text-xl font-bold text-red-600 mb-2">Accès refusé</h2>
        <p className="text-[var(--color-on-surface-variant)] mb-6">Vous n'avez pas l'autorisation de voir les informations de cet élève.</p>
        <Link href="/parent" className="bg-[var(--color-primary)] text-white px-6 py-2 rounded-full font-semibold">
          Retour à l'accueil
        </Link>
      </div>
    )
  }

  // Récupérer les informations de l'élève
  const { data: student } = await supabase
    .from('students')
    .select('first_name, last_name, class_id, classes(name)')
    .eq('id', childId)
    .single()

  if (!student) {
    return (
      <div className="p-6 text-center">
        <p>Informations de l'élève introuvables.</p>
      </div>
    )
  }

  // Récupérer les notes de l'élève
  const { data: grades } = await supabase
    .from('grades')
    .select('*')
    .eq('student_id', childId)
    .order('created_at', { ascending: false })

  // Grouper les notes par trimestre
  const gradesByTerm = (grades || []).reduce((acc: Record<string, any[]>, grade) => {
    const term = grade.term || 'Trimestre inconnu';
    if (!acc[term]) acc[term] = [];
    acc[term].push(grade);
    return acc;
  }, {});

  // Trier les trimestres (T1, T2, T3)
  const sortedTerms = Object.keys(gradesByTerm).sort();

  return (
    <div className="p-4 space-y-6 pb-20">
      <div className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-sm border border-[var(--color-outline-variant)]">
        <Link href="/parent" className="text-[var(--color-on-surface-variant)]">
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-[var(--color-on-surface)]">Carnet de Notes</h1>
          <p className="text-sm text-[var(--color-primary)] font-medium">
            {student.first_name} {student.last_name} • {(student.classes as any)?.name}
          </p>
        </div>
      </div>

      {sortedTerms.length === 0 ? (
        <div className="bg-white p-8 rounded-xl shadow-sm border border-[var(--color-outline-variant)] text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-[#e8f0fe] rounded-full flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-[32px] text-[#1a73e8]">grading</span>
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
