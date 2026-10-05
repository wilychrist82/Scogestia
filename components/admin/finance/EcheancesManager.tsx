'use client'

import { useEffect, useMemo, useState, useTransition, FormEvent } from 'react'
import Link from 'next/link'
import { Plus, MessageCircle, Trash2, MoreVertical, X, ChevronRight, Loader2, AlertCircle, Receipt, Search } from 'lucide-react'
import { generateSchedule, deleteSchedule } from '@/app/actions/finance'

type ClassItem = { id: string; name: string }
type StudentItem = { id: string; last_name: string; first_name: string; matricule: string }
type ScheduleItem = {
  id: string
  label: string
  amount_due: number
  due_date: string
  status: string
  student: { last_name: string, first_name: string, classes: { name: string } | null, parent_phone?: string | null } | null
}

type Props = {
  schedules: ScheduleItem[]
  classes: ClassItem[]
  students: StudentItem[]
}

const formatCFA = (amount: number) =>
  `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(amount)} FCFA`

const inputCls =
  'w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 outline-none transition-all'

const filterCls =
  'h-9 px-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 outline-none transition-all'

const STATUS_STYLES: Record<string, { label: string, cls: string }> = {
  paye: { label: 'Payé', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  en_attente: { label: 'En attente', cls: 'bg-slate-50 text-slate-600 border-slate-200' },
  partiel: { label: 'Partiel', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  en_retard: { label: 'En retard', cls: 'bg-rose-50 text-rose-700 border-rose-200' },
}

/** Statut affiché : une échéance dépassée et non soldée est « en retard », même si la base ne l'a pas mis à jour. */
function effectiveStatus(s: ScheduleItem): string {
  if (s.status === 'paye') return 'paye'
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
  return s.due_date < today ? 'en_retard' : s.status
}

export function EcheancesManager({ schedules, classes, students, basePath = '/admin/finance' }: Props & { basePath?: string }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [scheduleType, setScheduleType] = useState<'class' | 'individual'>('class')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null)
  const [classFilter, setClassFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (!isModalOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !isPending) setIsModalOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isModalOpen, isPending])

  const classNameById = useMemo(() => new Map(classes.map(c => [c.id, c.name])), [classes])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return schedules.filter(s => {
      if (classFilter && s.student?.classes?.name !== classNameById.get(classFilter)) return false
      if (statusFilter && effectiveStatus(s) !== statusFilter) return false
      if (q && !`${s.student?.last_name} ${s.student?.first_name} ${s.label}`.toLowerCase().includes(q)) return false
      return true
    })
  }, [schedules, classFilter, statusFilter, query, classNameById])

  const openAddModal = () => {
    setError(null)
    setIsModalOpen(true)
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    formData.set('type', scheduleType)

    startTransition(async () => {
      const result = await generateSchedule(null, formData)
      if (result?.error) {
        setError(result.error)
      } else {
        setIsModalOpen(false)
      }
    })
  }

  const handleDelete = (id: string) => {
    if (!window.confirm('Supprimer cette échéance ? Cette action est irréversible.')) return
    setActionError(null)

    startTransition(async () => {
      const result = await deleteSchedule(id)
      if (result?.error) {
        setActionError(result.error)
      }
      setOpenDropdownId(null)
    })
  }

  return (
    <div className="max-w-[1280px] mx-auto space-y-6 pb-8">

      {/* En-tête de page */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <nav className="flex items-center gap-1 text-xs text-slate-500 mb-1.5" aria-label="Fil d'Ariane">
            <Link href={basePath} className="hover:text-slate-800 transition-colors">Finance</Link>
            <ChevronRight size={12} />
            <span className="text-slate-800 font-medium">Échéances</span>
          </nav>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Échéances de paiement</h1>
          <p className="text-sm text-slate-500 mt-1">Consultez et générez les frais scolaires pour vos élèves.</p>
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center gap-2 h-9 px-3.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium shadow-sm transition-colors self-start sm:self-auto"
        >
          <Plus size={15} /> Générer une échéance
        </button>
      </div>

      {actionError && (
        <div role="alert" className="flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-800 px-4 py-3 text-sm">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <p className="flex-1">{actionError}</p>
          <button type="button" onClick={() => setActionError(null)} aria-label="Fermer" className="opacity-60 hover:opacity-100"><X size={14} /></button>
        </div>
      )}

      {/* Tableau */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)] overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col lg:flex-row gap-3 justify-between lg:items-center">
          <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
            <div className="relative sm:w-64">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                type="search"
                aria-label="Rechercher une échéance"
                placeholder="Rechercher un élève, un libellé…"
                className="w-full h-9 pl-9 pr-3 bg-white border border-slate-200 rounded-lg text-sm placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 outline-none transition-all"
              />
            </div>
            <select className={filterCls} value={classFilter} onChange={e => setClassFilter(e.target.value)} aria-label="Filtrer par classe">
              <option value="">Toutes les classes</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select className={filterCls} value={statusFilter} onChange={e => setStatusFilter(e.target.value)} aria-label="Filtrer par statut">
              <option value="">Tous les statuts</option>
              <option value="en_attente">En attente</option>
              <option value="partiel">Partiel</option>
              <option value="paye">Payé</option>
              <option value="en_retard">En retard</option>
            </select>
          </div>
          <p className="text-xs text-slate-500">
            {filtered.length} échéance{filtered.length > 1 ? 's' : ''}
            {filtered.length !== schedules.length && <> sur {schedules.length}</>}
          </p>
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 flex flex-col items-center text-center px-4">
            <div className="w-10 h-10 rounded-lg bg-slate-50 text-slate-400 border border-slate-200 flex items-center justify-center mb-3">
              <Receipt size={20} />
            </div>
            <p className="text-sm font-medium text-slate-800">{schedules.length === 0 ? 'Aucune échéance' : 'Aucun résultat'}</p>
            <p className="text-xs text-slate-500 mt-1">
              {schedules.length === 0 ? 'Générez des échéances pour vos classes ou vos élèves.' : 'Modifiez vos filtres pour élargir la recherche.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto min-h-[250px]">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500">
                  <th className="py-3 px-5 font-medium">Élève</th>
                  <th className="py-3 px-5 font-medium">Classe</th>
                  <th className="py-3 px-5 font-medium">Type de frais</th>
                  <th className="py-3 px-5 font-medium text-right">Montant</th>
                  <th className="py-3 px-5 font-medium">Échéance</th>
                  <th className="py-3 px-5 font-medium">Statut</th>
                  <th className="py-3 px-5 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((schedule) => {
                  const status = effectiveStatus(schedule)
                  const st = STATUS_STYLES[status] ?? { label: status, cls: 'bg-slate-50 text-slate-600 border-slate-200' }
                  const phone = schedule.student?.parent_phone
                  const waText = status === 'en_retard'
                    ? `Bonjour, nous vous rappelons que le paiement de "${schedule.label}" pour votre enfant ${schedule.student?.first_name} ${schedule.student?.last_name} est en retard. Merci de régulariser la situation.`
                    : `Bonjour, nous vous rappelons que le paiement de "${schedule.label}" pour votre enfant ${schedule.student?.first_name} ${schedule.student?.last_name} est attendu pour le ${new Date(schedule.due_date).toLocaleDateString('fr-FR')}.`

                  return (
                    <tr key={schedule.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-5 font-medium text-slate-900">{schedule.student?.last_name} {schedule.student?.first_name}</td>
                      <td className="py-3 px-5 text-slate-600">{schedule.student?.classes?.name || '—'}</td>
                      <td className="py-3 px-5 text-slate-600">{schedule.label}</td>
                      <td className="py-3 px-5 text-right font-semibold text-slate-900 tabular-nums whitespace-nowrap">{formatCFA(schedule.amount_due)}</td>
                      <td className="py-3 px-5 text-slate-600 whitespace-nowrap">{new Date(schedule.due_date).toLocaleDateString('fr-FR')}</td>
                      <td className="py-3 px-5">
                        <span className={`inline-flex px-2 py-0.5 rounded-md border text-xs font-medium ${st.cls}`}>{st.label}</span>
                      </td>
                      <td className="py-3 px-5">
                        <div className="flex justify-end gap-1.5 items-center">
                          {status !== 'paye' && phone && (
                            <a
                              href={`https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(waText)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-8 h-8 rounded-lg border border-slate-200 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200 flex items-center justify-center transition-colors"
                              title="Relancer par WhatsApp"
                              aria-label="Relancer par WhatsApp"
                            >
                              <MessageCircle size={15} />
                            </a>
                          )}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setOpenDropdownId(openDropdownId === schedule.id ? null : schedule.id)}
                              aria-label="Plus d'actions"
                              aria-haspopup="menu"
                              aria-expanded={openDropdownId === schedule.id}
                              className="w-8 h-8 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 flex items-center justify-center transition-colors"
                            >
                              <MoreVertical size={16} />
                            </button>
                            {openDropdownId === schedule.id && (
                              <>
                                <div className="fixed inset-0 z-10" onClick={() => setOpenDropdownId(null)} />
                                <div role="menu" className="absolute right-0 mt-1 w-44 bg-white rounded-lg shadow-[0_8px_24px_rgba(15,23,42,0.12)] border border-slate-200 p-1 z-20">
                                  <button
                                    type="button"
                                    role="menuitem"
                                    onClick={() => handleDelete(schedule.id)}
                                    disabled={isPending}
                                    className="w-full text-left px-3 py-2 rounded-md text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2 disabled:opacity-50"
                                  >
                                    <Trash2 size={14} /> Supprimer
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
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

      {/* Modale : générer des échéances */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-[2px]"
          onMouseDown={(e) => { if (e.target === e.currentTarget && !isPending) setIsModalOpen(false) }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="schedule-modal-title"
            className="bg-white w-full max-w-lg rounded-xl shadow-[0_20px_50px_rgba(15,23,42,0.25)] border border-slate-200 flex flex-col overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
              <h2 id="schedule-modal-title" className="text-base font-semibold text-slate-900">Générer des échéances</h2>
              <button type="button" onClick={() => setIsModalOpen(false)} disabled={isPending} aria-label="Fermer" className="text-slate-400 hover:text-slate-700 p-1.5 rounded-md hover:bg-slate-100 transition-colors">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col">
              <div className="p-5 overflow-y-auto max-h-[70vh] space-y-4">

                {error && (
                  <div role="alert" className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 text-rose-800 px-3 py-2.5 text-sm">
                    <AlertCircle size={15} className="mt-0.5 shrink-0" />
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg" role="tablist">
                  {(['class', 'individual'] as const).map(t => (
                    <button
                      key={t}
                      type="button"
                      role="tab"
                      aria-selected={scheduleType === t}
                      onClick={() => setScheduleType(t)}
                      className={`h-8 text-sm font-medium rounded-md transition-all ${scheduleType === t ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      {t === 'class' ? 'Une classe entière' : 'Un seul élève'}
                    </button>
                  ))}
                </div>

                {scheduleType === 'class' ? (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-700" htmlFor="classId">Classe <span className="text-rose-500">*</span></label>
                    <select className={inputCls} id="classId" name="classId" required>
                      <option value="">Sélectionner une classe</option>
                      {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <p className="text-xs text-slate-500">Une échéance sera créée pour chaque élève actif de la classe.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-700" htmlFor="studentId">Élève <span className="text-rose-500">*</span></label>
                    <select className={inputCls} id="studentId" name="studentId" required>
                      <option value="">Sélectionner un élève</option>
                      {students.map(s => <option key={s.id} value={s.id}>{s.matricule} — {s.last_name} {s.first_name}</option>)}
                    </select>
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-700" htmlFor="label">Type de frais / libellé <span className="text-rose-500">*</span></label>
                  <input className={inputCls} id="label" name="label" type="text" placeholder="Ex : Scolarité 1er trimestre" required />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-700" htmlFor="amount">Montant (FCFA) <span className="text-rose-500">*</span></label>
                    <input className={inputCls} id="amount" name="amount" type="number" min="1" placeholder="Ex : 50000" required />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-700" htmlFor="dueDate">Date d&apos;échéance <span className="text-rose-500">*</span></label>
                    {/* Sélecteur natif : empêche les dates invalides (ex. 31 février) */}
                    <input className={inputCls} id="dueDate" name="dueDate" type="date" required />
                  </div>
                </div>
              </div>

              <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50/60 flex justify-end gap-2">
                <button type="button" onClick={() => setIsModalOpen(false)} disabled={isPending} className="h-9 px-4 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors disabled:opacity-50">
                  Annuler
                </button>
                <button type="submit" disabled={isPending} className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium shadow-sm transition-colors disabled:opacity-60">
                  {isPending && <Loader2 size={14} className="animate-spin" />}
                  {isPending ? 'Génération…' : 'Générer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
