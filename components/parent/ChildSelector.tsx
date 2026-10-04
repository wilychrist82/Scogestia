'use client'

import React from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { ChevronDown, User } from 'lucide-react'

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

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value
    const params = new URLSearchParams(searchParams.toString())
    params.set('child', newId)
    params.set('student_id', newId)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="relative inline-flex items-center">
      <div className="absolute left-3 pointer-events-none text-emerald-600">
        <User size={15} />
      </div>

      <select 
        className="appearance-none pl-8 pr-8 py-1.5 rounded-xl transition-all active:scale-[0.98] bg-white border border-slate-200 text-slate-800 font-semibold text-xs cursor-pointer shadow-2xs hover:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        value={selectedId}
        onChange={handleChange}
        aria-label="Sélectionner un enfant"
      >
        {childrenList.map(child => (
          <option key={child.id} value={child.id}>
            {child.first_name} {child.last_name}
          </option>
        ))}
      </select>

      <div className="absolute right-2.5 pointer-events-none text-slate-400">
        <ChevronDown size={14} />
      </div>
    </div>
  )
}
