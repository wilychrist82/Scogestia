import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { DownloadReceiptButton } from '@/components/parent/DownloadReceiptButton'
import { resolveStudentId } from '@/lib/parent-utils'
import { ChildSwitchBar } from '@/components/parent/ChildSwitchBar'
import { UserX, AlertCircle, ArrowLeft, Wallet, Calendar, Receipt, CreditCard, Clock, Building2, CheckCircle2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ParentPaiementsPage({
  searchParams,
}: {
  searchParams: Promise<{ child?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/connexion')

  const resolvedSearchParams = await searchParams
  const { childrenList, selectedChildId } = await resolveStudentId(supabase, user.id, resolvedSearchParams)

  if (!selectedChildId) {
    return (
      <div className="p-6 text-center flex flex-col items-center justify-center min-h-[70vh] animate-in fade-in slide-in-from-bottom-2">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <UserX className="w-8 h-8 text-slate-400" />
        </div>
        <h2 className="text-xl font-bold text-[var(--color-on-surface)] mb-2">Aucun élève lié</h2>
        <p className="text-[var(--color-on-surface-variant)] mb-6">Vous n&apos;avez aucun enfant lié à votre compte.</p>
        <Link href="/parent" className="bg-[var(--color-primary)] text-white px-6 py-2 rounded-full font-semibold">
          Retour à l&apos;accueil
        </Link>
      </div>
    )
  }

  const childId = selectedChildId

  // Vérifier le lien parent-enfant et obtenir l'école
  const { data: link } = await supabase
    .from('parent_student_links')
    .select('student_id, school_id')
    .eq('parent_user_id', user.id)
    .eq('student_id', childId)
    .single()

  if (!link) {
    return (
      <div className="p-6 text-center flex flex-col items-center justify-center min-h-[70vh] animate-in fade-in slide-in-from-bottom-2">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-red-600 mb-2">Accès refusé</h2>
        <p className="text-[var(--color-on-surface-variant)] mb-6">Vous n&apos;avez pas l&apos;autorisation de voir les informations de cet élève.</p>
        <Link href="/parent" className="bg-[var(--color-primary)] text-white px-6 py-2 rounded-full font-semibold">
          Retour à l&apos;accueil
        </Link>
      </div>
    )
  }

  // Récupérer le nom de l'école
  const { data: school } = await supabase
    .from('schools')
    .select('name, city')
    .eq('id', link.school_id)
    .single()

  // Récupérer les informations complètes de l'élève
  const { data: student } = await supabase
    .from('students')
    .select('first_name, last_name, class_id, classes(name)')
    .eq('id', childId)
    .single()

  if (!student) {
    return (
      <div className="p-6 text-center">
        <p>Informations de l&apos;élève introuvables.</p>
      </div>
    )
  }

  // Récupérer les échéanciers
  const { data: schedules } = await supabase
    .from('payment_schedules')
    .select('*')
    .eq('student_id', childId)
    .order('due_date', { ascending: true })

  // Récupérer les paiements effectués
  const { data: payments } = await supabase
    .from('payments')
    .select('*')
    .eq('student_id', childId)
    .order('paid_at', { ascending: false })

  const safeSchedules = schedules || []
  const safePayments = payments || []

  const totalDue = safeSchedules.reduce((acc, curr) => acc + Number(curr.amount_due), 0)
  const totalPaid = safePayments.reduce((acc, curr) => acc + Number(curr.amount), 0)

  const balance = totalDue - totalPaid
  const now = new Date()

  return (
    <div className="p-4 space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-2">
      <div className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-sm border border-[var(--color-outline-variant)]">
        <Link href="/parent" className="text-[var(--color-on-surface-variant)] hover:text-emerald-700 transition-colors p-1 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-[var(--color-on-surface)]">Scolarité & Reçus</h1>
          <p className="text-sm text-[var(--color-primary)] font-medium">
            {student.first_name} {student.last_name} • {(student.classes as any)?.name}
          </p>
        </div>
      </div>

      {childrenList.length > 0 && (
        <ChildSwitchBar
          childrenList={childrenList}
          selectedChildId={childId}
          title="Élève"
        />
      )}

      {/* Carte Solde Exécutive */}
      <div className="bg-[#0B0F19] rounded-2xl p-6 text-white shadow-sm ring-1 ring-white/10 relative overflow-hidden">
        <div className="absolute -right-4 -top-4 opacity-5">
          <Wallet className="w-36 h-36" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center justify-between gap-2 mb-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Reste à payer (Solde)</p>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              <Building2 className="w-3 h-3" />
              Paiement à la caisse
            </span>
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold mb-4 tabular-nums tracking-tight">
            {balance > 0 ? balance.toLocaleString('fr-FR') : 0}{' '}
            <span className="text-lg font-semibold text-slate-400">FCFA</span>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/10">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-slate-400">Total annuel</p>
              <p className="font-bold tabular-nums text-white mt-0.5">{totalDue.toLocaleString('fr-FR')} FCFA</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] uppercase tracking-wider text-slate-400">Déjà payé</p>
              <p className="font-bold tabular-nums text-emerald-400 mt-0.5">{totalPaid.toLocaleString('fr-FR')} FCFA</p>
            </div>
          </div>
        </div>
      </div>

      {/* Indication claire du mode de règlement Main à main */}
      {balance > 0 ? (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200/80 flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200/70 flex items-center justify-center text-emerald-700 shrink-0 mt-0.5">
            <Building2 className="w-5 h-5" />
          </div>
          <div className="text-xs text-slate-600 leading-relaxed">
            <p className="font-bold text-slate-900 text-sm">
              Règlement à la caisse de l&apos;établissement (Main à main)
            </p>
            <p className="mt-0.5">
              Les paiements de scolarité s&apos;effectuent directement au guichet de l&apos;école ({school?.name || 'Direction'}). Dès la saisie de votre versement par la comptabilité, votre <strong>reçu officiel PDF</strong> apparaît instantanément ci-dessous.
            </p>
          </div>
        </div>
      ) : totalDue > 0 ? (
        <div className="bg-emerald-50/70 rounded-xl p-4 border border-emerald-200 flex items-center gap-3 text-emerald-900">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="text-xs font-semibold">
            La scolarité de {student.first_name} est intégralement soldée pour cette année scolaire.
          </p>
        </div>
      ) : null}

      <div className="space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 pl-1">Échéancier de scolarité</h2>

        {safeSchedules.length === 0 ? (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-[var(--color-outline-variant)] text-center">
            <p className="text-[var(--color-on-surface-variant)] text-sm">Aucun échéancier défini pour cet élève.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {safeSchedules.map(schedule => {
              const dueDate = new Date(schedule.due_date)
              const isOverdue = dueDate < now && schedule.status !== 'paye'

              const statusColors =
                schedule.status === 'paye'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : isOverdue
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'

              const statusLabel =
                schedule.status === 'paye'
                  ? 'Payé'
                  : isOverdue
                    ? 'En retard'
                    : 'En attente'

              return (
                <div
                  key={schedule.id}
                  className="bg-white p-4 rounded-xl shadow-sm border border-slate-200/80 flex items-center justify-between"
                >
                  <div>
                    <h3 className="font-bold text-slate-900">{schedule.label}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Échéance : {dueDate.toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <span className="font-extrabold text-base text-slate-900 tabular-nums">
                      {Number(schedule.amount_due).toLocaleString('fr-FR')} <span className="text-xs font-semibold text-slate-500">FCFA</span>
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${statusColors}`}>
                      {statusLabel}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="space-y-4 pt-2">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 pl-1">Historique des paiements & Reçus</h2>

        {safePayments.length === 0 ? (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-[var(--color-outline-variant)] text-center flex flex-col items-center">
            <Receipt className="w-8 h-8 text-slate-300 mb-2" />
            <p className="text-[var(--color-on-surface-variant)] text-sm">Aucun paiement n&apos;a encore été enregistré.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden">
            <div className="divide-y divide-slate-100">
              {safePayments.map(payment => (
                <div key={payment.id} className="p-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded-xl flex items-center justify-center shrink-0">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 capitalize">
                        {payment.payment_method === 'especes' ? 'Espèces (Caisse)' : payment.payment_method || 'Versement Caisse'}
                      </h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(payment.paid_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                      {payment.transaction_reference && (
                        <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                          Réf: {payment.transaction_reference}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="font-extrabold text-emerald-700 text-base sm:text-lg whitespace-nowrap tabular-nums">
                      +{Number(payment.amount).toLocaleString('fr-FR')} <span className="text-xs font-semibold">FCFA</span>
                    </div>
                    <DownloadReceiptButton
                      payment={payment}
                      student={student}
                      schoolName={school?.name || 'Scogestia'}
                      schoolCity={school?.city || ''}
                      totalDue={totalDue}
                      totalPaid={totalPaid}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
