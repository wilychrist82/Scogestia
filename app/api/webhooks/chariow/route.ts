import { NextResponse } from 'next/server'
import { reconcileChariowPayment } from '@/lib/chariow/reconcile'

export async function POST(req: Request) {
  try {
    const url = new URL(req.url)
    const secret = url.searchParams.get('secret')

    // 1. Vérification du secret
    if (secret !== process.env.CHARIOW_WEBHOOK_SECRET) {
      console.warn('⚠️ Webhook Chariow rejeté : Secret invalide.')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Lire le body (Chariow Pulse event)
    const payload = await req.json()
    const saleId = payload?.data?.sale?.id || payload?.sale?.id

    if (!saleId) {
      return NextResponse.json({ error: 'Sale ID missing' }, { status: 400 })
    }

    // 3. Réconciliation (source de vérité)
    // On n'utilise pas les données du payload webhook pour valider (Zéro confiance dans le body)
    // On va interroger l'API Chariow pour récupérer le statut réel.
    await reconcileChariowPayment(saleId)

    return NextResponse.json({ received: true })

  } catch (error: any) {
    console.error('Erreur Webhook Chariow:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
