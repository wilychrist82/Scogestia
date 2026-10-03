'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { EmptyState } from '@/components/ui/EmptyState'
import { Users, GraduationCap, ArrowLeft, Download, Search, UserCheck } from 'lucide-react'

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
  const [searchTerm, setSearchTerm] = useState('')
  const [genderFilter, setGenderFilter] = useState<'ALL' | 'M' | 'F'>('ALL')

  const boysCount = students.filter(s => s.gender?.toUpperCase() === 'M').length
  const girlsCount = students.filter(s => s.gender?.toUpperCase() === 'F').length
  const totalCount = students.length

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
            <span className="material-symbols-outlined text-[18px]">person_add</span>
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
            <span className="material-symbols-outlined text-[18px]">male</span>
            <span className="text-xs font-bold uppercase tracking-wider">Garçons</span>
          </div>
          <p className="text-2xl font-bold text-[var(--color-on-surface)]">{boysCount}</p>
          <p className="text-xs text-[var(--color-on-surface-variant)] mt-0.5">
            {totalCount > 0 ? `${Math.round((boysCount / totalCount) * 100)}%` : '0%'}
          </p>
        </div>

        <div className="bg-[var(--color-surface-container-lowest)] p-4 rounded-xl border border-[var(--color-outline-variant)] shadow-sm">
          <div className="flex items-center gap-2 text-pink-600 mb-1">
            <span className="material-symbols-outlined text-[18px]">female</span>
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
                    <td className="py-3 px-6 text-right">
                      <Link
                        href={`/admin/eleves/${student.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-primary)] hover:underline"
                      >
                        <span className="material-symbols-outlined text-[16px]">visibility</span>
                        Voir fiche
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
