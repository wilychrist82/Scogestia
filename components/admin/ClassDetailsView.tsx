'use client'

import { useState, useMemo, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { EmptyState } from '@/components/ui/EmptyState'
import { Users, GraduationCap, ArrowLeft, Download, Search, UserCheck, UserPlus, Eye, Edit2, Trash2, MoreVertical, AlertTriangle, Calendar, Clock, CreditCard, BookOpen, CheckCircle2, FileText, ArrowRight } from 'lucide-react'
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

export type ClassTimetableSlot = {
  id: string
  day_of_week: number
  start_time: string
  end_time: string
  subject_name: string
  teacher_name: string | null
  room: string | null
  color: string
}

type Props = {
  classInfo: ClassInfo
  students: ClassStudentItem[]
  timetableSlots?: ClassTimetableSlot[]
  attendances?: any[]
  schedules?: any[]
}

const DAY_NAMES: Record<number, string> = {
  1: 'Lundi',
  2: 'Mardi',
  3: 'Mercredi',
  4: 'Jeudi',
  5: 'Vendredi',
  6: 'Samedi',
}

export function ClassDetailsView({
  classInfo,
  students,
  timetableSlots = [],
  attendances = [],
  schedules = [],
}: Props) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'eleves' | 'emploi_du_temps' | 'suivi'>('eleves')
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

      {/* Navigation par onglets de la classe */}
      <div className="flex items-center justify-between flex-wrap gap-3 border-b border-slate-200 pb-2">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('eleves')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all ${
              activeTab === 'eleves'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Users size={16} />
            Liste des Élèves ({totalCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('emploi_du_temps')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all ${
              activeTab === 'emploi_du_temps'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Calendar size={16} />
            Emploi du temps ({timetableSlots.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('suivi')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all ${
              activeTab === 'suivi'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <CreditCard size={16} />
            Assiduité & Finances
          </button>
        </div>

        {/* Raccourcis Pédagogiques rapides */}
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/admin/academique/notes"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:border-emerald-300 hover:text-emerald-700 transition-colors flex items-center gap-1.5"
          >
            <BookOpen size={14} className="text-emerald-600" />
            Saisir notes
          </Link>
          <Link
            href="/admin/academique/bulletins"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:border-emerald-300 hover:text-emerald-700 transition-colors flex items-center gap-1.5"
          >
            <FileText size={14} className="text-emerald-600" />
            Bulletins
          </Link>
        </div>
      </div>

      {/* Onglet 1 : Liste des Élèves */}
      {activeTab === 'eleves' && (
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
      )}

      {/* Onglet 2 : Emploi du temps de la classe */}
      {activeTab === 'emploi_du_temps' && (
        <div className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-xl p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="text-lg font-bold text-[var(--color-on-surface)]">
                Emploi du temps — {classInfo.name}
              </h3>
              <p className="text-xs text-[var(--color-on-surface-variant)]">
                Planning hebdomadaire des cours programmés pour cette classe.
              </p>
            </div>
            <Link
              href="/admin/academique"
              className="px-3.5 py-2 rounded-lg text-xs font-bold bg-emerald-700 text-white hover:bg-emerald-800 transition-colors flex items-center gap-1.5"
            >
              Gérer l&apos;emploi du temps
              <ArrowRight size={14} />
            </Link>
          </div>

          {timetableSlots.length === 0 ? (
            <EmptyState
              title="Aucun créneau programmé"
              description="Configurez l'emploi du temps de cette classe depuis le module Académique > Emploi du temps."
              icon={Calendar}
              actionLabel="Configurer l'emploi du temps"
              onAction={() => router.push('/admin/academique')}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((dayNum) => {
                const daySlots = timetableSlots.filter((s) => s.day_of_week === dayNum)
                if (daySlots.length === 0) return null
                return (
                  <div
                    key={dayNum}
                    className="rounded-xl border border-slate-200 bg-slate-50/50 overflow-hidden"
                  >
                    <div className="px-4 py-2.5 bg-emerald-900 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-between">
                      <span>{DAY_NAMES[dayNum] || `Jour ${dayNum}`}</span>
                      <span className="text-[11px] font-medium text-emerald-200">
                        {daySlots.length} cours
                      </span>
                    </div>
                    <div className="divide-y divide-slate-200/70">
                      {daySlots.map((slot) => (
                        <div key={slot.id} className="p-3.5 bg-white space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-sm text-slate-900">
                              {slot.subject_name}
                            </span>
                            <span className="text-xs font-mono font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs text-slate-500">
                            <span>{slot.teacher_name || 'Enseignant non précisé'}</span>
                            {slot.room && <span className="font-medium">Salle {slot.room}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Onglet 3 : Assiduité & Finances de la classe */}
      {activeTab === 'suivi' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Synthèse Financière de la classe */}
          <div className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-[var(--color-on-surface)] flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                Recouvrement Financier de la Classe
              </h3>
              <Link
                href="/admin/finance"
                className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
              >
                Voir Finances <ArrowRight size={13} />
              </Link>
            </div>
            {(() => {
              const totalExpected = schedules.reduce((acc, s) => acc + Number(s.total_amount || 0), 0)
              const totalPaid = schedules.reduce((acc, s) => acc + Number(s.paid_amount || 0), 0)
              const remaining = Math.max(0, totalExpected - totalPaid)
              const rate = totalExpected > 0 ? Math.round((totalPaid / totalExpected) * 100) : 0

              return (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                      <p className="text-[11px] font-semibold text-slate-500 uppercase">Attendu</p>
                      <p className="text-sm sm:text-base font-black text-slate-900 mt-1">
                        {totalExpected.toLocaleString('fr-FR')} F
                      </p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
                      <p className="text-[11px] font-semibold text-emerald-700 uppercase">Encaissé</p>
                      <p className="text-sm sm:text-base font-black text-emerald-800 mt-1">
                        {totalPaid.toLocaleString('fr-FR')} F
                      </p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200">
                      <p className="text-[11px] font-semibold text-rose-700 uppercase">Reste à payer</p>
                      <p className="text-sm sm:text-base font-black text-rose-800 mt-1">
                        {remaining.toLocaleString('fr-FR')} F
                      </p>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1.5">
                      <span className="text-slate-600">Taux de recouvrement de la classe</span>
                      <span className="text-emerald-700 font-bold">{rate}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 rounded-full transition-all"
                        style={{ width: `${Math.min(100, rate)}%` }}
                      />
                    </div>
                  </div>
                </div>
              )
            })()}
          </div>

          {/* Synthèse Assiduité de la classe */}
          <div className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-[var(--color-on-surface)] flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-600" />
              Assiduité & Absences Récentes
            </h3>
            {(() => {
              const absCount = attendances.filter((a) => a.status === 'absent').length
              const justCount = attendances.filter(
                (a) => a.status === 'absent_justifie' || Boolean(a.justification)
              ).length
              const retCount = attendances.filter((a) => a.status === 'retard').length

              return (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-center">
                      <p className="text-xl font-black text-rose-700">{absCount}</p>
                      <p className="text-[11px] font-semibold text-rose-700 uppercase">Absences</p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-center">
                      <p className="text-xl font-black text-blue-700">{justCount}</p>
                      <p className="text-[11px] font-semibold text-blue-700 uppercase">Justifiées</p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-center">
                      <p className="text-xl font-black text-amber-700">{retCount}</p>
                      <p className="text-[11px] font-semibold text-amber-700 uppercase">Retards</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500">
                    Basé sur les {attendances.length} derniers pointages d&apos;appel enregistrés pour la classe {classInfo.name}.
                  </p>
                </div>
              )
            })()}
          </div>
        </div>
      )}

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
