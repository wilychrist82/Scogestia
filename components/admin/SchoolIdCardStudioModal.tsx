'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  X,
  Camera,
  Loader2,
  IdCard,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Search,
  Printer,
  CheckSquare,
  Square,
  Save,
  Building2,
  Eye,
  ChevronLeft,
  ChevronRight,
  Upload,
  Trash2,
  Stamp,
  PenTool,
  Image as ImageIcon,
  Layers,
  Palette,
  Type,
  Bold,
  Italic,
  Underline,
  RotateCcw,
  Minus,
  Plus,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import {
  generateClassStudentIdCardsPDF,
  StudentDocumentData,
  CardTypographyConfig,
  CardZoneTextStyle,
  CardFontFamily,
  DEFAULT_CARD_TYPOGRAPHY,
} from '@/lib/pdf/student-documents'
import { updateSchoolAssetUrl } from '@/app/actions/parametres'

/**
 * Traite n'importe quelle capture ou image (66 Ko, 90 Ko, jusqu'à 15 Mo) de Cachet, Signature ou Logo :
 * - Supprime automatiquement le fond blanc papier sur les captures de cachet/signature
 * - Recadre automatiquement les marges vides autour du cachet/signature pour qu'il soit bien grand et lisible
 * - Retourne immédiatement un DataURL PNG haute netteté + un Blob PNG léger prêt à sauvegarder
 */
async function processAssetImageFile(
  file: File,
  type: 'logo' | 'stamp' | 'signature'
): Promise<{ dataUrl: string; blob: Blob }> {
  const rawDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Impossible de lire le fichier image'))
    reader.readAsDataURL(file)
  })

  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      try {
        const maxDim = 650
        let w = img.naturalWidth || 300
        let h = img.naturalHeight || 300
        if (w > maxDim || h > maxDim) {
          const ratio = Math.min(maxDim / w, maxDim / h)
          w = Math.max(1, Math.round(w * ratio))
          h = Math.max(1, Math.round(h * ratio))
        }

        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve({ dataUrl: rawDataUrl, blob: file })
          return
        }

        ctx.drawImage(img, 0, 0, w, h)

        // Pour un cachet ou une signature (souvent importé depuis une capture d'écran sur fond blanc/gris clair) :
        // on rend le fond blanc transparent et on recadre au plus près du dessin !
        if (type === 'stamp' || type === 'signature') {
          const imgData = ctx.getImageData(0, 0, w, h)
          const d = imgData.data
          let minX = w
          let minY = h
          let maxX = 0
          let maxY = 0
          let foundInk = false

          for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
              const idx = (y * w + x) * 4
              const r = d[idx]
              const g = d[idx + 1]
              const b = d[idx + 2]
              const a = d[idx + 3]

              // Si le pixel est blanc ou gris très clair (fond papier d'une capture)
              if (a > 0 && r > 234 && g > 234 && b > 234) {
                d[idx + 3] = 0
              } else if (a > 25) {
                foundInk = true
                if (x < minX) minX = x
                if (y < minY) minY = y
                if (x > maxX) maxX = x
                if (y > maxY) maxY = y
              }
            }
          }

          ctx.putImageData(imgData, 0, 0)

          if (foundInk && maxX > minX && maxY > minY) {
            const pad = 6
            const cropX = Math.max(0, minX - pad)
            const cropY = Math.max(0, minY - pad)
            const cropW = Math.min(w - cropX, maxX - minX + 1 + pad * 2)
            const cropH = Math.min(h - cropY, maxY - minY + 1 + pad * 2)

            const croppedCanvas = document.createElement('canvas')
            croppedCanvas.width = cropW
            croppedCanvas.height = cropH
            const croppedCtx = croppedCanvas.getContext('2d')
            if (croppedCtx) {
              croppedCtx.drawImage(
                canvas,
                cropX,
                cropY,
                cropW,
                cropH,
                0,
                0,
                cropW,
                cropH
              )
              const finalDataUrl = croppedCanvas.toDataURL('image/png')
              croppedCanvas.toBlob((b) => {
                resolve({ dataUrl: finalDataUrl, blob: b || file })
              }, 'image/png')
              return
            }
          }
        }

        const finalDataUrl = canvas.toDataURL('image/png')
        canvas.toBlob((b) => {
          resolve({ dataUrl: finalDataUrl, blob: b || file })
        }, 'image/png')
      } catch {
        resolve({ dataUrl: rawDataUrl, blob: file })
      }
    }
    img.onerror = () => resolve({ dataUrl: rawDataUrl, blob: file })
    img.src = rawDataUrl
  })
}

export type StudioStudentItem = {
  id: string
  matricule: string
  first_name: string
  last_name: string
  gender: string | null
  date_of_birth: string | null
  birth_place?: string | null
  blood_group?: string | null
  address?: string | null
  parent_phone?: string | null
  avatar_url?: string | null
}

type SchoolMeta = {
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
  isOpen: boolean
  onClose?: () => void
  className: string
  classLevel?: string | null
  academicYear?: string | null
  students: StudioStudentItem[]
  initialActiveStudentId?: string | null
  onActiveStudentChange?: (studentId: string) => void
  schoolInfo?: SchoolMeta | null
  onStudentsUpdated?: () => void
  mode?: 'modal' | 'embedded'
}

const STORAGE_KEY = 'scogestia_idcard_studio_config_v3'

type TypographyZoneKey =
  | 'schoolName'
  | 'headerOfficial'
  | 'bannerTitle'
  | 'studentName'
  | 'studentDetails'
  | 'footerInfo'

const TYPOGRAPHY_ZONE_TABS: { key: TypographyZoneKey; label: string; basePt: number }[] = [
  { key: 'schoolName', label: "Nom de l'École", basePt: 9.5 },
  { key: 'headerOfficial', label: 'En-tête (MEPST, IEPP...)', basePt: 6.8 },
  { key: 'bannerTitle', label: 'Titre Bandeau', basePt: 7.1 },
  { key: 'studentName', label: 'Nom & Prénoms Élève', basePt: 7.8 },
  { key: 'studentDetails', label: 'Infos (Né le, Sexe)', basePt: 7.5 },
  { key: 'footerInfo', label: 'Année, Classe & Directeur', basePt: 7.6 },
]

const FONT_FAMILY_OPTIONS: { value: CardFontFamily; label: string; cssFont: string }[] = [
  { value: 'times', label: 'Times New Roman (Officiel)', cssFont: '"Times New Roman", Times, serif' },
  { value: 'georgia', label: 'Georgia (Prestige)', cssFont: 'Georgia, Cambria, serif' },
  { value: 'palatino', label: 'Palatino (Élégant)', cssFont: '"Palatino Linotype", "Book Antiqua", Palatino, serif' },
  { value: 'helvetica', label: 'Arial / Helvetica (Moderne)', cssFont: 'Arial, Helvetica, sans-serif' },
  { value: 'verdana', label: 'Verdana (Large & Lisible)', cssFont: 'Verdana, Geneva, sans-serif' },
  { value: 'courier', label: 'Courier (Administratif)', cssFont: '"Courier New", Courier, monospace' },
]

const QUICK_COLOR_PALETTE = [
  { hex: '#0F172A', name: 'Noir Officiel' },
  { hex: '#B41218', name: 'Rouge École' },
  { hex: '#99121C', name: 'Bordeaux Élève' },
  { hex: '#122AB9', name: 'Bleu Royal' },
  { hex: '#0F1D5F', name: 'Bleu Marine' },
  { hex: '#007A33', name: 'Vert Togo' },
  { hex: '#D94619', name: 'Orange Officiel' },
  { hex: '#B45309', name: 'Or Foncé' },
  { hex: '#4338CA', name: 'Indigo' },
]

const BANNER_BG_PALETTE = [
  { hex: '#FDE0C6', name: 'Pêche Officiel' },
  { hex: '#DBEAFE', name: 'Bleu Clair' },
  { hex: '#DCFCE7', name: 'Vert Clair' },
  { hex: '#FEF3C7', name: 'Or Clair' },
  { hex: '#FCE7F3', name: 'Rose Clair' },
  { hex: '#FFFFFF', name: 'Blanc Pur' },
]

function getZoneCssStyle(
  zone: CardZoneTextStyle,
  basePx: number,
  overrideColor?: string
): React.CSSProperties {
  const fontObj =
    FONT_FAMILY_OPTIONS.find((f) => f.value === zone.fontFamily) || FONT_FAMILY_OPTIONS[0]
  const scale = Math.max(0.65, Math.min(1.6, zone.sizeScale || 1))
  return {
    fontFamily: fontObj.cssFont,
    fontSize: `${(basePx * scale).toFixed(1)}px`,
    fontWeight: zone.bold ? 900 : 400,
    fontStyle: zone.italic ? 'italic' : 'normal',
    textDecoration: zone.underline ? 'underline' : 'none',
    textTransform: zone.uppercase ? 'uppercase' : 'none',
    color: overrideColor || zone.color,
  }
}

export type CardThemeOption = {
  id: string
  name: string
  url: string | null
}

const DEFAULT_CARD_THEMES: CardThemeOption[] = [
  {
    id: 'classic',
    name: 'Classique Officiel (Sans image de fond)',
    url: null,
  },
  {
    id: 'theme-1',
    name: 'Thème 1 — Horizon Bleu Urbain',
    url: '/card-themes/theme-1-horizon-bleu.jpg',
  },
  {
    id: 'theme-2',
    name: 'Thème 2 — Prestige Rouge & Or',
    url: '/card-themes/theme-2-prestige-rouge-or.jpg',
  },
  {
    id: 'theme-3',
    name: 'Thème 3 — Royal Bleu & Or',
    url: '/card-themes/theme-3-royal-bleu-or.jpg',
  },
  {
    id: 'theme-4',
    name: 'Thème 4 — Institutionnel Marine & Or',
    url: '/card-themes/theme-4-marine-or.jpg',
  },
  {
    id: 'theme-5',
    name: 'Thème 5 — Azur Cristallin',
    url: '/card-themes/theme-5-azur-cristal.jpg',
  },
  {
    id: 'theme-6',
    name: 'Thème 6 — Floral Saphir & Or',
    url: '/card-themes/theme-6-floral-saphir-or.jpg',
  },
  {
    id: 'theme-7',
    name: 'Thème 7 — Rubans Rouge & Marine',
    url: '/card-themes/theme-7-rubans-rouge-marine.jpg',
  },
  {
    id: 'theme-8',
    name: "Thème 8 — Ruban d'Or & Bleu Royal",
    url: '/card-themes/theme-8-ruban-or-bleu.jpg',
  },
  {
    id: 'theme-9',
    name: 'Thème 9 — Cadre Impérial Marine & Or',
    url: '/card-themes/theme-9-cadre-imperial.jpg',
  },
  {
    id: 'theme-10',
    name: 'Thème 10 — Royal Fleur de Lys & Or',
    url: '/card-themes/theme-10-fleur-de-lys-or.jpg',
  },
  {
    id: 'theme-11',
    name: 'Thème 11 — Futuriste Azur & Croissance',
    url: '/card-themes/theme-11-futuriste-azur.jpg',
  },
  {
    id: 'theme-12',
    name: "Thème 12 — Médaille d'Or & Bleu Nuit",
    url: '/card-themes/theme-12-medaille-or-marine.jpg',
  },
  {
    id: 'theme-13',
    name: 'Thème 13 — Cadre Turquoise & Marine',
    url: '/card-themes/theme-13-cadre-turquoise-marine.jpg',
  },
  {
    id: 'theme-14',
    name: 'Thème 14 — Géométrique Bleu & Orange',
    url: '/card-themes/theme-14-geometrique-bleu-orange.jpg',
  },
  {
    id: 'theme-15',
    name: 'Thème 15 — Tech Institutionnel Bleu & Or',
    url: '/card-themes/theme-15-tech-bleu-or.jpg',
  },
]

const MONTHS_FR = [
  { value: '01', label: '01 - Janvier' },
  { value: '02', label: '02 - Février' },
  { value: '03', label: '03 - Mars' },
  { value: '04', label: '04 - Avril' },
  { value: '05', label: '05 - Mai' },
  { value: '06', label: '06 - Juin' },
  { value: '07', label: '07 - Juillet' },
  { value: '08', label: '08 - Août' },
  { value: '09', label: '09 - Septembre' },
  { value: '10', label: '10 - Octobre' },
  { value: '11', label: '11 - Novembre' },
  { value: '12', label: '12 - Décembre' },
]

const DAYS_LIST = Array.from({ length: 31 }, (_, i) =>
  String(i + 1).padStart(2, '0')
)

const CURRENT_YEAR = new Date().getFullYear()
const YEARS_LIST = Array.from({ length: 40 }, (_, i) =>
  String(CURRENT_YEAR - 2 - i)
)

/**
 * Sélecteur de Date de Naissance intuitif à 3 menus (Jour / Mois / Année)
 */
function BirthDateSelect({
  value,
  onChange,
  compact = false,
}: {
  value: string | null | undefined
  onChange: (isoDate: string) => void
  compact?: boolean
}) {
  const clean = (value || '').slice(0, 10)
  const parts = clean.split('-')
  const yearVal = parts[0]?.length === 4 ? parts[0] : ''
  const monthVal = parts[1]?.length === 2 ? parts[1] : ''
  const dayVal = parts[2]?.length === 2 ? parts[2] : ''

  const handlePartChange = (part: 'day' | 'month' | 'year', newVal: string) => {
    const y = part === 'year' ? newVal : yearVal || '2012'
    const m = part === 'month' ? newVal : monthVal || '01'
    const d = part === 'day' ? newVal : dayVal || '01'
    if (!newVal && !yearVal && !monthVal && !dayVal) {
      onChange('')
      return
    }
    onChange(`${y}-${m}-${d}`)
  }

  const selectClass = compact
    ? 'rounded-lg border border-slate-200 bg-white px-1.5 py-1 text-[11px] font-bold text-slate-800 focus:border-indigo-600 outline-none'
    : 'rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs font-bold text-slate-900 focus:border-indigo-600 outline-none'

  return (
    <div className="flex items-center gap-1.5">
      <select
        value={dayVal}
        onChange={(e) => handlePartChange('day', e.target.value)}
        className={selectClass}
        title="Jour de naissance"
      >
        <option value="">Jour</option>
        {DAYS_LIST.map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>

      <select
        value={monthVal}
        onChange={(e) => handlePartChange('month', e.target.value)}
        className={selectClass}
        title="Mois de naissance"
      >
        <option value="">Mois</option>
        {MONTHS_FR.map((m) => (
          <option key={m.value} value={m.value}>
            {compact ? m.value : m.label}
          </option>
        ))}
      </select>

      <select
        value={yearVal}
        onChange={(e) => handlePartChange('year', e.target.value)}
        className={selectClass}
        title="Année de naissance"
      >
        <option value="">Année</option>
        {YEARS_LIST.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </div>
  )
}

/**
 * Tri alphabétique strict par Nom puis Prénoms
 */
function sortStudentsAlphabetically(list: StudioStudentItem[]): StudioStudentItem[] {
  return [...list].sort((a, b) => {
    const lastCmp = (a.last_name || '').localeCompare(b.last_name || '', 'fr', {
      sensitivity: 'base',
    })
    if (lastCmp !== 0) return lastCmp
    return (a.first_name || '').localeCompare(b.first_name || '', 'fr', {
      sensitivity: 'base',
    })
  })
}

export function SchoolIdCardStudioModal({
  isOpen,
  onClose,
  className,
  classLevel = null,
  academicYear = null,
  students: initialStudents,
  initialActiveStudentId = null,
  onActiveStudentChange,
  schoolInfo = null,
  onStudentsUpdated,
  mode = 'modal',
}: Props) {
  const [localStudents, setLocalStudents] = useState<StudioStudentItem[]>(() =>
    sortStudentsAlphabetically(
      initialStudents.map((s) => ({
        ...s,
        birth_place: s.birth_place || schoolInfo?.city || '',
      }))
    )
  )
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(initialStudents.map((s) => s.id))
  )
  const [activeStudentId, setActiveStudentId] = useState<string>(
    initialActiveStudentId || ''
  )
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const [uploadingAssetType, setUploadingAssetType] = useState<
    'logo' | 'stamp' | 'signature' | null
  >(null)
  const [dirtyStudentIds, setDirtyStudentIds] = useState<Set<string>>(new Set())
  const [isSavingCurrent, setIsSavingCurrent] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterMode, setFilterMode] = useState<'all' | 'missing_photo' | 'missing_info'>('all')
  const [showStudentList, setShowStudentList] = useState(false)

  // Personnalisation complète des Polices, Styles (Gras, Italique, Souligné, Majuscules), Tailles et Couleurs
  const [typographyConfig, setTypographyConfig] = useState<CardTypographyConfig>(
    () => DEFAULT_CARD_TYPOGRAPHY
  )
  const [activeTypoZone, setActiveTypoZone] = useState<TypographyZoneKey>('schoolName')

  // Personnalisation de couleur Lettre par Lettre (ex: M-E-P-S-T, Nom de l'École, Inspection, Bandeau...)
  type LetterColorFieldKey =
    | 'ministryAcronym'
    | 'schoolName'
    | 'inspectionName'
    | 'bannerTitle'
    | 'examCenter'
    | 'republicTitle'
  const [letterColorField, setLetterColorField] =
    useState<LetterColorFieldKey>('ministryAcronym')
  const [selectedLetterIndex, setSelectedLetterIndex] = useState<number>(0)

  const updateZoneTypography = (
    zoneKey: TypographyZoneKey,
    patch: Partial<CardZoneTextStyle>
  ) => {
    setTypographyConfig((prev) => ({
      ...prev,
      [zoneKey]: {
        ...prev[zoneKey],
        ...patch,
      },
    }))
  }

  const applyFontFamilyToAllZones = (fontFamily: CardFontFamily) => {
    setTypographyConfig((prev) => ({
      ...prev,
      schoolName: { ...prev.schoolName, fontFamily },
      headerOfficial: { ...prev.headerOfficial, fontFamily },
      bannerTitle: { ...prev.bannerTitle, fontFamily },
      studentName: { ...prev.studentName, fontFamily },
      studentDetails: { ...prev.studentDetails, fontFamily },
      footerInfo: { ...prev.footerInfo, fontFamily },
    }))
    toast.success('Police appliquée à toute la carte !')
  }

  const resetTypographyToDefault = () => {
    setTypographyConfig(DEFAULT_CARD_TYPOGRAPHY)
    toast.success('Polices, tailles et couleurs réinitialisées au modèle officiel !')
  }

  // Champs 100% modifiables de la carte (si un champ est vidé, il reste blanc sur la carte)
  const [ministryAcronym, setMinistryAcronym] = useState('MEPST')
  const [republicTitle, setRepublicTitle] = useState('REPUBLIQUE TOGOLAISE')
  const [republicMotto, setRepublicMotto] = useState('Travail-Liberté-Patrie')
  const [inspectionName, setInspectionName] = useState(
    schoolInfo?.city ? `IEPP / DRE ${schoolInfo.city.toUpperCase()}` : 'IEPP LACS-OUEST'
  )
  const [schoolNameOverride, setSchoolNameOverride] = useState(
    schoolInfo?.name || 'ÉTABLISSEMENT SCOLAIRE'
  )
  const [examCenter, setExamCenter] = useState(
    schoolInfo?.city || schoolInfo?.name || ''
  )
  const [cardBannerTitle, setCardBannerTitle] = useState("CARTE D'IDENTITE SCOLAIRE")
  const [directorName, setDirectorName] = useState(
    schoolInfo?.director_name || ''
  )
  const [cardAcademicYear, setCardAcademicYear] = useState(
    schoolInfo?.current_academic_year || academicYear || '2025-2026'
  )
  const [classNameOverride, setClassNameOverride] = useState(className)

  const getFieldRawText = (fieldKey: LetterColorFieldKey): string => {
    switch (fieldKey) {
      case 'ministryAcronym':
        return (
          typographyConfig.headerOfficial.uppercase
            ? ministryAcronym.trim().toUpperCase()
            : ministryAcronym.trim()
        ).slice(0, 12)
      case 'schoolName':
        return (
          typographyConfig.schoolName.uppercase
            ? schoolNameOverride.trim().toUpperCase()
            : schoolNameOverride.trim()
        ).slice(0, 34)
      case 'inspectionName':
        return (
          typographyConfig.headerOfficial.uppercase
            ? inspectionName.trim().toUpperCase()
            : inspectionName.trim()
        ).slice(0, 38)
      case 'bannerTitle':
        return (
          typographyConfig.bannerTitle.uppercase
            ? cardBannerTitle.trim().toUpperCase()
            : cardBannerTitle.trim()
        ).slice(0, 34)
      case 'examCenter':
        return examCenter.trim().slice(0, 26)
      case 'republicTitle':
        return (
          typographyConfig.headerOfficial.uppercase
            ? republicTitle.trim().toUpperCase()
            : republicTitle.trim()
        ).slice(0, 28)
    }
  }

  const getFieldDefaultColor = (fieldKey: LetterColorFieldKey): string => {
    if (fieldKey === 'schoolName') return typographyConfig.schoolName.color
    if (fieldKey === 'bannerTitle') return typographyConfig.bannerTitle.color
    if (fieldKey === 'republicTitle') return '#0F172A'
    return typographyConfig.headerOfficial.color
  }

  const getFieldLetterColors = (fieldKey: LetterColorFieldKey, text: string): string[] => {
    const saved = typographyConfig.letterColors?.[fieldKey]
    const fallback = getFieldDefaultColor(fieldKey)
    const defaultMepst =
      fieldKey === 'ministryAcronym' && text.toUpperCase() === 'MEPST'
        ? ['#0F172A', '#0F172A', '#DC2626', '#F59E0B', '#1D4ED8']
        : undefined
    const chars = Array.from(text)
    return chars.map((_, idx) => {
      if (Array.isArray(saved) && saved[idx]) return saved[idx]
      if (defaultMepst && defaultMepst[idx]) return defaultMepst[idx]
      return fallback
    })
  }

  const handleSetLetterColor = (colorHex: string) => {
    const currentText = getFieldRawText(letterColorField)
    if (!currentText) return
    const currentColors = getFieldLetterColors(letterColorField, currentText)
    const safeIdx = Math.min(Math.max(0, selectedLetterIndex), currentColors.length - 1)
    const nextColors = [...currentColors]
    nextColors[safeIdx] = colorHex

    setTypographyConfig((prev) => ({
      ...prev,
      letterColors: {
        ...(prev.letterColors || {}),
        [letterColorField]: nextColors,
      },
    }))

    // Avancer automatiquement le curseur sur la lettre suivante (sans boucler au début !)
    if (safeIdx < currentColors.length - 1) {
      let nextIdx = safeIdx + 1
      while (nextIdx < currentColors.length - 1 && currentText[nextIdx] === ' ') {
        nextIdx++
      }
      setSelectedLetterIndex(nextIdx)
    }
  }

  const handleResetFieldLetterColors = (fieldKey: LetterColorFieldKey) => {
    setTypographyConfig((prev) => {
      const nextMap = { ...(prev.letterColors || {}) }
      if (fieldKey === 'ministryAcronym' && ministryAcronym.trim().toUpperCase() === 'MEPST') {
        nextMap.ministryAcronym = ['#0F172A', '#0F172A', '#DC2626', '#F59E0B', '#1D4ED8']
      } else {
        delete nextMap[fieldKey]
      }
      return {
        ...prev,
        letterColors: nextMap,
      }
    })
    setSelectedLetterIndex(0)
  }

  const renderMulticolorPreview = (
    text: string,
    fieldKey: LetterColorFieldKey,
    fallbackColor: string
  ) => {
    const saved = typographyConfig.letterColors?.[fieldKey]
    const defaultMepst =
      fieldKey === 'ministryAcronym' && text.trim().toUpperCase() === 'MEPST'
        ? ['#0F172A', '#0F172A', '#DC2626', '#F59E0B', '#1D4ED8']
        : undefined
    const colors =
      Array.isArray(saved) && saved.some(Boolean) ? saved : defaultMepst

    if (!colors || colors.length === 0) {
      return <>{text}</>
    }
    return (
      <>
        {Array.from(text).map((ch, idx) => (
          <span key={idx} style={{ color: colors[idx] || fallbackColor }}>
            {ch}
          </span>
        ))}
      </>
    )
  }

  // Assets officiels (chargés automatiquement depuis Paramètres `schools`, ou importables ici)
  const [schoolId, setSchoolId] = useState<string | null>(schoolInfo?.id || null)
  const [logoUrl, setLogoUrl] = useState<string>(schoolInfo?.logo_url || '')
  const [stampUrl, setStampUrl] = useState<string>(schoolInfo?.stamp_url || '')
  const [signatureUrl, setSignatureUrl] = useState<string>(
    schoolInfo?.signature_url || ''
  )
  const [showVectorEmblemIfNoLogo, setShowVectorEmblemIfNoLogo] = useState<boolean>(true)
  const [showVectorStampIfNoStamp, setShowVectorStampIfNoStamp] = useState<boolean>(false)

  // Gestion des Thèmes d'arrière-plan de la carte (navigation Précédent / Suivant SANS boucler au début)
  const [customThemes, setCustomThemes] = useState<CardThemeOption[]>([])
  const allThemes = useMemo(
    () => [...DEFAULT_CARD_THEMES, ...customThemes],
    [customThemes]
  )
  const [activeThemeIndex, setActiveThemeIndex] = useState<number>(0)
  const activeTheme = allThemes[activeThemeIndex] || DEFAULT_CARD_THEMES[0]

  const handlePrevTheme = () => {
    setActiveThemeIndex((prev) => Math.max(0, prev - 1))
  }

  const handleNextTheme = () => {
    setActiveThemeIndex((prev) => Math.min(allThemes.length - 1, prev + 1))
  }

  const handleUploadCustomTheme = async (file?: File | null) => {
    if (!file) return
    try {
      const reader = new FileReader()
      reader.onload = () => {
        const dataUrl = reader.result as string
        const newTheme: CardThemeOption = {
          id: `custom-${Date.now()}`,
          name: `Thème Perso (${file.name.replace(/\.[^.]+$/, '').slice(0, 18)})`,
          url: dataUrl,
        }
        setCustomThemes((prev) => {
          const next = [...prev, newTheme]
          setActiveThemeIndex(DEFAULT_CARD_THEMES.length + next.length - 1)
          return next
        })
        toast.success('Nouveau thème ajouté et appliqué sur la carte !')
      }
      reader.readAsDataURL(file)
    } catch {
      toast.error("Impossible de charger l'image de thème.")
    }
  }

  // Initialisation et tri alphabétique des élèves (avec pré-remplissage intelligent des informations de chaque élève)
  useEffect(() => {
    const sorted = sortStudentsAlphabetically(
      initialStudents.map((s) => ({
        ...s,
        birth_place: s.birth_place || schoolInfo?.city || '',
      }))
    )
    setLocalStudents(sorted)
    setSelectedIds(new Set(sorted.map((s) => s.id)))
    if (sorted.length > 0) {
      setActiveStudentId((prev) => {
        if (initialActiveStudentId && sorted.some((s) => s.id === initialActiveStudentId)) {
          return initialActiveStudentId
        }
        return sorted.some((s) => s.id === prev) ? prev : sorted[0].id
      })
    }
  }, [initialStudents, schoolInfo?.city])

  useEffect(() => {
    if (
      initialActiveStudentId &&
      localStudents.some((s) => s.id === initialActiveStudentId) &&
      initialActiveStudentId !== activeStudentId
    ) {
      setActiveStudentId(initialActiveStudentId)
    }
  }, [initialActiveStudentId, localStudents])

  const selectStudentById = (id: string) => {
    setActiveStudentId(id)
    onActiveStudentChange?.(id)
  }

  useEffect(() => {
    setClassNameOverride(className)
  }, [className])

  // Synchronisation automatique avec les paramètres de l'école (Logo, Cachet, Signature, Directeur)
  useEffect(() => {
    if (!isOpen) return

    // Vérifier d'abord si l'utilisateur a déjà importé un cachet/signature/logo mémorisé localement
    let localSaved: Record<string, any> = {}
    if (typeof window !== 'undefined') {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY)
        if (raw) localSaved = JSON.parse(raw)
      } catch {
        // Ignore
      }
    }

    if (localSaved.logoUrl) setLogoUrl(localSaved.logoUrl)
    else if (schoolInfo?.logo_url) setLogoUrl(schoolInfo.logo_url)

    if (localSaved.stampUrl) setStampUrl(localSaved.stampUrl)
    else if (schoolInfo?.stamp_url) setStampUrl(schoolInfo.stamp_url)

    if (localSaved.signatureUrl) setSignatureUrl(localSaved.signature_url)
    else if (schoolInfo?.signature_url) setSignatureUrl(schoolInfo.signature_url)

    if (schoolInfo?.director_name) setDirectorName(schoolInfo.director_name)
    if (schoolInfo?.name) setSchoolNameOverride(schoolInfo.name)

    // Requête directe vers `user_school_roles` + `schools` pour récupérer les paramètres de l'école
    const fetchLatestSchoolSettings = async () => {
      try {
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return

        const { data: roleRow } = await supabase
          .from('user_school_roles')
          .select('school_id')
          .eq('user_id', user.id)
          .maybeSingle()

        const targetSchoolId = roleRow?.school_id || schoolInfo?.id
        if (!targetSchoolId) return
        setSchoolId(targetSchoolId)

        const { data: schoolRow } = await supabase
          .from('schools')
          .select(
            'id, name, city, current_academic_year, director_name, logo_url, stamp_url, signature_url'
          )
          .eq('id', targetSchoolId)
          .maybeSingle()

        if (schoolRow) {
          if (!localSaved.logoUrl && schoolRow.logo_url) setLogoUrl(schoolRow.logo_url)
          if (!localSaved.stampUrl && schoolRow.stamp_url) setStampUrl(schoolRow.stamp_url)
          if (!localSaved.signatureUrl && schoolRow.signature_url) {
            setSignatureUrl(schoolRow.signature_url)
          }
          if (schoolRow.director_name) setDirectorName(schoolRow.director_name)
          if (schoolRow.name) setSchoolNameOverride(schoolRow.name)
          if (schoolRow.current_academic_year) {
            setCardAcademicYear(schoolRow.current_academic_year)
          }
        }
      } catch {
        // Ignore
      }
    }

    fetchLatestSchoolSettings()
  }, [isOpen])

  // Charger les textes personnalisés mémorisés dans localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.ministryAcronym !== undefined) setMinistryAcronym(parsed.ministryAcronym)
        if (parsed.republicTitle !== undefined) setRepublicTitle(parsed.republicTitle)
        if (parsed.republicMotto !== undefined) setRepublicMotto(parsed.republicMotto)
        if (parsed.inspectionName !== undefined) setInspectionName(parsed.inspectionName)
        if (parsed.examCenter !== undefined) setExamCenter(parsed.examCenter)
        if (parsed.cardBannerTitle !== undefined) setCardBannerTitle(parsed.cardBannerTitle)
        if (parsed.logoUrl) setLogoUrl(parsed.logoUrl)
        if (parsed.stampUrl) setStampUrl(parsed.stampUrl)
        if (parsed.signatureUrl) setSignatureUrl(parsed.signatureUrl)
        if (typeof parsed.activeThemeIndex === 'number') {
          setActiveThemeIndex(parsed.activeThemeIndex)
        }
        if (Array.isArray(parsed.customThemes)) {
          setCustomThemes(parsed.customThemes)
        }
        if (parsed.typographyConfig) {
          setTypographyConfig({
            ...DEFAULT_CARD_TYPOGRAPHY,
            ...parsed.typographyConfig,
          })
        }
      }
    } catch {
      // Ignore
    }
  }, [])

  const persistHeaderConfig = (overrides?: {
    logoUrl?: string
    stampUrl?: string
    signatureUrl?: string
  }) => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          ministryAcronym,
          republicTitle,
          republicMotto,
          inspectionName,
          examCenter,
          cardBannerTitle,
          activeThemeIndex,
          customThemes,
          typographyConfig,
          logoUrl: overrides?.logoUrl !== undefined ? overrides.logoUrl : logoUrl,
          stampUrl: overrides?.stampUrl !== undefined ? overrides.stampUrl : stampUrl,
          signatureUrl:
            overrides?.signatureUrl !== undefined ? overrides.signatureUrl : signatureUrl,
        })
      )
    } catch {
      // Ignore
    }
  }

  // Upload direct du Logo, du Cachet ou de la Signature (supporte captures 66 Ko, 90 Ko, jusqu'à 15 Mo)
  const handleSchoolAssetUpload = async (
    type: 'logo' | 'stamp' | 'signature',
    file?: File | null
  ) => {
    if (!file) return
    if (file.size > 15 * 1024 * 1024) {
      toast.error("L'image est trop volumineuse (max 15 Mo).")
      return
    }

    try {
      setUploadingAssetType(type)

      // 1. Traitement immédiat côté navigateur (détourage du fond blanc de capture + recadrage)
      const processed = await processAssetImageFile(file, type)

      // Affichage immédiat sur la carte + mémorisation locale garantie
      if (type === 'logo') {
        setLogoUrl(processed.dataUrl)
        persistHeaderConfig({ logoUrl: processed.dataUrl })
      } else if (type === 'stamp') {
        setStampUrl(processed.dataUrl)
        persistHeaderConfig({ stampUrl: processed.dataUrl })
      } else {
        setSignatureUrl(processed.dataUrl)
        persistHeaderConfig({ signatureUrl: processed.dataUrl })
      }

      // 2. Envoi du PNG optimisé sur Supabase Storage + synchronisation avec `schools` (Paramètres)
      const supabase = createClient()
      const folder = schoolId ? `school_${schoolId}/${type}` : `school_assets/${type}`
      const fileName = `${folder}/${type}_${Date.now()}.png`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, processed.blob, {
          upsert: true,
          contentType: 'image/png',
        })

      if (!uploadError) {
        const { data: publicUrlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName)

        const remoteUrl = publicUrlData?.publicUrl
        if (remoteUrl) {
          if (type === 'logo') {
            setLogoUrl(remoteUrl)
            persistHeaderConfig({ logoUrl: remoteUrl })
          } else if (type === 'stamp') {
            setStampUrl(remoteUrl)
            persistHeaderConfig({ stampUrl: remoteUrl })
          } else {
            setSignatureUrl(remoteUrl)
            persistHeaderConfig({ signatureUrl: remoteUrl })
          }
          await updateSchoolAssetUrl(type, remoteUrl)
        }
      } else {
        // Même si le bucket refuse, on sauvegarde le DataURL dans `schools` pour que ça marche partout
        await updateSchoolAssetUrl(type, processed.dataUrl)
      }

      const labelFr =
        type === 'logo'
          ? "Logo de l'école"
          : type === 'stamp'
            ? 'Cachet officiel'
            : 'Signature du Directeur'
      toast.success(`${labelFr} importé et appliqué sur la carte !`)
    } catch (err) {
      console.error(err)
      toast.error("Erreur lors de l'import du fichier.")
    } finally {
      setUploadingAssetType(null)
    }
  }

  const activeIndex = useMemo(() => {
    const idx = localStudents.findIndex((s) => s.id === activeStudentId)
    return idx >= 0 ? idx : 0
  }, [localStudents, activeStudentId])

  const activeStudent = useMemo(() => {
    return (
      localStudents[activeIndex] ||
      localStudents[0] || {
        id: 'demo',
        matricule: '25-001',
        first_name: 'Rachida',
        last_name: 'ADAM',
        gender: 'F',
        date_of_birth: '2014-06-19',
        birth_place: schoolInfo?.city || 'Lomé',
        avatar_url: null,
      }
    )
  }, [localStudents, activeIndex, schoolInfo?.city])

  const filteredStudents = useMemo(() => {
    return localStudents.filter((s) => {
      const q = searchQuery.trim().toLowerCase()
      const matchesSearch =
        !q ||
        s.first_name.toLowerCase().includes(q) ||
        s.last_name.toLowerCase().includes(q) ||
        (s.matricule || '').toLowerCase().includes(q)

      if (!matchesSearch) return false
      if (filterMode === 'missing_photo') return !s.avatar_url
      if (filterMode === 'missing_info') {
        return !s.date_of_birth || !s.birth_place || !s.gender
      }
      return true
    })
  }, [localStudents, searchQuery, filterMode])

  const photosReadyCount = useMemo(
    () => localStudents.filter((s) => Boolean(s.avatar_url)).length,
    [localStudents]
  )

  // Liste des élèves cochés dans l'ordre alphabétique et découpage en lots de 10 (sans compléter la dernière page !)
  const selectedStudentsOrdered = useMemo(
    () => localStudents.filter((s) => selectedIds.has(s.id)),
    [localStudents, selectedIds]
  )

  const batchesOfTen = useMemo(() => {
    const batches: {
      pageNumber: number
      startIndex: number
      endIndex: number
      students: StudioStudentItem[]
    }[] = []
    for (let i = 0; i < selectedStudentsOrdered.length; i += 10) {
      const slice = selectedStudentsOrdered.slice(i, i + 10)
      batches.push({
        pageNumber: Math.floor(i / 10) + 1,
        startIndex: i + 1,
        endIndex: i + slice.length,
        students: slice,
      })
    }
    return batches
  }, [selectedStudentsOrdered])

  const handleFieldChange = (
    studentId: string,
    field: 'first_name' | 'last_name' | 'date_of_birth' | 'birth_place' | 'gender' | 'matricule',
    value: string
  ) => {
    setLocalStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, [field]: value } : s))
    )
    setDirtyStudentIds((prev) => {
      const next = new Set(prev)
      next.add(studentId)
      return next
    })
  }

  const handlePhotoUpload = async (studentId: string, file?: File | null) => {
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error("L'image est trop volumineuse (max 5 Mo).")
      return
    }

    try {
      setUploadingId(studentId)
      setActiveStudentId(studentId)
      const supabase = createClient()

      const ext = file.name.split('.').pop() || 'jpg'
      const fileName = `${studentId}-${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      const newAvatarUrl = publicUrlData.publicUrl

      const { error: updateError } = await supabase
        .from('students')
        .update({ avatar_url: newAvatarUrl })
        .eq('id', studentId)

      if (updateError) throw updateError

      setLocalStudents((prev) =>
        prev.map((s) => (s.id === studentId ? { ...s, avatar_url: newAvatarUrl } : s))
      )
      toast.success('Photo de l’élève enregistrée !')
      onStudentsUpdated?.()
    } catch (err) {
      console.error(err)
      toast.error("Erreur lors de l'envoi de la photo.")
    } finally {
      setUploadingId(null)
    }
  }

  // Enregistre l'élève actif (et/ou tous les élèves modifiés) dans Supabase
  const saveStudentToDb = async (studentId: string) => {
    const st = localStudents.find((s) => s.id === studentId)
    if (!st) return false
    try {
      setIsSavingCurrent(true)
      const supabase = createClient()
      const { error } = await supabase
        .from('students')
        .update({
          first_name: st.first_name.trim(),
          last_name: st.last_name.trim(),
          date_of_birth: st.date_of_birth || null,
          birth_place: st.birth_place?.trim() || null,
          gender: st.gender || null,
          matricule: st.matricule?.trim() || st.matricule,
        })
        .eq('id', studentId)

      if (error) throw error

      setDirtyStudentIds((prev) => {
        const next = new Set(prev)
        next.delete(studentId)
        return next
      })
      onStudentsUpdated?.()
      return true
    } catch (err) {
      console.error(err)
      toast.error("Erreur lors de l'enregistrement de l'élève.")
      return false
    } finally {
      setIsSavingCurrent(false)
    }
  }

  const saveAllModifiedStudentsToDb = async () => {
    if (dirtyStudentIds.size === 0) return true
    try {
      setIsSavingCurrent(true)
      const supabase = createClient()
      const idsToSave = Array.from(dirtyStudentIds)

      await Promise.all(
        idsToSave.map(async (id) => {
          const st = localStudents.find((s) => s.id === id)
          if (!st) return
          await supabase
            .from('students')
            .update({
              first_name: st.first_name.trim(),
              last_name: st.last_name.trim(),
              date_of_birth: st.date_of_birth || null,
              birth_place: st.birth_place?.trim() || null,
              gender: st.gender || null,
              matricule: st.matricule?.trim() || st.matricule,
            })
            .eq('id', id)
        })
      )

      setDirtyStudentIds(new Set())
      onStudentsUpdated?.()
      return true
    } catch (err) {
      console.error(err)
      toast.error('Erreur lors de la sauvegarde des informations élèves.')
      return false
    } finally {
      setIsSavingCurrent(false)
    }
  }

  const handlePrevStudent = () => {
    if (activeIndex <= 0) return
    const prevIdx = activeIndex - 1
    const prevStudent = localStudents[prevIdx]
    selectStudentById(prevStudent.id)
    toast.success(
      `Élève ${prevIdx + 1}/${localStudents.length} : ${prevStudent.last_name.toUpperCase()} ${prevStudent.first_name}`
    )
  }

  const handleNextStudent = () => {
    if (activeIndex >= localStudents.length - 1) return
    const nextIdx = activeIndex + 1
    const nextStudent = localStudents[nextIdx]
    selectStudentById(nextStudent.id)
    toast.success(
      `Élève ${nextIdx + 1}/${localStudents.length} : ${nextStudent.last_name.toUpperCase()} ${nextStudent.first_name} (Infos pré-remplies)`
    )
  }

  // Enregistrer la carte actuelle et passer automatiquement à l'élève suivant (sans recommencer au début sur le dernier élève)
  const handleSaveAndNextStudent = async () => {
    if (!activeStudent) return
    persistHeaderConfig()
    const ok = await saveStudentToDb(activeStudent.id)
    if (!ok) return

    if (activeIndex < localStudents.length - 1) {
      const nextStudent = localStudents[activeIndex + 1]
      selectStudentById(nextStudent.id)
      toast.success(
        `Carte enregistrée ! Passage à l'élève ${activeIndex + 2}/${localStudents.length} : ${nextStudent.last_name.toUpperCase()} ${nextStudent.first_name}`
      )
    } else {
      toast.success(
        `Dernière carte de la classe (${localStudents.length}/${localStudents.length}) enregistrée avec succès !`
      )
    }
  }

  const buildDocDataForStudent = (s: StudioStudentItem): StudentDocumentData => ({
    studentId: s.id,
    matricule: s.matricule || 'N/A',
    firstName: s.first_name,
    lastName: s.last_name,
    dateOfBirth: s.date_of_birth,
    birthPlace: s.birth_place || '',
    gender: s.gender,
    bloodGroup: s.blood_group || null,
    className: classNameOverride.trim() || className,
    classLevel,
    parentPhone: s.parent_phone || null,
    address: s.address || null,
    avatarUrl: s.avatar_url || null,
    schoolName: schoolNameOverride.trim(),
    schoolCity: schoolInfo?.city || null,
    schoolPhone: schoolInfo?.phone || null,
    schoolEmail: schoolInfo?.email || null,
    academicYear: cardAcademicYear.trim(),
    directorName: directorName.trim(),
    schoolLogoUrl: logoUrl || null,
    schoolStampUrl: stampUrl || null,
    schoolSignatureUrl: signatureUrl || null,
    inspectionName: inspectionName.trim(),
    examCenter: examCenter.trim(),
    ministryAcronym: ministryAcronym.trim(),
    republicTitle: republicTitle.trim(),
    republicMotto: republicMotto.trim(),
    cardBannerTitle: cardBannerTitle.trim(),
    hideFallbackEmblem: !showVectorEmblemIfNoLogo,
    hideFallbackStamp: !showVectorStampIfNoStamp,
    themeBackgroundUrl: activeTheme?.url || null,
    typography: typographyConfig,
  })

  // Génère soit tous les lots de 10 (ex: 47 élèves -> 10, 10, 10, 10, 7), soit un lot spécifique de 10 (ou le reste)
  const handleGenerateSheets = async (targetStudents: StudioStudentItem[], batchLabel?: string) => {
    if (targetStudents.length === 0) {
      toast.error('Veuillez sélectionner au moins un élève.')
      return
    }

    try {
      setIsGenerating(true)
      persistHeaderConfig()

      if (dirtyStudentIds.size > 0) {
        await saveAllModifiedStudentsToDb()
      }

      const docs = targetStudents.map(buildDocDataForStudent)
      const label = batchLabel
        ? `${classNameOverride || className}_${batchLabel}`
        : classNameOverride || className
      await generateClassStudentIdCardsPDF(label, docs)

      const pagesCount = Math.ceil(docs.length / 10)
      const lastPageCount = docs.length % 10 === 0 ? 10 : docs.length % 10
      toast.success(
        pagesCount > 1
          ? `PDF généré : ${docs.length} cartes sur ${pagesCount} pages (dont ${lastPageCount} carte(s) sur la dernière page) !`
          : `Planche PDF générée : ${docs.length} carte(s) sur la page A4 !`
      )
    } catch (err) {
      console.error(err)
      toast.error('Erreur lors de la génération du PDF.')
    } finally {
      setIsGenerating(false)
    }
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredStudents.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredStudents.map((s) => s.id)))
    }
  }

  const toggleStudentSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (!isOpen) return null

  const selectedCount = selectedStudentsOrdered.length
  const pagesCount = Math.max(1, Math.ceil(selectedCount / 10))
  const remainderOnLastPage =
    selectedCount === 0 ? 0 : selectedCount % 10 === 0 ? 10 : selectedCount % 10

  const currentZoneMeta =
    TYPOGRAPHY_ZONE_TABS.find((t) => t.key === activeTypoZone) || TYPOGRAPHY_ZONE_TABS[0]
  const currentZoneStyle = typographyConfig[activeTypoZone]

  const wrapperClass =
    mode === 'embedded'
      ? 'w-full'
      : 'fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto'

  const cardContainerClass =
    mode === 'embedded'
      ? 'relative w-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col'
      : 'relative w-full max-w-6xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[95vh] animate-in fade-in zoom-in-95 duration-200'

  return (
    <div className={wrapperClass}>
      <div className={cardContainerClass}>
        {/* Bandeau Supérieur (uniquement en mode modal) */}
        {mode === 'modal' && (
          <div className="relative flex items-center justify-between gap-4 bg-gradient-to-r from-[#1E293B] via-[#312E81] to-[#4338CA] px-5 py-3.5 text-white shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25 backdrop-blur-md">
                <IdCard className="h-5 w-5 text-amber-300" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-white">
                    Studio Officiel — Cartes d&apos;Identité Scolaires
                  </h2>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/20 px-2.5 py-0.5 text-[11px] font-extrabold text-emerald-200 ring-1 ring-emerald-300/30">
                    <Sparkles className="h-3 w-3" />
                    10 Cartes / Page A4 • Recto Seul • Ordre Alphabétique
                  </span>
                </div>
                <p className="text-xs text-indigo-100/90 mt-0.5">
                  Classe : <strong className="text-white">{className}</strong> • Polices, tailles, gras, italique, souligné, couleurs, thèmes, logo, cachet & signature 100% personnalisables.
                </p>
              </div>
            </div>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl bg-white/10 p-2 text-white/80 hover:bg-white/20 hover:text-white transition-colors"
                title="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        )}

        {/* Contenu Principal Défilant */}
        <div className={mode === 'embedded' ? 'p-4 sm:p-5 space-y-5 bg-slate-50/70' : 'flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 bg-slate-50/70'}>
          {/* SECTION 1 : Personnalisation Intégrale de la Carte + Aperçu en Direct + Édition Élève par Élève */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* COLONNE GAUCHE (5 cols) : Paramètres Globaux de la Carte + Cachet / Signature / Logo */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.08)] space-y-5">
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-indigo-950 flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 text-indigo-600" />
                  1. Textes, Logo, Cachet & Signature de la Carte
                </h3>
                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  Champ vidé = Reste blanc
                </span>
              </div>

              {/* Grille des textes modifiables de la carte */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Sigle Ministère (Haut Gauche)
                  </label>
                  <input
                    type="text"
                    value={ministryAcronym}
                    onChange={(e) => setMinistryAcronym(e.target.value)}
                    placeholder="Ex: MEPST (ou laisser vide)"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-2.5 py-1.5 text-xs font-extrabold text-slate-900 focus:border-indigo-600 focus:bg-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Inspection / DRE / IEPP
                  </label>
                  <input
                    type="text"
                    value={inspectionName}
                    onChange={(e) => setInspectionName(e.target.value)}
                    placeholder="Ex: IEPP LACS-OUEST (ou vide)"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-2.5 py-1.5 text-xs font-bold text-indigo-950 focus:border-indigo-600 focus:bg-white outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Nom de l&apos;Établissement (en rouge au centre)
                  </label>
                  <input
                    type="text"
                    value={schoolNameOverride}
                    onChange={(e) => setSchoolNameOverride(e.target.value)}
                    placeholder="Ex: EPP AGBODANKOPE / EPL LE ROI"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-2.5 py-1.5 text-xs font-extrabold uppercase text-red-700 focus:border-indigo-600 focus:bg-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Centre d&apos;Écrit (ou vide)
                  </label>
                  <input
                    type="text"
                    value={examCenter}
                    onChange={(e) => setExamCenter(e.target.value)}
                    placeholder="Ex: Agbodankopé (ou laisser vide)"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-2.5 py-1.5 text-xs font-bold text-blue-900 focus:border-indigo-600 focus:bg-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Année Scolaire
                  </label>
                  <input
                    type="text"
                    value={cardAcademicYear}
                    onChange={(e) => setCardAcademicYear(e.target.value)}
                    placeholder="Ex: 2025-2026"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-2.5 py-1.5 text-xs font-bold text-red-800 focus:border-indigo-600 focus:bg-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Nom du Directeur (Bas Droite)
                  </label>
                  <input
                    type="text"
                    value={directorName}
                    onChange={(e) => setDirectorName(e.target.value)}
                    placeholder="Ex: GNAMAVO Kodjo (ou vide)"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:border-indigo-600 focus:bg-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Titre de la Carte (Bandeau)
                  </label>
                  <input
                    type="text"
                    value={cardBannerTitle}
                    onChange={(e) => setCardBannerTitle(e.target.value)}
                    placeholder="CARTE D'IDENTITE SCOLAIRE"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-2.5 py-1.5 text-xs font-bold text-blue-900 focus:border-indigo-600 focus:bg-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Mention République (Haut Droite)
                  </label>
                  <input
                    type="text"
                    value={republicTitle}
                    onChange={(e) => setRepublicTitle(e.target.value)}
                    placeholder="REPUBLIQUE TOGOLAISE"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:border-indigo-600 focus:bg-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Devise Nationale (Haut Droite)
                  </label>
                  <input
                    type="text"
                    value={republicMotto}
                    onChange={(e) => setRepublicMotto(e.target.value)}
                    placeholder="Travail-Liberté-Patrie"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:border-indigo-600 focus:bg-white outline-none"
                  />
                </div>
              </div>

              {/* Bloc Logo, Cachet du Directeur & Signature (Synchronisés avec Paramètres + Import direct) */}
              <div className="pt-2 border-t border-slate-100 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-950">
                    Logo, Cachet & Signature (Synchronisés avec Paramètres)
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {/* 1. LOGO ÉCOLE */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-2 flex flex-col items-center text-center justify-between">
                    <span className="text-[10px] font-extrabold text-slate-700 mb-1">
                      Logo École
                    </span>
                    <div className="h-11 w-11 rounded-lg bg-white border border-slate-200 flex items-center justify-center overflow-hidden mb-1.5">
                      {logoUrl ? (
                        <img src={logoUrl} alt="Logo" className="h-full w-full object-contain" />
                      ) : (
                        <ImageIcon className="h-4 w-4 text-slate-400" />
                      )}
                    </div>
                    <div className="flex items-center gap-1 w-full">
                      <label className="flex-1 cursor-pointer rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-1.5 py-1 text-[10px] font-bold text-indigo-800 flex items-center justify-center gap-1">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={uploadingAssetType === 'logo'}
                          onChange={(e) => {
                            const f = e.target.files?.[0]
                            e.currentTarget.value = ''
                            handleSchoolAssetUpload('logo', f)
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
                          onClick={() => {
                            setLogoUrl('')
                            persistHeaderConfig({ logoUrl: '' })
                            updateSchoolAssetUrl('logo', null)
                            setShowVectorEmblemIfNoLogo(false)
                          }}
                          className="p-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                          title="Retirer le logo (laisser blanc)"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                    {!logoUrl && (
                      <label className="mt-1 flex items-center gap-1 text-[9.5px] text-slate-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showVectorEmblemIfNoLogo}
                          onChange={(e) => setShowVectorEmblemIfNoLogo(e.target.checked)}
                        />
                        Emblème RT
                      </label>
                    )}
                  </div>

                  {/* 2. CACHET DU DIRECTEUR */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-2 flex flex-col items-center text-center justify-between">
                    <span className="text-[10px] font-extrabold text-slate-700 mb-1">
                      Cachet École
                    </span>
                    <div className="h-11 w-11 rounded-lg bg-white border border-slate-200 flex items-center justify-center overflow-hidden mb-1.5">
                      {stampUrl ? (
                        <img
                          src={stampUrl}
                          alt="Cachet"
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <Stamp className="h-4 w-4 text-slate-400" />
                      )}
                    </div>
                    <div className="flex items-center gap-1 w-full">
                      <label className="flex-1 cursor-pointer rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-1.5 py-1 text-[10px] font-bold text-indigo-800 flex items-center justify-center gap-1">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={uploadingAssetType === 'stamp'}
                          onChange={(e) => {
                            const f = e.target.files?.[0]
                            e.currentTarget.value = ''
                            handleSchoolAssetUpload('stamp', f)
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
                          onClick={() => {
                            setStampUrl('')
                            persistHeaderConfig({ stampUrl: '' })
                            updateSchoolAssetUrl('stamp', null)
                            setShowVectorStampIfNoStamp(false)
                          }}
                          className="p-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                          title="Retirer le cachet (laisser blanc)"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                    {!stampUrl && (
                      <label className="mt-1 flex items-center gap-1 text-[9.5px] text-slate-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showVectorStampIfNoStamp}
                          onChange={(e) => setShowVectorStampIfNoStamp(e.target.checked)}
                        />
                        Cachet auto
                      </label>
                    )}
                  </div>

                  {/* 3. SIGNATURE DU DIRECTEUR */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-2 flex flex-col items-center text-center justify-between">
                    <span className="text-[10px] font-extrabold text-slate-700 mb-1">
                      Signature
                    </span>
                    <div className="h-11 w-11 rounded-lg bg-white border border-slate-200 flex items-center justify-center overflow-hidden mb-1.5">
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
                    <div className="flex items-center gap-1 w-full">
                      <label className="flex-1 cursor-pointer rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-1.5 py-1 text-[10px] font-bold text-indigo-800 flex items-center justify-center gap-1">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={uploadingAssetType === 'signature'}
                          onChange={(e) => {
                            const f = e.target.files?.[0]
                            e.currentTarget.value = ''
                            handleSchoolAssetUpload('signature', f)
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
                          onClick={() => {
                            setSignatureUrl('')
                            persistHeaderConfig({ signatureUrl: '' })
                            updateSchoolAssetUrl('signature', null)
                          }}
                          className="p-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                          title="Retirer la signature (laisser blanc)"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                    {!signatureUrl && (
                      <span className="mt-1 text-[9.5px] text-slate-400">
                        Vide = Blanc
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* BLOC TYPOGRAPHIE : Polices, Styles (Gras, Italique, Souligné, Majuscules), Tailles & Couleurs */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-950 flex items-center gap-1.5">
                    <Type className="h-3.5 w-3.5 text-indigo-600" />
                    Polices, Style, Taille, Gras, Italique, Souligné & Couleurs
                  </span>
                  <button
                    type="button"
                    onClick={resetTypographyToDefault}
                    className="inline-flex items-center gap-1 rounded-lg bg-slate-100 hover:bg-slate-200 px-2 py-1 text-[10px] font-bold text-slate-700 transition-colors"
                    title="Réinitialiser toutes les polices, tailles et couleurs au modèle officiel"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Par défaut
                  </button>
                </div>

                {/* Changement rapide de la police sur toute la carte d'un seul clic */}
                <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-2.5 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10.5px] font-bold text-indigo-950">
                      Police globale (Appliquer à toute la carte) :
                    </span>
                    <select
                      value={currentZoneStyle.fontFamily}
                      onChange={(e) =>
                        applyFontFamilyToAllZones(e.target.value as CardFontFamily)
                      }
                      className="rounded-lg border border-indigo-200 bg-white px-2 py-1 text-[11px] font-extrabold text-indigo-950 outline-none focus:border-indigo-600"
                    >
                      {FONT_FAMILY_OPTIONS.map((f) => (
                        <option key={f.value} value={f.value}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Sélecteur de Zone à personnaliser */}
                <div>
                  <label className="block text-[10.5px] font-bold text-slate-600 mb-1.5">
                    Choisir l&apos;élément de la carte à personnaliser :
                  </label>
                  <div className="flex flex-wrap gap-1 rounded-xl bg-slate-100/80 p-1">
                    {TYPOGRAPHY_ZONE_TABS.map((tab) => {
                      const isTabActive = activeTypoZone === tab.key
                      return (
                        <button
                          key={tab.key}
                          type="button"
                          onClick={() => setActiveTypoZone(tab.key)}
                          className={`px-2.5 py-1 rounded-lg text-[10.5px] font-semibold whitespace-nowrap transition-all duration-150 ${
                            isTabActive
                              ? 'bg-white text-indigo-700 shadow-[0_1px_2px_rgba(15,23,42,0.12)] ring-1 ring-slate-200'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                          }`}
                        >
                          {tab.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Barre d'outils de la zone active : Police + Taille + Gras / Italique / Souligné / Majuscules + Couleur */}
                <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3.5 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                    {/* Police de la zone */}
                    <div className="sm:col-span-7">
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                        Police ({currentZoneMeta.label})
                      </label>
                      <select
                        value={currentZoneStyle.fontFamily}
                        onChange={(e) =>
                          updateZoneTypography(activeTypoZone, {
                            fontFamily: e.target.value as CardFontFamily,
                          })
                        }
                        className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-bold text-slate-900 outline-none focus:border-indigo-600"
                      >
                        {FONT_FAMILY_OPTIONS.map((f) => (
                          <option key={f.value} value={f.value}>
                            {f.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Taille de police (- / +) */}
                    <div className="sm:col-span-5">
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                        Taille ({(currentZoneMeta.basePt * currentZoneStyle.sizeScale).toFixed(1)} pt •{' '}
                        {Math.round(currentZoneStyle.sizeScale * 100)}%)
                      </label>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            updateZoneTypography(activeTypoZone, {
                              sizeScale: Math.max(
                                0.7,
                                Number((currentZoneStyle.sizeScale - 0.08).toFixed(2))
                              ),
                            })
                          }
                          className="h-7 w-7 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 flex items-center justify-center text-slate-700"
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
                            updateZoneTypography(activeTypoZone, {
                              sizeScale: parseFloat(e.target.value),
                            })
                          }
                          className="flex-1 accent-indigo-600 cursor-pointer"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            updateZoneTypography(activeTypoZone, {
                              sizeScale: Math.min(
                                1.45,
                                Number((currentZoneStyle.sizeScale + 0.08).toFixed(2))
                              ),
                            })
                          }
                          className="h-7 w-7 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 flex items-center justify-center text-slate-700"
                          title="Augmenter la taille"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Boutons Style : Gras (B), Italique (I), Souligné (U), Majuscules (AA) */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <div className="flex items-center gap-0.5 rounded-lg bg-white p-0.5 ring-1 ring-slate-200 [&>button]:!border-transparent [&>button]:!shadow-none [&>button]:!rounded-md">
                      <button
                        type="button"
                        onClick={() =>
                          updateZoneTypography(activeTypoZone, {
                            bold: !currentZoneStyle.bold,
                          })
                        }
                        className={`px-2.5 py-1.5 rounded-lg border text-xs font-black flex items-center gap-1 transition-all ${
                          currentZoneStyle.bold
                            ? 'bg-indigo-950 text-white border-indigo-950 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                        title="Gras (Bold)"
                      >
                        <Bold className="h-3.5 w-3.5" />
                        Gras
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          updateZoneTypography(activeTypoZone, {
                            italic: !currentZoneStyle.italic,
                          })
                        }
                        className={`px-2.5 py-1.5 rounded-lg border text-xs italic font-bold flex items-center gap-1 transition-all ${
                          currentZoneStyle.italic
                            ? 'bg-indigo-950 text-white border-indigo-950 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                        title="Italique"
                      >
                        <Italic className="h-3.5 w-3.5" />
                        Italique
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          updateZoneTypography(activeTypoZone, {
                            underline: !currentZoneStyle.underline,
                          })
                        }
                        className={`px-2.5 py-1.5 rounded-lg border text-xs underline font-bold flex items-center gap-1 transition-all ${
                          currentZoneStyle.underline
                            ? 'bg-indigo-950 text-white border-indigo-950 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                        title="Souligné"
                      >
                        <Underline className="h-3.5 w-3.5" />
                        Souligné
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          updateZoneTypography(activeTypoZone, {
                            uppercase: !currentZoneStyle.uppercase,
                          })
                        }
                        className={`px-2 py-1.5 rounded-lg border text-[11px] font-extrabold transition-all ${
                          currentZoneStyle.uppercase
                            ? 'bg-indigo-950 text-white border-indigo-950 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                        title="Forcer en MAJUSCULES"
                      >
                        AA
                      </button>
                    </div>

                    {/* Sélecteur de couleur libre */}
                    <label
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1 cursor-pointer"
                      title="Choisir une couleur personnalisée"
                    >
                      <input
                        type="color"
                        value={currentZoneStyle.color}
                        onChange={(e) =>
                          updateZoneTypography(activeTypoZone, { color: e.target.value })
                        }
                        className="h-5 w-5 rounded border-0 cursor-pointer bg-transparent"
                      />
                      <span className="text-[10.5px] font-mono font-bold text-slate-700 uppercase">
                        {currentZoneStyle.color}
                      </span>
                    </label>
                  </div>

                  {/* Pastilles de couleurs rapides */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                    <span className="text-[10px] font-bold text-slate-500 mr-1">Couleur :</span>
                    {QUICK_COLOR_PALETTE.map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => updateZoneTypography(activeTypoZone, { color: c.hex })}
                        className={`h-5 w-5 rounded-full border transition-transform ${
                          currentZoneStyle.color.toUpperCase() === c.hex.toUpperCase()
                            ? 'scale-125 ring-2 ring-indigo-500 border-white'
                            : 'border-slate-300 hover:scale-110'
                        }`}
                        style={{ backgroundColor: c.hex }}
                        title={c.name}
                      />
                    ))}
                  </div>

                  {/* Si la zone active est le Bandeau Titre, proposer aussi la couleur de fond du bandeau */}
                  {activeTypoZone === 'bannerTitle' && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-1.5 border-t border-slate-200/80">
                      <span className="text-[10px] font-bold text-slate-600 mr-1">
                        Fond du bandeau :
                      </span>
                      {BANNER_BG_PALETTE.map((bg) => (
                        <button
                          key={bg.hex}
                          type="button"
                          onClick={() =>
                            setTypographyConfig((prev) => ({
                              ...prev,
                              bannerBgColor: bg.hex,
                            }))
                          }
                          className={`h-5 px-2 rounded-md border text-[9.5px] font-bold transition-all ${
                            typographyConfig.bannerBgColor.toUpperCase() === bg.hex.toUpperCase()
                              ? 'ring-2 ring-indigo-600 border-indigo-600 text-slate-900'
                              : 'border-slate-300 text-slate-700'
                          }`}
                          style={{ backgroundColor: bg.hex }}
                        >
                          {bg.name}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* PERSONNALISATION COULEUR LETTRE PAR LETTRE (EX: M-E-P-S-T, NOM ÉCOLE, BANDEAU...) */}
                  {(() => {
                    const activeLetterText = getFieldRawText(letterColorField)
                    const activeLetterColors = getFieldLetterColors(
                      letterColorField,
                      activeLetterText
                    )
                    const safeSelectedIdx = Math.min(
                      Math.max(0, selectedLetterIndex),
                      Math.max(0, activeLetterText.length - 1)
                    )
                    const selectedChar = activeLetterText[safeSelectedIdx] || ''
                    const selectedCharColor =
                      activeLetterColors[safeSelectedIdx] || getFieldDefaultColor(letterColorField)

                    return (
                      <div className="pt-2.5 mt-1 border-t border-slate-200/90 space-y-2">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-indigo-950 flex items-center gap-1">
                            <Palette className="h-3.5 w-3.5 text-indigo-600" />
                            Couleur Lettre par Lettre (Ex: M-E-P-S-T)
                          </span>
                          <button
                            type="button"
                            onClick={() => handleResetFieldLetterColors(letterColorField)}
                            className="text-[10px] font-bold text-slate-500 hover:text-indigo-700 px-1.5 py-0.5 rounded bg-white border border-slate-200"
                            title="Réinitialiser les couleurs des lettres de ce texte"
                          >
                            Réinitialiser lettres
                          </button>
                        </div>

                        {/* Choix du texte à colorer lettre par lettre */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-semibold text-slate-600 shrink-0">
                            Texte :
                          </span>
                          <select
                            value={letterColorField}
                            onChange={(e) => {
                              setLetterColorField(e.target.value as typeof letterColorField)
                              setSelectedLetterIndex(0)
                            }}
                            className="flex-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-900 outline-none focus:border-indigo-600"
                          >
                            <option value="ministryAcronym">
                              Sigle Ministère ({ministryAcronym || 'MEPST'})
                            </option>
                            <option value="schoolName">
                              Nom de l&apos;École ({schoolNameOverride.slice(0, 18)})
                            </option>
                            <option value="inspectionName">
                              Inspection / IEPP ({inspectionName.slice(0, 18)})
                            </option>
                            <option value="bannerTitle">
                              Titre Bandeau ({cardBannerTitle.slice(0, 18)})
                            </option>
                            <option value="examCenter">
                              Centre d&apos;Écrit ({examCenter.slice(0, 18)})
                            </option>
                            <option value="republicTitle">
                              Mention République ({republicTitle.slice(0, 18)})
                            </option>
                          </select>
                        </div>

                        {/* Cases cliquables pour chaque lettre du mot (ex: M | E | P | S | T) */}
                        {activeLetterText.length > 0 ? (
                          <>
                            <div className="flex items-center gap-1 flex-wrap bg-white p-2 rounded-xl border border-slate-200/90">
                              {Array.from(activeLetterText).map((ch, idx) => {
                                const isSel = idx === safeSelectedIdx
                                const charColor = activeLetterColors[idx] || '#0F172A'
                                return (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => setSelectedLetterIndex(idx)}
                                    className={`min-w-[26px] h-7 px-1.5 rounded-lg border text-xs font-black transition-all flex items-center justify-center ${
                                      isSel
                                        ? 'ring-2 ring-indigo-600 border-indigo-600 bg-indigo-50/70 scale-110 shadow-2xs'
                                        : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100'
                                    }`}
                                    style={{ color: charColor }}
                                    title={`Cliquez pour sélectionner la lettre "${ch}" (position ${idx + 1})`}
                                  >
                                    {ch === ' ' ? '␣' : ch}
                                  </button>
                                )
                              })}
                            </div>

                            {/* Palette de couleur dédiée à la lettre sélectionnée */}
                            <div className="flex items-center justify-between gap-2 flex-wrap bg-indigo-50/50 px-2.5 py-1.5 rounded-xl border border-indigo-100">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[10px] font-extrabold text-indigo-950">
                                  Lettre « {selectedChar === ' ' ? 'Espace' : selectedChar} » :
                                </span>
                                {[
                                  { hex: '#0F172A', name: 'Noir' },
                                  { hex: '#DC2626', name: 'Rouge' },
                                  { hex: '#F59E0B', name: 'Jaune / Or' },
                                  { hex: '#1D4ED8', name: 'Bleu Royal' },
                                  { hex: '#007A33', name: 'Vert Togo' },
                                  { hex: '#99121C', name: 'Bordeaux' },
                                  { hex: '#7C3AED', name: 'Violet' },
                                  { hex: '#EA580C', name: 'Orange' },
                                  { hex: '#0284C7', name: 'Bleu Ciel' },
                                ].map((c) => (
                                  <button
                                    key={c.hex}
                                    type="button"
                                    onClick={() => handleSetLetterColor(c.hex)}
                                    className={`h-4 w-4 rounded-full border transition-transform ${
                                      selectedCharColor.toUpperCase() === c.hex.toUpperCase()
                                        ? 'scale-125 ring-2 ring-indigo-600 border-white'
                                        : 'border-slate-300 hover:scale-110'
                                    }`}
                                    style={{ backgroundColor: c.hex }}
                                    title={`Mettre la lettre "${selectedChar}" en ${c.name}`}
                                  />
                                ))}
                              </div>

                              <label
                                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 cursor-pointer"
                                title="Autre couleur au choix pour cette lettre"
                              >
                                <input
                                  type="color"
                                  value={selectedCharColor}
                                  onChange={(e) => handleSetLetterColor(e.target.value)}
                                  className="h-4 w-4 rounded border-0 cursor-pointer bg-transparent"
                                />
                                <span className="text-[9.5px] font-mono font-bold text-slate-700">
                                  Autre
                                </span>
                              </label>
                            </div>
                          </>
                        ) : (
                          <p className="text-[10.5px] text-slate-400 italic">
                            Saisissez d&apos;abord un texte dans ce champ pour colorer ses lettres.
                          </p>
                        )}
                      </div>
                    )
                  })()}
                </div>
              </div>
            </div>

            {/* COLONNE DROITE (7 cols) : Aperçu Temps Réel + Saisie Élève par Élève (Enregistrer -> Suivant) */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.08)] space-y-5">
              {/* Barre de navigation Alphabétique Élève par Élève (Toujours visible — Sans retour au début sur Suivant) */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-indigo-600" />
                  <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-950">
                    2. Aperçu &amp; Saisie Carte par Carte ({activeIndex + 1} / {localStudents.length})
                  </span>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    disabled={activeIndex <= 0}
                    onClick={handlePrevStudent}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-2xs transition-all flex items-center gap-1 disabled:opacity-40 disabled:pointer-events-none"
                    title="Revenir à l'élève précédent"
                  >
                    <ChevronLeft className="h-3.5 w-3.5 text-slate-600" />
                    Précédent
                  </button>

                  <select
                    value={activeStudent.id}
                    onChange={(e) => selectStudentById(e.target.value)}
                    className="rounded-lg border border-indigo-200 bg-indigo-50/60 px-2.5 py-1.5 text-xs font-extrabold text-indigo-950 outline-none max-w-[220px] cursor-pointer"
                  >
                    {localStudents.map((s, idx) => (
                      <option key={s.id} value={s.id}>
                        Élève {idx + 1}/{localStudents.length} — {s.last_name.toUpperCase()} {s.first_name}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    disabled={activeIndex >= localStudents.length - 1}
                    onClick={handleNextStudent}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs font-bold text-white shadow-2xs transition-all flex items-center gap-1 disabled:opacity-40 disabled:pointer-events-none"
                    title="Passer à l'élève suivant"
                  >
                    Suivant
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* NAVIGATION DU THÈME (UNIQUEMENT PAR FLÈCHES PRÉCÉDENT / SUIVANT — SANS BOUCLER AU DÉBUT) */}
              <div className="rounded-xl border border-slate-200/90 bg-slate-50/70 px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Palette className="h-4 w-4 text-indigo-600" />
                  <span className="text-xs font-bold text-slate-800">
                    Thème d&apos;arrière-plan de la carte
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400">
                    ({activeThemeIndex + 1} / {allThemes.length})
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={activeThemeIndex <= 0}
                    onClick={handlePrevTheme}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-xs font-bold text-slate-800 shadow-2xs transition-all flex items-center gap-1 disabled:opacity-40 disabled:pointer-events-none"
                    title="Thème précédent (aperçu direct sur la carte)"
                  >
                    <ChevronLeft className="h-3.5 w-3.5 text-indigo-600" />
                    Précédent
                  </button>

                  <button
                    type="button"
                    disabled={activeThemeIndex >= allThemes.length - 1}
                    onClick={handleNextTheme}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-xs font-bold text-slate-800 shadow-2xs transition-all flex items-center gap-1 disabled:opacity-40 disabled:pointer-events-none"
                    title="Thème suivant (aperçu direct sur la carte)"
                  >
                    Suivant
                    <ChevronRight className="h-3.5 w-3.5 text-indigo-600" />
                  </button>

                  <label
                    className="cursor-pointer px-2.5 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50/80 hover:bg-emerald-100 text-[11px] font-bold text-emerald-800 transition-colors flex items-center gap-1"
                    title="Importer un fond personnalisé"
                  >
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleUploadCustomTheme(e.target.files?.[0])}
                    />
                    <Upload className="h-3 w-3" />
                    + Fond
                  </label>
                </div>
              </div>

              {/* APERÇU VISUEL TEMPS RÉEL DE LA CARTE OFFICIELLE (AVEC THÈME EN ARRIÈRE-PLAN) */}
              <div className="mx-auto w-full max-w-[465px] rounded-md p-[5px] bg-[#007A33] shadow-md select-none">
                <div className="rounded-[2px] p-[4px] bg-[#FFCE00]">
                  <div className="relative bg-[#EEF4FA] text-slate-900 overflow-hidden">
                    {/* Image du Thème en arrière-plan sous tous les éléments de la carte */}
                    {activeTheme.url && (
                      <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
                        <img
                          src={activeTheme.url}
                          alt=""
                          className="h-full w-full object-fill"
                        />
                        {/* Voile de lisibilité calibré pour que toutes les écritures ressortent parfaitement */}
                        <div className="absolute inset-0 bg-white/30" />
                        <div
                          className="absolute inset-0"
                          style={{
                            background:
                              'radial-gradient(circle at 58% 52%, rgba(255,255,255,0.62) 0%, rgba(255,255,255,0.36) 65%, rgba(255,255,255,0.08) 100%)',
                          }}
                        />
                      </div>
                    )}

                    {/* En-tête de la carte */}
                    <div className="px-2.5 pt-1.5 pb-1.5 relative z-10 min-h-[62px]">
                      <div className="flex items-start justify-between gap-2">
                        {/* Gauche : Sigle Ministère (MEPST ou personnalisé avec couleur lettre par lettre !) + Logo École */}
                        <div className="flex flex-col items-center shrink-0 min-w-[44px]">
                          <div
                            className="leading-none tracking-tight h-[14px]"
                            style={getZoneCssStyle(typographyConfig.headerOfficial, 13, '#0F172A')}
                          >
                            {ministryAcronym.trim().length > 0 ? (
                              <span style={getZoneCssStyle(typographyConfig.headerOfficial, 12.5)}>
                                {renderMulticolorPreview(
                                  (typographyConfig.headerOfficial.uppercase
                                    ? ministryAcronym.trim().toUpperCase()
                                    : ministryAcronym.trim()
                                  ).slice(0, 12),
                                  'ministryAcronym',
                                  typographyConfig.headerOfficial.color
                                )}
                              </span>
                            ) : null}
                          </div>

                          {logoUrl ? (
                            <div className="mt-1 h-11 w-10 rounded-full border border-emerald-600 bg-white flex items-center justify-center shadow-2xs overflow-hidden">
                              <img
                                src={logoUrl}
                                alt="Logo école"
                                className="h-9 w-9 object-contain"
                              />
                            </div>
                          ) : showVectorEmblemIfNoLogo ? (
                            <div className="mt-1 h-11 w-10 rounded-full border border-emerald-600 bg-white flex flex-col items-center justify-center shadow-2xs">
                              <span className="text-[6px] font-bold text-emerald-800">🇹🇬</span>
                              <span className="px-1 py-0.5 rounded-full bg-amber-300 text-[8px] font-serif font-black text-slate-950 border border-amber-500">
                                RT
                              </span>
                            </div>
                          ) : (
                            <div className="mt-1 h-11 w-10" />
                          )}
                        </div>

                        {/* Centre + Droite */}
                        <div className="flex-1 flex flex-col">
                          <div className="text-right leading-tight min-h-[22px]">
                            {republicTitle.trim() && (
                              <div
                                className="tracking-tight"
                                style={getZoneCssStyle(
                                  typographyConfig.headerOfficial,
                                  10.5,
                                  '#0F172A'
                                )}
                              >
                                {renderMulticolorPreview(
                                  (typographyConfig.headerOfficial.uppercase
                                    ? republicTitle.trim().toUpperCase()
                                    : republicTitle.trim()
                                  ).slice(0, 28),
                                  'republicTitle',
                                  '#0F172A'
                                )}
                              </div>
                            )}
                            {republicMotto.trim() && (
                              <div
                                className="pr-2"
                                style={getZoneCssStyle(
                                  typographyConfig.headerOfficial,
                                  9.5,
                                  '#0F172A'
                                )}
                              >
                                {republicMotto}
                              </div>
                            )}
                          </div>

                          <div className="text-center mt-0.5 space-y-0.5">
                            {inspectionName.trim() && (
                              <div
                                className="tracking-wide truncate"
                                style={getZoneCssStyle(typographyConfig.headerOfficial, 10.5)}
                              >
                                {renderMulticolorPreview(
                                  (typographyConfig.headerOfficial.uppercase
                                    ? inspectionName.trim().toUpperCase()
                                    : inspectionName.trim()
                                  ).slice(0, 38),
                                  'inspectionName',
                                  typographyConfig.headerOfficial.color
                                )}
                              </div>
                            )}
                            {schoolNameOverride.trim() && (
                              <div
                                className="leading-none tracking-tight truncate"
                                style={getZoneCssStyle(typographyConfig.schoolName, 15)}
                              >
                                {renderMulticolorPreview(
                                  (typographyConfig.schoolName.uppercase
                                    ? schoolNameOverride.trim().toUpperCase()
                                    : schoolNameOverride.trim()
                                  ).slice(0, 34),
                                  'schoolName',
                                  typographyConfig.schoolName.color
                                )}
                              </div>
                            )}
                            {examCenter.trim() && (
                              <div
                                className="leading-tight"
                                style={getZoneCssStyle(typographyConfig.headerOfficial, 11)}
                              >
                                <span className="text-slate-950">Centre d&apos;Ecrit: </span>
                                <span style={{ color: typographyConfig.headerOfficial.color }}>
                                  {renderMulticolorPreview(
                                    examCenter.trim().slice(0, 26),
                                    'examCenter',
                                    typographyConfig.headerOfficial.color
                                  )}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Double trait tricolore de séparation */}
                    <div className="relative z-10 h-[2px] w-full bg-red-700" />
                    <div className="relative z-10 h-[2px] w-full bg-[#007A33]" />
                    <div className="relative z-10 h-[1.5px] w-full bg-[#FFCE00]" />

                    {/* Corps de la carte : Photo à gauche + Infos à droite */}
                    <div
                      className={`relative z-10 grid grid-cols-12 ${
                        activeTheme.url ? 'bg-transparent' : 'bg-[#F8FAFC]'
                      }`}
                    >
                      {/* Photo Passeport (Gauche — cliquable pour changer la photo) */}
                      <div className="col-span-4 p-1">
                        <label
                          className="w-full h-[142px] border-2 border-[#C2410C] bg-sky-100 overflow-hidden flex flex-col items-center justify-center relative cursor-pointer group"
                          title="Cliquez pour importer la photo de cet élève"
                        >
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={uploadingId === activeStudent.id}
                            onChange={(e) =>
                              handlePhotoUpload(activeStudent.id, e.target.files?.[0])
                            }
                          />
                          {activeStudent.avatar_url ? (
                            <img
                              src={activeStudent.avatar_url}
                              alt={activeStudent.first_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center text-center p-2">
                              <Camera className="h-6 w-6 text-blue-800 mb-1" />
                              <span className="text-[9px] font-extrabold text-blue-900 uppercase">
                                + Cliquer pour Photo
                              </span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold">
                            {uploadingId === activeStudent.id ? (
                              <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                              'Changer Photo'
                            )}
                          </div>
                        </label>
                      </div>

                      {/* Informations d'état civil (Droite) */}
                      <div className="col-span-8 flex flex-col justify-between pb-1.5 pr-1.5">
                        <div>
                          {/* Bandeau CARTE D'IDENTITE SCOLAIRE */}
                          <div
                            className="py-0.5 px-2 text-center border-b border-amber-200/80 min-h-[20px]"
                            style={{ backgroundColor: typographyConfig.bannerBgColor || '#FDE0C6' }}
                          >
                            {cardBannerTitle.trim() && (
                              <span
                                className="tracking-tight"
                                style={getZoneCssStyle(typographyConfig.bannerTitle, 11.5)}
                              >
                                {renderMulticolorPreview(
                                  (typographyConfig.bannerTitle.uppercase
                                    ? cardBannerTitle.trim().toUpperCase()
                                    : cardBannerTitle.trim()
                                  ).slice(0, 34),
                                  'bannerTitle',
                                  typographyConfig.bannerTitle.color
                                )}
                              </span>
                            )}
                          </div>

                          <div className="px-2 pt-1.5 space-y-0.5 leading-snug">
                            <div className="truncate">
                              <span style={getZoneCssStyle(typographyConfig.studentDetails, 12)}>
                                Nom:{' '}
                              </span>
                              <span
                                className="uppercase"
                                style={getZoneCssStyle(typographyConfig.studentName, 12)}
                              >
                                {activeStudent.last_name}
                              </span>
                            </div>
                            <div className="truncate">
                              <span style={getZoneCssStyle(typographyConfig.studentDetails, 12)}>
                                Prénoms:{' '}
                              </span>
                              <span style={getZoneCssStyle(typographyConfig.studentName, 12)}>
                                {activeStudent.first_name}
                              </span>
                            </div>
                            <div className="truncate">
                              <span style={getZoneCssStyle(typographyConfig.studentDetails, 11.5)}>
                                Né (e) le{' '}
                                {activeStudent.date_of_birth
                                  ? new Date(activeStudent.date_of_birth).toLocaleDateString(
                                      'fr-FR'
                                    )
                                  : '—'}{' '}
                                {activeStudent.birth_place
                                  ? `à ${activeStudent.birth_place}`
                                  : ''}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div>
                                <span
                                  style={getZoneCssStyle(
                                    typographyConfig.studentDetails,
                                    12,
                                    '#D94619'
                                  )}
                                >
                                  Sexe{' '}
                                </span>
                                <span style={getZoneCssStyle(typographyConfig.studentDetails, 12)}>
                                  :{' '}
                                </span>
                                <span
                                  style={getZoneCssStyle(
                                    typographyConfig.studentName,
                                    12,
                                    '#122AB9'
                                  )}
                                >
                                  {activeStudent.gender || '—'}
                                </span>
                              </div>
                              <span className="text-[9px] font-sans font-bold text-slate-400">
                                Mle: {activeStudent.matricule}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Bas de la carte : Année scolaire + Classe + Vrai Cachet/Signature (ou blanc) + Directeur */}
                        <div className="px-2 pt-1 flex items-end justify-between relative">
                          <div className="leading-tight">
                            <div
                              className="underline decoration-[#122AB9]"
                              style={getZoneCssStyle(typographyConfig.footerInfo, 11, '#0F172A')}
                            >
                              <span className="text-slate-950">Année </span>
                              <span className="text-[#122AB9]">Scolaire</span>
                            </div>
                            <div
                              className="pl-1 min-h-[16px]"
                              style={getZoneCssStyle(typographyConfig.footerInfo, 13)}
                            >
                              {cardAcademicYear}
                            </div>
                            <div
                              className="mt-0.5"
                              style={getZoneCssStyle(typographyConfig.footerInfo, 12, '#0F172A')}
                            >
                              <span className="text-slate-950 font-semibold">Classe : </span>
                              <span
                                style={getZoneCssStyle(
                                  typographyConfig.footerInfo,
                                  12,
                                  '#192AB9'
                                )}
                              >
                                {classNameOverride || className}
                              </span>
                            </div>
                          </div>

                          {/* Zone Cachet + Signature + Nom du Directeur (si rien n'est saisi, reste blanc !) */}
                          <div className="flex flex-col items-end min-w-[100px] min-h-[58px] justify-end">
                            <div className="relative flex items-center justify-center h-14 w-28">
                              {stampUrl ? (
                                <img
                                  src={stampUrl}
                                  alt="Cachet officiel"
                                  className="h-14 w-16 object-contain"
                                />
                              ) : showVectorStampIfNoStamp ? (
                                <div className="h-12 w-12 rounded-full border-2 border-[#122ABE] flex flex-col items-center justify-center text-[#122ABE] text-center p-0.5 bg-white/60">
                                  <span className="text-[4.2px] font-black uppercase leading-none">
                                    REPUBLIQUE TOGOLAISE
                                  </span>
                                  <span className="text-[6.5px] font-black my-0.5">★ RT ★</span>
                                  <span className="text-[4px] font-extrabold uppercase leading-none truncate max-w-[36px]">
                                    {(schoolNameOverride || 'ÉCOLE').slice(0, 14)}
                                  </span>
                                </div>
                              ) : null}

                              {signatureUrl && (
                                <img
                                  src={signatureUrl}
                                  alt="Signature Directeur"
                                  className="h-11 w-20 object-contain absolute right-0 bottom-0 pointer-events-none"
                                />
                              )}
                            </div>

                            {directorName.trim() && (
                              <div
                                className="leading-none mt-0.5"
                                style={getZoneCssStyle(typographyConfig.footerInfo, 11)}
                              >
                                {directorName}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* FORMULAIRE DE SAISIE RAPIDE DE L'ÉLÈVE ACTIF + BOUTONS « ENREGISTRER » & « SUIVANT » */}
              <div className="rounded-xl border border-indigo-200/80 bg-indigo-50/40 p-3.5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white text-xs font-extrabold">
                      {activeIndex + 1}
                    </span>
                    <span className="text-xs font-extrabold text-indigo-950">
                      Élève actif : {activeStudent.last_name.toUpperCase()}{' '}
                      {activeStudent.first_name}
                    </span>
                  </div>

                  <label className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl bg-white border border-indigo-200 px-3 py-1.5 text-xs font-extrabold text-indigo-800 hover:bg-indigo-50 shadow-2xs transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingId === activeStudent.id}
                      onChange={(e) =>
                        handlePhotoUpload(activeStudent.id, e.target.files?.[0])
                      }
                    />
                    {uploadingId === activeStudent.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Camera className="h-3.5 w-3.5 text-indigo-600" />
                    )}
                    {activeStudent.avatar_url
                      ? 'Remplacer la photo de cet élève'
                      : 'Uploader la photo de cet élève'}
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                  <div className="sm:col-span-4">
                    <label className="block text-[10.5px] font-bold text-slate-700 mb-1">
                      Nom de l&apos;élève (MAJUSCULE)
                    </label>
                    <input
                      type="text"
                      value={activeStudent.last_name}
                      onChange={(e) =>
                        handleFieldChange(activeStudent.id, 'last_name', e.target.value)
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-extrabold uppercase text-red-800 focus:border-indigo-600 outline-none"
                    />
                  </div>

                  <div className="sm:col-span-4">
                    <label className="block text-[10.5px] font-bold text-slate-700 mb-1">
                      Prénoms de l&apos;élève
                    </label>
                    <input
                      type="text"
                      value={activeStudent.first_name}
                      onChange={(e) =>
                        handleFieldChange(activeStudent.id, 'first_name', e.target.value)
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:border-indigo-600 outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10.5px] font-bold text-slate-700 mb-1">
                      Sexe
                    </label>
                    <select
                      value={activeStudent.gender?.toUpperCase() || ''}
                      onChange={(e) =>
                        handleFieldChange(activeStudent.id, 'gender', e.target.value)
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-xs font-extrabold text-indigo-950 focus:border-indigo-600 outline-none"
                    >
                      <option value="">—</option>
                      <option value="F">F (Fille)</option>
                      <option value="M">M (Garçon)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10.5px] font-bold text-slate-700 mb-1">
                      Classe
                    </label>
                    <input
                      type="text"
                      value={classNameOverride}
                      onChange={(e) => setClassNameOverride(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-extrabold text-indigo-950 focus:border-indigo-600 outline-none"
                    />
                  </div>

                  {/* Sélecteur Jour / Mois / Année */}
                  <div className="sm:col-span-7">
                    <label className="block text-[10.5px] font-bold text-slate-700 mb-1">
                      Date de naissance (Jour / Mois / Année)
                    </label>
                    <BirthDateSelect
                      value={activeStudent.date_of_birth}
                      onChange={(iso) =>
                        handleFieldChange(activeStudent.id, 'date_of_birth', iso)
                      }
                    />
                  </div>

                  <div className="sm:col-span-5">
                    <label className="block text-[10.5px] font-bold text-slate-700 mb-1">
                      Lieu de naissance (à ...)
                    </label>
                    <input
                      type="text"
                      value={activeStudent.birth_place || ''}
                      onChange={(e) =>
                        handleFieldChange(activeStudent.id, 'birth_place', e.target.value)
                      }
                      placeholder={schoolInfo?.city || 'Ex: Lomé'}
                      className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs font-bold text-slate-900 focus:border-indigo-600 outline-none"
                    />
                  </div>
                </div>

                {/* Boutons d'action : Précédent / Enregistrer / Suivant / Enregistrer & Élève Suivant (Sans retour au début sur le dernier) */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-indigo-200/60">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={activeIndex <= 0}
                      onClick={handlePrevStudent}
                      className="px-2.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all flex items-center gap-1 disabled:opacity-40 disabled:pointer-events-none"
                      title="Revenir à la carte de l'élève précédent"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                      Précédent
                    </button>

                    <span className="text-[11px] font-semibold text-slate-600 px-1.5">
                      Élève <strong>{activeIndex + 1} / {localStudents.length}</strong>
                    </span>

                    <button
                      type="button"
                      disabled={activeIndex >= localStudents.length - 1}
                      onClick={handleNextStudent}
                      className="px-2.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold transition-all flex items-center gap-1 disabled:opacity-40 disabled:pointer-events-none"
                      title="Passer à la carte de l'élève suivant"
                    >
                      Suivant
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      disabled={isGenerating}
                      onClick={() =>
                        handleGenerateSheets(
                          [activeStudent],
                          `${activeStudent.last_name}_${activeStudent.first_name}`
                        )
                      }
                      className="px-3 py-2 rounded-xl border border-indigo-200 bg-white hover:bg-indigo-50 text-indigo-900 text-xs font-extrabold transition-colors flex items-center gap-1.5"
                      title="Générer uniquement la carte de cet élève en PDF"
                    >
                      <Printer className="h-3.5 w-3.5 text-indigo-600" />
                      Carte PDF
                    </button>

                    <button
                      type="button"
                      disabled={isSavingCurrent}
                      onClick={async () => {
                        persistHeaderConfig()
                        const ok = await saveStudentToDb(activeStudent.id)
                        if (ok) toast.success('Carte de l’élève enregistrée !')
                      }}
                      className="px-3.5 py-2 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-extrabold transition-colors flex items-center gap-1.5"
                    >
                      {isSavingCurrent ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Save className="h-3.5 w-3.5 text-emerald-700" />
                      )}
                      Enregistrer
                    </button>

                    <button
                      type="button"
                      disabled={isSavingCurrent}
                      onClick={handleSaveAndNextStudent}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold shadow-xs transition-all flex items-center gap-1.5"
                      title={
                        activeIndex < localStudents.length - 1
                          ? "Enregistrer cette carte et passer immédiatement à l'élève suivant"
                          : 'Enregistrer la dernière carte de la classe'
                      }
                    >
                      {isSavingCurrent ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <>
                          <Save className="h-3.5 w-3.5" />
                          <span>
                            {activeIndex < localStudents.length - 1
                              ? 'Enregistrer & Élève Suivant'
                              : 'Enregistrer (Dernier élève)'}
                          </span>
                          {activeIndex < localStudents.length - 1 && (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3 : Liste Complète des Élèves de la Classe (Masquée par défaut, affichable en 1 clic) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70">
              <div className="flex items-center gap-2.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setShowStudentList((prev) => !prev)}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold shadow-2xs transition-all flex items-center gap-2"
                >
                  <Layers className="h-3.5 w-3.5 text-amber-300" />
                  <span>
                    {showStudentList
                      ? `Masquer la liste complète des élèves (${localStudents.length}) ▴`
                      : `Afficher la liste complète des élèves de la classe (${localStudents.length} élèves) ▾`}
                  </span>
                </button>

                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                    photosReadyCount === localStudents.length
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border border-amber-200'
                  }`}
                >
                  {photosReadyCount === localStudents.length ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                  )}
                  {photosReadyCount}/{localStudents.length} avec photo
                </span>
              </div>

              {showStudentList && (
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="relative w-full sm:w-52">
                    <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Rechercher un élève..."
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-600"
                    />
                  </div>

                  <div className="flex items-center rounded-xl bg-slate-100 p-0.5 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setFilterMode('all')}
                      className={`px-2.5 py-1 rounded-lg transition-all ${
                        filterMode === 'all' ? 'bg-white text-indigo-950 shadow-2xs' : 'text-slate-600'
                      }`}
                    >
                      Tous ({localStudents.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterMode('missing_photo')}
                      className={`px-2.5 py-1 rounded-lg transition-all ${
                        filterMode === 'missing_photo'
                          ? 'bg-white text-amber-800 shadow-2xs'
                          : 'text-slate-600'
                      }`}
                    >
                      Sans photo ({localStudents.length - photosReadyCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterMode('missing_info')}
                      className={`px-2.5 py-1 rounded-lg transition-all ${
                        filterMode === 'missing_info'
                          ? 'bg-white text-indigo-950 shadow-2xs'
                          : 'text-slate-600'
                      }`}
                    >
                      Infos à compléter
                    </button>
                  </div>
                </div>
              )}
            </div>

            {showStudentList && (
              <div className="overflow-x-auto max-h-[260px] overflow-y-auto border-t border-slate-200">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="sticky top-0 z-10 bg-slate-100 border-b border-slate-200 text-[11px] font-extrabold text-slate-600 uppercase">
                    <tr>
                      <th className="py-2 px-3 w-10 text-center">
                        <button
                          type="button"
                          onClick={toggleSelectAll}
                          className="inline-flex items-center justify-center text-indigo-700"
                          title="Tout sélectionner / désélectionner"
                        >
                          {selectedIds.size === filteredStudents.length &&
                          filteredStudents.length > 0 ? (
                            <CheckSquare className="h-4 w-4" />
                          ) : (
                            <Square className="h-4 w-4 text-slate-400" />
                          )}
                        </button>
                      </th>
                      <th className="py-2 px-2 w-10">N°</th>
                      <th className="py-2 px-3">Photo</th>
                      <th className="py-2 px-3">Nom (Ordre A-Z)</th>
                      <th className="py-2 px-3">Prénoms</th>
                      <th className="py-2 px-3">Date de Naissance (J/M/A)</th>
                      <th className="py-2 px-3">Lieu de naissance</th>
                      <th className="py-2 px-3 text-center">Sexe</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/70">
                    {filteredStudents.map((st, idx) => {
                      const isSelected = selectedIds.has(st.id)
                      const isActive = activeStudent.id === st.id
                      const isUploadingThis = uploadingId === st.id

                      return (
                        <tr
                          key={st.id}
                          onClick={() => selectStudentById(st.id)}
                          className={`transition-colors cursor-pointer ${
                            isActive
                              ? 'bg-indigo-50/80 ring-1 ring-inset ring-indigo-300'
                              : isSelected
                                ? 'hover:bg-slate-50'
                                : 'opacity-60 bg-slate-50/40'
                          }`}
                        >
                          <td
                            className="py-2 px-3 text-center"
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleStudentSelection(st.id)
                            }}
                          >
                            {isSelected ? (
                              <CheckSquare className="h-4 w-4 text-indigo-600 inline" />
                            ) : (
                              <Square className="h-4 w-4 text-slate-400 inline" />
                            )}
                          </td>

                          <td className="py-2 px-2 font-bold text-slate-500">{idx + 1}</td>

                          {/* Upload Photo en 1 clic */}
                          <td className="py-2 px-3" onClick={(e) => e.stopPropagation()}>
                            <label className="inline-flex items-center gap-2 cursor-pointer group">
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                disabled={isUploadingThis}
                                onChange={(e) => handlePhotoUpload(st.id, e.target.files?.[0])}
                              />
                              <div className="h-9 w-8 rounded-md border border-slate-300 bg-slate-100 overflow-hidden flex items-center justify-center relative">
                                {st.avatar_url ? (
                                  <img
                                    src={st.avatar_url}
                                    alt={st.first_name}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <Camera className="h-3.5 w-3.5 text-slate-400" />
                                )}
                                {isUploadingThis && (
                                  <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center">
                                    <Loader2 className="h-3.5 w-3.5 text-white animate-spin" />
                                  </div>
                                )}
                              </div>
                              <span
                                className={`px-2 py-0.5 rounded-md font-bold text-[10.5px] ${
                                  st.avatar_url
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                }`}
                              >
                                {st.avatar_url ? 'Photo OK' : '+ Photo'}
                              </span>
                            </label>
                          </td>

                          <td className="py-2 px-3 font-extrabold uppercase text-red-800">
                            {st.last_name}
                          </td>

                          <td className="py-2 px-3 font-bold text-slate-900">
                            {st.first_name}
                          </td>

                          <td className="py-2 px-3" onClick={(e) => e.stopPropagation()}>
                            <BirthDateSelect
                              compact
                              value={st.date_of_birth}
                              onChange={(iso) =>
                                handleFieldChange(st.id, 'date_of_birth', iso)
                              }
                            />
                          </td>

                          <td className="py-2 px-3" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="text"
                              value={st.birth_place || ''}
                              onChange={(e) =>
                                handleFieldChange(st.id, 'birth_place', e.target.value)
                              }
                              placeholder={schoolInfo?.city || 'Ex: Lomé'}
                              className="w-full max-w-[120px] rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-800 focus:border-indigo-600 outline-none"
                            />
                          </td>

                          <td className="py-2 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <select
                              value={st.gender?.toUpperCase() || ''}
                              onChange={(e) =>
                                handleFieldChange(st.id, 'gender', e.target.value)
                              }
                              className="rounded-lg border border-slate-200 bg-white px-1.5 py-1 text-xs font-extrabold text-indigo-950 focus:border-indigo-600 outline-none"
                            >
                              <option value="">—</option>
                              <option value="F">F</option>
                              <option value="M">M</option>
                            </select>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Barre d'Action Inférieure */}
        <div className="border-t border-slate-200 bg-white px-5 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 text-xs text-slate-600">
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span>
              <strong>{selectedCount} carte{selectedCount > 1 ? 's' : ''}</strong> à générer •{' '}
              {pagesCount > 1 ? (
                <>
                  <strong>{pagesCount} pages A4</strong> (10 par page, et{' '}
                  <strong className="text-indigo-950">
                    {remainderOnLastPage} carte{remainderOnLastPage > 1 ? 's' : ''} sur la dernière page
                  </strong>
                  )
                </>
              ) : (
                <strong className="text-indigo-950">
                  {selectedCount} carte{selectedCount > 1 ? 's' : ''} sur 1 page A4
                </strong>
              )}
            </span>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap w-full sm:w-auto justify-end">
            {mode === 'modal' && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors"
              >
                Fermer
              </button>
            )}

            <button
              type="button"
              disabled={isGenerating || selectedCount === 0}
              onClick={() => handleGenerateSheets(selectedStudentsOrdered)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#1E293B] via-[#312E81] to-[#4338CA] text-white text-xs sm:text-sm font-extrabold shadow-md hover:opacity-95 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin text-amber-300" />
              ) : (
                <Printer className="h-4 w-4 text-amber-300" />
              )}
              Générer le PDF ({selectedCount} carte{selectedCount > 1 ? 's' : ''} •{' '}
              {pagesCount > 1
                ? `10/page + ${remainderOnLastPage} sur la dernière`
                : `${selectedCount} sur la page A4`}
              )
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
