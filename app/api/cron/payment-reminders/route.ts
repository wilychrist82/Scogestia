import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendSms } from '@/lib/sms'

// Force dynamic execution for cron routes
export const dynamic = 'force-dynamic'

const SCHEDULE_SELECT = `
  id,
  label,
  amount_due,
  payments(amount),
  student:students!inner(
    parent_links:parent_student_links(
      parent_user:user_school_roles(phone)
    )
  )
`

/** Reste dû d'une échéance (montant − paiements déjà reçus). */
function remainingOf(row: any): number {
  const paid = (row.payments ?? []).reduce((acc: number, p: any) => acc + Number(p.amount || 0), 0)
  return Number(row.amount_due || 0) - paid
}

/** Premier numéro de téléphone parent disponible (gère objet ou tableau selon la relation). */
function parentPhoneOf(row: any): string | null {
  for (const link of row.student?.parent_links ?? []) {
    const pu = Array.isArray(link.parent_user) ? link.parent_user : [link.parent_user]
    const phone = pu.find((u: any) => u?.phone)?.phone
    if (phone) return phone
  }
  return null
}

const localDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

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

    // Relances déjà envoyées (dédoublonnage côté serveur). due_id référence désormais payment_schedules.id
    const { data: existing } = await supabase.from('payment_reminders').select('due_id, type')
    const alreadySent = (type: string) =>
      new Set((existing ?? []).filter((r: any) => r.type === type).map((r: any) => r.due_id))
    const sentJ3 = alreadySent('j-3')
    const sentOver = alreadySent('overdue')

    const today = new Date()
    const jPlus3 = new Date(today)
    jPlus3.setDate(today.getDate() + 3)

    // 1. Relances J-3 : échéances non soldées arrivant à terme dans 3 jours
    const { data: approaching, error: approachingError } = await supabase
      .from('payment_schedules')
      .select(SCHEDULE_SELECT)
      .neq('status', 'paye')
      .eq('due_date', localDate(jPlus3))

    if (approachingError) console.error('Erreur récupération J-3:', approachingError)

    const sentApproaching: string[] = []
    for (const row of approaching ?? []) {
      if (sentJ3.has(row.id)) continue
      const remaining = remainingOf(row)
      const phone = parentPhoneOf(row)
      if (remaining <= 0 || !phone) continue

      const message = `Rappel Scogestia: Votre paiement de ${remaining} FCFA pour "${row.label}" arrive à échéance dans 3 jours. Merci d'y penser.`
      const success = await sendSms(phone, message)
      await supabase.from('payment_reminders').insert({
        due_id: row.id,
        type: 'j-3',
        status: success ? 'sent' : 'failed',
      })
      sentApproaching.push(row.id)
    }

    // 2. Relances retard : échéances dépassées non soldées
    const { data: overdue, error: overdueError } = await supabase
      .from('payment_schedules')
      .select(SCHEDULE_SELECT)
      .neq('status', 'paye')
      .lt('due_date', localDate(today))

    if (overdueError) console.error('Erreur récupération overdue:', overdueError)

    const sentOverdue: string[] = []
    for (const row of overdue ?? []) {
      if (sentOver.has(row.id)) continue
      const remaining = remainingOf(row)
      const phone = parentPhoneOf(row)
      if (remaining <= 0 || !phone) continue

      const message = `Urgent Scogestia: Votre paiement de ${remaining} FCFA pour "${row.label}" est en retard. Merci de régulariser la situation au plus vite.`
      const success = await sendSms(phone, message)
      await supabase.from('payment_reminders').insert({
        due_id: row.id,
        type: 'overdue',
        status: success ? 'sent' : 'failed',
      })
      sentOverdue.push(row.id)
    }

    return NextResponse.json({
      success: true,
      message: 'Relances terminées avec succès',
      data: {
        stats: {
          'j-3_sent': sentApproaching.length,
          'overdue_sent': sentOverdue.length,
        },
      },
    })

  } catch (error: any) {
    console.error('Erreur API Cron:', error)
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 })
  }
}
