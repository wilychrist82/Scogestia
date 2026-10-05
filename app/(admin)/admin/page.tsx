import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { 
  Users, Presentation, UserCircle, Wallet, CalendarOff,
  UserPlus, PlusSquare, CalendarPlus,
  Banknote, BookOpenCheck, AlertCircle, ArrowUpRight,
  FileText, Plus
} from 'lucide-react'
import { 
  PaymentChart, AttendancePieChart, ClassDistributionPieChart, ClassBarChart,
  CircularProgress, PaymentData, AttendanceData, ClassDistributionData
} from '@/components/dashboard/DashboardCharts'
import { OnboardingWizard } from '@/components/admin/OnboardingWizard'
import { ShortcutsButton } from '@/components/admin/ShortcutsButton'
import { RaccourcisTrigger } from '@/components/admin/RaccourcisTrigger'
import { AnimatedCounter } from '@/components/ui/AnimatedCounter'
import { AuraHeroBanner } from '@/components/ui/AuraHeroBanner'

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

  const paymentData: PaymentData[] = monthLabels.map((month, i) => ({
    month,
    attendu: monthlyAttenduMap[i] || 0,
    encaisse: monthlyEncaisse[i] || 0,
  }))

  // Date locale (et non UTC) pour ne pas décaler la journée d'appel
  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
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

  const schoolName = schoolData?.name || 'Mon École'
  const todayLabel = format(new Date(), "EEEE d MMMM yyyy", { locale: fr })

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-10 px-1">

      {/* ── ONBOARDING WIZARD ── */}
      <OnboardingWizard classesCount={classesCount || 0} staffCount={staffCount || 0} studentCount={studentCount || 0} />

      {/* ── HERO BANNER AURA COUCHER DE SOLEIL & VAGUE FLUIDE (STYLE RÉFÉRENCE CAPTURE) ── */}
      <AuraHeroBanner
        badge="TABLEAU DE BORD"
        title={schoolName}
        subtitle={`Bienvenue, Wilfried ! Vue d'ensemble de votre établissement · ${todayLabel}`}
        stats={[
          { label: 'Élèves', value: studentCount || 0, color: 'text-white' },
          { label: 'Classes', value: classesCount || 0, color: 'text-white' },
          { label: 'Recouvrement', value: `${recouvRate}%`, color: 'text-emerald-300' },
          { label: 'Absents/jour', value: aCount, color: 'text-rose-300' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/admin/finance/rapports"
              className="inline-flex items-center gap-2 bg-white hover:bg-slate-100 text-slate-900 font-bold px-4 py-2.5 rounded-xl shadow-md transition-all duration-200 text-xs hover:scale-105 active:scale-95"
            >
              <FileText size={15} className="text-slate-700" />
              <span>Rapport</span>
            </Link>
            <Link
              href="/admin/eleves/nouveau"
              className="inline-flex items-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-blue-500/30 transition-all duration-200 text-xs hover:scale-105 active:scale-95"
            >
              <Plus size={15} />
              <span>Nouvel élève</span>
            </Link>
          </div>
        }
      />

      {/* ── KPI BENTO GRID VIBRANT & COLORÉ (STYLE ORIGINAL PRESTIGE) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        
        {/* Élèves — Émeraude */}
        <div className="relative overflow-hidden rounded-[1.25rem] p-[1.5px] bg-gradient-to-br from-emerald-400/30 via-emerald-600/20 to-transparent group">
          <div className="relative bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-900 rounded-[calc(1.25rem-1.5px)] p-5 h-full flex flex-col justify-between gap-3 overflow-hidden shadow-[0_8px_32px_rgba(5,150,105,0.25)]">
            <div className="absolute -right-3 -bottom-3 opacity-[0.08] group-hover:opacity-[0.16] transition-opacity duration-500">
              <Users size={72} className="text-white" />
            </div>
            <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform duration-300">
              <Users size={17} className="text-white" />
            </div>
            <div>
              <p className="text-[28px] font-black text-white leading-none tabular-nums">
                <AnimatedCounter value={studentCount || 0} />
              </p>
              <p className="text-emerald-200/90 text-[11px] font-semibold mt-1.5 leading-tight">Total élèves</p>
            </div>
            <span className="inline-flex items-center gap-1 text-[9.5px] font-bold bg-black/20 text-emerald-200 px-2 py-0.5 rounded-full w-fit border border-white/10">
              Inscrits cette année
            </span>
          </div>
        </div>

        {/* Classes — Bleu */}
        <div className="relative overflow-hidden rounded-[1.25rem] p-[1.5px] bg-gradient-to-br from-blue-400/30 via-blue-600/20 to-transparent group">
          <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 rounded-[calc(1.25rem-1.5px)] p-5 h-full flex flex-col justify-between gap-3 overflow-hidden shadow-[0_8px_32px_rgba(37,99,235,0.25)]">
            <div className="absolute -right-3 -bottom-3 opacity-[0.08] group-hover:opacity-[0.16] transition-opacity duration-500">
              <Presentation size={72} className="text-white" />
            </div>
            <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform duration-300">
              <Presentation size={17} className="text-white" />
            </div>
            <div>
              <p className="text-[28px] font-black text-white leading-none tabular-nums">
                <AnimatedCounter value={classesCount || 0} />
              </p>
              <p className="text-blue-200/90 text-[11px] font-semibold mt-1.5 leading-tight">Classes actives</p>
            </div>
            <span className="inline-flex items-center gap-1 text-[9.5px] font-bold bg-black/20 text-blue-200 px-2 py-0.5 rounded-full w-fit border border-white/10">
              {academicYear}
            </span>
          </div>
        </div>

        {/* Personnel — Violet */}
        <div className="relative overflow-hidden rounded-[1.25rem] p-[1.5px] bg-gradient-to-br from-violet-400/30 via-violet-600/20 to-transparent group">
          <div className="relative bg-gradient-to-br from-violet-600 via-violet-700 to-violet-900 rounded-[calc(1.25rem-1.5px)] p-5 h-full flex flex-col justify-between gap-3 overflow-hidden shadow-[0_8px_32px_rgba(109,40,217,0.25)]">
            <div className="absolute -right-3 -bottom-3 opacity-[0.08] group-hover:opacity-[0.16] transition-opacity duration-500">
              <UserCircle size={72} className="text-white" />
            </div>
            <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform duration-300">
              <UserCircle size={17} className="text-white" />
            </div>
            <div>
              <p className="text-[28px] font-black text-white leading-none tabular-nums">
                <AnimatedCounter value={staffCount || 0} />
              </p>
              <p className="text-violet-200/90 text-[11px] font-semibold mt-1.5 leading-tight">Membres du staff</p>
            </div>
            <span className="inline-flex items-center gap-1 text-[9.5px] font-bold bg-black/20 text-violet-200 px-2 py-0.5 rounded-full w-fit border border-white/10">
              Personnel actif
            </span>
          </div>
        </div>

        {/* Recouvrement — Ambre */}
        <div className="relative overflow-hidden rounded-[1.25rem] p-[1.5px] bg-gradient-to-br from-amber-400/30 via-amber-600/20 to-transparent group">
          <div className="relative bg-gradient-to-br from-amber-500 via-amber-600 to-amber-800 rounded-[calc(1.25rem-1.5px)] p-5 h-full flex flex-col justify-between gap-3 overflow-hidden shadow-[0_8px_32px_rgba(217,119,6,0.25)]">
            <div className="absolute -right-3 -bottom-3 opacity-[0.08] group-hover:opacity-[0.16] transition-opacity duration-500">
              <Wallet size={72} className="text-white" />
            </div>
            <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform duration-300">
              <Wallet size={17} className="text-white" />
            </div>
            <div>
              <p className="text-[28px] font-black text-white leading-none tabular-nums">
                <AnimatedCounter value={recouvRate} suffix="%" />
              </p>
              <p className="text-amber-100/90 text-[11px] font-semibold mt-1.5 leading-tight">Taux recouvrement</p>
            </div>
            <span className="inline-flex items-center gap-1 text-[9.5px] font-bold bg-black/20 text-amber-200 px-2 py-0.5 rounded-full w-fit border border-white/10 truncate max-w-full">
              {totalAttendu > 0 ? `${nf.format(totalEncaisse)} / ${nf.format(totalAttendu)} F` : 'Aucune échéance'}
            </span>
          </div>
        </div>

        {/* Absences — Rose */}
        <div className="relative overflow-hidden rounded-[1.25rem] p-[1.5px] bg-gradient-to-br from-rose-400/30 via-rose-600/20 to-transparent group">
          <div className="relative bg-gradient-to-br from-rose-500 via-rose-600 to-rose-900 rounded-[calc(1.25rem-1.5px)] p-5 h-full flex flex-col justify-between gap-3 overflow-hidden shadow-[0_8px_32px_rgba(225,29,72,0.25)]">
            <div className="absolute -right-3 -bottom-3 opacity-[0.08] group-hover:opacity-[0.16] transition-opacity duration-500">
              <CalendarOff size={72} className="text-white" />
            </div>
            <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform duration-300">
              <CalendarOff size={17} className="text-white" />
            </div>
            <div>
              <p className="text-[28px] font-black text-white leading-none tabular-nums">
                <AnimatedCounter value={aCount} />
              </p>
              <p className="text-rose-200/90 text-[11px] font-semibold mt-1.5 leading-tight">Absences aujourd&apos;hui</p>
            </div>
            <span className="inline-flex items-center gap-1 text-[9.5px] font-bold bg-black/20 text-rose-200 px-2 py-0.5 rounded-full w-fit border border-white/10">
              {rCount > 0 ? `+${rCount} retard${rCount > 1 ? 's' : ''}` : 'Aucun retard'}
            </span>
          </div>
        </div>
      </div>

      {/* ── GRAPHIQUES PRINCIPAUX ROW ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Effectifs des classes (Bar Chart) */}
        <div className="p-1.5 rounded-[1.75rem] bg-slate-50/70 border border-slate-200/70 shadow-sm flex flex-col group">
          <div className="flex-1 rounded-[calc(1.75rem-6px)] overflow-hidden border border-slate-100 bg-white shadow-xs flex flex-col transition-all duration-300 group-hover:shadow-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h3 className="font-bold text-slate-900 text-base tracking-tight">Effectif des classes</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Répartition détaillée des élèves par classe</p>
              </div>
            </div>
            <div className="flex-1 p-6">
              <ClassBarChart data={classDistributionData} />
            </div>
          </div>
        </div>

        {/* Recouvrement paiements */}
        <div className="p-1.5 rounded-[1.75rem] bg-slate-50/70 border border-slate-200/70 shadow-sm flex flex-col group">
          <div className="flex-1 rounded-[calc(1.75rem-6px)] overflow-hidden border border-slate-100 bg-white shadow-xs flex flex-col transition-all duration-300 group-hover:shadow-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h3 className="font-bold text-slate-900 text-base tracking-tight">Recouvrement des paiements</h3>
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
                  <p className="text-xl font-black text-slate-800">{nf.format(totalAttendu)} FCFA</p>
                </div>
                <div>
                  <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest mb-1">Total encaissé</p>
                  <p className="text-xl font-black text-emerald-600">{nf.format(totalEncaisse)} FCFA</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-2xl border border-slate-100 shadow-xs">
                <CircularProgress percentage={recouvRate} />
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-tight">Taux de<br/>recouvrement</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── ALERTS & SECONDARY WIDGETS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Impayés urgents */}
        <div className="p-1.5 rounded-[1.75rem] bg-slate-50/70 border border-slate-200/70 shadow-sm flex flex-col group">
          <div className="flex-1 rounded-[calc(1.75rem-6px)] overflow-hidden border border-slate-100 bg-white shadow-xs flex flex-col transition-all duration-300 group-hover:shadow-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h3 className="font-bold text-slate-900 text-base tracking-tight flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"></span>
                  </span>
                  Impayés urgents
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Échéances dépassées à relancer</p>
              </div>
              <Link href="/admin/finance/impayes" className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 uppercase tracking-widest bg-emerald-50 px-3 py-1.5 rounded-full hover:bg-emerald-100 transition-colors">
                Voir tout <ArrowUpRight size={12} />
              </Link>
            </div>
            <div className="flex-1 p-4 flex flex-col gap-2">
              {(overdueDues || []).length > 0 ? overdueDues?.map((row, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-sm flex-shrink-0 border border-rose-100">
                    {(row.student as any)?.last_name?.charAt(0)}{(row.student as any)?.first_name?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {(row.student as any)?.last_name} {(row.student as any)?.first_name?.charAt(0)}.
                    </p>
                    <p className="text-[11px] text-slate-500">{((row.student as any)?.classes as any)?.name || 'Classe'}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-black text-rose-600 tabular-nums">{nf.format(row.amount)} FCFA</p>
                    <p className="text-[10px] text-slate-400">{new Date(row.due_date).toLocaleDateString('fr-FR')}</p>
                  </div>
                </div>
              )) : (
                <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
                  <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mb-3 border border-emerald-100">
                    <AlertCircle className="w-6 h-6 text-emerald-500" />
                  </div>
                  <p className="font-bold text-slate-900 text-sm">Aucun retard 🎉</p>
                  <p className="text-xs text-slate-500 mt-1">Tous les paiements sont à jour.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Présences du jour */}
        <div className="p-1.5 rounded-[1.75rem] bg-slate-50/70 border border-slate-200/70 shadow-sm flex flex-col group">
          <div className="flex-1 rounded-[calc(1.75rem-6px)] overflow-hidden border border-slate-100 bg-white shadow-xs flex flex-col transition-all duration-300 group-hover:shadow-md">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-slate-900 tracking-tight">Présences du jour</h3>
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
                      <span className="text-sm font-medium text-slate-700">{d.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-slate-900 tabular-nums">{d.value}</span>
                      <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-full font-semibold">
                        {totalAtt > 0 ? Math.round((d.value/totalAtt)*100) : 0}%
                      </span>
                    </div>
                  </div>
                ))}
                <div className="border-t border-slate-100 pt-3 flex justify-between text-sm">
                  <span className="text-slate-500 font-medium">Total relevé</span>
                  <span className="font-bold text-slate-900 tabular-nums">{totalAtt}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Répartition par classe */}
        <div className="p-1.5 rounded-[1.75rem] bg-slate-50/70 border border-slate-200/70 shadow-sm flex flex-col group">
          <div className="flex-1 rounded-[calc(1.75rem-6px)] overflow-hidden border border-slate-100 bg-white shadow-xs flex flex-col transition-all duration-300 group-hover:shadow-md">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-slate-900 tracking-tight">Répartition par classe</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">{studentCount || 0} élèves au total</p>
            </div>
            <div className="p-5 flex flex-col sm:flex-row items-center gap-5">
              <div className="w-full sm:w-1/2 shrink-0">
                <ClassDistributionPieChart data={classDistributionData} />
              </div>
              <div className="w-full sm:w-1/2 space-y-2.5 max-h-[200px] overflow-y-auto pr-1">
                {classDistributionData.length === 0 && (
                  <p className="text-xs text-slate-400 py-4 text-center">Aucune classe renseignée.</p>
                )}
                {classDistributionData.map((d, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                      <span className="text-sm text-slate-700 truncate max-w-[120px]" title={d.name}>{d.name}</span>
                    </div>
                    <span className="text-sm font-bold text-slate-900 tabular-nums">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Activités récentes */}
        <div className="p-1.5 rounded-[1.75rem] bg-slate-50/70 border border-slate-200/70 shadow-sm flex flex-col group">
          <div className="flex-1 rounded-[calc(1.75rem-6px)] overflow-hidden border border-slate-100 bg-white shadow-xs flex flex-col transition-all duration-300 group-hover:shadow-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h3 className="font-bold text-slate-900 tracking-tight">Activités récentes</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Derniers encaissements</p>
              </div>
              <Link href="/admin/finance/paiements" className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 uppercase tracking-widest bg-emerald-50 px-3 py-1.5 rounded-full hover:bg-emerald-100 transition-colors">
                Voir tout <ArrowUpRight size={12} />
              </Link>
            </div>
            <div className="p-5 flex flex-col gap-2.5">
              {recentPayments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mb-3 border border-slate-200">
                    <Wallet className="w-5 h-5 text-slate-400" />
                  </div>
                  <p className="font-bold text-slate-800 text-sm">Aucune activité</p>
                  <p className="text-xs text-slate-400 mt-1">Les encaissements enregistrés apparaîtront ici.</p>
                </div>
              ) : recentPayments.map((p, i) => {
                const studentName = (p.student as any)
                  ? `${(p.student as any).last_name || ''} ${(p.student as any).first_name?.charAt(0) || ''}.`.trim()
                  : 'Élève'
                return (
                  <div key={i} className="flex gap-3 items-center p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0 border border-emerald-100">
                      <Banknote size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{studentName}</p>
                      <p className="text-xs text-emerald-700 font-bold">{nf.format(p.amount)} FCFA</p>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── ACTIONS RAPIDES COLORÉES & INTERACTIVES (INDIVIDUAL COLORS ON HOVER) ── */}
      <div className="p-1.5 rounded-[1.75rem] bg-slate-50/70 border border-slate-200/70 shadow-sm flex flex-col group mt-5">
        <div className="flex-1 rounded-[calc(1.75rem-6px)] overflow-hidden border border-slate-100 bg-white shadow-xs flex flex-col transition-all duration-300 group-hover:shadow-md">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-slate-900 tracking-tight">Actions rapides</h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Raccourcis colorés vers les fonctions clés</p>
          </div>
          <div className="p-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            
            {/* Ajouter un élève — Vert Émeraude */}
            <Link href="/admin/eleves/nouveau" className="group flex flex-col items-center gap-2 p-3.5 rounded-xl hover:bg-emerald-50 hover:border-emerald-200 border border-transparent transition-all duration-200">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white group-hover:scale-110 transition-all duration-200 shadow-xs">
                <UserPlus size={20} />
              </div>
              <span className="text-xs font-bold text-slate-800 text-center leading-tight">Ajouter<br/>un élève</span>
            </Link>

            {/* Créer une classe — Bleu Roi */}
            <Link href="/admin/classes" className="group flex flex-col items-center gap-2 p-3.5 rounded-xl hover:bg-blue-50 hover:border-blue-200 border border-transparent transition-all duration-200">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white group-hover:scale-110 transition-all duration-200 shadow-xs">
                <PlusSquare size={20} />
              </div>
              <span className="text-xs font-bold text-slate-800 text-center leading-tight">Créer<br/>une classe</span>
            </Link>

            {/* Générer échéance — Ambre / Orange */}
            <Link href="/admin/finance/echeances" className="group flex flex-col items-center gap-2 p-3.5 rounded-xl hover:bg-amber-50 hover:border-amber-200 border border-transparent transition-all duration-200">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white group-hover:scale-110 transition-all duration-200 shadow-xs">
                <CalendarPlus size={20} />
              </div>
              <span className="text-xs font-bold text-slate-800 text-center leading-tight">Générer<br/>échéance</span>
            </Link>

            {/* Encaisser paiement — Violet */}
            <Link href="/admin/finance/paiements" className="group flex flex-col items-center gap-2 p-3.5 rounded-xl hover:bg-violet-50 hover:border-violet-200 border border-transparent transition-all duration-200">
              <div className="w-12 h-12 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center group-hover:bg-violet-600 group-hover:text-white group-hover:scale-110 transition-all duration-200 shadow-xs">
                <Banknote size={20} />
              </div>
              <span className="text-xs font-bold text-slate-800 text-center leading-tight">Encaisser<br/>paiement</span>
            </Link>

            {/* Publier un devoir — Rose */}
            <Link href="/admin/academique/devoirs" className="group flex flex-col items-center gap-2 p-3.5 rounded-xl hover:bg-rose-50 hover:border-rose-200 border border-transparent transition-all duration-200">
              <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white group-hover:scale-110 transition-all duration-200 shadow-xs">
                <BookOpenCheck size={20} />
              </div>
              <span className="text-xs font-bold text-slate-800 text-center leading-tight">Publier<br/>un devoir</span>
            </Link>

            {/* Raccourcis / Recherche — Ardoise */}
            <RaccourcisTrigger />
          </div>
        </div>
      </div>

      {/* Modale de raccourcis */}
      <ShortcutsButton modalOnly />

      {/* Footer */}
      <footer className="pt-6 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 font-medium pb-4">
        <p>© {new Date().getFullYear()} Scogestia · Tous droits réservés.</p>
        <p className="mt-1 md:mt-0">Année scolaire {academicYear}</p>
      </footer>
    </div>
  )
}
