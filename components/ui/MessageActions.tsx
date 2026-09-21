'use client'

import { useState, useRef, useEffect } from 'react'
import { deleteCommunication } from '@/app/actions/communication'
import toast from 'react-hot-toast'

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
        <span className="material-symbols-outlined text-[16px]">keyboard_arrow_down</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-7 mt-1 w-44 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
          <button 
            onClick={() => handleDelete('for_me')}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">delete</span>
            Effacer pour moi
          </button>
          {isSentByMe && (
            <button 
              onClick={() => handleDelete('for_everyone')}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-gray-50"
            >
              <span className="material-symbols-outlined text-[18px]">delete_forever</span>
              Effacer pour tous
            </button>
          )}
        </div>
      )}
    </div>
  )
}
