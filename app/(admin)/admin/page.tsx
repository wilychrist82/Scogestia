import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { 
  Users, Presentation, UserCircle, Wallet, CalendarOff,
  UserPlus, PlusSquare, CalendarPlus,
  Banknote, BookOpenCheck, AlertCircle
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
    .select('amount, created_at, student:students(first_name, last_name)')
    .eq('school_id', schoolId)
    .order('created_at', { ascending: true })

  // ── Total attendu calculé depuis les échéances réelles ──
  const { data: schedulesData } = await supabase
    .from('payment_schedules')
    .select('amount_due, due_date')
    .eq('school_id', schoolId)
  const totalAttendu = schedulesData?.reduce((acc, d) => acc + Number(d.amount_due || 0), 0) || 0

  let totalEncaisse = allPayments?.reduce((acc, p) => acc + (p.amount || 0), 0) || 0
  let recouvRate = totalAttendu > 0 ? Math.round((totalEncaisse / totalAttendu) * 100) : 0

  // Grouper les paiements et échéances par mois
  const monthLabels = ['Janv.', 'Févr.', 'Mars', 'Avr.', 'Mai', 'Juin', 'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.']
  const monthlyEncaisse: Record<number, number> = {}
  allPayments?.forEach(p => {
    const month = new Date(p.created_at).getMonth() // 0-indexed
    monthlyEncaisse[month] = (monthlyEncaisse[month] || 0) + (p.amount || 0)
  })

  const monthlyAttenduMap: Record<number, number> = {}
  schedulesData?.forEach(s => {
    if (s.due_date) {
      const month = new Date(s.due_date).getMonth()
      monthlyAttenduMap[month] = (monthlyAttenduMap[month] || 0) + Number(s.amount_due || 0)
    }
  })

  // Calculer le montant attendu mensuel (réparti par mois ou moyenne totale / 12)
  const avgMonthlyAttendu = totalAttendu > 0 ? Math.round(totalAttendu / 12) : 0

  const paymentData: PaymentData[] = monthLabels.map((month, i) => ({
    month,
    attendu: monthlyAttenduMap[i] || avgMonthlyAttendu,
    encaisse: monthlyEncaisse[i] || 0,
  }))

  const today = new Date().toISOString().split('T')[0]
  const { data: attendance } = await supabase.from('attendance').select('status').eq('school_id', schoolId).eq('date', today)

  let pCount = 0, aCount = 0, rCount = 0
  const hasAttendanceData = attendance && attendance.length > 0
  if (hasAttendanceData) {
    attendance.forEach(a => {
      if (a.status === 'present') pCount++
      else if (a.status === 'absent') aCount++
      else if (a.status === 'retard') rCount++
    })
  }

  const attendanceData: AttendanceData[] = [
    { name: 'Présents', value: pCount, color: '#059669' },
    { name: 'Absents',  value: aCount, color: '#ef4444' },
    { name: 'Retards',  value: rCount, color: '#f59e0b' },
  ]
  const totalAtt = pCount + aCount + rCount

  const { data: studentsData } = await supabase.from('students').select('classes(name)').eq('school_id', schoolId)
  const classCounts: Record<string, number> = {}
  if (studentsData) {
    studentsData.forEach(s => {
      const cName = (s.classes as any)?.name || 'Inconnu'
      classCounts[cName] = (classCounts[cName] || 0) + 1
    })
  }
  const colors = ['#059669','#3b82f6','#8b5cf6','#f59e0b','#ec4899']
  const classDistributionData: ClassDistributionData[] = Object.entries(classCounts).map(([name, value], i) => ({
    name, value, color: colors[i % colors.length]
  }))
  // Pas de fausses données — on affiche un état vide si aucune classe

  const { data: overdueDues } = await supabase
    .from('dues')
    .select('amount, due_date, student:students(last_name, first_name, classes(name))')
    .eq('school_id', schoolId).eq('status', 'en_retard')
    .order('due_date', { ascending: true }).limit(5)

  // Derniers paiements avec info élève
  const recentPayments = allPayments?.slice(-5).reverse() || []

  const schoolName = schoolData?.name || 'Mon École'
  const todayLabel = format(new Date(), "EEEE d MMMM yyyy", { locale: fr })



  return (
    <div className="space-y-5 max-w-[1400px] mx-auto pb-10 px-1">

      {/* ── ONBOARDING WIZARD ── */}
      <OnboardingWizard classesCount={classesCount || 0} staffCount={staffCount || 0} studentCount={studentCount || 0} />

      {/* ── HERO HEADER PREMIUM ── */}
      <div className="relative overflow-hidden rounded-[1.75rem] bg-[#070b14] min-h-[160px] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xl border border-white/[0.06] ring-1 ring-inset ring-white/[0.04]">
        {/* Orbes animées */}
        <div className="absolute -top-16 -left-16 w-80 h-80 bg-emerald-500/15 rounded-full blur-[100px] pointer-events-none animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute -bottom-12 right-10 w-64 h-64 bg-violet-500/12 rounded-full blur-[80px] pointer-events-none animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-32 bg-cyan-500/5 rounded-full blur-[60px] pointer-events-none" />
        
        {/* Contenu principal */}
        <div className="relative z-10 p-6 sm:p-8">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400">Tableau de bord</p>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight tracking-tight">{schoolName}</h1>
          <p className="text-white/40 text-sm mt-1.5 capitalize font-medium">{todayLabel}</p>
        </div>

        {/* Stats rapides en haut à droite */}
        <div className="relative z-10 flex items-center gap-2.5 flex-wrap p-6 sm:p-8 sm:pl-0">
          {[
            { label: 'Élèves', value: studentCount || 0, color: 'text-white' },
            { label: 'Classes', value: classesCount || 0, color: 'text-white' },
            { label: 'Recouvrement', value: `${recouvRate}%`, color: 'text-emerald-400' },
            { label: 'Absents/jour', value: aCount, color: 'text-rose-400' },
          ].map((stat, i) => (
            <div key={i} className="bg-white/[0.04] border border-white/[0.08] hover:border-white/20 rounded-2xl px-4 py-3 text-center transition-all duration-500 group cursor-default"
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

      {/* ── KPI BENTO GRID PREMIUM ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        
        {/* Élèves — Emerald */}
        <div className="relative overflow-hidden rounded-[1.25rem] p-[1.5px] bg-gradient-to-br from-emerald-400/30 via-emerald-600/20 to-transparent group">
          <div className="relative bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-900 rounded-[calc(1.25rem-1.5px)] p-5 h-full flex flex-col gap-3 overflow-hidden"
            style={{ boxShadow: '0 8px 32px rgba(5,150,105,0.25), inset 0 1px 1px rgba(255,255,255,0.15)' }}>
            <div className="absolute -right-3 -bottom-3 opacity-8 group-hover:opacity-[0.15] transition-opacity duration-500">
              <Users size={72} className="text-white" />
            </div>
            <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform duration-500"
              style={{ transitionTimingFunction: 'cubic-bezier(0.32,0.72,0,1)' }}>
              <Users size={17} className="text-white" />
            </div>
            <div>
              <p className="text-[28px] font-black text-white leading-none tabular-nums">
                <AnimatedCounter value={studentCount || 0} />
              </p>
              <p className="text-emerald-200/80 text-[11px] font-semibold mt-1.5 leading-tight">Total élèves</p>
            </div>
            <span className="inline-flex items-center gap-1 text-[9.5px] font-bold bg-black/20 text-emerald-200 px-2 py-0.5 rounded-full w-fit border border-white/10">
              Inscrits cette année
            </span>
          </div>
        </div>

        {/* Classes — Blue */}
        <div className="relative overflow-hidden rounded-[1.25rem] p-[1.5px] bg-gradient-to-br from-blue-400/30 via-blue-600/20 to-transparent group">
          <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 rounded-[calc(1.25rem-1.5px)] p-5 h-full flex flex-col gap-3 overflow-hidden"
            style={{ boxShadow: '0 8px 32px rgba(37,99,235,0.25), inset 0 1px 1px rgba(255,255,255,0.15)' }}>
            <div className="absolute -right-3 -bottom-3 opacity-8 group-hover:opacity-[0.15] transition-opacity duration-500">
              <Presentation size={72} className="text-white" />
            </div>
            <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform duration-500"
              style={{ transitionTimingFunction: 'cubic-bezier(0.32,0.72,0,1)' }}>
              <Presentation size={17} className="text-white" />
            </div>
            <div>
              <p className="text-[28px] font-black text-white leading-none tabular-nums">
                <AnimatedCounter value={classesCount || 0} />
              </p>
              <p className="text-blue-200/80 text-[11px] font-semibold mt-1.5 leading-tight">Classes actives</p>
            </div>
            <span className="inline-flex items-center gap-1 text-[9.5px] font-bold bg-black/20 text-blue-200 px-2 py-0.5 rounded-full w-fit border border-white/10">
              {academicYear}
            </span>
          </div>
        </div>

        {/* Personnel — Violet */}
        <div className="relative overflow-hidden rounded-[1.25rem] p-[1.5px] bg-gradient-to-br from-violet-400/30 via-violet-600/20 to-transparent group">
          <div className="relative bg-gradient-to-br from-violet-600 via-violet-700 to-violet-900 rounded-[calc(1.25rem-1.5px)] p-5 h-full flex flex-col gap-3 overflow-hidden"
            style={{ boxShadow: '0 8px 32px rgba(109,40,217,0.25), inset 0 1px 1px rgba(255,255,255,0.15)' }}>
            <div className="absolute -right-3 -bottom-3 opacity-8 group-hover:opacity-[0.15] transition-opacity duration-500">
              <UserCircle size={72} className="text-white" />
            </div>
            <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform duration-500"
              style={{ transitionTimingFunction: 'cubic-bezier(0.32,0.72,0,1)' }}>
              <UserCircle size={17} className="text-white" />
            </div>
            <div>
              <p className="text-[28px] font-black text-white leading-none tabular-nums">
                <AnimatedCounter value={staffCount || 0} />
              </p>
              <p className="text-violet-200/80 text-[11px] font-semibold mt-1.5 leading-tight">Membres du staff</p>
            </div>
            <span className="inline-flex items-center gap-1 text-[9.5px] font-bold bg-black/20 text-violet-200 px-2 py-0.5 rounded-full w-fit border border-white/10">
              Personnel actif
            </span>
          </div>
        </div>

        {/* Recouvrement — Amber */}
        <div className="relative overflow-hidden rounded-[1.25rem] p-[1.5px] bg-gradient-to-br from-amber-400/30 via-amber-600/20 to-transparent group">
          <div className="relative bg-gradient-to-br from-amber-500 via-amber-600 to-amber-800 rounded-[calc(1.25rem-1.5px)] p-5 h-full flex flex-col gap-3 overflow-hidden"
            style={{ boxShadow: '0 8px 32px rgba(217,119,6,0.25), inset 0 1px 1px rgba(255,255,255,0.15)' }}>
            <div className="absolute -right-3 -bottom-3 opacity-8 group-hover:opacity-[0.15] transition-opacity duration-500">
              <Wallet size={72} className="text-white" />
            </div>
            <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform duration-500"
              style={{ transitionTimingFunction: 'cubic-bezier(0.32,0.72,0,1)' }}>
              <Wallet size={17} className="text-white" />
            </div>
            <div>
              <p className="text-[28px] font-black text-white leading-none tabular-nums">
                <AnimatedCounter value={recouvRate} suffix="%" />
              </p>
              <p className="text-amber-100/80 text-[11px] font-semibold mt-1.5 leading-tight">Taux recouvrement</p>
            </div>
            <span className="inline-flex items-center gap-1 text-[9.5px] font-bold bg-black/20 text-amber-200 px-2 py-0.5 rounded-full w-fit border border-white/10">
              {totalAttendu > 0 ? `${new Intl.NumberFormat('fr-FR').format(totalAttendu)} FCFA` : 'Aucune échéance'}
            </span>
          </div>
        </div>

        {/* Absences — Rose */}
        <div className="relative overflow-hidden rounded-[1.25rem] p-[1.5px] bg-gradient-to-br from-rose-400/30 via-rose-600/20 to-transparent group">
          <div className="relative bg-gradient-to-br from-rose-500 via-rose-600 to-rose-900 rounded-[calc(1.25rem-1.5px)] p-5 h-full flex flex-col gap-3 overflow-hidden"
            style={{ boxShadow: '0 8px 32px rgba(225,29,72,0.25), inset 0 1px 1px rgba(255,255,255,0.15)' }}>
            <div className="absolute -right-3 -bottom-3 opacity-8 group-hover:opacity-[0.15] transition-opacity duration-500">
              <CalendarOff size={72} className="text-white" />
            </div>
            <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform duration-500"
              style={{ transitionTimingFunction: 'cubic-bezier(0.32,0.72,0,1)' }}>
              <CalendarOff size={17} className="text-white" />
            </div>
            <div>
              <p className="text-[28px] font-black text-white leading-none tabular-nums">
                <AnimatedCounter value={aCount} />
              </p>
              <p className="text-rose-200/80 text-[11px] font-semibold mt-1.5 leading-tight">Absences aujourd'hui</p>
            </div>
            <span className="inline-flex items-center gap-1 text-[9.5px] font-bold bg-black/20 text-rose-200 px-2 py-0.5 rounded-full w-fit border border-white/10">
              {rCount > 0 ? `+${rCount} retards` : 'Aucun retard'}
            </span>
          </div>
        </div>
      </div>



      {/* ── MAIN CHARTS ROW ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        
        {/* Effectifs des classes (Bar Chart) */}
        <div className="p-1.5 rounded-[1.75rem] bg-slate-50/50 border border-slate-200/50 shadow-sm flex flex-col group">
          <div className="flex-1 rounded-[calc(1.75rem-6px)] overflow-hidden border border-slate-100 bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] flex flex-col transition-all duration-300 group-hover:shadow-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h3 className="font-black text-slate-800 text-base tracking-tight">Effectif des classes</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Répartition détaillée des élèves</p>
              </div>
            </div>
            <div className="flex-1 p-6">
              <ClassBarChart data={classDistributionData} />
            </div>
          </div>
        </div>

        {/* Recouvrement paiements */}
        <div className="p-1.5 rounded-[1.75rem] bg-slate-50/50 border border-slate-200/50 shadow-sm flex flex-col group">
          <div className="flex-1 rounded-[calc(1.75rem-6px)] overflow-hidden border border-slate-100 bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] flex flex-col transition-all duration-300 group-hover:shadow-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h3 className="font-black text-slate-800 text-base tracking-tight">Recouvrement des paiements</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Mensuel — Année scolaire {academicYear}</p>
              </div>
              <div className="flex items-center gap-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shadow-[0_0_8px_rgba(16,185,129,0.4)]"/>Encaissé</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block shadow-[0_0_8px_rgba(244,63,94,0.4)]"/>Attendu</span>
              </div>
            </div>
          <div className="flex-1 p-6">
            <PaymentChart data={paymentData} />
          </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-t border-slate-100 px-6 py-4 gap-4 bg-slate-50/30">
              <div className="flex gap-10">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Total attendu</p>
                  <p className="text-xl font-black text-slate-700">{new Intl.NumberFormat('fr-FR').format(totalAttendu)} FCFA</p>
                </div>
                <div>
                  <p className="text-[10px] text-emerald-600/70 font-bold uppercase tracking-widest mb-1">Total encaissé</p>
                  <p className="text-xl font-black text-emerald-600">{new Intl.NumberFormat('fr-FR').format(totalEncaisse)} FCFA</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-2xl border border-slate-100 shadow-sm">
                <CircularProgress percentage={recouvRate} />
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-tight">Taux de<br/>recouvrement</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── ALERTS & SECONDARY WIDGETS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">

        {/* Impayés urgents */}
        <div className="p-1.5 rounded-[1.75rem] bg-slate-50/50 border border-slate-200/50 shadow-sm flex flex-col group">
          <div className="flex-1 rounded-[calc(1.75rem-6px)] overflow-hidden border border-slate-100 bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] flex flex-col transition-all duration-300 group-hover:shadow-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h3 className="font-black text-slate-800 text-base tracking-tight flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"></span>
                  </span>
                  Impayés urgents
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Échéances dépassées</p>
              </div>
              <Link href="/admin/finance/echeances" className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 uppercase tracking-widest bg-emerald-50 px-3 py-1.5 rounded-full hover:bg-emerald-100 transition-colors">Voir tout</Link>
            </div>
          <div className="flex-1 p-4 flex flex-col gap-3">
            {(overdueDues || []).length > 0 ? overdueDues?.map((row, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[var(--color-surface-container-low)] transition-colors">
                <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-black text-sm flex-shrink-0 border border-red-100">
                  {(row.student as any)?.last_name?.charAt(0)}{(row.student as any)?.first_name?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[var(--color-on-surface)] truncate">
                    {(row.student as any)?.last_name} {(row.student as any)?.first_name?.charAt(0)}.
                  </p>
                  <p className="text-[11px] text-[var(--color-on-surface-variant)]">{((row.student as any)?.classes as any)?.name}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-black text-red-600">{new Intl.NumberFormat('fr-FR').format(row.amount)}</p>
                  <p className="text-[10px] text-[var(--color-on-surface-variant)]">{new Date(row.due_date).toLocaleDateString('fr-FR')}</p>
                </div>
              </div>
            )) : (
              <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mb-3 border border-emerald-100">
                  <AlertCircle className="w-6 h-6 text-emerald-500" />
                </div>
                <p className="font-bold text-[var(--color-on-surface)] text-sm">Aucun retard 🎉</p>
                <p className="text-xs text-[var(--color-on-surface-variant)] mt-1">Tous les paiements sont à jour.</p>
              </div>
            )}
          </div>
        </div>
        </div>

        {/* Présences du jour */}
        <div className="p-1.5 rounded-[1.75rem] bg-slate-50/50 border border-slate-200/50 shadow-sm flex flex-col group">
          <div className="flex-1 rounded-[calc(1.75rem-6px)] overflow-hidden border border-slate-100 bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] flex flex-col transition-all duration-300 group-hover:shadow-md">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-black text-slate-800 tracking-tight">Présences du jour</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5 capitalize">{format(new Date(), 'EEEE d MMMM', { locale: fr })}</p>
            </div>
          <div className="p-5 flex flex-col sm:flex-row items-center gap-5">
            <div className="w-full sm:w-1/2 shrink-0">
              <AttendancePieChart data={attendanceData} />
            </div>
            <div className="w-full sm:w-1/2 space-y-3">
              {attendanceData.map((d, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                    <span className="text-sm text-[var(--color-on-surface)]">{d.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-black text-[var(--color-on-surface)]">{d.value}</span>
                    <span className="text-[10px] text-[var(--color-on-surface-variant)] bg-[var(--color-surface-container-low)] px-1.5 py-0.5 rounded-full font-semibold">
                      {totalAtt > 0 ? Math.round((d.value/totalAtt)*100) : 0}%
                    </span>
                  </div>
                </div>
              ))}
              <div className="border-t border-[var(--color-outline-variant)] pt-3 flex justify-between text-sm">
                <span className="text-[var(--color-on-surface-variant)] font-medium">Total relevé</span>
                <span className="font-black text-[var(--color-on-surface)]">{totalAtt}</span>
              </div>
            </div>
          </div>
        </div>
        </div>

        {/* Répartition par classe */}
        <div className="p-1.5 rounded-[1.75rem] bg-slate-50/50 border border-slate-200/50 shadow-sm flex flex-col group">
          <div className="flex-1 rounded-[calc(1.75rem-6px)] overflow-hidden border border-slate-100 bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] flex flex-col transition-all duration-300 group-hover:shadow-md">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-black text-slate-800 tracking-tight">Répartition par classe</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">{studentCount || 0} élèves au total</p>
            </div>
          <div className="p-5 flex flex-col sm:flex-row items-center gap-5">
            <div className="w-full sm:w-1/2 shrink-0">
              <ClassDistributionPieChart data={classDistributionData} />
            </div>
            <div className="w-full sm:w-1/2 space-y-2.5 max-h-[200px] overflow-y-auto pr-1">
              {classDistributionData.map((d, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                    <span className="text-sm text-[var(--color-on-surface)] truncate max-w-[80px]" title={d.name}>{d.name}</span>
                  </div>
                  <span className="text-sm font-black text-[var(--color-on-surface)]">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        </div>

        {/* Activités récentes */}
        <div className="p-1.5 rounded-[1.75rem] bg-slate-50/50 border border-slate-200/50 shadow-sm flex flex-col group">
          <div className="flex-1 rounded-[calc(1.75rem-6px)] overflow-hidden border border-slate-100 bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] flex flex-col transition-all duration-300 group-hover:shadow-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h3 className="font-black text-slate-800 tracking-tight">Activités récentes</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Derniers paiements</p>
              </div>
              <Link href="/admin/finance/paiements" className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 uppercase tracking-widest bg-emerald-50 px-3 py-1.5 rounded-full hover:bg-emerald-100 transition-colors">Voir tout</Link>
            </div>
          <div className="p-5 flex flex-col gap-3">
            {recentPayments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-12 h-12 bg-[var(--color-surface-container-low)] rounded-2xl flex items-center justify-center mb-3 border border-[var(--color-outline-variant)]">
                  <Wallet className="w-5 h-5 text-[var(--color-on-surface-variant)]" />
                </div>
                <p className="font-bold text-[var(--color-on-surface)] text-sm">Aucune activité</p>
                <p className="text-xs text-[var(--color-on-surface-variant)] mt-1">Les paiements apparaîtront ici.</p>
              </div>
            ) : recentPayments.map((p, i) => {
              const studentName = (p.student as any)
                ? `${(p.student as any).last_name || ''} ${(p.student as any).first_name?.charAt(0) || ''}.`.trim()
                : 'Élève'
              return (
                <div key={i} className="flex gap-3 items-center p-2.5 rounded-xl hover:bg-[var(--color-surface-container-low)] transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0 border border-emerald-100">
                    <Banknote size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[var(--color-on-surface)] truncate">{studentName}</p>
                    <p className="text-xs text-emerald-700 font-semibold">{new Intl.NumberFormat('fr-FR').format(p.amount)} FCFA</p>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                </div>
              )
            })}
          </div>
        </div>
        </div>
      </div>


      {/* ── ACTIONS RAPIDES ── */}
      <div className="p-1.5 rounded-[1.75rem] bg-slate-50/50 border border-slate-200/50 shadow-sm flex flex-col group mt-5">
        <div className="flex-1 rounded-[calc(1.75rem-6px)] overflow-hidden border border-slate-100 bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] flex flex-col transition-all duration-300 group-hover:shadow-md">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-black text-slate-800 tracking-tight">Actions rapides</h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Raccourcis vers les fonctions clés</p>
          </div>
        <div className="p-5 grid grid-cols-3 sm:grid-cols-6 gap-3">
          
          <Link href="/admin/eleves/nouveau" className="group flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-emerald-50 hover:border-emerald-200 border border-transparent transition-all duration-200">
            <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white group-hover:scale-110 transition-all duration-200 shadow-sm">
              <UserPlus size={20} />
            </div>
            <span className="text-[11px] font-bold text-[var(--color-on-surface)] text-center leading-tight">Ajouter<br/>un élève</span>
          </Link>

          <Link href="/admin/classes" className="group flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-blue-50 hover:border-blue-200 border border-transparent transition-all duration-200">
            <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white group-hover:scale-110 transition-all duration-200 shadow-sm">
              <PlusSquare size={20} />
            </div>
            <span className="text-[11px] font-bold text-[var(--color-on-surface)] text-center leading-tight">Créer<br/>une classe</span>
          </Link>

          <Link href="/admin/finance/echeances" className="group flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-amber-50 hover:border-amber-200 border border-transparent transition-all duration-200">
            <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white group-hover:scale-110 transition-all duration-200 shadow-sm">
              <CalendarPlus size={20} />
            </div>
            <span className="text-[11px] font-bold text-[var(--color-on-surface)] text-center leading-tight">Générer<br/>échéance</span>
          </Link>

          <Link href="/admin/finance/paiements" className="group flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-violet-50 hover:border-violet-200 border border-transparent transition-all duration-200">
            <div className="w-11 h-11 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center group-hover:bg-violet-600 group-hover:text-white group-hover:scale-110 transition-all duration-200 shadow-sm">
              <Banknote size={20} />
            </div>
            <span className="text-[11px] font-bold text-[var(--color-on-surface)] text-center leading-tight">Encaisser<br/>paiement</span>
          </Link>

          <Link href="/admin/academique/devoirs" className="group flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-rose-50 hover:border-rose-200 border border-transparent transition-all duration-200">
            <div className="w-11 h-11 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white group-hover:scale-110 transition-all duration-200 shadow-sm">
              <BookOpenCheck size={20} />
            </div>
            <span className="text-[11px] font-bold text-[var(--color-on-surface)] text-center leading-tight">Publier<br/>un devoir</span>
          </Link>

          <RaccourcisTrigger />
        </div>
        </div>
      </div>
      {/* ShortcutsButton en mode modale uniquement — déclenchement via keyboard event du bouton ci-dessus */}
      <ShortcutsButton modalOnly />


      <footer className="pt-6 border-t border-[var(--color-outline-variant)] flex flex-col md:flex-row items-center justify-between text-xs text-[var(--color-on-surface-variant)] font-medium pb-4">
        <p>© {new Date().getFullYear()} Scogestia · Tous droits réservés.</p>
        <p className="mt-1 md:mt-0">Année scolaire {academicYear}</p>
      </footer>
    </div>
  )
}
