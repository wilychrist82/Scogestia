import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { reconcileChariowPayment } from '@/lib/chariow/reconcile'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await req.json()
    const { sale_id } = body

    if (!sale_id) {
      return NextResponse.json({ error: 'Sale ID requis' }, { status: 400 })
    }

    // Réconciliation forcée pour vérifier le statut du paiement
    const isSuccess = await reconcileChariowPayment(sale_id)

    if (isSuccess) {
      return NextResponse.json({ status: 'succeeded' })
    } else {
      return NextResponse.json({ status: 'pending' }) // Ou echec, selon ce qu'on veut afficher
    }

  } catch (error: any) {
    console.error('Verify Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
