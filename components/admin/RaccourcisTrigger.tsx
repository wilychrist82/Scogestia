'use client'

import { LayoutGrid } from 'lucide-react'

export function RaccourcisTrigger() {
  return (
    <div
      className="group flex flex-col items-center gap-2 p-3 rounded-xl border border-transparent hover:bg-slate-50 hover:border-slate-200 transition-all duration-200 cursor-pointer"
      onClick={() => {
        const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true })
        window.dispatchEvent(event)
      }}
    >
      <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center group-hover:bg-slate-600 group-hover:text-white group-hover:scale-110 transition-all duration-200 shadow-sm">
        <LayoutGrid size={20} />
      </div>
      <span className="text-[11px] font-bold text-[var(--color-on-surface)] text-center leading-tight">
        Raccourcis<br />⌘K
      </span>
    </div>
  )
}
