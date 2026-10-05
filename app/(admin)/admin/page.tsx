import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { 
  Users, Presentation, UserCircle, Wallet, CalendarOff,
  UserPlus, PlusSquare, CalendarPlus,
  Banknote, BookOpenCheck, CheckCircle2, ArrowUpRight
} from 'lucide-react'
import { 
  PaymentChart, AttendancePieChart, ClassDistributionPieChart, ClassBarChart,
  CircularProgress, PaymentData, AttendanceData, ClassDistributionData
} from '@/components/dashboard/DashboardCharts'
import { OnboardingWizard } from '@/components/admin/OnboardingWizard'
import { ShortcutsButton } from '@/components/admin/ShortcutsButton'
import { RaccourcisTrigger } from '@/components/admin/RaccourcisTrigger'
import { AnimatedCounter } from '@/components/ui/AnimatedCounter'

export const dynamic = 'force-dynamic'

const nf = new Intl.NumberFormat('fr-FR')

/** Carte standard du dashboard : fond blanc, bordure fine, titre + action optionnelle. */
function Panel({
  title, subtitle, action, children, className = '',
}: {
  title: string
  subtitle?: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={`bg-white rounded-xl border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)] flex flex-col ${className}`}>
      <header className="flex items-start justify-between gap-3 px-5 pt-4 pb-3 border-b border-slate-100">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-slate-900 tracking-tight">{title}</h2>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </header>
      <div className="flex-1 min-h-0">{children}</div>
    </section>
  )
}

function ViewAll({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:text-emerald-800 hover:underline underline-offset-2 shrink-0"
    >
      Voir tout <ArrowUpRight size={12} />
    </Link>
  )
}

function EmptyBlock({ icon: Icon, title, text, tone = 'slate' }: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  text: string
  tone?: 'slate' | 'emerald'
}) {
  const toneCls = tone === 'emerald'
    ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
    : 'bg-slate-50 text-slate-400 border-slate-200'
  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
      <div className={`w-10 h-10 rounded-lg border flex items-center justify-center mb-3 ${toneCls}`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-sm font-medium text-slate-800">{title}</p>
      <p className="text-xs text-slate-500 mt-1">{text}</p>
    </div>
  )
}

export default async function AdminDashboard() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: roleData } = await supabase
    .from('user_school_roles')
    .select('school_id, full_name')
    .eq('user_id', user.id)
    .limit(1).maybeSingle()

  const schoolId = roleData?.school_id
  if (!schoolId) {
    return <div className="p-8 text-center text-red-500 font-medium">Accès refusé ou école introuvable.</div>
  }

  const { data: schoolData } = await supabase
    .from('schools')
    .select('name, current_academic_year')
    .eq('id', schoolId)
    .maybeSingle()

  const academicYear = schoolData?.current_academic_year || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`

  const { count: studentCount } = await supabase
    .from('students').select('*', { count: 'exact', head: true }).eq('school_id', schoolId)

  const { count: classesCount } = await supabase
    .from('classes').select('*', { count: 'exact', head: true }).eq('school_id', schoolId)

  const { count: staffCount } = await supabase
    .from('user_school_roles').select('*', { count: 'exact', head: true })
    .eq('school_id', schoolId).in('role', ['admin', 'comptable', 'enseignant'])

  // ── Paiements réels groupés par mois ──
  const { data: allPayments } = await supabase
    .from('payments')
    .select('amount, paid_at, student:students(first_name, last_name)')
    .eq('school_id', schoolId)
    .order('paid_at', { ascending: true })

  // ── Total attendu calculé depuis les échéances réelles ──
  const { data: schedulesData } = await supabase
    .from('payment_schedules')
    .select('amount_due, due_date')
    .eq('school_id', schoolId)
  const totalAttendu = schedulesData?.reduce((acc, d) => acc + Number(d.amount_due || 0), 0) || 0

  const totalEncaisse = allPayments?.reduce((acc, p) => acc + Number(p.amount || 0), 0) || 0
  // Plafonné à 100 % : un trop-perçu ne doit pas afficher un taux aberrant
  const recouvRate = totalAttendu > 0 ? Math.min(100, Math.round((totalEncaisse / totalAttendu) * 100)) : 0

  const monthLabels = ['Janv.', 'Févr.', 'Mars', 'Avr.', 'Mai', 'Juin', 'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.']
  const monthlyEncaisse: Record<number, number> = {}
  allPayments?.forEach(p => {
    const month = new Date(p.paid_at).getMonth()
    monthlyEncaisse[month] = (monthlyEncaisse[month] || 0) + Number(p.amount || 0)
  })

  const monthlyAttenduMap: Record<number, number> = {}
  schedulesData?.forEach(s => {
    if (s.due_date) {
      const month = new Date(s.due_date).getMonth()
      monthlyAttenduMap[month] = (monthlyAttenduMap[month] || 0) + Number(s.amount_due || 0)
    }
  })

  // Données réelles uniquement : aucun montant « attendu » inventé pour les mois sans échéance
  const paymentData: PaymentData[] = monthLabels.map((month, i) => ({
    month,
    attendu: monthlyAttenduMap[i] || 0,
    encaisse: monthlyEncaisse[i] || 0,
  }))

  // Date locale (et non UTC) pour ne pas décaler la journée d'appel
  const today = format(new Date(), 'yyyy-MM-dd')
  const { data: attendance } = await supabase.from('attendance').select('status').eq('school_id', schoolId).eq('date', today)

  let pCount = 0, aCount = 0, rCount = 0
  attendance?.forEach(a => {
    if (a.status === 'present') pCount++
    else if (a.status === 'absent') aCount++
    else if (a.status === 'retard') rCount++
  })

  const attendanceData: AttendanceData[] = [
    { name: 'Présents', value: pCount, color: '#059669' },
    { name: 'Absents',  value: aCount, color: '#ef4444' },
    { name: 'Retards',  value: rCount, color: '#f59e0b' },
  ]
  const totalAtt = pCount + aCount + rCount

  const { data: studentsData } = await supabase.from('students').select('classes(name)').eq('school_id', schoolId)
  const classCounts: Record<string, number> = {}
  studentsData?.forEach(s => {
    const cName = (s.classes as any)?.name || 'Sans classe'
    classCounts[cName] = (classCounts[cName] || 0) + 1
  })
  const colors = ['#059669', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899']
  const classDistributionData: ClassDistributionData[] = Object.entries(classCounts).map(([name, value], i) => ({
    name, value, color: colors[i % colors.length]
  }))

  // Impayés : échéances dépassées non soldées, avec les paiements déjà reçus pour calculer le reste dû
  const { data: overdueRaw } = await supabase
    .from('payment_schedules')
    .select('amount_due, due_date, student:students(last_name, first_name, classes(name)), payments(amount)')
    .eq('school_id', schoolId)
    .neq('status', 'paye')
    .lt('due_date', today)
    .order('due_date', { ascending: true })
    .limit(20)

  const overdueDues = (overdueRaw || [])
    .map(row => {
      const paid = ((row.payments as any[]) || []).reduce((acc, p) => acc + Number(p.amount || 0), 0)
      return { ...row, amount: Number(row.amount_due || 0) - paid }
    })
    .filter(row => row.amount > 0)
    .slice(0, 5)

  const recentPayments = allPayments?.slice(-5).reverse() || []

  const schoolName = schoolData?.name || 'Mon École'
  const todayLabel = format(new Date(), "EEEE d MMMM yyyy", { locale: fr })

  const kpis = [
    {
      label: 'Élèves inscrits', icon: Users,
      value: <AnimatedCounter value={studentCount || 0} />,
      hint: `Année ${academicYear}`, tint: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    },
    {
      label: 'Classes', icon: Presentation,
      value: <AnimatedCounter value={classesCount || 0} />,
      hint: 'Classes actives', tint: 'bg-blue-50 text-blue-700 border-blue-100',
    },
    {
      label: 'Personnel', icon: UserCircle,
      value: <AnimatedCounter value={staffCount || 0} />,
      hint: 'Admins, comptables, enseignants', tint: 'bg-violet-50 text-violet-700 border-violet-100',
    },
    {
      label: 'Recouvrement', icon: Wallet,
      value: <AnimatedCounter value={recouvRate} suffix="%" />,
      hint: totalAttendu > 0 ? `${nf.format(totalEncaisse)} / ${nf.format(totalAttendu)} FCFA` : 'Aucune échéance',
      tint: 'bg-amber-50 text-amber-700 border-amber-100',
    },
    {
      label: 'Absences du jour', icon: CalendarOff,
      value: <AnimatedCounter value={aCount} />,
      hint: rCount > 0 ? `+ ${rCount} retard${rCount > 1 ? 's' : ''}` : 'Aucun retard',
      tint: 'bg-rose-50 text-rose-700 border-rose-100',
    },
  ]

  const quickActions = [
    { href: '/admin/eleves/nouveau', label: 'Ajouter un élève', icon: UserPlus },
    { href: '/admin/classes', label: 'Créer une classe', icon: PlusSquare },
    { href: '/admin/finance/echeances', label: 'Générer une échéance', icon: CalendarPlus },
    { href: '/admin/finance/paiements', label: 'Encaisser un paiement', icon: Banknote },
    { href: '/admin/academique/devoirs', label: 'Publier un devoir', icon: BookOpenCheck },
  ]

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-8">

      <OnboardingWizard classesCount={classesCount || 0} staffCount={staffCount || 0} studentCount={studentCount || 0} />

      {/* ── En-tête de page ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-slate-500 capitalize">{todayLabel}</p>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight mt-0.5">{schoolName}</h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/admin/eleves/nouveau"
            className="inline-flex items-center gap-2 h-9 px-3.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium shadow-sm transition-colors"
          >
            <UserPlus size={15} /> Nouvel élève
          </Link>
          <Link
            href="/admin/finance/paiements"
            className="inline-flex items-center gap-2 h-9 px-3.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-sm font-medium transition-colors"
          >
            <Banknote size={15} /> Encaisser
          </Link>
        </div>
      </div>

      {/* ── Indicateurs clés ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        {kpis.map(({ label, icon: Icon, value, hint, tint }) => (
          <div
            key={label}
            className="bg-white rounded-xl border border-slate-200 p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:border-slate-300 transition-colors"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-slate-500">{label}</p>
              <span className={`w-7 h-7 rounded-md border flex items-center justify-center ${tint}`}>
                <Icon size={14} />
              </span>
            </div>
            <p className="text-2xl font-semibold text-slate-900 tabular-nums tracking-tight mt-3">{value}</p>
            <p className="text-[11px] text-slate-500 mt-1 truncate" title={hint}>{hint}</p>
          </div>
        ))}
      </div>

      {/* ── Graphiques principaux ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Panel title="Effectif des classes" subtitle="Répartition des élèves par classe">
          <div className="p-5">
            <ClassBarChart data={classDistributionData} />
          </div>
        </Panel>

        <Panel
          title="Recouvrement des paiements"
          subtitle={`Mensuel · année scolaire ${academicYear}`}
          action={
            <div className="flex items-center gap-3 text-[11px] font-medium text-slate-500">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" />Encaissé</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500" />Attendu</span>
            </div>
          }
        >
          <div className="p-5">
            <PaymentChart data={paymentData} />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-100 px-5 py-4">
            <div className="flex gap-8">
              <div>
                <p className="text-[11px] text-slate-500 font-medium">Total attendu</p>
                <p className="text-base font-semibold text-slate-900 tabular-nums">{nf.format(totalAttendu)} FCFA</p>
              </div>
              <div>
                <p className="text-[11px] text-slate-500 font-medium">Total encaissé</p>
                <p className="text-base font-semibold text-emerald-700 tabular-nums">{nf.format(totalEncaisse)} FCFA</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CircularProgress percentage={recouvRate} />
              <p className="text-[11px] text-slate-500 font-medium leading-tight">Taux de<br />recouvrement</p>
            </div>
          </div>
        </Panel>
      </div>

      {/* ── Widgets secondaires ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <Panel title="Impayés urgents" subtitle="Échéances dépassées" action={<ViewAll href="/admin/finance/echeances" />}>
          {(overdueDues || []).length > 0 ? (
            <ul className="divide-y divide-slate-100">
              {overdueDues?.map((row, i) => {
                const st = row.student as any
                return (
                  <li key={i} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50/70 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-700 border border-rose-100 flex items-center justify-center text-xs font-semibold shrink-0">
                      {st?.last_name?.charAt(0)}{st?.first_name?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{st?.last_name} {st?.first_name?.charAt(0)}.</p>
                      <p className="text-xs text-slate-500">{st?.classes?.name}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-rose-600 tabular-nums">{nf.format(row.amount)} FCFA</p>
                      <p className="text-[11px] text-slate-500">{new Date(row.due_date).toLocaleDateString('fr-FR')}</p>
                    </div>
                  </li>
                )
              })}
            </ul>
          ) : (
            <EmptyBlock icon={CheckCircle2} tone="emerald" title="Aucun impayé en retard" text="Tous les paiements sont à jour." />
          )}
        </Panel>

        <Panel title="Activité récente" subtitle="Derniers paiements enregistrés" action={<ViewAll href="/admin/finance/paiements" />}>
          {recentPayments.length === 0 ? (
            <EmptyBlock icon={Wallet} title="Aucune activité" text="Les paiements apparaîtront ici." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {recentPayments.map((p, i) => {
                const st = p.student as any
                const studentName = st ? `${st.last_name || ''} ${st.first_name?.charAt(0) || ''}.`.trim() : 'Élève'
                return (
                  <li key={i} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50/70 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center shrink-0">
                      <Banknote size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{studentName}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(p.paid_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-emerald-700 tabular-nums shrink-0">+{nf.format(p.amount)} FCFA</p>
                  </li>
                )
              })}
            </ul>
          )}
        </Panel>

        <Panel title="Présences du jour" subtitle={format(new Date(), 'EEEE d MMMM', { locale: fr })}>
          <div className="p-5 flex flex-col sm:flex-row items-center gap-6">
            <div className="w-full sm:w-1/2 shrink-0">
              <AttendancePieChart data={attendanceData} />
            </div>
            <div className="w-full sm:w-1/2 space-y-3">
              {attendanceData.map((d, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                    <span className="text-slate-600">{d.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 tabular-nums">{d.value}</span>
                    <span className="text-[11px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded tabular-nums">
                      {totalAtt > 0 ? Math.round((d.value / totalAtt) * 100) : 0}%
                    </span>
                  </div>
                </div>
              ))}
              <div className="border-t border-slate-100 pt-3 flex justify-between text-sm">
                <span className="text-slate-500">Total relevé</span>
                <span className="font-semibold text-slate-900 tabular-nums">{totalAtt}</span>
              </div>
            </div>
          </div>
        </Panel>

        <Panel title="Répartition par classe" subtitle={`${studentCount || 0} élèves au total`}>
          <div className="p-5 flex flex-col sm:flex-row items-center gap-6">
            <div className="w-full sm:w-1/2 shrink-0">
              <ClassDistributionPieChart data={classDistributionData} />
            </div>
            <div className="w-full sm:w-1/2 space-y-2.5 max-h-[200px] overflow-y-auto pr-1">
              {classDistributionData.length === 0 && (
                <p className="text-xs text-slate-500">Aucune classe renseignée.</p>
              )}
              {classDistributionData.map((d, i) => (
                <div key={i} className="flex items-center justify-between text-sm gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                    <span className="text-slate-600 truncate" title={d.name}>{d.name}</span>
                  </div>
                  <span className="font-semibold text-slate-900 tabular-nums">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Panel>
      </div>

      {/* ── Actions rapides ── */}
      <Panel title="Actions rapides" subtitle="Raccourcis vers les fonctions clés">
        <div className="p-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {quickActions.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="group flex items-center gap-3 p-3 rounded-lg border border-transparent hover:border-slate-200 hover:bg-slate-50 transition-colors"
            >
              <span className="w-9 h-9 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-emerald-700 group-hover:text-white flex items-center justify-center transition-colors shrink-0">
                <Icon size={17} />
              </span>
              <span className="text-xs font-medium text-slate-700 leading-tight">{label}</span>
            </Link>
          ))}
          <RaccourcisTrigger />
        </div>
      </Panel>

      {/* ShortcutsButton en mode modale uniquement — déclenchement via keyboard event du bouton ci-dessus */}
      <ShortcutsButton modalOnly />

      <footer className="pt-5 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500">
        <p>© {new Date().getFullYear()} Scogestia · Tous droits réservés.</p>
        <p className="mt-1 md:mt-0">Année scolaire {academicYear}</p>
      </footer>
    </div>
  )
}
