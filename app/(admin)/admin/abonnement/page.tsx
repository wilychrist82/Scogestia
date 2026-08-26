import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getChariowProducts } from '@/lib/chariow/api'
import { AbonnementManager } from '@/components/admin/abonnement/AbonnementManager'

export const dynamic = 'force-dynamic'

export default async function AbonnementPage() {
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
  const { data: subscription } = await supabase
    .from('saas_subscriptions')
    .select('*')
    .eq('school_id', roleData.school_id)
    .maybeSingle()

  // Récupérer les produits Chariow
  const chariowProducts = await getChariowProducts()
  
  // Filtrer uniquement les produits pertinents s'il y a d'autres choses dans la boutique
  const plans = chariowProducts.filter(p => p.name.includes('SCOGESTIA') || p.name.includes('Plan'))

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

      </div>
    </div>
  )
}
