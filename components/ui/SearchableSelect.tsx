'use client'

import { useState, useRef, useEffect } from 'react'

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
        className={`w-full min-h-[48px] px-4 py-2 border rounded-lg bg-[var(--color-surface)] flex items-center justify-between cursor-pointer transition-colors ${isOpen ? 'border-[var(--color-primary)] ring-1 ring-[var(--color-primary)]' : 'border-[var(--color-outline-variant)]'}`}
        onClick={() => {
          setIsOpen(!isOpen)
          if (!isOpen) setSearch('')
        }}
      >
        <span className={`truncate ${!selectedOption ? 'text-[var(--color-on-surface-variant)]' : 'text-[var(--color-on-surface)]'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span className="material-symbols-outlined text-[var(--color-on-surface-variant)]">
          {isOpen ? 'expand_less' : 'expand_more'}
        </span>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-lg shadow-lg max-h-60 overflow-y-auto">
          <div className="sticky top-0 p-2 bg-[var(--color-surface-container-lowest)] border-b border-[var(--color-outline-variant)]">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-on-surface-variant)] text-sm">search</span>
              <input
                type="text"
                className="w-full h-10 pl-9 pr-4 text-sm border border-[var(--color-outline-variant)] rounded focus:outline-none focus:border-[var(--color-primary)]"
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
