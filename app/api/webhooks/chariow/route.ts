import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { event, data } = body

    if (!event || !data) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    if (['successful.sale', 'settled.sale', 'completed.sale'].includes(event)) {
      const saleId = data.sale?.id || data.purchase?.id || data.id
      
      if (!saleId) {
        return NextResponse.json({ error: 'No sale ID found' }, { status: 400 })
      }

      // Initialize Supabase Admin Client
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      // Find the payment record by provider_sale_id
      const { data: payment, error: paymentError } = await supabaseAdmin
        .from('payments')
        .select('*')
        .eq('provider_sale_id', saleId)
        .single()

      if (paymentError || !payment) {
        console.error("Payment not found for sale_id:", saleId)
        const customDueId = data.custom_metadata?.due_id
        if (customDueId) {
           await supabaseAdmin
             .from('payments')
             .update({ status: 'succeeded', provider_sale_id: saleId })
             .eq('due_id', customDueId)
             .eq('status', 'pending')
             
           await supabaseAdmin
             .from('dues')
             .update({ status: 'paye' })
             .eq('id', customDueId)
        }
        return NextResponse.json({ received: true }, { status: 200 })
      }

      // Mark payment as succeeded
      await supabaseAdmin
        .from('payments')
        .update({ status: 'succeeded' })
        .eq('id', payment.id)

      // Mark due as paid
      await supabaseAdmin
        .from('dues')
        .update({ status: 'paye' })
        .eq('id', payment.due_id)
        
      console.log(`[Chariow Webhook] Payment ${payment.id} succeeded`)
    }

    return NextResponse.json({ received: true }, { status: 200 })

  } catch (error) {
    console.error('Chariow Webhook error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
