'use client'

import Link from 'next/link'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'

type DataErrorCardProps = {
  title?: string
  message: string
  actionHref?: string
  actionLabel?: string
  onRetry?: () => void
}

export function DataErrorCard({
  title = "Données indisponibles",
  message,
  actionHref = "/admin",
  actionLabel = "Retour au tableau de bord",
  onRetry
}: DataErrorCardProps) {
  return (
    <div className="min-h-[40vh] flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-3xl bg-white border border-rose-100 p-8 shadow-[0_12px_40px_-15px_rgba(244,63,94,0.12)] text-center">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 ring-8 ring-rose-50/50">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 tracking-tight mb-2">
          {title}
        </h3>
        <p className="text-sm text-slate-600 leading-relaxed mb-6">
          {message}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          {onRetry ? (
            <button
              onClick={onRetry}
              className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Réessayer
            </button>
          ) : (
            <Link
              href={actionHref}
              className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
            >
              <Home className="w-3.5 h-3.5" />
              {actionLabel}
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
