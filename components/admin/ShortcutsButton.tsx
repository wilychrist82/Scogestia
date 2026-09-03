'use client'

import { useState, useEffect, useTransition } from 'react'
import { LayoutGrid, Search, X, Users, BookOpen, UserPlus, Wallet, Banknote, CalendarPlus, Loader2, User, FileText, BadgeInfo } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { globalSearch, SearchResult } from '@/app/actions/search'

export function ShortcutsButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const shortcuts = [
    { name: 'Inscrire un élève', icon: UserPlus, href: '/admin/eleves/nouveau', category: 'Élèves' },
    { name: 'Liste des élèves', icon: Users, href: '/admin/eleves', category: 'Élèves' },
    { name: 'Créer une classe', icon: BookOpen, href: '/admin/classes', category: 'Académique' },
    { name: 'Générer des échéances', icon: CalendarPlus, href: '/admin/finance/echeances', category: 'Finance' },
    { name: 'Encaisser un paiement', icon: Banknote, href: '/admin/finance/paiements', category: 'Finance' },
    { name: 'Gérer les impayés', icon: Wallet, href: '/admin/finance/impayes', category: 'Finance' },
    { name: 'Gérer le personnel', icon: Users, href: '/admin/personnel', category: 'Administration' },
    { name: 'Devoirs et Notes', icon: BookOpen, href: '/admin/academique', category: 'Académique' },
    { name: 'Tableau de bord financier', icon: Wallet, href: '/admin/finance', category: 'Finance' },
  ]

  const filteredShortcuts = shortcuts.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Debounce logic
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Fetch results when debounced query changes
  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      startTransition(async () => {
        const results = await globalSearch(debouncedQuery)
        setSearchResults(results)
      })
    } else {
      setSearchResults([])
    }
  }, [debouncedQuery])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setIsOpen(open => !open)
      }
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center justify-center gap-2 bg-[var(--color-sidebar-bg)] hover:bg-[var(--color-sidebar-hover)] hover:shadow-lg hover:-translate-y-0.5 text-white py-3 px-2 rounded-lg font-semibold text-[11px] sm:text-[13px] transition-all duration-300 shadow-sm text-center leading-tight group w-full h-full"
      >
        <LayoutGrid size={16} className="group-hover:scale-110 transition-transform shrink-0" />
        Raccourcis
        <span className="hidden sm:inline-block ml-1 opacity-60 font-normal text-[10px] bg-white/20 px-1.5 py-0.5 rounded">⌘K</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] bg-[#0b1c30]/40  transition-opacity p-4">
          <div className="bg-[var(--color-surface-container-lowest)] w-full max-w-2xl rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-[var(--color-outline-variant)] flex flex-col overflow-hidden animate-[fadeIn_0.2s_ease-out]">
            {/* Search Input */}
            <div className="flex items-center px-4 py-4 border-b border-[var(--color-outline-variant)] bg-[var(--color-surface-bright)]">
              <Search className="text-[var(--color-on-surface-variant)] w-6 h-6 mr-3" />
              <input 
                type="text"
                autoFocus
                placeholder="Que souhaitez-vous faire ? (ex: élève, facture...)"
                className="flex-1 bg-transparent border-none outline-none text-lg text-[var(--color-on-surface)] placeholder:text-[var(--color-on-surface-variant)]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-md text-[var(--color-on-surface-variant)] hover:bg-[#dce9ff] hover:text-[var(--color-primary)] transition-colors ml-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Results */}
            <div className="max-h-[60vh] overflow-y-auto p-2 custom-scrollbar bg-[var(--color-surface-container-lowest)]">
              {/* Database Search Results */}
              {searchQuery.length >= 2 && (
                <div className="mb-4">
                  <div className="px-4 py-2 text-xs font-bold text-[var(--color-on-surface-variant)] uppercase tracking-wider flex items-center gap-2">
                    Résultats de la base de données
                    {isPending && <Loader2 className="w-3 h-3 animate-spin" />}
                  </div>
                  
                  {!isPending && searchResults.length === 0 ? (
                     <div className="px-4 py-3 text-sm text-[var(--color-on-surface-variant)] italic">
                       Aucun résultat trouvé pour "{searchQuery}".
                     </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-2">
                      {searchResults.map((result) => (
                        <button
                          key={result.id}
                          onClick={() => {
                            setIsOpen(false)
                            router.push(result.href)
                          }}
                          className="flex items-center gap-4 p-3 rounded-xl text-left hover:bg-[#eff4ff] group transition-colors border border-transparent hover:border-[#dce9ff]"
                        >
                          <div className="w-10 h-10 rounded-lg bg-[var(--color-surface-bright)] group-hover:bg-white flex items-center justify-center text-[var(--color-on-surface-variant)] group-hover:text-[var(--color-primary)] transition-colors shadow-sm">
                            {result.type === 'student' ? <User className="w-5 h-5" /> : 
                             result.type === 'invoice' ? <FileText className="w-5 h-5" /> : 
                             <BadgeInfo className="w-5 h-5" />}
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-[var(--color-on-surface)] group-hover:text-[var(--color-primary)] transition-colors">
                              {result.title}
                            </p>
                            <p className="text-xs text-[var(--color-on-surface-variant)] mt-0.5">
                              {result.subtitle}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Static Shortcuts */}
              <div>
                <div className="px-4 py-2 text-xs font-bold text-[var(--color-on-surface-variant)] uppercase tracking-wider mb-2">
                  Navigation rapide
                </div>
                {filteredShortcuts.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {filteredShortcuts.map((shortcut, index) => {
                      const Icon = shortcut.icon
                      return (
                        <button
                          key={index}
                          onClick={() => {
                            setIsOpen(false)
                            router.push(shortcut.href)
                          }}
                          className="flex items-center gap-4 p-3 rounded-xl text-left hover:bg-[#eff4ff] group transition-colors border border-transparent hover:border-[#dce9ff]"
                        >
                          <div className="w-10 h-10 rounded-lg bg-[var(--color-surface-bright)] group-hover:bg-white flex items-center justify-center text-[var(--color-on-surface-variant)] group-hover:text-[var(--color-primary)] transition-colors shadow-sm">
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-[var(--color-on-surface)] group-hover:text-[var(--color-primary)] transition-colors">
                              {shortcut.name}
                            </p>
                            <p className="text-xs text-[var(--color-on-surface-variant)] mt-0.5">
                              {shortcut.category}
                            </p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <div className="py-6 text-center text-[var(--color-on-surface-variant)]">
                    <p className="text-sm font-medium">Aucun raccourci trouvé.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-[var(--color-outline-variant)] bg-[var(--color-surface-bright)] text-xs text-[var(--color-on-surface-variant)] flex justify-between items-center">
              <span>Utilisez les flèches pour naviguer</span>
              <span className="flex items-center gap-1">
                Appuyez sur <kbd className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] px-1.5 py-0.5 rounded text-[10px] font-mono">Echap</kbd> pour fermer
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
