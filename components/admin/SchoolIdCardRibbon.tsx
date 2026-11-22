'use client'

import React, { useMemo } from 'react'
import {
  AlertTriangle,
  Bold,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Eye,
  FileSpreadsheet,
  Filter,
  Grid3x3,
  Hash,
  IdCard,
  Image as ImageIcon,
  Italic,
  LayoutGrid,
  Loader2,
  Minus,
  Palette,
  PenTool,
  Phone,
  Plus,
  Printer,
  QrCode,
  RotateCcw,
  Save,
  Scissors,
  Sparkles,
  Stamp,
  Trash2,
  Type,
  Underline,
  Upload,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import type {
  CardFontFamily,
  CardTypographyConfig,
  CardZoneTextStyle,
} from '@/lib/pdf/student-documents'
import type { CardThemeOption } from '@/components/admin/SchoolIdCardStudioModal'
import type { PaperLayout } from '@/components/admin/SchoolIdCardPrintSheetPreview'
import {
  FALLBACK_TOGO_TYPOGRAPHY,
  generateQrMatrix,
  sanitizeIeppText,
  type CardTemplateId,
} from '@/lib/pdf/togo-iepp-card'

export type StudioRibbonTab = 'accueil' | 'typo' | 'couleurs' | 'medias' | 'impression'
export type StudioViewMode = 'edit' | 'paper'
export type PalettePresetId = 'togo_official' | 'classic_institutional' | 'noir_or'

export type RibbonTypographyZoneKey =
  | 'schoolName'
  | 'headerOfficial'
  | 'examCenter'
  | 'bannerTitle'
  | 'studentMatricule'
  | 'studentName'
  | 'studentDetails'
  | 'studentClass'
  | 'footerInfo'

export type RibbonLetterColorFieldKey =
  | 'ministryAcronym'
  | 'schoolName'
  | 'inspectionName'
  | 'bannerTitle'
  | 'examCenter'
  | 'republicTitle'

interface FontOption {
  value: CardFontFamily
  label: string
}

interface ZoneMeta {
  key: RibbonTypographyZoneKey
  label: string
  basePt: number
}

interface ColorPreset {
  hex: string
  name: string
}

export interface PreflightSummary {
  totalSelected: number
  photosReady: number
  infoComplete: number
  hasIeppAndCenter: boolean
  hasStampOrSignature: boolean
  incompleteStudentsCount: number
}

interface Props {
  activeTab: StudioRibbonTab
  onTabChange: (tab: StudioRibbonTab) => void
  collapsed: boolean
  onToggleCollapse: () => void

  // Vue & Barre d'accès rapide
  viewMode: StudioViewMode
  onViewModeChange: (mode: StudioViewMode) => void
  hasUnsavedChanges: boolean
  isSaving: boolean
  onQuickSave: () => void
  onQuickPrint: () => void
  previewZoom: number
  onZoomChange: (zoom: number) => void
  onQuickExportSingle?: () => void
  onQuickExportBatch?: () => void
  isGenerating: boolean
  selectedCount: number

  // Modèle
  cardTemplate: CardTemplateId
  onSelectTemplate: (tpl: CardTemplateId) => void

  // Textes & Contacts QR
  ministryAcronym: string
  onMinistryAcronymChange: (v: string) => void
  inspectionName: string
  onInspectionNameChange: (v: string) => void
  schoolName: string
  onSchoolNameChange: (v: string) => void
  examCenter: string
  onExamCenterChange: (v: string) => void
  academicYear: string
  onAcademicYearChange: (v: string) => void
  directorName: string
  onDirectorNameChange: (v: string) => void
  schoolPhone: string
  onSchoolPhoneChange: (v: string) => void
  directorPhone: string
  onDirectorPhoneChange: (v: string) => void
  cardBannerTitle: string
  onCardBannerTitleChange: (v: string) => void
  republicTitle: string
  onRepublicTitleChange: (v: string) => void
  republicMotto: string
  onRepublicMottoChange: (v: string) => void

  // Typographie
  typographyConfig: CardTypographyConfig
  activeTypoZone: RibbonTypographyZoneKey
  onActiveTypoZoneChange: (key: RibbonTypographyZoneKey) => void
  zoneTabs: ZoneMeta[]
  fontOptions: FontOption[]
  quickColorPalette: ColorPreset[]
  bannerBgPalette: ColorPreset[]
  onUpdateZoneTypography: (key: RibbonTypographyZoneKey, patch: Partial<CardZoneTextStyle>) => void
  onApplyFontFamilyToAll: (fontFamily: CardFontFamily) => void
  onSetBannerBgColor: (hex: string) => void
  onResetTypography: () => void
  onApplyPalettePreset: (preset: PalettePresetId) => void

  // Couleur lettre par lettre
  letterColorField: RibbonLetterColorFieldKey
  onLetterColorFieldChange: (field: RibbonLetterColorFieldKey) => void
  selectedLetterIndex: number
  onSelectLetterIndex: (idx: number) => void
  activeLetterText: string
  activeLetterColors: string[]
  letterFallbackColor: string
  onSetLetterColor: (hex: string) => void
  onResetFieldLetterColors: (field: RibbonLetterColorFieldKey) => void

  // Médias, Thèmes & Inspecteur QR
  logoUrl: string
  stampUrl: string
  signatureUrl: string
  uploadingAssetType: 'logo' | 'stamp' | 'signature' | null
  showVectorEmblemIfNoLogo: boolean
  onToggleVectorEmblem: (checked: boolean) => void
  showVectorStampAuto: boolean
  onToggleVectorStampAuto: (checked: boolean) => void
  onUploadAsset: (type: 'logo' | 'stamp' | 'signature', file?: File | null) => void
  onClearAsset: (type: 'logo' | 'stamp' | 'signature') => void
  activeThemeIndex: number
  allThemes: CardThemeOption[]
  onPrevTheme: () => void
  onNextTheme: () => void
  onUploadCustomTheme: (file?: File | null) => void
  qrPayloadPreview: string

  // Onglet 5 : Mise en page & Impression A4
  paperLayout: PaperLayout
  onPaperLayoutChange: (layout: PaperLayout) => void
  showCropMarks: boolean
  onShowCropMarksChange: (v: boolean) => void
  showSlotNumbers: boolean
  onShowSlotNumbersChange: (v: boolean) => void
  showMmGrid: boolean
  onShowMmGridChange: (v: boolean) => void
  useSampleCardOnSheet: boolean
  onUseSampleCardOnSheetChange: (v: boolean) => void
  onlyWithPhotoForPrint: boolean
  onOnlyWithPhotoForPrintChange: (v: boolean) => void
  preflight: PreflightSummary
  onShowIncompleteStudents: () => void
}

const RIBBON_TABS: {
  id: StudioRibbonTab
  label: string
  shortLabel: string
  icon: React.ComponentType<{ className?: string }>
}[] = [
  { id: 'accueil', label: 'Accueil & Données', shortLabel: 'Accueil', icon: IdCard },
  { id: 'typo', label: 'Typographie', shortLabel: 'Typo', icon: Type },
  { id: 'couleurs', label: 'Couleurs & Effets', shortLabel: 'Couleurs', icon: Palette },
  { id: 'medias', label: 'Médias & Sécurité QR', shortLabel: 'Médias & QR', icon: ImageIcon },
  { id: 'impression', label: 'Mise en page & Impression A4', shortLabel: 'Impression A4', icon: LayoutGrid },
]

const PALETTE_PRESETS: {
  id: PalettePresetId
  label: string
  desc: string
  swatches: string[]
}[] = [
  {
    id: 'togo_official',
    label: 'Officiel Togo IEPP',
    desc: 'Rouge, Bleu, Vert & Bordeaux',
    swatches: ['#9E053F', '#006B38', '#C8102E', '#1D4ED8'],
  },
  {
    id: 'classic_institutional',
    label: 'Classique Institutionnel',
    desc: 'Marine, Rouge & Or',
    swatches: ['#0F1D5F', '#B41218', '#122AB9', '#B45309'],
  },
  {
    id: 'noir_or',
    label: 'Sobre Noir & Or',
    desc: 'Anthracite, Or & Émeraude',
    swatches: ['#0F172A', '#B45309', '#334155', '#006B38'],
  },
]

function buildQrSvgPath(matrix: boolean[][]): string {
  const parts: string[] = []
  for (let r = 0; r < matrix.length; r++) {
    let c = 0
    while (c < matrix.length) {
      if (matrix[r][c]) {
        const start = c
        while (c < matrix.length && matrix[r][c]) c++
        parts.push(`M${start} ${r}h${c - start}v1h-${c - start}z`)
      } else {
        c++
      }
    }
  }
  return parts.join('')
}

function RibbonGroup({
  title,
  className = '',
  children,
}: {
  title: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={`flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white/90 px-3 pt-2.5 pb-1.5 shadow-[0_1px_2px_rgba(15,23,42,0.03)] ${className}`}
    >
      <div className="flex-1">{children}</div>
      <div className="mt-2 pt-1 border-t border-slate-100 text-center text-[9px] font-extrabold uppercase tracking-[0.14em] text-slate-400">
        {title}
      </div>
    </div>
  )
}

export function SchoolIdCardRibbon({
  activeTab,
  onTabChange,
  collapsed,
  onToggleCollapse,
  viewMode,
  onViewModeChange,
  hasUnsavedChanges,
  isSaving,
  onQuickSave,
  onQuickPrint,
  previewZoom,
  onZoomChange,
  onQuickExportSingle,
  onQuickExportBatch,
  isGenerating,
  selectedCount,
  cardTemplate,
  onSelectTemplate,
  ministryAcronym,
  onMinistryAcronymChange,
  inspectionName,
  onInspectionNameChange,
  schoolName,
  onSchoolNameChange,
  examCenter,
  onExamCenterChange,
  academicYear,
  onAcademicYearChange,
  directorName,
  onDirectorNameChange,
  schoolPhone,
  onSchoolPhoneChange,
  directorPhone,
  onDirectorPhoneChange,
  cardBannerTitle,
  onCardBannerTitleChange,
  republicTitle,
  onRepublicTitleChange,
  republicMotto,
  onRepublicMottoChange,
  typographyConfig,
  activeTypoZone,
  onActiveTypoZoneChange,
  zoneTabs,
  fontOptions,
  quickColorPalette,
  bannerBgPalette,
  onUpdateZoneTypography,
  onApplyFontFamilyToAll,
  onSetBannerBgColor,
  onResetTypography,
  onApplyPalettePreset,
  letterColorField,
  onLetterColorFieldChange,
  selectedLetterIndex,
  onSelectLetterIndex,
  activeLetterText,
  activeLetterColors,
  letterFallbackColor,
  onSetLetterColor,
  onResetFieldLetterColors,
  logoUrl,
  stampUrl,
  signatureUrl,
  uploadingAssetType,
  showVectorEmblemIfNoLogo,
  onToggleVectorEmblem,
  showVectorStampAuto,
  onToggleVectorStampAuto,
  onUploadAsset,
  onClearAsset,
  activeThemeIndex,
  allThemes,
  onPrevTheme,
  onNextTheme,
  onUploadCustomTheme,
  qrPayloadPreview,
  paperLayout,
  onPaperLayoutChange,
  showCropMarks,
  onShowCropMarksChange,
  showSlotNumbers,
  onShowSlotNumbersChange,
  showMmGrid,
  onShowMmGridChange,
  useSampleCardOnSheet,
  onUseSampleCardOnSheetChange,
  onlyWithPhotoForPrint,
  onOnlyWithPhotoForPrintChange,
  preflight,
  onShowIncompleteStudents,
}: Props) {
  const currentZoneMeta = zoneTabs.find((z) => z.key === activeTypoZone) || zoneTabs[0]
  const currentZoneStyle: CardZoneTextStyle =
    typographyConfig[activeTypoZone] || FALLBACK_TOGO_TYPOGRAPHY[activeTypoZone]!

  const safeSelectedIdx = Math.min(
    Math.max(0, selectedLetterIndex),
    Math.max(0, activeLetterText.length - 1)
  )
  const selectedChar = activeLetterText[safeSelectedIdx] || ''
  const selectedCharColor = activeLetterColors[safeSelectedIdx] || letterFallbackColor

  const qrMatrix = useMemo(() => generateQrMatrix(qrPayloadPreview), [qrPayloadPreview])
  const qrPath = useMemo(() => buildQrSvgPath(qrMatrix), [qrMatrix])
  const qrLines = useMemo(
    () => qrPayloadPreview.split('\n').filter(Boolean),
    [qrPayloadPreview]
  )

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white shadow-[0_4px_16px_-6px_rgba(15,23,42,0.12)] overflow-hidden">
      {/* A. BARRE D'ACCÈS RAPIDE (QUICK ACCESS TOOLBAR — STYLE OFFICE / AFFINITY) */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-[#0B1120] px-3.5 py-2 text-white border-b border-white/10">
        {/* Gauche : Badge modèle actif + statut enregistrement */}
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10.5px] font-extrabold ring-1 ${
              cardTemplate === 'togo_iepp'
                ? 'bg-rose-500/15 text-rose-200 ring-rose-400/30'
                : 'bg-indigo-500/20 text-indigo-200 ring-indigo-400/30'
            }`}
          >
            <IdCard className="h-3.5 w-3.5" />
            {cardTemplate === 'togo_iepp' ? 'Modèle 2 : Officiel IEPP' : 'Modèle 1 : Classique'}
          </span>

          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
              hasUnsavedChanges
                ? 'bg-amber-400/15 text-amber-200 ring-1 ring-amber-400/30'
                : 'bg-emerald-400/15 text-emerald-200 ring-1 ring-emerald-400/30'
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                hasUnsavedChanges ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'
              }`}
            />
            {hasUnsavedChanges ? 'Modifications non enregistrées' : 'Enregistré'}
          </span>
        </div>

        {/* Droite : Bascule Édition / Papier A4 + Actions rapides */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="flex items-center rounded-lg bg-white/10 p-0.5 ring-1 ring-white/15">
            <button
              type="button"
              onClick={() => onViewModeChange('edit')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-extrabold flex items-center gap-1 transition-all ${
                viewMode === 'edit'
                  ? 'bg-white text-slate-950 shadow-xs'
                  : 'text-slate-200 hover:text-white'
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Édition Carte</span>
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('paper')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-extrabold flex items-center gap-1 transition-all ${
                viewMode === 'paper'
                  ? 'bg-amber-300 text-slate-950 shadow-xs'
                  : 'text-slate-200 hover:text-white'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Aperçu Papier A4</span>
            </button>
          </div>

          <button
            type="button"
            disabled={isSaving}
            onClick={onQuickSave}
            className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] font-bold text-white flex items-center gap-1 transition-colors disabled:opacity-50"
            title="Enregistrer les réglages et l'élève actif (Ctrl+S)"
          >
            {isSaving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-300" />
            ) : (
              <Save className="h-3.5 w-3.5 text-emerald-300" />
            )}
            <span className="hidden md:inline">Enregistrer</span>
          </button>

          {onQuickExportSingle && (
            <button
              type="button"
              disabled={isGenerating}
              onClick={onQuickExportSingle}
              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] font-bold text-white flex items-center gap-1 transition-colors disabled:opacity-50"
              title="Exporter uniquement la carte de l'élève actif en PDF"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-sky-300" />
              <span className="hidden lg:inline">Carte PDF</span>
            </button>
          )}

          {onQuickExportBatch && (
            <button
              type="button"
              disabled={isGenerating || selectedCount === 0}
              onClick={onQuickExportBatch}
              className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-[11px] font-extrabold text-slate-950 flex items-center gap-1 transition-colors disabled:opacity-50"
              title="Générer la planche PDF A4 (10 cartes/page)"
            >
              {isGenerating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              <span>Planche A4 ({selectedCount})</span>
            </button>
          )}

          <button
            type="button"
            disabled={selectedCount === 0}
            onClick={onQuickPrint}
            className="px-2.5 py-1 rounded-lg bg-indigo-500/80 hover:bg-indigo-500 text-[11px] font-bold text-white flex items-center gap-1 transition-colors disabled:opacity-50"
            title="Imprimer directement la planche A4"
          >
            <Printer className="h-3.5 w-3.5 text-amber-200" />
            <span className="hidden sm:inline">Imprimer</span>
          </button>
        </div>
      </div>

      {/* B. BARRE D'ONGLETS DU RUBAN (5 ONGLETS STRUCTURÉS) */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-gradient-to-r from-[#131C31] via-[#1E293B] to-[#2E2A6E] px-3 pt-1.5 text-white">
        <div className="flex items-end gap-1 overflow-x-auto no-scrollbar">
          {RIBBON_TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id && !collapsed
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  if (activeTab === tab.id && collapsed) {
                    onToggleCollapse()
                  } else {
                    onTabChange(tab.id)
                    if (collapsed) onToggleCollapse()
                  }
                }}
                onDoubleClick={onToggleCollapse}
                title="Cliquer pour ouvrir • Double-cliquer pour réduire/déplier le ruban"
                className={`px-3.5 py-2 rounded-t-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-slate-50 text-indigo-950 shadow-sm'
                    : 'text-slate-200 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-indigo-600' : 'text-amber-300'}`} />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.shortLabel}</span>
              </button>
            )
          })}
        </div>

        {/* Contrôles Zoom rapide & Réduire le ruban */}
        <div className="flex items-center gap-1.5 pb-1">
          {viewMode === 'edit' && (
            <div className="hidden sm:flex items-center gap-0.5 rounded-lg bg-white/10 px-1.5 py-0.5 ring-1 ring-white/15">
              <button
                type="button"
                onClick={() => onZoomChange(Math.max(0.75, Number((previewZoom - 0.1).toFixed(2))))}
                className="p-1 text-slate-200 hover:text-white rounded"
                title="Dézoomer l'aperçu"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <span className="text-[10.5px] font-mono font-bold px-1 min-w-[38px] text-center text-amber-200">
                {Math.round(previewZoom * 100)}%
              </span>
              <button
                type="button"
                onClick={() => onZoomChange(Math.min(1.3, Number((previewZoom + 0.1).toFixed(2))))}
                className="p-1 text-slate-200 hover:text-white rounded"
                title="Zoomer l'aperçu"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={onToggleCollapse}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition-colors"
            title={collapsed ? 'Déplier le ruban outils' : 'Réduire le ruban outils'}
          >
            {collapsed ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* C. CORPS DU RUBAN ACTIF */}
      {!collapsed && (
        <div className="bg-slate-50/95 border-t border-slate-200/80 px-3 py-3">
          {/* ONGLET 1 : ACCUEIL & DONNÉES */}
          {activeTab === 'accueil' && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-2.5 items-stretch">
              <RibbonGroup title="Modèle de carte (2 au choix)" className="xl:col-span-3">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => onSelectTemplate('classic')}
                    className={`rounded-xl border p-2 text-left transition-all flex flex-col gap-1.5 ${
                      cardTemplate === 'classic'
                        ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-600/20'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="w-full h-9 rounded p-[2px] bg-[#007A33] overflow-hidden">
                      <div className="h-full w-full rounded-[2px] border border-[#FFCE00] bg-[#EEF4FA] p-1 flex flex-col justify-between">
                        <span className="h-1 w-8 rounded-full bg-red-600 mx-auto" />
                        <span className="h-1.5 w-full rounded-xs bg-[#FDE0C6]" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[11px] font-extrabold text-slate-900 truncate">
                        1. Classique
                      </span>
                      {cardTemplate === 'classic' && (
                        <span className="h-2 w-2 rounded-full bg-indigo-600 shrink-0" />
                      )}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => onSelectTemplate('togo_iepp')}
                    className={`rounded-xl border p-2 text-left transition-all flex flex-col gap-1.5 ${
                      cardTemplate === 'togo_iepp'
                        ? 'border-[#9E053F] bg-rose-50/60 ring-2 ring-[#9E053F]/20'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="w-full h-9 rounded border border-slate-300 bg-[#FFFDF9] p-1 flex flex-col justify-between relative overflow-hidden">
                      <div className="flex items-center justify-between">
                        <span className="h-2 w-2 rounded-full bg-amber-400" />
                        <span className="h-1.5 w-8 rounded-full bg-[#9E053F]" />
                        <span className="h-2 w-3 bg-gradient-to-b from-[#006C3E] via-[#FACC15] to-[#006C3E]" />
                      </div>
                      <span className="h-1 w-10 mx-auto rounded-full bg-[#006B38]" />
                    </div>
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[11px] font-extrabold text-slate-900 truncate">
                        2. Officiel IEPP
                      </span>
                      {cardTemplate === 'togo_iepp' && (
                        <span className="h-2 w-2 rounded-full bg-[#9E053F] shrink-0" />
                      )}
                    </div>
                  </button>
                </div>
              </RibbonGroup>

              <RibbonGroup title="Établissement & Circonscription" className="xl:col-span-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <label className="block text-[10.5px] font-bold text-slate-700">
                        {cardTemplate === 'togo_iepp' ? "Nom de l'IEPP" : 'Inspection / IEPP'}
                      </label>
                      {inspectionName.trim() && (
                        <button
                          type="button"
                          onClick={() => onInspectionNameChange('')}
                          className="text-[9.5px] font-bold text-slate-500 hover:text-red-600"
                        >
                          Effacer
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={inspectionName}
                      onChange={(e) =>
                        onInspectionNameChange(
                          cardTemplate === 'togo_iepp'
                            ? sanitizeIeppText(e.target.value)
                            : e.target.value
                        )
                      }
                      placeholder="Ex : IEPP LACS-OUEST"
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-extrabold text-[#0E1B52] focus:border-indigo-600 outline-none"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <label className="block text-[10.5px] font-bold text-slate-700">
                        Centre d&apos;Écrit
                      </label>
                      {examCenter.trim() && (
                        <button
                          type="button"
                          onClick={() => onExamCenterChange('')}
                          className="text-[9.5px] font-bold text-amber-700 hover:underline"
                          title="Afficher des pointillés à compléter plus tard"
                        >
                          Pointillés
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={examCenter}
                      onChange={(e) => onExamCenterChange(e.target.value)}
                      placeholder="Vide = .... (à compléter)"
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-blue-950 focus:border-indigo-600 outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10.5px] font-bold text-slate-700 mb-0.5">
                      Nom de l&apos;Établissement
                    </label>
                    <input
                      type="text"
                      value={schoolName}
                      onChange={(e) => onSchoolNameChange(e.target.value)}
                      placeholder="Nom officiel de l'école"
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-extrabold uppercase text-[#9E053F] focus:border-indigo-600 outline-none"
                    />
                  </div>
                </div>
              </RibbonGroup>

              <RibbonGroup title="Direction & Contacts QR" className="xl:col-span-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-700 mb-0.5">
                      Année Scolaire
                    </label>
                    <input
                      type="text"
                      value={academicYear}
                      onChange={(e) => onAcademicYearChange(e.target.value)}
                      placeholder="2026-2027"
                      className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-bold text-red-800 focus:border-indigo-600 outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10.5px] font-bold text-slate-700 mb-0.5">
                      Chef d&apos;établissement (Directeur)
                    </label>
                    <input
                      type="text"
                      value={directorName}
                      onChange={(e) => onDirectorNameChange(e.target.value)}
                      placeholder="Nom du Directeur"
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-[#99121C] focus:border-indigo-600 outline-none"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-1 text-[10.5px] font-bold text-slate-700 mb-0.5">
                      <Phone className="h-3 w-3 text-emerald-600" />
                      Tél. École (QR)
                    </label>
                    <input
                      type="tel"
                      value={schoolPhone}
                      onChange={(e) => onSchoolPhoneChange(e.target.value)}
                      placeholder="+228 90 00 00 00"
                      className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold text-slate-900 focus:border-indigo-600 outline-none"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-1 text-[10.5px] font-bold text-slate-700 mb-0.5">
                      <Phone className="h-3 w-3 text-indigo-600" />
                      Tél. Directeur (QR)
                    </label>
                    <input
                      type="tel"
                      value={directorPhone}
                      onChange={(e) => onDirectorPhoneChange(e.target.value)}
                      placeholder="+228 91 00 00 00"
                      className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold text-slate-900 focus:border-indigo-600 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-700 mb-0.5">
                      Titre de la Carte
                    </label>
                    <input
                      type="text"
                      value={cardBannerTitle}
                      onChange={(e) => onCardBannerTitleChange(e.target.value)}
                      placeholder="CARTE D'IDENTITÉ SCOLAIRE"
                      className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-bold text-blue-950 focus:border-indigo-600 outline-none"
                    />
                  </div>
                </div>

                {cardTemplate === 'classic' && (
                  <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-slate-100">
                    <input
                      type="text"
                      value={ministryAcronym}
                      onChange={(e) => onMinistryAcronymChange(e.target.value)}
                      placeholder="Sigle (MEPST)"
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-bold text-slate-800 outline-none focus:bg-white focus:border-indigo-600"
                    />
                    <input
                      type="text"
                      value={republicTitle}
                      onChange={(e) => onRepublicTitleChange(e.target.value)}
                      placeholder="REPUBLIQUE TOGOLAISE"
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-bold text-slate-800 outline-none focus:bg-white focus:border-indigo-600"
                    />
                    <input
                      type="text"
                      value={republicMotto}
                      onChange={(e) => onRepublicMottoChange(e.target.value)}
                      placeholder="Travail-Liberté-Patrie"
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-bold text-slate-800 outline-none focus:bg-white focus:border-indigo-600"
                    />
                  </div>
                )}
              </RibbonGroup>
            </div>
          )}

          {/* ONGLET 2 : TYPOGRAPHIE */}
          {activeTab === 'typo' && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-2.5 items-stretch">
              <RibbonGroup title={`Élément ciblé (${currentZoneMeta.label})`} className="xl:col-span-4">
                <div className="flex flex-wrap gap-1.5">
                  {zoneTabs.map((tab) => {
                    const active = activeTypoZone === tab.key
                    const zoneColor =
                      typographyConfig[tab.key]?.color ||
                      FALLBACK_TOGO_TYPOGRAPHY[tab.key]?.color ||
                      '#0F172A'
                    return (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => onActiveTypoZoneChange(tab.key)}
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all ${
                          active
                            ? 'bg-indigo-600 text-white shadow-2xs'
                            : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span
                          className="h-2.5 w-2.5 rounded-full border border-black/20 shrink-0"
                          style={{ backgroundColor: zoneColor }}
                        />
                        {tab.label}
                      </button>
                    )
                  })}
                </div>
              </RibbonGroup>

              <RibbonGroup title="Police" className="xl:col-span-3">
                <div className="space-y-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                      Police de la zone
                    </label>
                    <select
                      value={currentZoneStyle.fontFamily}
                      onChange={(e) =>
                        onUpdateZoneTypography(activeTypoZone, {
                          fontFamily: e.target.value as CardFontFamily,
                        })
                      }
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-900 outline-none focus:border-indigo-600"
                    >
                      {fontOptions.map((f) => (
                        <option key={f.value} value={f.value}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-indigo-800 mb-0.5">
                      Appliquer à toute la carte :
                    </label>
                    <select
                      value={currentZoneStyle.fontFamily}
                      onChange={(e) => onApplyFontFamilyToAll(e.target.value as CardFontFamily)}
                      className="w-full rounded-lg border border-indigo-200 bg-indigo-50/60 px-2.5 py-1 text-[11px] font-extrabold text-indigo-950 outline-none"
                    >
                      {fontOptions.map((f) => (
                        <option key={f.value} value={f.value}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </RibbonGroup>

              <RibbonGroup title="Corps & Taille" className="xl:col-span-2">
                <div className="space-y-2 pt-1">
                  <div className="text-center text-xs font-extrabold text-indigo-950">
                    {(currentZoneMeta.basePt * currentZoneStyle.sizeScale).toFixed(1)} pt{' '}
                    <span className="text-slate-400 font-semibold">
                      ({Math.round(currentZoneStyle.sizeScale * 100)}%)
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateZoneTypography(activeTypoZone, {
                          sizeScale: Math.max(
                            0.7,
                            Number((currentZoneStyle.sizeScale - 0.08).toFixed(2))
                          ),
                        })
                      }
                      className="h-8 w-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 flex items-center justify-center text-slate-700"
                      title="Réduire la taille"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <input
                      type="range"
                      min={0.7}
                      max={1.45}
                      step={0.05}
                      value={currentZoneStyle.sizeScale}
                      onChange={(e) =>
                        onUpdateZoneTypography(activeTypoZone, {
                          sizeScale: parseFloat(e.target.value),
                        })
                      }
                      className="flex-1 accent-indigo-600 cursor-pointer"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateZoneTypography(activeTypoZone, {
                          sizeScale: Math.min(
                            1.45,
                            Number((currentZoneStyle.sizeScale + 0.08).toFixed(2))
                          ),
                        })
                      }
                      className="h-8 w-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 flex items-center justify-center text-slate-700"
                      title="Agrandir la taille"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </RibbonGroup>

              <RibbonGroup title="Style & Casse" className="xl:col-span-3">
                <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateZoneTypography(activeTypoZone, { bold: !currentZoneStyle.bold })
                    }
                    className={`h-9 px-3 rounded-lg border text-xs font-black flex items-center gap-1 transition-all ${
                      currentZoneStyle.bold
                        ? 'bg-indigo-950 text-white border-indigo-950'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                    title="Gras"
                  >
                    <Bold className="h-3.5 w-3.5" />G
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateZoneTypography(activeTypoZone, { italic: !currentZoneStyle.italic })
                    }
                    className={`h-9 px-3 rounded-lg border text-xs italic font-bold flex items-center gap-1 transition-all ${
                      currentZoneStyle.italic
                        ? 'bg-indigo-950 text-white border-indigo-950'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                    title="Italique"
                  >
                    <Italic className="h-3.5 w-3.5" />I
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateZoneTypography(activeTypoZone, {
                        underline: !currentZoneStyle.underline,
                      })
                    }
                    className={`h-9 px-3 rounded-lg border text-xs underline font-bold flex items-center gap-1 transition-all ${
                      currentZoneStyle.underline
                        ? 'bg-indigo-950 text-white border-indigo-950'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                    title="Souligné"
                  >
                    <Underline className="h-3.5 w-3.5" />S
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateZoneTypography(activeTypoZone, {
                        uppercase: !currentZoneStyle.uppercase,
                      })
                    }
                    className={`h-9 px-3 rounded-lg border text-xs font-extrabold transition-all ${
                      currentZoneStyle.uppercase
                        ? 'bg-indigo-950 text-white border-indigo-950'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                    title="Majuscules"
                  >
                    AA
                  </button>
                  <button
                    type="button"
                    onClick={onResetTypography}
                    className="h-9 px-2.5 rounded-lg border border-slate-200 bg-slate-100 hover:bg-slate-200 text-[11px] font-bold text-slate-700 flex items-center gap-1"
                    title="Réinitialiser la typographie par défaut"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Défaut
                  </button>
                </div>
              </RibbonGroup>
            </div>
          )}

          {/* ONGLET 3 : COULEURS & EFFETS */}
          {activeTab === 'couleurs' && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-2.5 items-stretch">
              <RibbonGroup title="Couleur de zone" className="xl:col-span-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <select
                      value={activeTypoZone}
                      onChange={(e) =>
                        onActiveTypoZoneChange(e.target.value as RibbonTypographyZoneKey)
                      }
                      className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-extrabold text-indigo-950 outline-none"
                    >
                      {zoneTabs.map((z) => (
                        <option key={z.key} value={z.key}>
                          {z.label}
                        </option>
                      ))}
                    </select>
                    <label className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-0.5 cursor-pointer">
                      <input
                        type="color"
                        value={currentZoneStyle.color}
                        onChange={(e) =>
                          onUpdateZoneTypography(activeTypoZone, { color: e.target.value })
                        }
                        className="h-5 w-5 border-0 cursor-pointer bg-transparent"
                      />
                      <span className="text-[10.5px] font-mono font-bold text-slate-700 uppercase">
                        {currentZoneStyle.color}
                      </span>
                    </label>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {quickColorPalette.map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => onUpdateZoneTypography(activeTypoZone, { color: c.hex })}
                        className={`h-6 w-6 rounded-full border transition-transform ${
                          currentZoneStyle.color.toUpperCase() === c.hex.toUpperCase()
                            ? 'scale-115 ring-2 ring-indigo-600 border-white'
                            : 'border-slate-300 hover:scale-110'
                        }`}
                        style={{ backgroundColor: c.hex }}
                        title={c.name}
                      />
                    ))}
                  </div>

                  {cardTemplate === 'classic' && activeTypoZone === 'bannerTitle' && (
                    <div className="flex items-center gap-1 flex-wrap pt-1.5 border-t border-slate-100">
                      <span className="text-[10px] font-bold text-slate-500">Fond bandeau :</span>
                      {bannerBgPalette.map((bg) => (
                        <button
                          key={bg.hex}
                          type="button"
                          onClick={() => onSetBannerBgColor(bg.hex)}
                          className={`h-5 px-2 rounded border text-[9.5px] font-bold ${
                            typographyConfig.bannerBgColor.toUpperCase() === bg.hex.toUpperCase()
                              ? 'ring-2 ring-indigo-600 border-indigo-600'
                              : 'border-slate-300'
                          }`}
                          style={{ backgroundColor: bg.hex }}
                        >
                          {bg.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </RibbonGroup>

              <RibbonGroup title="Studio Lettre par Lettre" className="xl:col-span-5">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <select
                      value={letterColorField}
                      onChange={(e) => {
                        onLetterColorFieldChange(e.target.value as RibbonLetterColorFieldKey)
                        onSelectLetterIndex(0)
                      }}
                      className="flex-1 min-w-[160px] rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-900 outline-none"
                    >
                      <option value="ministryAcronym">
                        Sigle Ministère ({ministryAcronym || 'MEPST'})
                      </option>
                      <option value="schoolName">
                        Nom École ({schoolName.slice(0, 18)})
                      </option>
                      <option value="inspectionName">
                        IEPP ({inspectionName.slice(0, 18) || 'IEPP'})
                      </option>
                      <option value="bannerTitle">
                        Titre Carte ({cardBannerTitle.slice(0, 18)})
                      </option>
                      <option value="examCenter">
                        Centre d&apos;Écrit ({examCenter.slice(0, 18)})
                      </option>
                      <option value="republicTitle">
                        République ({republicTitle.slice(0, 18)})
                      </option>
                    </select>
                    <button
                      type="button"
                      onClick={() => onResetFieldLetterColors(letterColorField)}
                      className="text-[10.5px] font-bold text-slate-600 hover:text-indigo-700 px-2 py-1 rounded-lg bg-slate-50 border border-slate-200"
                    >
                      Réinitialiser
                    </button>
                  </div>

                  {activeLetterText.length > 0 ? (
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1 flex-wrap bg-slate-50/70 p-1.5 rounded-xl border border-slate-200/90 flex-1">
                        {Array.from(activeLetterText).map((ch, idx) => {
                          const isSel = idx === safeSelectedIdx
                          const charColor = activeLetterColors[idx] || '#0F172A'
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => onSelectLetterIndex(idx)}
                              className={`min-w-[22px] h-6 px-1 rounded border text-xs font-black transition-all flex items-center justify-center ${
                                isSel
                                  ? 'ring-2 ring-indigo-600 border-indigo-600 bg-white scale-110'
                                  : 'border-slate-200 bg-white/80 hover:bg-white'
                              }`}
                              style={{ color: charColor }}
                            >
                              {ch === ' ' ? '␣' : ch}
                            </button>
                          )
                        })}
                      </div>

                      <div className="flex items-center gap-1 bg-indigo-50/70 px-2 py-1 rounded-xl border border-indigo-100">
                        <span className="text-[10px] font-extrabold text-indigo-950 mr-0.5">
                          « {selectedChar === ' ' ? '␣' : selectedChar} »
                        </span>
                        {['#0F172A', '#DC2626', '#F59E0B', '#1D4ED8', '#007A33', '#99121C'].map(
                          (hex) => (
                            <button
                              key={hex}
                              type="button"
                              onClick={() => onSetLetterColor(hex)}
                              className={`h-4 w-4 rounded-full border ${
                                selectedCharColor.toUpperCase() === hex.toUpperCase()
                                  ? 'scale-125 ring-2 ring-indigo-600 border-white'
                                  : 'border-slate-300'
                              }`}
                              style={{ backgroundColor: hex }}
                            />
                          )
                        )}
                        <input
                          type="color"
                          value={selectedCharColor}
                          onChange={(e) => onSetLetterColor(e.target.value)}
                          className="h-4 w-4 border-0 cursor-pointer bg-transparent"
                          title="Autre couleur"
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic">
                      Renseignez ce champ dans l&apos;onglet Accueil pour colorer ses lettres.
                    </p>
                  )}
                </div>
              </RibbonGroup>

              <RibbonGroup title="Thèmes de Palette (1 clic)" className="xl:col-span-3">
                <div className="space-y-1.5">
                  {PALETTE_PRESETS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => onApplyPalettePreset(p.id)}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-indigo-50 hover:border-indigo-300 px-2.5 py-1.5 flex items-center justify-between gap-2 text-left transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="text-[11px] font-extrabold text-slate-900 truncate">
                          {p.label}
                        </div>
                        <div className="text-[9.5px] text-slate-500 truncate">{p.desc}</div>
                      </div>
                      <div className="flex items-center -space-x-1 shrink-0">
                        {p.swatches.map((hex) => (
                          <span
                            key={hex}
                            className="h-3.5 w-3.5 rounded-full ring-1 ring-white"
                            style={{ backgroundColor: hex }}
                          />
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              </RibbonGroup>
            </div>
          )}

          {/* ONGLET 4 : MÉDIAS & SÉCURITÉ QR */}
          {activeTab === 'medias' && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-2.5 items-stretch">
              <RibbonGroup title="Identité visuelle officielle" className="xl:col-span-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {/* Logo */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-2 flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <div className="h-10 w-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                        {logoUrl ? (
                          <img src={logoUrl} alt="Logo" className="h-full w-full object-contain" />
                        ) : (
                          <Building2 className="h-4 w-4 text-slate-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-[11px] font-extrabold text-slate-800 truncate">
                          Logo École
                        </div>
                        {!logoUrl && (
                          <label className="flex items-center gap-1 text-[9.5px] text-slate-600 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={showVectorEmblemIfNoLogo}
                              onChange={(e) => onToggleVectorEmblem(e.target.checked)}
                            />
                            Emblème auto
                          </label>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <label className="flex-1 cursor-pointer rounded-md bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2 py-1 text-[10px] font-bold text-indigo-800 flex items-center justify-center gap-1">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={uploadingAssetType === 'logo'}
                          onChange={(e) => {
                            const f = e.target.files?.[0]
                            e.currentTarget.value = ''
                            onUploadAsset('logo', f)
                          }}
                        />
                        {uploadingAssetType === 'logo' ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Upload className="h-3 w-3" />
                        )}
                        {logoUrl ? 'Changer' : 'Importer'}
                      </label>
                      {logoUrl && (
                        <button
                          type="button"
                          onClick={() => onClearAsset('logo')}
                          className="p-1 rounded-md bg-red-50 text-red-600 hover:bg-red-100"
                          title="Supprimer le logo"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Cachet */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-2 flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <div className="h-10 w-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                        {stampUrl ? (
                          <img src={stampUrl} alt="Cachet" className="h-full w-full object-contain" />
                        ) : (
                          <Stamp className="h-4 w-4 text-slate-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-[11px] font-extrabold text-slate-800 truncate">
                          Cachet
                        </div>
                        {!stampUrl && (
                          <label className="flex items-center gap-1 text-[9.5px] text-slate-600 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={showVectorStampAuto}
                              onChange={(e) => onToggleVectorStampAuto(e.target.checked)}
                            />
                            Cachet auto
                          </label>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <label className="flex-1 cursor-pointer rounded-md bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2 py-1 text-[10px] font-bold text-indigo-800 flex items-center justify-center gap-1">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={uploadingAssetType === 'stamp'}
                          onChange={(e) => {
                            const f = e.target.files?.[0]
                            e.currentTarget.value = ''
                            onUploadAsset('stamp', f)
                          }}
                        />
                        {uploadingAssetType === 'stamp' ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Upload className="h-3 w-3" />
                        )}
                        {stampUrl ? 'Changer' : 'Importer'}
                      </label>
                      {stampUrl && (
                        <button
                          type="button"
                          onClick={() => onClearAsset('stamp')}
                          className="p-1 rounded-md bg-red-50 text-red-600 hover:bg-red-100"
                          title="Supprimer le cachet"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Signature */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-2 flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <div className="h-10 w-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                        {signatureUrl ? (
                          <img
                            src={signatureUrl}
                            alt="Signature"
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <PenTool className="h-4 w-4 text-slate-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-[11px] font-extrabold text-slate-800 truncate">
                          Signature
                        </div>
                        <span className="block text-[9px] text-emerald-700 font-semibold truncate">
                          Sync Paramètres
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <label className="flex-1 cursor-pointer rounded-md bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2 py-1 text-[10px] font-bold text-indigo-800 flex items-center justify-center gap-1">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={uploadingAssetType === 'signature'}
                          onChange={(e) => {
                            const f = e.target.files?.[0]
                            e.currentTarget.value = ''
                            onUploadAsset('signature', f)
                          }}
                        />
                        {uploadingAssetType === 'signature' ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Upload className="h-3 w-3" />
                        )}
                        {signatureUrl ? 'Changer' : 'Importer'}
                      </label>
                      {signatureUrl && (
                        <button
                          type="button"
                          onClick={() => onClearAsset('signature')}
                          className="p-1 rounded-md bg-red-50 text-red-600 hover:bg-red-100"
                          title="Supprimer la signature"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </RibbonGroup>

              <RibbonGroup title="Arrière-plan de la carte" className="xl:col-span-3">
                {cardTemplate === 'classic' ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                      <span className="truncate">
                        {allThemes[activeThemeIndex]?.name || 'Thème'}
                      </span>
                      <span className="text-slate-400 shrink-0 ml-1">
                        {activeThemeIndex + 1}/{allThemes.length}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={activeThemeIndex <= 0}
                        onClick={onPrevTheme}
                        className="flex-1 px-2 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-[11px] font-bold text-slate-800 flex items-center justify-center gap-1 disabled:opacity-40"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                        Préc.
                      </button>
                      <button
                        type="button"
                        disabled={activeThemeIndex >= allThemes.length - 1}
                        onClick={onNextTheme}
                        className="flex-1 px-2 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-[11px] font-bold text-slate-800 flex items-center justify-center gap-1 disabled:opacity-40"
                      >
                        Suiv.
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                      <label className="cursor-pointer px-2 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-[11px] font-bold text-emerald-800 flex items-center gap-1">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => onUploadCustomTheme(e.target.files?.[0])}
                        />
                        <Upload className="h-3 w-3" />+ Fond
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-rose-200/80 bg-rose-50/50 p-2.5 text-[10.5px] text-rose-950 font-semibold flex items-start gap-2">
                    <Sparkles className="h-4 w-4 text-[#9E053F] shrink-0 mt-0.5" />
                    <span>
                      Modèle 2 (Officiel IEPP) : fond filigrane Togo, drapeau vectoriel Bézier,
                      ruban tricolore et QR Code haute netteté intégrés.
                    </span>
                  </div>
                )}
              </RibbonGroup>

              <RibbonGroup title="Inspecteur QR Code (contenu scanné)" className="xl:col-span-4">
                <div className="flex items-start gap-2.5">
                  <div className="h-[82px] w-[82px] shrink-0 rounded-lg border border-slate-300 bg-white p-1.5 shadow-2xs flex items-center justify-center">
                    <svg
                      viewBox={`0 0 ${qrMatrix.length} ${qrMatrix.length}`}
                      className="h-full w-full"
                      shapeRendering="crispEdges"
                    >
                      <rect width={qrMatrix.length} height={qrMatrix.length} fill="#FFFFFF" />
                      <path d={qrPath} fill="#0F172A" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0 max-h-[82px] overflow-y-auto rounded-lg border border-slate-200 bg-slate-900 px-2 py-1.5 text-[10px] font-mono text-emerald-200 leading-snug space-y-0.5">
                    <div className="flex items-center gap-1 text-[9px] font-sans font-bold uppercase tracking-wider text-slate-400 pb-0.5 border-b border-white/10">
                      <QrCode className="h-3 w-3 text-amber-300" />
                      Texte lu par smartphone
                    </div>
                    {qrLines.map((line, i) => (
                      <div key={i} className="truncate">
                        {line}
                      </div>
                    ))}
                  </div>
                </div>
              </RibbonGroup>
            </div>
          )}

          {/* ONGLET 5 : MISE EN PAGE & IMPRESSION A4 */}
          {activeTab === 'impression' && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-2.5 items-stretch">
              <RibbonGroup title="Mode d'affichage" className="xl:col-span-3">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onPaperLayoutChange('single')
                      onViewModeChange('paper')
                    }}
                    className={`rounded-xl border p-2.5 text-left transition-all ${
                      viewMode === 'paper' && paperLayout === 'single'
                        ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-600/20'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <IdCard className="h-4 w-4 text-indigo-600 mb-1" />
                    <div className="text-[11px] font-extrabold text-slate-900">Carte unitaire</div>
                    <div className="text-[9.5px] text-slate-500">1 carte centrée sur A4</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onPaperLayoutChange('sheet')
                      onViewModeChange('paper')
                    }}
                    className={`rounded-xl border p-2.5 text-left transition-all ${
                      viewMode === 'paper' && paperLayout === 'sheet'
                        ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-600/20'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <LayoutGrid className="h-4 w-4 text-emerald-600 mb-1" />
                    <div className="text-[11px] font-extrabold text-slate-900">Planche A4</div>
                    <div className="text-[9.5px] text-slate-500">10 cartes / page (2×5)</div>
                  </button>
                </div>
              </RibbonGroup>

              <RibbonGroup title="Gabarit A4, Découpe & Filtre" className="xl:col-span-5">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => onShowCropMarksChange(!showCropMarks)}
                    className={`rounded-lg border px-2 py-1.5 text-[11px] font-bold flex items-center gap-1.5 transition-colors ${
                      showCropMarks
                        ? 'border-indigo-300 bg-indigo-50 text-indigo-950'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                    title="Afficher et exporter les repères de découpe dans le PDF"
                  >
                    <Scissors className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                    <span className="truncate">Traits de coupe</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onShowSlotNumbersChange(!showSlotNumbers)}
                    className={`rounded-lg border px-2 py-1.5 text-[11px] font-bold flex items-center gap-1.5 transition-colors ${
                      showSlotNumbers
                        ? 'border-indigo-300 bg-indigo-50 text-indigo-950'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Hash className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                    <span className="truncate">Numéros 1–10</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onShowMmGridChange(!showMmGrid)}
                    className={`rounded-lg border px-2 py-1.5 text-[11px] font-bold flex items-center gap-1.5 transition-colors ${
                      showMmGrid
                        ? 'border-indigo-300 bg-indigo-50 text-indigo-950'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Grid3x3 className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                    <span className="truncate">Grille 10 mm</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onUseSampleCardOnSheetChange(!useSampleCardOnSheet)}
                    className={`rounded-lg border px-2 py-1.5 text-[11px] font-bold flex items-center gap-1.5 transition-colors ${
                      useSampleCardOnSheet
                        ? 'border-amber-300 bg-amber-50 text-amber-950'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                    title="Répéter la carte active sur les 10 emplacements pour tester le gabarit"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                    <span className="truncate">
                      {useSampleCardOnSheet ? 'Exemple ×10' : 'Élèves réels'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onOnlyWithPhotoForPrintChange(!onlyWithPhotoForPrint)}
                    className={`col-span-2 rounded-lg border px-2 py-1.5 text-[11px] font-bold flex items-center gap-1.5 transition-colors ${
                      onlyWithPhotoForPrint
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-950'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Filter className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">
                      {onlyWithPhotoForPrint
                        ? 'Filtre actif : Uniquement avec photo'
                        : 'Imprimer : Tous les élèves sélectionnés'}
                    </span>
                  </button>
                </div>
              </RibbonGroup>

              <RibbonGroup title="Contrôle qualité Pré-impression" className="xl:col-span-4">
                <div className="space-y-1.5">
                  <div className="grid grid-cols-2 gap-1.5 text-[10.5px] font-bold">
                    <div
                      className={`rounded-lg px-2 py-1 border flex items-center gap-1.5 ${
                        preflight.photosReady === preflight.totalSelected &&
                        preflight.totalSelected > 0
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                          : 'bg-amber-50 border-amber-200 text-amber-900'
                      }`}
                    >
                      {preflight.photosReady === preflight.totalSelected &&
                      preflight.totalSelected > 0 ? (
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                      ) : (
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                      )}
                      <span className="truncate">
                        Photos {preflight.photosReady}/{preflight.totalSelected}
                      </span>
                    </div>

                    <div
                      className={`rounded-lg px-2 py-1 border flex items-center gap-1.5 ${
                        preflight.infoComplete === preflight.totalSelected &&
                        preflight.totalSelected > 0
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                          : 'bg-amber-50 border-amber-200 text-amber-900'
                      }`}
                    >
                      {preflight.infoComplete === preflight.totalSelected &&
                      preflight.totalSelected > 0 ? (
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                      ) : (
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                      )}
                      <span className="truncate">
                        Infos {preflight.infoComplete}/{preflight.totalSelected}
                      </span>
                    </div>

                    <div
                      className={`rounded-lg px-2 py-1 border flex items-center gap-1.5 ${
                        preflight.hasIeppAndCenter
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                          : 'bg-amber-50 border-amber-200 text-amber-900'
                      }`}
                    >
                      {preflight.hasIeppAndCenter ? (
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                      ) : (
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                      )}
                      <span className="truncate">IEPP &amp; Centre</span>
                    </div>

                    <div
                      className={`rounded-lg px-2 py-1 border flex items-center gap-1.5 ${
                        preflight.hasStampOrSignature
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                          : 'bg-amber-50 border-amber-200 text-amber-900'
                      }`}
                    >
                      {preflight.hasStampOrSignature ? (
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                      ) : (
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                      )}
                      <span className="truncate">Cachet &amp; Sign.</span>
                    </div>
                  </div>

                  {preflight.incompleteStudentsCount > 0 && (
                    <button
                      type="button"
                      onClick={onShowIncompleteStudents}
                      className="w-full rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-950 px-2.5 py-1 text-[10.5px] font-extrabold transition-colors"
                    >
                      Filtrer les {preflight.incompleteStudentsCount} élève(s) incomplet(s) ↓
                    </button>
                  )}
                </div>
              </RibbonGroup>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
