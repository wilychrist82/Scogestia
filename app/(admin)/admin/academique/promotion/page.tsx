import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react'
import { PromotionManager } from '@/components/admin/academique/PromotionManager'
import { sortClasses } from '@/lib/classes'

export const dynamic = 'force-dynamic'

export default async function PromotionFinAnneePage() {
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

  // 1. Classes de l'établissement
  const { data: rawClasses } = await supabase
    .from('classes')
    .select('id, name, level')
    .eq('school_id', schoolId)

  const classes = sortClasses(rawClasses || [])

  // 2. Élèves de l'établissement
  const { data: rawStudents } = await supabase
    .from('students')
    .select('id, matricule, first_name, last_name, class_id')
    .eq('school_id', schoolId)
    .order('last_name', { ascending: true })

  // 3. Notes réelles enregistrées pour calculer les moyennes annuelles
  const { data: rawGrades } = await supabase
    .from('grades')
    .select('student_id, score, coefficient')
    .eq('school_id', schoolId)
    .not('score', 'is', null)

  // Calcul des moyennes par élève
  const studentScoresMap: Record<string, { totalScore: number; totalCoeff: number; count: number }> = {}
  rawGrades?.forEach(g => {
    if (!g.student_id || g.score === null) return
    const coeff = Number(g.coefficient || 1)
    const score = Number(g.score)

    if (!studentScoresMap[g.student_id]) {
      studentScoresMap[g.student_id] = { totalScore: 0, totalCoeff: 0, count: 0 }
    }
    studentScoresMap[g.student_id].totalScore += score * coeff
    studentScoresMap[g.student_id].totalCoeff += coeff
    studentScoresMap[g.student_id].count += 1
  })

  const formattedStudents = (rawStudents || []).map(s => {
    const gradeData = studentScoresMap[s.id]
    let average: number | null = null
    if (gradeData && gradeData.totalCoeff > 0) {
      average = Math.round((gradeData.totalScore / gradeData.totalCoeff) * 100) / 100
    }
    return {
      id: s.id,
      matricule: s.matricule,
      first_name: s.first_name,
      last_name: s.last_name,
      class_id: s.class_id,
      average,
      gradeCount: gradeData?.count || 0
    }
  })

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
        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
          Module Fin d&apos;Année Académique
        </span>
      </div>

      {/* En-tête Hero */}
      <div className="bg-gradient-to-r from-[#070D1E] via-[#0E204E] to-[#0A3273] rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl border border-white/10">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3 py-1 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300">Transition & Réinscription Scolaire</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Promotion et Transfert des Élèves
          </h1>
          <p className="text-slate-300 text-sm mt-2 leading-relaxed">
            Passez vos élèves en classe supérieure pour la nouvelle rentrée scolaire sans avoir à recréer de fichiers Excel. Cochez les élèves admis sur la base de leur moyenne annuelle (≥ 10/20) ou réajustez manuellement avant de valider le transfert en un clic.
          </p>
        </div>
      </div>

      {/* Règles et Explications */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold mb-3 border border-emerald-100">
            <CheckCircle2 size={20} />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Passage Admis (≥ 10/20)</h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Les élèves ayant obtenu la moyenne sont automatiquement pré-cochés pour passer dans la classe supérieure.
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold mb-3 border border-amber-100">
            <AlertCircle size={20} />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Redoublants (&lt; 10/20)</h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Les élèves sans la moyenne sont décochés par défaut et restent dans leur classe d&apos;origine, sauf décision contraire de la direction.
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold mb-3 border border-blue-100">
            <RefreshCw size={20} />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Historique 100% Préservé</h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Le matricule, les bulletins et les notes des trimestres antérieurs restent intacts dans les archives de l&apos;établissement.
          </p>
        </div>
      </div>

      {/* Module interactif de Promotion */}
      <PromotionManager classes={classes} students={formattedStudents} />
    </div>
  )
}
