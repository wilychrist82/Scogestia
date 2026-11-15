'use client'

import { useEffect, useId } from 'react'
import { AlertTriangle, HelpCircle, Loader2, Trash2, X } from 'lucide-react'

export type ConfirmDialogVariant = 'danger' | 'warning' | 'primary'

export type ConfirmDialogProps = {
  isOpen: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: ConfirmDialogVariant
  isLoading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

const VARIANT_CONFIG: Record<
  ConfirmDialogVariant,
  {
    iconBg: string
    iconColor: string
    confirmBtn: string
    Icon: typeof Trash2
  }
> = {
  danger: {
    iconBg: 'bg-rose-50 ring-1 ring-rose-200',
    iconColor: 'text-rose-600',
    confirmBtn: 'bg-rose-600 hover:bg-rose-700 text-white focus-visible:ring-rose-500',
    Icon: Trash2,
  },
  warning: {
    iconBg: 'bg-amber-50 ring-1 ring-amber-200',
    iconColor: 'text-amber-600',
    confirmBtn: 'bg-amber-600 hover:bg-amber-700 text-white focus-visible:ring-amber-500',
    Icon: AlertTriangle,
  },
  primary: {
    iconBg: 'bg-emerald-50 ring-1 ring-emerald-200',
    iconColor: 'text-emerald-700',
    confirmBtn: 'bg-emerald-700 hover:bg-emerald-800 text-white focus-visible:ring-emerald-600',
    Icon: HelpCircle,
  },
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  variant = 'danger',
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const titleId = useId()
  const descId = useId()

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onCancel()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isLoading, onCancel])

  if (!isOpen) return null

  const { iconBg, iconColor, confirmBtn, Icon } = VARIANT_CONFIG[variant]

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/55 p-4 backdrop-blur-[2px] animate-in fade-in duration-150"
      onClick={() => {
        if (!isLoading) onCancel()
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_24px_48px_-12px_rgba(15,23,42,0.28)]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          aria-label="Fermer la fenêtre de confirmation"
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-4">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
          <div className="min-w-0 flex-1 pr-4">
            <h3 id={titleId} className="text-base font-bold text-slate-900">
              {title}
            </h3>
            <p id={descId} className="mt-1.5 text-sm leading-relaxed text-slate-600">
              {description}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60 ${confirmBtn}`}
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
