/**
 * Utilitaire centralisé de gestion des abonnements SaaS et quotas Scogestia
 */

export type SubscriptionStatus = {
  isExpired: boolean
  daysRemaining: number
  planName: string
  status: 'active' | 'trial' | 'expired'
  maxStudents: number
  isPro: boolean
}

/**
 * Récupère le statut complet d'abonnement d'un établissement
 */
export async function getSchoolSubscriptionStatus(supabase: any, schoolId: string): Promise<SubscriptionStatus> {
  const { data: sub } = await supabase
    .from('saas_subscriptions')
    .select('status, current_period_end, plan_name')
    .eq('school_id', schoolId)
    .maybeSingle()

  if (!sub || !sub.current_period_end) {
    return {
      isExpired: true,
      daysRemaining: 0,
      planName: 'Standard',
      status: 'expired',
      maxStudents: 200,
      isPro: false,
    }
  }

  const endDate = new Date(sub.current_period_end)
  const now = new Date()
  const diffTime = endDate.getTime() - now.getTime()
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  const isExpired = daysRemaining <= 0 || sub.status === 'expired'
  const isPro = Boolean(sub.plan_name?.toLowerCase().includes('pro'))
  const maxStudents = isPro ? 400 : 200

  return {
    isExpired,
    daysRemaining,
    planName: sub.plan_name || (isPro ? 'Pro' : 'Standard'),
    status: isExpired ? 'expired' : sub.status,
    maxStudents,
    isPro,
  }
}

/**
 * Vérifie si l'établissement possède un abonnement valide, sinon déclenche une erreur
 */
export async function assertActiveSubscription(supabase: any, schoolId: string): Promise<SubscriptionStatus> {
  const status = await getSchoolSubscriptionStatus(supabase, schoolId)
  if (status.isExpired) {
    throw new Error(
      "Abonnement requis : Votre période d'essai ou votre abonnement a expiré. Veuillez renouveler votre accès depuis l'espace Abonnement."
    )
  }
  return status
}
