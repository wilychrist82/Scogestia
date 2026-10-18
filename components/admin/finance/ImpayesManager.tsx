'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Send, Search, Phone, MessageCircle, BellRing, Loader2, CheckCircle2, AlertCircle, PartyPopper, X, ChevronRight, AlertTriangle, Clock, CalendarDays } from 'lucide-react'
import { sendPaymentReminder, sendBulkPaymentReminders } from '@/app/actions/finance'
import { FinanceNavTabs } from './FinanceNavTabs'
import { FinancePageBanner } from './FinancePageBanner'

type ImpayeItem = {
  id: string
  label: string
  amount_due: number
  due_date: string
  student: {
    last_name: string
    first_name: string
    matricule: string
    classes: { name: string } | null
    parent_links?: {
      parent_user_id: string
      parent_user: { full_name: string, phone: string | null }
    }[]
  } | null
  payments: { amount: number }[]
}

type Props = {
  impayes: ImpayeItem[]
}

type Feedback = { type: 'success' | 'error', message: string } | null

const formatCFA = (amount: number) =>
  `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(amount)} FCFA`

const AVATAR_TONES = [
  'bg-emerald-100 text-emerald-900 ring-emerald-300',
  'bg-sky-100 text-sky-900 ring-sky-300',
  'bg-violet-100 text-violet-900 ring-violet-300',
  'bg-amber-100 text-amber-900 ring-amber-300',
  'bg-rose-100 text-rose-900 ring-rose-300',
  'bg-teal-100 text-teal-900 ring-teal-300',
]

const avatarTone = (seed: string) => {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return AVATAR_TONES[h % AVATAR_TONES.length]
}

/** Nombre de jours de retard (0 si l'échéance n'est pas encore dépassée). */
const getDaysLate = (dueDateStr: string) => {
  const due = new Date(dueDateStr)
  const today = new Date()
  due.setHours(0, 0, 0, 0)
  today.setHours(0, 0, 0, 0)
  return Math.max(0, Math.round((today.getTime() - due.getTime()) / 86_400_000))
}

export function ImpayesManager({ impayes, basePath = '/admin/finance' }: Props & { basePath?: string }) {
  const [isSendingBulk, setIsSendingBulk] = useState(false)
  const [sendingId, setSendingId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [feedback, setFeedback] = useState<Feedback>(null)

  // On ne garde que les échéances réellement non soldées (reste dû > 0)
  const rows = useMemo(() => impayes
    .map(item => {
      const paid = item.payments?.reduce((acc, p) => acc + Number(p.amount), 0) || 0
      return {
        item,
        remainder: Number(item.amount_due) - paid,
        daysLate: getDaysLate(item.due_date),
        parentUserId: item.student?.parent_links?.[0]?.parent_user_id,
        parentPhone: item.student?.parent_links?.[0]?.parent_user?.phone || null,
      }
    })
    .filter(r => r.remainder > 0), [impayes])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(({ item }) =>
      `${item.student?.last_name} ${item.student?.first_name} ${item.student?.matricule} ${item.student?.classes?.name ?? ''}`
        .toLowerCase().includes(q)
    )
  }, [rows, query])

  const totalDu = filtered.reduce((acc, r) => acc + r.remainder, 0)

  const handleBulk = async () => {
    const reminders = filtered
      .filter(r => r.parentUserId)
      .map(r => ({
        parentUserId: r.parentUserId as string,
        studentName: `${r.item.student?.first_name} ${r.item.student?.last_name}`,
        amountDue: r.remainder,
        daysLate: r.daysLate,
        label: r.item.label,
      }))

    if (reminders.length === 0) {
      setFeedback({ type: 'error', message: "Aucun compte parent n'est associé à ces élèves." })
      return
    }
    setIsSendingBulk(true)
    setFeedback(null)
    const result = await sendBulkPaymentReminders(reminders)
    setIsSendingBulk(false)
    setFeedback(result.error
      ? { type: 'error', message: result.error }
      : { type: 'success', message: `${reminders.length} relance${reminders.length > 1 ? 's' : ''} envoyée${reminders.length > 1 ? 's' : ''} avec succès.` })
  }

  const handleSingle = async (r: typeof rows[number]) => {
    if (!r.parentUserId) {
      setFeedback({ type: 'error', message: 'Aucun compte parent associé pour cet élève.' })
      return
    }
    setSendingId(r.item.id)
    setFeedback(null)
    const result = await sendPaymentReminder(
      r.parentUserId,
      `${r.item.student?.first_name} ${r.item.student?.last_name}`,
      r.remainder,
      r.daysLate,
      r.item.label
    )
    setSendingId(null)
    setFeedback(result.error
      ? { type: 'error', message: result.error }
      : { type: 'success', message: 'Relance envoyée avec succès.' })
  }

  const totalImpayes = rows.reduce((a, r) => a + r.remainder, 0)

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 pb-8 px-1">
      {/* Barre de navigation d'onglets */}
      <FinanceNavTabs basePath={basePath} />

      {/* Bannière Prestige Sombre */}
      <FinancePageBanner
        title="Gestion & Suivi des Impayés"
        subtitle="Identifiez les échéances échues, calculez les retards et lancez les relances par WhatsApp ou notification."
        badge="RECOUVREMENT & CONTENTIEUX"
        icon={AlertTriangle}
        stats={[
          { label: 'Total Impayés', value: formatCFA(totalImpayes), color: 'text-rose-400' },
          { label: 'Dossiers', value: rows.length, color: 'text-white' },
        ]}
        actions={
          <button
            type="button"
            disabled={isSendingBulk || filtered.length === 0}
            onClick={handleBulk}
            className="group inline-flex h-12 items-center justify-center gap-2.5 rounded-xl bg-rose-500 px-5 text-sm font-extrabold text-white shadow-[0_10px_30px_-8px_rgba(244,63,94,0.7),inset_0_1px_0_rgba(255,255,255,0.3)] transition-all hover:-translate-y-0.5 hover:bg-rose-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
          >
            {isSendingBulk ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} className="transition-transform group-hover:translate-x-0.5" />}
            <span>{isSendingBulk ? 'Envoi des relances…' : query ? 'Relancer la sélection' : 'Relancer tous les parents'}</span>
          </button>
        }
      />

      {/* Retour d'action */}
      {feedback && (
        <div
          role="status"
          className={`flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm font-semibold ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-rose-50 border-rose-300 text-rose-900'
          }`}
        >
          {feedback.type === 'success' ? <CheckCircle2 size={17} className="mt-0.5 shrink-0" /> : <AlertCircle size={17} className="mt-0.5 shrink-0" />}
          <p className="flex-1">{feedback.message}</p>
          <button type="button" onClick={() => setFeedback(null)} aria-label="Fermer" className="opacity-70 hover:opacity-100">
            <X size={15} />
          </button>
        </div>
      )}

      {/* Tableau */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.06),0_10px_30px_-18px_rgba(15,23,42,0.18)]">
        <div className="flex flex-col justify-between gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:p-5">
          <div className="relative w-full sm:max-w-sm">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-600 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/15"
              placeholder="Rechercher un élève, un matricule, une classe…"
              type="search"
              aria-label="Rechercher dans les impayés"
            />
          </div>
          <p className="text-sm font-semibold text-slate-800">
            {filtered.length} résultat{filtered.length > 1 ? 's' : ''}
            {filtered.length > 0 && <> · <span className="font-extrabold tabular-nums text-rose-700">{formatCFA(totalDu)}</span></>}
          </p>
        </div>

        {rows.length === 0 ? (
          <div className="flex flex-col items-center px-4 py-16 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-300">
              <PartyPopper size={22} />
            </div>
            <p className="text-sm font-extrabold text-slate-900">Aucun impayé</p>
            <p className="mt-1 text-sm font-medium text-slate-700">Tous les élèves sont à jour dans leurs paiements.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-4 py-16 text-center">
            <p className="text-sm font-extrabold text-slate-900">Aucun résultat</p>
            <p className="mt-1 text-sm font-medium text-slate-700">Aucun dossier ne correspond à « {query} ».</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-800">
                  <th className="px-5 py-3.5">Élève & Parent</th>
                  <th className="px-5 py-3.5">Échéance</th>
                  <th className="px-5 py-3.5 text-right">Reste à payer</th>
                  <th className="px-5 py-3.5 text-center">Retard</th>
                  <th className="px-5 py-3.5 text-right">Relance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filtered.map((r) => {
                  const { item, remainder, daysLate, parentPhone, parentUserId } = r
                  const waText = `Bonjour, sauf erreur de notre part, le paiement de "${item.label}" (reste : ${formatCFA(remainder)}) pour votre enfant ${item.student?.first_name} ${item.student?.last_name} est en retard de ${daysLate} jour${daysLate > 1 ? 's' : ''}. Merci de régulariser la situation.`
                  const parentName = item.student?.parent_links?.[0]?.parent_user?.full_name
                  const initials = `${item.student?.last_name?.charAt(0) || ''}${item.student?.first_name?.charAt(0) || ''}`.toUpperCase() || '?'
                  const lateBadge = daysLate === 0
                    ? 'bg-amber-50 text-amber-900 ring-amber-300'
                    : daysLate > 30
                      ? 'bg-rose-600 text-white ring-rose-700 shadow-[0_4px_12px_-4px_rgba(225,29,72,0.6)]'
                      : 'bg-rose-50 text-rose-800 ring-rose-300'

                  return (
                    <tr key={item.id} className="transition-colors hover:bg-slate-50">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3.5">
                          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-extrabold ring-1 ring-inset ${avatarTone(item.id)}`}>
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-extrabold text-slate-900">{item.student?.last_name} {item.student?.first_name}</p>
                            <div className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-1">
                              <span className="inline-flex rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-bold text-slate-800 ring-1 ring-inset ring-slate-300">
                                {item.student?.classes?.name || 'Sans classe'}
                              </span>
                              {parentPhone ? (
                                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                                  <Phone size={12} className="text-emerald-700" />
                                  {parentName ? `${parentName} · ` : ''}<span className="tabular-nums">{parentPhone}</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                                  <Phone size={12} />Parent non renseigné
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-bold text-slate-900">{item.label}</p>
                        <p className="mt-0.5 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                          <CalendarDays size={12} />
                          {new Date(item.due_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-right text-base font-extrabold tabular-nums tracking-tight text-rose-700">{formatCFA(remainder)}</td>
                      <td className="px-5 py-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-xs font-extrabold tabular-nums ring-1 ring-inset ${lateBadge}`}>
                          <Clock size={13} />
                          {daysLate === 0 ? 'À échéance' : `${daysLate} j de retard`}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {parentPhone && (
                            <a
                              href={`https://wa.me/${parentPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(waText)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-800 transition-all hover:border-emerald-700 hover:bg-emerald-700 hover:text-white"
                              title="Relancer par WhatsApp"
                              aria-label="Relancer par WhatsApp"
                            >
                              <MessageCircle size={16} />
                            </a>
                          )}
                          <button
                            type="button"
                            disabled={sendingId === item.id || !parentUserId}
                            onClick={() => handleSingle(r)}
                            title={parentUserId ? 'Envoyer une notification dans l’application' : 'Aucun compte parent associé'}
                            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-xs font-bold text-slate-900 transition-all hover:border-rose-600 hover:bg-rose-50 hover:text-rose-800 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-slate-300 disabled:hover:bg-white disabled:hover:text-slate-900"
                          >
                            {sendingId === item.id ? <Loader2 size={14} className="animate-spin" /> : <BellRing size={14} />}
                            Relancer
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
