'use client'

import { useState } from 'react'
import { LinkChildModal } from './LinkChildModal'
import { UserPlus } from 'lucide-react'

export function AddChildButton({ variant = 'card' }: { variant?: 'card' | 'badge' }) {
  const [isOpen, setIsOpen] = useState(false)

  if (variant === 'badge') {
    return (
      <>
        <button
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-[var(--color-primary)] bg-[var(--color-primary)]/10 hover:bg-[var(--color-primary)]/15 transition-colors"
        >
          <UserPlus size={14} />
          <span>Lier un autre enfant</span>
        </button>
        <LinkChildModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
      </>
    )
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-full bg-white/60 hover:bg-white border-2 border-dashed border-gray-200 hover:border-[var(--color-primary)] rounded-[2rem] p-5 sm:p-6 text-gray-500 hover:text-[var(--color-primary)] transition-all flex items-center justify-center gap-3 group shadow-2xs hover:shadow-sm"
      >
        <div className="w-12 h-12 rounded-2xl bg-gray-100 group-hover:bg-[var(--color-primary)]/10 flex items-center justify-center text-gray-400 group-hover:text-[var(--color-primary)] transition-colors">
          <UserPlus size={22} />
        </div>
        <div className="text-left">
          <p className="text-sm font-bold text-gray-800 group-hover:text-[var(--color-primary)] transition-colors">
            Lier un autre enfant
          </p>
          <p className="text-xs text-gray-400">
            Vous avez un autre enfant inscrit dans l'établissement ? Cliquez pour entrer son code
          </p>
        </div>
      </button>

      <LinkChildModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}
