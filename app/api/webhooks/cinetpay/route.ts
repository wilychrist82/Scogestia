import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendSms } from '@/lib/sms'
import { webhookRateLimit, checkRateLimit } from '@/lib/ratelimit'
import * as Sentry from '@sentry/nextjs'

export async function POST(req: Request) {
  // Rate Limiting by IP
  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1'
  const rateLimit = await checkRateLimit(webhookRateLimit, ip)

  if (!rateLimit.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    // 1. Lire le payload (form-urlencoded envoyé par CinetPay)
    const formData = await req.formData()
    const cpm_trans_id = formData.get('cpm_trans_id') as string | null
    const cpm_site_id = formData.get('cpm_site_id') as string | null

    const payloadObj = Object.fromEntries(formData.entries())

    // 2. Enregistrer l'appel brut dans la table de log
    let logId: string | null = null
    const { data: logEntry, error: logError } = await supabaseAdmin
      .from('payment_webhook_logs')
      .insert({
        transaction_id: cpm_trans_id,
        payload: payloadObj,
        status: 'received',
      })
      .select('id')
      .single()

    if (logEntry) {
      logId = logEntry.id
    } else {
      console.error('Erreur lors du logging du webhook:', logError)
      Sentry.captureException(new Error(`Webhook Logging Error: ${logError?.message}`), {
        tags: { feature: 'cinetpay_webhook' },
      })
    }

    if (!cpm_trans_id || !cpm_site_id) {
      if (logId) {
        await supabaseAdmin
          .from('payment_webhook_logs')
          .update({ status: 'error', error_details: 'Paramètres manquants' })
          .eq('id', logId)
      }
      return NextResponse.json({ error: 'Paramètres manquants.' }, { status: 400 })
    }

    const CINETPAY_API_KEY = process.env.CINETPAY_API_KEY
    if (!CINETPAY_API_KEY) {
      if (logId) {
        await supabaseAdmin
          .from('payment_webhook_logs')
          .update({ status: 'error', error_details: 'Configuration manquante' })
          .eq('id', logId)
      }
      const err = new Error('CINETPAY_API_KEY manquante')
      Sentry.captureException(err, { tags: { feature: 'cinetpay_webhook', severity: 'critical' } })
      return NextResponse.json({ error: 'Configuration manquante.' }, { status: 500 })
    }

    // 3. Vérification Zero-Trust : Interroger l'API CinetPay pour valider la transaction
    const checkPayload = {
      apikey: CINETPAY_API_KEY,
      site_id: cpm_site_id,
      transaction_id: cpm_trans_id,
    }

    const checkRes = await fetch('https://api-checkout.cinetpay.com/v2/payment/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(checkPayload),
    })

    const checkData = await checkRes.json()

    if (checkData.code !== '00') {
      if (logId) {
        await supabaseAdmin
          .from('payment_webhook_logs')
          .update({ status: 'failed_check', error_details: `Code d'erreur CinetPay: ${checkData.code}` })
          .eq('id', logId)
      }

      Sentry.captureException(new Error(`CinetPay Check Failed. Code: ${checkData.code}`), {
        tags: { feature: 'cinetpay_webhook', transaction_id: cpm_trans_id },
      })

      return NextResponse.json({ status: 'failed', message: 'Transaction check failed' }, { status: 200 })
    }

    // 4. Traitement Atomique (si succès)
    const amount = checkData.data.amount

    const { error: rpcError } = await supabaseAdmin.rpc('process_cinetpay_success', {
      p_transaction_id: cpm_trans_id,
      p_amount: amount,
    })

    if (rpcError) {
      if (logId) {
        await supabaseAdmin
          .from('payment_webhook_logs')
          .update({ status: 'error', error_details: `Erreur RPC: ${rpcError.message}` })
          .eq('id', logId)
      }
      Sentry.captureException(new Error(`CinetPay RPC Error: ${rpcError.message}`), {
        tags: { feature: 'cinetpay_webhook', transaction_id: cpm_trans_id, severity: 'critical' },
      })
      return NextResponse.json({ error: 'Erreur lors du traitement en base de données' }, { status: 500 })
    }

    // 5. Envoi du SMS de confirmation (schéma actuel : transaction_reference, schedule_id, recorded_by)
    const { data: paymentInfo } = await supabaseAdmin
      .from('payments')
      .select(`
        schedule_id,
        recorded_by,
        payment_schedules!payments_schedule_id_fkey (
          label,
          student_id
        )
      `)
      .eq('transaction_reference', cpm_trans_id)
      .maybeSingle()

    if (paymentInfo?.recorded_by) {
      const { data: roleRow } = await supabaseAdmin
        .from('user_school_roles')
        .select('phone')
        .eq('user_id', paymentInfo.recorded_by)
        .limit(1)
        .maybeSingle()

      const phone = roleRow?.phone
      if (phone) {
        const schedJoin = paymentInfo.payment_schedules as any
        const schedObj = Array.isArray(schedJoin) ? schedJoin[0] : schedJoin
        const dueLabel = schedObj?.label || 'Scolarité'
        const message = `Paiement Scogestia confirmé. Reçu de ${amount} FCFA pour "${dueLabel}". Merci.`

        sendSms(phone, message).catch(err => {
          console.error("Erreur d'envoi SMS:", err)
          Sentry.captureException(err, { tags: { feature: 'sms', type: 'payment_confirmation' } })
        })
      }
    }

    // 6. Mise à jour finale du log
    if (logId) {
      await supabaseAdmin.from('payment_webhook_logs').update({ status: 'processed' }).eq('id', logId)
    }

    return NextResponse.json({ status: 'success' }, { status: 200 })
  } catch (error: any) {
    console.error('Erreur webhook CinetPay:', error)
    Sentry.captureException(error, { tags: { feature: 'cinetpay_webhook', severity: 'fatal' } })
    return NextResponse.json({ error: 'Erreur interne du serveur.' }, { status: 500 })
  }
}
