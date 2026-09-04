import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export const dynamic = 'force-dynamic'

export default async function EnseignantDashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: roleData } = await supabase
    .from('user_school_roles')
    .select('full_name, school_id')
    .eq('user_id', user.id)
    .eq('role', 'enseignant')
    .limit(1).maybeSingle()

  if (!roleData) return null

  // Générer les initiales pour l'avatar
  const getInitials = (name: string) => {
    if (!name) return 'EN'
    const parts = name.trim().split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }
  const initials = getInitials(roleData.full_name)

  // Récupérer les classes/matières assignées
  const { data: assignments } = await supabase
    .from('teacher_class_subjects')
    .select(`
      id,
      subject_name,
      class_id,
      classes (
        name
      )
    `)
    .eq('teacher_id', user.id)

  // Récupérer les annonces pour l'enseignant (RLS filtre pour lui)
  const { data: communications } = await supabase
    .from('communications')
    .select('*')
    .eq('school_id', roleData.school_id)
    .order('created_at', { ascending: false })
    .limit(2)

  return (
    <div className="max-w-[1400px] mx-auto p-4 md:p-6 lg:p-8 w-full">
      {/* Ligne 1: Hero + Annonces */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-6 mb-6">
        
        {/* Carte Héro (Bannière) */}
        <div className="lg:col-span-2 relative overflow-hidden bg-gradient-to-br from-slate-900 via-violet-950 to-[#006039] rounded-[2rem] p-5 sm:p-8 min-h-[200px] sm:min-h-[280px] shadow-[0_15px_40px_rgba(124,58,237,0.15)] flex flex-col justify-start group">
          <div className="relative z-20 w-[70%] sm:w-3/5">
            <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2">
               <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white font-bold shadow-inner border border-white/10 text-xs sm:text-base">
                 {initials}
               </div>
               <p className="text-white/80 text-[9px] sm:text-xs font-bold uppercase tracking-widest">Bonjour,</p>
            </div>
            
            <h1 className="text-lg sm:text-3xl font-black text-white leading-tight mb-2 sm:mb-3 line-clamp-2">{roleData.full_name}</h1>
            <p className="text-white/80 text-xs sm:text-base leading-relaxed max-w-md hidden sm:block">Bienvenue sur votre espace enseignant. Gérez vos classes, saisissez vos notes et effectuez l'appel facilement.</p>
            
            <div className="mt-2 sm:mt-6 inline-flex items-center gap-1.5 sm:gap-2 bg-white/10 backdrop-blur-md px-2.5 py-1 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl border border-white/10 shadow-inner">
              <span className="material-symbols-outlined text-emerald-400 text-[14px] sm:text-[18px]">calendar_today</span>
              <span className="text-white text-[9px] sm:text-sm font-semibold capitalize">{format(new Date(), 'EEEE d MMMM', { locale: fr })}</span>
            </div>
          </div>
          
          <div className="absolute right-0 bottom-0 w-[55%] sm:w-[45%] h-[90%] sm:h-[110%] z-10 transition-transform duration-700 group-hover:scale-105 origin-bottom-right">
            <img src="/image_landing_page1.png" alt="Espace Enseignant" className="w-full h-full object-contain object-bottom drop-shadow-2xl" />
          </div>
          
          <div className="absolute -top-[20%] -right-[10%] w-[60%] h-[150%] bg-violet-600/30 blur-[80px] rounded-full pointer-events-none"></div>
          <div className="absolute bottom-[10%] -left-[10%] w-[50%] h-[100%] bg-emerald-500/20 blur-[100px] rounded-full pointer-events-none"></div>
        </div>

        {/* Carte Annonces (À la une) */}
        <div className="lg:col-span-1 bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 flex flex-col relative overflow-hidden group hover:shadow-md transition-shadow min-h-[220px]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-primary-container)] rounded-bl-full opacity-30 -z-10 group-hover:scale-110 transition-transform duration-500"></div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-[var(--color-primary)]">campaign</span>
              À la une
            </h2>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-primary)] bg-[var(--color-primary-container)]/50 px-3 py-1.5 rounded-full">
              Nouveau
            </span>
          </div>
          
          <div className="flex-1 flex flex-col gap-4">
            {communications && communications.length > 0 ? communications.map((comm: any, idx) => (
              <div key={comm.id} className={`block group/item ${idx !== 0 ? 'pt-4 border-t border-gray-50' : ''}`}>
                <h3 className="font-bold text-gray-800 text-sm leading-tight group-hover/item:text-[var(--color-primary)] transition-colors">{comm.subject}</h3>
                <p className="text-xs text-gray-500 line-clamp-2 mt-1.5">{comm.content === 'Message vocal' ? '🎵 Message vocal reçu' : comm.content}</p>
              </div>
            )) : (
              <div className="flex-1 flex items-center justify-center text-sm text-gray-400 font-medium">Aucune annonce récente</div>
            )}
          </div>
        </div>
      </div>

      {/* Ligne 2: Classes Assignées */}
      <h2 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest px-2 mb-4 sm:mb-5">Mes Classes Assignées</h2>

      {(!assignments || assignments.length === 0) ? (
        <div className="bg-white rounded-[2rem] p-8 sm:p-12 text-center text-gray-500 shadow-sm border border-gray-100 flex flex-col items-center justify-center min-h-[200px]">
           <span className="material-symbols-outlined text-[48px] text-gray-300 mb-4">school</span>
           <p className="text-base font-medium">Aucune classe ne vous a été assignée pour le moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-6">
          {assignments.map((assignment: any) => (
            <div key={assignment.id} className="bg-white/80 backdrop-blur-md rounded-[2rem] p-5 sm:p-6 shadow-sm border border-gray-100 transition-all hover:shadow-md hover:border-indigo-100/50 flex flex-col group/class">
              
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-[1.25rem] bg-indigo-50/80 text-indigo-600 flex items-center justify-center shadow-sm group-hover/class:scale-105 group-hover/class:bg-indigo-100 transition-all duration-300 flex-shrink-0">
                  <span className="material-symbols-outlined text-3xl">school</span>
                </div>
                <div className="min-w-0">
                  <h3 className="text-xl sm:text-2xl font-black text-gray-900 leading-tight tracking-tight truncate">{assignment.classes?.name}</h3>
                  <div className="inline-flex items-center gap-1.5 bg-indigo-50/80 px-2.5 py-1 rounded-lg mt-1.5 border border-indigo-100/50">
                    <span className="material-symbols-outlined text-[14px] text-indigo-600">book</span>
                    <span className="text-[11px] font-bold text-indigo-700 truncate">{assignment.subject_name}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-auto">
                <Link href={`/enseignant/notes?classId=${assignment.class_id}&subject=${encodeURIComponent(assignment.subject_name)}`} className="flex flex-col items-center justify-center gap-2 group/action">
                  <div className="w-full aspect-square max-h-[64px] bg-emerald-50/80 text-emerald-600 rounded-[1rem] flex items-center justify-center active:scale-90 hover:bg-emerald-600 hover:text-white transition-all duration-300 shadow-sm border border-emerald-100/50 group-hover/action:shadow-emerald-200">
                    <span className="material-symbols-outlined text-[22px]">edit_square</span>
                  </div>
                  <span className="text-[10px] font-bold text-gray-600 text-center leading-tight group-hover/action:text-emerald-600 transition-colors">Saisir<br/>Notes</span>
                </Link>

                <Link href={`/enseignant/presences?classId=${assignment.class_id}`} className="flex flex-col items-center justify-center gap-2 group/action">
                  <div className="w-full aspect-square max-h-[64px] bg-blue-50/80 text-blue-600 rounded-[1rem] flex items-center justify-center active:scale-90 hover:bg-blue-600 hover:text-white transition-all duration-300 shadow-sm border border-blue-100/50 group-hover/action:shadow-blue-200">
                    <span className="material-symbols-outlined text-[22px]">how_to_reg</span>
                  </div>
                  <span className="text-[10px] font-bold text-gray-600 text-center leading-tight group-hover/action:text-blue-600 transition-colors">Faire<br/>Appel</span>
                </Link>

                <Link href={`/enseignant/devoirs?classId=${assignment.class_id}`} className="flex flex-col items-center justify-center gap-2 group/action">
                  <div className="w-full aspect-square max-h-[64px] bg-orange-50/80 text-orange-600 rounded-[1rem] flex items-center justify-center active:scale-90 hover:bg-orange-500 hover:text-white transition-all duration-300 shadow-sm border border-orange-100/50 group-hover/action:shadow-orange-200">
                    <span className="material-symbols-outlined text-[22px]">menu_book</span>
                  </div>
                  <span className="text-[10px] font-bold text-gray-600 text-center leading-tight group-hover/action:text-orange-500 transition-colors">Cahier<br/>Texte</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
