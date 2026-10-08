'use client'

import { useState, useMemo, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { EmptyState } from '@/components/ui/EmptyState'
import { Users, GraduationCap, ArrowLeft, Download, Search, UserCheck, UserPlus, Eye, Edit2, Trash2, MoreVertical, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import { deleteStudent, removeStudentFromClass } from '@/app/actions/students'

export type ClassStudentItem = {
  id: string
  matricule: string
  first_name: string
  last_name: string
  gender: string | null
  date_of_birth: string | null
  parent_phone: string | null
  status: string
}

export type ClassInfo = {
  id: string
  name: string
  level: string
  capacity: number | null
  academic_year: string
}

type Props = {
  classInfo: ClassInfo
  students: ClassStudentItem[]
}

export function ClassDetailsView({ classInfo, students }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [studentToDelete, setStudentToDelete] = useState<ClassStudentItem | null>(null)
  const [openActionId, setOpenActionId] = useState<string | null>(null)

  const [searchTerm, setSearchTerm] = useState('')
  const [genderFilter, setGenderFilter] = useState<'ALL' | 'M' | 'F'>('ALL')

  const boysCount = students.filter(s => s.gender?.toUpperCase() === 'M').length
  const girlsCount = students.filter(s => s.gender?.toUpperCase() === 'F').length
  const totalCount = students.length

  const handleConfirmDelete = () => {
    if (!studentToDelete) return
    startTransition(async () => {
      const res = await deleteStudent(studentToDelete.id)
      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success(`Élève ${studentToDelete.last_name} ${studentToDelete.first_name} supprimé avec succès.`)
        setStudentToDelete(null)
        router.refresh()
      }
    })
  }

  const handleConfirmUnassign = () => {
    if (!studentToDelete) return
    startTransition(async () => {
      const res = await removeStudentFromClass(studentToDelete.id)
      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success(`Élève retiré de la classe avec succès.`)
        setStudentToDelete(null)
        router.refresh()
      }
    })
  }

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchesSearch = 
        s.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.matricule.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesGender = 
        genderFilter === 'ALL' || s.gender?.toUpperCase() === genderFilter

      return matchesSearch && matchesGender
    })
  }, [students, searchTerm, genderFilter])

  const handleExportCSV = () => {
    if (students.length === 0) return
    const headers = ['Matricule', 'Nom', 'Prénom', 'Genre', 'Date de Naissance', 'Téléphone Parent', 'Statut']
    const rows = students.map(s => [
      s.matricule,
      s.last_name,
      s.first_name,
      s.gender || '',
      s.date_of_birth || '',
      s.parent_phone || '',
      s.status
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(c => `"${c}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.setAttribute('download', `liste_${classInfo.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getLevelBadge = (level: string) => {
    const l = level.toLowerCase()
    if (['2nde', 'seconde', '1ere', '1ère', 'premiere', 'tle', 'terminale', 'lycee', 'lycée'].some(k => l.includes(k))) {
      return <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">LYCÉE</span>
    }
    if (['6eme', '5eme', '4eme', '3eme', 'secondaire', 'college', 'collège'].some(k => l.includes(k))) {
      return <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">COLLÈGE</span>
    }
    if (['cp1', 'cp2', 'ce1', 'ce2', 'cm1', 'cm2', 'primaire'].some(k => l.includes(k))) {
      return <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">PRIMAIRE</span>
    }
    if (['s1', 's2', 'section1', 'section2', 'maternelle'].some(k => l.includes(k))) {
      return <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">MATERNELLE</span>
    }
    return <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">{level.toUpperCase()}</span>
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Navigation & Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-[var(--color-outline-variant)]">
        <div className="flex items-center gap-3">
          <Link 
            href="/admin/classes" 
            className="p-2 text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] hover:bg-[#eff4ff] rounded-xl border border-[var(--color-outline-variant)] transition-all"
            title="Retour aux classes"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-on-surface)]">
                Classe {classInfo.name}
              </h1>
              {getLevelBadge(classInfo.level)}
            </div>
            <p className="text-sm text-[var(--color-on-surface-variant)] mt-1">
              Année Académique : <strong>{classInfo.academic_year || '2026-2027'}</strong> • Capacité : <strong>{classInfo.capacity || 'Illimitée'}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {students.length > 0 && (
            <button
              onClick={handleExportCSV}
              className="px-4 py-2.5 bg-[var(--color-surface-container-high)] border border-[var(--color-outline-variant)] text-[var(--color-on-surface)] text-sm font-semibold rounded-lg hover:bg-[var(--color-surface-container-highest)] hover:shadow-sm transition-all flex items-center gap-2"
            >
              <Download size={16} />
              Exporter la liste
            </button>
          )}
          <Link
            href="/admin/eleves/nouveau"
            className="px-4 py-2.5 bg-[var(--color-primary)] text-white text-sm font-semibold rounded-lg hover:opacity-90 hover:shadow-md transition-all flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Inscrire un élève
          </Link>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[var(--color-surface-container-lowest)] p-4 rounded-xl border border-[var(--color-outline-variant)] shadow-sm">
          <div className="flex items-center gap-2 text-blue-600 mb-1">
            <Users size={18} />
            <span className="text-xs font-bold uppercase tracking-wider">Effectif Total</span>
          </div>
          <p className="text-2xl font-bold text-[var(--color-on-surface)]">{totalCount}</p>
          <p className="text-xs text-[var(--color-on-surface-variant)] mt-0.5">
            {classInfo.capacity ? `${Math.round((totalCount / classInfo.capacity) * 100)}% de capacité` : 'Inscriptions libres'}
          </p>
        </div>

        <div className="bg-[var(--color-surface-container-lowest)] p-4 rounded-xl border border-[var(--color-outline-variant)] shadow-sm">
          <div className="flex items-center gap-2 text-indigo-600 mb-1">
            <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
            <span className="text-xs font-bold uppercase tracking-wider">Garçons</span>
          </div>
          <p className="text-2xl font-bold text-[var(--color-on-surface)]">{boysCount}</p>
          <p className="text-xs text-[var(--color-on-surface-variant)] mt-0.5">
            {totalCount > 0 ? `${Math.round((boysCount / totalCount) * 100)}%` : '0%'}
          </p>
        </div>

        <div className="bg-[var(--color-surface-container-lowest)] p-4 rounded-xl border border-[var(--color-outline-variant)] shadow-sm">
          <div className="flex items-center gap-2 text-pink-600 mb-1">
            <span className="w-2 h-2 rounded-full bg-pink-600"></span>
            <span className="text-xs font-bold uppercase tracking-wider">Filles</span>
          </div>
          <p className="text-2xl font-bold text-[var(--color-on-surface)]">{girlsCount}</p>
          <p className="text-xs text-[var(--color-on-surface-variant)] mt-0.5">
            {totalCount > 0 ? `${Math.round((girlsCount / totalCount) * 100)}%` : '0%'}
          </p>
        </div>

        <div className="bg-[var(--color-surface-container-lowest)] p-4 rounded-xl border border-[var(--color-outline-variant)] shadow-sm">
          <div className="flex items-center gap-2 text-emerald-600 mb-1">
            <UserCheck size={18} />
            <span className="text-xs font-bold uppercase tracking-wider">Élèves Actifs</span>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{students.filter(s => s.status === 'actif').length}</p>
          <p className="text-xs text-[var(--color-on-surface-variant)] mt-0.5">En règle</p>
        </div>
      </div>

      {/* Roster Controls */}
      <div className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[var(--color-outline-variant)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-[var(--color-surface-bright)]">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-on-surface-variant)]" />
              <input
                type="text"
                placeholder="Rechercher dans cette classe..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-sm bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-lg outline-none focus:border-[var(--color-primary)]"
              />
            </div>
            
            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value as any)}
              className="text-sm bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-lg px-2.5 py-1.5 outline-none cursor-pointer text-[var(--color-on-surface)]"
            >
              <option value="ALL">Tous genres</option>
              <option value="M">Garçons (M)</option>
              <option value="F">Filles (F)</option>
            </select>
          </div>

          <span className="text-xs font-semibold text-[var(--color-on-surface-variant)]">
            {filteredStudents.length} élève{filteredStudents.length > 1 ? 's' : ''} affiché{filteredStudents.length > 1 ? 's' : ''}
          </span>
        </div>

        {/* Student Table */}
        {filteredStudents.length === 0 ? (
          <div className="py-12">
            <EmptyState
              title={students.length === 0 ? "Aucun élève dans cette classe" : "Aucun élève ne correspond à la recherche"}
              description={students.length === 0 
                ? "Vous pouvez inscrire des élèves un par un ou importer un fichier Excel complet pour cette classe." 
                : "Essayez de modifier vos critères de recherche ou de filtre."}
              icon={GraduationCap}
              actionLabel={students.length === 0 ? "+ Inscrire un élève" : undefined}
              onAction={students.length === 0 ? () => window.location.href = '/admin/eleves/nouveau' : undefined}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#eff4ff] border-b border-[var(--color-outline-variant)] text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">
                  <th className="py-3 px-6">N°</th>
                  <th className="py-3 px-6">Matricule</th>
                  <th className="py-3 px-6">Nom & Prénom</th>
                  <th className="py-3 px-6 text-center">Genre</th>
                  <th className="py-3 px-6">Date de Naissance</th>
                  <th className="py-3 px-6">Téléphone Parent</th>
                  <th className="py-3 px-6 text-center">Statut</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-outline-variant)]/40 text-sm">
                {filteredStudents.map((student, idx) => (
                  <tr key={student.id} className="hover:bg-[#eff4ff]/40 transition-colors">
                    <td className="py-3 px-6 text-xs text-[var(--color-on-surface-variant)]">{idx + 1}</td>
                    <td className="py-3 px-6 font-mono font-semibold text-xs text-[var(--color-primary)]">
                      {student.matricule}
                    </td>
                    <td className="py-3 px-6 font-semibold text-[var(--color-on-surface)]">
                      <Link href={`/admin/eleves/${student.id}`} className="hover:text-[var(--color-primary)] hover:underline">
                        {student.last_name} {student.first_name}
                      </Link>
                    </td>
                    <td className="py-3 px-6 text-center">
                      {student.gender === 'F' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-pink-50 text-pink-700 border border-pink-200">
                          Fille (F)
                        </span>
                      ) : student.gender === 'M' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          Garçon (M)
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-6 text-[var(--color-on-surface-variant)] text-xs">
                      {student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString('fr-FR') : '-'}
                    </td>
                    <td className="py-3 px-6 text-[var(--color-on-surface-variant)] text-xs font-mono">
                      {student.parent_phone || '-'}
                    </td>
                    <td className="py-3 px-6 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                        student.status === 'actif' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {student.status || 'actif'}
                      </span>
                    </td>
                    <td className="py-3 px-6 text-right relative">
                      <button 
                        type="button"
                        onClick={() => setOpenActionId(openActionId === student.id ? null : student.id)}
                        className="p-1.5 text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] hover:bg-[#eff4ff] rounded-full transition-all duration-300 hover:rotate-90 inline-flex items-center justify-center"
                        title="Actions"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      
                      {openActionId === student.id && (
                        <>
                          <div 
                            className="fixed inset-0 z-10" 
                            onClick={() => setOpenActionId(null)} 
                          />
                          <div className="absolute right-6 top-10 w-44 bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-xl shadow-xl z-20 flex flex-col overflow-hidden text-left py-1.5 animate-[fadeIn_0.1s_ease-out]">
                            <Link 
                              href={`/admin/eleves/${student.id}`} 
                              className="px-4 py-2 text-xs font-medium text-[var(--color-on-surface)] hover:bg-[#eff4ff] hover:text-[var(--color-primary)] flex items-center gap-2.5 transition-colors"
                              onClick={() => setOpenActionId(null)}
                            >
                              <Eye className="w-4 h-4" />
                              Voir fiche
                            </Link>
                            <Link 
                              href={`/admin/eleves/${student.id}`} 
                              className="px-4 py-2 text-xs font-medium text-[var(--color-on-surface)] hover:bg-[#eff4ff] hover:text-[var(--color-primary)] flex items-center gap-2.5 transition-colors"
                              onClick={() => setOpenActionId(null)}
                            >
                              <Edit2 className="w-4 h-4" />
                              Modifier
                            </Link>
                            <div className="border-t border-[var(--color-outline-variant)]/60 my-1" />
                            <button 
                              type="button"
                              onClick={() => {
                                setOpenActionId(null);
                                setStudentToDelete(student);
                              }}
                              className="px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition-colors w-full text-left"
                            >
                              <Trash2 className="w-4 h-4" />
                              Supprimer
                            </button>
                          </div>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Confirmation de Suppression */}
      {studentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-gray-100">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Supprimer l'élève de l'école
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Vous avez sélectionné l'élève <strong className="text-gray-900">{studentToDelete.last_name} {studentToDelete.first_name}</strong> (Matricule : <span className="font-mono font-semibold">{studentToDelete.matricule}</span>).
              </p>

              <div className="space-y-3 bg-gray-50 p-3.5 rounded-xl border border-gray-200 text-xs text-gray-700">
                <p>
                  <strong>• Option 1 (Élève ayant quitté l'établissement) :</strong> Supprime définitivement l'élève de l'école ainsi que toutes ses données associées (notes, présences, etc.).
                </p>
                <p>
                  <strong>• Option 2 :</strong> Retire uniquement l'élève de cette classe sans supprimer son dossier de l'école.
                </p>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row gap-2 justify-end">
              <button
                type="button"
                disabled={isPending}
                onClick={() => setStudentToDelete(null)}
                className="px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200 rounded-lg transition-colors order-3 sm:order-1"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={handleConfirmUnassign}
                className="px-4 py-2 text-sm font-semibold text-gray-800 bg-white border border-gray-300 hover:bg-gray-100 rounded-lg transition-colors order-2"
              >
                {isPending ? 'En cours...' : 'Retirer de la classe'}
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center justify-center gap-1.5 order-1 sm:order-3"
              >
                <Trash2 className="w-4 h-4" />
                {isPending ? 'Suppression...' : 'Supprimer définitivement'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
