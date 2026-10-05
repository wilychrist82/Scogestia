'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Send, Search, Phone, MessageCircle, BellRing, Loader2, CheckCircle2, AlertCircle, PartyPopper, X, ChevronRight, AlertTriangle } from 'lucide-react'
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
            className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md transition-colors disabled:opacity-50"
          >
            {isSendingBulk ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            <span>{query ? 'Relancer la sélection' : 'Relancer tous les parents'}</span>
          </button>
        }
      />

      {/* Retour d'action */}
      {feedback && (
        <div
          role="status"
          className={`flex items-start gap-2.5 rounded-lg border px-4 py-3 text-sm ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {feedback.type === 'success' ? <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> : <AlertCircle size={16} className="mt-0.5 shrink-0" />}
          <p className="flex-1">{feedback.message}</p>
          <button type="button" onClick={() => setFeedback(null)} aria-label="Fermer" className="opacity-60 hover:opacity-100">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Tableau */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)] overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3 justify-between sm:items-center">
          <div className="relative w-full sm:max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-3 bg-white border border-slate-200 rounded-lg text-sm placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 outline-none transition-all"
              placeholder="Rechercher un élève, un matricule, une classe…"
              type="search"
              aria-label="Rechercher dans les impayés"
            />
          </div>
          <p className="text-xs text-slate-500">
            {filtered.length} résultat{filtered.length > 1 ? 's' : ''}
            {filtered.length > 0 && <> · <span className="font-medium text-slate-700">{formatCFA(totalDu)}</span></>}
          </p>
        </div>

        {rows.length === 0 ? (
          <div className="py-16 flex flex-col items-center text-center px-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center mb-3">
              <PartyPopper size={20} />
            </div>
            <p className="text-sm font-medium text-slate-800">Aucun impayé</p>
            <p className="text-xs text-slate-500 mt-1">Tous les élèves sont à jour dans leurs paiements.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center px-4">
            <p className="text-sm font-medium text-slate-800">Aucun résultat</p>
            <p className="text-xs text-slate-500 mt-1">Aucun dossier ne correspond à « {query} ».</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500">
                  <th className="py-3 px-5 font-medium">Élève</th>
                  <th className="py-3 px-5 font-medium">Classe</th>
                  <th className="py-3 px-5 font-medium">Contact parent</th>
                  <th className="py-3 px-5 font-medium text-right">Reste à payer</th>
                  <th className="py-3 px-5 font-medium text-center">Retard</th>
                  <th className="py-3 px-5 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((r) => {
                  const { item, remainder, daysLate, parentPhone, parentUserId } = r
                  const waText = `Bonjour, sauf erreur de notre part, le paiement de "${item.label}" (reste : ${formatCFA(remainder)}) pour votre enfant ${item.student?.first_name} ${item.student?.last_name} est en retard de ${daysLate} jour${daysLate > 1 ? 's' : ''}. Merci de régulariser la situation.`
                  const severity = daysLate > 30 ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200'

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-5">
                        <p className="font-medium text-slate-900">{item.student?.last_name} {item.student?.first_name}</p>
                        <p className="text-xs text-slate-500">{item.label}</p>
                      </td>
                      <td className="py-3 px-5 text-slate-600">{item.student?.classes?.name || '—'}</td>
                      <td className="py-3 px-5 text-slate-600">
                        {parentPhone ? (
                          <span className="inline-flex items-center gap-1.5"><Phone size={13} className="text-slate-400" />{parentPhone}</span>
                        ) : (
                          <span className="text-slate-400">Non renseigné</span>
                        )}
                      </td>
                      <td className="py-3 px-5 text-right font-semibold text-rose-600 tabular-nums whitespace-nowrap">{formatCFA(remainder)}</td>
                      <td className="py-3 px-5 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-md border text-xs font-medium tabular-nums ${severity}`}>
                          {daysLate} j
                        </span>
                      </td>
                      <td className="py-3 px-5">
                        <div className="flex justify-end items-center gap-2">
                          {parentPhone && (
                            <a
                              href={`https://wa.me/${parentPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(waText)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-8 h-8 rounded-lg border border-slate-200 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200 flex items-center justify-center transition-colors"
                              title="Relancer par WhatsApp"
                              aria-label="Relancer par WhatsApp"
                            >
                              <MessageCircle size={15} />
                            </a>
                          )}
                          <button
                            type="button"
                            disabled={sendingId === item.id || !parentUserId}
                            onClick={() => handleSingle(r)}
                            title={parentUserId ? 'Envoyer une notification dans l\u2019application' : 'Aucun compte parent associé'}
                            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-50 hover:border-slate-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {sendingId === item.id ? <Loader2 size={13} className="animate-spin" /> : <BellRing size={13} />}
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
