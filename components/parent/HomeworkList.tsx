'use client'

import { useState, useEffect } from 'react'

export function HomeworkList({ 
  homeworks, 
  title, 
  isPast 
}: { 
  homeworks: any[], 
  title: string,
  isPast?: boolean
}) {
  const [hiddenIds, setHiddenIds] = useState<string[]>([])
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    const stored = localStorage.getItem('scogestia_hidden_homeworks')
    if (stored) {
      try {
        setHiddenIds(JSON.parse(stored))
      } catch (e) {
        // ignore
      }
    }
  }, [])

  const hideHomework = (id: string) => {
    const newHidden = [...hiddenIds, id]
    setHiddenIds(newHidden)
    localStorage.setItem('scogestia_hidden_homeworks', JSON.stringify(newHidden))
  }

  // Si non monté, on affiche tout par défaut (hydration)
  // Ou on ne filtre que si c'est monté pour éviter le mismatch
  const visibleHomeworks = isMounted ? homeworks.filter(hw => !hiddenIds.includes(hw.id)) : homeworks

  if (visibleHomeworks.length === 0 && isMounted) return null

  return (
    <div className={`space-y-3 ${isPast ? 'opacity-75' : ''}`}>
      <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-on-surface-variant)] pl-1">{title}</h2>
      <div className="space-y-3">
        {visibleHomeworks.map(hw => (
          <div key={hw.id} className={`relative bg-white rounded-xl p-4 shadow-sm border border-[var(--color-outline-variant)] ${isPast ? 'bg-gray-50' : ''}`}>
            
            <button 
              onClick={() => hideHomework(hw.id)}
              className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600 transition-colors"
              title="Supprimer / Cacher ce devoir"
            >
              <span className="material-symbols-outlined text-[18px]">delete</span>
            </button>

            <div className="flex justify-between items-start mb-2 pr-10">
              <span className="px-2 py-1 bg-[#e8f0fe] text-[#1a73e8] text-xs font-bold rounded uppercase tracking-wide">
                {hw.subject_name}
              </span>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${isPast ? 'bg-gray-100 text-gray-500 border-gray-200' : 'bg-[#fff8e1] text-[#f57f17] border-[#ffe082]'}`}>
                {isPast ? 'Terminé' : `Pour le ${new Date(hw.due_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`}
              </span>
            </div>
            
            <h3 className="font-bold text-[var(--color-on-surface)] text-lg mb-2 leading-tight pr-10">{hw.title}</h3>
            
            {hw.description && (
              <p className="text-sm text-[var(--color-on-surface-variant)] mb-4 bg-[var(--color-surface)] p-3 rounded-lg border border-[var(--color-outline-variant)]">
                {hw.description}
              </p>
            )}
            
            {hw.attachment_url && (
              <a 
                href={hw.attachment_url.startsWith('http') ? hw.attachment_url : `https://mxttnddswkntrryshqzl.supabase.co/storage/v1/object/public/homework-attachments/${hw.attachment_url}`}
                target="_blank" 
                rel="noreferrer" 
                className="flex items-center justify-center gap-2 w-full py-2.5 mt-2 bg-gradient-to-r from-[#e8f0fe] to-[#f3e8fd] text-[var(--color-primary)] rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity"
              >
                <span className="material-symbols-outlined text-[18px]">download</span>
                Ouvrir la pièce jointe
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
