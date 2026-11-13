'use client'

import React, { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  ArrowUpDown,
  FileSpreadsheet,
  Loader2,
  RotateCcw,
  Save,
  Search,
  Trophy,
  UserCheck,
} from 'lucide-react'
import { AverageScale } from '@/lib/grades-export'
import {
  computePrimaryMatrixCalculations,
  GridStudentInput,
  GridSubjectInput,
  parseCellScoreInput,
  TRIMESTER_MONTHS_MAP,
  TrimesterMonthIndex,
  TrimesterNumber,
} from '@/lib/primary-class-grid'

export interface PrimaryClassMatrixGridProps {
  classId: string
  className: string
  classLevel?: string | null
  students: GridStudentInput[]
  subjects: GridSubjectInput[]
  trimester: TrimesterNumber
  trimMonth: TrimesterMonthIndex
  monthNumber: number
  savedScoreMap: Record<string, number> // key: `${studentId}_${subjectId}`
  draftMap: Record<string, string> // key: `${studentId}_${subjectId}`
  onCellChange: (studentId: string, subjectId: string, value: string) => void
  onResetDrafts: () => void
  onSaveMonth: (params: {
    upserts: Array<{ studentId: string; subjectId: string; score: number }>
    deletes: Array<{ studentId: string; subjectId: string }>
  }) => void
  onOpenStudentFiche: (studentId: string) => void
  isSaving: boolean
  scale: AverageScale
  onScaleChange: (scale: AverageScale) => void
  customDivisorInput: string
  onCustomDivisorChange: (value: string) => void
}

function fmtComma(val: number | null | undefined, decimals: number): string {
  if (val === null || val === undefined || isNaN(val)) return '—'
  return val.toFixed(decimals).replace('.', ',')
}

export function PrimaryClassMatrixGrid({
  className,
  classLevel,
  students,
  subjects,
  trimester,
  trimMonth,
  monthNumber,
  savedScoreMap,
  draftMap,
  onCellChange,
  onResetDrafts,
  onSaveMonth,
  onOpenStudentFiche,
  isSaving,
  scale,
  onScaleChange,
  customDivisorInput,
  onCustomDivisorChange,
}: PrimaryClassMatrixGridProps) {
  const [viewMode, setViewMode] = useState<'alpha' | 'merit_all' | 'merit_passing'>('alpha')
  const [searchTerm, setSearchTerm] = useState('')

  const monthMeta =
    TRIMESTER_MONTHS_MAP[trimester].find(m => m.trimMonth === trimMonth) ||
    TRIMESTER_MONTHS_MAP[trimester][0]

  const getRawValue = (studentId: string, subjectId: string): string => {
    const key = `${studentId}_${subjectId}`
    if (Object.prototype.hasOwnProperty.call(draftMap, key)) {
      return draftMap[key]
    }
    const saved = savedScoreMap[key]
    return saved !== undefined ? String(saved).replace('.', ',') : ''
  }

  const parsedCustomDivisor = useMemo(() => {
    const n = parseFloat(customDivisorInput.replace(',', '.'))
    return !isNaN(n) && n > 0 ? n : null
  }, [customDivisorInput])

  const matrix = useMemo(
    () =>
      computePrimaryMatrixCalculations({
        students,
        subjects,
        className,
        classLevel,
        getRawValue: (stuId, subId) => {
          const key = `${stuId}_${subId}`
          if (Object.prototype.hasOwnProperty.call(draftMap, key)) {
            return draftMap[key]
          }
          const saved = savedScoreMap[key]
          return saved !== undefined ? String(saved).replace('.', ',') : ''
        },
        scale,
        customDivisor: parsedCustomDivisor,
      }),
    [students, subjects, className, classLevel, draftMap, savedScoreMap, scale, parsedCustomDivisor]
  )

  // Filtrage et tri des lignes affichées (sans jamais modifier le rang officiel de la classe)
  const displayedRows = useMemo(() => {
    let rows = matrix.rows
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim()
      rows = rows.filter(
        r =>
          r.fullName.toLowerCase().includes(q) ||
          (r.student.matricule && r.student.matricule.toLowerCase().includes(q))
      )
    }

    if (viewMode === 'merit_passing') {
      return [...rows]
        .filter(r => !r.isAbsent && r.isPassing)
        .sort((a, b) => {
          if ((b.average ?? 0) !== (a.average ?? 0)) return (b.average ?? 0) - (a.average ?? 0)
          return (b.totalPoints ?? 0) - (a.totalPoints ?? 0)
        })
    }

    if (viewMode === 'merit_all') {
      return [...rows].sort((a, b) => {
        if (a.isAbsent && b.isAbsent) return 0
        if (a.isAbsent) return 1
        if (b.isAbsent) return -1
        if ((b.average ?? 0) !== (a.average ?? 0)) return (b.average ?? 0) - (a.average ?? 0)
        return (b.totalPoints ?? 0) - (a.totalPoints ?? 0)
      })
    }

    return rows
  }, [matrix.rows, searchTerm, viewMode])

  // Calcul des modifications en attente d'enregistrement
  const pendingDiff = useMemo(() => {
    const upserts: Array<{ studentId: string; subjectId: string; score: number }> = []
    const deletes: Array<{ studentId: string; subjectId: string }> = []

    for (const [key, rawVal] of Object.entries(draftMap)) {
      const sepIdx = key.indexOf('_')
      if (sepIdx <= 0) continue
      const studentId = key.slice(0, sepIdx)
      const subjectId = key.slice(sepIdx + 1)
      const prevSaved = savedScoreMap[key]
      const parsed = parseCellScoreInput(rawVal)

      if (parsed === null) {
        if (prevSaved !== undefined) {
          deletes.push({ studentId, subjectId })
        }
      } else if (parsed !== 'invalid') {
        if (prevSaved === undefined || Math.abs(prevSaved - parsed) > 0.0001) {
          upserts.push({ studentId, subjectId, score: parsed })
        }
      }
    }

    return { upserts, deletes, totalChanges: upserts.length + deletes.length }
  }, [draftMap, savedScoreMap])

  const triggerSave = () => {
    if (isSaving || matrix.invalidCellCount > 0 || pendingDiff.totalChanges === 0) return
    onSaveMonth({
      upserts: pendingDiff.upserts,
      deletes: pendingDiff.deletes,
    })
  }

  // Raccourci Ctrl+S / Cmd+S pour enregistrer rapidement
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        if (!isSaving && matrix.invalidCellCount === 0 && pendingDiff.totalChanges > 0) {
          onSaveMonth({
            upserts: pendingDiff.upserts,
            deletes: pendingDiff.deletes,
          })
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isSaving, matrix.invalidCellCount, pendingDiff, onSaveMonth])

  // Navigation clavier style Excel dans le tableau
  const handleCellKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    rowIdx: number,
    colIdx: number
  ) => {
    const focusCell = (r: number, c: number) => {
      const target = document.getElementById(
        `matrix-cell-${monthNumber}-${r}-${c}`
      ) as HTMLInputElement | null
      if (target) {
        target.focus()
        target.select()
      }
    }

    if (e.key === 'Enter' || e.key === 'ArrowDown') {
      e.preventDefault()
      if (rowIdx + 1 < displayedRows.length) {
        focusCell(rowIdx + 1, colIdx)
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (rowIdx - 1 >= 0) {
        focusCell(rowIdx - 1, colIdx)
      }
    } else if (e.key === 'ArrowRight') {
      const input = e.currentTarget
      const atEnd =
        input.selectionStart === null ||
        (input.selectionStart === input.value.length && input.selectionEnd === input.value.length)
      if (atEnd && colIdx + 1 < matrix.subjects.length) {
        e.preventDefault()
        focusCell(rowIdx, colIdx + 1)
      }
    } else if (e.key === 'ArrowLeft') {
      const input = e.currentTarget
      const atStart = input.selectionStart === 0 && input.selectionEnd === 0
      if (atStart && colIdx - 1 >= 0) {
        e.preventDefault()
        focusCell(rowIdx, colIdx - 1)
      }
    }
  }

  const autoDivisorLabel = useMemo(() => {
    const denom = matrix.baremeTotal > 0 ? matrix.baremeTotal / scale : 1
    return (Math.round(denom * 100) / 100).toString().replace('.', ',')
  }, [matrix.baremeTotal, scale])

  return (
    <div className="flex flex-col bg-white">
      {/* Bannière officielle de composition mensuelle & action Enregistrer */}
      <div className="bg-gradient-to-r from-[#13294B] via-[#1B365D] to-[#0B4F3E] text-white px-5 py-4 border-b border-slate-700/60 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-300 shrink-0" />
            <h3 className="text-sm sm:text-base font-extrabold tracking-wide uppercase">
              Composition Mensuelle — {monthMeta.calendarMonth} ({trimester === 1 ? '1er' : `${trimester}e`} Trimestre · {monthMeta.shortLabel})
            </h3>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-200 font-medium tabular-nums">
            <span>
              Classe : <strong className="text-white">{className}</strong>
            </span>
            <span className="text-slate-400">|</span>
            <span>
              Effectif : <strong className="text-white">{matrix.presentCount}</strong> / {matrix.enrolledCount} élève(s)
            </span>
            <span className="text-slate-400">|</span>
            <span className="px-2 py-0.5 rounded bg-white/12 text-emerald-200 font-bold">
              {matrix.formulaLabel}
            </span>
            <span className="text-slate-400">|</span>
            <span>
              Admis (≥ {matrix.passThreshold}/{scale}) :{' '}
              <strong className="text-emerald-300">
                {matrix.passingCount} ({matrix.passRatePct ?? 0} %)
              </strong>
            </span>
            <span className="text-slate-400">|</span>
            <span>
              Moy. classe :{' '}
              <strong className="text-white">
                {matrix.classAverage !== null ? `${fmtComma(matrix.classAverage, 2)} / ${scale}` : '—'}
              </strong>
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {matrix.invalidCellCount > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-300/50 text-red-100 text-xs font-bold">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{matrix.invalidCellCount} note(s) hors barème</span>
            </span>
          )}

          {pendingDiff.totalChanges > 0 && (
            <>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-400/20 border border-amber-300/40 text-amber-100 text-xs font-bold tabular-nums">
                {pendingDiff.totalChanges} modification(s)
              </span>
              <button
                type="button"
                onClick={onResetDrafts}
                disabled={isSaving}
                className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50"
                title="Annuler les modifications non enregistrées de ce mois"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Annuler</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={triggerSave}
            disabled={isSaving || matrix.invalidCellCount > 0 || pendingDiff.totalChanges === 0}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:cursor-not-allowed ${
              pendingDiff.totalChanges > 0 && matrix.invalidCellCount === 0
                ? 'bg-emerald-400 hover:bg-emerald-300 text-slate-950 ring-2 ring-emerald-300/40'
                : 'bg-white/15 text-white/70 border border-white/15'
            }`}
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>
              {isSaving
                ? 'Enregistrement...'
                : pendingDiff.totalChanges > 0
                  ? `Enregistrer (${pendingDiff.totalChanges})`
                  : 'Notes à jour'}
            </span>
          </button>
        </div>
      </div>

      {/* Barre de contrôles : Tri / Admis, Recherche, Échelle & Diviseur */}
      <div className="px-4 sm:px-5 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex flex-wrap items-center rounded-xl border border-slate-200 bg-white p-1 gap-1 shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode('alpha')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'alpha'
                  ? 'bg-[#1B365D] text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Ordre alphabétique ({matrix.enrolledCount})
            </button>
            <button
              type="button"
              onClick={() => setViewMode('merit_all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'merit_all'
                  ? 'bg-[#1B365D] text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>Ordre de mérite (Tous)</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('merit_passing')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'merit_passing'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-emerald-800 hover:bg-emerald-50'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>
                Admis (≥ {matrix.passThreshold}/{scale}) · {matrix.passingCount}
              </span>
            </button>
          </div>

          <div className="relative w-56 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher un élève..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full h-9 pl-8 pr-3 text-xs rounded-lg border border-slate-200 bg-white outline-none focus:border-[#065F46] font-medium"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Sélecteur Échelle /20 vs /10 */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Moyenne
            </span>
            <div className="inline-flex rounded-lg border border-slate-300 bg-white p-0.5 h-8">
              <button
                type="button"
                onClick={() => onScaleChange(20)}
                className={`px-2.5 rounded text-xs font-bold cursor-pointer transition-colors ${
                  scale === 20 ? 'bg-[#1B365D] text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                / 20
              </button>
              <button
                type="button"
                onClick={() => onScaleChange(10)}
                className={`px-2.5 rounded text-xs font-bold cursor-pointer transition-colors ${
                  scale === 10 ? 'bg-[#1B365D] text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                / 10
              </button>
            </div>
          </div>

          {/* Diviseur auto / personnalisé */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Diviseur
            </span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                step="0.5"
                min="0.5"
                value={customDivisorInput}
                onChange={e => onCustomDivisorChange(e.target.value)}
                placeholder={`Auto (${autoDivisorLabel})`}
                className="w-24 h-8 px-2 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-800 outline-none focus:border-[#065F46] tabular-nums"
              />
              {customDivisorInput !== '' && (
                <button
                  type="button"
                  onClick={() => onCustomDivisorChange('')}
                  className="text-[11px] font-bold text-[#1B365D] hover:underline cursor-pointer"
                >
                  Auto
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tableau Excel interactif : Élèves figés à gauche | Disciplines au centre | Total et Moyenne à droite */}
      <div className="overflow-auto max-h-[64vh] bg-white custom-scrollbar">
        <table className="w-full border-separate border-spacing-0 text-xs">
          <thead>
            {/* Row 1 : Groupes */}
            <tr className="h-8 bg-[#1B365D] text-white font-bold text-[11px] tracking-wider uppercase">
              <th
                colSpan={3}
                className="sticky top-0 left-0 z-40 w-[300px] min-w-[300px] py-1.5 px-2 text-center bg-[#1B365D] border-b border-r border-slate-600 shadow-[2px_0_6px_-2px_rgba(15,23,42,0.35)]"
              >
                ÉLÈVES
              </th>
              <th
                colSpan={Math.max(1, matrix.subjects.length)}
                className="sticky top-0 z-20 py-1.5 px-2 text-center bg-[#1B365D] border-b border-r border-slate-600"
              >
                NOTES PAR DISCIPLINE ({matrix.subjects.length})
              </th>
              <th
                colSpan={2}
                className="sticky top-0 xl:right-0 z-30 xl:z-40 w-[164px] min-w-[164px] py-1.5 px-2 text-center bg-[#0B3B2E] border-b border-slate-600 xl:shadow-[-2px_0_6px_-2px_rgba(15,23,42,0.35)]"
              >
                TOTAUX &amp; MOYENNES
              </th>
            </tr>

            {/* Row 2 : En-têtes détaillés */}
            <tr className="bg-[#1B365D] text-white font-bold text-xs">
              <th className="sticky top-8 left-0 z-40 w-[44px] min-w-[44px] max-w-[44px] py-2 px-1.5 text-center bg-[#1B365D] border-b border-r border-slate-600">
                N°
              </th>
              <th className="sticky top-8 left-[44px] z-40 w-[210px] min-w-[210px] max-w-[210px] py-2 px-3 text-left bg-[#1B365D] border-b border-r border-slate-600">
                Nom et Prénom
              </th>
              <th className="sticky top-8 left-[254px] z-40 w-[46px] min-w-[46px] max-w-[46px] py-2 px-1 text-center bg-[#1B365D] border-b border-r border-slate-500 shadow-[2px_0_6px_-2px_rgba(15,23,42,0.35)]">
                Sexe
              </th>

              {matrix.subjects.map(sub => (
                <th
                  key={sub.id}
                  title={`${sub.name} — Barème /${sub.maxScore}`}
                  className="sticky top-8 z-20 w-[56px] min-w-[56px] max-w-[56px] bg-[#1B365D] border-b border-r border-slate-600 px-1 pt-2 pb-1.5 align-bottom"
                >
                  <div className="flex flex-col items-center justify-end gap-1.5 h-36">
                    <div
                      className="text-[11px] font-semibold leading-tight text-center text-white/95 overflow-hidden"
                      style={{
                        writingMode: 'vertical-rl',
                        transform: 'rotate(180deg)',
                        maxHeight: '112px',
                      }}
                    >
                      {sub.name}
                    </div>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold tracking-tight ${
                        sub.maxScore === 20
                          ? 'bg-sky-400/20 text-sky-200 ring-1 ring-sky-300/30'
                          : 'bg-white/10 text-slate-200'
                      }`}
                    >
                      /{sub.maxScore}
                    </span>
                  </div>
                </th>
              ))}

              <th className="sticky top-8 xl:right-[88px] z-20 xl:z-40 w-[76px] min-w-[76px] max-w-[76px] py-2 px-2 text-center bg-[#0B3B2E] border-b border-r border-emerald-700/70 xl:shadow-[-2px_0_6px_-2px_rgba(15,23,42,0.35)]">
                Total
              </th>
              <th className="sticky top-8 xl:right-0 z-20 xl:z-40 w-[88px] min-w-[88px] max-w-[88px] py-2 px-2 text-center bg-[#0B3B2E] border-b border-emerald-700/70">
                Moyenne
              </th>
            </tr>
          </thead>

          <tbody>
            {displayedRows.length === 0 ? (
              <tr>
                <td
                  colSpan={3 + matrix.subjects.length + 2}
                  className="py-12 px-6 text-center text-sm text-slate-500 border-b border-slate-200"
                >
                  {viewMode === 'merit_passing'
                    ? `Aucun élève n'a encore atteint la moyenne (≥ ${matrix.passThreshold} / ${scale}) pour ce mois.`
                    : 'Aucun élève ne correspond à votre recherche.'}
                </td>
              </tr>
            ) : (
              displayedRows.map((row, rowIdx) => {
                const isEven = rowIdx % 2 === 1
                const rowBg = isEven ? 'bg-slate-50' : 'bg-white'
                const isFailing = !row.isAbsent && !row.isPassing

                return (
                  <tr
                    key={row.student.id}
                    className={`${rowBg} hover:bg-sky-50/80 transition-colors group`}
                  >
                    {/* N° figé gauche */}
                    <td
                      className={`sticky left-0 z-10 w-[44px] min-w-[44px] py-1.5 px-1.5 text-center font-semibold text-slate-500 border-b border-r border-slate-200 tabular-nums ${rowBg} group-hover:bg-sky-50`}
                    >
                      {rowIdx + 1}
                    </td>

                    {/* Nom et Prénom figé gauche + lien discret vers fiche 9 mois */}
                    <td
                      className={`sticky left-[44px] z-10 w-[210px] min-w-[210px] max-w-[210px] py-1 px-2.5 border-b border-r border-slate-200 ${rowBg} group-hover:bg-sky-50`}
                    >
                      <div className="flex items-center justify-between gap-1.5">
                        <span
                          className="font-bold text-slate-900 truncate"
                          title={row.fullName}
                        >
                          {row.fullName}
                        </span>
                        <button
                          type="button"
                          onClick={() => onOpenStudentFiche(row.student.id)}
                          title={`Ouvrir la fiche 9 mois de ${row.fullName}`}
                          className="opacity-0 group-hover:opacity-100 focus:opacity-100 shrink-0 px-1.5 py-0.5 rounded bg-slate-200/80 hover:bg-[#1B365D] hover:text-white text-[10px] font-bold text-slate-700 transition-all cursor-pointer flex items-center gap-0.5"
                        >
                          <UserCheck className="w-3 h-3" />
                          <span>9m</span>
                        </button>
                      </div>
                    </td>

                    {/* Sexe figé gauche */}
                    <td
                      className={`sticky left-[254px] z-10 w-[46px] min-w-[46px] py-1.5 px-1 text-center font-bold border-b border-r border-slate-300 shadow-[2px_0_6px_-2px_rgba(15,23,42,0.12)] ${rowBg} group-hover:bg-sky-50 ${
                        row.gender === 'F'
                          ? 'text-rose-700'
                          : row.gender === 'M'
                            ? 'text-sky-700'
                            : 'text-slate-400'
                      }`}
                    >
                      {row.gender || '—'}
                    </td>

                    {/* Cellules de notes par discipline */}
                    {matrix.subjects.map((sub, colIdx) => {
                      const cellKey = `${row.student.id}_${sub.id}`
                      const rawVal = getRawValue(row.student.id, sub.id)
                      const isInvalid = row.invalidSubjects[sub.id]
                      const hasDraft = Object.prototype.hasOwnProperty.call(draftMap, cellKey)
                      const savedVal = savedScoreMap[cellKey]
                      const parsed = parseCellScoreInput(rawVal)
                      const isModified =
                        hasDraft &&
                        ((parsed === null && savedVal !== undefined) ||
                          (typeof parsed === 'number' &&
                            (savedVal === undefined || Math.abs(savedVal - parsed) > 0.0001)))

                      return (
                        <td
                          key={sub.id}
                          className="p-1 text-center border-b border-r border-slate-200 align-middle"
                        >
                          <input
                            id={`matrix-cell-${monthNumber}-${rowIdx}-${colIdx}`}
                            type="text"
                            inputMode="decimal"
                            value={rawVal}
                            onChange={e => onCellChange(row.student.id, sub.id, e.target.value)}
                            onKeyDown={e => handleCellKeyDown(e, rowIdx, colIdx)}
                            onFocus={e => e.currentTarget.select()}
                            placeholder="—"
                            title={
                              isInvalid
                                ? `Note invalide pour ${sub.name} (barème : 0 à ${sub.maxScore})`
                                : `${row.fullName} · ${sub.name} (/${sub.maxScore})`
                            }
                            aria-label={`${row.fullName} - ${sub.name} sur ${sub.maxScore}`}
                            className={`w-12 h-8 text-center text-[13px] font-bold rounded-md border outline-none transition-all tabular-nums ${
                              isInvalid
                                ? 'border-red-500 bg-red-50 text-red-700 ring-1 ring-red-400'
                                : isModified
                                  ? 'border-emerald-500 bg-emerald-50/70 text-emerald-950 focus:ring-2 focus:ring-emerald-300'
                                  : rawVal.trim() !== ''
                                    ? 'border-slate-300 bg-white text-slate-900 focus:border-[#065F46] focus:ring-2 focus:ring-emerald-200'
                                    : 'border-slate-200/80 bg-slate-50/60 text-slate-700 placeholder:text-slate-300 focus:bg-white focus:border-[#065F46] focus:ring-2 focus:ring-emerald-200'
                            }`}
                          />
                        </td>
                      )
                    })}

                    {/* Total (figé droite sur xl) */}
                    <td
                      className={`xl:sticky xl:right-[88px] xl:z-10 w-[76px] min-w-[76px] py-1.5 px-2 text-center font-extrabold text-slate-900 border-b border-r border-slate-200 xl:shadow-[-2px_0_6px_-2px_rgba(15,23,42,0.12)] tabular-nums ${rowBg} group-hover:bg-sky-50`}
                    >
                      {row.isAbsent ? '—' : fmtComma(row.totalPoints, 1)}
                    </td>

                    {/* Moyenne (figée droite sur xl, rouge si < seuil) */}
                    <td
                      className={`xl:sticky xl:right-0 xl:z-10 w-[88px] min-w-[88px] py-1.5 px-2 text-center font-extrabold border-b border-slate-200 tabular-nums ${rowBg} group-hover:bg-sky-50 ${
                        row.isAbsent
                          ? 'text-slate-400'
                          : isFailing
                            ? 'text-red-600'
                            : 'text-emerald-700'
                      }`}
                    >
                      {row.isAbsent ? '—' : fmtComma(row.average, 2)}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pied de grille : Information calcul + Raccourcis clavier + Enregistrer */}
      <div className="px-4 sm:px-5 py-3 bg-slate-50 border-t border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-[11px] italic text-slate-600">
            Calcul automatique en temps réel : Total des points et Moyenne / {scale} (en rouge si &lt; {matrix.passThreshold}/{scale}). Les rangs et appréciations sont générés automatiquement dans Bulletins &amp; Livrets.
          </p>
          <p className="text-[11px] text-slate-500 font-medium">
            Astuce clavier : <strong className="text-slate-700">Entrée / ↓</strong> élève suivant ·{' '}
            <strong className="text-slate-700">Tab / →</strong> discipline suivante ·{' '}
            <strong className="text-slate-700">Ctrl+S</strong> enregistrer · Survolez un élève (
            <strong className="text-slate-700">9m</strong>) pour ouvrir sa fiche 9 mois.
          </p>
        </div>

        <button
          type="button"
          onClick={triggerSave}
          disabled={isSaving || matrix.invalidCellCount > 0 || pendingDiff.totalChanges === 0}
          className={`shrink-0 px-5 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:cursor-not-allowed ${
            pendingDiff.totalChanges > 0 && matrix.invalidCellCount === 0
              ? 'bg-[#065F46] hover:bg-emerald-700 text-white'
              : 'bg-slate-200 text-slate-500'
          }`}
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>
            {isSaving
              ? 'Enregistrement en cours...'
              : pendingDiff.totalChanges > 0
                ? `Enregistrer les notes (${pendingDiff.totalChanges})`
                : 'Toutes les notes sont enregistrées'}
          </span>
        </button>
      </div>
    </div>
  )
}
