import { createClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getChariowSaleStatus, mapChariowStatus } from './api'
import { inferPlanDetails } from '@/lib/subscription'

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
    console.error(`Paiement ${providerSaleId} introuvable dans la base.`)
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
    // Vérification anti-fraude: Le montant payé correspond-il ?
    const paidAmount = Number(sale.amount?.value || 0)
    const expectedAmount = Number(payment.amount)
    
    // Tolérance stricte sur le montant attendu
    if (paidAmount < expectedAmount) {
      console.error(`[Anti-fraude] Montant insuffisant. Attendu: ${expectedAmount}, Reçu: ${paidAmount}`)
      await supabase.from('saas_payments').update({ status: 'failed' }).eq('id', payment.id)
      return false
    }

    const now = new Date()
    const nowIso = now.toISOString()

    // Mise à jour du paiement
    const { error: payUpdateError } = await supabase
      .from('saas_payments')
      .update({ status: 'succeeded', updated_at: nowIso })
      .eq('id', payment.id)

    if (payUpdateError) {
      console.error('Erreur mise à jour saas_payments:', payUpdateError)
      return false
    }

    const planMeta = inferPlanDetails(payment.plan_name)

    // Mise à jour de l'abonnement (ajouter 1 mois ou 12 mois selon la formule)
    const { data: sub } = await supabase
      .from('saas_subscriptions')
      .select('*')
      .eq('school_id', payment.school_id)
      .limit(1)
      .maybeSingle()
    
    let nextDate = new Date(now)
    if (sub && sub.current_period_end) {
      const currentEnd = new Date(sub.current_period_end)
      if (currentEnd > nextDate) {
        nextDate = currentEnd
      }
    }
    nextDate.setMonth(nextDate.getMonth() + planMeta.monthsToAdd)

    if (sub) {
      const { error: subUpdateErr } = await supabase.from('saas_subscriptions').update({
        status: 'active',
        current_period_end: nextDate.toISOString(),
        plan_name: payment.plan_name,
        updated_at: nowIso
      }).eq('id', sub.id)
      if (subUpdateErr) console.error('Erreur mise à jour saas_subscriptions:', subUpdateErr)
    } else {
      const { error: subInsertErr } = await supabase.from('saas_subscriptions').insert({
        school_id: payment.school_id,
        status: 'active',
        current_period_end: nextDate.toISOString(),
        plan_name: payment.plan_name
      })
      if (subInsertErr) console.error('Erreur insertion saas_subscriptions:', subInsertErr)
    }

    // Réconcilier immédiatement la table schools (débloque l'accès + applique le quota du plan)
    const { error: schoolUpdateErr } = await supabase
      .from('schools')
      .update({
        subscription_status: 'active',
        subscription_plan: planMeta.subscriptionPlan,
        max_students: planMeta.maxStudents,
        updated_at: nowIso,
      })
      .eq('id', payment.school_id)

    if (schoolUpdateErr) {
      console.error('Erreur synchronisation table schools après paiement:', schoolUpdateErr)
    }

    return true
  } else if (normalizedStatus === 'failed' || normalizedStatus === 'abandoned') {
    await supabase.from('saas_payments').update({ status: normalizedStatus, updated_at: new Date().toISOString() }).eq('id', payment.id)
    return false
  }

  return false // Still pending
}
