import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { v4 as uuidv4 } from 'uuid'

export async function POST(req: Request) {
  try {
    const { due_id, payment_method } = await req.json()
    
    if (!due_id || !payment_method) {
      return NextResponse.json({ error: 'due_id et payment_method sont requis.' }, { status: 400 })
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

    // 4. Appeler CinetPay
    const CINETPAY_API_KEY = process.env.CINETPAY_API_KEY
    const CINETPAY_SITE_ID = process.env.CINETPAY_SITE_ID
    const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    if (!CINETPAY_API_KEY || !CINETPAY_SITE_ID) {
      console.error("Clés CinetPay manquantes dans les variables d'environnement.")
      return NextResponse.json({ error: 'Configuration de paiement invalide.' }, { status: 500 })
    }

    const payload = {
      apikey: CINETPAY_API_KEY,
      site_id: CINETPAY_SITE_ID,
      transaction_id: transactionId,
      amount: due.amount,
      currency: 'XOF',
      channels: 'ALL',
      description: `Paiement pour ${due.label}`,
      return_url: `${BASE_URL}/parent`,
      notify_url: `${BASE_URL}/api/webhooks/cinetpay`,
      customer_name: user.user_metadata?.first_name || 'Parent',
      customer_surname: user.user_metadata?.last_name || 'Élève',
      customer_email: user.email || '',
      customer_phone_number: user.phone || '',
      customer_address: 'Togo',
      customer_city: 'Lomé',
      customer_country: 'TG',
      customer_state: 'TG',
      customer_zip_code: '00000'
    }

    const cinetpayRes = await fetch('https://api-checkout.cinetpay.com/v2/payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    const cinetpayData = await cinetpayRes.json()

    if (cinetpayData.code === '201' && cinetpayData.data?.payment_url) {
      return NextResponse.json({ payment_url: cinetpayData.data.payment_url }, { status: 200 })
    } else {
      console.error("Erreur CinetPay:", cinetpayData)
      // Mettre le paiement local en 'failed' ?
      await supabase.from('payments').update({ status: 'failed' }).eq('transaction_id', transactionId)
      return NextResponse.json({ error: 'Erreur lors de l\'initialisation du paiement CinetPay.' }, { status: 500 })
    }

  } catch (error) {
    console.error('Erreur API initiate:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur.' }, { status: 500 })
  }
}
