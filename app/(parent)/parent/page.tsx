import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export const dynamic = 'force-dynamic'

export default async function ParentDashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: roleData } = await supabase
    .from('user_school_roles')
    .select('full_name, school_id')
    .eq('user_id', user.id)
    .eq('role', 'parent')
    .limit(1).maybeSingle()

  if (!roleData) return null

  // Récupérer les enfants liés
  const { data: links } = await supabase
    .from('parent_student_links')
    .select(`
      student_id,
      students (
        id,
        first_name,
        last_name,
        class_id,
        classes (name)
      )
    `)
    .eq('parent_user_id', user.id)

  const children = links?.map(l => l.students).filter(Boolean) || []

  // Déterminer le nom à afficher
  let displayName = roleData.full_name
  if (displayName.toLowerCase() === 'parent' && children.length > 0) {
    displayName = `Parent de ${children[0].first_name}`
  }

  // Récupérer les communications récentes
  const { data: communications } = await supabase
    .from('communications')
    .select('*')
    .eq('school_id', roleData.school_id)
    .order('created_at', { ascending: false })
    .limit(2)

  if (children.length === 0) {
    return (
      <div className="p-6 text-center text-[var(--color-on-surface-variant)] flex flex-col items-center justify-center h-full min-h-[60vh]">
        <div className="w-24 h-24 bg-[var(--color-primary-container)] rounded-full flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-[48px] text-[var(--color-primary)]">child_care</span>
        </div>
        <h2 className="text-2xl font-bold text-[var(--color-on-surface)] mb-3">Bienvenue sur Scogestia</h2>
        <p className="text-base text-gray-500 max-w-sm leading-relaxed">
          Votre compte est actif, mais aucun enfant n'est encore lié. Veuillez contacter l'administration de l'école.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-[1400px] mx-auto p-4 md:p-6 lg:p-8 w-full">
      {/* Ligne 1: Hero + Annonces */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-6 mb-6">
        
        {/* Carte Héro (Bannière) */}
        <div className="-mx-4 -mt-4 sm:mx-0 sm:mt-0 lg:col-span-2 relative overflow-hidden bg-gradient-to-br from-[var(--color-primary)] via-violet-950 to-slate-900 rounded-b-[2rem] sm:rounded-[2rem] p-5 sm:p-8 pt-6 min-h-[220px] sm:min-h-[280px] shadow-[0_15px_40px_rgba(124,58,237,0.15)] flex flex-col justify-start group">
          <div className="relative z-20 w-[70%] sm:w-3/5">
            <p className="text-white/70 text-[9px] sm:text-xs font-bold uppercase tracking-widest mb-1.5 sm:mb-2">Bonjour,</p>
            <h1 className="text-lg sm:text-4xl font-black text-white leading-tight mb-2 sm:mb-3 line-clamp-2">{displayName}</h1>
            <p className="text-white/80 text-xs sm:text-base leading-relaxed max-w-md hidden sm:block">Bienvenue sur votre portail parent. Retrouvez ici toutes les informations essentielles de la scolarité de vos enfants.</p>
            
            <div className="mt-2 sm:mt-6 inline-flex items-center gap-1.5 sm:gap-2 bg-white/10 backdrop-blur-md px-2.5 py-1 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl border border-white/10 shadow-inner">
              <span className="material-symbols-outlined text-emerald-400 text-[14px] sm:text-[18px]">calendar_today</span>
              <span className="text-white text-[9px] sm:text-sm font-semibold capitalize">{format(new Date(), 'EEEE d MMMM', { locale: fr })}</span>
            </div>
          </div>
          
          <div className="absolute right-0 bottom-0 w-[55%] sm:w-[45%] h-[90%] sm:h-[110%] z-10 transition-transform duration-700 group-hover:scale-105 origin-bottom-right">
            <img src="/image_landing_page1.png" alt="Espace Parent" className="w-full h-full object-contain object-bottom drop-shadow-2xl" />
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
            <Link href="/parent/messages" className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-primary)] bg-[var(--color-primary-container)]/50 px-3 py-1.5 rounded-full hover:bg-[var(--color-primary-container)] transition-colors">
              Voir tout
            </Link>
          </div>
          
          <div className="flex-1 flex flex-col gap-4">
            {communications && communications.length > 0 ? communications.map((comm: any, idx) => (
              <Link key={comm.id} href="/parent/messages" className={`block group/item ${idx !== 0 ? 'pt-4 border-t border-gray-50' : ''}`}>
                <h3 className="font-bold text-gray-800 text-sm leading-tight group-hover/item:text-[var(--color-primary)] transition-colors">{comm.subject}</h3>
                <p className="text-xs text-gray-500 line-clamp-2 mt-1.5">{comm.content === 'Message vocal' ? '🎵 Message vocal reçu' : comm.content}</p>
              </Link>
            )) : (
              <div className="flex-1 flex items-center justify-center text-sm text-gray-400 font-medium">Aucune annonce récente</div>
            )}
          </div>
        </div>
      </div>

      {/* Ligne 2: Dossiers Scolaires & Caisse */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-6">
        
        {/* Enfants */}
        <div className="lg:col-span-8 space-y-4 sm:space-y-5">
          <h2 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest px-2">Dossiers Scolaires</h2>
          
          {children.map((child: any) => (
            <div key={child.id} className="bg-white/80 backdrop-blur-md rounded-[2rem] p-5 sm:p-6 shadow-sm border border-gray-100 transition-all hover:shadow-md hover:border-blue-100/50 flex flex-col sm:flex-row gap-5 sm:gap-6 group/child">
              
              <div className="flex items-center gap-4 sm:w-[35%] sm:border-r border-gray-100 sm:pr-4">
                 <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-[1.25rem] bg-gradient-to-tr from-[var(--color-primary)] to-[#20b2aa] text-white flex items-center justify-center text-xl sm:text-2xl font-bold shadow-inner flex-shrink-0 group-hover/child:scale-105 transition-transform duration-300">
                   {child.first_name[0]}{child.last_name[0]}
                 </div>
                 <div className="min-w-0">
                   <h3 className="text-lg sm:text-xl font-black text-gray-900 leading-tight truncate">{child.first_name}</h3>
                   <h4 className="text-xs sm:text-sm text-gray-500 font-medium truncate">{child.last_name}</h4>
                   <div className="inline-flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-lg mt-2 border border-gray-100">
                     <span className="material-symbols-outlined text-[14px] text-gray-500">school</span>
                     <span className="text-[11px] font-bold text-gray-700">{child.classes?.name}</span>
                   </div>
                 </div>
              </div>

              <div className="flex-1 grid grid-cols-4 gap-2 sm:gap-3">
                <Link href={`/parent/notes?child=${child.id}`} className="flex flex-col items-center justify-center gap-2 group/action">
                  <div className="w-full aspect-square max-h-[70px] bg-blue-50/80 text-blue-600 rounded-[1rem] sm:rounded-[1.25rem] flex items-center justify-center active:scale-90 transition-all duration-300 shadow-sm border border-blue-100/50 group-hover/action:bg-blue-600 group-hover/action:text-white group-hover/action:shadow-blue-200">
                    <span className="material-symbols-outlined text-[24px]">grading</span>
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-bold text-gray-600 group-hover/action:text-blue-600 transition-colors">Notes</span>
                </Link>
                <Link href={`/parent/presences?child=${child.id}`} className="flex flex-col items-center justify-center gap-2 group/action">
                  <div className="w-full aspect-square max-h-[70px] bg-orange-50/80 text-orange-500 rounded-[1rem] sm:rounded-[1.25rem] flex items-center justify-center active:scale-90 transition-all duration-300 shadow-sm border border-orange-100/50 group-hover/action:bg-orange-500 group-hover/action:text-white group-hover/action:shadow-orange-200">
                    <span className="material-symbols-outlined text-[24px]">fact_check</span>
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-bold text-gray-600 group-hover/action:text-orange-500 transition-colors">Absences</span>
                </Link>
                <Link href={`/parent/devoirs?child=${child.id}`} className="flex flex-col items-center justify-center gap-2 group/action">
                  <div className="w-full aspect-square max-h-[70px] bg-purple-50/80 text-purple-600 rounded-[1rem] sm:rounded-[1.25rem] flex items-center justify-center active:scale-90 transition-all duration-300 shadow-sm border border-purple-100/50 group-hover/action:bg-purple-600 group-hover/action:text-white group-hover/action:shadow-purple-200">
                    <span className="material-symbols-outlined text-[24px]">assignment</span>
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-bold text-gray-600 group-hover/action:text-purple-600 transition-colors">Devoirs</span>
                </Link>
                <Link href={`/parent/bulletins?child=${child.id}`} className="flex flex-col items-center justify-center gap-2 group/action">
                  <div className="w-full aspect-square max-h-[70px] bg-emerald-50/80 text-emerald-600 rounded-[1rem] sm:rounded-[1.25rem] flex items-center justify-center active:scale-90 transition-all duration-300 shadow-sm border border-emerald-100/50 group-hover/action:bg-emerald-600 group-hover/action:text-white group-hover/action:shadow-emerald-200">
                    <span className="material-symbols-outlined text-[24px]">workspace_premium</span>
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-bold text-gray-600 group-hover/action:text-emerald-600 transition-colors">Bulletins</span>
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Finance */}
        <div className="lg:col-span-4 space-y-4 sm:space-y-5">
          <h2 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest px-2">Caisse</h2>
          <Link href={`/parent/paiements${children && children.length > 0 ? `?child=${(children[0] as any).id}` : ''}`} className="block relative overflow-hidden bg-gradient-to-br from-[#1e293b] to-[#0f172a] rounded-[2rem] p-6 sm:p-8 shadow-xl text-white hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 border border-slate-700/50 group min-h-[180px] lg:min-h-[200px] flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 rounded-bl-[100px] -z-0 group-hover:scale-125 transition-transform duration-700"></div>
            <div className="absolute bottom-[-30px] right-[-10px] text-emerald-400/5 -z-0 group-hover:rotate-[-10deg] group-hover:scale-110 transition-transform duration-500">
              <span className="material-symbols-outlined" style={{ fontSize: '160px' }}>account_balance_wallet</span>
            </div>
            
            <div className="relative z-10 flex justify-between items-start">
              <div className="bg-white/10 backdrop-blur-sm p-3 rounded-2xl border border-white/10 shadow-inner">
                <span className="material-symbols-outlined text-emerald-400 text-[28px]">payments</span>
              </div>
              <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm group-hover:bg-emerald-500 group-hover:text-white transition-colors text-white/70">
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </div>
            </div>
            
            <div className="relative z-10 mt-6">
              <h3 className="font-black text-2xl sm:text-3xl tracking-tight mb-2">Finances</h3>
              <p className="text-slate-300 text-sm leading-relaxed max-w-[220px]">Frais de scolarité, cantine et historique de paiements.</p>
            </div>
          </Link>
        </div>
        
      </div>
    </div>
  )
}

