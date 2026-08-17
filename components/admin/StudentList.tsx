'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useCallback } from 'react'

export type StudentItem = {
  id: string
  matricule: string
  first_name: string
  last_name: string
  status: string
  classes: {
    id: string
    name: string
  } | null
}

type Props = {
  students: StudentItem[]
  classes: { id: string, name: string }[]
  totalCount: number
  currentPage: number
  itemsPerPage: number
}

export function StudentList({ students, classes, totalCount, currentPage, itemsPerPage }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '')

  const handleFilterChange = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    // Reset to page 1 on filter change
    if (key !== 'page') params.set('page', '1')
    
    router.push(`/admin/eleves?${params.toString()}`)
  }, [searchParams, router])

  const totalPages = Math.ceil(totalCount / itemsPerPage)
  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalCount)

  return (
    <div className="flex-1 flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-[var(--color-on-surface)] mb-1">Élèves</h2>
          <p className="text-base text-[var(--color-on-surface-variant)]">Gérez la liste de tous les élèves inscrits.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          {/* Filter */}
          <div className="relative w-full sm:w-auto">
            <select 
              className="appearance-none w-full sm:w-40 border border-[var(--color-outline-variant)] rounded-lg px-4 py-3 h-12 bg-[var(--color-surface)] text-[var(--color-on-surface)] text-sm font-semibold focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] outline-none pr-10 cursor-pointer"
              onChange={(e) => handleFilterChange('classId', e.target.value)}
              defaultValue={searchParams.get('classId') || ''}
            >
              <option value="">Toutes les classes</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--color-on-surface-variant)]">expand_more</span>
          </div>
          {/* Primary Button */}
          <Link href="/admin/eleves/nouveau" className="bg-[var(--color-primary)] text-white text-sm font-semibold px-6 py-3 h-12 rounded-lg hover:opacity-90 transition-colors flex items-center justify-center gap-2 whitespace-nowrap w-full sm:w-auto shrink-0 shadow-sm">
            <span className="material-symbols-outlined text-[20px]">person_add</span>
            Inscrire un élève
          </Link>
        </div>
      </div>

      {/* Mobile Search */}
      <div className="relative sm:hidden mb-6">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-on-surface-variant)]">search</span>
        <input 
          className="w-full pl-10 pr-4 py-3 h-12 border border-[var(--color-outline-variant)] rounded-lg bg-[var(--color-surface)] focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] outline-none text-base" 
          placeholder="Rechercher un élève..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleFilterChange('search', searchTerm)}
          type="text"
        />
      </div>

      {/* Desktop Search */}
      <div className="hidden sm:block mb-6 w-96 relative">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-on-surface-variant)]">search</span>
        <input 
          className="w-full pl-10 pr-4 py-3 border border-[var(--color-outline-variant)] rounded-lg bg-[var(--color-surface)] focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] outline-none text-base" 
          placeholder="Rechercher un élève..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleFilterChange('search', searchTerm)}
          type="text"
        />
      </div>

      {/* Data Table Card */}
      <div className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-xl overflow-hidden shadow-sm flex-1 flex flex-col">
        {students.length === 0 ? (
           <div className="p-12 flex flex-col items-center justify-center text-center text-[var(--color-on-surface-variant)] m-auto">
             <span className="material-symbols-outlined text-4xl mb-2 opacity-50">group</span>
             <p className="text-lg font-medium">Aucun élève trouvé</p>
             <p className="text-sm">Modifiez vos filtres ou inscrivez un nouvel élève.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-[#eff4ff] border-b border-[var(--color-outline-variant)]">
                    <th className="py-4 px-6 text-sm font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Matricule</th>
                    <th className="py-4 px-6 text-sm font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Nom & Prénom</th>
                    <th className="py-4 px-6 text-sm font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Classe</th>
                    <th className="py-4 px-6 text-sm font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Statut Paiement</th>
                    <th className="py-4 px-6 text-sm font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-base text-[var(--color-on-surface)]">
                  {students.map(student => (
                    <tr key={student.id} className="border-b border-[var(--color-outline-variant)] hover:bg-[#eff4ff]/50 transition-colors bg-[var(--color-surface-container-lowest)]">
                      <td className="py-3 px-6 font-mono text-sm text-[var(--color-on-surface-variant)]">{student.matricule}</td>
                      <td className="py-3 px-6 font-medium">{student.last_name} {student.first_name}</td>
                      <td className="py-3 px-6">{student.classes?.name || 'Non assigné'}</td>
                      <td className="py-3 px-6">
                        {/* Mock payment status since it's for next phases */}
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/20">
                            En attente
                        </span>
                      </td>
                      <td className="py-3 px-6 text-right">
                        <Link href={`/admin/eleves/${student.id}`} className="p-2 text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] transition-colors inline-block">
                          <span className="material-symbols-outlined text-[20px]">visibility</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            <div className="px-6 py-4 flex items-center justify-between border-t border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] mt-auto">
              <span className="text-sm font-medium text-[var(--color-on-surface-variant)]">
                Affichage {startItem} à {endItem} sur {totalCount} élèves
              </span>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleFilterChange('page', String(currentPage - 1))}
                  disabled={currentPage <= 1}
                  className="p-2 rounded border border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] hover:bg-[#eff4ff] disabled:opacity-50 transition-colors flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                </button>
                <button 
                  onClick={() => handleFilterChange('page', String(currentPage + 1))}
                  disabled={currentPage >= totalPages}
                  className="p-2 rounded border border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] hover:bg-[#eff4ff] disabled:opacity-50 transition-colors flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
