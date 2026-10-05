'use client'

import { LayoutGrid } from 'lucide-react'

export function RaccourcisTrigger() {
  return (
    <button
      type="button"
      className="group flex items-center gap-3 p-3 rounded-lg border border-transparent hover:border-slate-200 hover:bg-slate-50 transition-colors text-left"
      onClick={() => {
        const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true })
        window.dispatchEvent(event)
      }}
    >
      <span className="w-9 h-9 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-emerald-700 group-hover:text-white flex items-center justify-center transition-colors shrink-0">
        <LayoutGrid size={17} />
      </span>
      <span className="text-xs font-medium text-slate-700 leading-tight">
        Recherche rapide
        <kbd className="ml-1.5 text-[10px] font-mono text-slate-500">Ctrl K</kbd>
      </span>
    </button>
  )
}
