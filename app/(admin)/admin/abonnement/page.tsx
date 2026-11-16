import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import { getChariowProducts, partitionChariowProducts } from '@/lib/chariow/api'
import { reconcileChariowPayment } from '@/lib/chariow/reconcile'
import {
  formatSubscriptionPlanLabel,
  getPlanTierKey,
  getSchoolSubscriptionStatus,
} from '@/lib/subscription'
import { AbonnementManager } from '@/components/admin/abonnement/AbonnementManager'
import { Calendar, CheckCircle2, Clock, ShieldCheck, Users } from 'lucide-react'

export const dynamic = 'force-dynamic'

const PAYMENT_STATUS_META: Record<string, { label: string; badgeClass: string }> = {
  succeeded: { label: 'Payé', badgeClass: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' },
  failed: { label: 'Échoué', badgeClass: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200' },
  abandoned: { label: 'Expiré', badgeClass: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200' },
  pending: { label: 'En attente', badgeClass: 'bg-amber-50 text-amber-800 ring-1 ring-amber-200' },
}

export default async function AbonnementPage() {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/connexion')

    const { data: roleData } = await supabase
      .from('user_school_roles')
      .select('school_id, role')
      .eq('user_id', user.id)
      .in('role', ['admin', 'comptable', 'directeur', 'super_admin'])
      .limit(1)
      .maybeSingle()

    if (!roleData?.school_id) {
      return (
        <div className="p-8 text-[var(--color-status-retard-text)]">
          Accès refusé. Réservé à l&apos;administration.
        </div>
      )
    }

    const schoolId = roleData.school_id

    // Réconcilier automatiquement les paiements Chariow encore "En attente" pour cette école
    try {
      const serviceClient = createServiceRoleClient()
      const { data: pendingPayments } = await serviceClient
        .from('saas_payments')
        .select('provider_sale_id')
        .eq('school_id', schoolId)
        .eq('status', 'pending')
        .not('provider_sale_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(5)

      if (pendingPayments && pendingPayments.length > 0) {
        await Promise.all(
          pendingPayments.map((p) =>
            p.provider_sale_id
              ? reconcileChariowPayment(String(p.provider_sale_id), serviceClient).catch(() => false)
              : Promise.resolve(false),
          ),
        )
      }
    } catch {
      // Ne bloque jamais l'affichage si la vérification automatique rencontre un aléa réseau
    }

    // Charger statut consolidé, période, élèves, factures et catalogue Chariow
    const [
      subStatus,
      { data: subscription },
      { data: saasPayments },
      { count: studentsCount },
      chariowProducts,
    ] = await Promise.all([
      getSchoolSubscriptionStatus(supabase, schoolId),
      supabase
        .from('saas_subscriptions')
        .select('status, plan_name, current_period_end')
        .eq('school_id', schoolId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('saas_payments')
        .select('id, created_at, plan_name, amount, currency, provider_sale_id, status')
        .eq('school_id', schoolId)
        .order('created_at', { ascending: false }),
      supabase
        .from('students')
        .select('id', { count: 'exact', head: true })
        .eq('school_id', schoolId),
      getChariowProducts(),
    ])

    const { publicPlans: plans } = partitionChariowProducts(chariowProducts, {
      canUseTestPlan: false,
    })

    const effectiveStatus = subStatus.status
    const rawPlanName = subscription?.plan_name || subStatus.planName
    const cleanPlanLabel = formatSubscriptionPlanLabel(rawPlanName, effectiveStatus)
    const currentPlanTier = getPlanTierKey(rawPlanName, effectiveStatus)
    const maxStudentsLabel =
      subStatus.maxStudents >= 999999 ? 'Illimité' : `${subStatus.maxStudents.toLocaleString('fr-FR')} max`
    const periodEndFormatted = subscription?.current_period_end
      ? new Date(subscription.current_period_end).toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : effectiveStatus === 'active'
        ? 'Illimité'
        : '—'

    return (
      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-[var(--color-surface)]">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* En-tête Exécutif — Stripe Royal Indigo & Sapphire */}
          <div className="relative flex flex-col justify-between gap-5 overflow-hidden rounded-2xl bg-gradient-to-r from-[#1E293B] via-[#312E81] to-[#4338CA] px-6 py-5 text-white shadow-[0_14px_34px_-12px_rgba(67,56,202,0.45)] ring-1 ring-indigo-400/25 sm:px-7 sm:py-6 lg:flex-row lg:items-center">
            <div aria-hidden className="pointer-events-none absolute inset-0">
              <div className="absolute -right-12 -top-16 h-56 w-56 rounded-full bg-indigo-400/25 blur-3xl" />
              <div className="absolute -bottom-20 left-1/3 h-48 w-72 rounded-full bg-sky-400/15 blur-3xl" />
            </div>
            <div className="relative z-10">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-indigo-50 ring-1 ring-inset ring-white/25 backdrop-blur-md">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-300" />
                Licence &amp; Facturation SaaS
              </div>
              <h2 className="text-xl font-extrabold tracking-tight text-white sm:text-2xl">
                Gestion de l&apos;Abonnement Scogestia
              </h2>
              <p className="mt-1 text-[13px] font-medium text-indigo-100/90 sm:text-sm">
                Consultez votre formule actuelle, votre échéance et gérez l&apos;accès de votre établissement.
              </p>
            </div>
          </div>

          {/* Carte Statut Actuel */}
          <div className="bg-[var(--color-surface-container-lowest)] p-6 rounded-2xl border border-[var(--color-outline-variant)] shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <div>
                <h3 className="font-bold text-lg text-[var(--color-on-surface)]">Statut Actuel</h3>
                <p className="text-xs text-[var(--color-on-surface-variant)]">
                  État de votre licence et quota d&apos;élèves en temps réel
                </p>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                  effectiveStatus === 'active'
                    ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                    : effectiveStatus === 'trial'
                      ? 'bg-amber-50 text-amber-800 ring-1 ring-amber-200'
                      : 'bg-rose-50 text-rose-700 ring-1 ring-rose-200'
                }`}
              >
                {effectiveStatus === 'active' ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <Clock className="w-3.5 h-3.5" />
                )}
                {effectiveStatus === 'active'
                  ? 'Actif'
                  : effectiveStatus === 'trial'
                    ? 'Essai Gratuit'
                    : 'Expiré'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Formule active</span>
                </div>
                <p className="text-base font-extrabold text-slate-900 mt-1.5">{cleanPlanLabel}</p>
              </div>

              <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  <span>Valable jusqu&apos;au</span>
                </div>
                <p className="text-base font-extrabold text-slate-900 mt-1.5">{periodEndFormatted}</p>
                {!subStatus.isExpired && subscription?.current_period_end && (
                  <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                    {subStatus.daysRemaining} jour{subStatus.daysRemaining > 1 ? 's' : ''} restant
                    {subStatus.daysRemaining > 1 ? 's' : ''}
                  </p>
                )}
              </div>

              <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                  <Users className="w-4 h-4 text-sky-600" />
                  <span>Capacité élèves</span>
                </div>
                <p className="text-base font-extrabold text-slate-900 mt-1.5 tabular-nums">
                  {(studentsCount ?? 0).toLocaleString('fr-FR')} / {maxStudentsLabel}
                </p>
              </div>
            </div>
          </div>

          {/* Plans */}
          <div className="mt-8">
            <h3 className="font-bold text-2xl text-[var(--color-on-surface)] mb-6 text-center">
              Choisissez ou faites évoluer votre plan
            </h3>
            <AbonnementManager
              plans={plans}
              currentPlanTier={currentPlanTier}
              currentStatus={effectiveStatus}
            />
          </div>

          {/* Historique de facturation */}
          <div className="mt-12 bg-[var(--color-surface-container-lowest)] p-6 rounded-2xl border border-[var(--color-outline-variant)] shadow-sm">
            <h3 className="font-bold text-lg text-[var(--color-on-surface)] mb-4">
              Historique de facturation
            </h3>

            {!saasPayments || saasPayments.length === 0 ? (
              <p className="text-[var(--color-on-surface-variant)] text-sm">
                Aucun paiement enregistré pour le moment.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] text-sm">
                      <th className="pb-3 font-semibold">Date</th>
                      <th className="pb-3 font-semibold">Plan</th>
                      <th className="pb-3 font-semibold">Montant</th>
                      <th className="pb-3 font-semibold">Référence</th>
                      <th className="pb-3 font-semibold">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {saasPayments.map((payment) => {
                      const statusMeta =
                        PAYMENT_STATUS_META[payment.status || 'pending'] ?? PAYMENT_STATUS_META.pending
                      return (
                        <tr
                          key={payment.id}
                          className="border-b border-[var(--color-outline-variant)] last:border-0 hover:bg-[var(--color-surface-container-highest)] transition-colors"
                        >
                          <td className="py-4 text-sm font-medium text-[var(--color-on-surface)] whitespace-nowrap">
                            {new Date(payment.created_at).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="py-4 text-sm font-semibold text-[var(--color-on-surface)]">
                            {formatSubscriptionPlanLabel(payment.plan_name, 'active')}
                          </td>
                          <td className="py-4 text-sm text-[var(--color-on-surface-variant)] tabular-nums whitespace-nowrap">
                            {Number(payment.amount).toLocaleString('fr-FR')} {payment.currency}
                          </td>
                          <td className="py-4 font-mono text-[var(--color-on-surface-variant)] text-xs">
                            {payment.provider_sale_id || '-'}
                          </td>
                          <td className="py-4 text-sm">
                            <span
                              className={`px-2.5 py-1 rounded-md text-xs font-bold whitespace-nowrap ${statusMeta.badgeClass}`}
                            >
                              {statusMeta.label}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error('Erreur chargement page Abonnement:', error)
    return (
      <div className="p-8 text-red-600 text-sm">
        <h2>Une erreur est survenue lors du chargement de la page d&apos;abonnement.</h2>
        <p className="mt-1 text-slate-600">Veuillez rafraîchir la page ou contacter le support.</p>
      </div>
    )
  }
}
