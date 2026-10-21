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
  ArrowRight,
  UserCheck,
  Presentation,
  FileText
} from 'lucide-react'
import { deleteStudent } from '@/app/actions/students'
import { ImportStudentsModal } from './ImportStudentsModal'
import { KpiCard } from './KpiCard'

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

const AVATAR_TONES = [
  'bg-emerald-100 text-emerald-900 ring-emerald-300',
  'bg-sky-100 text-sky-900 ring-sky-300',
  'bg-violet-100 text-violet-900 ring-violet-300',
  'bg-amber-100 text-amber-900 ring-amber-300',
  'bg-rose-100 text-rose-900 ring-rose-300',
  'bg-teal-100 text-teal-900 ring-teal-300',
]

const avatarTone = (seed: string) => {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return AVATAR_TONES[h % AVATAR_TONES.length]
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
    const blob = new Blob(['﻿' + csvContent], { type: 'text/csv;charset=utf-8;' })
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

  const activeOnPage = students.filter(s => s.status === 'actif').length

  return (
    <div className="mx-auto max-w-[1280px] space-y-6 pb-8">
      {/* En-tête de page */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Gestion des élèves</h1>
          <p className="mt-1 text-sm font-medium text-slate-600">Consultez, inscrivez et gérez les fiches de vos élèves.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Import CSV */}
          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 transition-colors hover:bg-slate-50 hover:text-slate-900"
          >
            <Upload size={15} /> Importer (CSV)
          </button>

          {/* Export CSV */}
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={students.length === 0}
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 transition-colors hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={15} /> Exporter
          </button>

          {/* Ajouter élève */}
          <Link
            href="/admin/eleves/nouveau"
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-[#006039] to-emerald-600 px-5 text-sm font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:from-[#004d2e] hover:to-emerald-700 hover:shadow-lg"
          >
            <UserPlus size={16} /> Inscrire un élève
          </Link>
        </div>
      </div>

      {/* Cartes KPI */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Élèves" value={totalCount} icon={Users} tone="emerald" hint={currentNiveau === 'Tous' ? 'Tous niveaux' : `Niveau ${currentNiveau}`} />
        <KpiCard label="Inscrits (page)" value={activeOnPage} icon={UserCheck} tone="blue" hint={`sur ${students.length} affichés`} />
        <KpiCard label="Classes" value={classes.length} icon={Presentation} tone="violet" hint="Disponibles au filtre" />
        <KpiCard label="Pagination" value={`${totalCount > 0 ? currentPage : 0}/${totalPages}`} icon={FileText} tone="amber" hint={`${itemsPerPage} par page`} />
      </div>

      {actionError && (
        <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-900">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <p className="flex-1">{actionError}</p>
          <button type="button" onClick={() => setActionError(null)} aria-label="Fermer" className="opacity-70 hover:opacity-100">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Widget Quota Élèves */}
      {studentQuota && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.05)] sm:p-5">
          <div className="mb-3 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-200">
                <Users size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-extrabold text-slate-900">Capacité de votre établissement</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ring-1 ring-inset ${
                    studentQuota.isPro
                      ? 'bg-emerald-50 text-emerald-800 ring-emerald-300'
                      : 'bg-slate-100 text-slate-800 ring-slate-300'
                  }`}>
                    Plan {studentQuota.planName}
                  </span>
                </div>
                <p className="mt-0.5 text-xs font-medium text-slate-700">
                  <strong className="font-extrabold text-slate-900">{studentQuota.current}</strong> sur <strong className="font-extrabold text-slate-900">{studentQuota.max}</strong> élèves inscrits ({Math.round((studentQuota.current / studentQuota.max) * 100)}%)
                </p>
              </div>
            </div>

            {!studentQuota.isPro ? (
              <Link
                href="/admin/abonnement"
                className="inline-flex items-center gap-1.5 self-start whitespace-nowrap rounded-xl bg-gradient-to-r from-[#006039] to-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition-all hover:from-[#004d2e] hover:to-emerald-700 sm:self-auto"
              >
                <Sparkles size={13} />
                <span>Passer au Plan Pro (400 élèves)</span>
                <ArrowRight size={12} />
              </Link>
            ) : (
              <span className="self-start rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 ring-1 ring-inset ring-emerald-300 sm:self-auto">
                ✓ Quota Pro actif (400 max)
              </span>
            )}
          </div>

          {/* Progress bar */}
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
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
            <p className="mt-2 flex items-center gap-1 text-xs font-bold text-rose-700">
              <AlertCircle size={13} />
              Capacité maximale atteinte. Passez au Plan Pro pour continuer à inscrire des élèves.
            </p>
          )}
        </div>
      )}

      {/* Conteneur du tableau */}
      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_2px_12px_rgba(15,23,42,0.03)]">
        {/* Barre d'outils : pills de niveau, classe et recherche */}
        <div className="flex flex-col gap-3 border-b border-slate-200/80 p-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="scrollbar-none flex w-full gap-2 overflow-x-auto xl:w-auto" role="tablist">
            {['Tous', 'Maternelle', 'Primaire', 'Collège', 'Lycée'].map(niveau => {
              const active = currentNiveau === niveau
              return (
                <button
                  key={niveau}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => handleFilterChange('niveau', niveau)}
                  className={`flex items-center gap-2 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-bold transition-all ${
                    active
                      ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-300'
                      : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  {niveau}
                  {active && (
                    <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[11px] font-extrabold tabular-nums text-emerald-900">
                      {totalCount}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          <div className="flex w-full flex-col gap-2 sm:flex-row xl:w-auto">
            {/* Filtre Classe */}
            <select
              className="h-10 cursor-pointer rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition-all focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
              onChange={(e) => handleFilterChange('classId', e.target.value)}
              defaultValue={searchParams.get('classId') || ''}
              aria-label="Filtrer par classe"
            >
              <option value="">Toutes les classes</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            {/* Champ de recherche */}
            <div className="relative w-full sm:w-72">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" />
              <input
                className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-500 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                placeholder="Rechercher par nom, matricule…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleFilterChange('search', searchTerm)}
                type="search"
                aria-label="Rechercher un élève"
              />
            </div>
          </div>
        </div>

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
            <div className="min-h-[300px] overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    <th className="px-5 py-3.5">Matricule</th>
                    <th className="px-5 py-3.5">Nom & Prénom</th>
                    <th className="px-5 py-3.5">Classe</th>
                    <th className="px-5 py-3.5">Statut</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(student => (
                    <tr key={student.id} className="border-b border-slate-100 transition-colors last:border-b-0 hover:bg-emerald-50/30">
                      <td className="px-5 py-3.5 font-mono text-xs font-semibold text-slate-700">
                        {student.matricule}
                      </td>
                      <td className="px-5 py-3.5">
                        <Link href={`/admin/eleves/${student.id}`} className="group flex items-center gap-3">
                          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-extrabold ring-1 ring-inset ${avatarTone(student.id)}`}>
                            {`${student.last_name?.charAt(0) || ''}${student.first_name?.charAt(0) || ''}`.toUpperCase() || '?'}
                          </span>
                          <span className="font-extrabold text-slate-900 transition-colors group-hover:text-emerald-800">
                            {student.last_name} {student.first_name}
                          </span>
                        </Link>
                      </td>
                      <td className="px-5 py-3.5">
                        {student.classes?.name ? (
                          <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-800 ring-1 ring-inset ring-slate-200">
                            {student.classes.name}
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-slate-600">Non assigné</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${
                          student.status === 'actif'
                            ? 'bg-emerald-50 text-emerald-800 ring-emerald-300'
                            : 'bg-slate-100 text-slate-800 ring-slate-300'
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${student.status === 'actif' ? 'bg-emerald-600' : 'bg-slate-500'}`} />
                          {student.status === 'actif' ? 'Inscrit' : student.status}
                        </span>
                      </td>
                      <td className="relative px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/admin/eleves/${student.id}`}
                            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-800 transition-colors hover:border-emerald-600 hover:bg-emerald-50 hover:text-emerald-900"
                            title="Voir la fiche"
                          >
                            <Eye size={14} /> Fiche
                          </Link>

                          <div className="relative" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => setOpenActionId(openActionId === student.id ? null : student.id)}
                              aria-label="Plus d'actions"
                              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900"
                            >
                              <MoreVertical size={17} />
                            </button>

                            {openActionId === student.id && (
                              <div
                                role="menu"
                                className="absolute right-0 z-20 mt-1 w-48 rounded-xl border border-slate-200 bg-white p-1 text-left shadow-xl"
                              >
                                <Link
                                  href={`/admin/eleves/${student.id}`}
                                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 transition-colors hover:bg-emerald-50 hover:text-emerald-900"
                                  onClick={() => setOpenActionId(null)}
                                >
                                  <Eye size={14} />
                                  Détails & Scolarité
                                </Link>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(student.id, `${student.first_name} ${student.last_name}`)}
                                  disabled={isPending}
                                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-50 disabled:opacity-50"
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
            <div className="flex items-center justify-between border-t border-slate-200/80 bg-slate-50/70 px-5 py-3.5">
              <span className="text-xs font-medium text-slate-700">
                Affichage de <strong className="font-extrabold text-slate-900">{startItem}</strong> à <strong className="font-extrabold text-slate-900">{endItem}</strong> sur <strong className="font-extrabold text-slate-900">{totalCount}</strong> élèves
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleFilterChange('page', String(currentPage - 1))}
                  disabled={currentPage <= 1}
                  aria-label="Page précédente"
                  className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-800 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={14} /> Précédent
                </button>
                <button
                  type="button"
                  onClick={() => handleFilterChange('page', String(currentPage + 1))}
                  disabled={currentPage >= totalPages}
                  aria-label="Page suivante"
                  className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-800 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
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
