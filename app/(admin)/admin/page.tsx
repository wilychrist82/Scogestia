import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { 
  Users, Presentation, UserCircle, Wallet, CalendarOff,
  UserPlus, PlusSquare, CalendarPlus,
  Banknote, BookOpenCheck, AlertCircle, ArrowUpRight,
  FileText, Plus, GraduationCap, BarChart3, TrendingUp,
  ClipboardCheck, PieChart as PieIcon, Zap, Clock
} from 'lucide-react'
import type { PaymentData, AttendanceData, ClassDistributionData } from '@/components/dashboard/DashboardCharts'
import { FluidRecoveryChart, GradientRing, CapsuleBarChart, InteractiveDonut } from '@/components/dashboard/PremiumCharts'
import { DashboardHero, KpiCard, DashPanel, EmptyState } from '@/components/dashboard/DashboardUI'
import { OnboardingWizard } from '@/components/admin/OnboardingWizard'
import { ShortcutsButton } from '@/components/admin/ShortcutsButton'
import { RaccourcisTrigger } from '@/components/admin/RaccourcisTrigger'

export const dynamic = 'force-dynamic'

const nf = new Intl.NumberFormat('fr-FR')

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
  // Plafonné à 100 % : un trop-perçu ne doit pas afficher un taux supérieur à 100%
  const recouvRate = totalAttendu > 0 ? Math.min(100, Math.round((totalEncaisse / totalAttendu) * 100)) : 0

  const monthLabels = ['Janv.', 'Févr.', 'Mars', 'Avr.', 'Mai', 'Juin', 'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.']
  const monthlyEncaisse: Record<number, number> = {}
  allPayments?.forEach(p => {
    if (!p.paid_at) return
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

  // Ordre de l'année scolaire : Septembre → Août
  const academicMonthOrder = [8, 9, 10, 11, 0, 1, 2, 3, 4, 5, 6, 7]
  const paymentData: PaymentData[] = academicMonthOrder.map(i => ({
    month: monthLabels[i],
    attendu: monthlyAttenduMap[i] || 0,
    encaisse: monthlyEncaisse[i] || 0,
  }))
  const currentMonthLabel = monthLabels[new Date().getMonth()]

  // Date locale (et non UTC) pour ne pas décaler la journée d'appel
  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const { data: attendance } = await supabase.from('attendance').select('status').eq('school_id', schoolId).eq('date', today)

  let pCount = 0, aCount = 0, rCount = 0
  attendance?.forEach(a => {
    if (a.status === 'present') pCount++
    else if (a.status === 'absent' || a.status === 'absent_justifie') aCount++
    else if (a.status === 'retard') rCount++
  })

  // Dans le registre scolaire matricule, seuls les absents et retards sont cochés (+/-).
  // Si des absents/retards ont été enregistrés mais aucun présent explicite, on déduit les présents par rapport à l'effectif :
  if (pCount === 0 && (aCount > 0 || rCount > 0) && studentCount) {
    pCount = Math.max(0, studentCount - aCount - rCount)
  }

  const attendanceData: AttendanceData[] = [
    { name: 'Présents', value: pCount, color: '#10b981' },
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
  const classOrderPriority = [
    // Maternelle / Préscolaire
    'tps', 'toute petite section',
    'ps', 'petite section', 'ps1', 'ps2', 'maternelle',
    'ms', 'moyenne section',
    'gs', 'grande section',
    'ci', 'cours d\'initiation',
    // Primaire
    'cp1', 'cp 1', 'cp', 'cours préparatoire 1',
    'cp2', 'cp 2', 'cours préparatoire 2',
    'ce1', 'ce 1', 'cours élémentaire 1',
    'ce2', 'ce 2', 'cours élémentaire 2',
    'cm1', 'cm 1', 'cours moyen 1',
    'cm2', 'cm 2', 'cours moyen 2',
    // Collège
    '6eme', '6ème', '6e', 'sixième',
    '5eme', '5ème', '5e', 'cinquième',
    '4eme', '4ème', '4e', 'quatrième',
    '3eme', '3ème', '3e', 'troisième',
    // Lycée
    '2nde', 'seconde', '2nd', '2nde a', '2nde c', '2nde s',
    '1ere', '1ère', 'première', '1ere a', '1ere c', '1ere d', '1ere s',
    'tle', 'terminale', 'term', 'tle a', 'tle c', 'tle d', 'tle s',
  ]

  function getClassOrder(className: string): number {
    const normalized = className.trim().toLowerCase().replace(/[\s\-_]+/g, ' ')
    const index = classOrderPriority.findIndex(p => {
      return normalized === p || normalized.startsWith(p + ' ') || normalized.startsWith(p)
    })
    return index !== -1 ? index : 999
  }

  const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4', '#e11d48', '#14b8a6', '#6366f1', '#f97316', '#84cc16', '#a855f7']
  const sortedClassEntries = Object.entries(classCounts).sort(([nameA], [nameB]) => {
    const orderA = getClassOrder(nameA)
    const orderB = getClassOrder(nameB)
    if (orderA !== orderB) return orderA - orderB
    return nameA.localeCompare(nameB, 'fr')
  })

  const classDistributionData: ClassDistributionData[] = sortedClassEntries.map(([name, value], i) => ({
    name, value, color: colors[i % colors.length]
  }))

  // Impayés : échéances dépassées non soldées, nettes des paiements reçus
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

  // ── Alertes Pédagogiques réelles : élèves avec moyenne < 10/20 ──
  const [
    { data: secGradesAlert },
    { data: primGradesAlert },
    { data: recentGrades }
  ] = await Promise.all([
    supabase
      .from('secondary_grades')
      .select('student_id, class_score, comp_score, student:students(id, first_name, last_name, classes(name))')
      .eq('school_id', schoolId)
      .limit(300),
    supabase
      .from('primary_grades')
      .select('student_id, score, max_score, student:students(id, first_name, last_name, classes(name))')
      .eq('school_id', schoolId)
      .not('score', 'is', null)
      .limit(300),
    supabase
      .from('grades')
      .select('student_id, score, subject_name, student:students(id, first_name, last_name, classes(name))')
      .eq('school_id', schoolId)
      .not('score', 'is', null)
      .limit(300)
  ])

  const studentScoresMap: Record<string, { student: any, scores: number[] }> = {}
  
  secGradesAlert?.forEach((g: any) => {
    if (!g.student_id || !(g.student as any)) return
    let scoreVal: number | null = null
    if (g.class_score !== null && g.class_score !== undefined && g.comp_score !== null && g.comp_score !== undefined) {
      scoreVal = (Number(g.class_score) + Number(g.comp_score)) / 2
    } else if (g.comp_score !== null && g.comp_score !== undefined) {
      scoreVal = Number(g.comp_score)
    } else if (g.class_score !== null && g.class_score !== undefined) {
      scoreVal = Number(g.class_score)
    }
    if (scoreVal !== null) {
      if (!studentScoresMap[g.student_id]) {
        studentScoresMap[g.student_id] = { student: g.student, scores: [] }
      }
      studentScoresMap[g.student_id].scores.push(Math.round(scoreVal * 10) / 10)
    }
  })

  primGradesAlert?.forEach((g: any) => {
    if (!g.student_id || g.score === null || !(g.student as any)) return
    if (!studentScoresMap[g.student_id]) {
      studentScoresMap[g.student_id] = { student: g.student, scores: [] }
    }
    let max = Number(g.max_score) || 10
    const rawScore = Number(g.score)
    if (rawScore > 10 && max <= 10) {
      max = 20
    }
    const val = Math.min(20, Math.max(0, (rawScore / max) * 20))
    studentScoresMap[g.student_id].scores.push(Math.round(val * 10) / 10)
  })

  recentGrades?.forEach(g => {
    if (!g.student_id || g.score === null || !(g.student as any)) return
    if (!studentScoresMap[g.student_id]) {
      studentScoresMap[g.student_id] = { student: g.student, scores: [] }
    }
    studentScoresMap[g.student_id].scores.push(Number(g.score))
  })

  const lowAverageStudents = Object.entries(studentScoresMap)
    .map(([studentId, data]) => {
      const avg = data.scores.length > 0 
        ? data.scores.reduce((a, b) => a + b, 0) / data.scores.length 
        : 0
      return {
        id: studentId,
        student: data.student,
        average: Math.round(avg * 10) / 10,
        gradeCount: data.scores.length,
      }
    })
    .filter(item => item.average < 10 && item.gradeCount >= 1)
    .sort((a, b) => a.average - b.average)
    .slice(0, 5)

  const alertStudentsCount = Object.values(studentScoresMap).filter(item => {
    const avg = item.scores.reduce((a, b) => a + b, 0) / item.scores.length
    return avg < 10 && item.scores.length >= 1
  }).length

  const schoolName = schoolData?.name || 'Mon École'
  const todayLabel = format(new Date(), "EEEE d MMMM yyyy", { locale: fr })
  const firstName = roleData?.full_name?.split(' ')[0] || 'Wilfried'
  const resteARecouvrer = Math.max(0, totalAttendu - totalEncaisse)
  const presenceRate = totalAtt > 0 ? Math.round((pCount / totalAtt) * 100) : 0
  const absenceRate = totalAtt > 0 ? Math.round((aCount / totalAtt) * 100) : 0
  const overdueTotal = overdueDues.reduce((acc, r) => acc + r.amount, 0)
  const nowMs = Date.now()

  const quickActions = [
    { href: '/admin/eleves/nouveau', label: 'Ajouter un élève', hint: 'Inscription', icon: UserPlus, grad: 'from-emerald-400 to-emerald-600 shadow-emerald-500/30', id: 'add-student' },
    { href: '/admin/classes', label: 'Créer une classe', hint: 'Structure', icon: PlusSquare, grad: 'from-sky-400 to-blue-600 shadow-blue-500/30', id: 'create-class' },
    { href: '/admin/finance/echeances', label: 'Générer échéance', hint: 'Finance', icon: CalendarPlus, grad: 'from-amber-300 to-orange-500 shadow-amber-500/30', id: 'generate-due' },
    { href: '/admin/finance/paiements', label: 'Encaisser paiement', hint: 'Caisse', icon: Banknote, grad: 'from-violet-400 to-purple-600 shadow-violet-500/30', id: 'collect-payment' },
    { href: '/admin/academique/devoirs', label: 'Publier un devoir', hint: 'Pédagogie', icon: BookOpenCheck, grad: 'from-rose-400 to-pink-600 shadow-rose-500/30', id: 'publish-homework' },
  ]

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 px-1 pb-10">

      {/* ── ONBOARDING WIZARD ── */}
      <OnboardingWizard classesCount={classesCount || 0} staffCount={staffCount || 0} studentCount={studentCount || 0} />

      {/* ── HERO AURORA ── */}
      <DashboardHero
        schoolName={schoolName}
        firstName={firstName}
        dateLabel={todayLabel}
        academicYear={academicYear}
        recouvRate={recouvRate}
        stats={[
          { label: 'Présents aujourd’hui', value: totalAtt > 0 ? `${presenceRate}%` : '—', tone: 'emerald' },
          { label: 'Absents / jour', value: aCount, tone: aCount > 0 ? 'rose' : 'white' },
          { label: 'Alertes notes', value: alertStudentsCount, tone: alertStudentsCount > 0 ? 'amber' : 'cyan' },
          { label: 'Impayés en retard', value: overdueDues.length, tone: overdueDues.length > 0 ? 'rose' : 'emerald' },
        ]}
        actions={
          <>
            <Link
              href="/admin/eleves/nouveau"
              id="hero-new-student"
              className="dash-sheen group inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-[13px] font-bold text-slate-900 shadow-[0_10px_30px_-8px_rgba(255,255,255,0.45)] transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.97]"
            >
              <Plus size={15} strokeWidth={2.6} />
              Nouvel élève
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-white transition-transform duration-300 group-hover:translate-x-0.5">
                <ArrowUpRight size={11} />
              </span>
            </Link>
            <Link
              href="/admin/finance/rapports"
              id="hero-report"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/[0.08] px-4 py-2.5 text-[13px] font-semibold text-white backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/[0.16] active:scale-[0.97]"
            >
              <FileText size={15} className="text-sky-300" />
              Rapport
            </Link>
            <Link
              href="/admin/academique/surveillance"
              id="hero-grades-watch"
              title="Surveillance des moyennes inférieures à 10/20"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/[0.08] px-4 py-2.5 text-[13px] font-semibold text-white backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/[0.16] active:scale-[0.97]"
            >
              <GraduationCap size={15} className="text-emerald-300" />
              Suivi des notes
            </Link>
          </>
        }
      />

      {/* ── KPI ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <KpiCard delay={1} href="/admin/eleves" label="Total élèves" value={studentCount || 0} icon={Users} tone="emerald" badge="Inscrits cette année" />
        <KpiCard delay={2} href="/admin/classes" label="Classes actives" value={classesCount || 0} icon={Presentation} tone="blue" badge={academicYear} />
        <KpiCard delay={3} href="/admin/personnel" label="Membres du staff" value={staffCount || 0} icon={UserCircle} tone="indigo" badge="Personnel actif" />
        <KpiCard
          delay={4}
          href="/admin/finance/paiements"
          label="Taux recouvrement"
          value={recouvRate}
          suffix="%"
          icon={Wallet}
          tone="amber"
          badge={totalAttendu > 0 ? `${nf.format(totalEncaisse)} F encaissés` : 'Aucune échéance'}
          progress={recouvRate}
        />
        <KpiCard
          delay={5}
          href="/admin/academique/presences"
          label="Absences aujourd’hui"
          value={aCount}
          icon={CalendarOff}
          tone="rose"
          badge={rCount > 0 ? `+${rCount} retard${rCount > 1 ? 's' : ''}` : 'Aucun retard'}
          progress={absenceRate}
        />
      </div>

      {/* ── SECTION PRINCIPALE 2 COLONNES (STRUCTURE EXACTE DEMANDÉE PAR WILFRIED) ── */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">

        {/* ── COLONNE GAUCHE ── */}
        <div className="flex flex-col gap-6">

          {/* 1. Effectif des classes */}
          <DashPanel
            delay={6}
            icon={BarChart3}
            tone="violet"
            title="Effectif des classes"
            subtitle="Répartition par niveau · Maternelle → Terminale"
            action={{ href: '/admin/classes', label: 'Classes' }}
          >
            <CapsuleBarChart data={classDistributionData} />
          </DashPanel>

          {/* 2. Présences du jour */}
          <DashPanel
            delay={7}
            icon={ClipboardCheck}
            tone="emerald"
            title="Présences du jour"
            subtitle={<span className="capitalize">{format(new Date(), 'EEEE d MMMM', { locale: fr })}</span>}
            action={{ href: '/admin/academique/presences', label: 'Registre' }}
          >
            <div className="flex flex-col items-center gap-6 sm:flex-row">
              <div className="shrink-0">
                <InteractiveDonut data={attendanceData} centerLabel="élèves relevés" emptyLabel="Pas d’appel" size={190} />
              </div>
              <div className="w-full flex-1 space-y-4">
                {attendanceData.map((d, i) => {
                  const pct = totalAtt > 0 ? Math.round((d.value / totalAtt) * 100) : 0
                  return (
                    <div key={i}>
                      <div className="mb-1.5 flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 font-semibold text-slate-700">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color, boxShadow: `0 0 0 3px ${d.color}22` }} />
                          {d.name}
                        </span>
                        <span className="flex items-baseline gap-1.5">
                          <span className="font-black text-slate-900 tabular-nums">{d.value}</span>
                          <span className="text-[11px] font-semibold text-slate-400 tabular-nums">{pct}%</span>
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div className="dash-bar-grow h-full rounded-full" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${d.color}99, ${d.color})` }} />
                      </div>
                    </div>
                  )
                })}
                <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5 text-sm ring-1 ring-inset ring-slate-100">
                  <span className="font-medium text-slate-500">Total relevé</span>
                  <span className="font-black text-slate-900 tabular-nums">{totalAtt}</span>
                </div>
                {totalAtt === 0 && (
                  <p className="text-[11px] text-slate-400 text-center italic pt-1">
                    Aucun appel saisi aujourd&apos;hui (en attente de l&apos;appel des enseignants ou jour chômé).
                  </p>
                )}
              </div>
            </div>
          </DashPanel>

          {/* 3. Activités récentes */}
          <DashPanel
            delay={8}
            icon={Zap}
            tone="cyan"
            title="Activités récentes"
            subtitle="Derniers encaissements enregistrés"
            action={{ href: '/admin/finance/paiements', label: 'Voir tout' }}
          >
            {recentPayments.length === 0 ? (
              <EmptyState icon={Wallet} tone="cyan" title="Aucune activité récente" text="Les encaissements enregistrés apparaîtront ici en temps réel." />
            ) : (
              <ol className="relative space-y-1 before:absolute before:bottom-4 before:left-[19px] before:top-4 before:w-px before:bg-gradient-to-b before:from-emerald-200 before:via-slate-200 before:to-transparent">
                {recentPayments.map((p, i) => {
                  const st = p.student as any
                  const studentName = st ? `${st.last_name || ''} ${st.first_name?.charAt(0) || ''}.`.trim() : 'Élève'
                  return (
                    <li key={i} className="group relative flex items-center gap-3 rounded-2xl p-2 transition-colors hover:bg-slate-50">
                      <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-md shadow-emerald-500/25 ring-4 ring-white">
                        <Banknote size={16} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-slate-900">{studentName}</p>
                        <p className="text-[11px] text-slate-500">{p.paid_at ? format(new Date(p.paid_at), 'd MMM yyyy', { locale: fr }) : '—'}</p>
                      </div>
                      <span className="rounded-lg bg-emerald-50 px-2 py-1 text-xs font-black text-emerald-700 tabular-nums ring-1 ring-inset ring-emerald-600/15">
                        +{nf.format(p.amount)} F
                      </span>
                    </li>
                  )
                })}
              </ol>
            )}
          </DashPanel>

          {/* 4. Surveillance Pédagogique */}
          <DashPanel
            delay={9}
            icon={GraduationCap}
            tone="amber"
            live="amber"
            title="Surveillance pédagogique"
            subtitle="Élèves en difficulté (moyenne < 10/20)"
            action={{ href: '/admin/academique/surveillance', label: 'Module complet' }}
          >
            {lowAverageStudents.length > 0 ? (
              <div className="space-y-1.5">
                {lowAverageStudents.map((item, i) => {
                  const st = item.student as any
                  return (
                    <Link key={i} href={`/admin/eleves/${item.id}`} className="group flex items-center gap-3 rounded-2xl p-2.5 transition-colors hover:bg-amber-50/60">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-xs font-black text-amber-700 ring-1 ring-inset ring-amber-600/15">
                        {st?.last_name?.charAt(0)}{st?.first_name?.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-slate-900">{st?.last_name} {st?.first_name}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <div className="h-1.5 w-full max-w-[140px] overflow-hidden rounded-full bg-slate-100">
                            <div className="dash-bar-grow h-full rounded-full bg-gradient-to-r from-rose-500 to-amber-400" style={{ width: `${(item.average / 20) * 100}%` }} />
                          </div>
                          <span className="truncate text-[11px] text-slate-500">{(st?.classes as any)?.name || 'Classe'}</span>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <span className="inline-flex rounded-lg bg-rose-50 px-2 py-0.5 text-xs font-black text-rose-600 tabular-nums ring-1 ring-inset ring-rose-600/15">{item.average}/20</span>
                        <p className="mt-0.5 text-[10px] text-slate-400">{item.gradeCount} note{item.gradeCount > 1 ? 's' : ''}</p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <EmptyState icon={BookOpenCheck} tone="emerald" title="Excellence pédagogique 🎓" text="Aucun élève sous la moyenne recensé pour le moment." />
            )}
          </DashPanel>
        </div>

        {/* ── COLONNE DROITE ── */}
        <div className="flex flex-col gap-6">

          {/* 1. Recouvrement des paiements */}
          <DashPanel
            delay={6}
            icon={TrendingUp}
            tone="emerald"
            title="Recouvrement des paiements"
            subtitle={`Encaissé vs attendu · Année scolaire ${academicYear}`}
            bodyClassName="p-0"
          >
            <div className="px-5 pb-2 pt-4 sm:px-6">
              <FluidRecoveryChart data={paymentData} currentMonth={currentMonthLabel} />
            </div>
            <div className="mt-2 grid grid-cols-1 items-center gap-4 border-t border-slate-100 bg-gradient-to-b from-slate-50/60 to-white px-5 py-5 sm:grid-cols-[1fr_auto] sm:px-6">
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-2xl bg-white p-3 ring-1 ring-inset ring-slate-100">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Attendu</p>
                  <p className="mt-1 text-base font-black tracking-tight text-slate-900 tabular-nums sm:text-lg">{nf.format(totalAttendu)}<span className="ml-1 text-[10px] font-bold text-slate-400">F</span></p>
                </div>
                <div className="rounded-2xl bg-white p-3 ring-1 ring-inset ring-emerald-100">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-600">Encaissé</p>
                  <p className="mt-1 text-base font-black tracking-tight text-emerald-600 tabular-nums sm:text-lg">{nf.format(totalEncaisse)}<span className="ml-1 text-[10px] font-bold text-emerald-400">F</span></p>
                </div>
                <div className="rounded-2xl bg-white p-3 ring-1 ring-inset ring-rose-100">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-rose-500">Reste</p>
                  <p className="mt-1 text-base font-black tracking-tight text-rose-600 tabular-nums sm:text-lg">{nf.format(resteARecouvrer)}<span className="ml-1 text-[10px] font-bold text-rose-300">F</span></p>
                </div>
              </div>
              <div className="flex items-center justify-center gap-3 sm:justify-end">
                <GradientRing percentage={recouvRate} label="recouvré" />
              </div>
            </div>
          </DashPanel>

          {/* 2. Répartition par classe */}
          <DashPanel
            delay={7}
            icon={PieIcon}
            tone="indigo"
            title="Répartition par classe"
            subtitle={`${studentCount || 0} élèves au total · survolez le graphique`}
          >
            <div className="flex flex-col items-center gap-6 sm:flex-row">
              <div className="shrink-0">
                <InteractiveDonut data={classDistributionData} centerLabel="élèves" emptyLabel="Aucune classe" size={200} />
              </div>
              <div className="scrollbar-light max-h-[220px] w-full flex-1 space-y-2.5 overflow-y-auto pr-2">
                {classDistributionData.length === 0 && (
                  <p className="py-4 text-center text-xs text-slate-400">Aucune classe renseignée.</p>
                )}
                {classDistributionData.map((d, i) => {
                  const pct = (studentCount || 0) > 0 ? Math.round((d.value / (studentCount || 1)) * 100) : 0
                  return (
                    <div key={i} className="group">
                      <div className="mb-1 flex items-center justify-between text-[13px]">
                        <span className="flex min-w-0 items-center gap-2">
                          <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: d.color }} />
                          <span className="truncate font-semibold text-slate-700" title={d.name}>{d.name}</span>
                        </span>
                        <span className="flex items-baseline gap-1.5">
                          <span className="font-black text-slate-900 tabular-nums">{d.value}</span>
                          <span className="w-8 text-right text-[10px] font-semibold text-slate-400 tabular-nums">{pct}%</span>
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div className="dash-bar-grow h-full rounded-full" style={{ width: `${Math.max(pct, 2)}%`, backgroundColor: d.color }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </DashPanel>

          {/* 3. Impayés urgents */}
          <DashPanel
            delay={8}
            icon={AlertCircle}
            tone="rose"
            live="rose"
            title="Impayés urgents"
            subtitle={overdueDues.length > 0 ? `${nf.format(overdueTotal)} FCFA à relancer` : 'Échéances dépassées à relancer'}
            action={{ href: '/admin/finance/impayes', label: 'Voir tout' }}
          >
            {overdueDues.length > 0 ? (
              <div className="space-y-1.5">
                {overdueDues.map((row, i) => {
                  const st = row.student as any
                  const days = Math.max(0, Math.floor((nowMs - new Date(row.due_date).getTime()) / 86_400_000))
                  return (
                    <div key={i} className="group flex items-center gap-3 rounded-2xl p-2.5 transition-colors hover:bg-rose-50/50">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-50 to-rose-100 text-xs font-black text-rose-600 ring-1 ring-inset ring-rose-600/15">
                        {st?.last_name?.charAt(0)}{st?.first_name?.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-slate-900">{st?.last_name} {st?.first_name?.charAt(0)}.</p>
                        <p className="flex items-center gap-1.5 text-[11px] text-slate-500">
                          <span>{(st?.classes as any)?.name || 'Classe'}</span>
                          <span className="h-0.5 w-0.5 rounded-full bg-slate-300" />
                          <span className="inline-flex items-center gap-1 font-semibold text-rose-500"><Clock size={10} />{days} j de retard</span>
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-black text-rose-600 tabular-nums">{nf.format(row.amount)} F</p>
                        <p className="text-[10px] text-slate-400">{new Date(row.due_date).toLocaleDateString('fr-FR')}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <EmptyState icon={AlertCircle} tone="emerald" title="Aucun retard 🎉" text="Tous les paiements sont à jour." />
            )}
          </DashPanel>
        </div>
      </div>

      {/* ── ACTIONS RAPIDES ── */}
      <DashPanel delay={10} icon={Zap} tone="slate" title="Actions rapides" subtitle="Raccourcis vers les fonctions clés">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {quickActions.map(a => (
            <Link
              key={a.id}
              href={a.href}
              id={`quick-action-${a.id}`}
              className="dash-sheen group relative flex flex-col items-start gap-4 overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 transition-all duration-500 hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_18px_36px_-16px_rgba(15,23,42,0.25)]"
            >
              <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg ${a.grad} transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110`}>
                <a.icon size={19} />
              </div>
              <div>
                <p className="text-[13px] font-bold leading-tight text-slate-900">{a.label}</p>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">{a.hint}</p>
              </div>
              <ArrowUpRight size={14} className="absolute right-3 top-3 text-slate-300 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-slate-700" />
            </Link>
          ))}
          <RaccourcisTrigger />
        </div>
      </DashPanel>

      {/* Modale de raccourcis */}
      <ShortcutsButton modalOnly />

      {/* Footer */}
      <footer className="flex flex-col items-center justify-between border-t border-slate-200/70 pb-4 pt-6 text-xs font-medium text-slate-500 md:flex-row">
        <p>© {new Date().getFullYear()} Scogestia · Tous droits réservés.</p>
        <p className="mt-1 flex items-center gap-2 md:mt-0">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Année scolaire {academicYear}
        </p>
      </footer>
    </div>
  )
}
