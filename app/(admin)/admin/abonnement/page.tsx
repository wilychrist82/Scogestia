import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getChariowProducts } from '@/lib/chariow/api'
import { AbonnementManager } from '@/components/admin/abonnement/AbonnementManager'

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
      .single()

    if (!roleData || !['admin', 'comptable'].includes(roleData.role)) {
      return <div className="p-8 text-[var(--color-status-retard-text)]">Accès refusé. Réservé à l'administration.</div>
    }

    // Récupérer le statut de l'abonnement
    const { data: subscription, error: subError } = await supabase
      .from('saas_subscriptions')
      .select('*')
      .eq('school_id', roleData.school_id)
      .maybeSingle()
      
    if (subError) {
      console.warn("Abonnement non trouvé ou erreur:", subError)
    }

    // Récupérer l'historique des paiements SaaS
    const { data: saasPayments } = await supabase
      .from('saas_payments')
      .select('*')
      .eq('school_id', roleData.school_id)
      .order('created_at', { ascending: false })

    // Récupérer les produits Chariow
    const chariowProducts = await getChariowProducts()
    
    // Filtrer uniquement les produits pertinents s'il y a d'autres choses dans la boutique
    const plans = Array.isArray(chariowProducts) 
      ? chariowProducts.filter(p => p?.name?.includes('SCOGESTIA') || p?.name?.includes('Plan'))
      : []

    return (
      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-[var(--color-surface)]">
        <div className="max-w-5xl mx-auto space-y-6">
          
          {/* Header */}
          <div className="bg-[var(--color-surface-container-lowest)] p-6 rounded-xl border border-[var(--color-outline-variant)]">
            <div className="flex items-center gap-2 text-[var(--color-on-surface-variant)] mb-2">
              <span className="text-sm font-semibold text-[var(--color-on-surface)]">Abonnement</span>
            </div>
            <h2 className="text-3xl font-bold text-[var(--color-on-surface)]">Gestion de l'abonnement Scogestia</h2>
            <p className="text-base text-[var(--color-on-surface-variant)] mt-1">Consultez votre statut actuel et renouvelez votre accès.</p>
          </div>

          {/* Status */}
          <div className="bg-[var(--color-surface-container-lowest)] p-6 rounded-xl border border-[var(--color-outline-variant)] shadow-sm">
            <h3 className="font-bold text-lg text-[var(--color-on-surface)] mb-4">Statut Actuel</h3>
            {subscription ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[var(--color-on-surface-variant)]">Plan :</span>
                  <span className="text-[var(--color-on-surface)] font-bold">{subscription.plan_name || 'Standard'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[var(--color-on-surface-variant)]">Statut :</span>
                  <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                    subscription.status === 'active' ? 'bg-[#e6f4ea] text-[#1e8e3e]' : 
                    subscription.status === 'trial' ? 'bg-[#fff8e1] text-[#f57f17]' : 
                    'bg-[#fce8e6] text-[#d93025]'
                  }`}>
                    {subscription.status === 'active' ? 'Actif' : subscription.status === 'trial' ? 'Essai Gratuit' : 'Expiré'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[var(--color-on-surface-variant)]">Valable jusqu'au :</span>
                  <span className="text-[var(--color-on-surface)]">
                    {subscription.current_period_end ? new Date(subscription.current_period_end).toLocaleDateString('fr-FR', {
                      day: 'numeric', month: 'long', year: 'numeric'
                    }) : 'Non défini'}
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
            <AbonnementManager plans={plans} />
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
  } catch (error: any) {
    return (
      <div className="p-8 text-red-500 font-mono text-sm whitespace-pre-wrap">
        <h2>Une erreur est survenue lors du chargement de la page :</h2>
        <p>{error.message}</p>
        <p>{error.stack}</p>
      </div>
    )
  }
}
