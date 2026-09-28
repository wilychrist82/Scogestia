'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Search, 
  X, 
  Users, 
  Presentation, 
  CircleDollarSign, 
  UserCircle, 
  ArrowRight, 
  Clock, 
  BookOpen, 
  Settings, 
  CreditCard,
  FileText
} from 'lucide-react'
import { globalSearch, SearchResult } from '@/app/actions/search'

interface CommandPaletteProps {
  isOpen?: boolean
  onClose?: () => void
}

const quickLinks = [
  { title: 'Élèves', subtitle: 'Gestion des inscriptions & fiches', href: '/admin/eleves', icon: Users },
  { title: 'Classes', subtitle: 'Gestion des niveaux et effectifs', href: '/admin/classes', icon: Presentation },
  { title: 'Caisse & Encaissements', subtitle: 'Enregistrer un paiement comptant', href: '/admin/finance/caisse', icon: CircleDollarSign },
  { title: 'Échéances de paiement', subtitle: 'Suivi des tranches de scolarité', href: '/admin/finance/echeances', icon: CreditCard },
  { title: 'Bulletins scolaires', subtitle: 'Génération et impression des livrets', href: '/admin/academique/bulletins', icon: BookOpen },
  { title: 'Paramètres école', subtitle: 'Configuration générale & profil', href: '/admin/parametres', icon: Settings },
]

export function CommandPalette({ isOpen: controlledIsOpen, onClose: controlledOnClose }: CommandPaletteProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false)
  const isControlled = controlledIsOpen !== undefined
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isPending, startTransition] = useTransition()

  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const handleClose = () => {
    if (isControlled && controlledOnClose) {
      controlledOnClose()
    } else {
      setInternalIsOpen(false)
    }
    setQuery('')
    setResults([])
    setSelectedIndex(0)
  }

  // Écoute du raccourci clavier global Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        if (isControlled && controlledOnClose) {
          if (isOpen) controlledOnClose()
        } else {
          setInternalIsOpen(prev => !prev)
        }
      }
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault()
        handleClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isControlled, controlledOnClose])

  // Focus automatique lors de l'ouverture
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  // Recherche avec debounce
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([])
      setSelectedIndex(0)
      return
    }

    const timer = setTimeout(() => {
      startTransition(async () => {
        try {
          const res = await globalSearch(query)
          setResults(res)
          setSelectedIndex(0)
        } catch (err) {
          console.error('Erreur de recherche globale:', err)
        }
      })
    }, 220)

    return () => clearTimeout(timer)
  }, [query])

  // Navigation clavier dans la liste
  const totalItems = query.trim().length >= 2 ? results.length : quickLinks.length

  const handleKeyDownList = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => (prev + 1) % (totalItems || 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => (prev - 1 + (totalItems || 1)) % (totalItems || 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (query.trim().length >= 2 && results[selectedIndex]) {
        router.push(results[selectedIndex].href)
        handleClose()
      } else if (quickLinks[selectedIndex]) {
        router.push(quickLinks[selectedIndex].href)
        handleClose()
      }
    }
  }

  const navigateTo = (href: string) => {
    router.push(href)
    handleClose()
  }

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'student': return <Users size={16} className="text-emerald-500" />
      case 'class': return <Presentation size={16} className="text-blue-500" />
      case 'invoice': return <CircleDollarSign size={16} className="text-amber-500" />
      case 'staff': return <UserCircle size={16} className="text-purple-500" />
      default: return <FileText size={16} className="text-slate-400" />
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transform animate-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Barre de recherche */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-100 bg-slate-50/50 gap-3">
          <Search size={20} className="text-slate-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDownList}
            placeholder="Rechercher un élève, classe, facture, personnel... (ex: Komi, CM2)"
            className="w-full bg-transparent text-slate-800 placeholder-slate-400 text-base outline-none font-medium"
          />
          {isPending ? (
            <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
          ) : query ? (
            <button 
              onClick={() => { setQuery(''); inputRef.current?.focus() }}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            >
              <X size={18} />
            </button>
          ) : (
            <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold text-slate-400 bg-slate-200/80 rounded border border-slate-300">
              ESC
            </kbd>
          )}
        </div>

        {/* Liste des résultats */}
        <div ref={listRef} className="overflow-y-auto p-2 divide-y divide-slate-50 space-y-1">
          {query.trim().length >= 2 ? (
            results.length === 0 && !isPending ? (
              <div className="p-8 text-center text-slate-400">
                <Search size={32} className="mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-semibold text-slate-600">Aucun résultat trouvé pour "{query}"</p>
                <p className="text-xs text-slate-400 mt-1">Vérifiez l'orthographe du nom ou du matricule.</p>
              </div>
            ) : (
              results.map((res, index) => (
                <div
                  key={`${res.type}-${res.id}-${index}`}
                  onClick={() => navigateTo(res.href)}
                  className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-150 ${
                    selectedIndex === index 
                      ? 'bg-emerald-50 text-slate-900 border border-emerald-100 shadow-sm' 
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                      {getItemIcon(res.type)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate leading-tight">{res.title}</p>
                      <p className="text-xs text-slate-500 truncate mt-0.5">{res.subtitle}</p>
                    </div>
                  </div>
                  <ArrowRight size={15} className={`text-slate-400 flex-shrink-0 ml-2 ${selectedIndex === index ? 'text-emerald-600 translate-x-0.5' : ''}`} />
                </div>
              ))
            )
          ) : (
            <div>
              <div className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Clock size={12} />
                Accès rapide
              </div>
              <div className="space-y-0.5">
                {quickLinks.map((link, index) => {
                  const Icon = link.icon
                  return (
                    <div
                      key={link.href}
                      onClick={() => navigateTo(link.href)}
                      className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all duration-150 ${
                        selectedIndex === index 
                          ? 'bg-slate-100 text-slate-900 shadow-sm' 
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                          <Icon size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900 leading-tight">{link.title}</p>
                          <p className="text-xs text-slate-500 leading-tight mt-0.5">{link.subtitle}</p>
                        </div>
                      </div>
                      <span className="text-[11px] font-medium text-slate-400 hidden sm:inline">Aller</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Pied de palette */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-3">
            <span><kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-semibold text-slate-600">↑↓</kbd> Naviguer</span>
            <span><kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-semibold text-slate-600">↵</kbd> Ouvrir</span>
            <span><kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-semibold text-slate-600">ESC</kbd> Fermer</span>
          </div>
          <span className="font-semibold text-emerald-600">Scogestia Spotlight</span>
        </div>
      </div>
    </div>
  )
}
