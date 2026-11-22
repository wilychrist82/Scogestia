'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Download,
  FileStack,
  Grid3x3,
  Hash,
  IdCard,
  LayoutGrid,
  Loader2,
  Maximize2,
  Printer,
  Scissors,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react'
import {
  A4_HEIGHT_MM,
  A4_WIDTH_MM,
  CSS_PX_PER_MM,
  ID_CARDS_PER_PAGE,
  ID_CARD_HEIGHT_MM,
  ID_CARD_WIDTH_MM,
  SINGLE_CARD_POSITION_MM,
  buildCropMarkSegments,
  buildCropMarksForRect,
  getIdCardSlot,
  paginateIdCards,
} from '@/lib/pdf/id-card-sheet-layout'

export interface SheetStudent {
  id: string
  first_name: string
  last_name: string
  avatar_url?: string | null
  date_of_birth?: string | null
  birth_place?: string | null
  gender?: string | null
}

export type PaperLayout = 'single' | 'sheet'
export type PaperZoom = number | 'fit'

const A4_WIDTH_PX = A4_WIDTH_MM * CSS_PX_PER_MM
const A4_HEIGHT_PX = A4_HEIGHT_MM * CSS_PX_PER_MM
const CARD_WIDTH_PX = ID_CARD_WIDTH_MM * CSS_PX_PER_MM

function isStudentComplete(s: SheetStudent): boolean {
  return Boolean(s.avatar_url && s.date_of_birth && (s.birth_place || '').trim() && (s.gender || '').trim())
}

function PaperToggle({
  checked,
  onChange,
  icon: Icon,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  icon: React.ComponentType<{ className?: string }>
  label: string
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
      className={`w-full flex items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-[11px] font-bold transition-colors ${
        checked
          ? 'border-indigo-200 bg-indigo-50 text-indigo-900'
          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
      }`}
    >
      <span className="flex items-center gap-1.5">
        <Icon className={`h-3.5 w-3.5 ${checked ? 'text-indigo-600' : 'text-slate-400'}`} />
        {label}
      </span>
      <span
        className={`relative inline-flex h-4 w-7 shrink-0 rounded-full transition-colors ${
          checked ? 'bg-indigo-600' : 'bg-slate-300'
        }`}
      >
        <span
          className={`absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-all ${
            checked ? 'left-3.5' : 'left-0.5'
          }`}
        />
      </span>
    </button>
  )
}

/* -------------------------------------------------------------------------- */
/*  PAGE A4 (mm réels) — partagée par l'aperçu écran et l'impression directe  */
/* -------------------------------------------------------------------------- */

interface A4PageProps<T extends SheetStudent> {
  cards: T[]
  layout: PaperLayout
  designWidth: number
  renderCard: (student: T, globalIndex: number) => React.ReactNode
  globalOffset: number
  showCropMarks: boolean
  showSlotNumbers?: boolean
  showMmGrid?: boolean
  activeStudentId?: string
  onSelectStudent?: (id: string) => void
  forPrint?: boolean
}

export function IdCardA4Page<T extends SheetStudent>({
  cards,
  layout,
  designWidth,
  renderCard,
  globalOffset,
  showCropMarks,
  showSlotNumbers = false,
  showMmGrid = false,
  activeStudentId,
  onSelectStudent,
  forPrint = false,
}: A4PageProps<T>) {
  const scale = CARD_WIDTH_PX / designWidth
  const segments = useMemo(
    () =>
      layout === 'single'
        ? buildCropMarksForRect(SINGLE_CARD_POSITION_MM.x, SINGLE_CARD_POSITION_MM.y)
        : buildCropMarkSegments(cards.length),
    [layout, cards.length]
  )

  return (
    <div
      className="idcard-print-page relative bg-white overflow-hidden"
      style={{ width: `${A4_WIDTH_MM}mm`, height: `${A4_HEIGHT_MM}mm` }}
    >
      {showMmGrid && !forPrint && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(99,102,241,0.10) 1px, transparent 1px), linear-gradient(to bottom, rgba(99,102,241,0.10) 1px, transparent 1px)',
            backgroundSize: '10mm 10mm',
          }}
        />
      )}

      {cards.map((student, idx) => {
        const pos =
          layout === 'single'
            ? { x: SINGLE_CARD_POSITION_MM.x, y: SINGLE_CARD_POSITION_MM.y }
            : getIdCardSlot(idx)
        const globalIndex = globalOffset + idx
        const isActive = !forPrint && activeStudentId === student.id
        const interactive = !forPrint && Boolean(onSelectStudent)
        return (
          <div
            key={`${student.id}-${idx}`}
            role={interactive ? 'button' : undefined}
            tabIndex={interactive ? 0 : undefined}
            onClick={interactive ? () => onSelectStudent?.(student.id) : undefined}
            onKeyDown={
              interactive
                ? (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onSelectStudent?.(student.id)
                    }
                  }
                : undefined
            }
            title={
              interactive
                ? `Carte ${globalIndex + 1} — ${student.last_name.toUpperCase()} ${student.first_name} (cliquer pour éditer)`
                : undefined
            }
            className={`absolute ${interactive ? 'cursor-pointer group outline-none' : ''}`}
            style={{
              left: `${pos.x}mm`,
              top: `${pos.y}mm`,
              width: `${ID_CARD_WIDTH_MM}mm`,
              height: `${ID_CARD_HEIGHT_MM}mm`,
            }}
          >
            <div className="absolute inset-0 overflow-hidden">
              <div
                style={{
                  width: `${designWidth}px`,
                  transform: `scale(${scale})`,
                  transformOrigin: 'top left',
                }}
              >
                {renderCard(student, globalIndex)}
              </div>
            </div>

            {!forPrint && (
              <>
                <div
                  className={`pointer-events-none absolute inset-0 rounded-[1.6mm] transition-all ${
                    isActive
                      ? 'ring-[2.5px] ring-indigo-500 ring-offset-2 ring-offset-white'
                      : 'ring-0 group-hover:ring-2 group-hover:ring-indigo-300 group-focus-visible:ring-2 group-focus-visible:ring-indigo-400'
                  }`}
                />
                {showSlotNumbers && (
                  <span className="pointer-events-none absolute -left-[1.2mm] -top-[1.2mm] z-10 flex h-[5mm] min-w-[5mm] items-center justify-center rounded-full bg-indigo-600 px-[1mm] text-[9px] font-black text-white shadow-sm ring-2 ring-white">
                    {globalIndex + 1}
                  </span>
                )}
              </>
            )}
          </div>
        )
      })}

      {showCropMarks && (
        <svg
          aria-hidden
          className="pointer-events-none absolute inset-0"
          viewBox={`0 0 ${A4_WIDTH_MM} ${A4_HEIGHT_MM}`}
          width={`${A4_WIDTH_MM}mm`}
          height={`${A4_HEIGHT_MM}mm`}
        >
          {segments.map((s, i) => (
            <line
              key={i}
              x1={s.x1}
              y1={s.y1}
              x2={s.x2}
              y2={s.y2}
              stroke="#334155"
              strokeWidth={0.15}
              strokeLinecap="square"
            />
          ))}
        </svg>
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Pages destinées à l'impression directe (rendu à l'échelle 1:1 en mm)       */
/* -------------------------------------------------------------------------- */

export function IdCardPrintPages<T extends SheetStudent>({
  pages,
  layout,
  designWidth,
  renderCard,
  showCropMarks,
}: {
  pages: T[][]
  layout: PaperLayout
  designWidth: number
  renderCard: (student: T, globalIndex: number) => React.ReactNode
  showCropMarks: boolean
}) {
  return (
    <>
      {pages.map((cards, pageIdx) => (
        <IdCardA4Page
          key={pageIdx}
          cards={cards}
          layout={layout}
          designWidth={designWidth}
          renderCard={renderCard}
          globalOffset={pageIdx * ID_CARDS_PER_PAGE}
          showCropMarks={showCropMarks}
          forPrint
        />
      ))}
    </>
  )
}

/** Construit les pages selon le mode (carte unitaire / planche / carte d'exemple répétée). */
export function buildPaperPages<T extends SheetStudent>(
  layout: PaperLayout,
  students: T[],
  singleStudent: T,
  useSampleCard: boolean
): T[][] {
  if (layout === 'single') return [[singleStudent]]
  if (useSampleCard) return [Array.from({ length: ID_CARDS_PER_PAGE }, () => singleStudent)]
  return paginateIdCards(students)
}

/* -------------------------------------------------------------------------- */
/*  APERÇU PAPIER COMPLET (bureau + feuille A4 + panneau latéral)              */
/* -------------------------------------------------------------------------- */

interface PreviewProps<T extends SheetStudent> {
  students: T[]
  singleStudent: T
  layout: PaperLayout
  onLayoutChange: (layout: PaperLayout) => void
  designWidth: number
  renderCard: (student: T, globalIndex: number) => React.ReactNode
  templateLabel: string
  showCropMarks: boolean
  onShowCropMarksChange: (v: boolean) => void
  showSlotNumbers: boolean
  onShowSlotNumbersChange: (v: boolean) => void
  showMmGrid: boolean
  onShowMmGridChange: (v: boolean) => void
  useSampleCard: boolean
  activeStudentId?: string
  onSelectStudent: (id: string) => void
  zoom: PaperZoom
  onZoomChange: (zoom: PaperZoom) => void
  onEffectiveZoomChange?: (zoom: number) => void
  onDownloadPdf: () => void
  onPrint: () => void
  isGenerating: boolean
  isPrinting: boolean
}

const ZOOM_PRESETS: { value: PaperZoom; label: string }[] = [
  { value: 0.5, label: '50%' },
  { value: 0.75, label: '75%' },
  { value: 1, label: '100%' },
  { value: 'fit', label: 'Ajuster' },
]

export function SchoolIdCardPrintSheetPreview<T extends SheetStudent>({
  students,
  singleStudent,
  layout,
  onLayoutChange,
  designWidth,
  renderCard,
  templateLabel,
  showCropMarks,
  onShowCropMarksChange,
  showSlotNumbers,
  onShowSlotNumbersChange,
  showMmGrid,
  onShowMmGridChange,
  useSampleCard,
  activeStudentId,
  onSelectStudent,
  zoom,
  onZoomChange,
  onEffectiveZoomChange,
  onDownloadPdf,
  onPrint,
  isGenerating,
  isPrinting,
}: PreviewProps<T>) {
  const pages = useMemo(
    () => buildPaperPages(layout, students, singleStudent, useSampleCard),
    [layout, students, singleStudent, useSampleCard]
  )
  const [currentPage, setCurrentPage] = useState(0)
  const safePage = Math.min(currentPage, Math.max(0, pages.length - 1))

  // Toujours afficher la page contenant l'élève actif quand on change d'élève depuis l'atelier
  useEffect(() => {
    if (layout !== 'sheet' || useSampleCard || !activeStudentId) return
    const idx = students.findIndex((s) => s.id === activeStudentId)
    if (idx >= 0) setCurrentPage(Math.floor(idx / ID_CARDS_PER_PAGE))
  }, [activeStudentId, layout, useSampleCard, students])

  const deskRef = useRef<HTMLDivElement | null>(null)
  const [fitZoom, setFitZoom] = useState(0.7)
  useEffect(() => {
    const el = deskRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width || 0
      if (w > 0) setFitZoom(Math.max(0.3, Math.min(1.25, (w - 48) / A4_WIDTH_PX)))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const effectiveZoom = zoom === 'fit' ? fitZoom : zoom
  useEffect(() => {
    onEffectiveZoomChange?.(effectiveZoom)
  }, [effectiveZoom, onEffectiveZoomChange])

  const pageCards = pages[safePage] || []
  const globalOffset = layout === 'sheet' && !useSampleCard ? safePage * ID_CARDS_PER_PAGE : 0
  const totalCards = layout === 'single' ? 1 : useSampleCard ? ID_CARDS_PER_PAGE : students.length
  const readyCount =
    layout === 'single'
      ? Number(isStudentComplete(singleStudent))
      : useSampleCard
        ? (isStudentComplete(singleStudent) ? ID_CARDS_PER_PAGE : 0)
        : students.filter(isStudentComplete).length
  const incompleteCount = totalCards - readyCount

  const pageRangeLabel = (pIdx: number) => {
    const count = pages[pIdx]?.length || 0
    if (layout === 'single') return 'Carte unitaire centrée'
    if (useSampleCard) return "Carte d'exemple × 10"
    const start = pIdx * ID_CARDS_PER_PAGE + 1
    return `Cartes ${start}–${start + count - 1}`
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_272px] gap-4 items-start">
      {/* BUREAU + FEUILLE A4 */}
      <div className="rounded-2xl border border-slate-800 bg-[#1F2430] shadow-[0_10px_30px_-12px_rgba(15,23,42,0.45)] overflow-hidden">
        {/* Barre d'outils de la vue papier */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-[#171B24] px-3 py-2 text-white">
          <div className="flex items-center gap-1.5">
            <div className="flex items-center rounded-lg bg-white/5 p-0.5 ring-1 ring-white/10">
              <button
                type="button"
                onClick={() => onLayoutChange('single')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 transition-colors ${
                  layout === 'single' ? 'bg-white text-slate-900' : 'text-slate-300 hover:text-white'
                }`}
              >
                <IdCard className="h-3.5 w-3.5" />
                Carte unitaire
              </button>
              <button
                type="button"
                onClick={() => onLayoutChange('sheet')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 transition-colors ${
                  layout === 'sheet' ? 'bg-white text-slate-900' : 'text-slate-300 hover:text-white'
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                Feuille A4 (10 cartes)
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={safePage <= 0}
              onClick={() => setCurrentPage(Math.max(0, safePage - 1))}
              className="p-1.5 rounded-md bg-white/5 ring-1 ring-white/10 text-slate-200 hover:bg-white/10 disabled:opacity-30"
              title="Page précédente"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span className="text-[11px] font-bold text-slate-200 min-w-[150px] text-center">
              Page {safePage + 1} / {pages.length}{' '}
              <span className="text-slate-400 font-semibold">({pageRangeLabel(safePage)})</span>
            </span>
            <button
              type="button"
              disabled={safePage >= pages.length - 1}
              onClick={() => setCurrentPage(Math.min(pages.length - 1, safePage + 1))}
              className="p-1.5 rounded-md bg-white/5 ring-1 ring-white/10 text-slate-200 hover:bg-white/10 disabled:opacity-30"
              title="Page suivante"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex items-center rounded-lg bg-white/5 p-0.5 ring-1 ring-white/10">
            {ZOOM_PRESETS.map((z) => {
              const active = zoom === z.value
              return (
                <button
                  key={String(z.value)}
                  type="button"
                  onClick={() => onZoomChange(z.value)}
                  className={`px-2 py-1 rounded-md text-[10.5px] font-bold flex items-center gap-1 transition-colors ${
                    active ? 'bg-amber-300 text-slate-950' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {z.value === 'fit' && <Maximize2 className="h-3 w-3" />}
                  {z.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Surface du bureau */}
        <div
          ref={deskRef}
          className="relative max-h-[78vh] overflow-auto p-6"
          style={{
            backgroundImage:
              'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)',
            backgroundSize: '18px 18px',
          }}
        >
          <div
            className="mx-auto"
            style={{ width: A4_WIDTH_PX * effectiveZoom, height: A4_HEIGHT_PX * effectiveZoom }}
          >
            <div
              className="shadow-[0_24px_60px_-18px_rgba(0,0,0,0.65),0_2px_6px_rgba(0,0,0,0.35)]"
              style={{
                width: A4_WIDTH_PX,
                height: A4_HEIGHT_PX,
                transform: `scale(${effectiveZoom})`,
                transformOrigin: 'top left',
              }}
            >
              <IdCardA4Page
                cards={pageCards}
                layout={layout}
                designWidth={designWidth}
                renderCard={renderCard}
                globalOffset={globalOffset}
                showCropMarks={showCropMarks}
                showSlotNumbers={showSlotNumbers}
                showMmGrid={showMmGrid}
                activeStudentId={activeStudentId}
                onSelectStudent={useSampleCard || layout === 'single' ? undefined : onSelectStudent}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 bg-[#171B24] px-3 py-1.5 text-[10.5px] font-semibold text-slate-400">
          <span>
            A4 Portrait 210 × 297 mm • Cartes {ID_CARD_WIDTH_MM} × {String(ID_CARD_HEIGHT_MM).replace('.', ',')} mm • {templateLabel}
          </span>
          <span>Cliquez sur une carte pour l&apos;éditer immédiatement</span>
        </div>
      </div>

      {/* PANNEAU LATÉRAL */}
      <aside className="space-y-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <FileStack className="h-3.5 w-3.5 text-indigo-600" />
              Pages ({pages.length})
            </span>
            <span className="text-[10.5px] font-bold text-slate-400">
              {totalCards} carte{totalCards > 1 ? 's' : ''}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 max-h-[230px] overflow-y-auto pr-0.5">
            {pages.map((cards, pIdx) => {
              const active = pIdx === safePage
              return (
                <button
                  key={pIdx}
                  type="button"
                  onClick={() => setCurrentPage(pIdx)}
                  className={`group flex flex-col items-center gap-1 rounded-lg p-1 transition-colors ${
                    active ? 'bg-indigo-50 ring-2 ring-indigo-500' : 'hover:bg-slate-50 ring-1 ring-slate-200'
                  }`}
                  title={pageRangeLabel(pIdx)}
                >
                  <div className="relative w-full aspect-[210/297] bg-white rounded-[3px] shadow-sm ring-1 ring-slate-200 overflow-hidden">
                    {cards.map((st, i) => {
                      const pos =
                        layout === 'single'
                          ? SINGLE_CARD_POSITION_MM
                          : getIdCardSlot(i)
                      return (
                        <div
                          key={`${st.id}-${i}`}
                          className={`absolute rounded-[1px] overflow-hidden flex items-center gap-[1px] ${
                            st.avatar_url ? 'bg-rose-100' : 'bg-amber-100'
                          }`}
                          style={{
                            left: `${(pos.x / A4_WIDTH_MM) * 100}%`,
                            top: `${(pos.y / A4_HEIGHT_MM) * 100}%`,
                            width: `${(ID_CARD_WIDTH_MM / A4_WIDTH_MM) * 100}%`,
                            height: `${(ID_CARD_HEIGHT_MM / A4_HEIGHT_MM) * 100}%`,
                          }}
                        >
                          {st.avatar_url ? (
                            <img src={st.avatar_url} alt="" className="h-full w-[28%] object-cover" />
                          ) : (
                            <span className="h-full w-[28%] bg-amber-300/70" />
                          )}
                          <span className="flex-1 space-y-[1px] pr-[2px]">
                            <span className="block h-[2px] rounded bg-slate-400/70" />
                            <span className="block h-[2px] w-2/3 rounded bg-slate-300" />
                          </span>
                        </div>
                      )
                    })}
                  </div>
                  <span className={`text-[10px] font-bold ${active ? 'text-indigo-700' : 'text-slate-500'}`}>
                    Page {pIdx + 1}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-2xs space-y-2">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
            Résumé avant tirage
          </span>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 px-2.5 py-2">
              <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                <CheckCircle2 className="h-3 w-3" /> Prêtes
              </div>
              <div className="text-lg font-black text-emerald-900 leading-tight">{readyCount}</div>
            </div>
            <div
              className={`rounded-xl border px-2.5 py-2 ${
                incompleteCount > 0 ? 'border-amber-200 bg-amber-50/70' : 'border-slate-200 bg-slate-50'
              }`}
            >
              <div
                className={`flex items-center gap-1 text-[10px] font-bold ${
                  incompleteCount > 0 ? 'text-amber-700' : 'text-slate-500'
                }`}
              >
                <AlertTriangle className="h-3 w-3" /> Incomplètes
              </div>
              <div
                className={`text-lg font-black leading-tight ${
                  incompleteCount > 0 ? 'text-amber-900' : 'text-slate-700'
                }`}
              >
                {incompleteCount}
              </div>
            </div>
          </div>
          <p className="text-[10.5px] text-slate-500 leading-snug">
            Une carte est « prête » lorsqu&apos;elle a une photo, une date et un lieu de naissance et le sexe renseignés.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-2xs space-y-1.5">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
            Repères d&apos;impression
          </span>
          <PaperToggle checked={showCropMarks} onChange={onShowCropMarksChange} icon={Scissors} label="Traits de coupe" />
          <PaperToggle checked={showSlotNumbers} onChange={onShowSlotNumbersChange} icon={Hash} label="Numéros d'emplacement" />
          <PaperToggle checked={showMmGrid} onChange={onShowMmGridChange} icon={Grid3x3} label="Quadrillage 10 mm" />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-2xs space-y-2">
          <button
            type="button"
            disabled={isGenerating || totalCards === 0}
            onClick={onDownloadPdf}
            className="w-full px-3 py-2.5 rounded-xl bg-gradient-to-r from-[#1E293B] via-[#312E81] to-[#4338CA] text-white text-xs font-extrabold shadow-md hover:opacity-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin text-amber-300" />
            ) : (
              <Download className="h-4 w-4 text-amber-300" />
            )}
            {layout === 'single' ? 'Télécharger la carte (PDF A4)' : 'Télécharger PDF A4 (10/page)'}
          </button>
          <button
            type="button"
            disabled={isPrinting || totalCards === 0}
            onClick={onPrint}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-900 text-xs font-extrabold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isPrinting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4 text-indigo-600" />}
            Imprimer directement
          </button>
          <p className="text-[10px] text-slate-400 leading-snug text-center">
            Astuce : réglez l&apos;imprimante sur « Taille réelle / 100 % » et désactivez « Ajuster à la page ».
          </p>
        </div>
      </aside>
    </div>
  )
}
