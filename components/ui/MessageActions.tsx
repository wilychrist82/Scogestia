'use client'

import { useState, useRef, useEffect } from 'react'
import { deleteCommunication } from '@/app/actions/communication'
import toast from 'react-hot-toast'
import { ChevronDown, Trash2, Trash } from 'lucide-react'

interface Props {
  messageId: string
  isSentByMe: boolean
}

export function MessageActions({ messageId, isSentByMe }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleDelete = async (type: 'for_me' | 'for_everyone') => {
    setIsOpen(false)
    
    // Optimistic UI could be added here, but for simplicity we await the server action
    const loadingToast = toast.loading('Suppression...')
    try {
      const result = await deleteCommunication(messageId, type)
      if (result?.error) {
        toast.error(result.error, { id: loadingToast })
      } else {
        toast.success('Message supprimé', { id: loadingToast })
      }
    } catch (e) {
      toast.error('Erreur de connexion', { id: loadingToast })
    }
  }

  return (
    <div className="absolute top-0 right-0 p-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-6 h-6 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center text-gray-500 backdrop-blur-sm"
        title="Options du message"
      >
        <ChevronDown className="w-3.5 h-3.5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-7 mt-1 w-44 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-50 animate-in fade-in duration-100">
          <button 
            onClick={() => handleDelete('for_me')}
            className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
          >
            <Trash className="w-3.5 h-3.5 text-slate-400" />
            Effacer pour moi
          </button>
          {isSentByMe && (
            <button 
              onClick={() => handleDelete('for_everyone')}
              className="w-full text-left px-3.5 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2 border-t border-slate-50 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
              Effacer pour tous
            </button>
          )}
        </div>
      )}
    </div>
  )
}
