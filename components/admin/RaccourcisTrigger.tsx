'use client'

import { LayoutGrid } from 'lucide-react'

export function RaccourcisTrigger() {
  return (
    <button
      type="button"
      id="quick-action-raccourcis"
      className="dash-sheen group relative flex flex-col items-start gap-4 overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 text-left transition-all duration-500 hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_18px_36px_-16px_rgba(15,23,42,0.25)] cursor-pointer"
      onClick={() => {
        const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true })
        window.dispatchEvent(event)
      }}
      title="Ouvrir la palette de commandes (Ctrl + K)"
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-600 to-slate-900 text-white shadow-lg shadow-slate-500/30 transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110">
        <LayoutGrid size={19} />
      </div>
      <span className="text-[13px] font-bold leading-tight text-slate-900">
        Raccourcis
        <span className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-slate-400">
          <kbd className="rounded border border-slate-200 bg-slate-50 px-1 font-mono">Ctrl</kbd>
          <kbd className="rounded border border-slate-200 bg-slate-50 px-1 font-mono">K</kbd>
        </span>
      </span>
    </button>
  )
}
