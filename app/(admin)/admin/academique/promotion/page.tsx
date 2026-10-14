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

  // 3. Notes réelles enregistrées (primaire et secondaire)
  const [
    { data: rawPrimaryGrades },
    { data: rawSecondaryGrades },
    { data: rawSubjects },
    { data: rawLegacyGrades }
  ] = await Promise.all([
    supabase.from('primary_grades').select('student_id, score, max_score, month_number').eq('school_id', schoolId).not('score', 'is', null),
    supabase.from('secondary_grades').select('student_id, subject_id, term, class_score, comp_score').eq('school_id', schoolId),
    supabase.from('subjects').select('id, name, coefficient').eq('school_id', schoolId),
    supabase.from('grades').select('student_id, score, coefficient').eq('school_id', schoolId).not('score', 'is', null)
  ])

  const subjectsMap = new Map((rawSubjects || []).map(s => [s.id, s]))
  const classesMap = new Map((classes || []).map(c => [c.id, c]))

  const formattedStudents = (rawStudents || []).map(s => {
    const studentClass = classesMap.get(s.class_id)
    const className = studentClass?.name || ''
    const classLevel = studentClass?.level || ''
    const isPrimary = ['cp', 'ce', 'cm', 'ci', 'primaire', 'maternelle', 's1', 's2', 'ps', 'ms', 'gs'].some(k => 
      `${classLevel} ${className}`.toLowerCase().includes(k)
    )
    const isCollege = !isPrimary && ['6eme', '6ème', '5eme', '5ème', '4eme', '4ème', '3eme', '3ème', 'college', 'collège', '6e', '5e', '4e', '3e'].some(k =>
      `${classLevel} ${className}`.toLowerCase().includes(k)
    )

    let average: number | null = null
    let gradeCount = 0

    if (isPrimary) {
      // Primaire : Moyenne pondérée ramenée sur 10
      const pGrades = (rawPrimaryGrades || []).filter(g => g.student_id === s.id)
      gradeCount = pGrades.length
      if (pGrades.length > 0) {
        let totalPts = 0
        let totalMax = 0
        pGrades.forEach(g => {
          totalPts += Number(g.score)
          totalMax += Number(g.max_score || 10)
        })
        if (totalMax > 0) {
          average = Math.round(((totalPts / totalMax) * 10) * 100) / 100
        }
      }
    } else {
      // Secondaire : Collège ou Lycée
      const secGrades = (rawSecondaryGrades || []).filter(g => g.student_id === s.id)
      gradeCount = secGrades.length

      if (secGrades.length > 0) {
        const computeTermAvg = (term: string) => {
          const tGrades = secGrades.filter(g => g.term === term)
          if (tGrades.length === 0) return null
          let totalCoef = 0
          let totalProd = 0
          tGrades.forEach(g => {
            const sub = subjectsMap.get(g.subject_id)
            const cVal = g.class_score !== null ? Number(g.class_score) : NaN
            const compVal = g.comp_score !== null ? Number(g.comp_score) : NaN
            let moy = null
            if (!isNaN(cVal) && !isNaN(compVal)) moy = (cVal + compVal) / 2
            else if (!isNaN(cVal)) moy = cVal
            else if (!isNaN(compVal)) moy = compVal

            if (moy !== null) {
              const coef = isCollege ? 2 : (sub?.coefficient || 2)
              totalCoef += coef
              totalProd += moy * coef
            }
          })
          return totalCoef > 0 ? totalProd / totalCoef : null
        }

        if (isCollege) {
          // Collège : (T1 + T2 + T3) / 3
          const t1 = computeTermAvg('1er_trimestre')
          const t2 = computeTermAvg('2e_trimestre')
          const t3 = computeTermAvg('3e_trimestre')
          const validTerms = [t1, t2, t3].filter((t): t is number => t !== null)
          if (validTerms.length > 0) {
            const sum = (t1 || 0) + (t2 || 0) + (t3 || 0)
            average = Math.round((sum / 3) * 100) / 100
          }
        } else {
          // Lycée : (S1 + S2) / 2
          const s1 = computeTermAvg('1er_semestre')
          const s2 = computeTermAvg('2e_semestre')
          const validTerms = [s1, s2].filter((t): t is number => t !== null)
          if (validTerms.length > 0) {
            const sum = (s1 || 0) + (s2 || 0)
            average = Math.round((sum / 2) * 100) / 100
          }
        }
      }
    }

    // Fallback legacy grades
    if (average === null && rawLegacyGrades) {
      const lGrades = rawLegacyGrades.filter(g => g.student_id === s.id)
      if (lGrades.length > 0) {
        let totalScore = 0, totalCoeff = 0
        lGrades.forEach(g => {
          const coeff = Number(g.coefficient || 1)
          totalScore += Number(g.score) * coeff
          totalCoeff += coeff
        })
        if (totalCoeff > 0) {
          average = Math.round((totalScore / totalCoeff) * 100) / 100
          gradeCount = lGrades.length
        }
      }
    }

    return {
      id: s.id,
      matricule: s.matricule,
      first_name: s.first_name,
      last_name: s.last_name,
      class_id: s.class_id,
      average,
      gradeCount
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
