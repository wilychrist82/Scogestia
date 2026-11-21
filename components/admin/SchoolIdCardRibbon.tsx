'use client'

import React from 'react'
import {
  Bold,
  Building2,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  IdCard,
  Image as ImageIcon,
  Italic,
  Loader2,
  Minus,
  Palette,
  PenTool,
  Plus,
  Printer,
  RotateCcw,
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
import { sanitizeIeppText, type CardTemplateId } from '@/lib/pdf/togo-iepp-card'

export type StudioRibbonTab = 'accueil' | 'typo' | 'couleurs' | 'medias'

export type RibbonTypographyZoneKey =
  | 'schoolName'
  | 'headerOfficial'
  | 'bannerTitle'
  | 'studentName'
  | 'studentDetails'
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

interface Props {
  activeTab: StudioRibbonTab
  onTabChange: (tab: StudioRibbonTab) => void
  collapsed: boolean
  onToggleCollapse: () => void
  previewZoom: number
  onZoomChange: (zoom: number) => void
  onQuickExportSingle?: () => void
  onQuickExportBatch?: () => void
  isGenerating: boolean
  selectedCount: number

  // Modèle
  cardTemplate: CardTemplateId
  onSelectTemplate: (tpl: CardTemplateId) => void

  // Textes de la carte
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

  // Médias & Thèmes
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
}

const RIBBON_TABS: { id: StudioRibbonTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'accueil', label: 'Accueil & Modèles', icon: IdCard },
  { id: 'typo', label: 'Typographie & Style', icon: Type },
  { id: 'couleurs', label: 'Couleurs & Effets', icon: Palette },
  { id: 'medias', label: 'Logo, Cachet & Fond', icon: ImageIcon },
]

export function SchoolIdCardRibbon({
  activeTab,
  onTabChange,
  collapsed,
  onToggleCollapse,
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
}: Props) {
  const currentZoneMeta = zoneTabs.find((z) => z.key === activeTypoZone) || zoneTabs[0]
  const currentZoneStyle = typographyConfig[activeTypoZone]

  const safeSelectedIdx = Math.min(
    Math.max(0, selectedLetterIndex),
    Math.max(0, activeLetterText.length - 1)
  )
  const selectedChar = activeLetterText[safeSelectedIdx] || ''
  const selectedCharColor = activeLetterColors[safeSelectedIdx] || letterFallbackColor

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white shadow-[0_2px_10px_-3px_rgba(15,23,42,0.08)] overflow-hidden">
      {/* BARRE D'ONGLETS DU RUBAN (STYLE MICROSOFT WORD / LOGICIEL D'INFOGRAPHIE) */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#312E81] px-3 pt-2 text-white">
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
                className={`px-3.5 py-2 rounded-t-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-slate-50 text-indigo-950 shadow-sm'
                    : 'text-slate-200 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-indigo-600' : 'text-amber-300'}`} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* CONTRÔLES RAPIDES À DROITE DU RUBAN (ZOOM, EXPORT, RÉDUIRE) */}
        <div className="flex items-center gap-1.5 pb-1.5">
          <div className="hidden sm:flex items-center gap-0.5 rounded-lg bg-white/10 px-1.5 py-0.5 ring-1 ring-white/15">
            <button
              type="button"
              onClick={() => onZoomChange(Math.max(0.85, Number((previewZoom - 0.1).toFixed(2))))}
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
              onClick={() => onZoomChange(Math.min(1.2, Number((previewZoom + 0.1).toFixed(2))))}
              className="p-1 text-slate-200 hover:text-white rounded"
              title="Zoomer l'aperçu"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
          </div>

          {onQuickExportSingle && (
            <button
              type="button"
              disabled={isGenerating}
              onClick={onQuickExportSingle}
              className="px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-[11px] font-bold text-white flex items-center gap-1 transition-colors disabled:opacity-50"
              title="Exporter l'élève actif en PDF"
            >
              <Printer className="h-3.5 w-3.5 text-amber-300" />
              <span className="hidden md:inline">Carte PDF</span>
            </button>
          )}

          {onQuickExportBatch && (
            <button
              type="button"
              disabled={isGenerating || selectedCount === 0}
              onClick={onQuickExportBatch}
              className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-[11px] font-extrabold text-slate-950 flex items-center gap-1 transition-colors disabled:opacity-50"
              title="Générer la planche 10 cartes / page A4"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Planche A4 ({selectedCount})</span>
            </button>
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

      {/* CORPS DU RUBAN ACTIF (BLOCS STRUCTURÉS PAR GROUPES AVEC SÉPARATEURS) */}
      {!collapsed && (
        <div className="bg-gradient-to-b from-slate-50 to-white border-t border-slate-200/80 px-3 py-3">
          {/* ONGLET 1 : ACCUEIL & MODÈLES */}
          {activeTab === 'accueil' && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 items-stretch">
              {/* Groupe 1 : Modèle de Carte */}
              <div className="xl:col-span-4 xl:border-r xl:border-slate-200/80 xl:pr-3 flex flex-col justify-between">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => onSelectTemplate('classic')}
                    className={`rounded-xl border p-2 text-left transition-all flex flex-col gap-1.5 ${
                      cardTemplate === 'classic'
                        ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-600/20 shadow-2xs'
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
                        ? 'border-[#9E053F] bg-rose-50/60 ring-2 ring-[#9E053F]/20 shadow-2xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="w-full h-9 rounded border border-slate-300 bg-[#FFFDF9] p-1 flex flex-col justify-between relative overflow-hidden">
                      <div className="flex items-center justify-between">
                        <span className="h-2 w-2 rounded-full bg-amber-400" />
                        <span className="h-1.5 w-8 rounded-full bg-[#9E053F]" />
                        <span className="h-2 w-3 bg-gradient-to-b from-[#006C3E] via-[#FACC15] to-[#006C3E]" />
                      </div>
                      <span className="h-1 w-10 mx-auto rounded-full bg-[#081B58]" />
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
                <div className="text-center text-[9.5px] font-bold uppercase tracking-widest text-slate-400 mt-1.5">
                  Modèle de carte (2 au choix)
                </div>
              </div>

              {/* Groupe 2 : Inspection IEPP, École & Centre d'écrit */}
              <div className="xl:col-span-4 xl:border-r xl:border-slate-200/80 xl:pr-3 flex flex-col justify-between">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-700 mb-0.5">
                      {cardTemplate === 'togo_iepp'
                        ? "Nom de l'IEPP (à compléter)"
                        : 'Inspection / IEPP'}
                    </label>
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
                      placeholder="Ex : IEPP + nom inspection"
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
                <div className="text-center text-[9.5px] font-bold uppercase tracking-widest text-slate-400 mt-1.5">
                  IEPP &amp; Établissement
                </div>
              </div>

              {/* Groupe 3 : Année, Chef d'établissement & Titre */}
              <div className="xl:col-span-4 flex flex-col justify-between">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-700 mb-0.5">
                      Année Scolaire
                    </label>
                    <input
                      type="text"
                      value={academicYear}
                      onChange={(e) => onAcademicYearChange(e.target.value)}
                      placeholder="2026-2027"
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-red-800 focus:border-indigo-600 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-700 mb-0.5">
                      Chef d&apos;établissement (Directeur)
                    </label>
                    <input
                      type="text"
                      value={directorName}
                      onChange={(e) => onDirectorNameChange(e.target.value)}
                      placeholder="Nom du Directeur"
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:border-indigo-600 outline-none"
                    />
                  </div>

                  <div className={cardTemplate === 'togo_iepp' ? 'sm:col-span-2' : ''}>
                    <label className="block text-[10.5px] font-bold text-slate-700 mb-0.5">
                      Titre de la Carte
                    </label>
                    <input
                      type="text"
                      value={cardBannerTitle}
                      onChange={(e) => onCardBannerTitleChange(e.target.value)}
                      placeholder="CARTE D'IDENTITÉ SCOLAIRE"
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-blue-950 focus:border-indigo-600 outline-none"
                    />
                  </div>

                  {cardTemplate === 'classic' && (
                    <div>
                      <label className="block text-[10.5px] font-bold text-slate-700 mb-0.5">
                        Sigle Ministère
                      </label>
                      <input
                        type="text"
                        value={ministryAcronym}
                        onChange={(e) => onMinistryAcronymChange(e.target.value)}
                        placeholder="MEPST"
                        className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:border-indigo-600 outline-none"
                      />
                    </div>
                  )}
                </div>

                {cardTemplate === 'classic' && (
                  <div className="grid grid-cols-2 gap-2 mt-1.5">
                    <input
                      type="text"
                      value={republicTitle}
                      onChange={(e) => onRepublicTitleChange(e.target.value)}
                      placeholder="REPUBLIQUE TOGOLAISE"
                      className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-800 outline-none"
                    />
                    <input
                      type="text"
                      value={republicMotto}
                      onChange={(e) => onRepublicMottoChange(e.target.value)}
                      placeholder="Travail-Liberté-Patrie"
                      className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-800 outline-none"
                    />
                  </div>
                )}

                <div className="text-center text-[9.5px] font-bold uppercase tracking-widest text-slate-400 mt-1.5">
                  Direction &amp; En-tête
                </div>
              </div>
            </div>
          )}

          {/* ONGLET 2 : TYPOGRAPHIE & STYLE */}
          {activeTab === 'typo' && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 items-stretch">
              {/* Groupe 1 : Zone ciblée */}
              <div className="xl:col-span-4 xl:border-r xl:border-slate-200/80 xl:pr-3 flex flex-col justify-between">
                <div className="flex flex-wrap gap-1.5">
                  {zoneTabs.map((tab) => {
                    const active = activeTypoZone === tab.key
                    return (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => onActiveTypoZoneChange(tab.key)}
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                          active
                            ? 'bg-indigo-600 text-white shadow-2xs'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {tab.label}
                      </button>
                    )
                  })}
                </div>
                <div className="text-center text-[9.5px] font-bold uppercase tracking-widest text-slate-400 mt-2">
                  Élément ciblé ({currentZoneMeta.label})
                </div>
              </div>

              {/* Groupe 2 : Police & Police Globale */}
              <div className="xl:col-span-3 xl:border-r xl:border-slate-200/80 xl:pr-3 flex flex-col justify-between gap-2">
                <div className="space-y-1.5">
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
                      className="w-full rounded-lg border border-indigo-200 bg-indigo-50/50 px-2.5 py-1 text-[11px] font-extrabold text-indigo-950 outline-none"
                    >
                      {fontOptions.map((f) => (
                        <option key={f.value} value={f.value}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="text-center text-[9.5px] font-bold uppercase tracking-widest text-slate-400">
                  Police
                </div>
              </div>

              {/* Groupe 3 : Taille */}
              <div className="xl:col-span-2 xl:border-r xl:border-slate-200/80 xl:pr-3 flex flex-col justify-between">
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
                      title="Réduire"
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
                      title="Agrandir"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div className="text-center text-[9.5px] font-bold uppercase tracking-widest text-slate-400 mt-2">
                  Corps &amp; Taille
                </div>
              </div>

              {/* Groupe 4 : Style Word (B / I / U / AA / Reset) */}
              <div className="xl:col-span-3 flex flex-col justify-between">
                <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateZoneTypography(activeTypoZone, { bold: !currentZoneStyle.bold })
                    }
                    className={`h-9 px-3 rounded-lg border text-xs font-black flex items-center gap-1 transition-all ${
                      currentZoneStyle.bold
                        ? 'bg-indigo-950 text-white border-indigo-950 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Bold className="h-3.5 w-3.5" />
                    Gras
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      onUpdateZoneTypography(activeTypoZone, { italic: !currentZoneStyle.italic })
                    }
                    className={`h-9 px-3 rounded-lg border text-xs italic font-bold flex items-center gap-1 transition-all ${
                      currentZoneStyle.italic
                        ? 'bg-indigo-950 text-white border-indigo-950 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Italic className="h-3.5 w-3.5" />
                    Italique
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
                        ? 'bg-indigo-950 text-white border-indigo-950 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Underline className="h-3.5 w-3.5" />
                    Souligné
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
                        ? 'bg-indigo-950 text-white border-indigo-950 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    AA
                  </button>

                  <button
                    type="button"
                    onClick={onResetTypography}
                    className="h-9 px-2.5 rounded-lg border border-slate-200 bg-slate-100 hover:bg-slate-200 text-[11px] font-bold text-slate-700 flex items-center gap-1"
                    title="Réinitialiser la typographie"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Défaut
                  </button>
                </div>
                <div className="text-center text-[9.5px] font-bold uppercase tracking-widest text-slate-400 mt-2">
                  Style &amp; Casse
                </div>
              </div>
            </div>
          )}

          {/* ONGLET 3 : COULEURS & STUDIO LETTRE PAR LETTRE */}
          {activeTab === 'couleurs' && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 items-stretch">
              {/* Groupe 1 : Nuancier de la zone active */}
              <div className="xl:col-span-5 xl:border-r xl:border-slate-200/80 xl:pr-3 flex flex-col justify-between gap-2">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-[11px] font-bold text-slate-700">
                      Couleur ({currentZoneMeta.label}) :
                    </span>
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
                            ? 'scale-120 ring-2 ring-indigo-600 border-white'
                            : 'border-slate-300 hover:scale-110'
                        }`}
                        style={{ backgroundColor: c.hex }}
                        title={c.name}
                      />
                    ))}
                  </div>

                  {cardTemplate === 'classic' && activeTypoZone === 'bannerTitle' && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-200/80">
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
                <div className="text-center text-[9.5px] font-bold uppercase tracking-widest text-slate-400">
                  Nuancier chromatique
                </div>
              </div>

              {/* Groupe 2 : Studio Couleur Lettre par Lettre */}
              <div className="xl:col-span-7 flex flex-col justify-between gap-2">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                      <span className="text-[11px] font-bold text-indigo-950 shrink-0">
                        Texte :
                      </span>
                      <select
                        value={letterColorField}
                        onChange={(e) => {
                          onLetterColorFieldChange(e.target.value as RibbonLetterColorFieldKey)
                          onSelectLetterIndex(0)
                        }}
                        className="flex-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-900 outline-none"
                      >
                        <option value="ministryAcronym">
                          Sigle Ministère ({ministryAcronym || 'MEPST'})
                        </option>
                        <option value="schoolName">
                          Nom de l&apos;École ({schoolName.slice(0, 18)})
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
                    </div>

                    <button
                      type="button"
                      onClick={() => onResetFieldLetterColors(letterColorField)}
                      className="text-[10.5px] font-bold text-slate-600 hover:text-indigo-700 px-2 py-1 rounded-lg bg-white border border-slate-200"
                    >
                      Réinitialiser lettres
                    </button>
                  </div>

                  {activeLetterText.length > 0 ? (
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1 flex-wrap bg-white p-1.5 rounded-xl border border-slate-200/90 flex-1">
                        {Array.from(activeLetterText).map((ch, idx) => {
                          const isSel = idx === safeSelectedIdx
                          const charColor = activeLetterColors[idx] || '#0F172A'
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => onSelectLetterIndex(idx)}
                              className={`min-w-[24px] h-6.5 px-1 rounded border text-xs font-black transition-all flex items-center justify-center ${
                                isSel
                                  ? 'ring-2 ring-indigo-600 border-indigo-600 bg-indigo-50 scale-110'
                                  : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100'
                              }`}
                              style={{ color: charColor }}
                            >
                              {ch === ' ' ? '␣' : ch}
                            </button>
                          )
                        })}
                      </div>

                      <div className="flex items-center gap-1 bg-indigo-50/60 px-2 py-1.5 rounded-xl border border-indigo-100">
                        <span className="text-[10px] font-extrabold text-indigo-950 mr-0.5">
                          « {selectedChar === ' ' ? '␣' : selectedChar} »
                        </span>
                        {[
                          '#0F172A',
                          '#DC2626',
                          '#F59E0B',
                          '#1D4ED8',
                          '#007A33',
                          '#99121C',
                        ].map((hex) => (
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
                        ))}
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
                      Renseignez ce champ dans l&apos;onglet Accueil pour personnaliser ses lettres.
                    </p>
                  )}
                </div>
                <div className="text-center text-[9.5px] font-bold uppercase tracking-widest text-slate-400">
                  Studio Lettre par Lettre
                </div>
              </div>
            </div>
          )}

          {/* ONGLET 4 : LOGO, CACHET, SIGNATURE & ARRIÈRE-PLAN */}
          {activeTab === 'medias' && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 items-stretch">
              {/* Groupe 1 : Identité Visuelle (Logo, Cachet, Signature) */}
              <div className="xl:col-span-8 xl:border-r xl:border-slate-200/80 xl:pr-3 flex flex-col justify-between">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Logo */}
                  <div className="rounded-xl border border-slate-200 bg-white p-2.5 flex items-center gap-2.5">
                    <div className="h-12 w-12 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                      {logoUrl ? (
                        <img src={logoUrl} alt="Logo" className="h-full w-full object-contain" />
                      ) : (
                        <Building2 className="h-5 w-5 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="text-[11px] font-extrabold text-slate-800">Logo École</div>
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
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
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

                  {/* Cachet */}
                  <div className="rounded-xl border border-slate-200 bg-white p-2.5 flex items-center gap-2.5">
                    <div className="h-12 w-12 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                      {stampUrl ? (
                        <img src={stampUrl} alt="Cachet" className="h-full w-full object-contain" />
                      ) : (
                        <Stamp className="h-5 w-5 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="text-[11px] font-extrabold text-slate-800">
                        Cachet Officiel
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
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
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

                  {/* Signature */}
                  <div className="rounded-xl border border-slate-200 bg-white p-2.5 flex items-center gap-2.5">
                    <div className="h-12 w-12 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                      {signatureUrl ? (
                        <img
                          src={signatureUrl}
                          alt="Signature"
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <PenTool className="h-5 w-5 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="text-[11px] font-extrabold text-slate-800">
                        Signature Directeur
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
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                      <span className="block text-[9.5px] text-slate-400 truncate">
                        Sync Paramètres
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-center text-[9.5px] font-bold uppercase tracking-widest text-slate-400 mt-1.5">
                  Authentification &amp; Visuels Officiels
                </div>
              </div>

              {/* Groupe 2 : Thème Arrière-plan */}
              <div className="xl:col-span-4 flex flex-col justify-between">
                {cardTemplate === 'classic' ? (
                  <div className="rounded-xl border border-slate-200 bg-white p-2.5 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                      <span>Thème d&apos;arrière-plan</span>
                      <span className="text-slate-400">
                        {activeThemeIndex + 1} / {allThemes.length}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={activeThemeIndex <= 0}
                        onClick={onPrevTheme}
                        className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-[11px] font-bold text-slate-800 flex items-center justify-center gap-1 disabled:opacity-40"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                        Précédent
                      </button>
                      <button
                        type="button"
                        disabled={activeThemeIndex >= allThemes.length - 1}
                        onClick={onNextTheme}
                        className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-[11px] font-bold text-slate-800 flex items-center justify-center gap-1 disabled:opacity-40"
                      >
                        Suivant
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                      <label className="cursor-pointer px-2.5 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-[11px] font-bold text-emerald-800 flex items-center gap-1">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => onUploadCustomTheme(e.target.files?.[0])}
                        />
                        <Upload className="h-3 w-3" />
                        + Fond
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-rose-200/80 bg-rose-50/50 p-3 text-[11px] text-rose-950 font-semibold flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-[#9E053F] shrink-0" />
                    <span>
                      Le Modèle 2 (Officiel IEPP) intègre automatiquement la carte filigrane du Togo, le drapeau et le QR Code de sécurité.
                    </span>
                  </div>
                )}
                <div className="text-center text-[9.5px] font-bold uppercase tracking-widest text-slate-400 mt-1.5">
                  Arrière-plan de la carte
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
