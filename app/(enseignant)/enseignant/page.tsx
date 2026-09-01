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

  if (!roleData) redirect('/')

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
    <div className="flex flex-col min-h-full bg-gray-50/50 pb-8">
      {/* Hero Header avec Image (Responsive, sans aucun rognage) */}
      <div className="w-full max-w-[1280px] mx-auto">
        <div className="relative w-full shadow-lg lg:rounded-b-[2.5rem] overflow-hidden bg-[var(--color-primary)] flex items-end">
          <img 
            src="/hero-landing.png" 
            alt="Espace Enseignant" 
            className="w-full h-auto object-contain block"
          />
          <div className="absolute inset-0 bg-black/10"></div>
        </div>
      </div>

      <div className="px-4 md:px-8 space-y-6 mt-4 md:mt-8 relative z-20 max-w-[1280px] mx-auto w-full">
        
        {/* Welcome Card Premium */}
        <div className="bg-white/95 backdrop-blur-md p-4 md:p-5 rounded-2xl shadow-md border border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-tr from-[var(--color-primary)] to-[#20b2aa] text-white flex items-center justify-center text-xl md:text-2xl font-bold shadow-inner">
              {initials}
            </div>
            <div>
              <p className="text-gray-500 text-[10px] md:text-xs font-semibold uppercase tracking-wider mb-0.5">Bonjour,</p>
              <h1 className="text-lg md:text-2xl font-black text-gray-900 tracking-tight leading-tight">{roleData.full_name}</h1>
            </div>
          </div>
          <div className="bg-[var(--color-primary-container)]/30 px-4 py-2.5 rounded-xl text-center shrink-0 hidden sm:block">
            <span className="material-symbols-outlined text-[16px] text-[var(--color-primary)] block mb-0.5">calendar_today</span>
            <p className="text-[var(--color-primary)] text-xs font-bold capitalize">
              {format(new Date(), 'EEEE d MMM', { locale: fr })}
            </p>
          </div>
        </div>

        {/* Annonces Récentes */}
        {communications && communications.length > 0 && (
          <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-gray-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-primary-container)] rounded-bl-full opacity-50 -z-10"></div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base md:text-lg font-extrabold text-gray-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-[var(--color-primary)]">campaign</span>
                À la une
              </h2>
              {/* Le lien vers les annonces complètes n'existe pas encore pour les profs, on met # ou on masque */}
              <span className="text-xs font-semibold text-[var(--color-primary)] bg-[var(--color-primary-container)]/30 px-3 py-1 rounded-full">
                Nouveau
              </span>
            </div>
            
            <div className="space-y-4">
              {communications.map((comm: any, idx) => (
                <div key={comm.id} className={`block ${idx !== 0 ? 'pt-4 border-t border-gray-100' : ''}`}>
                  <h3 className="font-bold text-gray-800 text-sm md:text-base leading-tight">{comm.subject}</h3>
                  <p className="text-xs md:text-sm text-gray-500 line-clamp-2 mt-1.5">{comm.content === 'Message vocal' ? '🎵 Message vocal reçu' : comm.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Classes Assignées - Grille Moderne */}
        <h2 className="text-sm font-extrabold text-gray-500 uppercase tracking-wider px-2 mt-8 mb-2">Mes Classes Assignées</h2>

        {(!assignments || assignments.length === 0) ? (
          <div className="bg-white rounded-[2rem] p-8 text-center text-gray-500 shadow-sm border border-gray-100">
             Aucune classe ne vous a été assignée pour le moment.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {assignments.map((assignment: any) => (
              <div key={assignment.id} className="bg-white rounded-[2rem] p-5 shadow-sm border border-gray-100 transition-all hover:shadow-md hover:border-indigo-100 flex flex-col group">
                
                {/* En-tête de la carte */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-[1.25rem] bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-3xl">school</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl md:text-2xl font-black text-gray-900 leading-tight tracking-tight">{assignment.classes?.name}</h3>
                    <div className="inline-flex items-center gap-1.5 bg-indigo-50 px-2.5 py-1 rounded-lg mt-1.5">
                      <span className="material-symbols-outlined text-[14px] text-indigo-600">book</span>
                      <span className="text-xs font-bold text-indigo-700">{assignment.subject_name}</span>
                    </div>
                  </div>
                </div>

                {/* Actions Rapides (Quick Actions) */}
                <div className="grid grid-cols-3 gap-3 mt-auto">
                  <Link 
                    href={`/enseignant/notes?classId=${assignment.class_id}&subject=${encodeURIComponent(assignment.subject_name)}`}
                    className="flex flex-col items-center justify-center gap-2"
                  >
                    <div className="w-full h-14 bg-emerald-50 text-emerald-600 rounded-[1rem] flex items-center justify-center active:scale-95 hover:bg-emerald-100 transition-all shadow-sm">
                      <span className="material-symbols-outlined">edit_square</span>
                    </div>
                    <span className="text-[11px] font-bold text-gray-600 text-center leading-tight">Saisir<br/>Notes</span>
                  </Link>

                  <Link 
                    href={`/enseignant/presences?classId=${assignment.class_id}`}
                    className="flex flex-col items-center justify-center gap-2"
                  >
                    <div className="w-full h-14 bg-blue-50 text-blue-600 rounded-[1rem] flex items-center justify-center active:scale-95 hover:bg-blue-100 transition-all shadow-sm">
                      <span className="material-symbols-outlined">how_to_reg</span>
                    </div>
                    <span className="text-[11px] font-bold text-gray-600 text-center leading-tight">Faire<br/>l'Appel</span>
                  </Link>

                  <Link 
                    href={`/enseignant/devoirs?classId=${assignment.class_id}`}
                    className="flex flex-col items-center justify-center gap-2"
                  >
                    <div className="w-full h-14 bg-orange-50 text-orange-600 rounded-[1rem] flex items-center justify-center active:scale-95 hover:bg-orange-100 transition-all shadow-sm">
                      <span className="material-symbols-outlined">menu_book</span>
                    </div>
                    <span className="text-[11px] font-bold text-gray-600 text-center leading-tight">Cahier<br/>de Texte</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
