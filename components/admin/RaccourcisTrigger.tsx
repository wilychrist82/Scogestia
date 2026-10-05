'use client'

import { LayoutGrid } from 'lucide-react'

export function RaccourcisTrigger() {
  return (
    <button
      type="button"
      className="group flex flex-col items-center gap-2 p-3.5 rounded-xl border border-transparent hover:bg-slate-100 hover:border-slate-200 transition-all duration-200 cursor-pointer"
      onClick={() => {
        const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true })
        window.dispatchEvent(event)
      }}
      title="Ouvrir la palette de commandes (Ctrl + K)"
    >
      <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center group-hover:bg-slate-700 group-hover:text-white group-hover:scale-110 transition-all duration-200 shadow-xs">
        <LayoutGrid size={20} />
      </div>
      <span className="text-xs font-bold text-slate-800 text-center leading-tight">
        Raccourcis<br />
        <span className="text-[10px] text-slate-400 font-normal font-mono">Ctrl K</span>
      </span>
    </button>
  )
}
