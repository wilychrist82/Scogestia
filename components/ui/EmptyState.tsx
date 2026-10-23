'use client'

import React from 'react'
import { FolderOpen, ArrowRight, Sparkles } from 'lucide-react'

interface EmptyStateProps {
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  secondaryActionLabel?: string
  onSecondaryAction?: () => void
  icon?: React.ElementType
  badge?: string
  tip?: string
  compact?: boolean
}

export function EmptyState({ 
  title, 
  description, 
  actionLabel, 
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  icon: Icon = FolderOpen,
  badge,
  tip,
  compact = false,
}: EmptyStateProps) {
  return (
    <div 
      className={`relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-b from-white via-slate-50/50 to-white text-center shadow-sm transition-all ${
        compact ? 'p-8 min-h-[260px]' : 'p-10 sm:p-14 min-h-[360px]'
      } flex flex-col items-center justify-center`}
    >
      {/* Ambient background glow */}
      <div 
        aria-hidden="true" 
        className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 h-56 w-72 rounded-full bg-emerald-500/5 blur-3xl"
      />

      {/* Badge optionnel */}
      {badge && (
        <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50/80 px-3 py-1 text-xs font-bold text-emerald-800 shadow-xs">
          <Sparkles size={13} className="text-emerald-600" />
          <span>{badge}</span>
        </div>
      )}

      {/* Layered Icon Frame */}
      <div className="relative mb-5 flex items-center justify-center">
        <div className="absolute h-20 w-20 rounded-3xl bg-emerald-500/10 blur-xl" />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-200/60 bg-gradient-to-b from-emerald-50 to-emerald-100/60 text-emerald-700 shadow-inner">
          <Icon size={30} strokeWidth={2.2} />
        </div>
      </div>

      {/* Text Hierarchy */}
      <h3 className="mb-2 text-lg sm:text-xl font-extrabold tracking-tight text-slate-900">
        {title}
      </h3>
      <p className="max-w-md text-sm leading-relaxed text-slate-600 mb-6">
        {description}
      </p>

      {/* Actions */}
      {(actionLabel || secondaryActionLabel) && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {actionLabel && onAction && (
            <button 
              type="button"
              onClick={onAction}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#006039] to-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:from-[#004d2e] hover:to-emerald-700 hover:shadow-md active:scale-[0.98] cursor-pointer"
            >
              <span>{actionLabel}</span>
              <ArrowRight size={15} />
            </button>
          )}

          {secondaryActionLabel && onSecondaryAction && (
            <button 
              type="button"
              onClick={onSecondaryAction}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-xs transition-colors hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
            >
              {secondaryActionLabel}
            </button>
          )}
        </div>
      )}

      {/* Tip footer */}
      {tip && (
        <div className="mt-8 rounded-xl border border-slate-200/60 bg-slate-50/80 px-4 py-2 text-xs font-medium text-slate-600">
          💡 <span className="font-semibold text-slate-800">Astuce :</span> {tip}
        </div>
      )}
    </div>
  )
}
