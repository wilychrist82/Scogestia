import { NextResponse } from 'next/server'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { sendSms } from '@/lib/sms'
import { chunkArray, runInBatches } from '@/lib/collections'
import {
  aggregatePaidBySchedule,
  buildReminderSmsMessage,
  buildSentReminderSet,
  collectScheduleQueryKeys,
  formatLocalDate,
  parentPhoneOf,
  remainingOf,
  type ExistingReminderRecord,
  type PaymentRecord,
  type ReminderScheduleRow,
  type ReminderType,
} from '@/lib/payment-reminders'

export const dynamic = 'force-dynamic'

const SCHEDULE_SELECT = `
  id,
  school_id,
  student_id,
  label,
  amount_due,
  due_date,
  student:students!inner(
    parent_phone,
    parent_links:parent_student_links(
      parent_user_id
    )
  )
`

const SMS_CONCURRENCY = 5

async function fetchSentReminders(
  supabase: SupabaseClient,
  scheduleIds: string[],
): Promise<ExistingReminderRecord[]> {
  const rows: ExistingReminderRecord[] = []
  for (const chunk of chunkArray(scheduleIds, 200)) {
    const { data, error } = await supabase
      .from('payment_reminders')
      .select('due_id, type, status')
      .in('due_id', chunk)
      .eq('status', 'sent')

    if (error) {
      console.error('Erreur chargement payment_reminders:', error.message)
      continue
    }
    rows.push(...((data ?? []) as ExistingReminderRecord[]))
  }
  return rows
}

async function fetchPaymentsForSchedules(
  supabase: SupabaseClient,
  scheduleIds: string[],
): Promise<PaymentRecord[]> {
  const rows: PaymentRecord[] = []
  for (const chunk of chunkArray(scheduleIds, 200)) {
    const [bySchedule, byDue] = await Promise.all([
      supabase.from('payments').select('id, schedule_id, due_id, amount').in('schedule_id', chunk),
      supabase.from('payments').select('id, schedule_id, due_id, amount').in('due_id', chunk),
    ])

    if (bySchedule.error) console.error('Erreur chargement payments (schedule_id):', bySchedule.error.message)
    if (byDue.error) console.error('Erreur chargement payments (due_id):', byDue.error.message)

    if (bySchedule.data) rows.push(...(bySchedule.data as PaymentRecord[]))
    if (byDue.data) rows.push(...(byDue.data as PaymentRecord[]))
  }
  return rows
}

async function fetchParentPhones(
  supabase: SupabaseClient,
  parentUserIds: string[],
): Promise<Map<string, string>> {
  const phoneByUserId = new Map<string, string>()
  for (const chunk of chunkArray(parentUserIds, 200)) {
    const { data, error } = await supabase
      .from('user_school_roles')
      .select('user_id, phone')
      .eq('role', 'parent')
      .in('user_id', chunk)

    if (error) {
      console.error('Erreur chargement téléphones parents:', error.message)
      continue
    }
    for (const r of data ?? []) {
      if (r.phone) phoneByUserId.set(r.user_id, r.phone)
    }
  }
  return phoneByUserId
}

async function dispatchReminderBatch(params: {
  supabase: SupabaseClient
  type: ReminderType
  schedules: ReminderScheduleRow[]
  alreadySentIds: Set<string>
  paidBySchedule: Map<string, number>
  phoneByUserId: Map<string, string>
}): Promise<{ sentIds: string[]; failedIds: string[] }> {
  const { supabase, type, schedules, alreadySentIds, paidBySchedule, phoneByUserId } = params

  const candidates: Array<{ id: string; phone: string; message: string }> = []
  for (const row of schedules) {
    if (alreadySentIds.has(row.id)) continue
    const remaining = remainingOf(row, paidBySchedule)
    const phone = parentPhoneOf(row, phoneByUserId)
    if (remaining <= 0 || !phone) continue

    candidates.push({
      id: row.id,
      phone,
      message: buildReminderSmsMessage(type, remaining, row.label),
    })
  }

  if (candidates.length === 0) {
    return { sentIds: [], failedIds: [] }
  }

  const results = await runInBatches(candidates, SMS_CONCURRENCY, async (item) => {
    const ok = await sendSms(item.phone, item.message)
    return {
      due_id: item.id,
      type,
      status: ok ? ('sent' as const) : ('failed' as const),
    }
  })

  for (const insertChunk of chunkArray(results, 200)) {
    const { error } = await supabase.from('payment_reminders').insert(insertChunk)
    if (error) {
      console.error(`Erreur insertion payment_reminders (${type}):`, error.message)
    }
  }

  return {
    sentIds: results.filter((r) => r.status === 'sent').map((r) => r.due_id),
    failedIds: results.filter((r) => r.status === 'failed').map((r) => r.due_id),
  }
}

export async function GET(request: Request) {
  try {
    // Sécurité : le cron exige CRON_SECRET (header Bearer, format Vercel Cron, ou ?token=)
    const url = new URL(request.url)
    const provided =
      request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ??
      url.searchParams.get('token')

    if (!process.env.CRON_SECRET || provided !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Configuration Supabase manquante' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    const today = new Date()
    const jPlus3 = new Date(today)
    jPlus3.setDate(today.getDate() + 3)

    // 1. Cibler uniquement les échéances concernées (J-3 + retard) avant tout autre chargement
    const [
      { data: approachingData, error: approachingError },
      { data: overdueData, error: overdueError },
    ] = await Promise.all([
      supabase
        .from('payment_schedules')
        .select(SCHEDULE_SELECT)
        .neq('status', 'paye')
        .eq('due_date', formatLocalDate(jPlus3)),
      supabase
        .from('payment_schedules')
        .select(SCHEDULE_SELECT)
        .neq('status', 'paye')
        .lt('due_date', formatLocalDate(today)),
    ])

    if (approachingError) console.error('Erreur récupération J-3:', approachingError.message)
    if (overdueError) console.error('Erreur récupération overdue:', overdueError.message)

    const approaching = (approachingData ?? []) as unknown as ReminderScheduleRow[]
    const overdue = (overdueData ?? []) as unknown as ReminderScheduleRow[]
    const allSchedules = [...approaching, ...overdue]

    if (allSchedules.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Aucune échéance à relancer',
        data: {
          stats: {
            'j-3_sent': 0,
            'j-3_failed': 0,
            overdue_sent: 0,
            overdue_failed: 0,
          },
        },
      })
    }

    // 2. Charger uniquement les relances, paiements et téléphones liés aux échéances ciblées
    const { scheduleIds, parentUserIds } = collectScheduleQueryKeys(allSchedules)
    const [existingReminders, paymentRows, phoneByUserId] = await Promise.all([
      fetchSentReminders(supabase, scheduleIds),
      fetchPaymentsForSchedules(supabase, scheduleIds),
      fetchParentPhones(supabase, parentUserIds),
    ])

    const paidBySchedule = aggregatePaidBySchedule(paymentRows)
    const sentJ3Set = buildSentReminderSet(existingReminders, 'j-3')
    const sentOverdueSet = buildSentReminderSet(existingReminders, 'overdue')

    const [j3Outcome, overdueOutcome] = await Promise.all([
      dispatchReminderBatch({
        supabase,
        type: 'j-3',
        schedules: approaching,
        alreadySentIds: sentJ3Set,
        paidBySchedule,
        phoneByUserId,
      }),
      dispatchReminderBatch({
        supabase,
        type: 'overdue',
        schedules: overdue,
        alreadySentIds: sentOverdueSet,
        paidBySchedule,
        phoneByUserId,
      }),
    ])

    return NextResponse.json({
      success: true,
      message: 'Relances terminées avec succès',
      data: {
        stats: {
          'j-3_sent': j3Outcome.sentIds.length,
          'j-3_failed': j3Outcome.failedIds.length,
          overdue_sent: overdueOutcome.sentIds.length,
          overdue_failed: overdueOutcome.failedIds.length,
        },
      },
    })
  } catch (error: any) {
    console.error('Erreur API Cron:', error)
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 },
    )
  }
}
