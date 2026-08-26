import { createClient } from '@/lib/supabase/server'
import { getChariowSaleStatus, mapChariowStatus } from './api'

export async function reconcileChariowPayment(providerSaleId: string) {
  const supabase = await createClient()

  // 1. Lire le paiement dans la base de données
  const { data: payment, error: paymentError } = await supabase
    .from('saas_payments')
    .select('*')
    .eq('provider_sale_id', providerSaleId)
    .single()

  if (paymentError || !payment) {
    console.error(`Paiement ${providerSaleId} introuvable dans la base.`)
    return false
  }

  // 2. Si déjà marqué comme réussi, pas besoin d'aller plus loin
  if (payment.status === 'succeeded') {
    return true
  }

  // 3. Lire la vente chez Chariow (Source de Vérité)
  let sale: any
  try {
    sale = await getChariowSaleStatus(providerSaleId)
  } catch (err: any) {
    console.error(`Impossible de lire le statut de la vente ${providerSaleId}`, err.message)
    return false
  }

  const normalizedStatus = mapChariowStatus(sale.status)

  // 4. Si c'est réussi, on procède à la validation
  if (normalizedStatus === 'succeeded') {
    // Vérification anti-fraude: Le montant payé correspond-il ?
    const paidAmount = Number(sale.amount?.value || 0)
    const expectedAmount = Number(payment.amount)
    
    // Tolérance de 5% max ou stricte (ici on fait strict pour l'instant)
    if (paidAmount < expectedAmount) {
      console.error(`[Anti-fraude] Montant insuffisant. Attendu: ${expectedAmount}, Reçu: ${paidAmount}`)
      // On le marque en echec ou anomalie
      await supabase.from('saas_payments').update({ status: 'failed' }).eq('id', payment.id)
      return false
    }

    // Mise à jour du paiement
    await supabase.from('saas_payments').update({ status: 'succeeded', updated_at: new Date().toISOString() }).eq('id', payment.id)

    // Mise à jour de l'abonnement
    // Ajouter 1 mois (ou an) selon le plan. Pour le moment on fait +1 mois.
    const { data: sub } = await supabase.from('saas_subscriptions').select('*').eq('school_id', payment.school_id).maybeSingle()
    
    let nextDate = new Date()
    if (sub && sub.current_period_end) {
      const currentEnd = new Date(sub.current_period_end)
      if (currentEnd > nextDate) {
        nextDate = currentEnd
      }
    }
    // Ajout d'un mois
    nextDate.setMonth(nextDate.getMonth() + 1)

    if (sub) {
      await supabase.from('saas_subscriptions').update({
        status: 'active',
        current_period_end: nextDate.toISOString(),
        plan_name: payment.plan_name,
        updated_at: new Date().toISOString()
      }).eq('id', sub.id)
    } else {
      await supabase.from('saas_subscriptions').insert({
        school_id: payment.school_id,
        status: 'active',
        current_period_end: nextDate.toISOString(),
        plan_name: payment.plan_name
      })
    }
    return true
  } else if (normalizedStatus === 'failed' || normalizedStatus === 'abandoned') {
    await supabase.from('saas_payments').update({ status: normalizedStatus, updated_at: new Date().toISOString() }).eq('id', payment.id)
    return false
  }

  return false // Still pending
}
