'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  IdCard,
  GraduationCap,
  Users,
  Camera,
  ChevronDown,
  Sparkles,
  CheckCircle2,
  BookOpen,
} from 'lucide-react'
import {
  SchoolIdCardStudioModal,
  StudioStudentItem,
} from '@/components/admin/SchoolIdCardStudioModal'
import { getClassOrderRank } from '@/lib/classes'

type ClassItem = {
  id: string
  name: string
  level: string | null
  academic_year?: string | null
}

type StudentWithClass = StudioStudentItem & {
  class_id: string | null
}

type SchoolInfo = {
  id?: string | null
  name?: string | null
  city?: string | null
  phone?: string | null
  email?: string | null
  current_academic_year?: string | null
  director_name?: string | null
  logo_url?: string | null
  stamp_url?: string | null
  signature_url?: string | null
}

type Props = {
  classes: ClassItem[]
  students: StudentWithClass[]
  schoolInfo: SchoolInfo | null
}

type CycleKey = 'all' | 'maternelle' | 'primaire' | 'college' | 'lycee'

function detectClassCycle(cls: ClassItem): CycleKey {
  const rank = getClassOrderRank(cls.name, cls.level || undefined)
  if (rank >= 100 && rank < 200) return 'maternelle'
  if (rank >= 200 && rank < 300) return 'primaire'
  if (rank >= 300 && rank < 400) return 'college'
  if (rank >= 400 && rank < 500) return 'lycee'

  const l = (cls.level || '').toLowerCase()
  if (l.includes('maternelle')) return 'maternelle'
  if (l.includes('primaire')) return 'primaire'
  if (l.includes('coll') || l.includes('secondaire 1')) return 'college'
  if (l.includes('lyc') || l.includes('secondaire 2')) return 'lycee'
  return 'primaire'
}

const CYCLE_OPTIONS: { key: CycleKey; label: string }[] = [
  { key: 'all', label: 'Tous les niveaux scolaires' },
  { key: 'maternelle', label: 'Maternelle' },
  { key: 'primaire', label: 'Primaire' },
  { key: 'college', label: 'Collège (Secondaire 1)' },
  { key: 'lycee', label: 'Lycée (Secondaire 2)' },
]

export function SchoolIdCardsManager({ classes, students, schoolInfo }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialClassIdFromUrl = searchParams.get('classId')
  const initialStudentIdFromUrl = searchParams.get('studentId')

  const [selectedCycle, setSelectedCycle] = useState<CycleKey>('all')
  const [selectedClassId, setSelectedClassId] = useState<string>(() => {
    if (initialClassIdFromUrl && classes.some((c) => c.id === initialClassIdFromUrl)) {
      return initialClassIdFromUrl
    }
    // Privilégier par défaut la première classe ayant plusieurs élèves (pour le défilement 1 -> 2 -> 3), sinon la première classe habitée
    const firstMultiStudentClass = classes.find(
      (c) => students.filter((s) => s.class_id === c.id).length > 1
    )
    if (firstMultiStudentClass) return firstMultiStudentClass.id

    const firstPopulated = classes.find((c) =>
      students.some((s) => s.class_id === c.id)
    )
    return firstPopulated?.id || classes[0]?.id || ''
  })

  const [initialActiveStudentId, setInitialActiveStudentId] = useState<string>(
    initialStudentIdFromUrl || ''
  )

  // Filtrer les classes selon le niveau (cycle) choisi
  const filteredClasses = useMemo(() => {
    if (selectedCycle === 'all') return classes
    return classes.filter((c) => detectClassCycle(c) === selectedCycle)
  }, [classes, selectedCycle])

  // Si on change de cycle et que la classe active n'est plus dans la liste, sélectionner la première du cycle
  useEffect(() => {
    if (
      filteredClasses.length > 0 &&
      !filteredClasses.some((c) => c.id === selectedClassId)
    ) {
      const multi = filteredClasses.find(
        (c) => students.filter((s) => s.class_id === c.id).length > 1
      )
      const populated = filteredClasses.find((c) =>
        students.some((s) => s.class_id === c.id)
      )
      setSelectedClassId(multi?.id || populated?.id || filteredClasses[0].id)
    }
  }, [filteredClasses, selectedClassId, students])

  const activeClass = useMemo(
    () => classes.find((c) => c.id === selectedClassId) || classes[0] || null,
    [classes, selectedClassId]
  )

  const classStudents = useMemo(() => {
    if (!activeClass) return []
    return students
      .filter((s) => s.class_id === activeClass.id)
      .sort((a, b) => {
        const cmp = (a.last_name || '').localeCompare(b.last_name || '', 'fr', {
          sensitivity: 'base',
        })
        if (cmp !== 0) return cmp
        return (a.first_name || '').localeCompare(b.first_name || '', 'fr', {
          sensitivity: 'base',
        })
      })
  }, [students, activeClass])

  const totalPhotosInClass = useMemo(
    () => classStudents.filter((s) => Boolean(s.avatar_url)).length,
    [classStudents]
  )

  return (
    <div className="space-y-5 pb-10">
      {/* EN-TÊTE ÉDITORIAL & SÉLECTEUR PAR LISTES DÉROULANTES (STYLE CLAUDE) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {/* Bandeau de titre épuré */}
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-gradient-to-r from-slate-50/80 via-white to-slate-50/80">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="h-11 w-11 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-xs">
              <IdCard className="h-5 w-5 text-amber-300" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
                  Cartes d&apos;Identité Scolaires
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-700 border border-indigo-200/60">
                  <Sparkles className="h-3 w-3" />
                  10 cartes / page A4 • Ordre A–Z
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Sélectionnez la classe via le menu déroulant, importez la photo de chaque élève puis cliquez sur <strong className="text-slate-700">« Suivant → »</strong> pour passer automatiquement à l&apos;élève suivant avec ses informations pré-remplies.
              </p>
            </div>
          </div>

          {/* Indicateurs synthétiques de la classe active */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-2.5">
              <Users className="h-4 w-4 text-slate-600" />
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Effectif {activeClass?.name || ''}
                </div>
                <div className="text-xs font-bold text-slate-900">
                  {classStudents.length} élève{classStudents.length > 1 ? 's' : ''}
                </div>
              </div>
            </div>

            <div className="px-3.5 py-2 rounded-xl bg-emerald-50/70 border border-emerald-200/70 flex items-center gap-2.5">
              {totalPhotosInClass === classStudents.length && classStudents.length > 0 ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              ) : (
                <Camera className="h-4 w-4 text-emerald-600" />
              )}
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700/80">
                  Photos prêtes
                </div>
                <div className="text-xs font-bold text-emerald-950">
                  {totalPhotosInClass} / {classStudents.length}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Barre de Sélection par Menus Déroulants (Flèches descendantes uniquement — sans liste horizontale encombrante) */}
        <div className="px-6 py-4 bg-white grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          {/* 1. Niveau Scolaire (Menu déroulant avec flèche descendante) */}
          <div className="md:col-span-4 space-y-1.5">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <GraduationCap className="h-3.5 w-3.5 text-slate-700" />
              1. Niveau Scolaire
            </label>
            <div className="relative">
              <select
                value={selectedCycle}
                onChange={(e) => setSelectedCycle(e.target.value as CycleKey)}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 pl-3.5 pr-9 py-2.5 text-xs font-semibold text-slate-900 outline-none focus:border-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900/10 transition-all cursor-pointer"
              >
                {CYCLE_OPTIONS.map((opt) => {
                  const count =
                    opt.key === 'all'
                      ? classes.length
                      : classes.filter((c) => detectClassCycle(c) === opt.key).length
                  return (
                    <option key={opt.key} value={opt.key}>
                      {opt.label} ({count} classe{count > 1 ? 's' : ''})
                    </option>
                  )
                })}
              </select>
              <ChevronDown className="h-4 w-4 text-slate-500 pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* 2. Sélection de la Classe (Menu déroulant avec flèche descendante) */}
          <div className="md:col-span-4 space-y-1.5">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5 text-indigo-600" />
              2. Sélectionner la Classe
            </label>
            <div className="relative">
              <select
                value={selectedClassId}
                onChange={(e) => {
                  setSelectedClassId(e.target.value)
                  setInitialActiveStudentId('')
                }}
                className="w-full appearance-none rounded-xl border border-indigo-200 bg-indigo-50/40 hover:bg-indigo-50/70 pl-3.5 pr-9 py-2.5 text-xs font-bold text-indigo-950 outline-none focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-500/15 transition-all cursor-pointer"
              >
                {filteredClasses.map((cls) => {
                  const count = students.filter((s) => s.class_id === cls.id).length
                  return (
                    <option key={cls.id} value={cls.id}>
                      Classe de {cls.name} — {count} élève{count > 1 ? 's' : ''} inscrit{count > 1 ? 's' : ''}
                    </option>
                  )
                })}
              </select>
              <ChevronDown className="h-4 w-4 text-indigo-700 pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* 3. Accès direct à un élève de la classe (Menu déroulant avec flèche descendante) */}
          <div className="md:col-span-4 space-y-1.5">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-slate-700" />
              3. Élève en cours (Ordre Alphabétique A–Z)
            </label>
            <div className="relative">
              <select
                value={initialActiveStudentId || classStudents[0]?.id || ''}
                onChange={(e) => setInitialActiveStudentId(e.target.value)}
                disabled={classStudents.length === 0}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 pl-3.5 pr-9 py-2.5 text-xs font-semibold text-slate-900 outline-none focus:border-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900/10 transition-all cursor-pointer disabled:opacity-50"
              >
                {classStudents.length === 0 ? (
                  <option value="">Aucun élève dans cette classe</option>
                ) : (
                  classStudents.map((s, idx) => (
                    <option key={s.id} value={s.id}>
                      Élève {idx + 1}/{classStudents.length} — {s.last_name.toUpperCase()} {s.first_name} {s.avatar_url ? '✓ Photo' : ''}
                    </option>
                  ))
                )}
              </select>
              <ChevronDown className="h-4 w-4 text-slate-500 pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>
        </div>
      </div>

      {/* STUDIO COMPLET INTÉGRÉ SUR LA PAGE */}
      {activeClass && classStudents.length > 0 ? (
        <SchoolIdCardStudioModal
          isOpen={true}
          mode="embedded"
          className={activeClass.name}
          classLevel={activeClass.level}
          academicYear={
            activeClass.academic_year ||
            schoolInfo?.current_academic_year ||
            '2025-2026'
          }
          students={classStudents}
          initialActiveStudentId={initialActiveStudentId}
          onActiveStudentChange={(id) => setInitialActiveStudentId(id)}
          schoolInfo={schoolInfo}
          onStudentsUpdated={() => router.refresh()}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-3">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center">
            <Users className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            Aucun élève inscrit dans la classe {activeClass?.name || 'sélectionnée'}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Utilisez le menu déroulant <strong>« 2. Sélectionner la Classe »</strong> ci-dessus pour choisir une classe ayant des élèves inscrits.
          </p>
        </div>
      )}
    </div>
  )
}
