import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { format, startOfWeek, endOfWeek } from 'date-fns'
import { fr } from 'date-fns/locale'
import { 
  Book, 
  Calculator, 
  BookOpen, 
  Landmark, 
  FlaskConical, 
  Languages, 
  Trophy,
  Calendar,
  School,
  DoorOpen,
  Edit3,
  UserCheck,
  FileText,
  Megaphone,
  Clock,
  BellOff,
  MessageSquare
} from 'lucide-react'

export const dynamic = 'force-dynamic'

// Palette de couleurs par matière
const subjectColors: Record<string, { bg: string; text: string; light: string; icon: any }> = {
  default:      { bg: 'from-indigo-600 to-indigo-900',  text: 'text-indigo-100', light: 'bg-indigo-50 text-indigo-700 border-indigo-100', icon: Book },
  math:         { bg: 'from-blue-600 to-blue-900',      text: 'text-blue-100',   light: 'bg-blue-50 text-blue-700 border-blue-100',       icon: Calculator },
  français:     { bg: 'from-rose-600 to-rose-900',      text: 'text-rose-100',   light: 'bg-rose-50 text-rose-700 border-rose-100',         icon: BookOpen },
  histoire:     { bg: 'from-amber-600 to-amber-900',    text: 'text-amber-100',  light: 'bg-amber-50 text-amber-700 border-amber-100',     icon: Landmark },
  sciences:     { bg: 'from-emerald-600 to-emerald-900',text: 'text-emerald-100',light: 'bg-emerald-50 text-emerald-700 border-emerald-100',icon: FlaskConical },
  anglais:      { bg: 'from-sky-600 to-sky-900',        text: 'text-sky-100',    light: 'bg-sky-50 text-sky-700 border-sky-100',           icon: Languages },
  sport:        { bg: 'from-orange-500 to-orange-900',  text: 'text-orange-100', light: 'bg-orange-50 text-orange-700 border-orange-100',  icon: Trophy },
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

  if (!roleData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
        <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mb-4 border border-amber-100">
          <span className="text-3xl">🔒</span>
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Accès non autorisé</h2>
        <p className="text-sm text-slate-500 max-w-sm">Votre compte n'est pas lié à un profil enseignant. Contactez l'administration de votre école.</p>
      </div>
    )
  }

  const initials = getInitials(roleData.full_name)

  // Classes/matières assignées
  const { data: assignments } = await supabase
    .from('teacher_class_subjects')
    .select('id, subject_name, class_id, classes(name)')
    .eq('teacher_id', user.id)

  // Devoirs publiés par cet enseignant (total)
  const { count: devoirsCount } = await supabase
    .from('homework')
    .select('*', { count: 'exact', head: true })
    .eq('teacher_id', user.id)

  // Devoirs publiés cette semaine
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString()
  const weekEnd   = endOfWeek(new Date(),   { weekStartsOn: 1 }).toISOString()
  const { count: devoirsSemaine } = await supabase
    .from('homework')
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

  // Récupérer les informations de l'établissement (logo, nom)
  const { data: schoolData } = await supabase
    .from('schools')
    .select('name, logo_url')
    .eq('id', roleData.school_id)
    .maybeSingle()

  // Récupérer les annonces officielles publiées
  const { data: rawAnnouncements } = await supabase
    .from('announcements')
    .select('*')
    .eq('school_id', roleData.school_id)
    .eq('is_published', true)
    .order('published_at', { ascending: false })
    .limit(10)

  const teacherClassIds = new Set((assignments || []).map((a: any) => a.class_id).filter(Boolean))

  const announcements = (rawAnnouncements || []).filter((a: any) => {
    // Si c'est pour une classe spécifique, afficher si l'enseignant intervient dans cette classe
    if (a.target_type === 'class') {
      return a.target_class_id && teacherClassIds.has(a.target_class_id)
    }
    // Si l'annonce est réservée exclusivement aux parents, ne pas l'afficher à l'enseignant
    if (a.target_level === 'parents') return false
    // Sinon ('all', 'teachers', ou non spécifié / null comme pour l'AG) : afficher
    return true
  }).slice(0, 4)

  // Devoirs récents publiés
  const { data: recentDevoirs } = await supabase
    .from('homework')
    .select('id, title, due_date, class_id, classes(name)')
    .eq('teacher_id', user.id)
    .order('created_at', { ascending: false })
    .limit(4)

  const classCount = [...new Set(assignments?.map(a => a.class_id) || [])].length
  const todayLabel = format(new Date(), "EEEE d MMMM", { locale: fr })

  return (
    <div className="max-w-[1400px] mx-auto p-4 md:p-6 lg:p-8 w-full space-y-6">

      {/* ── HERO IDENTITÉ ENSEIGNANT PREMIUM ── */}
      <div className="relative overflow-hidden rounded-[1.75rem] bg-[#0a0d16] min-h-[165px] flex flex-col sm:flex-row items-center sm:items-stretch shadow-2xl border border-white/[0.06] ring-1 ring-inset ring-white/[0.04]">
        {/* Orbes */}
        <div className="absolute -top-16 -left-16 w-72 h-72 bg-violet-500/15 rounded-full blur-[90px] pointer-events-none animate-pulse" style={{ animationDuration: '5s' }} />
        <div className="absolute -bottom-10 right-10 w-56 h-56 bg-indigo-500/10 rounded-full blur-[70px] pointer-events-none animate-pulse" style={{ animationDuration: '7s', animationDelay: '1s' }} />
        <div className="absolute top-0 right-1/3 w-40 h-40 bg-emerald-500/8 rounded-full blur-[60px] pointer-events-none" />

        {/* Gauche : identité */}
        <div className="relative z-10 flex items-center gap-5 p-6 sm:p-8 flex-1">
          {/* Avatar avec gradient border */}
          <div className="relative flex-shrink-0">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-400 via-indigo-500 to-purple-700 blur-[2px] opacity-80" />
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-700 flex items-center justify-center text-white font-black text-2xl sm:text-3xl border border-white/20 overflow-hidden">
              {user.user_metadata?.avatar_url ? (
                <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                initials
              )}
            </div>
          </div>
          <div>
            <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-3 py-1 mb-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-400">Espace Enseignant</p>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white leading-tight tracking-tight">{roleData.full_name}</h1>
            <div className="flex items-center gap-2 mt-2">
              <Calendar className="text-emerald-400 w-4 h-4" />
              <span className="text-white/45 text-sm font-semibold capitalize">{todayLabel}</span>
            </div>
          </div>
        </div>

        {/* Droite : métriques */}
        <div className="relative z-10 flex items-center gap-2.5 p-6 sm:p-8 flex-wrap sm:border-l border-white/[0.06]">
          {[
            { label: 'Classes', value: classCount, color: 'text-white' },
            { label: 'Devoirs total', value: devoirsCount || 0, color: 'text-white' },
            { label: 'Cette semaine', value: devoirsSemaine || 0, color: 'text-violet-300', bg: 'bg-violet-500/15 border-violet-500/25' },
            { label: 'Absences', value: absencesCount || 0, color: 'text-rose-300', bg: 'bg-rose-500/10 border-rose-500/20' },
          ].map((stat, i) => (
            <div key={i} className={`${stat.bg || 'bg-white/[0.04] border-white/[0.08]'} border hover:border-white/20 rounded-2xl px-4 py-3 text-center min-w-[76px] transition-all duration-500 group cursor-default`}
              style={{ transitionTimingFunction: 'cubic-bezier(0.32,0.72,0,1)' }}>
              <p className="text-[9px] text-white/35 font-bold uppercase tracking-[0.15em] mb-1">{stat.label}</p>
              <p className={`text-xl font-black leading-none ${stat.color} group-hover:scale-105 inline-block transition-transform`}
                style={{ transitionTimingFunction: 'cubic-bezier(0.32,0.72,0,1)' }}>
                {stat.value}
              </p>
            </div>
          ))}
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
              <School className="w-12 h-12 text-[var(--color-on-surface-variant)] opacity-30 mb-4" />
              <p className="text-base font-bold text-[var(--color-on-surface)]">Aucune classe assignée</p>
              <p className="text-sm text-[var(--color-on-surface-variant)] mt-1">Contactez l'administration pour être affecté à des classes.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {assignments.map((assignment: any) => {
                const style = getSubjectStyle(assignment.subject_name)
                const SubjectIcon = style.icon
                return (
                  <div key={assignment.id} className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${style.bg} p-5 shadow-lg flex flex-col gap-4 group hover:-translate-y-1 transition-transform duration-300`}>
                    {/* Blob décoratif */}
                    <div className="absolute -right-6 -bottom-6 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                      <SubjectIcon className="w-28 h-28 text-white" />
                    </div>

                    {/* Header */}
                    <div className="flex items-start justify-between relative z-10">
                      <div>
                        <p className={`text-[10px] font-bold uppercase tracking-[0.15em] ${style.text} opacity-70 mb-1`}>Matière</p>
                        <h3 className="text-lg font-black text-white leading-tight">{assignment.subject_name}</h3>
                        <div className="flex items-center gap-1.5 mt-2">
                          <DoorOpen className="text-white/60 w-3.5 h-3.5" />
                          <span className="text-sm font-bold text-white/80">{assignment.classes?.name}</span>
                        </div>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center flex-shrink-0">
                        <SubjectIcon className="w-5 h-5 text-white" />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-3 gap-2 relative z-10">
                      <Link
                        href={`/enseignant/notes?classId=${assignment.class_id}&subject=${encodeURIComponent(assignment.subject_name)}`}
                        className="flex flex-col items-center gap-1.5 bg-white/10 hover:bg-white/20 backdrop-blur rounded-xl py-2.5 transition-all active:scale-95"
                      >
                        <Edit3 className="text-white w-4 h-4" />
                        <span className="text-[10px] font-bold text-white/80 text-center leading-tight">Notes</span>
                      </Link>
                      <Link
                        href={`/enseignant/presences?classId=${assignment.class_id}`}
                        className="flex flex-col items-center gap-1.5 bg-white/10 hover:bg-white/20 backdrop-blur rounded-xl py-2.5 transition-all active:scale-95"
                      >
                        <UserCheck className="text-white w-4 h-4" />
                        <span className="text-[10px] font-bold text-white/80 text-center leading-tight">Appel</span>
                      </Link>
                      <Link
                        href={`/enseignant/devoirs?classId=${assignment.class_id}`}
                        className="flex flex-col items-center gap-1.5 bg-white/10 hover:bg-white/20 backdrop-blur rounded-xl py-2.5 transition-all active:scale-95"
                      >
                        <FileText className="text-white w-4 h-4" />
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
                  <FileText className="text-[var(--color-primary)] w-4 h-4" />
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
                        <FileText className="text-[var(--color-primary)] w-4 h-4" />
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
                { href: '/enseignant/notes',    icon: Edit3,         label: 'Saisir notes',  color: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white border-emerald-100' },
                { href: '/enseignant/presences',icon: UserCheck,     label: 'Faire appel',   color: 'bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white border-blue-100' },
                { href: '/enseignant/devoirs',  icon: FileText,      label: 'Publier devoir',color: 'bg-violet-50 text-violet-700 hover:bg-violet-600 hover:text-white border-violet-100' },
                { href: '/enseignant/messages', icon: MessageSquare, label: 'Messages',      color: 'bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white border-rose-100' },
              ].map((item) => (
                <Link key={item.href} href={item.href}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border ${item.color} transition-all duration-200 active:scale-95 group`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="text-[11px] font-bold text-center leading-tight">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Annonces de l'administration */}
          <div className="rounded-2xl overflow-hidden border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-outline-variant)] bg-[var(--color-surface-bright)]">
              <h3 className="font-bold text-[var(--color-on-surface)] flex items-center gap-2">
                <Megaphone className="text-amber-500 w-4 h-4" />
                Annonces officielles
              </h3>
              {announcements && announcements.length > 0 && (
                <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-black flex items-center justify-center">
                  {announcements.length}
                </span>
              )}
            </div>
            <div className="p-4 flex flex-col gap-3">
              {announcements && announcements.length > 0 ? announcements.map((ann: any, idx: number) => (
                <div
                  key={ann.id}
                  className={`p-3.5 rounded-xl bg-[var(--color-surface-container-low)] border border-[var(--color-outline-variant)] flex items-start gap-3 transition-colors ${
                    idx === 0 ? 'border-l-4 border-l-amber-500' : ''
                  }`}
                >
                  {schoolData?.logo_url ? (
                    <div className="w-9 h-9 rounded-xl overflow-hidden border border-gray-200 bg-white p-0.5 shrink-0 shadow-xs flex items-center justify-center">
                      <img src={schoolData.logo_url} alt={schoolData.name || 'École'} className="w-full h-full object-contain" />
                    </div>
                  ) : (
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0 shadow-xs">
                      <Megaphone className="w-4 h-4" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-[var(--color-on-surface)] leading-snug line-clamp-1">{ann.title}</p>
                    <p className="text-xs text-[var(--color-on-surface-variant)] line-clamp-3 mt-1 whitespace-pre-line leading-relaxed">
                      {ann.content}
                    </p>
                    <p className="text-[10px] text-[var(--color-on-surface-variant)] mt-2 font-semibold flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {format(new Date(ann.published_at || ann.created_at), 'd MMMM à HH:mm', { locale: fr })}
                    </p>
                  </div>
                </div>
              )) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <BellOff className="w-9 h-9 text-[var(--color-on-surface-variant)] opacity-30 mb-2" />
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
