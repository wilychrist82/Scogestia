import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, ArrowRight, CheckCircle2, AlertCircle, RefreshCw, 
  Sparkles, School, GraduationCap, Users
} from 'lucide-react'

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

  // Classes de l'école
  const { data: classes } = await supabase
    .from('classes')
    .select('id, name')
    .eq('school_id', schoolId)
    .order('name', { ascending: true })

  // Nombre d'élèves total
  const { count: studentCount } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true })
    .eq('school_id', schoolId)

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
          Module Fin d'Année Académique
        </span>
      </div>

      {/* En-tête */}
      <div className="bg-gradient-to-r from-[#070D1E] via-[#0E204E] to-[#0A3273] rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl border border-white/10">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3 py-1 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300">Transition Scolaire</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Promotion Automatique des Élèves
          </h1>
          <p className="text-slate-300 text-sm mt-2 leading-relaxed">
            Automatisez le passage en classe supérieure à la clôture de l'année scolaire : les élèves avec une moyenne ≥ 10/20 sont promus automatiquement vers leur nouvelle classe pour la rentrée suivante.
          </p>
        </div>
      </div>

      {/* Guide des règles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold mb-3 border border-emerald-100">
            <CheckCircle2 size={20} />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Passage Admis (≥ 10/20)</h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            L'élève est automatiquement affecté au niveau supérieur pour la session suivante.
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold mb-3 border border-amber-100">
            <AlertCircle size={20} />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Redoublement (&lt; 10/20)</h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Maintien dans la même classe pour consolider les acquis scolaires.
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold mb-3 border border-blue-100">
            <RefreshCw size={20} />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Historique Préservé</h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Toutes les notes et bulletins des années antérieures restent archivés et consultables.
          </p>
        </div>
      </div>

      {/* Tableau de correspondance des classes */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-bold text-slate-900 text-lg">Classes Actives & Transitions</h2>
            <p className="text-xs text-slate-500 mt-0.5">{studentCount || 0} élèves répartis dans {classes?.length || 0} classes</p>
          </div>
          <Link
            href="/admin/classes"
            className="inline-flex items-center gap-2 bg-slate-900 hover:bg-[#006039] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors"
          >
            <span>Gérer les classes</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {(classes || []).map((cls) => (
            <div key={cls.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-xs">
                  <School size={16} />
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-sm">{cls.name}</p>
                  <p className="text-[11px] text-slate-400">Classe active</p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                Prête
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
