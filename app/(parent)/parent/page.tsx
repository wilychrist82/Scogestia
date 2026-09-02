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
    <div className="flex flex-col min-h-full pb-6">
      {/* Premium Header Greeting */}
      <div className="relative px-6 rounded-b-[3rem] shadow-[0_15px_40px_rgba(124,58,237,0.15)] h-[280px] flex items-end overflow-hidden bg-gradient-to-br from-violet-950 via-slate-900 to-[#006039]">
        {/* Abstract background glows */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -right-[10%] w-[60%] h-[150%] bg-violet-600/20 blur-[100px] rounded-full"></div>
          <div className="absolute bottom-[10%] -left-[10%] w-[50%] h-[100%] bg-emerald-500/20 blur-[100px] rounded-full"></div>
        </div>
        
        {/* Image de la landing page */}
        <div className="absolute right-0 bottom-0 h-full w-[80%] sm:w-[60%] lg:w-[50%] z-10 flex items-end justify-end opacity-95 transition-transform duration-700 hover:scale-[1.02]">
           <img 
             src="/image_landing_page1.png" 
             alt="Espace Parent" 
             className="h-[120%] sm:h-[130%] w-auto object-contain object-right-bottom drop-shadow-2xl translate-y-4 sm:translate-y-6"
           />
        </div>
        
        {/* Overlay dégradé pour adoucir la transition avec les cartes en dessous */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/30 to-transparent rounded-b-[3rem] z-10 pointer-events-none"></div>
      </div>

      <div className="px-5 space-y-5 -mt-6 relative z-20">
        {/* Carte de bienvenue (déplacée en bas pour ne pas cacher l'image) */}
        <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-md border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-[10px] font-semibold uppercase tracking-wider mb-0.5">Bonjour,</p>
            <h1 className="text-lg font-black text-[var(--color-primary)] tracking-tight truncate leading-tight">{displayName}</h1>
          </div>
          <div className="bg-[var(--color-primary-container)]/30 px-3 py-2 rounded-xl text-right shrink-0">
            <span className="material-symbols-outlined text-[14px] text-[var(--color-primary)] block mb-0.5">calendar_today</span>
            <p className="text-[var(--color-primary)] text-[10px] font-bold">
              {format(new Date(), 'EEEE d MMM', { locale: fr })}
            </p>
          </div>
        </div>
        {/* Annonces Récentes (Featured) */}
        {communications && communications.length > 0 && (
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-primary-container)] rounded-bl-full opacity-50 -z-10"></div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-[var(--color-primary)]">campaign</span>
                À la une
              </h2>
              <Link href="/parent/messages" className="text-xs font-semibold text-[var(--color-primary)] bg-[var(--color-primary-container)]/30 px-3 py-1 rounded-full">
                Voir tout
              </Link>
            </div>
            
            <div className="space-y-3">
              {communications.map((comm: any, idx) => (
                <Link key={comm.id} href="/parent/messages" className={`block ${idx !== 0 ? 'pt-3 border-t border-gray-100' : ''}`}>
                  <h3 className="font-bold text-gray-800 text-sm leading-tight">{comm.subject}</h3>
                  <p className="text-xs text-gray-500 line-clamp-2 mt-1">{comm.content === 'Message vocal' ? '🎵 Message vocal reçu' : comm.content}</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Liste des Enfants */}
        <h2 className="text-sm font-extrabold text-gray-500 uppercase tracking-wider px-2 mt-8 mb-2">Mes Enfants</h2>
        
        {children.map((child: any) => (
          <div key={child.id} className="bg-white rounded-[2rem] p-5 shadow-sm border border-gray-100 transition-all hover:shadow-md">
            
            {/* Header Enfant */}
            <div className="flex items-center gap-4 mb-5">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[var(--color-primary)] to-[#20b2aa] text-white flex items-center justify-center text-2xl font-bold shadow-inner">
                {child.first_name[0]}{child.last_name[0]}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-black text-gray-900 leading-tight">{child.first_name}</h3>
                <h4 className="text-sm text-gray-500 font-medium">{child.last_name}</h4>
                <div className="inline-flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-md mt-2">
                  <span className="material-symbols-outlined text-[14px] text-gray-600">school</span>
                  <span className="text-xs font-bold text-gray-700">{child.classes?.name}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-4 gap-3 mb-5">
              <Link href={`/parent/notes?child=${child.id}`} className="flex flex-col items-center justify-center gap-2">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center active:scale-95 transition-transform shadow-sm">
                  <span className="material-symbols-outlined">grading</span>
                </div>
                <span className="text-[10px] font-bold text-gray-600">Notes</span>
              </Link>
              
              <Link href={`/parent/presences?child=${child.id}`} className="flex flex-col items-center justify-center gap-2">
                <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center active:scale-95 transition-transform shadow-sm">
                  <span className="material-symbols-outlined">fact_check</span>
                </div>
                <span className="text-[10px] font-bold text-gray-600">Absences</span>
              </Link>
              
              <Link href={`/parent/devoirs?child=${child.id}`} className="flex flex-col items-center justify-center gap-2">
                <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center active:scale-95 transition-transform shadow-sm">
                  <span className="material-symbols-outlined">assignment</span>
                </div>
                <span className="text-[10px] font-bold text-gray-600">Devoirs</span>
              </Link>
              
              <Link href={`/parent/bulletins?child=${child.id}`} className="flex flex-col items-center justify-center gap-2">
                <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center active:scale-95 transition-transform shadow-sm">
                  <span className="material-symbols-outlined">workspace_premium</span>
                </div>
                <span className="text-[10px] font-bold text-gray-600">Bulletins</span>
              </Link>
            </div>
            


          </div>
        ))}

        {/* Global Finance Card */}
        <div className="mt-4 pb-4">
          <Link href={`/parent/paiements${children && children.length > 0 ? `?child=${(children[0] as any).id}` : ''}`} className="block relative overflow-hidden bg-[#1e293b] rounded-3xl p-6 shadow-xl text-white active:scale-95 transition-transform">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full -z-0"></div>
            <div className="absolute bottom-[-20px] right-4 text-white/5 -z-0">
              <span className="material-symbols-outlined" style={{ fontSize: '120px' }}>account_balance_wallet</span>
            </div>
            
            <div className="relative z-10 flex justify-between items-center">
              <div>
                <p className="text-white/70 text-xs font-bold uppercase tracking-widest mb-1">Caisse</p>
                <h3 className="font-black text-2xl">Finances</h3>
                <p className="text-white/80 text-sm mt-1 max-w-[200px]">Gérez les frais de scolarité de vos enfants en toute simplicité.</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <span className="material-symbols-outlined">arrow_forward</span>
              </div>
            </div>
          </Link>
        </div>

      </div>
    </div>
  )
}

