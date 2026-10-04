import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendSms } from '@/lib/sms'

// Force dynamic execution for cron routes
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    // Sécurité : le cron exige CRON_SECRET (header Bearer, format Vercel Cron, ou ?token=)
    const url = new URL(request.url)
    const provided = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? url.searchParams.get('token')

    if (!process.env.CRON_SECRET || provided !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Configuration Supabase manquante' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Relances déjà envoyées (dédoublonnage côté serveur)
    const { data: existing } = await supabase.from('payment_reminders').select('due_id, type')
    const alreadySent = (type: string) =>
      new Set((existing ?? []).filter((r: any) => r.type === type).map((r: any) => r.due_id))
    const sentJ3 = alreadySent('j-3')
    const sentOver = alreadySent('overdue')

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

    if (approachingError) console.error("Erreur récupération J-3:", approachingError)

    const sentApproaching = []
    if (approachingDues && approachingDues.length > 0) {
      for (const due of approachingDues) {
        if (sentJ3.has(due.id)) continue
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

    if (overdueError) console.error("Erreur récupération overdue:", overdueError)

    const sentOverdue = []
    if (overdueDues && overdueDues.length > 0) {
      for (const due of overdueDues) {
        if (sentOver.has(due.id)) continue
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
