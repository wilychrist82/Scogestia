'use client'

import React, { useState } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { LinkChildModal } from './LinkChildModal'
import { UserPlus, Check, Smile, User } from 'lucide-react'

export type ChildItem = {
  id: string
  first_name: string
  last_name: string
  class_id?: string
  className?: string
  classes?: { name: string } | null
}

type Props = {
  childrenList: ChildItem[]
  selectedChildId: string
  title?: string
}

export function ChildSwitchBar({ childrenList, selectedChildId, title }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleSelectChild = (childId: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('child', childId)
    router.push(`${pathname}?${params.toString()}`)
  }

  const handleSuccess = (newChildId: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('child', newChildId)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <>
      <div className="bg-white/90 backdrop-blur-md border border-gray-100 rounded-2xl p-2.5 sm:p-3 shadow-xs mb-4 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar py-0.5 flex-1 min-w-[200px]">
          {title && (
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider shrink-0 mr-1 hidden sm:inline">
              {title} :
            </span>
          )}
          {childrenList.map(child => {
            const isSelected = child.id === selectedChildId
            const className = child.className || child.classes?.name || ''

            return (
              <button
                key={child.id}
                type="button"
                onClick={() => handleSelectChild(child.id)}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 active:scale-95 ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-500/30'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80'
                }`}
              >
                {isSelected ? (
                  <Smile size={16} className="text-emerald-200 shrink-0" />
                ) : (
                  <User size={15} className="text-slate-400 shrink-0" />
                )}
                <span>{child.first_name}</span>
                {className && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {className}
                  </span>
                )}
                {isSelected && <Check size={13} className="stroke-[3] text-emerald-200" />}
              </button>
            )
          })}
        </div>

        {/* Bouton pour ajouter/lier un autre enfant */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold text-[var(--color-primary)] bg-[var(--color-primary)]/10 hover:bg-[var(--color-primary)]/15 transition-colors shrink-0 active:scale-95"
          title="Lier un autre enfant avec un code"
        >
          <UserPlus size={14} />
          <span>+ Ajouter</span>
        </button>
      </div>

      <LinkChildModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSuccess}
      />
    </>
  )
}
