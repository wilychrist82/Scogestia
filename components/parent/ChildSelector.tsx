'use client'

import React from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'

type Child = {
  id: string
  first_name: string
  last_name: string
  class_id?: string
}

type Props = {
  childrenList: Child[]
  selectedId: string
}

export function ChildSelector({ childrenList, selectedId }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  if (childrenList.length <= 1) {
    return null // Pas besoin de sélecteur si 0 ou 1 enfant
  }

  return (
    <div className="relative inline-block">
      <select 
        className="appearance-none flex items-center gap-xs px-10 py-1 rounded-lg hover:bg-[var(--color-surface-container-low)] transition-colors active:scale-95 bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)] text-[var(--color-on-surface)] font-semibold text-sm cursor-pointer"
        value={selectedId}
        onChange={(e) => {
          const params = new URLSearchParams(searchParams.toString())
          params.set('student_id', e.target.value)
          router.push(`${pathname}?${params.toString()}`)
        }}
      >
        {childrenList.map(child => (
          <option key={child.id} value={child.id}>
            Enfant : {child.first_name}
          </option>
        ))}
      </select>
      {/* Icon custom pour le dropdown par dessus l'apparence native */}
      <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-on-surface-variant)] pointer-events-none text-xl">
        arrow_drop_down
      </span>
    </div>
  )
}

