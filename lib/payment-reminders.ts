export type ReminderType = 'j-3' | 'overdue'
export type ReminderStatus = 'sent' | 'failed'

export interface ReminderScheduleRow {
  id: string
  school_id?: string
  student_id?: string
  label: string
  amount_due: number | string | null
  student?: {
    parent_phone?: string | null
    parent_links?: Array<{ parent_user_id: string | null }> | null
  } | null
}

export interface PaymentRecord {
  id?: string
  schedule_id?: string | null
  due_id?: string | null
  amount: number | string | null
}

export interface ExistingReminderRecord {
  due_id: string | null
  type: string | null
  status?: string | null
}

export const formatLocalDate = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/** Calcule le reste dû d'une échéance (montant − paiements déjà reçus). */
export function remainingOf(
  row: Pick<ReminderScheduleRow, 'id' | 'amount_due'>,
  paidBySchedule: Map<string, number>,
): number {
  const paid = paidBySchedule.get(row.id) || 0
  return Number(row.amount_due || 0) - paid
}

/** Retourne le premier numéro de téléphone parent disponible (compte lié ou fiche élève). */
export function parentPhoneOf(
  row: Pick<ReminderScheduleRow, 'student'>,
  phoneByUserId: Map<string, string>,
): string | null {
  for (const link of row.student?.parent_links ?? []) {
    if (!link.parent_user_id) continue
    const phone = phoneByUserId.get(link.parent_user_id)
    if (phone) return phone
  }
  return row.student?.parent_phone || null
}

/** Agrège les montants payés par identifiant d'échéance en dédupliquant par `payment.id`. */
export function aggregatePaidBySchedule(payments: readonly PaymentRecord[]): Map<string, number> {
  const map = new Map<string, number>()
  const seenPaymentIds = new Set<string>()

  for (const p of payments) {
    if (p.id) {
      if (seenPaymentIds.has(p.id)) continue
      seenPaymentIds.add(p.id)
    }
    const targetId = p.schedule_id || p.due_id
    if (!targetId) continue
    map.set(targetId, (map.get(targetId) || 0) + Number(p.amount || 0))
  }

  return map
}

/** Construit l'ensemble des échéances déjà relancées avec succès (les échecs restent réessayables). */
export function buildSentReminderSet(
  existingRows: readonly ExistingReminderRecord[],
  type: ReminderType,
): Set<string> {
  const sentIds = new Set<string>()
  for (const r of existingRows) {
    if (r.type !== type || !r.due_id) continue
    if (r.status === 'sent') {
      sentIds.add(r.due_id)
    }
  }
  return sentIds
}

/** Extrait de manière unique les IDs d'échéances et d'utilisateurs parents à charger. */
export function collectScheduleQueryKeys(schedules: readonly ReminderScheduleRow[]): {
  scheduleIds: string[]
  parentUserIds: string[]
} {
  const scheduleIds = new Set<string>()
  const parentUserIds = new Set<string>()

  for (const row of schedules) {
    if (row.id) scheduleIds.add(row.id)
    for (const link of row.student?.parent_links ?? []) {
      if (link.parent_user_id) parentUserIds.add(link.parent_user_id)
    }
  }

  return {
    scheduleIds: Array.from(scheduleIds),
    parentUserIds: Array.from(parentUserIds),
  }
}

export function buildReminderSmsMessage(
  type: ReminderType,
  remaining: number,
  label: string,
): string {
  if (type === 'j-3') {
    return `Rappel Scogestia: Votre paiement de ${remaining} FCFA pour "${label}" arrive à échéance dans 3 jours. Merci d'y penser.`
  }
  return `Urgent Scogestia: Votre paiement de ${remaining} FCFA pour "${label}" est en retard. Merci de régulariser la situation au plus vite.`
}
