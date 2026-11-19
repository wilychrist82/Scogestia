import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { reconcileChariowPayment } from '@/lib/chariow/reconcile'
import { verifyChariowWebhookRequest } from '@/lib/chariow/webhook'
import { webhookRateLimit, checkRateLimit } from '@/lib/ratelimit'

export const dynamic = 'force-dynamic'

const SUCCESS_EVENTS = [
  'successful.sale',
  'settled.sale',
  'completed.sale',
  'sale.completed',
  'purchase.completed',
]

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1'
    const rateLimit = await checkRateLimit(webhookRateLimit, `chariow_${ip}`)
    if (!rateLimit.success) {
      return NextResponse.json({ error: 'Trop de requêtes' }, { status: 429 })
    }

    const rawBody = await req.text()
    const configuredSecrets = [
      process.env.CHARIOW_WEBHOOK_SECRET || '',
      process.env.CHARIOW_PULSE_SIGNING_SECRET || '',
    ].filter(Boolean)

    if (
      configuredSecrets.length > 0 &&
      !verifyChariowWebhookRequest(req, rawBody, configuredSecrets)
    ) {
      console.warn('[Chariow Webhook] Signature ou secret invalide depuis', ip)
      return NextResponse.json({ error: 'Signature invalide' }, { status: 401 })
    }

    type ChariowWebhookPayload = {
      event?: string
      id?: string
      sale?: { id?: string }
      purchase?: { id?: string }
      data?: { id?: string; sale?: { id?: string }; purchase?: { id?: string } }
    }

    let body: ChariowWebhookPayload | null = null
    try {
      body = rawBody ? (JSON.parse(rawBody) as ChariowWebhookPayload) : {}
    } catch {
      return NextResponse.json({ error: 'JSON invalide' }, { status: 400 })
    }

    const event = (body?.event || req.headers.get('x-pulse-event') || '').trim().toLowerCase()
    const payloadData = body?.data ?? body

    // Accepter proprement les pings / tests Chariow sans erreur 400
    if (!event || !payloadData) {
      return NextResponse.json({ received: true, ignored: true }, { status: 200 })
    }

    if (SUCCESS_EVENTS.includes(event)) {
      const saleId = payloadData.sale?.id || payloadData.purchase?.id || payloadData.id

      if (!saleId || String(saleId).startsWith('test_')) {
        return NextResponse.json({ received: true, test: true }, { status: 200 })
      }

      const supabaseAdmin = createServiceRoleClient()

      // Zero-trust : le contenu du webhook n'est jamais cru directement.
      // On relit la vente chez Chariow (source de vérité), on contrôle le montant
      // et on synchronise saas_payments, saas_subscriptions et schools.
      const ok = await reconcileChariowPayment(String(saleId), supabaseAdmin)
      if (ok) {
        revalidatePath('/admin', 'layout')
        revalidatePath('/admin/abonnement')
      }
      console.log(`[Chariow Webhook] Sale ${saleId} reconcile => ${ok}`)
    }

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error) {
    console.error('Chariow Webhook error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
