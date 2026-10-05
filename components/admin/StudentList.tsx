'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useCallback, useTransition, useEffect } from 'react'
import { EmptyState } from '@/components/ui/EmptyState'
import {
  Users,
  Search,
  Upload,
  Download,
  UserPlus,
  MoreVertical,
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  X,
  Sparkles,
  ArrowRight
} from 'lucide-react'
import { deleteStudent } from '@/app/actions/students'
import { ImportStudentsModal } from './ImportStudentsModal'

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
  studentQuota?: {
    current: number
    max: number
    planName: string
    isPro: boolean
  }
}

export function StudentList({ students, classes, totalCount, currentPage, itemsPerPage, studentQuota }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '')
  const currentNiveau = searchParams.get('niveau') || 'Tous'
  const [isPending, startTransition] = useTransition()
  const [actionError, setActionError] = useState<string | null>(null)
  const [openActionId, setOpenActionId] = useState<string | null>(null)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)

  // Fermeture du menu d'action au clic extérieur
  useEffect(() => {
    if (!openActionId) return
    const handleClick = () => setOpenActionId(null)
    window.addEventListener('click', handleClick)
    return () => window.removeEventListener('click', handleClick)
  }, [openActionId])

  const handleDelete = (id: string, name: string) => {
    if (!window.confirm(`Supprimer l'élève ${name} ? Cette action est irréversible.`)) return
    setActionError(null)

    startTransition(async () => {
      const result = await deleteStudent(id)
      if (result?.error) {
        setActionError(result.error)
      } else {
        setOpenActionId(null)
      }
    })
  }

  const handleExportCSV = () => {
    if (!students || students.length === 0) return
    const headers = ['Matricule', 'Nom', 'Prénom', 'Classe', 'Statut']
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
    const rows = students.map(s => [
      s.matricule,
      s.last_name,
      s.first_name,
      s.classes?.name || '',
      s.status
    ])

    const csvContent = [
      headers.map(esc).join(';'),
      ...rows.map(r => r.map(esc).join(';'))
    ].join('\r\n')

    // BOM UTF-8 + séparateur « ; » pour compatibilité Excel
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `eleves_scogestia_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(link.href)
  }

  const handleFilterChange = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())

    if (key === 'classId' && value) {
      const selectedClass = classes.find(c => c.id === value)
      if (selectedClass && selectedClass.level) {
        const level = selectedClass.level.toLowerCase()
        let newNiveau = currentNiveau
        if (['s1', 's2', 'section1', 'section2', 'maternelle'].includes(level)) newNiveau = 'Maternelle'
        else if (['cp1', 'cp2', 'ce1', 'ce2', 'cm1', 'cm2', 'primaire'].includes(level)) newNiveau = 'Primaire'
        else if (['6eme', '5eme', '4eme', '3eme', 'secondaire', 'collège', 'college'].includes(level)) newNiveau = 'Collège'
        else if (['2nde', '1ere', '1ère', 'tle', 'terminale', 'seconde', 'premiere', 'lycee', 'lycée'].includes(level)) newNiveau = 'Lycée'

        if (newNiveau !== currentNiveau) {
          params.set('niveau', newNiveau)
        }
      }
    }

    if (value && value !== 'Tous') {
      params.set(key, value)
    } else {
      params.delete(key)
    }

    if (key !== 'page') params.set('page', '1')

    router.push(`/admin/eleves?${params.toString()}`)
  }, [searchParams, router, classes, currentNiveau])

  const totalPages = Math.ceil(totalCount / itemsPerPage)
  const startItem = totalCount > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0
  const endItem = Math.min(currentPage * itemsPerPage, totalCount)

  return (
    <div className="max-w-[1280px] mx-auto space-y-6 pb-8">
      {/* En-tête de page */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Gestion des élèves</h1>
          <p className="text-sm text-slate-500 mt-1">Consultez, inscrivez et gérez les fiches de vos élèves.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Filtre Classe */}
          <select
            className="h-9 px-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 outline-none transition-all cursor-pointer"
            onChange={(e) => handleFilterChange('classId', e.target.value)}
            defaultValue={searchParams.get('classId') || ''}
            aria-label="Filtrer par classe"
          >
            <option value="">Toutes les classes</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {/* Import CSV */}
          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center gap-2 h-9 px-3.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-sm font-medium transition-colors"
          >
            <Upload size={14} /> Importer (CSV)
          </button>

          {/* Export CSV */}
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={students.length === 0}
            className="inline-flex items-center gap-2 h-9 px-3.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={14} /> Exporter
          </button>

          {/* Ajouter élève */}
          <Link
            href="/admin/eleves/nouveau"
            className="inline-flex items-center gap-2 h-9 px-3.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium shadow-sm transition-colors"
          >
            <UserPlus size={15} /> Inscrire un élève
          </Link>
        </div>
      </div>

      {actionError && (
        <div role="alert" className="flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-800 px-4 py-3 text-sm">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <p className="flex-1">{actionError}</p>
          <button type="button" onClick={() => setActionError(null)} aria-label="Fermer" className="opacity-60 hover:opacity-100">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Widget Quota Élèves */}
      {studentQuota && (
        <div className="p-4 sm:p-5 rounded-xl bg-white border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Users size={17} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-slate-900">Capacité de votre établissement</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                    studentQuota.isPro
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-100 text-slate-700'
                  }`}>
                    Plan {studentQuota.planName}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  <strong className="text-slate-800 font-semibold">{studentQuota.current}</strong> sur <strong className="text-slate-800 font-semibold">{studentQuota.max}</strong> élèves inscrits ({Math.round((studentQuota.current / studentQuota.max) * 100)}%)
                </p>
              </div>
            </div>

            {!studentQuota.isPro ? (
              <Link
                href="/admin/abonnement"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-medium transition-colors whitespace-nowrap self-start sm:self-auto"
              >
                <Sparkles size={13} />
                <span>Passer au Plan Pro (400 élèves)</span>
                <ArrowRight size={12} />
              </Link>
            ) : (
              <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 self-start sm:self-auto">
                ✓ Quota Pro actif (400 max)
              </span>
            )}
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                (studentQuota.current / studentQuota.max) >= 0.95
                  ? 'bg-rose-500'
                  : (studentQuota.current / studentQuota.max) >= 0.75
                    ? 'bg-amber-500'
                    : 'bg-emerald-600'
              }`}
              style={{ width: `${Math.min(100, Math.round((studentQuota.current / studentQuota.max) * 100))}%` }}
            />
          </div>

          {studentQuota.current >= studentQuota.max && (
            <p className="text-xs font-medium text-rose-600 mt-2 flex items-center gap-1">
              <AlertCircle size={13} />
              Capacité maximale atteinte. Passez au Plan Pro pour continuer à inscrire des élèves.
            </p>
          )}
        </div>
      )}

      {/* Barre d'onglets de niveau et recherche */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200 pb-3">
        {/* Onglets Niveaux */}
        <div className="flex gap-2 overflow-x-auto w-full sm:w-auto scrollbar-none" role="tablist">
          {['Tous', 'Maternelle', 'Primaire', 'Collège', 'Lycée'].map(niveau => (
            <button
              key={niveau}
              type="button"
              role="tab"
              aria-selected={currentNiveau === niveau}
              onClick={() => handleFilterChange('niveau', niveau)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                currentNiveau === niveau
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {niveau}
            </button>
          ))}
        </div>

        {/* Champ de recherche */}
        <div className="w-full sm:w-72 relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="w-full h-9 pl-9 pr-3 bg-white border border-slate-200 rounded-lg text-sm placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 outline-none transition-all"
            placeholder="Rechercher par nom, matricule…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleFilterChange('search', searchTerm)}
            type="search"
            aria-label="Rechercher un élève"
          />
        </div>
      </div>

      {/* Tableau des élèves */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)] overflow-hidden">
        {students.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="Aucun élève trouvé"
              description="Modifiez vos critères de recherche ou inscrivez un nouvel élève."
              icon={Users}
              actionLabel="+ Inscrire un élève"
              onAction={() => router.push('/admin/eleves/nouveau')}
            />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto min-h-[300px]">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500">
                    <th className="py-3 px-5 font-medium">Matricule</th>
                    <th className="py-3 px-5 font-medium">Nom & Prénom</th>
                    <th className="py-3 px-5 font-medium">Classe</th>
                    <th className="py-3 px-5 font-medium">Statut</th>
                    <th className="py-3 px-5 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map(student => (
                    <tr key={student.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-5 font-mono text-xs text-slate-600 font-medium">
                        {student.matricule}
                      </td>
                      <td className="py-3 px-5 font-medium text-slate-900">
                        <Link href={`/admin/eleves/${student.id}`} className="hover:text-emerald-700 transition-colors">
                          {student.last_name} {student.first_name}
                        </Link>
                      </td>
                      <td className="py-3 px-5 text-slate-600">
                        {student.classes?.name || 'Non assigné'}
                      </td>
                      <td className="py-3 px-5">
                        <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium border ${
                          student.status === 'actif'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}>
                          {student.status === 'actif' ? 'Inscrit' : student.status}
                        </span>
                      </td>
                      <td className="py-3 px-5 text-right relative">
                        <div className="flex justify-end items-center gap-1.5">
                          <Link
                            href={`/admin/eleves/${student.id}`}
                            className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-50 hover:border-slate-300 transition-colors"
                            title="Voir la fiche"
                          >
                            <Eye size={13} /> Fiche
                          </Link>

                          <div className="relative" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => setOpenActionId(openActionId === student.id ? null : student.id)}
                              aria-label="Plus d'actions"
                              className="w-8 h-8 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 flex items-center justify-center transition-colors"
                            >
                              <MoreVertical size={16} />
                            </button>

                            {openActionId === student.id && (
                              <div
                                role="menu"
                                className="absolute right-0 mt-1 w-44 bg-white rounded-lg shadow-[0_8px_24px_rgba(15,23,42,0.12)] border border-slate-200 p-1 z-20 text-left"
                              >
                                <Link
                                  href={`/admin/eleves/${student.id}`}
                                  className="w-full px-3 py-2 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                                  onClick={() => setOpenActionId(null)}
                                >
                                  <Eye size={14} className="text-slate-400" />
                                  Détails & Scolarité
                                </Link>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(student.id, `${student.first_name} ${student.last_name}`)}
                                  disabled={isPending}
                                  className="w-full px-3 py-2 rounded-md text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors disabled:opacity-50"
                                >
                                  <Trash2 size={14} />
                                  Supprimer l&apos;élève
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-5 py-3.5 flex items-center justify-between border-t border-slate-100 bg-slate-50/50">
              <span className="text-xs text-slate-500">
                Affichage de <strong className="text-slate-800 font-semibold">{startItem}</strong> à <strong className="text-slate-800 font-semibold">{endItem}</strong> sur <strong className="text-slate-800 font-semibold">{totalCount}</strong> élèves
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleFilterChange('page', String(currentPage - 1))}
                  disabled={currentPage <= 1}
                  aria-label="Page précédente"
                  className="h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-medium hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-1"
                >
                  <ChevronLeft size={14} /> Précédent
                </button>
                <button
                  type="button"
                  onClick={() => handleFilterChange('page', String(currentPage + 1))}
                  disabled={currentPage >= totalPages}
                  aria-label="Page suivante"
                  className="h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-medium hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-1"
                >
                  Suivant <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      <ImportStudentsModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        classes={classes}
        initialClassId={searchParams.get('classId') || undefined}
      />
    </div>
  )
}
