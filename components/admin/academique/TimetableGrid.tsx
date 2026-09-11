'use client'

import { useState, useTransition, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Pencil, Trash2, X, Loader2, Calendar, Clock,
  BookOpen, User, MapPin, Printer, Palette, AlertCircle, CheckCircle2
} from 'lucide-react'
import type { TimetableSlot } from '@/app/actions/timetable'
import { createTimetableSlot, updateTimetableSlot, deleteTimetableSlot } from '@/app/actions/timetable'

// ── Constants ─────────────────────────────────────────────────────────────────
const DAYS = [
  { id: 1, label: 'Lundi',    short: 'Lun' },
  { id: 2, label: 'Mardi',    short: 'Mar' },
  { id: 3, label: 'Mercredi', short: 'Mer' },
  { id: 4, label: 'Jeudi',    short: 'Jeu' },
  { id: 5, label: 'Vendredi', short: 'Ven' },
  { id: 6, label: 'Samedi',   short: 'Sam' },
]

const TIME_SLOTS = [
  '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00',
]

const SUBJECT_COLORS = [
  { label: 'Vert Scogestia',  value: '#065F46' },
  { label: 'Émeraude',        value: '#059669' },
  { label: 'Bleu Royal',      value: '#2563EB' },
  { label: 'Violet',          value: '#7C3AED' },
  { label: 'Orange',          value: '#D97706' },
  { label: 'Rose',            value: '#DB2777' },
  { label: 'Rouge',           value: '#DC2626' },
  { label: 'Ardoise',         value: '#475569' },
]

// ── Types ─────────────────────────────────────────────────────────────────────
type Props = {
  classId: string
  className: string
  initialSlots: TimetableSlot[]
  /** Si true, la grille est en lecture seule (ex: vue parent) */
  readOnly?: boolean
}

type ModalState =
  | { type: 'add'; day: number; startTime: string }
  | { type: 'edit'; slot: TimetableSlot }
  | { type: 'delete'; slot: TimetableSlot }
  | null

// ── Utils ─────────────────────────────────────────────────────────────────────
function timeToMinutes(t: string) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function minutesToTime(m: number) {
  const h = Math.floor(m / 60).toString().padStart(2, '0')
  const min = (m % 60).toString().padStart(2, '0')
  return `${h}:${min}`
}

function getSlotHeight(start: string, end: string): number {
  return (timeToMinutes(end) - timeToMinutes(start)) / 30 // en unités de 30min
}

function getSlotTop(start: string): number {
  return (timeToMinutes(start) - timeToMinutes(TIME_SLOTS[0])) / 30
}

// ── Main Component ────────────────────────────────────────────────────────────
export function TimetableGrid({ classId, className, initialSlots, readOnly = false }: Props) {
  const [slots, setSlots] = useState<TimetableSlot[]>(initialSlots)
  const [modal, setModal] = useState<ModalState>(null)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
  const [isPending, startTransition] = useTransition()

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3500)
  }

  // Regrouper les créneaux par jour
  const slotsByDay = (day: number) => slots.filter(s => s.day_of_week === day)

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleCreate = useCallback((formData: Omit<TimetableSlot, 'id' | 'school_id' | 'created_at' | 'updated_at'>) => {
    startTransition(async () => {
      const { class_id, ...rest } = formData
      const result = await createTimetableSlot(classId, rest)
      if (result.success && result.data) {
        setSlots(prev => [...prev, result.data as TimetableSlot])
        setModal(null)
        showToast('Créneau ajouté avec succès !', true)
      } else {
        showToast(result.error || 'Erreur lors de l\'ajout.', false)
      }
    })
  }, [classId])

  const handleUpdate = useCallback((slotId: string, updates: Partial<TimetableSlot>) => {
    startTransition(async () => {
      const { id, school_id, class_id, created_at, updated_at, ...rest } = updates as any
      const result = await updateTimetableSlot(slotId, rest)
      if (result.success && result.data) {
        setSlots(prev => prev.map(s => s.id === slotId ? result.data as TimetableSlot : s))
        setModal(null)
        showToast('Créneau modifié avec succès !', true)
      } else {
        showToast(result.error || 'Erreur lors de la modification.', false)
      }
    })
  }, [])

  const handleDelete = useCallback((slotId: string) => {
    startTransition(async () => {
      const result = await deleteTimetableSlot(slotId)
      if (result.success) {
        setSlots(prev => prev.filter(s => s.id !== slotId))
        setModal(null)
        showToast('Créneau supprimé.', true)
      } else {
        showToast(result.error || 'Erreur lors de la suppression.', false)
      }
    })
  }, [])

  const CELL_H = 48 // px par tranche de 30min

  return (
    <div className="flex flex-col gap-4 select-none">

      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      {!readOnly && (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-xs text-[var(--color-on-surface-variant)]">
            Cliquez sur une cellule vide pour ajouter un créneau. Cliquez sur un créneau existant pour le modifier.
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-[var(--color-outline-variant)] rounded-lg text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)] transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimer
            </button>
          </div>
        </div>
      )}

      {/* ── Grille ──────────────────────────────────────────────────────────── */}
      <div className="overflow-x-auto rounded-xl border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)]">
        <div className="min-w-[640px]">

          {/* Header jours */}
          <div className="grid border-b border-[var(--color-outline-variant)]"
            style={{ gridTemplateColumns: '60px repeat(6, 1fr)' }}
          >
            <div className="h-10" />
            {DAYS.map(day => (
              <div key={day.id}
                className="h-10 flex items-center justify-center text-xs font-bold text-[var(--color-on-surface-variant)] border-l border-[var(--color-outline-variant)]"
              >
                <span className="hidden sm:block">{day.label}</span>
                <span className="sm:hidden">{day.short}</span>
              </div>
            ))}
          </div>

          {/* Corps de la grille */}
          <div className="relative grid"
            style={{ gridTemplateColumns: '60px repeat(6, 1fr)' }}
          >
            {/* Colonne des heures */}
            <div className="flex flex-col">
              {TIME_SLOTS.map((time, i) => (
                <div key={time}
                  className="flex items-start justify-end pr-2 text-[10px] font-medium text-[var(--color-on-surface-variant)]"
                  style={{ height: `${CELL_H}px`, marginTop: i === 0 ? -6 : 0 }}
                >
                  {time.endsWith(':00') ? time : ''}
                </div>
              ))}
            </div>

            {/* Colonnes des jours */}
            {DAYS.map(day => (
              <DayColumn
                key={day.id}
                day={day}
                slots={slotsByDay(day.id)}
                timeSlots={TIME_SLOTS}
                cellH={CELL_H}
                readOnly={readOnly}
                onCellClick={(startTime) => {
                  if (readOnly) return
                  setModal({ type: 'add', day: day.id, startTime })
                }}
                onSlotClick={(slot) => {
                  if (readOnly) return
                  setModal({ type: 'edit', slot })
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Modals ──────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {modal?.type === 'add' && (
          <SlotModal
            key="add"
            title="Ajouter un créneau"
            initialData={{
              class_id: classId,
              day_of_week: modal.day,
              start_time: modal.startTime,
              end_time: minutesToTime(timeToMinutes(modal.startTime) + 60),
              subject_name: '',
              teacher_name: '',
              room: '',
              color: '#065F46',
            }}
            loading={isPending}
            onClose={() => setModal(null)}
            onSubmit={(data) => handleCreate({ ...data, class_id: classId } as any)}
          />
        )}

        {modal?.type === 'edit' && (
          <SlotModal
            key="edit"
            title="Modifier le créneau"
            initialData={modal.slot}
            loading={isPending}
            onClose={() => setModal(null)}
            onSubmit={(data) => handleUpdate(modal.slot.id, data)}
            onDelete={() => setModal({ type: 'delete', slot: modal.slot })}
          />
        )}

        {modal?.type === 'delete' && (
          <DeleteConfirmModal
            key="delete"
            slot={modal.slot}
            loading={isPending}
            onClose={() => setModal(null)}
            onConfirm={() => handleDelete(modal.slot.id)}
          />
        )}
      </AnimatePresence>

      {/* ── Toast ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-2.5 px-5 py-3 rounded-full shadow-2xl text-sm font-semibold text-white"
            style={{
              background: toast.ok
                ? 'linear-gradient(135deg,#059669,#065F46)'
                : 'linear-gradient(135deg,#DC2626,#9B1111)',
              boxShadow: toast.ok
                ? '0 8px 32px rgba(5,150,105,0.4)'
                : '0 8px 32px rgba(220,38,38,0.4)',
            }}
          >
            {toast.ok
              ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              : <AlertCircle className="w-4 h-4 flex-shrink-0" />
            }
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Day Column ────────────────────────────────────────────────────────────────
function DayColumn({ day, slots, timeSlots, cellH, readOnly, onCellClick, onSlotClick }: {
  day: typeof DAYS[0]
  slots: TimetableSlot[]
  timeSlots: string[]
  cellH: number
  readOnly: boolean
  onCellClick: (startTime: string) => void
  onSlotClick: (slot: TimetableSlot) => void
}) {
  const totalH = timeSlots.length * cellH
  const firstTime = timeSlots[0]

  return (
    <div
      className="relative border-l border-[var(--color-outline-variant)]"
      style={{ height: `${totalH}px` }}
    >
      {/* Lignes de fond (grille horizontale) */}
      {timeSlots.map((time, i) => (
        <div
          key={time}
          className="absolute left-0 right-0 cursor-pointer transition-colors hover:bg-[var(--color-surface-container)]"
          style={{
            top: i * cellH,
            height: cellH,
            borderBottom: time.endsWith(':30')
              ? '1px dashed var(--color-surface-dim)'
              : '1px solid var(--color-outline-variant)',
          }}
          onClick={() => !readOnly && onCellClick(time)}
        />
      ))}

      {/* Créneaux */}
      {slots.map(slot => {
        const top = getSlotTop(slot.start_time) * cellH
        const height = Math.max(getSlotHeight(slot.start_time, slot.end_time) * cellH, cellH)

        return (
          <motion.button
            key={slot.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
            onClick={(e) => { e.stopPropagation(); onSlotClick(slot) }}
            className="absolute left-1 right-1 rounded-lg text-left overflow-hidden z-10 group"
            style={{
              top: top + 2,
              height: height - 4,
              background: slot.color,
              boxShadow: `0 2px 8px ${slot.color}55`,
            }}
          >
            <div className="p-1.5 h-full flex flex-col justify-start overflow-hidden">
              <p className="text-[10px] font-bold text-white truncate leading-tight">
                {slot.subject_name}
              </p>
              {height >= cellH * 2 && slot.teacher_name && (
                <p className="text-[9px] text-white/70 truncate leading-tight mt-0.5">
                  {slot.teacher_name}
                </p>
              )}
              {height >= cellH * 2 && (
                <p className="text-[9px] text-white/60 leading-tight mt-auto">
                  {slot.start_time.slice(0,5)}–{slot.end_time.slice(0,5)}
                </p>
              )}
              {!readOnly && (
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors duration-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <Pencil className="w-3.5 h-3.5 text-white drop-shadow" />
                </div>
              )}
            </div>
          </motion.button>
        )
      })}
    </div>
  )
}

// ── Slot Modal (Add / Edit) ───────────────────────────────────────────────────
function SlotModal({
  title, initialData, loading, onClose, onSubmit, onDelete,
}: {
  title: string
  initialData: Partial<TimetableSlot>
  loading: boolean
  onClose: () => void
  onSubmit: (data: Partial<TimetableSlot>) => void
  onDelete?: () => void
}) {
  const [form, setForm] = useState<Partial<TimetableSlot>>({
    day_of_week: 1,
    start_time: '08:00',
    end_time: '09:00',
    subject_name: '',
    teacher_name: '',
    room: '',
    color: '#065F46',
    ...initialData,
  })

  const set = (key: keyof TimetableSlot, value: any) =>
    setForm(prev => ({ ...prev, [key]: value }))

  return (
    <ModalBackdrop onClose={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 12 }}
        transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md"
      >
        {/* Outer bezel */}
        <div className="rounded-2xl p-0.5 shadow-2xl"
          style={{ background: 'linear-gradient(135deg,rgba(255,255,255,0.15),rgba(255,255,255,0.04))' }}
        >
          {/* Inner */}
          <div className="rounded-[calc(1rem-2px)] overflow-hidden"
            style={{ background: 'linear-gradient(160deg,#0f1823 0%,#0b0f19 100%)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(5,150,105,0.2)', border: '1px solid rgba(5,150,105,0.3)' }}
                >
                  <Calendar className="w-4 h-4 text-emerald-400" />
                </div>
                <h2 className="text-white font-bold text-base">{title}</h2>
              </div>
              <button onClick={onClose}
                className="w-7 h-7 rounded-full flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              {/* Jour */}
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">Jour</label>
                <div className="grid grid-cols-6 gap-1.5">
                  {DAYS.map(d => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => set('day_of_week', d.id)}
                      className="py-2 text-[10px] font-bold rounded-lg transition-all duration-200"
                      style={{
                        background: form.day_of_week === d.id
                          ? 'linear-gradient(135deg,#059669,#065F46)'
                          : 'rgba(255,255,255,0.06)',
                        color: form.day_of_week === d.id ? '#fff' : '#94a3b8',
                        boxShadow: form.day_of_week === d.id ? '0 2px 8px rgba(5,150,105,0.35)' : 'none',
                      }}
                    >
                      {d.short}
                    </button>
                  ))}
                </div>
              </div>

              {/* Horaires */}
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Début" icon={<Clock className="w-3.5 h-3.5 text-slate-500" />}>
                  <select
                    value={form.start_time || '08:00'}
                    onChange={e => set('start_time', e.target.value)}
                    className="w-full bg-transparent text-white text-sm outline-none"
                  >
                    {TIME_SLOTS.map(t => <option key={t} value={t} className="bg-slate-900">{t}</option>)}
                  </select>
                </FormField>
                <FormField label="Fin" icon={<Clock className="w-3.5 h-3.5 text-slate-500" />}>
                  <select
                    value={form.end_time || '09:00'}
                    onChange={e => set('end_time', e.target.value)}
                    className="w-full bg-transparent text-white text-sm outline-none"
                  >
                    {TIME_SLOTS.map(t => <option key={t} value={t} className="bg-slate-900">{t}</option>)}
                  </select>
                </FormField>
              </div>

              {/* Matière */}
              <FormField label="Matière *" icon={<BookOpen className="w-3.5 h-3.5 text-slate-500" />}>
                <input
                  type="text"
                  placeholder="Ex: Mathématiques"
                  value={form.subject_name || ''}
                  onChange={e => set('subject_name', e.target.value)}
                  className="w-full bg-transparent text-white text-sm placeholder:text-slate-600 outline-none"
                />
              </FormField>

              {/* Enseignant */}
              <FormField label="Enseignant" icon={<User className="w-3.5 h-3.5 text-slate-500" />}>
                <input
                  type="text"
                  placeholder="Ex: M. Kouassi"
                  value={form.teacher_name || ''}
                  onChange={e => set('teacher_name', e.target.value)}
                  className="w-full bg-transparent text-white text-sm placeholder:text-slate-600 outline-none"
                />
              </FormField>

              {/* Salle */}
              <FormField label="Salle" icon={<MapPin className="w-3.5 h-3.5 text-slate-500" />}>
                <input
                  type="text"
                  placeholder="Ex: Salle 12"
                  value={form.room || ''}
                  onChange={e => set('room', e.target.value)}
                  className="w-full bg-transparent text-white text-sm placeholder:text-slate-600 outline-none"
                />
              </FormField>

              {/* Couleur */}
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Palette className="w-3 h-3" /> Couleur
                </label>
                <div className="flex gap-2 flex-wrap">
                  {SUBJECT_COLORS.map(c => (
                    <button
                      key={c.value}
                      type="button"
                      title={c.label}
                      onClick={() => set('color', c.value)}
                      className="w-7 h-7 rounded-full transition-all duration-200"
                      style={{
                        background: c.value,
                        boxShadow: form.color === c.value ? `0 0 0 2px #fff, 0 0 0 4px ${c.value}` : 'none',
                        transform: form.color === c.value ? 'scale(1.15)' : 'scale(1)',
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 pb-6 flex items-center gap-2"
              style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16 }}
            >
              {onDelete && (
                <button onClick={onDelete}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Supprimer
                </button>
              )}
              <div className="flex-1" />
              <button onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-full transition-all hover:bg-white/10"
              >
                Annuler
              </button>
              <button
                disabled={loading || !form.subject_name?.trim()}
                onClick={() => onSubmit(form)}
                className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white rounded-full transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg,#059669,#065F46)', boxShadow: '0 4px 16px rgba(5,150,105,0.35)' }}
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </ModalBackdrop>
  )
}

// ── Delete Confirm Modal ──────────────────────────────────────────────────────
function DeleteConfirmModal({ slot, loading, onClose, onConfirm }: {
  slot: TimetableSlot
  loading: boolean
  onClose: () => void
  onConfirm: () => void
}) {
  return (
    <ModalBackdrop onClose={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.92 }}
        transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-sm"
      >
        <div className="rounded-2xl p-0.5 shadow-2xl"
          style={{ background: 'linear-gradient(135deg,rgba(255,255,255,0.12),rgba(255,255,255,0.03))' }}
        >
          <div className="rounded-[calc(1rem-2px)] overflow-hidden p-6 space-y-4"
            style={{ background: 'linear-gradient(160deg,#0f1823,#0b0f19)' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.3)' }}
              >
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-white font-bold">Supprimer ce créneau ?</p>
                <p className="text-slate-400 text-xs">Cette action est irréversible.</p>
              </div>
            </div>

            <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-white text-sm font-semibold">{slot.subject_name}</p>
              <p className="text-slate-400 text-xs mt-0.5">
                {DAYS.find(d => d.id === slot.day_of_week)?.label} · {slot.start_time.slice(0,5)}–{slot.end_time.slice(0,5)}
              </p>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button onClick={onClose}
                className="px-4 py-2 text-sm font-semibold text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-all"
              >
                Annuler
              </button>
              <button onClick={onConfirm} disabled={loading}
                className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white rounded-full transition-all duration-300 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg,#DC2626,#9B1111)', boxShadow: '0 4px 16px rgba(220,38,38,0.35)' }}
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Supprimer
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </ModalBackdrop>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────
function ModalBackdrop({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      className="fixed inset-0 z-[7000] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      {children}
    </div>
  )
}

function FormField({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">{label}</label>
      <div
        className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        {icon}
        {children}
      </div>
    </div>
  )
}
