import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { v4 as uuidv4 } from 'uuid'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const due_id = body.due_id || body.schedule_id
    const payment_method = body.payment_method || body.method
    const phoneLocal = body.phoneLocal || body.phone_number
    const phoneCountry = body.phoneCountry || 'TG'

    if (!due_id) {
      return NextResponse.json({ error: 'Identifiant de tranche (due_id) requis.' }, { status: 400 })
    }

    const supabase = await createClient()

    // 1. Vérifier l'utilisateur authentifié
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // 2. Vérifier que l'échéance existe et que l'utilisateur est le parent de l'élève
    const { data: schedule, error: scheduleError } = await supabase
      .from('payment_schedules')
      .select('id, amount_due, label, status, student_id, school_id')
      .eq('id', due_id)
      .single()

    if (scheduleError || !schedule) {
      return NextResponse.json({ error: 'Échéance introuvable.' }, { status: 404 })
    }

    if (schedule.status === 'paye') {
      return NextResponse.json({ error: 'Cette échéance est déjà payée.' }, { status: 400 })
    }

    const { data: link, error: linkError } = await supabase
      .from('parent_student_links')
      .select('id')
      .eq('parent_user_id', user.id)
      .eq('student_id', schedule.student_id)
      .single()

    if (linkError || !link) {
      return NextResponse.json({ error: 'Non autorisé à payer pour cet élève.' }, { status: 403 })
    }

    // 3. Vérifier la disponibilité de la passerelle Mobile Money
    // Tant que l'API CinetPay / Chariow n'est pas configurée, les paiements se font main à main à la caisse.
    // IMPORTANT : On n'insère JAMAIS de ligne dans `payments` avant la confirmation effective du paiement.
    const CHARIOW_API_KEY = process.env.CHARIOW_API_KEY
    const CHARIOW_PRODUCT_ID = process.env.CHARIOW_PRODUCT_ID
    const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    if (!CHARIOW_API_KEY || !CHARIOW_PRODUCT_ID) {
      return NextResponse.json(
        {
          error:
            "Le paiement Mobile Money en ligne n'est pas encore activé. Les règlements de scolarité s'effectuent directement à la caisse de l'établissement (main à main). Votre reçu officiel apparaîtra automatiquement dans votre espace dès l'encaissement.",
        },
        { status: 400 }
      )
    }

    const transactionId = uuidv4()

    const payload = {
      product_id: CHARIOW_PRODUCT_ID,
      email: user.email || 'parent@scogestia.com',
      first_name: user.user_metadata?.first_name || 'Parent',
      last_name: user.user_metadata?.last_name || 'Élève',
      phone: {
        number: phoneLocal,
        country_code: phoneCountry,
      },
      amount: Number(schedule.amount_due),
      redirect_url: `${BASE_URL}/parent/paiements?schedule_id=${schedule.id}`,
      custom_metadata: {
        schedule_id: schedule.id,
        transaction_id: transactionId,
        student_id: schedule.student_id,
        school_id: schedule.school_id,
        payment_method: payment_method || 'mobile_money',
      },
    }

    const chariowRes = await fetch('https://api.chariow.com/v1/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${CHARIOW_API_KEY}`,
      },
      body: JSON.stringify(payload),
    })

    const chariowData = await chariowRes.json()

    if (chariowRes.ok && chariowData?.data?.payment?.checkout_url) {
      return NextResponse.json({ payment_url: chariowData.data.payment.checkout_url }, { status: 200 })
    } else {
      console.error('Erreur passerelle de paiement:', chariowData)
      return NextResponse.json({ error: "Erreur lors de l'initialisation du paiement." }, { status: 500 })
    }
  } catch (error) {
    console.error('Erreur API initiate:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur.' }, { status: 500 })
  }
}
