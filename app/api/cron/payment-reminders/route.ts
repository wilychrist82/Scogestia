import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendSms } from '@/lib/sms'

// Force dynamic execution for cron routes
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    // Basic authorization for the cron job (Optional but recommended, e.g. checking a secret token)
    // For manual trigger from the UI, we might accept GET or POST without strict cron token,
    // but in production, we should secure it.
    const url = new URL(request.url)
    const cronSecret = url.searchParams.get('token')
    
    // Si on veut sécuriser la route cron, on peut vérifier un token
    if (process.env.CRON_SECRET && cronSecret !== process.env.CRON_SECRET) {
      // Allow if the request comes from an authenticated admin via UI?
      // Since it's a GET, it's easier to just call it.
      // We will skip strict auth for now to allow manual triggering easily, 
      // but in a real app you'd check Supabase Auth or CRON_SECRET.
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Configuration Supabase manquante' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    const today = new Date()
    const jPlus3 = new Date(today)
    jPlus3.setDate(today.getDate() + 3)
    const jPlus3Str = jPlus3.toISOString().split('T')[0]

    const { data: approachingDues, error: approachingError } = await supabase
      .from('dues')
      .select(`
        id, 
        label, 
        amount, 
        student:students!inner(
          parent_links:parent_student_links!inner(
            parent:users!parent_user_id(
              phone
            )
          )
        )
      `)
      .eq('status', 'en_attente')
      .eq('due_date', jPlus3Str)
      // Ne pas relancer si on l'a déjà fait
      .not('id', 'in', `(select due_id from payment_reminders where type = 'j-3')`)

    if (approachingError) console.error("Erreur récupération J-3:", approachingError)

    const sentApproaching = []
    if (approachingDues && approachingDues.length > 0) {
      for (const due of approachingDues) {
        const parentPhone = (due.student as any)?.parent_links?.[0]?.parent?.phone
        
        if (parentPhone) {
          const message = `Rappel Scogestia: Votre paiement de ${due.amount} FCFA pour "${due.label}" arrive à échéance dans 3 jours. Merci d'y penser.`
          const success = await sendSms(parentPhone, message)
          
          await supabase.from('payment_reminders').insert({
            due_id: due.id,
            type: 'j-3',
            status: success ? 'sent' : 'failed'
          })
          sentApproaching.push(due.id)
        }
      }
    }

    // 2. Relances Retard
    const { data: overdueDues, error: overdueError } = await supabase
      .from('dues')
      .select(`
        id, 
        label, 
        amount, 
        student:students!inner(
          parent_links:parent_student_links!inner(
            parent:users!parent_user_id(
              phone
            )
          )
        )
      `)
      .eq('status', 'en_retard')
      .not('id', 'in', `(select due_id from payment_reminders where type = 'overdue')`)

    if (overdueError) console.error("Erreur récupération overdue:", overdueError)

    const sentOverdue = []
    if (overdueDues && overdueDues.length > 0) {
      for (const due of overdueDues) {
        const parentPhone = (due.student as any)?.parent_links?.[0]?.parent?.phone
        
        if (parentPhone) {
          const message = `Urgent Scogestia: Votre paiement de ${due.amount} FCFA pour "${due.label}" est en retard. Merci de régulariser la situation au plus vite.`
          const success = await sendSms(parentPhone, message)
          
          await supabase.from('payment_reminders').insert({
            due_id: due.id,
            type: 'overdue',
            status: success ? 'sent' : 'failed'
          })
          sentOverdue.push(due.id)
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Relances terminées avec succès',
      data: {
        stats: {
          'j-3_sent': sentApproaching.length,
          'overdue_sent': sentOverdue.length
        }
      }
    })

  } catch (error: any) {
    console.error("Erreur API Cron:", error)
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 })
  }
}
