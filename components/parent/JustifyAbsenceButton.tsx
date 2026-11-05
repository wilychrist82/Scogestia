'use client'

import { useState, useTransition } from 'react'
import { submitAbsenceJustification } from '@/app/actions/attendance'
import { MessageSquarePlus, Check, X, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

interface JustifyAbsenceButtonProps {
  attendanceId: string
  currentJustification?: string | null
  status: string
}

const QUICK_REASONS = [
  'Raison médicale / Consultation',
  'Indisposition passagère',
  'Empêchement familial',
  'Problème de transport',
]

export function JustifyAbsenceButton({
  attendanceId,
  currentJustification,
  status,
}: JustifyAbsenceButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [reason, setReason] = useState(currentJustification || '')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  if (status === 'present') return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!reason.trim()) {
      toast.error('Veuillez saisir un motif.')
      return
    }
    startTransition(async () => {
      const res = await submitAbsenceJustification(attendanceId, reason)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success('Justification transmise à la direction !')
        setIsOpen(false)
        router.refresh()
      }
    })
  }

  return (
    <div className="mt-2.5">
      {!isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors"
        >
          <MessageSquarePlus className="w-3.5 h-3.5 text-emerald-600" />
          {currentJustification ? 'Modifier le motif' : 'Justifier auprès de l’école'}
        </button>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="mt-2 p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 animate-in fade-in duration-150"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">
              Motif de l&apos;absence ou du retard
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {QUICK_REASONS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setReason(preset)}
                className="text-[11px] px-2 py-1 rounded-md bg-white border border-slate-200 text-slate-600 hover:border-emerald-300 hover:text-emerald-700 transition-colors"
              >
                {preset}
              </button>
            ))}
          </div>

          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            placeholder="Expliquez brièvement le motif (ex: rendez-vous médical, certificat disponible)..."
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
            disabled={isPending}
          />

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              disabled={isPending}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200/60 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-700 text-white hover:bg-emerald-800 transition-colors disabled:opacity-50"
            >
              {isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              Envoyer le motif
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

