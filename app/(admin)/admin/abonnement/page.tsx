import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import { getChariowProducts, partitionChariowProducts } from '@/lib/chariow/api'
import { reconcileChariowPayment } from '@/lib/chariow/reconcile'
import { AbonnementManager } from '@/components/admin/abonnement/AbonnementManager'
import { isBillingTestEmail } from '@/lib/owner'

export const dynamic = 'force-dynamic'

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
      return <div className="p-8 text-[var(--color-status-retard-text)]">Accès refusé. Réservé à l'administration.</div>
    }

    // Réconcilier automatiquement les paiements Chariow encore "En attente" pour cette école
    try {
      const serviceClient = createServiceRoleClient()
      const { data: pendingPayments } = await serviceClient
        .from('saas_payments')
        .select('provider_sale_id')
        .eq('school_id', roleData.school_id)
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

    // Récupérer le statut réel de l'abonnement (saas_subscriptions + repli schools)
    const [{ data: subscription, error: subError }, { data: schoolRow }, { data: saasPayments }] = await Promise.all([
      supabase
        .from('saas_subscriptions')
        .select('*')
        .eq('school_id', roleData.school_id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('schools')
        .select('subscription_status, subscription_plan')
        .eq('id', roleData.school_id)
        .maybeSingle(),
      supabase
        .from('saas_payments')
        .select('*')
        .eq('school_id', roleData.school_id)
        .order('created_at', { ascending: false }),
    ])

    if (subError) {
      console.warn('Abonnement saas_subscriptions inaccessible ou absent:', subError.message)
    }

    const effectiveSubscription = subscription || (schoolRow
      ? {
          plan_name: schoolRow.subscription_plan || 'Standard',
          status: schoolRow.subscription_status === 'suspended' ? 'expired' : (schoolRow.subscription_status || 'active'),
          current_period_end: null,
        }
      : null)

    // Récupérer les produits Chariow
    const [{ data: isSuperAdmin }, chariowProducts] = await Promise.all([
      supabase.rpc('is_super_admin'),
      getChariowProducts(),
    ])
    const canUseTestPlan = isBillingTestEmail(user.email) || Boolean(isSuperAdmin)
    const testProductId = process.env.CHARIOW_TEST_PRODUCT_ID

    const { publicPlans: plans, testPlan } = partitionChariowProducts(chariowProducts, {
      canUseTestPlan,
      testProductId,
    })

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
                Licence & Facturation SaaS
              </div>
              <h2 className="text-xl font-extrabold tracking-tight text-white sm:text-2xl">Gestion de l'Abonnement Scogestia</h2>
              <p className="mt-1 text-[13px] font-medium text-indigo-100/90 sm:text-sm">Consultez votre formule actuelle et renouvelez l'accès de votre établissement.</p>
            </div>
          </div>

          {/* Status */}
          <div className="bg-[var(--color-surface-container-lowest)] p-6 rounded-xl border border-[var(--color-outline-variant)] shadow-sm">
            <h3 className="font-bold text-lg text-[var(--color-on-surface)] mb-4">Statut Actuel</h3>
            {effectiveSubscription ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[var(--color-on-surface-variant)]">Plan :</span>
                  <span className="text-[var(--color-on-surface)] font-bold">{effectiveSubscription.plan_name || 'Standard'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[var(--color-on-surface-variant)]">Statut :</span>
                  <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                    effectiveSubscription.status === 'active' ? 'bg-[#e6f4ea] text-[#1e8e3e]' : 
                    effectiveSubscription.status === 'trial' ? 'bg-[#fff8e1] text-[#f57f17]' : 
                    'bg-[#fce8e6] text-[#d93025]'
                  }`}>
                    {effectiveSubscription.status === 'active' ? 'Actif' : effectiveSubscription.status === 'trial' ? 'Essai Gratuit' : 'Expiré'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[var(--color-on-surface-variant)]">Valable jusqu'au :</span>
                  <span className="text-[var(--color-on-surface)]">
                    {effectiveSubscription.current_period_end ? new Date(effectiveSubscription.current_period_end).toLocaleDateString('fr-FR', {
                      day: 'numeric', month: 'long', year: 'numeric'
                    }) : 'Actif'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-[var(--color-on-surface-variant)]">
                Aucun abonnement actif trouvé. Veuillez souscrire à un plan ci-dessous.
              </div>
            )}
          </div>

          {/* Plans */}
          <div className="mt-8">
            <h3 className="font-bold text-2xl text-[var(--color-on-surface)] mb-6 text-center">Choisissez votre plan</h3>
            <AbonnementManager
              plans={plans}
              testPlan={testPlan}
              isOwnerTester={canUseTestPlan}
            />
          </div>

          {/* Historique de facturation */}
          <div className="mt-12 bg-[var(--color-surface-container-lowest)] p-6 rounded-xl border border-[var(--color-outline-variant)] shadow-sm">
            <h3 className="font-bold text-lg text-[var(--color-on-surface)] mb-4">Historique de facturation</h3>
            
            {!saasPayments || saasPayments.length === 0 ? (
              <p className="text-[var(--color-on-surface-variant)] text-sm">Aucun paiement enregistré pour le moment.</p>
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
                    {saasPayments.map((payment: any) => (
                      <tr key={payment.id} className="border-b border-[var(--color-outline-variant)] last:border-0 hover:bg-[var(--color-surface-container-highest)] transition-colors">
                        <td className="py-4 text-sm font-medium text-[var(--color-on-surface)]">
                          {new Date(payment.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="py-4 text-sm text-[var(--color-on-surface-variant)]">
                          {payment.plan_name || 'Standard'}
                        </td>
                        <td className="py-4 text-sm text-[var(--color-on-surface-variant)]">
                          {Number(payment.amount).toLocaleString('fr-FR')} {payment.currency}
                        </td>
                        <td className="py-4 text-sm font-mono text-[var(--color-on-surface-variant)] text-xs">
                          {payment.provider_sale_id || '-'}
                        </td>
                        <td className="py-4 text-sm">
                          <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                            payment.status === 'succeeded' ? 'bg-[#e6f4ea] text-[#1e8e3e]' : 
                            payment.status === 'failed' ? 'bg-[#fce8e6] text-[#d93025]' : 
                            'bg-[#f1f3f4] text-[#5f6368]'
                          }`}>
                            {payment.status === 'succeeded' ? 'Payé' : payment.status === 'failed' ? 'Échoué' : 'En attente'}
                          </span>
                        </td>
                      </tr>
                    ))}
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
        <h2>Une erreur est survenue lors du chargement de la page d'abonnement.</h2>
        <p className="mt-1 text-slate-600">Veuillez rafraîchir la page ou contacter le support.</p>
      </div>
    )
  }
}
