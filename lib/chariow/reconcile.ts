import { createClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getChariowSaleStatus, mapChariowStatus } from './api'
import { inferPlanDetails } from '@/lib/subscription'

async function applySchoolAndSubscriptionActivation(
  supabase: SupabaseClient,
  params: { schoolId: string; planName: string; now: Date },
): Promise<boolean> {
  const { schoolId, planName, now } = params
  const nowIso = now.toISOString()
  const planMeta = inferPlanDetails(planName)

  // 1. Mise à jour de l'abonnement (ajouter 1 mois ou 12 mois selon la formule)
  const { data: sub, error: subSelectErr } = await supabase
    .from('saas_subscriptions')
    .select('*')
    .eq('school_id', schoolId)
    .limit(1)
    .maybeSingle()

  if (subSelectErr) {
    console.warn('Lecture saas_subscriptions ignorée:', subSelectErr.message)
  } else {
    let nextDate = new Date(now)
    if (sub && sub.current_period_end) {
      const currentEnd = new Date(sub.current_period_end)
      if (currentEnd > nextDate) {
        nextDate = currentEnd
      }
    }
    nextDate.setMonth(nextDate.getMonth() + planMeta.monthsToAdd)

    if (sub) {
      const { error: subUpdateErr } = await supabase
        .from('saas_subscriptions')
        .update({
          status: 'active',
          current_period_end: nextDate.toISOString(),
          plan_name: planName,
          updated_at: nowIso,
        })
        .eq('id', sub.id)
      if (subUpdateErr) console.error('Erreur mise à jour saas_subscriptions:', subUpdateErr)
    } else {
      const { error: subInsertErr } = await supabase
        .from('saas_subscriptions')
        .insert({
          school_id: schoolId,
          status: 'active',
          current_period_end: nextDate.toISOString(),
          plan_name: planName,
        })
      if (subInsertErr) console.error('Erreur insertion saas_subscriptions:', subInsertErr)
    }
  }

  // 2. Réconcilier immédiatement la table schools (débloque l'accès + applique le quota du plan)
  const { error: schoolUpdateErr } = await supabase
    .from('schools')
    .update({
      subscription_status: 'active',
      subscription_plan: planMeta.subscriptionPlan,
      max_students: planMeta.maxStudents,
      updated_at: nowIso,
    })
    .eq('id', schoolId)

  if (schoolUpdateErr) {
    console.error('Erreur synchronisation table schools après paiement:', schoolUpdateErr)
    return false
  }

  return true
}

export async function reconcileChariowPayment(providerSaleId: string, client?: SupabaseClient) {
  const supabase = client ?? await createClient()

  // 1. Lire le paiement dans la base de données
  const { data: payment, error: paymentError } = await supabase
    .from('saas_payments')
    .select('*')
    .eq('provider_sale_id', providerSaleId)
    .limit(1)
    .maybeSingle()

  if (paymentError || !payment) {
    console.error(`Paiement ${providerSaleId} introuvable dans la base.`, paymentError?.message)
    return false
  }

  // 2. Si déjà marqué comme réussi, s'assurer que l'école est active sans rallonger la période
  if (payment.status === 'succeeded') {
    const planMeta = inferPlanDetails(payment.plan_name)
    await supabase
      .from('schools')
      .update({
        subscription_status: 'active',
        subscription_plan: planMeta.subscriptionPlan,
        max_students: planMeta.maxStudents,
        updated_at: new Date().toISOString(),
      })
      .eq('id', payment.school_id)
    return true
  }

  // 3. Lire la vente chez Chariow (Source de Vérité)
  let sale: { status: string; amount?: { value?: number | string } }
  try {
    sale = await getChariowSaleStatus(providerSaleId)
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    console.error(`Impossible de lire le statut de la vente ${providerSaleId}`, errorMsg)
    return false
  }

  const normalizedStatus = mapChariowStatus(sale.status)

  // 4. Si c'est réussi, on procède à la validation
  if (normalizedStatus === 'succeeded') {
    const paidAmount = Number(sale.amount?.value || 0)
    const expectedAmount = Number(payment.amount)

    if (paidAmount < expectedAmount) {
      console.error(`[Anti-fraude] Montant insuffisant. Attendu: ${expectedAmount}, Reçu: ${paidAmount}`)
      await supabase.from('saas_payments').update({ status: 'failed' }).eq('id', payment.id)
      return false
    }

    const now = new Date()

    const { error: payUpdateError } = await supabase
      .from('saas_payments')
      .update({ status: 'succeeded', updated_at: now.toISOString() })
      .eq('id', payment.id)

    if (payUpdateError) {
      console.error('Erreur mise à jour saas_payments:', payUpdateError)
      return false
    }

    await applySchoolAndSubscriptionActivation(supabase, {
      schoolId: payment.school_id,
      planName: payment.plan_name || 'Standard',
      now,
    })

    return true
  } else if (normalizedStatus === 'failed' || normalizedStatus === 'abandoned') {
    await supabase
      .from('saas_payments')
      .update({ status: normalizedStatus, updated_at: new Date().toISOString() })
      .eq('id', payment.id)
    return false
  }

  return false
}

/**
 * Fallback sécurisé lorsque `saas_payments` n'était pas accessible au moment du checkout (ex: 42501).
 * Vérifie directement la vente côté Chariow avec contrôle anti-fraude sur le montant issu du jeton HMAC serveur.
 */
export async function reconcilePendingCheckoutToken(
  supabase: SupabaseClient,
  params: {
    saleId: string
    schoolId: string
    planName: string
    expectedAmount: number
  },
): Promise<boolean> {
  const { saleId, schoolId, planName, expectedAmount } = params

  let sale: { status: string; amount?: { value?: number | string; currency?: string } }
  try {
    sale = await getChariowSaleStatus(saleId)
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    console.error(`Impossible de lire le statut de la vente fallback ${saleId}`, errorMsg)
    return false
  }

  if (mapChariowStatus(sale.status) !== 'succeeded') {
    return false
  }

  const paidAmount = Number(sale.amount?.value || 0)
  if (paidAmount < expectedAmount) {
    console.error(`[Anti-fraude fallback] Montant insuffisant. Attendu: ${expectedAmount}, Reçu: ${paidAmount}`)
    return false
  }

  const now = new Date()

  // Enregistrement best-effort dans saas_payments si les droits ont entre-temps été accordés
  const { error: upsertErr } = await supabase.from('saas_payments').upsert(
    {
      school_id: schoolId,
      provider_sale_id: saleId,
      amount: paidAmount || expectedAmount,
      currency: sale.amount?.currency || 'XOF',
      status: 'succeeded',
      plan_name: planName,
      updated_at: now.toISOString(),
    },
    { onConflict: 'provider_sale_id' },
  )
  if (upsertErr) {
    console.warn('Upsert saas_payments fallback ignoré:', upsertErr.message)
  }

  return applySchoolAndSubscriptionActivation(supabase, {
    schoolId,
    planName,
    now,
  })
}
