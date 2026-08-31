import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { v4 as uuidv4 } from 'uuid'

export async function POST(req: Request) {
  try {
    const { due_id, payment_method, phoneLocal, phoneCountry } = await req.json()
    
    if (!due_id || !payment_method || !phoneLocal || !phoneCountry) {
      return NextResponse.json({ error: 'due_id, payment_method, phoneLocal et phoneCountry sont requis.' }, { status: 400 })
    }

    const supabase = await createClient()

    // 1. Vérifier l'utilisateur authentifié
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // 2. Vérifier que l'échéance existe et que l'utilisateur est le parent de l'élève
    const { data: due, error: dueError } = await supabase
      .from('dues')
      .select('id, amount, label, status, student_id')
      .eq('id', due_id)
      .single()

    if (dueError || !due) {
      return NextResponse.json({ error: 'Échéance introuvable.' }, { status: 404 })
    }
    
    if (due.status === 'paye') {
      return NextResponse.json({ error: 'Cette échéance est déjà payée.' }, { status: 400 })
    }

    const { data: link, error: linkError } = await supabase
      .from('parent_student_links')
      .select('id')
      .eq('parent_user_id', user.id)
      .eq('student_id', due.student_id)
      .single()

    if (linkError || !link) {
      return NextResponse.json({ error: 'Non autorisé à payer pour cet élève.' }, { status: 403 })
    }

    // 3. Préparer la transaction CinetPay
    const transactionId = uuidv4()
    
    // Insérer dans notre base de données
    const { error: insertError } = await supabase
      .from('payments')
      .insert({
        due_id: due.id,
        amount: due.amount,
        payment_method: payment_method,
        transaction_id: transactionId,
        status: 'pending',
        created_by: user.id
      })

    if (insertError) {
      console.error("Erreur d'insertion:", insertError)
      return NextResponse.json({ error: 'Erreur lors de la création de la transaction locale.' }, { status: 500 })
    }

    // 4. Appeler Chariow
    const CHARIOW_API_KEY = process.env.CHARIOW_API_KEY
    const CHARIOW_PRODUCT_ID = process.env.CHARIOW_PRODUCT_ID
    const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    if (!CHARIOW_API_KEY || !CHARIOW_PRODUCT_ID) {
      console.error("Clés Chariow manquantes dans les variables d'environnement.")
      return NextResponse.json({ error: 'Configuration de paiement invalide.' }, { status: 500 })
    }

    const payload = {
      product_id: CHARIOW_PRODUCT_ID,
      email: user.email || 'parent@scogestia.com',
      first_name: user.user_metadata?.first_name || 'Parent',
      last_name: user.user_metadata?.last_name || 'Élève',
      phone: {
        number: phoneLocal,
        country_code: phoneCountry
      },
      // Optionally pass amount if Chariow supports overriding it, 
      // but according to some docs, it relies on product_id. We pass it just in case.
      amount: due.amount, 
      redirect_url: `${BASE_URL}/parent/payments/success?due_id=${due.id}`,
      custom_metadata: { 
        due_id: due.id,
        transaction_id: transactionId,
        student_id: due.student_id 
      }
    }

    const chariowRes = await fetch('https://api.chariow.com/v1/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CHARIOW_API_KEY}`
      },
      body: JSON.stringify(payload)
    })

    const chariowData = await chariowRes.json()

    if (chariowRes.ok && chariowData?.data?.payment?.checkout_url) {
      // Update our payment record with the provider's sale ID
      if (chariowData.data?.purchase?.id) {
         await supabase.from('payments').update({ 
           provider_sale_id: chariowData.data.purchase.id 
         }).eq('transaction_id', transactionId)
      }
      return NextResponse.json({ payment_url: chariowData.data.payment.checkout_url }, { status: 200 })
    } else {
      console.error("Erreur Chariow:", chariowData)
      await supabase.from('payments').update({ status: 'failed' }).eq('transaction_id', transactionId)
      return NextResponse.json({ error: 'Erreur lors de l\'initialisation du paiement Chariow.' }, { status: 500 })
    }

  } catch (error) {
    console.error('Erreur API initiate:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur.' }, { status: 500 })
  }
}
