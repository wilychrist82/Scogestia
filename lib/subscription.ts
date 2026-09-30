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
  // 1. Vérifier le statut directement depuis la table schools
  const { data: school } = await supabase
    .from('schools')
    .select('id, name, subscription_status, subscription_plan, max_students, created_at')
    .eq('id', schoolId)
    .maybeSingle()

  if (school) {
    const isSuspended = school.subscription_status === 'suspended'
    const plan = school.subscription_plan || 'starter'
    const isPro = plan.toLowerCase().includes('pro') || plan.toLowerCase().includes('premium')
    const maxStudents = school.max_students || (isPro ? 400 : 200)

    if (isSuspended) {
      return {
        isExpired: true,
        daysRemaining: 0,
        planName: plan,
        status: 'expired',
        maxStudents,
        isPro,
      }
    }

    // Statut actif : accès débloqué
    return {
      isExpired: false,
      daysRemaining: 30,
      planName: plan,
      status: 'active',
      maxStudents,
      isPro,
    }
  }

  return {
    isExpired: true,
    daysRemaining: 0,
    planName: 'Standard',
    status: 'expired',
    maxStudents: 200,
    isPro: false,
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
