'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  X,
  ArrowLeft,
  CloudUpload,
  FileSpreadsheet,
  Trophy,
  Download,
  Printer,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowUpDown,
  Users,
  BarChart3,
  Database,
  RotateCcw,
  RefreshCw,
} from 'lucide-react'
import {
  AverageScale,
  ClassResultsReport,
  ExportClassItem,
  ExportCycle,
  ExportStudentItem,
  ExportSubjectItem,
  FilterMode,
  getPeriodLabel,
  PRIMARY_MONTH_NAMES,
  PrimaryPeriodKey,
  SortMode,
} from '@/lib/grades-export'
import {
  buildReportFromImportedData,
  matchStudentsToClass,
  ParsedExcelSheetResult,
  parseExcelWorkbookGrades,
  StudentMatchResult,
  SubjectMappingItem,
  suggestSubjectMappings,
} from '@/lib/grades-import'
import {
  exportBlankClassTemplateExcel,
  exportClassResultsToExcel,
} from '@/lib/excel-grades-export'
import { importClassGrades, ImportClassGradesPayload } from '@/app/actions/academique'
import {
  getPrimarySubjectMaxScore,
  getPrimarySubjectOrder,
} from '@/lib/academic-curriculum'

export type ImportGradesModalProps = {
  isOpen: boolean
  onClose: () => void
  classes: ExportClassItem[]
  selectedClassId: string
  students: ExportStudentItem[]
  subjects: ExportSubjectItem[]
  cycle: ExportCycle
  initialTerm?: string
  schoolName?: string
  academicYear?: string
  isTeacher?: boolean
  onImportSaved?: (result: {
    classId: string
    cycle: ExportCycle
    savedPrimaryGrades?: Array<{ student_id: string; subject_id: string; month_number: number; score: number }>
    savedSecondaryGrades?: Array<{ student_id: string; subject_id: string; term: string; class_score: number | null; comp_score: number | null }>
    createdStudents?: Array<{ id: string; last_name: string; first_name: string; matricule: string; class_id: string; gender: string | null }>
    createdSubjects?: Array<{ id: string; name: string; cycle: string; category: string | null; coefficient: number }>
  }) => void
}

function fmtComma(val: number | null | undefined, decimals: number): string {
  if (val === null || val === undefined || isNaN(val)) return ''
  return val.toFixed(decimals).replace('.', ',')
}

function escapeHtml(raw: string): string {
  return String(raw || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function buildPrintableImportedHtml(
  report: ClassResultsReport,
  mode: 'results' | 'merit_admis' | 'recap',
  includeMeritDisciplines: boolean = true
): string {
  if (mode === 'merit_admis') {
    const showDisciplines = includeMeritDisciplines && report.columns.length > 0
    const rotatedHeaders = showDisciplines
      ? report.columns
          .map(
            col =>
              `<th class="vth"><div class="vwrap">${escapeHtml(report.isPrimary ? col.name : `${col.name} (c.${col.coefficient})`)}</div></th>`
          )
          .join('')
      : ''

    const rowsHtml = report.meritPassingRows
      .map((stu, i) => {
        const discCells = showDisciplines
          ? report.columns
              .map(col => {
                const v = stu.scores[col.id]
                const txt =
                  v !== null && v !== undefined
                    ? Number.isInteger(v)
                      ? String(v)
                      : fmtComma(v, 2).replace(/,00$/, '').replace(/(,\d)0$/, '$1')
                    : ''
                return `<td class="c">${txt}</td>`
              })
              .join('')
          : ''
        return `
        <tr>
          <td class="c">${i + 1}</td>
          <td class="b">${escapeHtml(stu.fullName)}</td>
          <td class="c">${escapeHtml(stu.gender || '—')}</td>
          <td class="c b">${fmtComma(stu.totalPoints, 1)} pts</td>
          <td class="c b ok">${fmtComma(stu.average, 2)} / ${report.scale}</td>
          <td class="c b">${escapeHtml(stu.rankText)}</td>
          <td>${escapeHtml(stu.appreciation)}</td>
          ${discCells}
        </tr>`
      })
      .join('')

    const totalCols = 3 + 4 + (showDisciplines ? report.columns.length : 0)
    return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<title>Ordre de mérite (Admis) – ${escapeHtml(report.className)}</title>
<style>
  @page { size: ${showDisciplines ? 'A4 landscape' : 'A4 portrait'}; margin: ${showDisciplines ? '8mm' : '10mm'}; }
  body { font-family: Calibri, Arial, sans-serif; color: #0f172a; margin: 0; font-size: ${showDisciplines ? '9.5px' : '11px'}; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .banner { background: #1B365D; color: #fff; text-align: center; padding: 9px; font-weight: 700; font-size: 13px; }
  .meta { background: #F1F5F9; text-align: center; padding: 5px; font-weight: 700; font-size: 10.5px; border: 1px solid #94A3B8; border-top: none; margin-bottom: 10px; }
  table { width: 100%; border-collapse: collapse; ${showDisciplines ? 'table-layout: fixed;' : ''} }
  th, td { border: 1px solid #94A3B8; padding: ${showDisciplines ? '2px 3px' : '5px 7px'}; }
  th { background: #1B365D; color: #fff; font-weight: 700; text-align: center; }
  .vth { height: 95px; vertical-align: bottom; padding: 3px 1px; }
  .vwrap { writing-mode: vertical-rl; transform: rotate(180deg); margin: 0 auto; white-space: nowrap; max-height: 88px; overflow: hidden; text-overflow: ellipsis; font-size: 8.5px; }
  .c { text-align: center; }
  .b { font-weight: 700; }
  .ok { color: #047857; }
  tr:nth-child(even) { background: #F8FAFC; }
</style>
</head>
<body>
  <div class="banner">${escapeHtml(report.title)} – LISTE DE MÉRITE DES ADMIS</div>
  <div class="meta">${escapeHtml(report.schoolName)} | Classe : ${escapeHtml(report.className)} | ${escapeHtml(report.periodLabel)} | Admis (Moy. ≥ ${report.passThreshold}/${report.scale}) : ${report.meritPassingRows.length} / ${report.stats.present.total} présents</div>
  <table>
    <thead>
      <tr>
        <th colspan="3">ÉLÈVES</th>
        <th colspan="4">RÉSULTATS DES ADMIS</th>
        ${showDisciplines ? `<th colspan="${report.columns.length}">NOTES PAR DISCIPLINE</th>` : ''}
      </tr>
      <tr>
        <th class="c" style="width:26px;">N°</th>
        <th style="${showDisciplines ? 'width:155px;' : ''}">Nom et Prénom</th>
        <th class="c" style="width:32px;">Sexe</th>
        <th class="c" style="width:58px;">Points obtenus</th>
        <th class="c" style="width:68px;">Moyenne</th>
        <th class="c" style="width:48px;">Rang</th>
        <th style="${showDisciplines ? 'width:110px;' : ''}">Appréciation</th>
        ${rotatedHeaders}
      </tr>
    </thead>
    <tbody>
      ${rowsHtml || `<tr><td colspan="${totalCols}" class="c">Aucun élève admis pour cette période.</td></tr>`}
    </tbody>
  </table>
</body>
</html>`
  }

  if (mode === 'recap') {
    const { stats } = report
    const fmtAvg = (v: number | null) =>
      v !== null ? `${v.toFixed(2).replace('.', ',')} / ${report.scale}` : '—'
    return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<title>Récapitulation – ${escapeHtml(report.className)}</title>
<style>
  @page { size: A4 portrait; margin: 10mm; }
  body { font-family: Calibri, Arial, sans-serif; color: #0f172a; margin: 0; font-size: 11px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .banner { background: #1B365D; color: #fff; text-align: center; padding: 10px; font-weight: 700; font-size: 14px; }
  .meta { background: #F1F5F9; text-align: center; padding: 6px; font-weight: 600; font-size: 11px; border: 1px solid #94A3B8; border-top: none; margin-bottom: 12px; }
  h3 { background: #1B365D; color: #fff; margin: 12px 0 0; padding: 5px 8px; font-size: 11px; text-transform: uppercase; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
  th, td { border: 1px solid #94A3B8; padding: 4px 6px; text-align: left; }
  th { background: #F1F5F9; font-weight: 700; }
  .c { text-align: center; }
  .b { font-weight: 700; }
  .ok { color: #047857; }
  .fail { color: #DC2626; }
</style>
</head>
<body>
  <div class="banner">RÉCAPITULATION – ${escapeHtml(report.title)}</div>
  <div class="meta">${escapeHtml(report.schoolName)} | Classe : ${escapeHtml(report.className)} | ${escapeHtml(report.periodLabel)}</div>
  <h3>Synthèse générale</h3>
  <table>
    <thead><tr><th>Indicateur</th><th class="c">Garçons</th><th class="c">Filles</th><th class="c">Total</th><th class="c">Taux / Valeur</th></tr></thead>
    <tbody>
      <tr><td class="b">Inscrits</td><td class="c">${stats.enrolled.boys}</td><td class="c">${stats.enrolled.girls}</td><td class="c b">${stats.enrolled.total}</td><td class="c">100 %</td></tr>
      <tr><td class="b">Présents</td><td class="c">${stats.present.boys}</td><td class="c">${stats.present.girls}</td><td class="c b">${stats.present.total}</td><td class="c">${stats.enrolled.total > 0 ? ((stats.present.total / stats.enrolled.total) * 100).toFixed(1) : '—'} %</td></tr>
      <tr><td class="b ok">Admis (≥ ${report.passThreshold})</td><td class="c">${stats.passing.boys}</td><td class="c">${stats.passing.girls}</td><td class="c b ok">${stats.passing.total}</td><td class="c b ok">${stats.passRatePct !== null ? `${stats.passRatePct} %` : '—'}</td></tr>
      <tr><td class="b fail">Sous la moyenne (&lt; ${report.passThreshold})</td><td class="c">${stats.failing.boys}</td><td class="c">${stats.failing.girls}</td><td class="c b fail">${stats.failing.total}</td><td class="c">${stats.present.total > 0 ? ((stats.failing.total / stats.present.total) * 100).toFixed(1) : '—'} %</td></tr>
      <tr><td class="b">Moyenne générale</td><td class="c">—</td><td class="c">—</td><td class="c">—</td><td class="c b">${fmtAvg(stats.classAverage)}</td></tr>
    </tbody>
  </table>
</body>
</html>`
  }

  const colCount = 3 + Math.max(1, report.columns.length) + 4
  const rotatedHeaders =
    report.columns.length === 0
      ? '<th class="navy vth"><div class="vwrap">Aucune discipline</div></th>'
      : report.columns
          .map(
            col =>
              `<th class="navy vth"><div class="vwrap">${escapeHtml(report.isPrimary ? col.name : `${col.name} (c.${col.coefficient})`)}</div></th>`
          )
          .join('')

  const bodyRowsHtml = report.displayRows
    .map((stu, idx) => {
      const scoreCells = report.columns
        .map(col => {
          const v = stu.scores[col.id]
          const txt =
            v !== null && v !== undefined
              ? Number.isInteger(v)
                ? String(v)
                : fmtComma(v, 2).replace(/,00$/, '').replace(/(,\d)0$/, '$1')
              : ''
          return `<td class="c">${txt}</td>`
        })
        .join('')
      const avgFailClass = !stu.isAbsent && !stu.isPassing ? 'fail' : ''
      const apprClass = stu.isAbsent ? 'absent' : !stu.isPassing ? 'fail' : ''
      return `
      <tr class="${idx % 2 === 1 ? 'zebra' : ''}">
        <td class="c">${idx + 1}</td>
        <td class="b">${escapeHtml(stu.fullName)}</td>
        <td class="c">${escapeHtml(stu.gender)}</td>
        ${scoreCells}
        <td class="c b">${stu.isAbsent ? '' : fmtComma(stu.totalPoints, 1)}</td>
        <td class="c b ${avgFailClass}">${stu.isAbsent ? '' : fmtComma(stu.average, 2)}</td>
        <td class="c ${stu.rankNum === 1 ? 'b' : ''}">${stu.isAbsent ? '' : escapeHtml(stu.rankText)}</td>
        <td class="${apprClass}">${escapeHtml(stu.appreciation)}</td>
      </tr>`
    })
    .join('')

  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(report.title)} – ${escapeHtml(report.className)}</title>
<style>
  @page { size: A4 landscape; margin: 8mm; }
  body { font-family: Calibri, Arial, sans-serif; color: #0f172a; margin: 0; font-size: 9.5px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  th, td { border: 1px solid #94A3B8; padding: 2px 3px; }
  .navy { background: #1B365D; color: #fff; font-weight: 700; text-align: center; }
  .banner { font-size: 13px; padding: 6px; }
  .meta { background: #F1F5F9; text-align: center; font-weight: 700; padding: 4px; font-size: 10px; }
  .vth { height: 95px; vertical-align: bottom; padding: 3px 1px; }
  .vwrap { writing-mode: vertical-rl; transform: rotate(180deg); margin: 0 auto; white-space: nowrap; max-height: 88px; overflow: hidden; text-overflow: ellipsis; font-size: 8.5px; }
  .c { text-align: center; }
  .b { font-weight: 700; }
  .zebra { background: #F8FAFC; }
  .fail { color: #DC2626; }
  .absent { color: #64748B; font-style: italic; }
  .legend { margin-top: 6px; font-size: 8.5px; color: #475569; font-style: italic; }
</style>
</head>
<body>
  <table>
    <thead>
      <tr><th colspan="${colCount}" class="navy banner">${escapeHtml(report.title)}</th></tr>
      <tr><td colspan="${colCount}" class="meta">Classe : ${escapeHtml(report.className)} | Effectif : ${report.displayRows.length} / ${report.allRows.length} | ${escapeHtml(report.formulaLabel)}</td></tr>
      <tr>
        <th colspan="3" class="navy">ÉLÈVES</th>
        <th colspan="${Math.max(1, report.columns.length)}" class="navy">NOTES PAR DISCIPLINE</th>
        <th colspan="4" class="navy">RÉSULTATS</th>
      </tr>
      <tr>
        <th class="navy" style="width:24px;">N°</th>
        <th class="navy" style="width:165px;">Nom et Prénom</th>
        <th class="navy" style="width:28px;">Sexe</th>
        ${rotatedHeaders}
        <th class="navy" style="width:42px;">Total</th>
        <th class="navy" style="width:48px;">Moyenne</th>
        <th class="navy" style="width:40px;">Rang</th>
        <th class="navy" style="width:120px;">Appréciation</th>
      </tr>
    </thead>
    <tbody>${bodyRowsHtml}</tbody>
  </table>
  <div class="legend">${escapeHtml(report.legendText)}</div>
</body>
</html>`
}

export function ImportGradesModal({
  isOpen,
  onClose,
  classes,
  selectedClassId,
  students,
  subjects,
  cycle,
  initialTerm = '1er_trimestre',
  schoolName,
  academicYear,
  isTeacher = false,
  onImportSaved,
}: ImportGradesModalProps) {
  const isPrimary = cycle === 'primaire' || cycle === 'maternelle'
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [targetClassId, setTargetClassId] = useState<string>(selectedClassId || classes[0]?.id || '')
  const [primaryPeriod, setPrimaryPeriod] = useState<PrimaryPeriodKey>('month_1')
  const [secondaryTerm, setSecondaryTerm] = useState<string>(initialTerm)
  const [scale, setScale] = useState<AverageScale>(20)
  const [customDivisorInput, setCustomDivisorInput] = useState<string>('')
  const [customTitle, setCustomTitle] = useState<string>('')
  const [hasEditedTitle, setHasEditedTitle] = useState<boolean>(false)
  const [sortMode, setSortMode] = useState<SortMode>('alphabetical')
  const [filterMode, setFilterMode] = useState<FilterMode>('all')
  const [activeTab, setActiveTab] = useState<'results' | 'merit_admis' | 'recap' | 'mapping'>('results')
  const [meritWithDisciplines, setMeritWithDisciplines] = useState<boolean>(true)

  const [isDragging, setIsDragging] = useState<boolean>(false)
  const [rawBuffer, setRawBuffer] = useState<ArrayBuffer | null>(null)
  const [fileName, setFileName] = useState<string>('')
  const [parsed, setParsed] = useState<ParsedExcelSheetResult | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)

  // Mapping vers base de données Scogestia
  const [subjectMappings, setSubjectMappings] = useState<SubjectMappingItem[]>([])
  const [studentMatches, setStudentMatches] = useState<StudentMatchResult[]>([])
  const [createMissingSubjects, setCreateMissingSubjects] = useState<boolean>(true)
  const [createMissingStudents, setCreateMissingStudents] = useState<boolean>(!isTeacher)

  const [isExporting, setIsExporting] = useState<boolean>(false)
  const [isSavingDb, setIsSavingDb] = useState<boolean>(false)
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const targetClassObj = useMemo(
    () => classes.find(c => c.id === targetClassId) || classes[0] || { id: '', name: 'Classe', level: '' },
    [classes, targetClassId]
  )

  const classStudents = useMemo(
    () => students.filter(s => s.class_id === targetClassObj.id),
    [students, targetClassObj.id]
  )

  const cycleSubjects = useMemo(() => {
    const list = subjects.filter(s => {
      const cyc = (s.cycle || '').toLowerCase()
      if (isPrimary) return !cyc || cyc === 'primaire' || cyc === 'maternelle'
      return cyc === 'secondaire'
    })
    if (isPrimary) {
      return [...list].sort((a, b) => getPrimarySubjectOrder(a.name) - getPrimarySubjectOrder(b.name))
    }
    return [...list].sort((a, b) => a.name.localeCompare(b.name, 'fr'))
  }, [subjects, isPrimary])

  // Réinitialiser proprement à l'ouverture
  useEffect(() => {
    if (!isOpen) return
    setTargetClassId(selectedClassId || classes[0]?.id || '')
    setSecondaryTerm(initialTerm)
    setParseError(null)
    setSaveMessage(null)
  }, [isOpen, selectedClassId, classes, initialTerm])

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  // Recalculer automatiquement les correspondances élèves & matières si la classe cible change
  useEffect(() => {
    if (!parsed) return
    setSubjectMappings(suggestSubjectMappings(parsed.columns, subjects, targetClassObj, isPrimary))
    setStudentMatches(matchStudentsToClass(parsed.rows, classStudents))
  }, [parsed, targetClassObj, classStudents, subjects, isPrimary])

  const handleResetToUpload = () => {
    setParsed(null)
    setRawBuffer(null)
    setFileName('')
    setParseError(null)
    setSaveMessage(null)
    setCustomDivisorInput('')
    setCustomTitle('')
    setHasEditedTitle(false)
    setSubjectMappings([])
    setStudentMatches([])
    setActiveTab('results')
    setSortMode('alphabetical')
    setFilterMode('all')
    setMeritWithDisciplines(true)
  }

  const handleBack = () => {
    if (parsed) {
      handleResetToUpload()
    } else {
      onClose()
    }
  }

  const loadFileBuffer = (buffer: ArrayBuffer, name: string, sheetOverride?: string) => {
    setParseError(null)
    setSaveMessage(null)
    try {
      const res = parseExcelWorkbookGrades(buffer, {
        sheetName: sheetOverride,
        fileName: name,
        className: targetClassObj.name,
        classLevel: targetClassObj.level || undefined,
      })
      setRawBuffer(buffer)
      setFileName(name)
      setParsed(res)
      if (res.detectedPrimaryPeriod && isPrimary) {
        setPrimaryPeriod(res.detectedPrimaryPeriod)
      }
      if (res.detectedSecondaryTerm && !isPrimary) {
        setSecondaryTerm(res.detectedSecondaryTerm)
      }
      if (res.detectedTitle && !hasEditedTitle) {
        setCustomTitle(res.detectedTitle)
      }
      setCustomDivisorInput('')
      setSortMode('alphabetical')
      setFilterMode('all')
      setActiveTab('results')
      setMeritWithDisciplines(true)
    } catch (err: any) {
      setParseError(err?.message || "Impossible de lire ce fichier Excel.")
    }
  }

  const handleFileSelected = async (f: File) => {
    const ext = f.name.split('.').pop()?.toLowerCase()
    if (!ext || !['xlsx', 'xls', 'csv', 'ods'].includes(ext)) {
      setParseError('Format non supporté. Choisissez un fichier Excel (.xlsx, .xls, .ods) ou CSV.')
      return
    }
    const buf = await f.arrayBuffer()
    loadFileBuffer(buf, f.name)
  }

  const handleDownloadTemplate = async () => {
    const orderedStudents = [...classStudents].sort((a, b) =>
      (a.last_name || '').localeCompare(b.last_name || '', 'fr')
    )
    const subjectNames = cycleSubjects.map(s => s.name)
    const barèmeTotal = isPrimary
      ? cycleSubjects.reduce(
          (acc, s) =>
            acc + getPrimarySubjectMaxScore(s.name, targetClassObj.name, targetClassObj.level || undefined),
          0
        )
      : cycleSubjects.reduce((acc, s) => acc + (s.coefficient || 2), 0)
    const autoDiv = isPrimary ? (barèmeTotal > 0 ? barèmeTotal / 20 : 1) : barèmeTotal || 1
    const periodLabel = getPeriodLabel(isPrimary, primaryPeriod, secondaryTerm)
    await exportBlankClassTemplateExcel({
      className: targetClassObj.name,
      periodLabel,
      formulaLabel: isPrimary
        ? `Moyenne = Total ÷ ${Math.round(autoDiv * 100) / 100}`
        : `Moyenne = Σ(Moy × Coef) ÷ ${autoDiv}`,
      title: isPrimary
        ? `COMPOSITION MENSUELLE – ${periodLabel.toUpperCase()}`
        : `RÉSULTATS – ${periodLabel.toUpperCase()}`,
      students: orderedStudents.map(s => ({
        lastName: s.last_name,
        firstName: s.first_name,
        gender: s.gender,
      })),
      subjectNames,
    })
  }

  const parsedCustomDivisor = useMemo(() => {
    const val = parseFloat(customDivisorInput.replace(',', '.'))
    return !isNaN(val) && val > 0 ? val : null
  }, [customDivisorInput])

  const columnOverrides = useMemo(() => {
    const ov: Record<number, { maxScore?: number; coefficient?: number }> = {}
    for (const m of subjectMappings) {
      ov[m.colIndex] = { maxScore: m.maxScore, coefficient: m.coefficient }
    }
    return ov
  }, [subjectMappings])

  const report = useMemo(() => {
    if (!parsed) return null
    return buildReportFromImportedData({
      parsed,
      classItem: targetClassObj,
      cycle,
      primaryPeriod,
      secondaryTerm,
      scale,
      customDivisor: parsedCustomDivisor,
      sortMode,
      filterMode,
      customTitle: customTitle.trim() || undefined,
      schoolName,
      academicYear,
      columnConfigOverrides: columnOverrides,
    })
  }, [
    parsed,
    targetClassObj,
    cycle,
    primaryPeriod,
    secondaryTerm,
    scale,
    parsedCustomDivisor,
    sortMode,
    filterMode,
    customTitle,
    schoolName,
    academicYear,
    columnOverrides,
  ])

  if (!isOpen) return null

  const matchedStudentsCount = studentMatches.filter(m => m.matchedStudentId !== null).length
  const unmatchedStudentsCount = studentMatches.length - matchedStudentsCount
  const matchedSubjectsCount = subjectMappings.filter(m => m.matchedSubjectId !== null).length
  const unmatchedSubjectsCount = subjectMappings.length - matchedSubjectsCount

  const handleDownloadResults = async (mode: 'complete' | 'merit_only') => {
    if (!report) return
    setIsExporting(true)
    setSaveMessage(null)
    try {
      await exportClassResultsToExcel(report, { mode })
    } catch (err: any) {
      setSaveMessage({
        type: 'error',
        text: err?.message || 'Erreur lors de la génération du fichier Excel.',
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handlePrint = () => {
    if (!report) return
    const printMode =
      activeTab === 'merit_admis'
        ? 'merit_admis'
        : activeTab === 'recap'
          ? 'recap'
          : 'results'
    const html = buildPrintableImportedHtml(report, printMode, meritWithDisciplines)
    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'
    iframe.style.right = '0'
    iframe.style.bottom = '0'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = '0'
    document.body.appendChild(iframe)
    const doc = iframe.contentWindow?.document
    if (doc) {
      doc.open()
      doc.write(html)
      doc.close()
      setTimeout(() => {
        iframe.contentWindow?.focus()
        iframe.contentWindow?.print()
        setTimeout(() => {
          if (iframe.parentNode) iframe.parentNode.removeChild(iframe)
        }, 1500)
      }, 250)
    }
  }

  const handleSaveToDatabase = async () => {
    if (!parsed) return
    if (!targetClassObj.id) {
      setSaveMessage({
        type: 'error',
        text: 'Aucune classe cible trouvée dans cet établissement. Créez d’abord une classe pour enregistrer les notes dans Scogestia (vous pouvez néanmoins télécharger les résultats calculés).',
      })
      return
    }
    setIsSavingDb(true)
    setSaveMessage(null)

    try {
      const monthNumber = primaryPeriod.startsWith('month_')
        ? parseInt(primaryPeriod.replace('month_', ''), 10)
        : primaryPeriod === 'trim_1'
          ? 3
          : primaryPeriod === 'trim_2'
            ? 6
            : 9

      const payload: ImportClassGradesPayload = {
        classId: targetClassObj.id,
        cycle,
        monthNumber: isPrimary ? monthNumber : undefined,
        term: !isPrimary ? secondaryTerm : undefined,
        createMissingSubjects,
        createMissingStudents,
        columns: subjectMappings.map(m => ({
          colKey: m.colKey,
          name: m.excelName,
          maxScore: m.maxScore,
          coefficient: m.coefficient,
          subjectId: m.matchedSubjectId,
        })),
        rows: parsed.rows.map((row, idx) => ({
          matchedStudentId: studentMatches[idx]?.matchedStudentId || null,
          lastName: row.lastName,
          firstName: row.firstName,
          gender: row.gender || null,
          matricule: row.matricule || null,
          scores: row.scores,
        })),
      }

      const res = await importClassGrades(payload)
      if (res.error) {
        setSaveMessage({ type: 'error', text: res.error })
      } else {
        const parts = [`${res.savedGradesCount || 0} note(s) enregistrée(s) dans Scogestia`]
        if (res.createdStudentsCount && res.createdStudentsCount > 0) {
          parts.push(`${res.createdStudentsCount} élève(s) ajouté(s) à la classe`)
        }
        if (res.createdSubjectsCount && res.createdSubjectsCount > 0) {
          parts.push(`${res.createdSubjectsCount} rubrique(s) créée(s)`)
        }
        setSaveMessage({ type: 'success', text: `${parts.join(' · ')}.` })
        if (onImportSaved) {
          onImportSaved({
            classId: targetClassObj.id,
            cycle,
            savedPrimaryGrades: res.savedPrimaryGrades,
            savedSecondaryGrades: res.savedSecondaryGrades,
            createdStudents: res.createdStudents,
            createdSubjects: res.createdSubjects,
          })
        }
      }
    } catch (err: any) {
      setSaveMessage({
        type: 'error',
        text: err?.message || "Erreur lors de l'enregistrement dans Scogestia.",
      })
    } finally {
      setIsSavingDb(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 backdrop-blur-xs p-2 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Importer un fichier Excel de notes"
      onClick={onClose}
    >
      <div
        className="flex flex-col w-full max-w-[96vw] xl:max-w-[1460px] max-h-[94vh] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 px-4 sm:px-6 py-3.5 bg-gradient-to-r from-[#0F172A] via-[#132A3E] to-[#064E3B] border-b border-white/10 text-white shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={handleBack}
              title={
                parsed
                  ? 'Retour en arrière (choisir un autre fichier ou changer de classe)'
                  : 'Retour à la saisie des notes'
              }
              aria-label={parsed ? 'Retour en arrière' : 'Fermer'}
              className="group h-10 px-3 rounded-xl bg-white/12 hover:bg-white/22 ring-1 ring-white/25 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-emerald-300 group-hover:-translate-x-0.5 transition-transform" />
              {parsed && <span className="text-xs font-bold text-white">Retour</span>}
            </button>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-white truncate">
                  Importer les Notes d&apos;une Classe (Excel)
                </h2>
                {report && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-400/20 text-emerald-200 ring-1 ring-emerald-300/30 whitespace-nowrap">
                    {report.columns.length} discipline(s) · {report.allRows.length} élève(s)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 mt-0.5 truncate">
                {report
                  ? `Fichier actif : ${fileName} — Totaux, moyennes, rangs (ex-æquo) et appréciations calculés automatiquement.`
                  : 'Importez votre tableau rempli par disciplines : Scogestia calcule automatiquement totaux, moyennes, rangs, appréciations et liste de mérite.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0">
            {report && (
              <>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-3 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimer</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadResults('merit_only')}
                  disabled={isExporting || report.meritPassingRows.length === 0}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-sm flex items-center gap-1.5 whitespace-nowrap cursor-pointer disabled:opacity-50 transition-colors"
                >
                  <Trophy className="w-3.5 h-3.5" />
                  <span>Admis (.xlsx)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadResults('complete')}
                  disabled={isExporting}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-400 hover:bg-emerald-300 text-slate-950 shadow-sm flex items-center gap-1.5 whitespace-nowrap cursor-pointer disabled:opacity-60 transition-colors"
                >
                  {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                  <span>Complet (.xlsx)</span>
                </button>
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer"
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv,.ods"
          className="hidden"
          onChange={e => {
            if (e.target.files && e.target.files[0]) {
              handleFileSelected(e.target.files[0])
              e.target.value = ''
            }
          }}
        />

        {/* Body */}
        {!parsed || !report ? (
          <div className="p-5 sm:p-8 overflow-y-auto space-y-5">
            {/* Sélection Classe & Période */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Classe cible
                </label>
                <select
                  value={targetClassObj.id}
                  onChange={e => setTargetClassId(e.target.value)}
                  className="h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm font-semibold text-slate-800 outline-none focus:border-[#1B365D]"
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Période des notes
                </label>
                {isPrimary ? (
                  <select
                    value={primaryPeriod}
                    onChange={e => setPrimaryPeriod(e.target.value as PrimaryPeriodKey)}
                    className="h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm font-semibold text-slate-800 outline-none focus:border-[#1B365D]"
                  >
                    {Object.entries(PRIMARY_MONTH_NAMES).map(([mNum, lbl]) => (
                      <option key={mNum} value={`month_${mNum}`}>
                        {lbl}
                      </option>
                    ))}
                  </select>
                ) : (
                  <select
                    value={secondaryTerm}
                    onChange={e => setSecondaryTerm(e.target.value)}
                    className="h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm font-semibold text-slate-800 outline-none focus:border-[#1B365D]"
                  >
                    <option value="1er_trimestre">1er Trimestre</option>
                    <option value="2e_trimestre">2e Trimestre</option>
                    <option value="3e_trimestre">3e Trimestre</option>
                    <option value="1er_semestre">1er Semestre</option>
                    <option value="2e_semestre">2e Semestre</option>
                  </select>
                )}
              </div>
            </div>

            {parseError && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{parseError}</span>
              </div>
            )}

            {/* Drag & Drop zone */}
            <div
              onDragOver={e => {
                e.preventDefault()
                setIsDragging(true)
              }}
              onDragLeave={e => {
                e.preventDefault()
                setIsDragging(false)
              }}
              onDrop={e => {
                e.preventDefault()
                setIsDragging(false)
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleFileSelected(e.dataTransfer.files[0])
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                isDragging
                  ? 'border-emerald-500 bg-emerald-50/70'
                  : 'border-slate-300 bg-slate-50/70 hover:border-[#1B365D] hover:bg-sky-50/40'
              }`}
            >
              <div className="w-14 h-14 rounded-2xl bg-[#1B365D]/10 text-[#1B365D] flex items-center justify-center">
                <CloudUpload className="w-7 h-7" />
              </div>
              <div>
                <p className="text-base font-extrabold text-slate-800">
                  Déposez votre fichier Excel ici ou cliquez pour parcourir
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Formats acceptés : <strong>.xlsx, .xls, .ods, .csv</strong> — Tableau avec « N° | Nom et Prénom | Sexe | Rubriques/Disciplines »
                </p>
              </div>
              <span className="px-4 py-2 rounded-xl bg-[#1B365D] text-white text-xs font-bold shadow-xs">
                Choisir un fichier Excel
              </span>
            </div>

            {/* Guide & Modèle téléchargeable */}
            <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="text-xs text-blue-950 space-y-1">
                <p className="font-bold">Comment ça fonctionne ?</p>
                <p className="text-blue-800">
                  1. Importez un fichier contenant les notes des élèves par discipline (les colonnes Total, Moyenne, Rang et Appréciation peuvent être vides ou absentes).
                </p>
                <p className="text-blue-800">
                  2. Scogestia calcule tout automatiquement, affiche l&apos;aperçu, filtre les <strong>Admis par ordre de mérite (du 1er au dernier)</strong> et vous permet de télécharger le Excel final ou d&apos;enregistrer les notes dans l&apos;école.
                </p>
              </div>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="shrink-0 px-4 py-2.5 rounded-xl bg-white hover:bg-blue-100 text-[#1B365D] border border-blue-300 text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Modèle Excel ({targetClassObj.name})</span>
              </button>
            </div>
          </div>
        ) : (
          /* Vue résultats calculés + Onglet Admis par mérite + Correspondance & Sauvegarde Scogestia */
          <>
            {/* Barre de paramètres & contrôles */}
            <div className="px-4 sm:px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-end gap-3 shrink-0">
              {/* Fichier + Feuille */}
              <div className="flex flex-col gap-1 min-w-[190px]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Fichier importé
                </span>
                <div className="flex items-center gap-1.5">
                  <span
                    className="text-xs font-bold text-[#1B365D] truncate max-w-[160px]"
                    title={fileName}
                  >
                    {fileName}
                  </span>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2 py-1 rounded-md border border-slate-300 bg-white hover:bg-slate-100 text-[11px] font-semibold text-slate-700 flex items-center gap-1 cursor-pointer"
                    title="Importer un autre fichier Excel"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Changer
                  </button>
                </div>
              </div>

              {parsed.allSheetNames.length > 1 && rawBuffer && (
                <div className="flex flex-col gap-1 min-w-[130px]">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Onglet Excel
                  </label>
                  <select
                    value={parsed.sheetName}
                    onChange={e => loadFileBuffer(rawBuffer, fileName, e.target.value)}
                    className="h-9 px-2 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-800"
                  >
                    {parsed.allSheetNames.map(s => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Classe cible */}
              <div className="flex flex-col gap-1 min-w-[120px]">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Classe
                </label>
                <select
                  value={targetClassObj.id}
                  onChange={e => setTargetClassId(e.target.value)}
                  className="h-9 px-2 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-800"
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Période */}
              <div className="flex flex-col gap-1 min-w-[140px]">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Période
                </label>
                {isPrimary ? (
                  <select
                    value={primaryPeriod}
                    onChange={e => setPrimaryPeriod(e.target.value as PrimaryPeriodKey)}
                    className="h-9 px-2 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-800"
                  >
                    {Object.entries(PRIMARY_MONTH_NAMES).map(([mNum, lbl]) => (
                      <option key={mNum} value={`month_${mNum}`}>
                        {lbl}
                      </option>
                    ))}
                  </select>
                ) : (
                  <select
                    value={secondaryTerm}
                    onChange={e => setSecondaryTerm(e.target.value)}
                    className="h-9 px-2 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-800"
                  >
                    <option value="1er_trimestre">1er Trimestre</option>
                    <option value="2e_trimestre">2e Trimestre</option>
                    <option value="3e_trimestre">3e Trimestre</option>
                    <option value="1er_semestre">1er Semestre</option>
                    <option value="2e_semestre">2e Semestre</option>
                  </select>
                )}
              </div>

              {/* Échelle & Diviseur (Primaire) */}
              {isPrimary && (
                <div className="flex items-end gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Échelle
                    </label>
                    <div className="inline-flex rounded-lg border border-slate-300 bg-white p-0.5 h-9">
                      <button
                        type="button"
                        onClick={() => setScale(20)}
                        className={`px-2 rounded text-xs font-bold cursor-pointer ${
                          scale === 20 ? 'bg-[#1B365D] text-white' : 'text-slate-600'
                        }`}
                      >
                        / 20
                      </button>
                      <button
                        type="button"
                        onClick={() => setScale(10)}
                        className={`px-2 rounded text-xs font-bold cursor-pointer ${
                          scale === 10 ? 'bg-[#1B365D] text-white' : 'text-slate-600'
                        }`}
                      >
                        / 10
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 w-24">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Diviseur
                      </label>
                      {customDivisorInput !== '' && (
                        <button
                          type="button"
                          onClick={() => setCustomDivisorInput('')}
                          className="text-[10px] text-[#1B365D] font-bold hover:underline cursor-pointer"
                        >
                          Auto
                        </button>
                      )}
                    </div>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      value={customDivisorInput}
                      onChange={e => setCustomDivisorInput(e.target.value)}
                      placeholder={`${report.divisor}`}
                      className="h-9 px-2 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-800"
                    />
                  </div>
                </div>
              )}

              {/* Titre éditable */}
              <div className="flex flex-col gap-1 flex-1 min-w-[190px]">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Titre du tableau
                  </label>
                  {hasEditedTitle && (
                    <button
                      type="button"
                      onClick={() => {
                        setHasEditedTitle(false)
                        setCustomTitle(parsed.detectedTitle || '')
                      }}
                      className="text-[10px] text-[#1B365D] hover:underline font-bold flex items-center gap-0.5 cursor-pointer"
                    >
                      <RotateCcw className="w-2.5 h-2.5" />
                      Auto
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={customTitle}
                  onChange={e => {
                    setCustomTitle(e.target.value)
                    setHasEditedTitle(true)
                  }}
                  placeholder={report.title}
                  className="h-9 px-2.5 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-800"
                />
              </div>
            </div>

            {/* Barre Classement rapide 1-clic & Tabs */}
            <div className="px-4 sm:px-6 bg-slate-100 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 pt-2 shrink-0">
              <div className="flex flex-wrap items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setSortMode('alphabetical')
                    setFilterMode('all')
                    setActiveTab('results')
                  }}
                  className={`px-3 py-2 text-xs font-bold rounded-t-lg border-t border-x flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'results' && filterMode === 'all' && sortMode === 'alphabetical'
                      ? 'bg-white text-[#1B365D] border-slate-300 -mb-px pb-2.5'
                      : 'bg-slate-200/70 text-slate-600 border-transparent hover:bg-white/70'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Résultats complets ({report.allRows.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSortMode('merit')
                    setFilterMode('all')
                    setActiveTab('results')
                  }}
                  className={`px-3 py-2 text-xs font-bold rounded-t-lg border-t border-x flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'results' && filterMode === 'all' && sortMode === 'merit'
                      ? 'bg-white text-[#1B365D] border-slate-300 -mb-px pb-2.5'
                      : 'bg-slate-200/70 text-slate-600 border-transparent hover:bg-white/70'
                  }`}
                >
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  <span>Ordre de mérite (Tous)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSortMode('merit')
                    setFilterMode('passing_only')
                    setActiveTab('merit_admis')
                  }}
                  className={`px-3.5 py-2 text-xs font-extrabold rounded-t-lg border-t border-x flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'merit_admis'
                      ? 'bg-emerald-600 text-white border-emerald-700 -mb-px pb-2.5'
                      : 'bg-emerald-100/80 text-emerald-900 border-emerald-200 hover:bg-emerald-200/80'
                  }`}
                >
                  <Trophy className="w-3.5 h-3.5" />
                  <span>
                    Admis par ordre de mérite ({report.meritPassingRows.length} /{' '}
                    {report.stats.present.total})
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('recap')}
                  className={`px-3 py-2 text-xs font-bold rounded-t-lg border-t border-x flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'recap'
                      ? 'bg-white text-[#1B365D] border-slate-300 -mb-px pb-2.5'
                      : 'bg-slate-200/70 text-slate-600 border-transparent hover:bg-white/70'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Récapitulation</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('mapping')}
                  className={`px-3 py-2 text-xs font-bold rounded-t-lg border-t border-x flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'mapping'
                      ? 'bg-white text-[#1B365D] border-slate-300 -mb-px pb-2.5'
                      : 'bg-slate-200/70 text-slate-700 border-transparent hover:bg-white/70'
                  }`}
                >
                  <Database className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Enregistrer dans Scogestia</span>
                </button>
              </div>

              <div className="pb-1.5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveToDatabase}
                  disabled={isSavingDb}
                  className="px-3.5 py-1.5 rounded-lg bg-[#1B365D] hover:opacity-95 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-60"
                >
                  {isSavingDb ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Database className="w-3.5 h-3.5 text-emerald-300" />
                  )}
                  <span>
                    {isSavingDb
                      ? 'Enregistrement...'
                      : `Enregistrer notes (${matchedStudentsCount}${
                          createMissingStudents && unmatchedStudentsCount > 0
                            ? `+${unmatchedStudentsCount}`
                            : ''
                        } élèves)`}
                  </span>
                </button>
              </div>
            </div>

            {saveMessage && (
              <div
                className={`px-6 py-2.5 border-b text-xs font-semibold flex items-center gap-2 shrink-0 ${
                  saveMessage.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-red-50 border-red-200 text-red-700'
                }`}
              >
                {saveMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{saveMessage.text}</span>
              </div>
            )}

            {/* Contenu scrollable */}
            <div className="flex-1 overflow-auto bg-slate-200/60 p-3 sm:p-5 custom-scrollbar">
              {activeTab === 'results' && (
                <div className="bg-white rounded-xl border border-slate-300 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-xs">
                      <thead>
                        <tr>
                          <th
                            colSpan={3 + Math.max(1, report.columns.length) + 4}
                            className="bg-[#1B365D] text-white text-center font-extrabold text-sm sm:text-base py-2.5 px-4 border border-slate-700"
                          >
                            {report.title}
                          </th>
                        </tr>
                        <tr>
                          <td
                            colSpan={3 + Math.max(1, report.columns.length) + 4}
                            className="bg-slate-100 text-slate-900 text-center font-bold text-xs py-1.5 px-4 border border-slate-300"
                          >
                            Classe : {report.className} &nbsp;&nbsp;|&nbsp;&nbsp; Effectif :{' '}
                            {report.displayRows.length} élèves &nbsp;&nbsp;|&nbsp;&nbsp;{' '}
                            {report.formulaLabel} &nbsp;&nbsp;|&nbsp;&nbsp; Admis :{' '}
                            {report.stats.passing.total} / {report.stats.present.total} présents (
                            {report.stats.passRatePct ?? '—'} %)
                          </td>
                        </tr>
                        <tr className="bg-[#1B365D] text-white font-bold text-[11px] uppercase">
                          <th colSpan={3} className="py-1.5 px-2 text-center border border-slate-600">
                            ÉLÈVES
                          </th>
                          <th
                            colSpan={Math.max(1, report.columns.length)}
                            className="py-1.5 px-2 text-center border border-slate-600"
                          >
                            NOTES PAR DISCIPLINE
                          </th>
                          <th colSpan={4} className="py-1.5 px-2 text-center border border-slate-600">
                            RÉSULTATS
                          </th>
                        </tr>
                        <tr className="bg-[#1B365D] text-white font-bold text-xs">
                          <th className="py-2 px-2 text-center border border-slate-600 w-10">N°</th>
                          <th className="py-2 px-3 text-left border border-slate-600 min-w-[200px]">
                            Nom et Prénom
                          </th>
                          <th className="py-2 px-2 text-center border border-slate-600 w-12">Sexe</th>
                          {report.columns.map(col => (
                            <th
                              key={col.id}
                              className="border border-slate-600 px-1 py-2 w-10 min-w-[38px] h-32 align-bottom"
                            >
                              <div
                                className="mx-auto text-[11px] font-semibold leading-tight text-center"
                                style={{
                                  writingMode: 'vertical-rl',
                                  transform: 'rotate(180deg)',
                                  maxHeight: '116px',
                                }}
                              >
                                {report.isPrimary
                                  ? col.name
                                  : `${col.name} (c.${col.coefficient})`}
                              </div>
                            </th>
                          ))}
                          <th className="py-2 px-2 text-center border border-slate-600 w-16">Total</th>
                          <th className="py-2 px-2 text-center border border-slate-600 w-20">
                            Moyenne
                          </th>
                          <th className="py-2 px-2 text-center border border-slate-600 w-16">Rang</th>
                          <th className="py-2 px-3 text-center border border-slate-600 min-w-[175px]">
                            Appréciation
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.displayRows.map((stu, idx) => {
                          const isFailing = !stu.isAbsent && !stu.isPassing
                          return (
                            <tr
                              key={stu.studentId}
                              className={idx % 2 === 1 ? 'bg-slate-50/90' : 'bg-white'}
                            >
                              <td className="py-1.5 px-2 text-center border border-slate-300 text-slate-600">
                                {idx + 1}
                              </td>
                              <td className="py-1.5 px-3 text-left border border-slate-300 font-bold text-slate-900 whitespace-nowrap">
                                {stu.fullName}
                              </td>
                              <td className="py-1.5 px-2 text-center border border-slate-300 font-semibold">
                                {stu.gender || ''}
                              </td>
                              {report.columns.map(col => {
                                const val = stu.scores[col.id]
                                return (
                                  <td
                                    key={col.id}
                                    className="py-1.5 px-1.5 text-center border border-slate-300 tabular-nums"
                                  >
                                    {val !== null && val !== undefined
                                      ? Number.isInteger(val)
                                        ? val
                                        : fmtComma(val, 2)
                                            .replace(/,00$/, '')
                                            .replace(/(,\d)0$/, '$1')
                                      : ''}
                                  </td>
                                )
                              })}
                              <td className="py-1.5 px-2 text-center border border-slate-300 font-bold tabular-nums">
                                {stu.isAbsent ? '' : fmtComma(stu.totalPoints, 1)}
                              </td>
                              <td
                                className={`py-1.5 px-2 text-center border border-slate-300 font-extrabold tabular-nums ${
                                  isFailing ? 'text-red-600' : 'text-slate-900'
                                }`}
                              >
                                {stu.isAbsent ? '' : fmtComma(stu.average, 2)}
                              </td>
                              <td
                                className={`py-1.5 px-2 text-center border border-slate-300 whitespace-nowrap ${
                                  stu.rankNum === 1 ? 'font-extrabold text-[#1B365D]' : ''
                                }`}
                              >
                                {stu.isAbsent ? '' : stu.rankText}
                              </td>
                              <td
                                className={`py-1.5 px-3 text-left border border-slate-300 whitespace-nowrap ${
                                  stu.isAbsent
                                    ? 'italic text-slate-500'
                                    : isFailing
                                      ? 'text-red-600 font-medium'
                                      : 'text-slate-900 font-medium'
                                }`}
                              >
                                {stu.appreciation}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="px-4 py-2 bg-slate-50 border-t border-slate-300 text-[11px] italic text-slate-600">
                    {report.legendText}
                  </div>
                </div>
              )}

              {activeTab === 'merit_admis' && (
                <div className="max-w-full mx-auto bg-white rounded-xl border border-emerald-200 shadow-sm overflow-hidden">
                  <div className="bg-gradient-to-r from-[#0F172A] via-[#0B3B2E] to-[#065F46] text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 font-extrabold text-sm">
                        <Trophy className="w-4 h-4 text-amber-300" />
                        <span>
                          Liste de Mérite — Élèves admis (du 1er au dernier)
                        </span>
                      </div>
                      <p className="text-xs text-emerald-100/90 mt-0.5">
                        Seuil : Moyenne ≥ {report.passThreshold} / {report.scale} ·{' '}
                        <strong>{report.meritPassingRows.length} admis</strong> sur{' '}
                        {report.stats.present.total} présents (
                        {report.stats.passRatePct ?? 0} %)
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="inline-flex rounded-lg bg-white/10 p-0.5 border border-white/15">
                        <button
                          type="button"
                          onClick={() => setMeritWithDisciplines(true)}
                          className={`px-2.5 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                            meritWithDisciplines
                              ? 'bg-white text-slate-900 shadow-xs'
                              : 'text-emerald-100 hover:text-white'
                          }`}
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5" />
                          <span>Avec disciplines</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setMeritWithDisciplines(false)}
                          className={`px-2.5 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                            !meritWithDisciplines
                              ? 'bg-white text-slate-900 shadow-xs'
                              : 'text-emerald-100 hover:text-white'
                          }`}
                        >
                          Points, Moy., Rang &amp; Appréc.
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDownloadResults('merit_only')}
                        disabled={isExporting || report.meritPassingRows.length === 0}
                        className="px-3.5 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Télécharger Admis (.xlsx)</span>
                      </button>
                      <button
                        type="button"
                        onClick={handlePrint}
                        className="px-3 py-2 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Imprimer</span>
                      </button>
                    </div>
                  </div>

                  {report.meritPassingRows.length === 0 ? (
                    <div className="p-12 text-center text-sm text-slate-500">
                      Aucun élève n&apos;a atteint la moyenne (≥ {report.passThreshold} /{' '}
                      {report.scale}) dans ce fichier. Vérifiez le diviseur ({report.divisor}) ou
                      l&apos;échelle (/20 vs /10).
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs border-collapse">
                          <thead>
                            <tr className="bg-[#0B3B2E] text-white font-bold text-[10.5px] uppercase tracking-wider">
                              <th colSpan={3} className="py-1.5 px-2 text-center border-b border-r border-emerald-800/70">
                                ÉLÈVES
                              </th>
                              <th colSpan={4} className="py-1.5 px-2 text-center border-b border-r border-emerald-800/70 bg-emerald-800">
                                RÉSULTATS DES ADMIS
                              </th>
                              {meritWithDisciplines && report.columns.length > 0 && (
                                <th
                                  colSpan={report.columns.length}
                                  className="py-1.5 px-2 text-center border-b border-emerald-800/70 bg-[#1B365D]"
                                >
                                  NOTES PAR DISCIPLINE
                                </th>
                              )}
                            </tr>
                            <tr className="bg-emerald-50 text-emerald-950 font-bold uppercase">
                              <th className="py-2.5 px-2.5 text-center border-b border-emerald-200 w-10">
                                N°
                              </th>
                              <th className="py-2.5 px-3 text-left border-b border-emerald-200 whitespace-nowrap">
                                Nom et Prénom
                              </th>
                              <th className="py-2.5 px-2 text-center border-b border-r border-emerald-200 w-12">
                                Sexe
                              </th>
                              <th className="py-2.5 px-3 text-center border-b border-emerald-200 bg-emerald-100/60 whitespace-nowrap">
                                Points obtenus
                              </th>
                              <th className="py-2.5 px-3 text-center border-b border-emerald-200 bg-emerald-100/60 whitespace-nowrap">
                                Moyenne
                              </th>
                              <th className="py-2.5 px-3 text-center border-b border-emerald-200 bg-emerald-100/60 whitespace-nowrap">
                                Rang
                              </th>
                              <th className="py-2.5 px-3 text-left border-b border-r border-emerald-200 bg-emerald-100/60 whitespace-nowrap">
                                Appréciation
                              </th>
                              {meritWithDisciplines &&
                                report.columns.map(col => (
                                  <th
                                    key={col.id}
                                    className="border-b border-l border-emerald-200 px-1 py-2 w-10 min-w-[36px] h-28 align-bottom normal-case bg-slate-50 text-slate-800"
                                  >
                                    <div
                                      className="mx-auto text-[10.5px] font-semibold leading-tight text-center"
                                      style={{
                                        writingMode: 'vertical-rl',
                                        transform: 'rotate(180deg)',
                                        maxHeight: '104px',
                                      }}
                                    >
                                      {report.isPrimary
                                        ? col.name
                                        : `${col.name} (c.${col.coefficient})`}
                                    </div>
                                  </th>
                                ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {report.meritPassingRows.map((stu, idx) => (
                              <tr
                                key={stu.studentId}
                                className={idx % 2 === 1 ? 'bg-slate-50' : 'bg-white'}
                              >
                                <td className="py-2 px-2.5 text-center text-slate-500 font-semibold">
                                  {idx + 1}
                                </td>
                                <td className="py-2 px-3 font-bold text-slate-900 whitespace-nowrap">
                                  {stu.fullName}
                                </td>
                                <td className="py-2 px-2 text-center font-semibold text-slate-700 border-r border-slate-200">
                                  {stu.gender || '—'}
                                </td>
                                <td className="py-2 px-3 text-center font-bold text-slate-900 tabular-nums whitespace-nowrap bg-emerald-50/35">
                                  {fmtComma(stu.totalPoints, 1)} pts
                                </td>
                                <td className="py-2 px-3 text-center font-extrabold text-emerald-700 tabular-nums whitespace-nowrap bg-emerald-50/35">
                                  {fmtComma(stu.average, 2)} / {report.scale}
                                </td>
                                <td className="py-2 px-3 text-center whitespace-nowrap bg-emerald-50/35">
                                  <span
                                    className={`inline-block px-2.5 py-0.5 rounded-full font-extrabold ${
                                      stu.rankNum === 1
                                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                        : stu.rankNum && stu.rankNum <= 3
                                          ? 'bg-emerald-100 text-emerald-900'
                                          : 'text-[#1B365D]'
                                    }`}
                                  >
                                    {stu.rankText}
                                  </span>
                                </td>
                                <td className="py-2 px-3 font-semibold text-slate-800 whitespace-nowrap border-r border-slate-200 bg-emerald-50/35">
                                  {stu.appreciation}
                                </td>
                                {meritWithDisciplines &&
                                  report.columns.map(col => {
                                    const val = stu.scores[col.id]
                                    return (
                                      <td
                                        key={col.id}
                                        className="py-2 px-1.5 text-center border-l border-slate-200 tabular-nums"
                                      >
                                        {val !== null && val !== undefined
                                          ? Number.isInteger(val)
                                            ? val
                                            : fmtComma(val, 2)
                                                .replace(/,00$/, '')
                                                .replace(/(,\d)0$/, '$1')
                                          : ''}
                                      </td>
                                    )
                                  })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="px-4 py-2 bg-slate-50 border-t border-emerald-200 text-[11px] italic text-slate-600">
                        {report.legendText}
                      </div>
                    </>
                  )}
                </div>
              )}

              {activeTab === 'recap' && (
                <div className="max-w-[1200px] mx-auto space-y-4">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="bg-white rounded-xl border border-slate-200 p-4">
                      <div className="text-[11px] font-bold uppercase text-slate-500">
                        Présents / Inscrits
                      </div>
                      <div className="text-2xl font-extrabold text-slate-900 mt-1">
                        {report.stats.present.total}{' '}
                        <span className="text-xs font-semibold text-slate-500">
                          / {report.stats.enrolled.total}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        {report.stats.present.boys} G • {report.stats.present.girls} F
                      </div>
                    </div>
                    <div className="bg-white rounded-xl border border-emerald-200 p-4">
                      <div className="text-[11px] font-bold uppercase text-emerald-700">
                        Admis (≥ {report.passThreshold})
                      </div>
                      <div className="text-2xl font-extrabold text-emerald-700 mt-1">
                        {report.stats.passing.total}{' '}
                        <span className="text-sm font-bold">
                          ({report.stats.passRatePct ?? 0} %)
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        {report.stats.passing.boys} G • {report.stats.passing.girls} F
                      </div>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 p-4">
                      <div className="text-[11px] font-bold uppercase text-slate-500">
                        Moyenne générale
                      </div>
                      <div className="text-2xl font-extrabold text-[#1B365D] mt-1">
                        {report.stats.classAverage !== null
                          ? fmtComma(report.stats.classAverage, 2)
                          : '—'}{' '}
                        <span className="text-xs text-slate-500">/ {report.scale}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">{report.formulaLabel}</div>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 p-4">
                      <div className="text-[11px] font-bold uppercase text-slate-500">Extrêmes</div>
                      <div className="text-xs font-bold text-emerald-700 mt-1 truncate">
                        Max :{' '}
                        {report.stats.highestAverage !== null
                          ? `${fmtComma(report.stats.highestAverage, 2)} (${report.stats.highestStudentName})`
                          : '—'}
                      </div>
                      <div className="text-xs font-bold text-red-600 mt-1 truncate">
                        Min :{' '}
                        {report.stats.lowestAverage !== null
                          ? `${fmtComma(report.stats.lowestAverage, 2)} (${report.stats.lowestStudentName})`
                          : '—'}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-slate-300 overflow-hidden">
                    <div className="bg-[#1B365D] text-white px-4 py-2 font-bold text-xs uppercase">
                      Répartition par tranche d&apos;appréciation
                    </div>
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 font-bold">
                          <th className="py-2 px-3 text-left">Appréciation</th>
                          <th className="py-2 px-2 text-center">Tranche</th>
                          <th className="py-2 px-2 text-center">G</th>
                          <th className="py-2 px-2 text-center">F</th>
                          <th className="py-2 px-2 text-center">Total</th>
                          <th className="py-2 px-3 text-center">%</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {report.stats.appreciationBreakdown.map(b => (
                          <tr key={b.bucket}>
                            <td className="py-2 px-3 font-semibold">{b.label}</td>
                            <td className="py-2 px-2 text-center text-slate-500">{b.rangeLabel}</td>
                            <td className="py-2 px-2 text-center">{b.boys}</td>
                            <td className="py-2 px-2 text-center">{b.girls}</td>
                            <td className="py-2 px-2 text-center font-bold">{b.total}</td>
                            <td className="py-2 px-3 text-center">{b.pct} %</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'mapping' && (
                <div className="max-w-[1160px] mx-auto space-y-5">
                  <div className="bg-white rounded-xl border border-slate-300 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1 text-xs">
                      <p className="font-bold text-slate-900 text-sm">
                        Correspondance avec la base de données ({targetClassObj.name})
                      </p>
                      <p className="text-slate-600">
                        Élèves reconnus :{' '}
                        <strong className="text-emerald-700">
                          {matchedStudentsCount} / {parsed.rows.length}
                        </strong>
                        {unmatchedStudentsCount > 0 && (
                          <span className="text-amber-700 font-semibold">
                            {' '}
                            ({unmatchedStudentsCount} non inscrit(s) dans la classe)
                          </span>
                        )}{' '}
                        • Rubriques associées :{' '}
                        <strong className="text-[#1B365D]">
                          {matchedSubjectsCount} / {subjectMappings.length}
                        </strong>
                      </p>
                      <div className="flex flex-wrap gap-4 pt-2">
                        <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={createMissingSubjects}
                            onChange={e => setCreateMissingSubjects(e.target.checked)}
                            className="rounded border-slate-300"
                          />
                          <span>
                            Créer automatiquement les {unmatchedSubjectsCount} rubrique(s) manquante(s) comme matières
                          </span>
                        </label>

                        {!isTeacher && (
                          <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={createMissingStudents}
                              onChange={e => setCreateMissingStudents(e.target.checked)}
                              className="rounded border-slate-300"
                            />
                            <span>
                              Inscrire automatiquement les {unmatchedStudentsCount} élève(s) manquant(s) dans {targetClassObj.name}
                            </span>
                          </label>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleSaveToDatabase}
                      disabled={isSavingDb}
                      className="shrink-0 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                      {isSavingDb ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Database className="w-4 h-4" />
                      )}
                      <span>Enregistrer dans Scogestia</span>
                    </button>
                  </div>

                  {/* Correspondance Rubriques -> Matières */}
                  <div className="bg-white rounded-xl border border-slate-300 overflow-hidden">
                    <div className="bg-[#1B365D] text-white px-4 py-2.5 text-xs font-bold uppercase">
                      Association des rubriques Excel → Matières Scogestia
                    </div>
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 font-bold">
                          <th className="py-2 px-3 text-left">Colonne du fichier Excel</th>
                          <th className="py-2 px-2 text-center">
                            {isPrimary ? 'Barème max' : 'Coefficient'}
                          </th>
                          <th className="py-2 px-3 text-left">Matière Scogestia associée</th>
                          <th className="py-2 px-3 text-center">Statut</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {subjectMappings.map((m, idx) => (
                          <tr key={m.colKey}>
                            <td className="py-2 px-3 font-bold text-slate-900">{m.excelName}</td>
                            <td className="py-2 px-2 text-center">
                              {isPrimary ? (
                                <select
                                  value={m.maxScore}
                                  onChange={e => {
                                    const v = Number(e.target.value)
                                    setSubjectMappings(prev =>
                                      prev.map((item, i) =>
                                        i === idx ? { ...item, maxScore: v } : item
                                      )
                                    )
                                  }}
                                  className="px-2 py-1 rounded border border-slate-300 bg-white font-semibold"
                                >
                                  <option value={10}>/ 10</option>
                                  <option value={20}>/ 20</option>
                                </select>
                              ) : (
                                <input
                                  type="number"
                                  min="0.5"
                                  step="0.5"
                                  value={m.coefficient}
                                  onChange={e => {
                                    const v = parseFloat(e.target.value) || 1
                                    setSubjectMappings(prev =>
                                      prev.map((item, i) =>
                                        i === idx ? { ...item, coefficient: v } : item
                                      )
                                    )
                                  }}
                                  className="w-16 px-2 py-1 text-center rounded border border-slate-300 font-semibold"
                                />
                              )}
                            </td>
                            <td className="py-2 px-3">
                              <select
                                value={m.matchedSubjectId || ''}
                                onChange={e => {
                                  const val = e.target.value || null
                                  setSubjectMappings(prev =>
                                    prev.map((item, i) =>
                                      i === idx
                                        ? {
                                            ...item,
                                            matchedSubjectId: val,
                                            confidence: val ? 'exact' : 'unmatched',
                                          }
                                        : item
                                    )
                                  )
                                }}
                                className="w-full max-w-sm h-8 px-2 rounded border border-slate-300 bg-white font-medium text-slate-800"
                              >
                                <option value="">
                                  {createMissingSubjects
                                    ? `— Créer nouvelle matière "${m.excelName}" —`
                                    : '— Ne pas enregistrer en base —'}
                                </option>
                                {cycleSubjects.map(s => (
                                  <option key={s.id} value={s.id}>
                                    {s.name}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="py-2 px-3 text-center">
                              {m.matchedSubjectId ? (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                                  Associée
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                                  {createMissingSubjects ? 'À créer' : 'Calcul aperçu seul'}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Correspondance Élèves */}
                  <div className="bg-white rounded-xl border border-slate-300 overflow-hidden">
                    <div className="bg-[#1B365D] text-white px-4 py-2.5 text-xs font-bold uppercase">
                      Association des élèves ({matchedStudentsCount} reconnus sur{' '}
                      {parsed.rows.length})
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      <table className="w-full text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100 text-slate-700 font-bold sticky top-0">
                            <th className="py-2 px-3 text-left">Nom dans Excel</th>
                            <th className="py-2 px-3 text-left">Élève dans {targetClassObj.name}</th>
                            <th className="py-2 px-3 text-center">Statut</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {parsed.rows.map((row, idx) => {
                            const match = studentMatches[idx]
                            return (
                              <tr key={`${row.rowIndex}_${idx}`}>
                                <td className="py-1.5 px-3 font-bold text-slate-900">
                                  {row.fullName}{' '}
                                  {row.gender && (
                                    <span className="text-[10px] text-slate-500">({row.gender})</span>
                                  )}
                                </td>
                                <td className="py-1.5 px-3">
                                  <select
                                    value={match?.matchedStudentId || ''}
                                    onChange={e => {
                                      const val = e.target.value || null
                                      setStudentMatches(prev =>
                                        prev.map((m, i) =>
                                          i === idx
                                            ? {
                                                ...m,
                                                matchedStudentId: val,
                                                matchMethod: val ? 'exact_name' : 'unmatched',
                                              }
                                            : m
                                        )
                                      )
                                    }}
                                    className="w-full max-w-sm h-8 px-2 rounded border border-slate-300 bg-white font-medium"
                                  >
                                    <option value="">
                                      {createMissingStudents && !isTeacher
                                        ? `— Ajouter "${row.fullName}" à la classe —`
                                        : '— Non associé (aperçu/Excel uniquement) —'}
                                    </option>
                                    {classStudents.map(cs => (
                                      <option key={cs.id} value={cs.id}>
                                        {cs.last_name} {cs.first_name}{' '}
                                        {cs.matricule ? `(${cs.matricule})` : ''}
                                      </option>
                                    ))}
                                  </select>
                                </td>
                                <td className="py-1.5 px-3 text-center">
                                  {match?.matchedStudentId ? (
                                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                                      Reconnu
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                                      {createMissingStudents && !isTeacher ? 'À créer' : 'Hors base'}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
