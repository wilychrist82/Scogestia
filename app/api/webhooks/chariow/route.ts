import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { reconcileChariowPayment } from '@/lib/chariow/reconcile'

export const dynamic = 'force-dynamic'

const SUCCESS_EVENTS = ['successful.sale', 'settled.sale', 'completed.sale']

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { event, data } = body ?? {}

    if (!event || !data) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    if (SUCCESS_EVENTS.includes(event)) {
      const saleId = data.sale?.id || data.purchase?.id || data.id

      if (!saleId) {
        return NextResponse.json({ error: 'No sale ID found' }, { status: 400 })
      }

      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      // Zero-trust : le contenu du webhook n'est jamais cru directement.
      // On relit la vente chez Chariow (source de vérité), on contrôle le montant
      // et on met à jour saas_payments / saas_subscriptions.
      const ok = await reconcileChariowPayment(String(saleId), supabaseAdmin)
      console.log(`[Chariow Webhook] Sale ${saleId} reconcile => ${ok}`)
    }

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error) {
    console.error('Chariow Webhook error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
