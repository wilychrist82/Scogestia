'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useCallback, useTransition } from 'react'
import { EmptyState } from '@/components/ui/EmptyState'
import { Users } from 'lucide-react'
import { deleteStudent } from '@/app/actions/students'

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
  classes: { id: string, name: string, level?: string }[]
  totalCount: number
  currentPage: number
  itemsPerPage: number
}

export function StudentList({ students, classes, totalCount, currentPage, itemsPerPage }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '')
  const currentNiveau = searchParams.get('niveau') || 'Primaire'
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [openActionId, setOpenActionId] = useState<string | null>(null)

  const handleDelete = (id: string, name: string) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer l'élève ${name} ?`)) return
    
    startTransition(async () => {
      const result = await deleteStudent(id)
      if (result?.error) {
        alert(result.error)
      }
    })
  }

  const handleExportCSV = () => {
    if (!students || students.length === 0) return
    const headers = ['Matricule', 'Nom', 'Prénom', 'Classe', 'Statut']
    const rows = students.map(s => [
      s.matricule,
      s.last_name,
      s.first_name,
      s.classes?.name || '',
      s.status
    ])
    
    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.setAttribute('download', `eleves_scogestia_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleFilterChange = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    
    // Auto-switch tab if class is selected
    if (key === 'classId' && value) {
      const selectedClass = classes.find(c => c.id === value)
      if (selectedClass && selectedClass.level) {
        const level = selectedClass.level.toLowerCase()
        let newNiveau = currentNiveau
        if (['s1', 's2', 'section1', 'section2', 'maternelle'].includes(level)) newNiveau = 'Maternelle'
        else if (['cp1', 'cp2', 'ce1', 'ce2', 'cm1', 'cm2', 'primaire'].includes(level)) newNiveau = 'Primaire'
        else if (['6eme', '5eme', '4eme', '3eme', 'secondaire', 'collège'].includes(level)) newNiveau = 'Secondaire'
        
        if (newNiveau !== currentNiveau) {
          params.set('niveau', newNiveau)
        }
      }
    }

    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    // Reset to page 1 on filter change
    if (key !== 'page') params.set('page', '1')
    
    router.push(`/admin/eleves?${params.toString()}`)
  }, [searchParams, router, classes, currentNiveau])

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
          {/* Export CSV */}
          <button onClick={handleExportCSV} className="bg-[var(--color-surface-container-high)] border border-[var(--color-outline-variant)] text-[var(--color-on-surface)] text-sm font-semibold px-4 py-3 h-12 rounded-lg hover:bg-[var(--color-surface-container-highest)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2 whitespace-nowrap w-full sm:w-auto shrink-0 shadow-sm active:scale-95">
            <span className="material-symbols-outlined text-[20px]">download</span>
            Exporter (CSV)
          </button>
          {/* Primary Button */}
          <Link href="/admin/eleves/nouveau" className="bg-[var(--color-primary)] text-white text-sm font-semibold px-6 py-3 h-12 rounded-lg hover:opacity-90 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2 whitespace-nowrap w-full sm:w-auto shrink-0 shadow-sm active:scale-95 group">
            <span className="material-symbols-outlined text-[20px] group-hover:rotate-12 transition-transform">person_add</span>
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

      {/* Desktop Search & Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 border-b border-[var(--color-outline-variant)]">
        {/* Tabs */}
        <div className="flex gap-6 overflow-x-auto w-full sm:w-auto hide-scrollbar">
          {['Maternelle', 'Primaire', 'Secondaire'].map(niveau => (
            <button
              key={niveau}
              onClick={() => handleFilterChange('niveau', niveau)}
              className={`pb-3 px-2 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
                currentNiveau === niveau 
                  ? 'border-[var(--color-primary)] text-[var(--color-primary)]' 
                  : 'border-transparent text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)]'
              }`}
            >
              {niveau}
            </button>
          ))}
        </div>
        
        {/* Desktop Search */}
        <div className="hidden sm:block w-72 relative pb-3">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-on-surface-variant)]">search</span>
          <input 
            className="w-full pl-10 pr-4 py-2 border border-[var(--color-outline-variant)] rounded-lg bg-[var(--color-surface)] focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] outline-none text-sm" 
            placeholder="Rechercher un élève..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleFilterChange('search', searchTerm)}
            type="text"
          />
        </div>
      </div>

      {/* Data Table Card */}
      <div className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-xl overflow-hidden shadow-sm flex-1 flex flex-col">
        {students.length === 0 ? (
          <EmptyState 
            title="Aucun élève trouvé"
            description="Modifiez vos filtres ou inscrivez un nouvel élève."
            icon={Users}
            actionLabel="+ Ajouter un élève"
            onAction={() => router.push('/admin/eleves/nouveau')}
          />
        ) : (
          <>
            <div className="overflow-x-auto min-h-[300px] pb-32">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-[#eff4ff] border-b border-[var(--color-outline-variant)]">
                    <th className="py-4 px-6 text-sm font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Matricule</th>
                    <th className="py-4 px-6 text-sm font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Nom & Prénom</th>
                    <th className="py-4 px-6 text-sm font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Classe</th>
                    <th className="py-4 px-6 text-sm font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-base text-[var(--color-on-surface)]">
                  {students.map(student => (
                    <tr key={student.id} className="border-b border-[var(--color-outline-variant)] hover:bg-[#eff4ff]/50 transition-colors bg-[var(--color-surface-container-lowest)]">
                      <td className="py-3 px-6 font-mono text-sm text-[var(--color-on-surface-variant)]">{student.matricule}</td>
                      <td className="py-3 px-6 font-medium">{student.last_name} {student.first_name}</td>
                      <td className="py-3 px-6">{student.classes?.name || 'Non assigné'}</td>
                      <td className="py-3 px-6 text-right relative">
                        <button 
                          onClick={() => setOpenActionId(openActionId === student.id ? null : student.id)}
                          className="p-2 text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] hover:bg-[#eff4ff] rounded-full transition-all duration-300 hover:rotate-90 inline-block"
                        >
                          <span className="material-symbols-outlined text-[20px]">more_vert</span>
                        </button>
                        
                        {openActionId === student.id && (
                          <div className="absolute right-6 top-10 w-40 bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-lg shadow-lg z-10 flex flex-col overflow-hidden text-left py-1 animate-[fadeIn_0.1s_ease-out]">
                            <Link 
                              href={`/admin/eleves/${student.id}`} 
                              className="px-4 py-2 text-sm text-[var(--color-on-surface)] hover:bg-[#eff4ff] hover:text-[var(--color-primary)] flex items-center gap-2 transition-colors"
                              onClick={() => setOpenActionId(null)}
                            >
                              <span className="material-symbols-outlined text-[18px]">visibility</span>
                              Voir
                            </Link>
                            <Link 
                              href={`/admin/eleves/${student.id}`} 
                              className="px-4 py-2 text-sm text-[var(--color-on-surface)] hover:bg-[#eff4ff] hover:text-[var(--color-primary)] flex items-center gap-2 transition-colors"
                              onClick={() => setOpenActionId(null)}
                            >
                              <span className="material-symbols-outlined text-[18px]">edit</span>
                              Modifier
                            </Link>
                            <button 
                              onClick={() => {
                                setOpenActionId(null);
                                handleDelete(student.id, `${student.first_name} ${student.last_name}`);
                              }}
                              disabled={isPending}
                              className="px-4 py-2 text-sm text-[var(--color-status-retard-text)] hover:bg-red-50 flex items-center gap-2 transition-colors w-full text-left disabled:opacity-50"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                              Supprimer
                            </button>
                          </div>
                        )}
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
