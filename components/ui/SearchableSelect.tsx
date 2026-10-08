'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, ChevronUp, Search } from 'lucide-react'

type Option = {
  value: string
  label: string
}

type Props = {
  options: Option[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
}

export function SearchableSelect({ options, value, onChange, placeholder = "Rechercher...", required = false }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find(o => o.value === value)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredOptions = options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Hidden input for HTML form validation */}
      <input type="hidden" value={value} required={required} onChange={() => {}} />
      
      <div 
        className={`w-full min-h-[44px] px-3.5 py-2 border rounded-xl bg-white flex items-center justify-between cursor-pointer transition-all ${isOpen ? 'border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/10' : 'border-slate-200 hover:border-slate-300'}`}
        onClick={() => {
          setIsOpen(!isOpen)
          if (!isOpen) setSearch('')
        }}
      >
        <span className={`truncate text-sm font-medium ${!selectedOption ? 'text-slate-400' : 'text-slate-800'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
        )}
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto animate-in fade-in duration-150">
          <div className="sticky top-0 p-2 bg-white border-b border-slate-100">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 absolute left-3 text-slate-400" />
              <input
                type="text"
                className="w-full h-9 pl-9 pr-3 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-[var(--color-primary)] focus:bg-white transition-all placeholder:text-slate-400 font-medium"
                placeholder="Taper pour rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
            </div>
          </div>
          
          <div className="py-1">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-sm text-[var(--color-on-surface-variant)] text-center">
                Aucun résultat trouvé.
              </div>
            ) : (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  className={`px-4 py-2.5 text-sm cursor-pointer hover:bg-[#eff4ff] hover:text-[var(--color-primary)] transition-colors ${value === option.value ? 'bg-[#e6eeff] text-[var(--color-primary)] font-semibold' : 'text-[var(--color-on-surface)]'}`}
                  onClick={() => {
                    onChange(option.value)
                    setIsOpen(false)
                  }}
                >
                  {option.label}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
