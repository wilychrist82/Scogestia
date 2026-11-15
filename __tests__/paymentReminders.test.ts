import { describe, it, expect } from 'vitest'
import {
  aggregatePaidBySchedule,
  buildReminderSmsMessage,
  buildSentReminderSet,
  collectScheduleQueryKeys,
  parentPhoneOf,
  remainingOf,
} from '../lib/payment-reminders'
import { chunkArray, runInBatches } from '../lib/collections'

describe('payment-reminders helpers', () => {
  it('excludes failed reminders so failed deliveries can be retried', () => {
    const existing = [
      { due_id: 'due-1', type: 'j-3', status: 'sent' },
      { due_id: 'due-2', type: 'j-3', status: 'failed' },
      { due_id: 'due-3', type: 'overdue', status: 'sent' },
      { due_id: null, type: 'j-3', status: 'sent' },
    ]

    const j3Set = buildSentReminderSet(existing, 'j-3')
    expect(j3Set.has('due-1')).toBe(true)
    expect(j3Set.has('due-2')).toBe(false)
    expect(j3Set.has('due-3')).toBe(false)

    const overdueSet = buildSentReminderSet(existing, 'overdue')
    expect(overdueSet.has('due-3')).toBe(true)
    expect(overdueSet.has('due-1')).toBe(false)
  })

  it('aggregates payments by schedule_id/due_id without double-counting duplicate payment ids', () => {
    const paid = aggregatePaidBySchedule([
      { id: 'p1', schedule_id: 's1', due_id: 's1', amount: 15000 },
      { id: 'p1', schedule_id: 's1', due_id: 's1', amount: 15000 },
      { id: 'p2', schedule_id: null, due_id: 's1', amount: 5000 },
      { id: 'p3', schedule_id: 's2', due_id: null, amount: 25000 },
    ])

    expect(paid.get('s1')).toBe(20000)
    expect(paid.get('s2')).toBe(25000)
    expect(remainingOf({ id: 's1', amount_due: 30000 }, paid)).toBe(10000)
    expect(remainingOf({ id: 's2', amount_due: 25000 }, paid)).toBe(0)
  })

  it('prefers linked parent account phone and falls back to student parent_phone', () => {
    const phones = new Map<string, string>([['u-parent-1', '+22890001122']])

    expect(
      parentPhoneOf(
        {
          student: {
            parent_phone: '+22891112233',
            parent_links: [{ parent_user_id: 'u-parent-1' }],
          },
        },
        phones,
      ),
    ).toBe('+22890001122')

    expect(
      parentPhoneOf(
        {
          student: {
            parent_phone: '+22891112233',
            parent_links: [{ parent_user_id: 'unknown-user' }],
          },
        },
        phones,
      ),
    ).toBe('+22891112233')

    expect(parentPhoneOf({ student: null }, phones)).toBeNull()
  })

  it('collects deduplicated scheduleIds and parentUserIds for targeted scoping', () => {
    const { scheduleIds, parentUserIds } = collectScheduleQueryKeys([
      {
        id: 'sch-1',
        label: 'Tranche 1',
        amount_due: 50000,
        student: {
          parent_links: [{ parent_user_id: 'u1' }, { parent_user_id: 'u2' }],
        },
      },
      {
        id: 'sch-2',
        label: 'Tranche 2',
        amount_due: 40000,
        student: {
          parent_links: [{ parent_user_id: 'u1' }, { parent_user_id: null }],
        },
      },
    ])

    expect(scheduleIds).toEqual(['sch-1', 'sch-2'])
    expect(parentUserIds).toEqual(['u1', 'u2'])
  })

  it('formats distinct SMS messages for J-3 vs overdue', () => {
    expect(buildReminderSmsMessage('j-3', 15000, '2ème Tranche')).toContain('dans 3 jours')
    expect(buildReminderSmsMessage('overdue', 15000, '2ème Tranche')).toContain('en retard')
  })
})

describe('collections utilities', () => {
  it('chunks arrays cleanly without dropping remainder', () => {
    expect(chunkArray([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]])
    expect(chunkArray([], 2)).toEqual([])
  })

  it('runs batches preserving result order', async () => {
    const out = await runInBatches([10, 20, 30, 40, 50], 2, async (n, idx) => `${idx}:${n * 2}`)
    expect(out).toEqual(['0:20', '1:40', '2:60', '3:80', '4:100'])
  })
})
