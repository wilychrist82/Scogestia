import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { format, startOfWeek, endOfWeek } from 'date-fns'
import { fr } from 'date-fns/locale'

export const dynamic = 'force-dynamic'

// Palette de couleurs par matière
const subjectColors: Record<string, { bg: string; text: string; light: string; icon: string }> = {
  default:      { bg: 'from-indigo-600 to-indigo-900',  text: 'text-indigo-100', light: 'bg-indigo-50 text-indigo-700 border-indigo-100', icon: 'book' },
  math:         { bg: 'from-blue-600 to-blue-900',      text: 'text-blue-100',   light: 'bg-blue-50 text-blue-700 border-blue-100',       icon: 'calculate' },
  français:     { bg: 'from-rose-600 to-rose-900',      text: 'text-rose-100',   light: 'bg-rose-50 text-rose-700 border-rose-100',         icon: 'menu_book' },
  histoire:     { bg: 'from-amber-600 to-amber-900',    text: 'text-amber-100',  light: 'bg-amber-50 text-amber-700 border-amber-100',     icon: 'history_edu' },
  sciences:     { bg: 'from-emerald-600 to-emerald-900',text: 'text-emerald-100',light: 'bg-emerald-50 text-emerald-700 border-emerald-100',icon: 'science' },
  anglais:      { bg: 'from-sky-600 to-sky-900',        text: 'text-sky-100',    light: 'bg-sky-50 text-sky-700 border-sky-100',           icon: 'language' },
  sport:        { bg: 'from-orange-500 to-orange-900',  text: 'text-orange-100', light: 'bg-orange-50 text-orange-700 border-orange-100',  icon: 'sports_soccer' },
}

function getSubjectStyle(name: string) {
  const lower = name?.toLowerCase() || ''
  if (lower.includes('math')) return subjectColors.math
  if (lower.includes('franç') || lower.includes('franc')) return subjectColors.français
  if (lower.includes('histoir') || lower.includes('géo')) return subjectColors.histoire
  if (lower.includes('scien') || lower.includes('physiq') || lower.includes('bio')) return subjectColors.sciences
  if (lower.includes('angl')) return subjectColors.anglais
  if (lower.includes('sport') || lower.includes('eps')) return subjectColors.sport
  return subjectColors.default
}

function getInitials(name: string) {
  if (!name) return 'EN'
  const parts = name.trim().split(' ')
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.substring(0, 2).toUpperCase()
}

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

  const initials = getInitials(roleData.full_name)

  // Classes/matières assignées
  const { data: assignments } = await supabase
    .from('teacher_class_subjects')
    .select('id, subject_name, class_id, classes(name)')
    .eq('teacher_id', user.id)

  // Devoirs publiés par cet enseignant (total)
  const { count: devoirsCount } = await supabase
    .from('homeworks')
    .select('*', { count: 'exact', head: true })
    .eq('teacher_id', user.id)

  // Devoirs publiés cette semaine
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString()
  const weekEnd   = endOfWeek(new Date(),   { weekStartsOn: 1 }).toISOString()
  const { count: devoirsSemaine } = await supabase
    .from('homeworks')
    .select('*', { count: 'exact', head: true })
    .eq('teacher_id', user.id)
    .gte('created_at', weekStart)
    .lte('created_at', weekEnd)

  // Absences saisies aujourd'hui par cet enseignant
  const today = new Date().toISOString().split('T')[0]
  const { count: absencesCount } = await supabase
    .from('attendance')
    .select('*', { count: 'exact', head: true })
    .eq('school_id', roleData.school_id)
    .eq('date', today)
    .eq('status', 'absent')

  // Dernières communications (annonces de l'admin)
  const { data: communications } = await supabase
    .from('communications')
    .select('*')
    .eq('school_id', roleData.school_id)
    .order('created_at', { ascending: false })
    .limit(3)

  // Devoirs récents publiés
  const { data: recentDevoirs } = await supabase
    .from('homeworks')
    .select('id, title, due_date, class_id, classes(name)')
    .eq('teacher_id', user.id)
    .order('created_at', { ascending: false })
    .limit(4)

  const classCount = [...new Set(assignments?.map(a => a.class_id) || [])].length
  const todayLabel = format(new Date(), "EEEE d MMMM", { locale: fr })

  return (
    <div className="max-w-[1400px] mx-auto p-4 md:p-6 lg:p-8 w-full space-y-6">

      {/* ── HERO IDENTITÉ ENSEIGNANT ── */}
      <div className="relative overflow-hidden rounded-2xl bg-[#0b0f19] min-h-[160px] flex flex-col sm:flex-row items-center sm:items-stretch shadow-2xl border border-white/5">
        {/* Blobs */}
        <div className="absolute -top-16 -left-16 w-72 h-72 bg-violet-600/20 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute -bottom-10 right-10 w-56 h-56 bg-emerald-600/15 rounded-full blur-[80px] pointer-events-none" />

        {/* Gauche : identité */}
        <div className="relative z-10 flex items-center gap-5 p-6 sm:p-8 flex-1">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-700 flex items-center justify-center text-white font-black text-2xl sm:text-3xl shadow-xl flex-shrink-0 border-2 border-white/10">
            {initials}
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-violet-400 mb-1">Espace Enseignant</p>
            <h1 className="text-xl sm:text-2xl font-black text-white leading-tight">{roleData.full_name}</h1>
            <div className="flex items-center gap-2 mt-2">
              <span className="material-symbols-outlined text-emerald-400 text-[16px]">calendar_today</span>
              <span className="text-white/60 text-sm font-semibold capitalize">{todayLabel}</span>
            </div>
          </div>
        </div>

        {/* Droite : métriques semaine */}
        <div className="relative z-10 flex items-center gap-3 p-6 sm:p-8 flex-wrap sm:border-l border-white/5">
          <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-center min-w-[80px]">
            <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider mb-1">Classes</p>
            <p className="text-2xl font-black text-white">{classCount}</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-center min-w-[80px]">
            <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider mb-1">Devoirs</p>
            <p className="text-2xl font-black text-white">{devoirsCount || 0}</p>
          </div>
          <div className="bg-violet-500/20 border border-violet-500/30 rounded-xl px-4 py-3 text-center min-w-[80px]">
            <p className="text-[10px] text-violet-300 font-bold uppercase tracking-wider mb-1">Cette sem.</p>
            <p className="text-2xl font-black text-violet-300">{devoirsSemaine || 0}</p>
          </div>
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 text-center min-w-[80px]">
            <p className="text-[10px] text-rose-300 font-bold uppercase tracking-wider mb-1">Absences</p>
            <p className="text-2xl font-black text-rose-300">{absencesCount || 0}</p>
          </div>
        </div>
      </div>

      {/* ── CONTENU PRINCIPAL ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── CLASSES ASSIGNÉES (2/3) ── */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-[var(--color-on-surface)] flex items-center gap-2">
              <span className="w-1 h-5 bg-violet-500 rounded-full inline-block" />
              Mes Classes & Matières
            </h2>
            <span className="text-xs font-bold text-[var(--color-on-surface-variant)] bg-[var(--color-surface-container-low)] px-3 py-1 rounded-full">
              {assignments?.length || 0} assignation{(assignments?.length || 0) > 1 ? 's' : ''}
            </span>
          </div>

          {(!assignments || assignments.length === 0) ? (
            <div className="rounded-2xl border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] p-12 text-center flex flex-col items-center">
              <span className="material-symbols-outlined text-[48px] text-[var(--color-on-surface-variant)] opacity-30 mb-4">school</span>
              <p className="text-base font-bold text-[var(--color-on-surface)]">Aucune classe assignée</p>
              <p className="text-sm text-[var(--color-on-surface-variant)] mt-1">Contactez l'administration pour être affecté à des classes.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {assignments.map((assignment: any) => {
                const style = getSubjectStyle(assignment.subject_name)
                return (
                  <div key={assignment.id} className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${style.bg} p-5 shadow-lg flex flex-col gap-4 group hover:-translate-y-1 transition-transform duration-300`}>
                    {/* Blob décoratif */}
                    <div className="absolute -right-6 -bottom-6 opacity-10 group-hover:opacity-20 transition-opacity">
                      <span className="material-symbols-outlined text-white" style={{ fontSize: '100px' }}>{style.icon.replace('_', '-')}</span>
                    </div>

                    {/* Header */}
                    <div className="flex items-start justify-between relative z-10">
                      <div>
                        <p className={`text-[10px] font-bold uppercase tracking-[0.15em] ${style.text} opacity-70 mb-1`}>Matière</p>
                        <h3 className="text-lg font-black text-white leading-tight">{assignment.subject_name}</h3>
                        <div className="flex items-center gap-1.5 mt-2">
                          <span className="material-symbols-outlined text-white/60 text-[14px]">door_front</span>
                          <span className="text-sm font-bold text-white/80">{assignment.classes?.name}</span>
                        </div>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-white text-[20px]">{style.icon.replace('_', '-')}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-3 gap-2 relative z-10">
                      <Link
                        href={`/enseignant/notes?classId=${assignment.class_id}&subject=${encodeURIComponent(assignment.subject_name)}`}
                        className="flex flex-col items-center gap-1.5 bg-white/10 hover:bg-white/20 backdrop-blur rounded-xl py-2.5 transition-all active:scale-95"
                      >
                        <span className="material-symbols-outlined text-white text-[20px]">edit_square</span>
                        <span className="text-[10px] font-bold text-white/80 text-center leading-tight">Notes</span>
                      </Link>
                      <Link
                        href={`/enseignant/presences?classId=${assignment.class_id}`}
                        className="flex flex-col items-center gap-1.5 bg-white/10 hover:bg-white/20 backdrop-blur rounded-xl py-2.5 transition-all active:scale-95"
                      >
                        <span className="material-symbols-outlined text-white text-[20px]">how_to_reg</span>
                        <span className="text-[10px] font-bold text-white/80 text-center leading-tight">Appel</span>
                      </Link>
                      <Link
                        href={`/enseignant/devoirs?classId=${assignment.class_id}`}
                        className="flex flex-col items-center gap-1.5 bg-white/10 hover:bg-white/20 backdrop-blur rounded-xl py-2.5 transition-all active:scale-95"
                      >
                        <span className="material-symbols-outlined text-white text-[20px]">assignment</span>
                        <span className="text-[10px] font-bold text-white/80 text-center leading-tight">Devoirs</span>
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Devoirs récents */}
          {recentDevoirs && recentDevoirs.length > 0 && (
            <div className="rounded-2xl overflow-hidden border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] shadow-sm">
              <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-outline-variant)] bg-[var(--color-surface-bright)]">
                <h3 className="font-bold text-[var(--color-on-surface)] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[var(--color-primary)] text-[20px]">assignment</span>
                  Derniers devoirs publiés
                </h3>
                <Link href="/enseignant/devoirs" className="text-xs font-bold text-[var(--color-primary)] hover:underline">Voir tout</Link>
              </div>
              <div className="divide-y divide-[var(--color-outline-variant)]">
                {recentDevoirs.map((devoir: any) => {
                  const dueDate = devoir.due_date ? new Date(devoir.due_date) : null
                  const isUrgent = dueDate && (dueDate.getTime() - Date.now()) < 86400000 * 2
                  return (
                    <div key={devoir.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-[var(--color-surface-container-low)] transition-colors">
                      <div className="w-9 h-9 rounded-xl bg-[var(--color-surface-container-low)] flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-[var(--color-primary)] text-[18px]">assignment</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-[var(--color-on-surface)] truncate">{devoir.title}</p>
                        <p className="text-xs text-[var(--color-on-surface-variant)]">{devoir.classes?.name}</p>
                      </div>
                      {dueDate && (
                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${isUrgent ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-[var(--color-surface-container-low)] text-[var(--color-on-surface-variant)]'}`}>
                          {format(dueDate, 'd MMM', { locale: fr })}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── SIDEBAR DROITE (1/3) ── */}
        <div className="space-y-5">

          {/* Accès rapides */}
          <div className="rounded-2xl overflow-hidden border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] shadow-sm">
            <div className="px-5 py-4 border-b border-[var(--color-outline-variant)] bg-[var(--color-surface-bright)]">
              <h3 className="font-bold text-[var(--color-on-surface)]">Accès rapides</h3>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3">
              {[
                { href: '/enseignant/notes',    icon: 'edit_square',  label: 'Saisir notes',  color: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white border-emerald-100' },
                { href: '/enseignant/presences',icon: 'how_to_reg',   label: 'Faire appel',   color: 'bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white border-blue-100' },
                { href: '/enseignant/devoirs',  icon: 'assignment',   label: 'Publier devoir',color: 'bg-violet-50 text-violet-700 hover:bg-violet-600 hover:text-white border-violet-100' },
                { href: '/enseignant/messages', icon: 'forum',        label: 'Messages',      color: 'bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white border-rose-100' },
              ].map((item) => (
                <Link key={item.href} href={item.href}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border ${item.color} transition-all duration-200 active:scale-95 group`}
                >
                  <span className="material-symbols-outlined text-[24px]">{item.icon.replace('_', '-')}</span>
                  <span className="text-[11px] font-bold text-center leading-tight">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Annonces de l'administration */}
          <div className="rounded-2xl overflow-hidden border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-outline-variant)] bg-[var(--color-surface-bright)]">
              <h3 className="font-bold text-[var(--color-on-surface)] flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-500 text-[18px]">campaign</span>
                Annonces
              </h3>
              {communications && communications.length > 0 && (
                <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-black flex items-center justify-center">{communications.length}</span>
              )}
            </div>
            <div className="p-4 flex flex-col gap-3">
              {communications && communications.length > 0 ? communications.map((comm: any, idx: number) => (
                <div key={comm.id} className={`p-3 rounded-xl bg-[var(--color-surface-container-low)] ${idx === 0 ? 'border-l-4 border-amber-500' : 'border-l-4 border-[var(--color-outline-variant)]'}`}>
                  <p className="text-sm font-bold text-[var(--color-on-surface)] line-clamp-1">{comm.subject}</p>
                  <p className="text-xs text-[var(--color-on-surface-variant)] line-clamp-2 mt-1">
                    {comm.content === 'Message vocal' ? '🎵 Message vocal' : comm.content}
                  </p>
                  <p className="text-[10px] text-[var(--color-on-surface-variant)] mt-2 font-semibold">
                    {format(new Date(comm.created_at), 'd MMM à HH:mm', { locale: fr })}
                  </p>
                </div>
              )) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <span className="material-symbols-outlined text-[36px] text-[var(--color-on-surface-variant)] opacity-30 mb-2">notifications_none</span>
                  <p className="text-sm font-bold text-[var(--color-on-surface)]">Aucune annonce</p>
                  <p className="text-xs text-[var(--color-on-surface-variant)] mt-1">Vous êtes à jour.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
