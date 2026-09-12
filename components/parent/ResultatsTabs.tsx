'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'

export function ResultatsTabs() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const child = searchParams.get('child')
  
  const isBulletins = pathname.includes('/bulletins')
  
  const queryString = child ? `?child=${child}` : ''

  return (
    <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
      <Link 
        href={`/parent/bulletins${queryString}`}
        className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
          isBulletins 
            ? 'bg-white text-[var(--color-primary)] shadow-sm' 
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
        Bulletins Officiels
      </Link>
      <Link 
        href={`/parent/notes${queryString}`}
        className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
          !isBulletins 
            ? 'bg-white text-[var(--color-primary)] shadow-sm' 
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        <span className="material-symbols-outlined text-[18px]">format_list_numbered</span>
        Détail des notes
      </Link>
    </div>
  )
}
