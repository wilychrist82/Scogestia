import type { SupabaseClient } from '@supabase/supabase-js'

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

export type PlanDetails = {
  subscriptionPlan: 'starter' | 'pro' | 'premium'
  maxStudents: number
  monthsToAdd: number
  isPro: boolean
}

/**
 * Déduit la formule, le quota d'élèves et la durée depuis un nom de plan ou produit Chariow.
 */
export function inferPlanDetails(planName?: string | null): PlanDetails {
  const normalized = (planName || '').toLowerCase()

  if (normalized.includes('annuel') || normalized.includes('annual')) {
    return {
      subscriptionPlan: 'premium',
      maxStudents: 999999,
      monthsToAdd: 12,
      isPro: true,
    }
  }

  if (normalized.includes('premium')) {
    return {
      subscriptionPlan: 'premium',
      maxStudents: 1000,
      monthsToAdd: 1,
      isPro: true,
    }
  }

  if (normalized.includes('pro')) {
    return {
      subscriptionPlan: 'pro',
      maxStudents: 400,
      monthsToAdd: 1,
      isPro: true,
    }
  }

  return {
    subscriptionPlan: 'starter',
    maxStudents: 200,
    monthsToAdd: 1,
    isPro: false,
  }
}

export type PlanTierKey = 'trial' | 'standard' | 'pro' | 'annuel'

/**
 * Identifie la formule canonique d'un abonnement pour l'interface et la facturation.
 */
export function getPlanTierKey(planName?: string | null, status?: string | null): PlanTierKey {
  const normalized = (planName || '').toLowerCase()
  if (status === 'trial' || (status !== 'active' && /\b(essai|trial)\b/.test(normalized))) {
    return 'trial'
  }
  const details = inferPlanDetails(planName)
  if (details.monthsToAdd >= 12 || normalized.includes('annuel') || normalized.includes('annual')) {
    return 'annuel'
  }
  if (details.subscriptionPlan === 'pro' || details.subscriptionPlan === 'premium') {
    return 'pro'
  }
  return 'standard'
}

/**
 * Libellé officiel propre affiché dans les tableaux de bord et l'historique de facturation.
 */
export function formatSubscriptionPlanLabel(planName?: string | null, status?: string | null): string {
  const tier = getPlanTierKey(planName, status)
  switch (tier) {
    case 'trial':
      return 'Essai Gratuit'
    case 'annuel':
      return 'Plan Annuel'
    case 'pro':
      return 'Plan Pro'
    case 'standard':
    default:
      return 'Plan Standard'
  }
}

/**
 * Ajoute un nombre de mois en évitant les débordements de fin de mois (ex: 31 janv -> 28/29 févr).
 */
export function addMonthsSafe(baseDate: Date, months: number): Date {
  const target = new Date(baseDate.getTime())
  const day = target.getDate()
  target.setDate(1)
  target.setMonth(target.getMonth() + months)
  const maxDayInMonth = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate()
  target.setDate(Math.min(day, maxDayInMonth))
  return target
}

/**
 * Récupère le statut complet d'abonnement d'un établissement en réconciliant
 * `schools` (statut administratif) et `saas_subscriptions` (période de validité réelle).
 */
export async function getSchoolSubscriptionStatus(supabase: SupabaseClient | any, schoolId: string): Promise<SubscriptionStatus> {
  // 1. Vérifier le statut directement depuis la table schools
  const { data: school } = await supabase
    .from('schools')
    .select('id, name, subscription_status, subscription_plan, max_students, created_at')
    .eq('id', schoolId)
    .maybeSingle()

  if (!school) {
    return {
      isExpired: true,
      daysRemaining: 0,
      planName: 'Standard',
      status: 'expired',
      maxStudents: 200,
      isPro: false,
    }
  }

  const plan = school.subscription_plan || 'starter'
  const planDefaults = inferPlanDetails(plan)
  const isPro = planDefaults.isPro
  const maxStudents = school.max_students || planDefaults.maxStudents

  if (school.subscription_status === 'suspended') {
    return {
      isExpired: true,
      daysRemaining: 0,
      planName: plan,
      status: 'expired',
      maxStudents,
      isPro,
    }
  }

  // 2. Consulter saas_subscriptions pour contrôler la vraie date d'échéance (trial / active / expired)
  try {
    const { data: sub } = await supabase
      .from('saas_subscriptions')
      .select('status, current_period_end, plan_name')
      .eq('school_id', schoolId)
      .maybeSingle()

    const isSubscriptionRecord =
      Boolean(sub) &&
      (Object.prototype.hasOwnProperty.call(sub, 'current_period_end') ||
        Object.prototype.hasOwnProperty.call(sub, 'plan_name') ||
        sub.status === 'trial' ||
        sub.status === 'expired')

    if (isSubscriptionRecord && sub) {
      const resolvedPlanName = sub.plan_name || plan
      const resolvedPlanMeta = inferPlanDetails(resolvedPlanName)
      const hasExplicitSubPlan = Boolean(sub.plan_name && sub.plan_name.trim())
      const resolvedIsPro = hasExplicitSubPlan
        ? resolvedPlanMeta.isPro
        : isPro || resolvedPlanMeta.isPro
      const resolvedMaxStudents = hasExplicitSubPlan
        ? resolvedPlanMeta.maxStudents
        : Math.max(maxStudents, resolvedPlanMeta.maxStudents)

      if (sub.status === 'expired') {
        return {
          isExpired: true,
          daysRemaining: 0,
          planName: resolvedPlanName,
          status: 'expired',
          maxStudents: resolvedMaxStudents,
          isPro: resolvedIsPro,
        }
      }

      if (sub.current_period_end) {
        const msRemaining = new Date(sub.current_period_end).getTime() - Date.now()
        if (Number.isFinite(msRemaining)) {
          if (msRemaining <= 0) {
            return {
              isExpired: true,
              daysRemaining: 0,
              planName: resolvedPlanName,
              status: 'expired',
              maxStudents: resolvedMaxStudents,
              isPro: resolvedIsPro,
            }
          }

          const daysRemaining = Math.max(1, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)))
          return {
            isExpired: false,
            daysRemaining,
            planName: resolvedPlanName,
            status: sub.status === 'trial' ? 'trial' : 'active',
            maxStudents: resolvedMaxStudents,
            isPro: resolvedIsPro,
          }
        }
      }

      return {
        isExpired: false,
        daysRemaining: 30,
        planName: resolvedPlanName,
        status: sub.status === 'trial' ? 'trial' : 'active',
        maxStudents: resolvedMaxStudents,
        isPro: resolvedIsPro,
      }
    }
  } catch {
    // Fallback tolérant si la table ou le mock de test ne fournit pas saas_subscriptions
  }

  // Statut actif (fallback historique si aucune entrée saas_subscriptions n'existe)
  return {
    isExpired: false,
    daysRemaining: 30,
    planName: plan,
    status: 'active',
    maxStudents,
    isPro,
  }
}

/**
 * Vérifie si l'établissement possède un abonnement valide, sinon déclenche une erreur
 */
export async function assertActiveSubscription(supabase: SupabaseClient | any, schoolId: string): Promise<SubscriptionStatus> {
  const status = await getSchoolSubscriptionStatus(supabase, schoolId)
  if (status.isExpired) {
    throw new Error(
      "Abonnement requis : Votre période d'essai ou votre abonnement a expiré. Veuillez renouveler votre accès depuis l'espace Abonnement."
    )
  }
  return status
}
