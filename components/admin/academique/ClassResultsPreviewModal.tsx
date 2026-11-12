'use client'

import React, { useEffect, useMemo, useState } from 'react'
import {
  X,
  ArrowLeft,
  Download,
  Printer,
  Award,
  ArrowUpDown,
  FileSpreadsheet,
  BarChart3,
  Loader2,
  RotateCcw,
  Users,
  CheckCircle2,
  AlertCircle,
  Trophy,
} from 'lucide-react'
import {
  AverageScale,
  buildClassResultsReport,
  ClassResultsReport,
  ExportClassItem,
  ExportCycle,
  ExportPrimaryGrade,
  ExportSecondaryGrade,
  ExportStudentItem,
  ExportSubjectItem,
  FilterMode,
  getDefaultReportTitle,
  PRIMARY_MONTH_NAMES,
  PrimaryPeriodKey,
  SortMode,
} from '@/lib/grades-export'
import { exportClassResultsToExcel } from '@/lib/excel-grades-export'

export type ClassResultsPreviewModalProps = {
  isOpen: boolean
  onClose: () => void
  classItem: ExportClassItem
  students: ExportStudentItem[]
  subjects: ExportSubjectItem[]
  primaryGrades: ExportPrimaryGrade[]
  secondaryGrades: ExportSecondaryGrade[]
  cycle: ExportCycle
  initialSecondaryTerm?: string
  initialSortMode?: SortMode
  initialFilterMode?: FilterMode
  schoolName?: string
  academicYear?: string
}

function fmtNumComma(val: number | null | undefined, decimals: number): string {
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

function buildPrintableHtml(report: ClassResultsReport, activeTab: 'results' | 'recap'): string {
  if (activeTab === 'recap') {
    const { stats } = report
    const fmtAvg = (v: number | null) =>
      v !== null ? `${v.toFixed(2).replace('.', ',')} / ${report.scale}` : '—'

    const meritRowsHtml = report.meritPassingRows
      .map(
        (stu, i) => `
        <tr>
          <td class="c">${i + 1}</td>
          <td class="c b">${escapeHtml(stu.rankText)}</td>
          <td class="b">${escapeHtml(stu.fullName)}</td>
          <td class="c">${escapeHtml(stu.gender || '—')}</td>
          <td class="c b">${fmtNumComma(stu.totalPoints, 1)}</td>
          <td class="c b ok">${fmtNumComma(stu.average, 2)}</td>
          <td>${escapeHtml(stu.appreciation)}</td>
        </tr>
      `
      )
      .join('')

    const subjRowsHtml = stats.subjectStats
      .map(
        st => `
        <tr>
          <td class="b">${escapeHtml(st.name)}</td>
          <td class="c">/${st.maxScore}</td>
          <td class="c">${st.gradedCount}</td>
          <td class="c">${st.minScore !== null && st.maxFoundScore !== null ? `${st.minScore} / ${st.maxFoundScore}` : '—'}</td>
          <td class="c b">${st.average !== null ? fmtNumComma(st.average, 2) : '—'}</td>
          <td class="c">${st.passRatePct !== null ? `${st.passRatePct} %` : '—'}</td>
        </tr>
      `
      )
      .join('')

    const apprRowsHtml = stats.appreciationBreakdown
      .map(
        b => `
        <tr>
          <td class="b ${b.bucket === 'mediocre' || b.bucket === 'tres_insuffisant' ? 'fail' : ''}">${escapeHtml(b.label)}</td>
          <td>${escapeHtml(b.rangeLabel)}</td>
          <td class="c">${b.boys}</td>
          <td class="c">${b.girls}</td>
          <td class="c b">${b.total}</td>
          <td class="c">${b.pct} %</td>
        </tr>
      `
      )
      .join('')

    return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<title>Récapitulation – ${escapeHtml(report.className)}</title>
<style>
  @page { size: A4 portrait; margin: 10mm; }
  body { font-family: Calibri, Arial, sans-serif; color: #0f172a; margin: 0; font-size: 11px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .banner { background: #1B365D; color: #fff; text-align: center; padding: 10px; font-weight: 700; font-size: 15px; }
  .meta { background: #F1F5F9; text-align: center; padding: 6px; font-weight: 600; font-size: 11px; border: 1px solid #94A3B8; border-top: none; margin-bottom: 12px; }
  h3 { background: #1B365D; color: #fff; margin: 12px 0 0; padding: 5px 8px; font-size: 11px; text-transform: uppercase; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
  th, td { border: 1px solid #94A3B8; padding: 4px 6px; text-align: left; }
  th { background: #F1F5F9; font-weight: 700; }
  .c { text-align: center; }
  .b { font-weight: 700; }
  .fail { color: #DC2626; }
  .ok { color: #047857; }
</style>
</head>
<body>
  <div class="banner">RÉCAPITULATION – ${escapeHtml(report.title)}</div>
  <div class="meta">${escapeHtml(report.schoolName)} | Classe : ${escapeHtml(report.className)} | ${escapeHtml(report.periodLabel)} | Année : ${escapeHtml(report.academicYear)}</div>

  <h3>1. Synthèse générale des résultats</h3>
  <table>
    <thead><tr><th>Indicateur</th><th class="c">Garçons</th><th class="c">Filles</th><th class="c">Total</th><th class="c">Valeur / %</th><th>Observation</th></tr></thead>
    <tbody>
      <tr><td class="b">Effectif inscrit</td><td class="c">${stats.enrolled.boys}</td><td class="c">${stats.enrolled.girls}</td><td class="c b">${stats.enrolled.total}</td><td class="c">100 %</td><td>Total inscrits</td></tr>
      <tr><td class="b">Présents (composé)</td><td class="c">${stats.present.boys}</td><td class="c">${stats.present.girls}</td><td class="c b">${stats.present.total}</td><td class="c">${stats.enrolled.total > 0 ? ((stats.present.total / stats.enrolled.total) * 100).toFixed(1) : '—'} %</td><td>Élèves évalués</td></tr>
      <tr><td class="b">Absents</td><td class="c">${stats.absent.boys}</td><td class="c">${stats.absent.girls}</td><td class="c b">${stats.absent.total}</td><td class="c">${stats.enrolled.total > 0 ? ((stats.absent.total / stats.enrolled.total) * 100).toFixed(1) : '—'} %</td><td>Non classés</td></tr>
      <tr><td class="b ok">Admis (Moy. ≥ ${report.passThreshold})</td><td class="c">${stats.passing.boys}</td><td class="c">${stats.passing.girls}</td><td class="c b ok">${stats.passing.total}</td><td class="c b ok">${stats.passRatePct !== null ? `${stats.passRatePct} %` : '—'}</td><td>Taux de réussite</td></tr>
      <tr><td class="b fail">Insuffisants (Moy. &lt; ${report.passThreshold})</td><td class="c">${stats.failing.boys}</td><td class="c">${stats.failing.girls}</td><td class="c b fail">${stats.failing.total}</td><td class="c">${stats.present.total > 0 ? ((stats.failing.total / stats.present.total) * 100).toFixed(1) : '—'} %</td><td>À encourager</td></tr>
      <tr><td class="b">Moyenne générale de classe</td><td class="c">—</td><td class="c">—</td><td class="c">—</td><td class="c b">${fmtAvg(stats.classAverage)}</td><td>Moyenne des présents</td></tr>
      <tr><td class="b">Plus forte moyenne</td><td class="c">—</td><td class="c">—</td><td class="c">—</td><td class="c b ok">${fmtAvg(stats.highestAverage)}</td><td>${escapeHtml(stats.highestStudentName || '—')}</td></tr>
      <tr><td class="b">Plus faible moyenne</td><td class="c">—</td><td class="c">—</td><td class="c">—</td><td class="c b fail">${fmtAvg(stats.lowestAverage)}</td><td>${escapeHtml(stats.lowestStudentName || '—')}</td></tr>
    </tbody>
  </table>

  <h3>2. Répartition par appréciation</h3>
  <table>
    <thead><tr><th>Appréciation</th><th>Tranche</th><th class="c">Garçons</th><th class="c">Filles</th><th class="c">Total</th><th class="c">%</th></tr></thead>
    <tbody>${apprRowsHtml}</tbody>
  </table>

  <h3>3. Ordre de mérite — Élèves ayant la moyenne (${report.meritPassingRows.length})</h3>
  <table>
    <thead><tr><th class="c">N°</th><th class="c">Rang</th><th>Nom et Prénom</th><th class="c">Sexe</th><th class="c">Total</th><th class="c">Moyenne</th><th>Appréciation</th></tr></thead>
    <tbody>${meritRowsHtml || '<tr><td colspan="7" class="c">Aucun élève admis pour le moment.</td></tr>'}</tbody>
  </table>

  <h3>4. Statistiques par discipline</h3>
  <table>
    <thead><tr><th>Discipline</th><th class="c">Barème</th><th class="c">Notés</th><th class="c">Min / Max</th><th class="c">Moy. classe</th><th class="c">Réussite</th></tr></thead>
    <tbody>${subjRowsHtml}</tbody>
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
      const scoreCells =
        report.columns.length === 0
          ? '<td></td>'
          : report.columns
              .map(col => {
                const v = stu.scores[col.id]
                const txt =
                  v !== null && v !== undefined
                    ? Number.isInteger(v)
                      ? String(v)
                      : fmtNumComma(v, 2).replace(/,00$/, '').replace(/(,\d)0$/, '$1')
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
        <td class="c b">${stu.isAbsent ? '' : fmtNumComma(stu.totalPoints, 1)}</td>
        <td class="c b ${avgFailClass}">${stu.isAbsent ? '' : fmtNumComma(stu.average, 2)}</td>
        <td class="c ${stu.rankNum === 1 ? 'b' : ''}">${stu.isAbsent ? '' : escapeHtml(stu.rankText)}</td>
        <td class="${apprClass}">${escapeHtml(stu.appreciation)}</td>
      </tr>`
    })
    .join('')

  const filterBadge =
    report.filterMode === 'passing_only'
      ? `Ordre de mérite — Admis uniquement (Moy. ≥ ${report.passThreshold})`
      : report.sortMode === 'merit'
        ? 'Ordre de mérite (Tous)'
        : 'Ordre alphabétique'

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
      <tr><td colspan="${colCount}" class="meta">Classe : ${escapeHtml(report.className)} &nbsp;&nbsp;|&nbsp;&nbsp; Effectif affiché : ${report.displayRows.length} / ${report.allRows.length} élèves &nbsp;&nbsp;|&nbsp;&nbsp; ${escapeHtml(report.formulaLabel)} &nbsp;&nbsp;|&nbsp;&nbsp; ${escapeHtml(filterBadge)}</td></tr>
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
    <tbody>
      ${bodyRowsHtml}
    </tbody>
  </table>
  <div class="legend">${escapeHtml(report.legendText)}</div>
</body>
</html>`
}

export function ClassResultsPreviewModal({
  isOpen,
  onClose,
  classItem,
  students,
  subjects,
  primaryGrades,
  secondaryGrades,
  cycle,
  initialSecondaryTerm = '1er_trimestre',
  initialSortMode = 'alphabetical',
  initialFilterMode = 'all',
  schoolName,
  academicYear,
}: ClassResultsPreviewModalProps) {
  const isPrimary = cycle === 'primaire' || cycle === 'maternelle'

  // Trouver le dernier mois contenant au moins une note pour cette classe (par défaut month_1)
  const detectedPrimaryPeriod = useMemo<PrimaryPeriodKey>(() => {
    if (!isPrimary) return 'month_1'
    const stuIds = new Set(students.filter(s => s.class_id === classItem.id).map(s => s.id))
    let latestMonth = 0
    for (const g of primaryGrades) {
      if (stuIds.has(g.student_id) && g.score !== null && g.score !== undefined && !isNaN(Number(g.score))) {
        if (g.month_number > latestMonth) latestMonth = g.month_number
      }
    }
    return latestMonth >= 1 && latestMonth <= 9 ? (`month_${latestMonth}` as PrimaryPeriodKey) : 'month_1'
  }, [isPrimary, students, classItem.id, primaryGrades])

  const [primaryPeriod, setPrimaryPeriod] = useState<PrimaryPeriodKey>(detectedPrimaryPeriod)
  const [secondaryTerm, setSecondaryTerm] = useState<string>(initialSecondaryTerm)
  const [scale, setScale] = useState<AverageScale>(20)
  const [customDivisorInput, setCustomDivisorInput] = useState<string>('')
  const [sortMode, setSortMode] = useState<SortMode>(initialSortMode)
  const [filterMode, setFilterMode] = useState<FilterMode>(initialFilterMode)
  const [customTitle, setCustomTitle] = useState<string>('')
  const [hasEditedTitle, setHasEditedTitle] = useState<boolean>(false)
  const [activeTab, setActiveTab] = useState<'results' | 'recap'>('results')
  const [isExporting, setIsExporting] = useState<boolean>(false)
  const [exportError, setExportError] = useState<string | null>(null)

  // Synchroniser l'état à chaque ouverture de la fenêtre modale
  useEffect(() => {
    if (!isOpen) return
    setPrimaryPeriod(detectedPrimaryPeriod)
    setSecondaryTerm(initialSecondaryTerm)
    setSortMode(initialSortMode)
    setFilterMode(initialFilterMode)
    setScale(20)
    setCustomDivisorInput('')
    setHasEditedTitle(false)
    setCustomTitle(
      getDefaultReportTitle({
        isPrimary,
        primaryPeriod: detectedPrimaryPeriod,
        secondaryTerm: initialSecondaryTerm,
      })
    )
    setActiveTab('results')
    setExportError(null)
  }, [isOpen, detectedPrimaryPeriod, initialSecondaryTerm, initialSortMode, initialFilterMode, isPrimary])

  // Mettre à jour le titre automatique lors du changement de période si l'utilisateur ne l'a pas personnalisé
  useEffect(() => {
    if (!isOpen || hasEditedTitle) return
    setCustomTitle(
      getDefaultReportTitle({
        isPrimary,
        primaryPeriod,
        secondaryTerm,
      })
    )
  }, [isOpen, isPrimary, primaryPeriod, secondaryTerm, hasEditedTitle])

  // Touche Échap pour fermer
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  const parsedCustomDivisor = useMemo(() => {
    const val = parseFloat(customDivisorInput.replace(',', '.'))
    return !isNaN(val) && val > 0 ? val : null
  }, [customDivisorInput])

  // Calcul auto de référence (sans customDivisor) pour afficher le placeholder dans l'input Diviseur
  const autoReportReference = useMemo(() => {
    if (!isOpen) return null
    return buildClassResultsReport({
      classItem,
      students,
      subjects,
      primaryGrades,
      secondaryGrades,
      cycle,
      primaryPeriod,
      secondaryTerm,
      scale,
      customDivisor: null,
      sortMode: 'alphabetical',
      filterMode: 'all',
      schoolName,
      academicYear,
    })
  }, [
    isOpen,
    classItem,
    students,
    subjects,
    primaryGrades,
    secondaryGrades,
    cycle,
    primaryPeriod,
    secondaryTerm,
    scale,
    schoolName,
    academicYear,
  ])

  const report = useMemo(() => {
    if (!isOpen) return null
    return buildClassResultsReport({
      classItem,
      students,
      subjects,
      primaryGrades,
      secondaryGrades,
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
    })
  }, [
    isOpen,
    classItem,
    students,
    subjects,
    primaryGrades,
    secondaryGrades,
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
  ])

  if (!isOpen || !report) return null

  const handleExportExcel = async (mode: 'complete' | 'merit_only' = 'complete') => {
    setExportError(null)
    setIsExporting(true)
    try {
      await exportClassResultsToExcel(report, { mode })
    } catch (err: any) {
      console.error('Excel export error:', err)
      setExportError(err?.message || "Impossible de générer le fichier Excel. Veuillez réessayer.")
    } finally {
      setIsExporting(false)
    }
  }

  const handlePrint = () => {
    const html = buildPrintableHtml(report, activeTab)
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

  const isAlphabeticalAll = sortMode === 'alphabetical' && filterMode === 'all'
  const isMeritAll = sortMode === 'merit' && filterMode === 'all'
  const isMeritPassing = sortMode === 'merit' && filterMode === 'passing_only'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 backdrop-blur-xs p-2 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Aperçu des résultats de ${classItem.name}`}
      onClick={onClose}
    >
      <div
        className="flex flex-col w-full max-w-[96vw] xl:max-w-[1460px] h-[94vh] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Modal Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 px-4 sm:px-6 py-3.5 bg-gradient-to-r from-[#0F172A] via-[#132A3E] to-[#064E3B] border-b border-white/10 text-white shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={onClose}
              title="Retour à la liste des notes"
              aria-label="Retour"
              className="group h-10 px-3 rounded-xl bg-white/12 hover:bg-white/22 ring-1 ring-white/25 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-emerald-300 group-hover:-translate-x-0.5 transition-transform" />
              <span className="text-xs font-bold text-white hidden sm:inline">Retour</span>
            </button>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-white">
                  Aperçu &amp; Export Excel — {classItem.name}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-400/20 text-emerald-200 ring-1 ring-emerald-300/30 whitespace-nowrap">
                  {report.stats.passing.total} admis / {report.stats.present.total} présents
                  {report.stats.passRatePct !== null ? ` (${report.stats.passRatePct} %)` : ''}
                </span>
                {report.stats.classAverage !== null && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-400/20 text-sky-100 ring-1 ring-sky-300/30 whitespace-nowrap">
                    Moy. classe : {fmtNumComma(report.stats.classAverage, 2)} / {report.scale}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Calcul automatique des totaux, moyennes, rangs officiels (ex-æquo) et appréciations.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimer</span>
            </button>

            <button
              type="button"
              onClick={() => handleExportExcel('merit_only')}
              disabled={isExporting || report.meritPassingRows.length === 0}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-sm transition-all disabled:opacity-50 flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Admis (.xlsx)</span>
            </button>

            <button
              type="button"
              onClick={() => handleExportExcel('complete')}
              disabled={isExporting}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-400 hover:bg-emerald-300 text-slate-950 shadow-sm transition-all disabled:opacity-60 flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              {isExporting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>{isExporting ? 'Génération...' : 'Complet (.xlsx)'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer l'aperçu"
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Export Error Toast */}
        {exportError && (
          <div className="px-6 py-2.5 bg-red-50 border-b border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{exportError}</span>
          </div>
        )}

        {/* Controls Bar */}
        <div className="px-4 sm:px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-end gap-3 shrink-0">
          {/* Période */}
          <div className="flex flex-col gap-1 min-w-[175px]">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Période
            </label>
            {isPrimary ? (
              <select
                value={primaryPeriod}
                onChange={e => setPrimaryPeriod(e.target.value as PrimaryPeriodKey)}
                className="h-9 px-2.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-800 outline-none focus:border-[#1B365D]"
              >
                <optgroup label="Compositions mensuelles">
                  {Object.entries(PRIMARY_MONTH_NAMES).map(([num, label]) => (
                    <option key={num} value={`month_${num}`}>
                      {label}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Bilans trimestriels & annuel">
                  <option value="trim_1">1er Trimestre (M1 – M3)</option>
                  <option value="trim_2">2e Trimestre (M4 – M6)</option>
                  <option value="trim_3">3e Trimestre (M7 – M9)</option>
                  <option value="annual">Année complète (M1 – M9)</option>
                </optgroup>
              </select>
            ) : (
              <select
                value={secondaryTerm}
                onChange={e => setSecondaryTerm(e.target.value)}
                className="h-9 px-2.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-800 outline-none focus:border-[#1B365D]"
              >
                <option value="1er_trimestre">1er Trimestre</option>
                <option value="2e_trimestre">2e Trimestre</option>
                <option value="3e_trimestre">3e Trimestre</option>
                <option value="1er_semestre">1er Semestre</option>
                <option value="2e_semestre">2e Semestre</option>
              </select>
            )}
          </div>

          {/* Titre du document */}
          <div className="flex flex-col gap-1 flex-1 min-w-[230px]">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Titre en-tête du tableau
              </label>
              {hasEditedTitle && (
                <button
                  type="button"
                  onClick={() => setHasEditedTitle(false)}
                  className="text-[11px] text-[#1B365D] hover:underline font-semibold flex items-center gap-0.5 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  Réinitialiser
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
              placeholder="COMPOSITION MENSUELLE – OCTOBRE 2026"
              className="h-9 px-3 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-800 outline-none focus:border-[#1B365D]"
            />
          </div>

          {/* Options Primaire : Échelle /20 vs /10 + Diviseur */}
          {isPrimary && (
            <div className="flex items-end gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Échelle moyenne
                </label>
                <div className="inline-flex rounded-lg border border-slate-300 bg-white p-0.5 h-9">
                  <button
                    type="button"
                    onClick={() => setScale(20)}
                    className={`px-2.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                      scale === 20
                        ? 'bg-[#1B365D] text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    / 20
                  </button>
                  <button
                    type="button"
                    onClick={() => setScale(10)}
                    className={`px-2.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                      scale === 10
                        ? 'bg-[#1B365D] text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    / 10
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1 w-28">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Diviseur
                  </label>
                  {customDivisorInput !== '' && (
                    <button
                      type="button"
                      onClick={() => setCustomDivisorInput('')}
                      title="Revenir au diviseur automatique"
                      className="text-[10px] text-[#1B365D] hover:underline font-bold cursor-pointer"
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
                  placeholder={`Auto (${autoReportReference?.divisor ?? 7})`}
                  className="h-9 px-2.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-800 outline-none focus:border-[#1B365D]"
                />
              </div>
            </div>
          )}

          {/* Boutons 1-clic de Tri & Ordre de mérite */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Classement &amp; Filtre élèves
            </label>
            <div className="inline-flex flex-wrap rounded-xl border border-slate-300 bg-white p-0.5 gap-0.5">
              <button
                type="button"
                onClick={() => {
                  setSortMode('alphabetical')
                  setFilterMode('all')
                  setActiveTab('results')
                }}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  isAlphabeticalAll
                    ? 'bg-[#1B365D] text-white shadow-2xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Alphabétique (Tous)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSortMode('merit')
                  setFilterMode('all')
                  setActiveTab('results')
                }}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  isMeritAll
                    ? 'bg-[#1B365D] text-white shadow-2xs'
                    : 'text-slate-700 hover:bg-slate-100'
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
                  setActiveTab('results')
                }}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  isMeritPassing
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-emerald-800 hover:bg-emerald-50'
                }`}
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>Ordre de mérite — Admis (≥ {report.passThreshold})</span>
              </button>
            </div>
          </div>
        </div>

        {/* Excel-style Bottom/Top Sheet Tabs */}
        <div className="px-4 sm:px-6 bg-slate-100 border-b border-slate-200 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-1 pt-1.5">
            <button
              type="button"
              onClick={() => setActiveTab('results')}
              className={`px-4 py-2 text-xs font-bold rounded-t-lg border-t border-x transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'results'
                  ? 'bg-white text-[#1B365D] border-slate-300 -mb-px pb-2.5'
                  : 'bg-slate-200/70 text-slate-600 border-transparent hover:bg-white/60'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Résultats</span>
              <span className="px-1.5 py-0.2 rounded bg-slate-100 text-[10px] text-slate-700 font-bold">
                {report.displayRows.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('recap')}
              className={`px-4 py-2 text-xs font-bold rounded-t-lg border-t border-x transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'recap'
                  ? 'bg-white text-[#1B365D] border-slate-300 -mb-px pb-2.5'
                  : 'bg-slate-200/70 text-slate-600 border-transparent hover:bg-white/60'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Récapitulation</span>
            </button>
          </div>

          <div className="hidden md:flex items-center gap-3 text-[11px] text-slate-600 font-medium">
            <span>
              Barème détecté : <strong className="text-slate-900">{report.barèmeTotal} pts</strong>
            </span>
            <span>•</span>
            <span>
              Seuil de réussite : <strong className="text-emerald-700">≥ {report.passThreshold} / {report.scale}</strong>
            </span>
            <span>•</span>
            <span>L’export Excel génère les 3 onglets (Résultats, Récapitulation, Ordre de mérite)</span>
          </div>
        </div>

        {/* Main Body Scrollable Area */}
        <div className="flex-1 overflow-auto bg-slate-200/60 p-3 sm:p-5 custom-scrollbar">
          {activeTab === 'results' ? (
            <div className="bg-white rounded-xl border border-slate-300 shadow-sm overflow-hidden">
              {report.displayRows.length === 0 ? (
                <div className="py-16 px-6 text-center flex flex-col items-center justify-center">
                  <Award className="w-12 h-12 text-amber-500/60 mb-3" />
                  <h3 className="text-base font-bold text-slate-800">
                    {filterMode === 'passing_only'
                      ? `Aucun élève n'a encore atteint la moyenne (≥ ${report.passThreshold} / ${report.scale})`
                      : 'Aucun élève dans cette classe'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-md">
                    {filterMode === 'passing_only'
                      ? 'Vérifiez la période sélectionnée, saisissez les notes manquantes ou affichez tous les élèves.'
                      : 'Ajoutez d’abord des élèves dans cette classe.'}
                  </p>
                  {filterMode === 'passing_only' && (
                    <button
                      type="button"
                      onClick={() => {
                        setFilterMode('all')
                        setSortMode('alphabetical')
                      }}
                      className="mt-4 px-4 py-2 rounded-lg text-xs font-bold bg-[#1B365D] text-white hover:opacity-90 cursor-pointer"
                    >
                      Afficher tous les élèves
                    </button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-xs">
                    <thead>
                      {/* Row 1 : Bannière titre */}
                      <tr>
                        <th
                          colSpan={3 + Math.max(1, report.columns.length) + 4}
                          className="bg-[#1B365D] text-white text-center font-extrabold text-sm sm:text-base py-2.5 px-4 tracking-wide border border-slate-700"
                        >
                          {report.title}
                        </th>
                      </tr>

                      {/* Row 2 : Métadonnées classe et formule */}
                      <tr>
                        <td
                          colSpan={3 + Math.max(1, report.columns.length) + 4}
                          className="bg-slate-100 text-slate-900 text-center font-bold text-xs py-1.5 px-4 border border-slate-300"
                        >
                          <span>Classe : {report.className}</span>
                          <span className="mx-4 text-slate-400">|</span>
                          <span>
                            Effectif : {report.displayRows.length}
                            {report.filterMode === 'passing_only'
                              ? ` admis sur ${report.stats.present.total} présents (${report.allRows.length} inscrits)`
                              : ` élève${report.displayRows.length > 1 ? 's' : ''}`}
                          </span>
                          <span className="mx-4 text-slate-400">|</span>
                          <span>{report.formulaLabel}</span>
                          <span className="mx-4 text-slate-400">|</span>
                          <span className="text-[#1B365D]">{report.periodLabel}</span>
                        </td>
                      </tr>

                      {/* Row 3 : Groupes ÉLÈVES | NOTES PAR DISCIPLINE | RÉSULTATS */}
                      <tr className="bg-[#1B365D] text-white font-bold text-[11px] tracking-wider uppercase">
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

                      {/* Row 4 : En-têtes détaillés (disciplines verticales 90°) */}
                      <tr className="bg-[#1B365D] text-white font-bold text-xs">
                        <th className="py-2 px-2 text-center border border-slate-600 w-10">N°</th>
                        <th className="py-2 px-3 text-left border border-slate-600 min-w-[200px]">
                          Nom et Prénom
                        </th>
                        <th className="py-2 px-2 text-center border border-slate-600 w-12">Sexe</th>

                        {report.columns.length === 0 ? (
                          <th className="py-2 px-3 text-center border border-slate-600">
                            Aucune discipline
                          </th>
                        ) : (
                          report.columns.map(col => (
                            <th
                              key={col.id}
                              title={`${col.name} (Barème /${col.maxScore}${!report.isPrimary ? `, Coef ${col.coefficient}` : ''})`}
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
                                {report.isPrimary ? col.name : `${col.name} (c.${col.coefficient})`}
                              </div>
                            </th>
                          ))
                        )}

                        <th className="py-2 px-2 text-center border border-slate-600 w-16">Total</th>
                        <th className="py-2 px-2 text-center border border-slate-600 w-20">
                          Moyenne
                        </th>
                        <th className="py-2 px-2 text-center border border-slate-600 w-16">Rang</th>
                        <th className="py-2 px-3 text-center border border-slate-600 min-w-[180px]">
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
                            className={`${
                              idx % 2 === 1 ? 'bg-slate-50/90' : 'bg-white'
                            } hover:bg-sky-50/60 transition-colors`}
                          >
                            <td className="py-1.5 px-2 text-center border border-slate-300 text-slate-600 font-medium">
                              {idx + 1}
                            </td>
                            <td className="py-1.5 px-3 text-left border border-slate-300 font-bold text-slate-900 whitespace-nowrap">
                              {stu.fullName}
                            </td>
                            <td className="py-1.5 px-2 text-center border border-slate-300 text-slate-700 font-semibold">
                              {stu.gender || ''}
                            </td>

                            {report.columns.length === 0 ? (
                              <td className="py-1.5 px-2 text-center border border-slate-300" />
                            ) : (
                              report.columns.map(col => {
                                const val = stu.scores[col.id]
                                return (
                                  <td
                                    key={col.id}
                                    className="py-1.5 px-1.5 text-center border border-slate-300 text-slate-900 tabular-nums"
                                  >
                                    {val !== null && val !== undefined
                                      ? Number.isInteger(val)
                                        ? val
                                        : fmtNumComma(val, 2)
                                            .replace(/,00$/, '')
                                            .replace(/(,\d)0$/, '$1')
                                      : ''}
                                  </td>
                                )
                              })
                            )}

                            <td className="py-1.5 px-2 text-center border border-slate-300 font-bold text-slate-900 tabular-nums">
                              {stu.isAbsent ? '' : fmtNumComma(stu.totalPoints, 1)}
                            </td>

                            <td
                              className={`py-1.5 px-2 text-center border border-slate-300 font-extrabold tabular-nums ${
                                isFailing ? 'text-red-600' : 'text-slate-900'
                              }`}
                            >
                              {stu.isAbsent ? '' : fmtNumComma(stu.average, 2)}
                            </td>

                            <td
                              className={`py-1.5 px-2 text-center border border-slate-300 whitespace-nowrap ${
                                stu.rankNum === 1 ? 'font-extrabold text-[#1B365D]' : 'text-slate-800 font-medium'
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
              )}

              {/* Footer Légende exact comme la capture */}
              <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-300 text-[11px] italic text-slate-600">
                {report.legendText}
              </div>
            </div>
          ) : (
            /* TAB 2 : RÉCAPITULATION & ORDRE DE MÉRITE ADMIS */
            <div className="space-y-5 max-w-[1280px] mx-auto">
              {/* KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Effectif composé
                  </div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-extrabold text-slate-900">
                      {report.stats.present.total}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      / {report.stats.enrolled.total} inscrits
                    </span>
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500">
                    {report.stats.present.boys} G • {report.stats.present.girls} F
                    {report.stats.absent.total > 0 && ` • ${report.stats.absent.total} absent(s)`}
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-emerald-200 p-4 shadow-2xs">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Admis (Moy. ≥ {report.passThreshold})
                  </div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-extrabold text-emerald-700">
                      {report.stats.passing.total}
                    </span>
                    <span className="text-sm font-bold text-emerald-600">
                      ({report.stats.passRatePct !== null ? `${report.stats.passRatePct} %` : '—'})
                    </span>
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500">
                    {report.stats.passing.boys} G • {report.stats.passing.girls} F
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Moyenne générale de classe
                  </div>
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <span className="text-2xl font-extrabold text-[#1B365D]">
                      {report.stats.classAverage !== null
                        ? fmtNumComma(report.stats.classAverage, 2)
                        : '—'}
                    </span>
                    <span className="text-xs font-bold text-slate-500">/ {report.scale}</span>
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500">{report.formulaLabel}</div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Extrêmes de la classe
                  </div>
                  <div className="mt-1 text-xs font-bold text-emerald-700 truncate">
                    Max :{' '}
                    {report.stats.highestAverage !== null
                      ? `${fmtNumComma(report.stats.highestAverage, 2)} (${report.stats.highestStudentName})`
                      : '—'}
                  </div>
                  <div className="mt-1 text-xs font-bold text-red-600 truncate">
                    Min :{' '}
                    {report.stats.lowestAverage !== null
                      ? `${fmtNumComma(report.stats.lowestAverage, 2)} (${report.stats.lowestStudentName})`
                      : '—'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* 1. Synthèse par sexe */}
                <div className="bg-white rounded-xl border border-slate-300 shadow-2xs overflow-hidden">
                  <div className="bg-[#1B365D] text-white px-4 py-2.5 font-bold text-xs uppercase tracking-wider">
                    1. Synthèse générale par sexe
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 font-bold">
                          <th className="py-2 px-3 text-left border-b border-slate-200">
                            Indicateur
                          </th>
                          <th className="py-2 px-2 text-center border-b border-slate-200">G</th>
                          <th className="py-2 px-2 text-center border-b border-slate-200">F</th>
                          <th className="py-2 px-2 text-center border-b border-slate-200">Total</th>
                          <th className="py-2 px-3 text-center border-b border-slate-200">%</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        <tr>
                          <td className="py-2 px-3 font-semibold text-slate-800">Inscrits</td>
                          <td className="py-2 px-2 text-center">{report.stats.enrolled.boys}</td>
                          <td className="py-2 px-2 text-center">{report.stats.enrolled.girls}</td>
                          <td className="py-2 px-2 text-center font-bold">
                            {report.stats.enrolled.total}
                          </td>
                          <td className="py-2 px-3 text-center">100 %</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 font-semibold text-slate-800">Présents</td>
                          <td className="py-2 px-2 text-center">{report.stats.present.boys}</td>
                          <td className="py-2 px-2 text-center">{report.stats.present.girls}</td>
                          <td className="py-2 px-2 text-center font-bold">
                            {report.stats.present.total}
                          </td>
                          <td className="py-2 px-3 text-center">
                            {report.stats.enrolled.total > 0
                              ? `${((report.stats.present.total / report.stats.enrolled.total) * 100).toFixed(1)} %`
                              : '—'}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 font-semibold text-slate-500">Absents</td>
                          <td className="py-2 px-2 text-center">{report.stats.absent.boys}</td>
                          <td className="py-2 px-2 text-center">{report.stats.absent.girls}</td>
                          <td className="py-2 px-2 text-center font-bold">
                            {report.stats.absent.total}
                          </td>
                          <td className="py-2 px-3 text-center">
                            {report.stats.enrolled.total > 0
                              ? `${((report.stats.absent.total / report.stats.enrolled.total) * 100).toFixed(1)} %`
                              : '—'}
                          </td>
                        </tr>
                        <tr className="bg-emerald-50/70">
                          <td className="py-2 px-3 font-bold text-emerald-800">
                            Ayant la moyenne (≥ {report.passThreshold})
                          </td>
                          <td className="py-2 px-2 text-center font-semibold text-emerald-800">
                            {report.stats.passing.boys}
                          </td>
                          <td className="py-2 px-2 text-center font-semibold text-emerald-800">
                            {report.stats.passing.girls}
                          </td>
                          <td className="py-2 px-2 text-center font-extrabold text-emerald-800">
                            {report.stats.passing.total}
                          </td>
                          <td className="py-2 px-3 text-center font-bold text-emerald-700">
                            {report.stats.passRatePct !== null
                              ? `${report.stats.passRatePct} %`
                              : '—'}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 font-bold text-red-600">
                            Sous la moyenne (&lt; {report.passThreshold})
                          </td>
                          <td className="py-2 px-2 text-center text-red-600">
                            {report.stats.failing.boys}
                          </td>
                          <td className="py-2 px-2 text-center text-red-600">
                            {report.stats.failing.girls}
                          </td>
                          <td className="py-2 px-2 text-center font-bold text-red-600">
                            {report.stats.failing.total}
                          </td>
                          <td className="py-2 px-3 text-center text-red-600">
                            {report.stats.present.total > 0
                              ? `${((report.stats.failing.total / report.stats.present.total) * 100).toFixed(1)} %`
                              : '—'}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 2. Répartition par tranche d'appréciation */}
                <div className="bg-white rounded-xl border border-slate-300 shadow-2xs overflow-hidden">
                  <div className="bg-[#1B365D] text-white px-4 py-2.5 font-bold text-xs uppercase tracking-wider">
                    2. Répartition par appréciation
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 font-bold">
                          <th className="py-2 px-3 text-left border-b border-slate-200">
                            Appréciation
                          </th>
                          <th className="py-2 px-2 text-center border-b border-slate-200">
                            Tranche
                          </th>
                          <th className="py-2 px-2 text-center border-b border-slate-200">G</th>
                          <th className="py-2 px-2 text-center border-b border-slate-200">F</th>
                          <th className="py-2 px-2 text-center border-b border-slate-200">Total</th>
                          <th className="py-2 px-3 text-center border-b border-slate-200">%</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {report.stats.appreciationBreakdown.map(row => {
                          const isFail =
                            row.bucket === 'mediocre' || row.bucket === 'tres_insuffisant'
                          return (
                            <tr key={row.bucket}>
                              <td
                                className={`py-2 px-3 font-semibold ${
                                  isFail
                                    ? 'text-red-600'
                                    : row.bucket === 'absent'
                                      ? 'italic text-slate-500'
                                      : 'text-slate-900'
                                }`}
                              >
                                {row.label}
                              </td>
                              <td className="py-2 px-2 text-center text-slate-500 whitespace-nowrap">
                                {row.rangeLabel}
                              </td>
                              <td className="py-2 px-2 text-center">{row.boys}</td>
                              <td className="py-2 px-2 text-center">{row.girls}</td>
                              <td className="py-2 px-2 text-center font-bold">{row.total}</td>
                              <td className="py-2 px-3 text-center">{row.pct} %</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* 3. Ordre de mérite — Élèves ayant la moyenne */}
              <div className="bg-white rounded-xl border border-emerald-300 shadow-2xs overflow-hidden">
                <div className="bg-emerald-800 text-white px-4 py-2.5 flex items-center justify-between gap-2">
                  <div className="font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-300" />
                    <span>
                      3. Tableau d&apos;honneur — Ordre de mérite des élèves ayant la moyenne (≥{' '}
                      {report.passThreshold} / {report.scale})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSortMode('merit')
                      setFilterMode('passing_only')
                      setActiveTab('results')
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-[11px] font-bold text-white cursor-pointer"
                  >
                    Voir dans la grille complète →
                  </button>
                </div>

                {report.meritPassingRows.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">
                    Aucun élève n&apos;a encore obtenu la moyenne (≥ {report.passThreshold}) sur
                    cette période.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="bg-emerald-50 text-emerald-950 font-bold">
                          <th className="py-2 px-3 text-center border-b border-emerald-200 w-12">
                            N°
                          </th>
                          <th className="py-2 px-3 text-center border-b border-emerald-200 w-20">
                            Rang
                          </th>
                          <th className="py-2 px-3 text-left border-b border-emerald-200">
                            Nom et Prénom
                          </th>
                          <th className="py-2 px-2 text-center border-b border-emerald-200 w-14">
                            Sexe
                          </th>
                          <th className="py-2 px-3 text-center border-b border-emerald-200 w-24">
                            Total
                          </th>
                          <th className="py-2 px-3 text-center border-b border-emerald-200 w-24">
                            Moyenne
                          </th>
                          <th className="py-2 px-3 text-left border-b border-emerald-200">
                            Appréciation
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {report.meritPassingRows.map((stu, i) => (
                          <tr key={stu.studentId} className={i % 2 === 1 ? 'bg-slate-50' : ''}>
                            <td className="py-1.5 px-3 text-center text-slate-600">{i + 1}</td>
                            <td className="py-1.5 px-3 text-center font-extrabold text-[#1B365D]">
                              {stu.rankText}
                            </td>
                            <td className="py-1.5 px-3 font-bold text-slate-900">{stu.fullName}</td>
                            <td className="py-1.5 px-2 text-center text-slate-700">
                              {stu.gender || '—'}
                            </td>
                            <td className="py-1.5 px-3 text-center font-semibold tabular-nums">
                              {fmtNumComma(stu.totalPoints, 1)}
                            </td>
                            <td className="py-1.5 px-3 text-center font-extrabold text-emerald-700 tabular-nums">
                              {fmtNumComma(stu.average, 2)}
                            </td>
                            <td className="py-1.5 px-3 text-slate-800 font-medium">
                              {stu.appreciation}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* 4. Statistiques par discipline */}
              <div className="bg-white rounded-xl border border-slate-300 shadow-2xs overflow-hidden">
                <div className="bg-[#1B365D] text-white px-4 py-2.5 font-bold text-xs uppercase tracking-wider">
                  4. Moyennes et taux de réussite par discipline
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold">
                        <th className="py-2 px-3 text-left border-b border-slate-200">
                          Discipline / Rubrique
                        </th>
                        <th className="py-2 px-2 text-center border-b border-slate-200">Barème</th>
                        <th className="py-2 px-2 text-center border-b border-slate-200">
                          Élèves notés
                        </th>
                        <th className="py-2 px-2 text-center border-b border-slate-200">
                          Note Min / Max
                        </th>
                        <th className="py-2 px-2 text-center border-b border-slate-200">
                          Moyenne classe
                        </th>
                        <th className="py-2 px-3 text-center border-b border-slate-200">
                          Réussite (≥ 50 %)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {report.stats.subjectStats.map(st => (
                        <tr key={st.columnId}>
                          <td className="py-2 px-3 font-bold text-slate-900">{st.name}</td>
                          <td className="py-2 px-2 text-center text-slate-600">/{st.maxScore}</td>
                          <td className="py-2 px-2 text-center">{st.gradedCount}</td>
                          <td className="py-2 px-2 text-center tabular-nums">
                            {st.minScore !== null && st.maxFoundScore !== null
                              ? `${fmtNumComma(st.minScore, 2).replace(/,00$/, '').replace(/(,\d)0$/, '$1')} / ${fmtNumComma(st.maxFoundScore, 2).replace(/,00$/, '').replace(/(,\d)0$/, '$1')}`
                              : '—'}
                          </td>
                          <td className="py-2 px-2 text-center font-bold text-[#1B365D] tabular-nums">
                            {st.average !== null ? fmtNumComma(st.average, 2) : '—'}
                          </td>
                          <td className="py-2 px-3 text-center font-semibold">
                            {st.passRatePct !== null ? `${st.passRatePct} %` : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

