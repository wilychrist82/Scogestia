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
  MessageSquare,
  ChevronRight,
  AlertTriangle
} from 'lucide-react'

export const dynamic = 'force-dynamic'

// Palette feutrée par discipline (cartes claires, lisibles en plein jour)
type SubjectStyle = { tint: string; tile: string; accent: string; badge: string; bar: string; icon: any }

const subjectColors: Record<string, SubjectStyle> = {
  default:  { tint: 'from-indigo-100/80 via-indigo-50/40 to-white',   tile: 'bg-indigo-100 text-indigo-900 ring-indigo-200',   accent: 'text-indigo-800',  badge: 'bg-indigo-50 text-indigo-900 ring-indigo-200',   bar: 'bg-indigo-500',  icon: Book },
  math:     { tint: 'from-blue-100/80 via-blue-50/40 to-white',       tile: 'bg-blue-100 text-blue-900 ring-blue-200',         accent: 'text-blue-800',    badge: 'bg-blue-50 text-blue-900 ring-blue-200',         bar: 'bg-blue-500',    icon: Calculator },
  français: { tint: 'from-rose-100/80 via-rose-50/40 to-white',       tile: 'bg-rose-100 text-rose-900 ring-rose-200',         accent: 'text-rose-800',    badge: 'bg-rose-50 text-rose-900 ring-rose-200',         bar: 'bg-rose-500',    icon: BookOpen },
  histoire: { tint: 'from-amber-100/80 via-amber-50/40 to-white',     tile: 'bg-amber-100 text-amber-900 ring-amber-200',      accent: 'text-amber-800',   badge: 'bg-amber-50 text-amber-900 ring-amber-200',      bar: 'bg-amber-500',   icon: Landmark },
  sciences: { tint: 'from-emerald-100/80 via-emerald-50/40 to-white', tile: 'bg-emerald-100 text-emerald-900 ring-emerald-200', accent: 'text-emerald-800', badge: 'bg-emerald-50 text-emerald-900 ring-emerald-200', bar: 'bg-emerald-500', icon: FlaskConical },
  anglais:  { tint: 'from-sky-100/80 via-sky-50/40 to-white',         tile: 'bg-sky-100 text-sky-900 ring-sky-200',            accent: 'text-sky-800',     badge: 'bg-sky-50 text-sky-900 ring-sky-200',            bar: 'bg-sky-500',     icon: Languages },
  sport:    { tint: 'from-orange-100/80 via-orange-50/40 to-white',   tile: 'bg-orange-100 text-orange-900 ring-orange-200',   accent: 'text-orange-800',  badge: 'bg-orange-50 text-orange-900 ring-orange-200',   bar: 'bg-orange-500',  icon: Trophy },
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
  const todayLabel = format(new Date(), "EEEE d MMMM yyyy", { locale: fr })

  const cardShell = 'rounded-[2rem] bg-slate-200/50 p-1.5 ring-1 ring-slate-200'
  const cardInner = 'overflow-hidden rounded-[1.65rem] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.05),0_12px_30px_-18px_rgba(15,23,42,0.2)] ring-1 ring-slate-100'

  return (
    <div className="max-w-[1400px] mx-auto p-4 md:p-6 lg:p-8 w-full space-y-6">

      {/* ── HERO ENSEIGNANT ── */}
      <section className="relative overflow-hidden rounded-[2rem] bg-[#050B18] p-6 shadow-[0_30px_80px_-30px_rgba(5,11,24,0.8)] ring-1 ring-white/10 sm:p-8">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -left-20 -top-28 h-80 w-[26rem] rounded-full bg-emerald-500/20 blur-[110px]" />
          <div className="absolute -bottom-32 right-0 h-72 w-96 rounded-full bg-cyan-400/10 blur-[120px]" />
          <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:44px_44px] [mask-image:radial-gradient(ellipse_at_left,black_20%,transparent_75%)]" />
        </div>

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="relative shrink-0">
              <div aria-hidden className="absolute -inset-0.5 rounded-[1.35rem] bg-gradient-to-br from-emerald-300 to-cyan-400 opacity-70 blur-[3px]" />
              <div className="relative flex h-[4.5rem] w-[4.5rem] items-center justify-center overflow-hidden rounded-[1.25rem] bg-gradient-to-br from-emerald-600 to-emerald-900 text-2xl font-extrabold text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)] ring-1 ring-white/30 sm:h-20 sm:w-20 sm:text-3xl">
                {user.user_metadata?.avatar_url ? (
                  <img src={user.user_metadata.avatar_url} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  initials
                )}
              </div>
            </div>
            <div className="min-w-0">
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-400/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-200 ring-1 ring-inset ring-emerald-400/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)]">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </span>
                Espace Enseignant
              </span>
              <h1 className="mt-2.5 line-clamp-2 text-2xl font-extrabold leading-tight tracking-[-0.03em] text-white sm:text-3xl">{roleData.full_name}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                <span className="inline-flex items-center gap-2 text-sm font-semibold capitalize text-slate-100">
                  <Calendar className="h-4 w-4 text-emerald-300" />
                  {todayLabel}
                </span>
                {schoolData?.name && <span className="text-sm font-semibold text-slate-200">· {schoolData.name}</span>}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:flex lg:flex-wrap">
            {[
              { label: 'Classes', value: classCount, color: 'text-white', box: 'bg-white/[0.06] ring-white/10' },
              { label: 'Devoirs semaine', value: devoirsSemaine || 0, color: 'text-emerald-300', box: 'bg-emerald-400/10 ring-emerald-400/25' },
              { label: 'Devoirs total', value: devoirsCount || 0, color: 'text-white', box: 'bg-white/[0.06] ring-white/10' },
              { label: 'Appel · absences', value: absencesCount || 0, color: (absencesCount || 0) > 0 ? 'text-rose-300' : 'text-emerald-300', box: (absencesCount || 0) > 0 ? 'bg-rose-400/10 ring-rose-400/25' : 'bg-white/[0.06] ring-white/10' },
            ].map((stat) => (
              <div key={stat.label} className={`min-w-[104px] rounded-2xl px-4 py-3 ring-1 ring-inset shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] backdrop-blur-md ${stat.box}`}>
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-200">{stat.label}</p>
                <p className={`text-2xl font-extrabold leading-none tabular-nums tracking-tight ${stat.color}`}>{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTENU PRINCIPAL ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* ── CLASSES ASSIGNÉES (2/3) ── */}
        <div className="space-y-5 lg:col-span-2">
          <div className="flex items-center justify-between px-1">
            <h2 className="flex items-center gap-2.5 text-lg font-extrabold tracking-tight text-slate-900">
              <span className="inline-block h-5 w-1 rounded-full bg-emerald-600" />
              Mes Classes & Matières
            </h2>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-bold tabular-nums text-slate-900 ring-1 ring-inset ring-slate-300">
              {assignments?.length || 0} assignation{(assignments?.length || 0) > 1 ? 's' : ''}
            </span>
          </div>

          {(!assignments || assignments.length === 0) ? (
            <div className={cardShell}>
              <div className={`${cardInner} flex flex-col items-center p-12 text-center`}>
                <School className="mb-4 h-12 w-12 text-slate-600" />
                <p className="text-base font-extrabold text-slate-900">Aucune classe assignée</p>
                <p className="mt-1 text-sm font-medium text-slate-700">Contactez l'administration pour être affecté à des classes.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {assignments.map((assignment: any) => {
                const style = getSubjectStyle(assignment.subject_name)
                const SubjectIcon = style.icon
                return (
                  <div key={assignment.id} className={`${cardShell} group transition-transform duration-300 hover:-translate-y-1`}>
                    <div className={`${cardInner} relative flex flex-col gap-5 bg-gradient-to-br p-5 ${style.tint}`}>
                      <span aria-hidden className={`absolute inset-y-5 left-0 w-1 rounded-r-full ${style.bar}`} />
                      <div aria-hidden className="pointer-events-none absolute -bottom-6 -right-5 opacity-[0.07]">
                        <SubjectIcon className="h-28 w-28 text-slate-900" />
                      </div>

                      <div className="relative flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className={`mb-1 text-[11px] font-bold uppercase tracking-[0.14em] ${style.accent}`}>Matière</p>
                          <h3 className="text-xl font-extrabold leading-tight tracking-tight text-slate-900">{assignment.subject_name}</h3>
                          <span className={`mt-2.5 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-extrabold ring-1 ring-inset ${style.badge}`}>
                            <DoorOpen className="h-3.5 w-3.5" />
                            {assignment.classes?.name}
                          </span>
                        </div>
                        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset shadow-[inset_0_1px_1px_rgba(255,255,255,0.7)] ${style.tile}`}>
                          <SubjectIcon className="h-5 w-5" />
                        </div>
                      </div>

                      <div className="relative grid grid-cols-3 gap-2">
                        {[
                          { label: 'Notes', icon: Edit3, href: `/enseignant/notes?classId=${assignment.class_id}&subject=${encodeURIComponent(assignment.subject_name)}` },
                          { label: 'Appel', icon: UserCheck, href: `/enseignant/presences?classId=${assignment.class_id}` },
                          { label: 'Devoirs', icon: FileText, href: `/enseignant/devoirs?classId=${assignment.class_id}` },
                        ].map(({ label, icon: Icon, href }) => (
                          <Link
                            key={label}
                            href={href}
                            className="flex flex-col items-center gap-1.5 rounded-xl bg-white py-3 text-slate-900 shadow-[0_1px_2px_rgba(15,23,42,0.08)] ring-1 ring-inset ring-slate-300 transition-all duration-150 hover:ring-slate-500 active:scale-90 active:bg-slate-900 active:text-white active:shadow-none active:ring-slate-900"
                          >
                            <Icon className={`h-[18px] w-[18px] ${style.accent}`} />
                            <span className="text-[11px] font-extrabold leading-tight">{label}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Devoirs récents */}
          {recentDevoirs && recentDevoirs.length > 0 && (
            <div className={cardShell}>
              <div className={cardInner}>
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                  <h3 className="flex items-center gap-2.5 text-base font-extrabold tracking-tight text-slate-900">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-violet-900 ring-1 ring-inset ring-violet-200">
                      <FileText className="h-4 w-4" />
                    </span>
                    Derniers devoirs publiés
                  </h3>
                  <Link href="/enseignant/devoirs" className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 hover:underline">
                    Voir tout <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
                <div className="divide-y divide-slate-200">
                  {recentDevoirs.map((devoir: any) => {
                    const dueDate = devoir.due_date ? new Date(devoir.due_date) : null
                    const isUrgent = dueDate && (dueDate.getTime() - Date.now()) < 86400000 * 2
                    const isPast = dueDate && dueDate.getTime() < Date.now()
                    return (
                      <div key={devoir.id} className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-slate-50">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-900 ring-1 ring-inset ring-slate-300">
                          <FileText className="h-[18px] w-[18px]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-extrabold text-slate-900">{devoir.title}</p>
                          <p className="text-xs font-semibold text-slate-700">{devoir.classes?.name}</p>
                        </div>
                        {dueDate && (
                          <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-extrabold tabular-nums ring-1 ring-inset ${
                            isUrgent
                              ? 'bg-rose-50 text-rose-800 ring-rose-300'
                              : 'bg-slate-100 text-slate-900 ring-slate-300'
                          }`}>
                            {isUrgent && <AlertTriangle className="h-3 w-3" />}
                            {isPast ? 'Échu · ' : isUrgent ? 'Bientôt · ' : ''}
                            {format(dueDate, 'd MMM', { locale: fr })}
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── SIDEBAR DROITE (1/3) ── */}
        <div className="space-y-5">

          {/* Accès rapides */}
          <div className={cardShell}>
            <div className={cardInner}>
              <div className="border-b border-slate-200 px-5 py-4">
                <h3 className="text-base font-extrabold tracking-tight text-slate-900">Accès rapides</h3>
              </div>
              <div className="grid grid-cols-2 gap-3 p-4">
                {[
                  { href: '/enseignant/notes',    icon: Edit3,         label: 'Saisir notes',   box: 'bg-emerald-50 text-emerald-900 ring-emerald-300 hover:bg-emerald-100' },
                  { href: '/enseignant/presences',icon: UserCheck,     label: 'Faire appel',    box: 'bg-sky-50 text-sky-900 ring-sky-300 hover:bg-sky-100' },
                  { href: '/enseignant/devoirs',  icon: FileText,      label: 'Publier devoir', box: 'bg-violet-50 text-violet-900 ring-violet-300 hover:bg-violet-100' },
                  { href: '/enseignant/messages', icon: MessageSquare, label: 'Messages',       box: 'bg-rose-50 text-rose-900 ring-rose-300 hover:bg-rose-100' },
                ].map((item) => (
                  <Link key={item.href} href={item.href}
                    className={`flex flex-col items-center gap-2 rounded-2xl p-3.5 ring-1 ring-inset transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 ${item.box}`}
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-[0_2px_8px_rgba(15,23,42,0.12)]">
                      <item.icon className="h-5 w-5" />
                    </span>
                    <span className="text-center text-xs font-extrabold leading-tight">{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Annonces de l'administration */}
          <div className={cardShell}>
            <div className={cardInner}>
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <h3 className="flex items-center gap-2.5 text-base font-extrabold tracking-tight text-slate-900">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-900 ring-1 ring-inset ring-amber-300">
                    <Megaphone className="h-4 w-4" />
                  </span>
                  Annonces officielles
                </h3>
                {announcements && announcements.length > 0 && (
                  <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-amber-500 px-1.5 text-xs font-extrabold tabular-nums text-white">
                    {announcements.length}
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-3 p-4">
                {announcements && announcements.length > 0 ? announcements.map((ann: any, idx: number) => (
                  <div
                    key={ann.id}
                    className={`flex items-start gap-3 rounded-xl bg-slate-50 p-3.5 ring-1 ring-inset ring-slate-200 ${
                      idx === 0 ? 'border-l-4 border-l-amber-500' : ''
                    }`}
                  >
                    {schoolData?.logo_url ? (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-1 ring-1 ring-slate-200 shadow-sm">
                        <img src={schoolData.logo_url} alt={schoolData.name || 'École'} className="h-full w-full object-contain" />
                      </div>
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-300">
                        <Megaphone className="h-4 w-4" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-sm font-extrabold leading-snug text-slate-900">{ann.title}</p>
                      <p className="mt-1 line-clamp-3 whitespace-pre-line text-xs font-medium leading-relaxed text-slate-800">
                        {ann.content}
                      </p>
                      <p className="mt-2 flex items-center gap-1 text-[11px] font-bold text-slate-700">
                        <Clock className="h-3 w-3" />
                        {format(new Date(ann.published_at || ann.created_at), 'd MMMM à HH:mm', { locale: fr })}
                      </p>
                    </div>
                  </div>
                )) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <BellOff className="mb-2 h-9 w-9 text-slate-600" />
                    <p className="text-sm font-extrabold text-slate-900">Aucune annonce</p>
                    <p className="mt-1 text-xs font-medium text-slate-700">Vous êtes à jour.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
