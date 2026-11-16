import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { reconcileChariowPayment } from '@/lib/chariow/reconcile'
import { webhookRateLimit, checkRateLimit } from '@/lib/ratelimit'

export const dynamic = 'force-dynamic'

const SUCCESS_EVENTS = [
  'successful.sale',
  'settled.sale',
  'completed.sale',
  'sale.completed',
  'purchase.completed',
]

function verifyWebhookSecret(req: Request, rawBody: string, secret: string): boolean {
  const headerSecret =
    req.headers.get('x-chariow-secret') ||
    req.headers.get('x-webhook-secret')

  if (headerSecret) {
    const a = Buffer.from(headerSecret)
    const b = Buffer.from(secret)
    return a.length === b.length && crypto.timingSafeEqual(a, b)
  }

  const signature =
    req.headers.get('x-chariow-signature') ||
    req.headers.get('x-webhook-signature')

  if (signature) {
    const cleanSig = signature.replace(/^sha256=/i, '').trim()
    const expectedHmac = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex')
    const a = Buffer.from(cleanSig)
    const b = Buffer.from(expectedHmac)
    return a.length === b.length && crypto.timingSafeEqual(a, b)
  }

  return false
}

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1'
    const rateLimit = await checkRateLimit(webhookRateLimit, `chariow_${ip}`)
    if (!rateLimit.success) {
      return NextResponse.json({ error: 'Trop de requêtes' }, { status: 429 })
    }

    const rawBody = await req.text()
    const webhookSecret = process.env.CHARIOW_WEBHOOK_SECRET
    if (webhookSecret && !verifyWebhookSecret(req, rawBody, webhookSecret)) {
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
      body = JSON.parse(rawBody) as ChariowWebhookPayload
    } catch {
      return NextResponse.json({ error: 'JSON invalide' }, { status: 400 })
    }

    const event = (body?.event || req.headers.get('x-pulse-event') || '').trim().toLowerCase()
    const payloadData = body?.data ?? body

    if (!event || !payloadData) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    if (SUCCESS_EVENTS.includes(event)) {
      const saleId = payloadData.sale?.id || payloadData.purchase?.id || payloadData.id

      if (!saleId) {
        return NextResponse.json({ error: 'No sale ID found' }, { status: 400 })
      }

      const supabaseAdmin = createServiceRoleClient()

      // Zero-trust : le contenu du webhook n'est jamais cru directement.
      // On relit la vente chez Chariow (source de vérité), on contrôle le montant
      // et on synchronise saas_payments, saas_subscriptions et schools.
      const ok = await reconcileChariowPayment(String(saleId), supabaseAdmin)
      console.log(`[Chariow Webhook] Sale ${saleId} reconcile => ${ok}`)
    }

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error) {
    console.error('Chariow Webhook error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
