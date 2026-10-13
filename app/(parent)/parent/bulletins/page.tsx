import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ResultatsTabs } from '@/components/parent/ResultatsTabs'
import { UserX, ArrowLeft, FileText, Download, Award } from 'lucide-react'

import { resolveStudentId } from '@/lib/parent-utils'
import { ChildSwitchBar } from '@/components/parent/ChildSwitchBar'
import { getCoefficientForSubject, getPrimarySubjectMaxScore } from '@/lib/academic-curriculum'

export const dynamic = 'force-dynamic'

export default async function ParentBulletinsPage({
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
  // On le récupère s'il manque des infos dans selectedChild
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

  // Récupérer les notes de l'élève depuis secondary_grades, primary_grades, grades et published_bulletins
  const [
    { data: secGrades },
    { data: primGrades },
    { data: legacyGrades },
    { data: publishedBulletins }
  ] = await Promise.all([
    supabase
      .from('secondary_grades')
      .select('id, term, class_score, comp_score, max_score, subjects(name, coefficient)')
      .eq('student_id', childId),
    supabase
      .from('primary_grades')
      .select('id, month_number, score, max_score, subjects(name, category)')
      .eq('student_id', childId),
    supabase
      .from('grades')
      .select('*')
      .eq('student_id', childId),
    supabase
      .from('published_bulletins')
      .select('*')
      .eq('student_id', childId)
      .order('created_at', { ascending: false })
  ]);

  const formatTerm = (t: string) => {
    if (t === '1er_trimestre') return '1er Trimestre';
    if (t === '2e_trimestre') return '2e Trimestre';
    if (t === '3e_trimestre') return '3e Trimestre';
    if (t === '1er_semestre') return '1er Semestre';
    if (t === '2e_semestre') return '2e Semestre';
    return (t || '').replace(/_/g, ' ');
  };

  // Organiser et calculer les moyennes par trimestre / période
  const termData: Record<string, {
    subjects: Record<string, { totalScore: number, totalMax: number, coef: number }>,
    totalSum: number,
    totalCoefSum: number,
    average: number
  }> = {};

  const addScore = (termKey: string, subjectName: string, score: number, maxScore: number, coef: number) => {
    if (isNaN(score)) return;
    const term = formatTerm(termKey);
    if (!termData[term]) {
      termData[term] = { subjects: {}, totalSum: 0, totalCoefSum: 0, average: 0 };
    }
    if (!termData[term].subjects[subjectName]) {
      termData[term].subjects[subjectName] = { totalScore: 0, totalMax: 0, coef: coef || 1 };
    }
    const noteSur20 = (score / (maxScore || 20)) * 20;
    termData[term].subjects[subjectName].totalScore += noteSur20;
    termData[term].subjects[subjectName].totalMax += 20;
  };

  secGrades?.forEach((g: any) => {
    const sName = g.subjects?.name || 'Matière';
    const coef = getCoefficientForSubject(sName, (fullStudent.classes as any)?.name, undefined, g.subjects?.coefficient || 2);
    if (g.class_score !== null && g.class_score !== undefined) {
      addScore(g.term, sName, Number(g.class_score), g.max_score || 20, coef);
    }
    if (g.comp_score !== null && g.comp_score !== undefined) {
      addScore(g.term, sName, Number(g.comp_score), g.max_score || 20, coef);
    }
  });

  primGrades?.forEach((g: any) => {
    const sName = g.subjects?.name || 'Discipline';
    const officialMax = getPrimarySubjectMaxScore(sName, (fullStudent.classes as any)?.name, (fullStudent.classes as any)?.level) || g.max_score || 10;
    addScore(`Mois ${g.month_number}`, sName, Number(g.score), officialMax, 1);
  });

  legacyGrades?.forEach((g: any) => {
    const sName = g.subject_name || 'Matière';
    addScore(g.term || 'Trimestre 1', sName, Number(g.score), g.max_score || 20, g.coefficient || 1);
  });

  // Calculer la moyenne pondérée de chaque période
  Object.keys(termData).forEach(term => {
    let globalSum = 0;
    let globalCoef = 0;

    Object.keys(termData[term].subjects).forEach(subject => {
      const subjData = termData[term].subjects[subject];
      const subjAverage = subjData.totalMax > 0 ? (subjData.totalScore / subjData.totalMax) * 20 : 0;
      globalSum += subjAverage * subjData.coef;
      globalCoef += subjData.coef;
    });

    termData[term].totalSum = globalSum;
    termData[term].totalCoefSum = globalCoef;
    termData[term].average = globalCoef > 0 ? (globalSum / globalCoef) : 0;
  });

  const sortedTerms = Object.keys(termData).sort();

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

      {publishedBulletins && publishedBulletins.length > 0 && (
        <div className="bg-white p-5 rounded-xl shadow-sm border border-[var(--color-outline-variant)]">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-red-500" />
            Bulletins Officiels
          </h2>
          <div className="grid gap-3">
            {publishedBulletins.map(pb => (
              <a 
                key={pb.id}
                href={pb.file_url} 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center justify-between p-3 border border-gray-100 bg-gray-50 rounded-lg hover:border-[var(--color-primary)] transition-colors group"
              >
                <div className="flex flex-col">
                  <span className="font-bold text-gray-700 group-hover:text-[var(--color-primary)] transition-colors capitalize">
                    {pb.term_or_month.replace(/_/g, ' ')}
                  </span>
                  <span className="text-xs text-gray-500">Année {pb.academic_year}</span>
                </div>
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-gray-200 shadow-sm text-sm font-semibold text-gray-600 group-hover:text-[var(--color-primary)] transition-colors">
                  <Download className="w-4 h-4" />
                  Ouvrir / Télécharger
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {sortedTerms.length === 0 ? (
        <div className="bg-white p-8 rounded-xl shadow-sm border border-[var(--color-outline-variant)] text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-[#e8f5e9] rounded-full flex items-center justify-center mb-4">
            <Award className="w-8 h-8 text-[#2e7d32]" />
          </div>
          <h2 className="text-lg font-bold text-[var(--color-on-surface)] mb-1">Aucun détail de notes</h2>
          <p className="text-[var(--color-on-surface-variant)] text-sm">Les notes par matière ne sont pas encore disponibles.</p>
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
