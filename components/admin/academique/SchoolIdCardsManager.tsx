'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  IdCard,
  GraduationCap,
  Users,
  User,
  Search,
  Sparkles,
  CheckCircle2,
  Camera,
  Layers,
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

const CYCLE_TABS: { key: CycleKey; label: string }[] = [
  { key: 'all', label: 'Tous les niveaux' },
  { key: 'maternelle', label: 'Maternelle' },
  { key: 'primaire', label: 'Primaire' },
  { key: 'college', label: 'Collège' },
  { key: 'lycee', label: 'Lycée' },
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
    // Choisir par défaut la première classe qui contient des élèves, sinon la première classe
    const firstPopulated = classes.find((c) =>
      students.some((s) => s.class_id === c.id)
    )
    return firstPopulated?.id || classes[0]?.id || ''
  })

  const [targetMode, setTargetMode] = useState<'class' | 'single_student'>(() =>
    initialStudentIdFromUrl ? 'single_student' : 'class'
  )
  const [singleStudentId, setSingleStudentId] = useState<string>(
    initialStudentIdFromUrl || ''
  )
  const [studentSearch, setStudentSearch] = useState('')

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
      const populated = filteredClasses.find((c) =>
        students.some((s) => s.class_id === c.id)
      )
      setSelectedClassId(populated?.id || filteredClasses[0].id)
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

  useEffect(() => {
    if (targetMode === 'single_student' && classStudents.length > 0) {
      if (!classStudents.some((s) => s.id === singleStudentId)) {
        setSingleStudentId(classStudents[0].id)
      }
    }
  }, [targetMode, classStudents, singleStudentId])

  const studioStudents = useMemo(() => {
    if (targetMode === 'single_student') {
      const found = classStudents.find((s) => s.id === singleStudentId)
      return found ? [found] : classStudents.slice(0, 1)
    }
    return classStudents
  }, [targetMode, classStudents, singleStudentId])

  const searchedSingleStudents = useMemo(() => {
    const q = studentSearch.trim().toLowerCase()
    if (!q) return classStudents
    return classStudents.filter(
      (s) =>
        s.last_name.toLowerCase().includes(q) ||
        s.first_name.toLowerCase().includes(q) ||
        (s.matricule || '').toLowerCase().includes(q)
    )
  }, [classStudents, studentSearch])

  const totalPhotosInClass = useMemo(
    () => classStudents.filter((s) => Boolean(s.avatar_url)).length,
    [classStudents]
  )

  return (
    <div className="space-y-6 pb-10">
      {/* EN-TÊTE DU MODULE ACADÉMIQUE > CARTE SCOLAIRE */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#1E293B] via-[#312E81] to-[#4338CA] p-6 text-white shadow-lg">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-amber-300 ring-1 ring-white/20">
              <IdCard className="h-3.5 w-3.5" />
              Module Académique • Cartes d&apos;Identité Scolaires
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Générateur Officiel de Cartes Scolaires
            </h1>
            <p className="text-xs sm:text-sm text-indigo-100/90 max-w-3xl">
              Choisissez le <strong>niveau</strong> et la <strong>classe</strong> (ou un élève), uploadez la photo de chaque élève en cliquant sur <strong>« Enregistrer &amp; Élève Suivant → »</strong>, personnalisez les <strong>polices, tailles, gras, italique, souligné, couleurs et thèmes</strong>, puis générez vos planches de <strong>10 cartes par page A4</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-xl bg-white/10 border border-white/15 px-4 py-2.5 backdrop-blur-md">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-indigo-200">
                Classe sélectionnée
              </span>
              <span className="text-lg font-black text-white">
                {activeClass?.name || 'Aucune'} ({classStudents.length} élève
                {classStudents.length > 1 ? 's' : ''})
              </span>
            </div>

            <div className="rounded-xl bg-emerald-500/20 border border-emerald-400/30 px-4 py-2.5 backdrop-blur-md">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-200">
                Photos prêtes
              </span>
              <span className="text-lg font-black text-white flex items-center gap-1.5">
                <Camera className="h-4 w-4 text-emerald-300" />
                {totalPhotosInClass} / {classStudents.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* BARRE DE SÉLECTION : 1. NIVEAU -> 2. CLASSE -> 3. MODE (TOUTE LA CLASSE OU UN ÉLÈVE) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* 1. Choix du Niveau (Cycle) */}
          <div className="lg:col-span-5 space-y-2">
            <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <GraduationCap className="h-4 w-4 text-indigo-600" />
              1. Choisir le Niveau Scolaire
            </label>
            <div className="flex flex-wrap gap-1.5">
              {CYCLE_TABS.map((tab) => {
                const count =
                  tab.key === 'all'
                    ? classes.length
                    : classes.filter((c) => detectClassCycle(c) === tab.key).length
                const isActive = selectedCycle === tab.key
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setSelectedCycle(tab.key)}
                    className={`px-3 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 border ${
                      isActive
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-200/80 text-slate-600'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* 2. Choix du Mode : Toute la classe vs Un seul élève */}
          <div className="lg:col-span-7 space-y-2">
            <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-indigo-600" />
              2. Mode de Production des Cartes
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setTargetMode('class')}
                className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
                  targetMode === 'class'
                    ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100'
                }`}
              >
                <div
                  className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${
                    targetMode === 'class'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  <Users className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-extrabold text-slate-900">
                    Toute la Classe ({classStudents.length} élèves)
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Défilement élève par élève (Suivant →) &amp; 10 cartes/page
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTargetMode('single_student')}
                className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
                  targetMode === 'single_student'
                    ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100'
                }`}
              >
                <div
                  className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${
                    targetMode === 'single_student'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-extrabold text-slate-900">
                    Un Élève Spécifique
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Choisir un seul élève de la classe pour sa carte
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* 3. Sélection rapide de la Classe */}
        <div className="pt-3 border-t border-slate-100 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
              3. Choisir la Classe ({filteredClasses.length} classe
              {filteredClasses.length > 1 ? 's' : ''})
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="rounded-xl border border-indigo-200 bg-indigo-50/60 px-3 py-1.5 text-xs font-extrabold text-indigo-950 outline-none focus:border-indigo-600"
            >
              {filteredClasses.map((cls) => {
                const count = students.filter((s) => s.class_id === cls.id).length
                return (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} ({count} élève{count > 1 ? 's' : ''})
                  </option>
                )
              })}
            </select>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {filteredClasses.map((cls) => {
              const count = students.filter((s) => s.class_id === cls.id).length
              const isSelected = cls.id === selectedClassId
              return (
                <button
                  key={cls.id}
                  type="button"
                  onClick={() => setSelectedClassId(cls.id)}
                  className={`px-3.5 py-2 rounded-xl border text-xs font-extrabold whitespace-nowrap transition-all flex items-center gap-2 ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span>{cls.name}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      isSelected
                        ? 'bg-emerald-400/20 text-emerald-300'
                        : count > 0
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {count} élève{count > 1 ? 's' : ''}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Si Mode "Un Élève Spécifique", afficher le sélecteur d'élève */}
        {targetMode === 'single_student' && classStudents.length > 0 && (
          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-indigo-50/50 p-3 rounded-xl border border-indigo-100">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-indigo-600" />
              <span className="text-xs font-extrabold text-indigo-950">
                Sélectionner l&apos;élève de {activeClass?.name} :
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap flex-1 max-w-xl justify-end">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="Filtrer par nom ou matricule..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-600"
                />
              </div>

              <select
                value={singleStudentId}
                onChange={(e) => setSingleStudentId(e.target.value)}
                className="rounded-xl border border-indigo-300 bg-white px-3 py-1.5 text-xs font-extrabold text-indigo-950 outline-none focus:border-indigo-600 min-w-[220px]"
              >
                {searchedSingleStudents.map((s, idx) => (
                  <option key={s.id} value={s.id}>
                    {idx + 1}. {s.last_name.toUpperCase()} {s.first_name} (#{s.matricule})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
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
          students={studioStudents}
          schoolInfo={schoolInfo}
          onStudentsUpdated={() => router.refresh()}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-3">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Users className="h-6 w-6" />
          </div>
          <h3 className="text-base font-extrabold text-slate-900">
            Aucun élève inscrit dans la classe {activeClass?.name || 'sélectionnée'}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Sélectionnez une autre classe ci-dessus (par exemple une classe ayant des élèves inscrits) pour préparer et générer ses cartes d&apos;identité scolaires.
          </p>
        </div>
      )}
    </div>
  )
}

