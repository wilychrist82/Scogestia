import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { AddChildButton } from '@/components/parent/AddChildButton'
import { 
  Calendar, 
  Megaphone,
  GraduationCap,
  Award, 
  FileText, 
  CheckSquare, 
  Wallet, 
  CreditCard, 
  ArrowRight, 
  Baby,
  BookOpen,
  ShieldCheck,
  Receipt,
  Utensils,
  Info,
  AlertTriangle,
  Users
} from 'lucide-react'

const isUrgentText = (s: string) => /urgent|important|alerte|imm[ée]diat/i.test(s)

const safeDate = (value?: string) => {
  if (!value) return ''
  const d = new Date(value)
  return isNaN(d.getTime()) ? '' : format(d, 'd MMM yyyy', { locale: fr })
}

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

  if (!roleData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
        <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mb-4 border border-amber-100">
          <span className="text-3xl">🔒</span>
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Compte non configuré</h2>
        <p className="text-sm text-slate-500 max-w-sm">Votre compte parent n'est pas encore lié à une école. Veuillez contacter l'administration de l'école de votre enfant.</p>
      </div>
    )
  }

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

  // Supabase retourne students comme un tableau (jointure), on aplatit et filtre
  const children = (links
    ?.flatMap(l => Array.isArray(l.students) ? l.students : (l.students ? [l.students] : []))
    .filter(Boolean) || []) as unknown as Array<{
      id: string;
      first_name: string;
      last_name: string;
      class_id: string;
      classes: { name: string } | null;
    }>

  // Déterminer le nom à afficher
  let displayName = roleData.full_name
  if (displayName.toLowerCase() === 'parent' && children.length > 0) {
    displayName = `Parent de ${children[0].first_name}`
  }

  // Récupérer les données de l'école (logo, nom)
  const { data: schoolData } = await supabase
    .from('schools')
    .select('name, logo_url')
    .eq('id', roleData.school_id)
    .maybeSingle()

  // Récupérer les annonces récentes (distinctes des messages directs)
  const { data: announcementsRaw } = await supabase
    .from('announcements')
    .select('*')
    .eq('school_id', roleData.school_id)
    .eq('is_published', true)
    .order('published_at', { ascending: false })
    .limit(3)

  // Fallback: aussi récupérer les communications récentes si pas d'annonces
  const { data: communications } = await supabase
    .from('communications')
    .select('*')
    .eq('school_id', roleData.school_id)
    .order('created_at', { ascending: false })
    .limit(2)

  const parentClassIds = new Set(children.map(c => c.class_id).filter(Boolean))

  // Combiner annonces ciblées + communications pour la section "À la une"
  const announcements = (announcementsRaw || [])
    .filter((a: any) => {
      // Si c'est pour une classe spécifique, afficher si l'un des enfants du parent y est inscrit
      if (a.target_type === 'class') {
        return a.target_class_id && parentClassIds.has(a.target_class_id)
      }
      // Si réservé aux enseignants uniquement, ne pas afficher au parent
      if (a.target_level === 'teachers') return false
      // Sinon ('parents', 'all', ou non spécifié / null comme pour l'AG) : afficher
      return true
    })
    .map((a: Record<string, unknown>) => ({
      id: a.id as string,
      subject: a.title as string,
      content: a.content as string,
      created_at: (a.published_at || a.created_at) as string,
      isAnnouncement: true,
    }))

  if (children.length === 0) {
    return (
      <div className="p-6 text-center text-[var(--color-on-surface-variant)] flex flex-col items-center justify-center h-full min-h-[60vh]">
        <div className="w-24 h-24 bg-[var(--color-primary-container)] rounded-full flex items-center justify-center mb-6">
          <Baby className="w-12 h-12 text-[var(--color-primary)]" />
        </div>
        <h2 className="text-2xl font-bold text-[var(--color-on-surface)] mb-3">Bienvenue sur Scogestia</h2>
        <p className="text-base text-gray-500 max-w-sm leading-relaxed mb-6">
          Votre compte est actif, mais aucun enfant n'est encore lié. Vous pouvez entrer le code d'activation fourni par l'établissement.
        </p>
        <AddChildButton variant="badge" />
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-6 p-4 md:p-6">

      {/* Hero de bienvenue */}
      <section className="relative -mx-4 -mt-4 overflow-hidden rounded-b-[2rem] bg-gradient-to-br from-[#006039] via-[#05503a] to-[#043323] px-5 pb-7 pt-6 text-white shadow-[0_24px_50px_-24px_rgba(0,96,57,0.7)] md:mx-0 md:mt-0 md:rounded-[2rem] md:px-8 md:pb-8 md:pt-8">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-amber-300/20 blur-[70px]" />
          <div className="absolute -bottom-24 -left-12 h-64 w-64 rounded-full bg-emerald-300/15 blur-[80px]" />
          <div className="absolute -right-10 top-8 h-44 w-44 rounded-full border border-white/10" />
          <div className="absolute -right-4 top-14 h-44 w-44 rounded-full border border-amber-200/15" />
          <div className="absolute inset-0 opacity-[0.07] [background-image:radial-gradient(#fff_1px,transparent_1px)] [background-size:22px_22px]" />
        </div>

        <div className="relative">
          <div className="mb-6 flex items-center gap-3">
            {schoolData?.logo_url ? (
              <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-1 shadow-[0_4px_14px_rgba(0,0,0,0.25)] ring-2 ring-amber-200/60">
                <img src={schoolData.logo_url} alt={schoolData.name || 'Logo école'} className="h-full w-full object-contain" />
              </div>
            ) : (
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-amber-200 ring-1 ring-amber-200/40">
                <GraduationCap className="h-5 w-5" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-200">Établissement</p>
              <p className="truncate text-sm font-bold text-white">{schoolData?.name || 'Votre école'}</p>
            </div>
          </div>

          <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-100">Bonjour,</p>
          <h1 className="mt-1.5 line-clamp-2 text-3xl font-extrabold leading-[1.1] tracking-[-0.03em] text-white sm:text-4xl">
            {displayName}
          </h1>
          <p className="mt-3 max-w-md text-sm font-medium leading-relaxed text-emerald-50 sm:text-base">
            Bienvenue sur votre portail parent. Retrouvez ici toutes les informations essentielles de la scolarité de vos enfants.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-bold capitalize text-white ring-1 ring-inset ring-amber-200/40 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] backdrop-blur-sm sm:text-sm">
              <Calendar className="h-4 w-4 text-amber-200" />
              {format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-amber-200/15 px-3.5 py-1.5 text-xs font-bold text-amber-100 ring-1 ring-inset ring-amber-200/40 sm:text-sm">
              <Users className="h-4 w-4" />
              {children.length} enfant{children.length > 1 ? 's' : ''} suivi{children.length > 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </section>

      {/* À la une */}
      <section className="rounded-[2rem] bg-slate-200/50 p-1.5 ring-1 ring-slate-200">
        <div className="rounded-[1.65rem] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_12px_30px_-18px_rgba(15,23,42,0.2)] ring-1 ring-slate-100 sm:p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="flex items-center gap-2.5 text-lg font-extrabold tracking-tight text-slate-900">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-800 ring-1 ring-inset ring-amber-300">
                <Megaphone className="h-[18px] w-[18px]" />
              </span>
              À la une
            </h2>
            <Link href="/parent/messages" className="rounded-full bg-emerald-50 px-3.5 py-1.5 text-xs font-bold text-emerald-900 ring-1 ring-inset ring-emerald-300 transition-colors hover:bg-emerald-100">
              Voir tout
            </Link>
          </div>

          <div className="flex flex-col">
            {announcements.length > 0 ? announcements.map((ann: { id: string; subject: string; content: string; created_at?: string; isAnnouncement?: boolean }, idx: number) => {
              const urgent = isUrgentText(`${ann.subject} ${ann.content}`)
              const dateText = safeDate(ann.created_at)
              return (
                <article key={ann.id} className={`flex items-start gap-3.5 ${idx !== 0 ? 'mt-4 border-t border-slate-200 pt-4' : ''}`}>
                  {schoolData?.logo_url ? (
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-1 ring-1 ring-slate-200 shadow-sm">
                      <img src={schoolData.logo_url} alt={schoolData.name || 'Logo école'} className="h-full w-full object-contain" />
                    </div>
                  ) : (
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-300">
                      <Megaphone className="h-5 w-5" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="mb-1.5 flex flex-wrap items-center gap-2">
                      {urgent ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wide text-rose-800 ring-1 ring-inset ring-rose-300">
                          <AlertTriangle className="h-3 w-3" /> Urgent
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wide text-emerald-900 ring-1 ring-inset ring-emerald-300">
                          <Info className="h-3 w-3" /> Information officielle
                        </span>
                      )}
                      {dateText && <span className="text-[11px] font-bold tabular-nums text-slate-700">{dateText}</span>}
                    </div>
                    <h3 className="text-[15px] font-extrabold leading-snug text-slate-900">{ann.subject}</h3>
                    <p className="mt-1 line-clamp-3 whitespace-pre-line text-sm font-medium leading-relaxed text-slate-800">{ann.content}</p>
                    <p className="mt-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-700">
                      La direction{schoolData?.name ? ` · ${schoolData.name}` : ''}
                    </p>
                  </div>
                </article>
              )
            }) : communications && communications.length > 0 ? communications.map((comm: { id: string; subject: string; content: string }, idx: number) => (
              <Link key={comm.id} href="/parent/messages" className={`group/item block ${idx !== 0 ? 'mt-4 border-t border-slate-200 pt-4' : ''}`}>
                <h3 className="text-[15px] font-extrabold leading-tight text-slate-900 transition-colors group-hover/item:text-emerald-800">{comm.subject}</h3>
                <p className="mt-1.5 line-clamp-2 text-sm font-medium text-slate-800">{comm.content === 'Message vocal' ? '🎵 Message vocal reçu' : comm.content}</p>
              </Link>
            )) : (
              <div className="flex items-center justify-center py-8 text-sm font-semibold text-slate-700">Aucune annonce récente</div>
            )}
          </div>
        </div>
      </section>

      {/* Dossiers scolaires */}
      <section className="space-y-4">
        <h2 className="px-1 text-xs font-extrabold uppercase tracking-[0.16em] text-slate-800">Dossiers scolaires</h2>

        {children.map((child: { id: string; first_name: string; last_name: string; classes: { name: string } | null }) => (
          <div key={child.id} className="rounded-[2rem] bg-slate-200/50 p-1.5 ring-1 ring-slate-200">
            <div className="rounded-[1.65rem] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_12px_30px_-18px_rgba(15,23,42,0.2)] ring-1 ring-slate-100 sm:p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#006039] to-[#043323] text-2xl font-extrabold text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_8px_20px_-8px_rgba(0,96,57,0.7)] ring-2 ring-amber-200">
                  {child.first_name[0]}{child.last_name[0]}
                </div>
                <div className="min-w-0">
                  <h3 className="truncate text-xl font-extrabold leading-tight tracking-tight text-slate-900">{child.first_name}</h3>
                  <p className="truncate text-sm font-bold text-slate-800">{child.last_name}</p>
                  <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-900 ring-1 ring-inset ring-emerald-300">
                    <GraduationCap className="h-3.5 w-3.5" />
                    {child.classes?.name ? `Classe de ${child.classes.name}` : 'Classe non assignée'}
                  </span>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-4 gap-2.5">
                {[
                  { label: 'Notes', href: `/parent/notes?child=${child.id}`, icon: BookOpen, box: 'bg-sky-50 ring-sky-200 hover:bg-sky-100', chip: 'text-sky-800' },
                  { label: 'Présences', href: `/parent/presences?child=${child.id}`, icon: CheckSquare, box: 'bg-amber-50 ring-amber-200 hover:bg-amber-100', chip: 'text-amber-800' },
                  { label: 'Devoirs', href: `/parent/devoirs?child=${child.id}`, icon: FileText, box: 'bg-violet-50 ring-violet-200 hover:bg-violet-100', chip: 'text-violet-800' },
                  { label: 'Bulletins', href: `/parent/bulletins?child=${child.id}`, icon: Award, box: 'bg-emerald-50 ring-emerald-200 hover:bg-emerald-100', chip: 'text-emerald-800' },
                ].map(({ label, href, icon: Icon, box, chip }) => (
                  <Link
                    key={label}
                    href={href}
                    className={`group/q flex flex-col items-center gap-2 rounded-2xl px-1 py-3 ring-1 ring-inset transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 ${box}`}
                  >
                    <span className={`flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-[0_2px_8px_rgba(15,23,42,0.12)] transition-transform duration-200 group-hover/q:scale-110 group-active/q:scale-95 ${chip}`}>
                      <Icon className="h-[22px] w-[22px]" />
                    </span>
                    <span className="text-[11px] font-extrabold text-slate-900 sm:text-xs">{label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        ))}

        <AddChildButton />
      </section>

      {/* Finances & scolarité */}
      <section className="space-y-4">
        <h2 className="px-1 text-xs font-extrabold uppercase tracking-[0.16em] text-slate-800">Finances & scolarité</h2>
        <div className="rounded-[2rem] bg-slate-200/50 p-1.5 ring-1 ring-slate-200">
          <Link
            href={`/parent/paiements${children && children.length > 0 ? `?child=${children[0].id}` : ''}`}
            className="group relative block overflow-hidden rounded-[1.65rem] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_12px_30px_-18px_rgba(15,23,42,0.2)] ring-1 ring-slate-100 transition-all duration-300 hover:shadow-[0_18px_40px_-18px_rgba(0,96,57,0.35)] active:scale-[0.99] sm:p-6"
          >
            <span aria-hidden className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#006039] via-emerald-500 to-amber-300" />
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-300">
                  <Wallet className="h-6 w-6" />
                </span>
                <div>
                  <h3 className="text-xl font-extrabold tracking-tight text-slate-900">Frais de scolarité</h3>
                  <p className="mt-0.5 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                    <ShieldCheck className="h-3.5 w-3.5" /> Suivi sécurisé · Reçus officiels
                  </p>
                </div>
              </div>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-900 ring-1 ring-inset ring-slate-300 transition-all group-hover:bg-emerald-700 group-hover:text-white group-hover:ring-emerald-700">
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </div>

            <ul className="mt-5 grid gap-2.5 sm:grid-cols-3">
              {[
                { icon: CreditCard, text: 'Frais de scolarité' },
                { icon: Utensils, text: 'Cantine' },
                { icon: Receipt, text: 'Historique & reçus' },
              ].map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-2.5 rounded-xl bg-slate-50 px-3 py-2.5 text-sm font-bold text-slate-900 ring-1 ring-inset ring-slate-200">
                  <Icon className="h-4 w-4 shrink-0 text-emerald-800" />
                  {text}
                </li>
              ))}
            </ul>

            <p className="mt-4 text-sm font-semibold text-slate-800">
              Consultez l&apos;état de vos paiements, les échéances à venir et téléchargez vos reçus à tout moment.
            </p>
          </Link>
        </div>
      </section>

    </div>
  )
}

