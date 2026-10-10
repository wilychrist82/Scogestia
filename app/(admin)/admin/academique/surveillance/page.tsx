import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { 
  GraduationCap, AlertTriangle, ArrowLeft, ChevronRight,
  TrendingDown, CheckCircle2, User, BookOpen, MessageSquare, Phone
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function SurveillancePedagogiquePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: roleData } = await supabase
    .from('user_school_roles')
    .select('school_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  const schoolId = roleData?.school_id
  if (!schoolId) {
    return <div className="p-8 text-center text-red-500 font-medium">Accès refusé.</div>
  }

  // Récupération des notes et élèves pour l'école
  const { data: allGrades } = await supabase
    .from('grades')
    .select(`
      score,
      subject_name,
      term,
      student:students (
        id,
        first_name,
        last_name,
        matricule,
        classes:classes (id, name),
        parents:parents (phone_number, full_name)
      )
    `)
    .not('score', 'is', null)

  // Agréger par élève
  const studentsMap: Record<string, {
    student: any,
    scores: number[],
    weakSubjects: { subject: string, score: number }[]
  }> = {}

  allGrades?.forEach(g => {
    const s = g.student as any
    if (!s || !s.id || g.score === null) return
    if (!studentsMap[s.id]) {
      studentsMap[s.id] = { student: s, scores: [], weakSubjects: [] }
    }
    const numScore = Number(g.score)
    studentsMap[s.id].scores.push(numScore)
    if (numScore < 10) {
      studentsMap[s.id].weakSubjects.push({ subject: g.subject_name, score: numScore })
    }
  })

  const evaluatedStudents = Object.values(studentsMap)
  const totalEvaluated = evaluatedStudents.length

  const allComputed = evaluatedStudents.map(item => {
    const total = item.scores.reduce((a, b) => a + b, 0)
    const avg = item.scores.length > 0 ? total / item.scores.length : 0
    return {
      id: item.student.id,
      firstName: item.student.first_name,
      lastName: item.student.last_name,
      matricule: item.student.matricule,
      className: item.student.classes?.name || 'Sans classe',
      classId: item.student.classes?.id,
      parentPhone: item.student.parents?.phone_number || '',
      parentName: item.student.parents?.full_name || '',
      average: Math.round(avg * 10) / 10,
      notesCount: item.scores.length,
      weakSubjects: item.weakSubjects,
    }
  })

  const lowAverageStudents = allComputed
    .filter(s => s.average < 10 && s.notesCount >= 1)
    .sort((a, b) => a.average - b.average)

  const highAverageStudents = allComputed.filter(s => s.average >= 10)
  const successRate = totalEvaluated > 0 ? Math.round((highAverageStudents.length / totalEvaluated) * 100) : 100

  const schoolAverage = totalEvaluated > 0
    ? Math.round((allComputed.reduce((acc, curr) => acc + curr.average, 0) / totalEvaluated) * 10) / 10
    : 12.5

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 px-4 sm:px-6">
      {/* Navigation retour */}
      <div className="flex items-center justify-between">
        <Link 
          href="/admin" 
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-xs transition-colors"
        >
          <ArrowLeft size={14} /> Retour au tableau de bord
        </Link>
        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
          Année en cours · Surveillance active
        </span>
      </div>

      {/* En-tête */}
      <div className="bg-gradient-to-r from-[#070D1E] via-[#0E204E] to-[#0A3273] rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl border border-white/10">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3 py-1 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-cyan-300">Pôle Pédagogique</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Surveillance des Notes & Détection Précoce
          </h1>
          <p className="text-slate-300 text-sm mt-2 leading-relaxed">
            Identifiez instantanément les élèves dont la moyenne générale est inférieure à 10/20 avant la fin du trimestre pour mettre en place du soutien scolaire personnalisé.
          </p>
        </div>
      </div>

      {/* 4 Compteurs KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Élèves évalués</p>
          <p className="text-2xl font-black text-slate-900 mt-1 tabular-nums">{totalEvaluated}</p>
          <p className="text-[11px] text-slate-400 mt-1">Ayant au moins 1 note</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Moyenne générale</p>
          <p className="text-2xl font-black text-cyan-600 mt-1 tabular-nums">{schoolAverage} <span className="text-sm font-semibold text-slate-400">/ 20</span></p>
          <p className="text-[11px] text-slate-400 mt-1">Sur l'ensemble des matières</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Taux de réussite (≥ 10)</p>
          <p className="text-2xl font-black text-emerald-600 mt-1 tabular-nums">{successRate}%</p>
          <p className="text-[11px] text-slate-400 mt-1">{highAverageStudents.length} élèves au-dessus de 10</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Alertes en difficulté (&lt; 10)</p>
          <p className="text-2xl font-black text-rose-600 mt-1 tabular-nums">{lowAverageStudents.length}</p>
          <p className="text-[11px] text-slate-400 mt-1">Nécessitent un accompagnement</p>
        </div>
      </div>

      {/* Liste des alertes pédagogiques */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
          <div>
            <h2 className="font-bold text-slate-900 text-lg flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
              Élèves avec moyenne inférieure à 10/20
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Classement par urgence pédagogique (moyennes les plus faibles en premier)
            </p>
          </div>
          <Link
            href="/admin/academique/bulletins"
            className="inline-flex items-center gap-2 bg-[#006039] hover:bg-[#004d2e] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition-colors"
          >
            <BookOpen size={14} /> Voir tous les bulletins
          </Link>
        </div>

        <div className="divide-y divide-slate-100">
          {lowAverageStudents.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4 border border-emerald-100 shadow-xs">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="text-base font-bold text-slate-900">Excellence pédagogique globale 🎉</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                Félicitations ! Aucun élève évalué n'a de moyenne générale inférieure à 10/20 actuellement dans l'établissement.
              </p>
            </div>
          ) : (
            lowAverageStudents.map((s, idx) => (
              <div key={s.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-sm shrink-0 border border-rose-100 mt-0.5">
                    {idx + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <Link 
                        href={`/admin/eleves/${s.id}`} 
                        className="font-bold text-slate-900 hover:text-[#006039] text-base transition-colors"
                      >
                        {s.lastName} {s.firstName}
                      </Link>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        {s.className}
                      </span>
                      {s.matricule && (
                        <span className="text-[11px] font-mono text-slate-400">
                          #{s.matricule}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                      <span>{s.notesCount} évaluation{s.notesCount > 1 ? 's' : ''} enregistrée{s.notesCount > 1 ? 's' : ''}</span>
                      {s.parentPhone && (
                        <span className="flex items-center gap-1 text-slate-600">
                          <Phone size={11} className="text-emerald-600" /> Parent : {s.parentPhone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 self-end md:self-center">
                  <div className="text-right">
                    <p className="text-xs text-slate-400 font-medium">Moyenne générale</p>
                    <span className="inline-block px-3 py-1 rounded-xl font-black text-sm bg-rose-50 text-rose-600 border border-rose-200 tabular-nums">
                      {s.average} / 20
                    </span>
                  </div>

                  <Link
                    href={`/admin/eleves/${s.id}`}
                    className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-[#006039] text-white text-xs font-bold px-3.5 py-2.5 rounded-xl transition-colors shadow-xs"
                  >
                    <span>Dossier</span>
                    <ChevronRight size={14} />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
