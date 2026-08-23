import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function ParentBulletinsPage({
  searchParams,
}: {
  searchParams: { child?: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/connexion')

  const childId = searchParams.child

  if (!childId) {
    return (
      <div className="p-6 text-center flex flex-col items-center justify-center min-h-[70vh]">
        <span className="material-symbols-outlined text-5xl text-gray-300 mb-4">person_search</span>
        <h2 className="text-xl font-bold text-[var(--color-on-surface)] mb-2">Élève non spécifié</h2>
        <p className="text-[var(--color-on-surface-variant)] mb-6">Veuillez sélectionner un enfant depuis le tableau de bord pour voir ses bulletins.</p>
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

  // Récupérer toutes les notes de l'élève
  const { data: grades } = await supabase
    .from('grades')
    .select('*')
    .eq('student_id', childId)

  // Organiser et calculer les moyennes par trimestre
  const termData: Record<string, {
    subjects: Record<string, { totalScore: number, totalMax: number, coef: number }>,
    totalSum: number,
    totalCoefSum: number,
    average: number
  }> = {};

  (grades || []).forEach(grade => {
    const term = grade.term || 'Trimestre inconnu';
    if (!termData[term]) {
      termData[term] = { subjects: {}, totalSum: 0, totalCoefSum: 0, average: 0 };
    }

    const subject = grade.subject_name;
    if (!termData[term].subjects[subject]) {
      // Le coefficient de la matière est assumé être le même pour toutes les notes de cette matière.
      termData[term].subjects[subject] = { totalScore: 0, totalMax: 0, coef: grade.coefficient || 1 };
    }

    // Convertir la note sur 20 pour la moyenne
    const noteSur20 = (grade.score / (grade.max_score || 20)) * 20;
    
    // Ajouter à la matière
    termData[term].subjects[subject].totalScore += noteSur20;
    termData[term].subjects[subject].totalMax += 20; // Chaque note compte pour 20 dans le sous-total de la matière
  });

  // Calculer la moyenne de chaque trimestre
  Object.keys(termData).forEach(term => {
    let globalSum = 0;
    let globalCoef = 0;

    Object.keys(termData[term].subjects).forEach(subject => {
      const subjData = termData[term].subjects[subject];
      // Moyenne de la matière sur 20
      const subjAverage = (subjData.totalScore / subjData.totalMax) * 20;
      
      globalSum += subjAverage * subjData.coef;
      globalCoef += subjData.coef;
    });

    termData[term].totalSum = globalSum;
    termData[term].totalCoefSum = globalCoef;
    termData[term].average = globalCoef > 0 ? (globalSum / globalCoef) : 0;
  });

  const sortedTerms = Object.keys(termData).sort();

  return (
    <div className="p-4 space-y-6 pb-20">
      <div className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-sm border border-[var(--color-outline-variant)]">
        <Link href="/parent" className="text-[var(--color-on-surface-variant)]">
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-[var(--color-on-surface)]">Bulletins</h1>
          <p className="text-sm text-[var(--color-primary)] font-medium">
            {student.first_name} {student.last_name} • {(student.classes as any)?.name}
          </p>
        </div>
      </div>

      {sortedTerms.length === 0 ? (
        <div className="bg-white p-8 rounded-xl shadow-sm border border-[var(--color-outline-variant)] text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-[#e8f5e9] rounded-full flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-[32px] text-[#2e7d32]">workspace_premium</span>
          </div>
          <h2 className="text-lg font-bold text-[var(--color-on-surface)] mb-1">Aucun bulletin</h2>
          <p className="text-[var(--color-on-surface-variant)] text-sm">Les notes insuffisantes pour générer un bulletin.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedTerms.map(term => {
            const data = termData[term];
            const avg = data.average;
            const isExcellent = avg >= 15;
            const isGood = avg >= 12 && avg < 15;
            const isPassable = avg >= 10 && avg < 12;
            
            const headerColorClass = isExcellent ? 'bg-green-600' : isGood ? 'bg-blue-600' : isPassable ? 'bg-orange-500' : 'bg-red-600';
            const badgeColorClass = isExcellent ? 'text-green-600 bg-green-50' : isGood ? 'text-blue-600 bg-blue-50' : isPassable ? 'text-orange-600 bg-orange-50' : 'text-red-600 bg-red-50';
            const badgeLabel = isExcellent ? 'Excellent' : isGood ? 'Bien' : isPassable ? 'Passable' : 'Insuffisant';

            return (
              <div key={term} className="bg-white rounded-xl shadow-sm border border-[var(--color-outline-variant)] overflow-hidden flex flex-col">
                <div className={`${headerColorClass} px-5 py-6 text-white text-center relative`}>
                  <h2 className="text-lg font-bold uppercase tracking-wider mb-2 opacity-90">{term}</h2>
                  <div className="text-5xl font-black tracking-tighter drop-shadow-md">
                    {avg.toFixed(2)}<span className="text-2xl font-bold opacity-75">/20</span>
                  </div>
                  <div className="absolute top-4 right-4 bg-white/20 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm border border-white/30">
                    Moyenne Générale
                  </div>
                </div>
                
                <div className="p-5 flex flex-col gap-4">
                  <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <span className="text-gray-500 font-medium text-sm">Appréciation globale</span>
                    <span className={`px-3 py-1 rounded-full font-bold text-sm ${badgeColorClass}`}>
                      {badgeLabel}
                    </span>
                  </div>

                  <div className="mt-2">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Détail par matière</h3>
                    <div className="space-y-3">
                      {Object.keys(data.subjects).map(subject => {
                        const subj = data.subjects[subject];
                        const subjAvg = (subj.totalScore / subj.totalMax) * 20;
                        const subjPercentage = (subjAvg / 20) * 100;
                        
                        return (
                          <div key={subject} className="flex flex-col gap-1">
                            <div className="flex justify-between items-end">
                              <span className="font-bold text-gray-700">{subject}</span>
                              <span className="font-bold text-gray-900">{subjAvg.toFixed(2)}</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${subjAvg >= 10 ? 'bg-green-500' : 'bg-red-500'}`} 
                                style={{ width: `${Math.max(5, subjPercentage)}%` }}
                              ></div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
