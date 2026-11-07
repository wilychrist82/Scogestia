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
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import {
  generateClassStudentIdCardsPDF,
  StudentDocumentData,
} from '@/lib/pdf/student-documents'

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
  onClose: () => void
  className: string
  classLevel?: string | null
  academicYear?: string | null
  students: StudioStudentItem[]
  schoolInfo?: SchoolMeta | null
  onStudentsUpdated?: () => void
}

const STORAGE_KEY = 'scogestia_idcard_studio_config_v2'

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
  schoolInfo = null,
  onStudentsUpdated,
}: Props) {
  const [localStudents, setLocalStudents] = useState<StudioStudentItem[]>(() =>
    sortStudentsAlphabetically(initialStudents)
  )
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(initialStudents.map((s) => s.id))
  )
  const [activeStudentId, setActiveStudentId] = useState<string>('')
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const [uploadingAssetType, setUploadingAssetType] = useState<
    'logo' | 'stamp' | 'signature' | null
  >(null)
  const [dirtyStudentIds, setDirtyStudentIds] = useState<Set<string>>(new Set())
  const [isSavingCurrent, setIsSavingCurrent] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterMode, setFilterMode] = useState<'all' | 'missing_photo' | 'missing_info'>('all')

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

  // Assets officiels (chargés automatiquement depuis Paramètres `schools`, ou importables ici)
  const [schoolId, setSchoolId] = useState<string | null>(schoolInfo?.id || null)
  const [logoUrl, setLogoUrl] = useState<string>(schoolInfo?.logo_url || '')
  const [stampUrl, setStampUrl] = useState<string>(schoolInfo?.stamp_url || '')
  const [signatureUrl, setSignatureUrl] = useState<string>(
    schoolInfo?.signature_url || ''
  )
  const [showVectorEmblemIfNoLogo, setShowVectorEmblemIfNoLogo] = useState<boolean>(true)
  const [showVectorStampIfNoStamp, setShowVectorStampIfNoStamp] = useState<boolean>(false)

  // Gestion des Thèmes d'arrière-plan de la carte (navigation Précédent / Suivant)
  const [customThemes, setCustomThemes] = useState<CardThemeOption[]>([])
  const allThemes = useMemo(
    () => [...DEFAULT_CARD_THEMES, ...customThemes],
    [customThemes]
  )
  const [activeThemeIndex, setActiveThemeIndex] = useState<number>(0)
  const activeTheme = allThemes[activeThemeIndex] || DEFAULT_CARD_THEMES[0]

  const handlePrevTheme = () => {
    setActiveThemeIndex((prev) => (prev - 1 + allThemes.length) % allThemes.length)
  }

  const handleNextTheme = () => {
    setActiveThemeIndex((prev) => (prev + 1) % allThemes.length)
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

  // Initialisation et tri alphabétique des élèves
  useEffect(() => {
    const sorted = sortStudentsAlphabetically(initialStudents)
    setLocalStudents(sorted)
    setSelectedIds(new Set(sorted.map((s) => s.id)))
    if (sorted.length > 0) {
      setActiveStudentId((prev) =>
        sorted.some((s) => s.id === prev) ? prev : sorted[0].id
      )
    }
  }, [initialStudents])

  useEffect(() => {
    setClassNameOverride(className)
  }, [className])

  // Synchronisation automatique avec les paramètres de l'école (Logo, Cachet, Signature, Directeur)
  useEffect(() => {
    if (!isOpen) return

    if (schoolInfo?.logo_url) setLogoUrl(schoolInfo.logo_url)
    if (schoolInfo?.stamp_url) setStampUrl(schoolInfo.stamp_url)
    if (schoolInfo?.signature_url) setSignatureUrl(schoolInfo.signature_url)
    if (schoolInfo?.director_name) setDirectorName(schoolInfo.director_name)
    if (schoolInfo?.name) setSchoolNameOverride(schoolInfo.name)

    // Requête directe vers `schools` pour être sûr à 100% d'avoir le cachet et la signature définis dans Paramètres
    const fetchLatestSchoolSettings = async () => {
      try {
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return

        const { data: profile } = await supabase
          .from('profiles')
          .select('school_id')
          .eq('id', user.id)
          .maybeSingle()

        const targetSchoolId = profile?.school_id || schoolInfo?.id
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
          if (schoolRow.logo_url) setLogoUrl(schoolRow.logo_url)
          if (schoolRow.stamp_url) setStampUrl(schoolRow.stamp_url)
          if (schoolRow.signature_url) setSignatureUrl(schoolRow.signature_url)
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
  }, [isOpen, schoolInfo])

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
        if (typeof parsed.activeThemeIndex === 'number') {
          setActiveThemeIndex(parsed.activeThemeIndex)
        }
        if (Array.isArray(parsed.customThemes)) {
          setCustomThemes(parsed.customThemes)
        }
      }
    } catch {
      // Ignore
    }
  }, [])

  const persistHeaderConfig = () => {
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
        })
      )
    } catch {
      // Ignore
    }
  }

  // Upload direct du Logo, du Cachet ou de la Signature depuis un document + sauvegarde dans `schools` (Paramètres)
  const handleSchoolAssetUpload = async (
    type: 'logo' | 'stamp' | 'signature',
    file?: File | null
  ) => {
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error("L'image est trop volumineuse (max 5 Mo).")
      return
    }

    try {
      setUploadingAssetType(type)
      const supabase = createClient()
      const ext = file.name.split('.').pop() || 'png'
      const folder = schoolId ? `school_${schoolId}/${type}` : `school_assets/${type}`
      const fileName = `${folder}/${type}_${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      const url = publicUrlData.publicUrl

      if (type === 'logo') setLogoUrl(url)
      if (type === 'stamp') setStampUrl(url)
      if (type === 'signature') setSignatureUrl(url)

      // Sauvegarder automatiquement dans la table `schools` pour que ce soit lié à Paramètres
      if (schoolId) {
        const updatePayload =
          type === 'logo'
            ? { logo_url: url }
            : type === 'stamp'
              ? { stamp_url: url }
              : { signature_url: url }

        await supabase.from('schools').update(updatePayload).eq('id', schoolId)
      }

      const labelFr =
        type === 'logo'
          ? "Logo de l'école"
          : type === 'stamp'
            ? 'Cachet officiel'
            : 'Signature du Directeur'
      toast.success(`${labelFr} importé et synchronisé avec Paramètres !`)
      onStudentsUpdated?.()
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

  // Enregistrer la carte actuelle et passer automatiquement à l'élève suivant (ordre alphabétique)
  const handleSaveAndNextStudent = async () => {
    if (!activeStudent) return
    persistHeaderConfig()
    const ok = await saveStudentToDb(activeStudent.id)
    if (!ok) return

    if (activeIndex < localStudents.length - 1) {
      const nextStudent = localStudents[activeIndex + 1]
      setActiveStudentId(nextStudent.id)
      toast.success(
        `Carte enregistrée ! Passage à ${nextStudent.last_name.toUpperCase()} ${nextStudent.first_name} (${activeIndex + 2}/${localStudents.length})`
      )
    } else {
      toast.success('Dernière carte de la classe enregistrée avec succès !')
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-6xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[95vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Bandeau Supérieur — Stripe Royal Indigo & Sapphire */}
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
                Classe : <strong className="text-white">{className}</strong> • Tout est modifiable sur la carte (Logo, Sigle Ministère, Cachet & Signature synchronisés avec Paramètres).
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-white/10 p-2 text-white/80 hover:bg-white/20 hover:text-white transition-colors"
            title="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Contenu Principal Défilant */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 bg-slate-50/70">
          {/* SECTION 1 : Personnalisation Intégrale de la Carte + Aperçu en Direct + Édition Élève par Élève */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* COLONNE GAUCHE (5 cols) : Paramètres Globaux de la Carte + Cachet / Signature / Logo */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-4">
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
                          onChange={(e) =>
                            handleSchoolAssetUpload('logo', e.target.files?.[0])
                          }
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
                          onChange={(e) =>
                            handleSchoolAssetUpload('stamp', e.target.files?.[0])
                          }
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
                          onChange={(e) =>
                            handleSchoolAssetUpload('signature', e.target.files?.[0])
                          }
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
                          onClick={() => setSignatureUrl('')}
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
            </div>

            {/* COLONNE DROITE (7 cols) : Aperçu Temps Réel + Saisie Élève par Élève (Enregistrer -> Suivant) */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-4">
              {/* Barre de navigation Alphabétique Élève par Élève */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-indigo-600" />
                  <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-950">
                    2. Aperçu & Saisie Carte par Carte ({activeIndex + 1} / {localStudents.length})
                  </span>
                </div>

                {localStudents.length > 1 && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={activeIndex === 0}
                      onClick={() =>
                        setActiveStudentId(localStudents[Math.max(0, activeIndex - 1)].id)
                      }
                      className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 disabled:opacity-40 flex items-center gap-1"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                      Précédent
                    </button>

                    <select
                      value={activeStudent.id}
                      onChange={(e) => setActiveStudentId(e.target.value)}
                      className="rounded-lg border border-indigo-200 bg-indigo-50/60 px-2.5 py-1 text-xs font-extrabold text-indigo-950 outline-none max-w-[210px]"
                    >
                      {localStudents.map((s, idx) => (
                        <option key={s.id} value={s.id}>
                          {idx + 1}. {s.last_name.toUpperCase()} {s.first_name}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      disabled={activeIndex >= localStudents.length - 1}
                      onClick={() =>
                        setActiveStudentId(
                          localStudents[Math.min(localStudents.length - 1, activeIndex + 1)].id
                        )
                      }
                      className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 disabled:opacity-40 flex items-center gap-1"
                    >
                      Suivant
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* SÉLECTEUR DE THÈME (ARRIÈRE-PLAN DE LA CARTE) AVEC FLÈCHES PRÉCÉDENT / SUIVANT */}
              <div className="rounded-xl border border-indigo-200/80 bg-gradient-to-r from-indigo-50/70 via-white to-indigo-50/70 p-3 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <Palette className="h-4 w-4 text-indigo-600" />
                    <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-950">
                      Thème / Fond de la Carte ({activeThemeIndex + 1} / {allThemes.length})
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handlePrevTheme}
                      className="px-2.5 py-1 rounded-lg border border-indigo-200 bg-white hover:bg-indigo-50 text-xs font-extrabold text-indigo-900 shadow-2xs transition-all flex items-center gap-1"
                      title="Revenir au thème précédent"
                    >
                      <ChevronLeft className="h-3.5 w-3.5 text-indigo-600" />
                      Précédent
                    </button>

                    <span className="px-2.5 py-1 rounded-lg bg-indigo-950 text-white text-[11px] font-extrabold max-w-[200px] truncate">
                      {activeTheme.name}
                    </span>

                    <button
                      type="button"
                      onClick={handleNextTheme}
                      className="px-2.5 py-1 rounded-lg border border-indigo-200 bg-white hover:bg-indigo-50 text-xs font-extrabold text-indigo-900 shadow-2xs transition-all flex items-center gap-1"
                      title="Passer au thème suivant"
                    >
                      Suivant
                      <ChevronRight className="h-3.5 w-3.5 text-indigo-600" />
                    </button>

                    <label
                      className="cursor-pointer px-2.5 py-1 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-[11px] font-extrabold text-emerald-800 transition-colors flex items-center gap-1"
                      title="Ajouter une nouvelle image de thème"
                    >
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleUploadCustomTheme(e.target.files?.[0])}
                      />
                      <Upload className="h-3 w-3" />
                      + Thème
                    </label>
                  </div>
                </div>

                {/* Miniatures rapides des thèmes */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {allThemes.map((th, idx) => {
                    const isCurrent = idx === activeThemeIndex
                    return (
                      <button
                        key={th.id}
                        type="button"
                        onClick={() => setActiveThemeIndex(idx)}
                        className={`group relative h-10 w-16 shrink-0 rounded-lg border overflow-hidden transition-all ${
                          isCurrent
                            ? 'border-indigo-600 ring-2 ring-indigo-500/40 scale-105 shadow-xs'
                            : 'border-slate-200 opacity-75 hover:opacity-100'
                        }`}
                        title={th.name}
                      >
                        {th.url ? (
                          <img
                            src={th.url}
                            alt={th.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full bg-gradient-to-b from-[#EEF4FA] to-[#F8FAFC] flex items-center justify-center text-[9px] font-extrabold text-slate-700">
                            Classique
                          </div>
                        )}
                        <span className="absolute bottom-0 right-0 bg-slate-900/75 text-white text-[8px] font-bold px-1 rounded-tl">
                          {idx + 1}
                        </span>
                      </button>
                    )
                  })}
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
                        {/* Gauche : Sigle Ministère (MEPST ou personnalisé ou blanc) + Logo École (ou Emblème RT ou blanc) */}
                        <div className="flex flex-col items-center shrink-0 min-w-[44px]">
                          <div className="font-serif font-black text-[13px] leading-none tracking-tight h-[14px]">
                            {ministryAcronym.trim().toUpperCase() === 'MEPST' ? (
                              <>
                                <span className="text-slate-950">ME</span>
                                <span className="text-red-600">P</span>
                                <span className="text-amber-500">S</span>
                                <span className="text-blue-700">T</span>
                              </>
                            ) : ministryAcronym.trim().length > 0 ? (
                              <span className="text-slate-950">
                                {ministryAcronym.trim().slice(0, 10)}
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
                          <div className="text-right font-serif leading-tight min-h-[22px]">
                            {republicTitle.trim() && (
                              <div className="text-[10.5px] font-black tracking-tight text-slate-950 uppercase">
                                {republicTitle}
                              </div>
                            )}
                            {republicMotto.trim() && (
                              <div className="text-[9.5px] font-bold text-slate-900 pr-2">
                                {republicMotto}
                              </div>
                            )}
                          </div>

                          <div className="text-center mt-0.5 space-y-0.5">
                            {inspectionName.trim() && (
                              <div className="font-serif font-black text-[10.5px] text-[#0F1D5F] uppercase tracking-wide truncate">
                                {inspectionName}
                              </div>
                            )}
                            {schoolNameOverride.trim() && (
                              <div className="font-serif font-black text-[15px] leading-none text-[#B41218] uppercase tracking-tight truncate">
                                {schoolNameOverride}
                              </div>
                            )}
                            {examCenter.trim() && (
                              <div className="font-serif font-extrabold text-[11px] leading-tight">
                                <span className="text-slate-950">Centre d&apos;Ecrit: </span>
                                <span className="text-[#192AB9]">{examCenter}</span>
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
                          {/* Bandeau pêche CARTE D'IDENTITE SCOLAIRE */}
                          <div className="bg-[#FDE0C6] py-0.5 px-2 text-center border-b border-amber-200/80 min-h-[20px]">
                            {cardBannerTitle.trim() && (
                              <span className="font-serif font-black italic text-[11.5px] text-[#122AB9] underline decoration-[#122AB9] tracking-tight">
                                {cardBannerTitle}
                              </span>
                            )}
                          </div>

                          <div className="px-2 pt-1.5 space-y-0.5 font-serif text-[12px] leading-snug">
                            <div className="truncate">
                              <span className="font-black text-slate-950">Nom: </span>
                              <span className="font-black text-[#99121C] uppercase">
                                {activeStudent.last_name}
                              </span>
                            </div>
                            <div className="truncate">
                              <span className="font-black text-slate-950">Prénoms: </span>
                              <span className="font-black text-[#99121C]">
                                {activeStudent.first_name}
                              </span>
                            </div>
                            <div className="truncate text-[11.5px]">
                              <span className="font-black text-slate-950">
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
                                <span className="font-black text-[#D94619]">Sexe </span>
                                <span className="font-black text-slate-950">: </span>
                                <span className="font-black text-[#122AB9]">
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
                          <div className="font-serif leading-tight">
                            <div className="italic font-black text-[11px] underline decoration-[#122AB9]">
                              <span className="text-slate-950">Année </span>
                              <span className="text-[#122AB9]">Scolaire</span>
                            </div>
                            <div className="italic font-black text-[13px] text-[#A5181C] pl-1 min-h-[16px]">
                              {cardAcademicYear}
                            </div>
                            <div className="italic text-[12px] mt-0.5">
                              <span className="text-slate-950 font-semibold">Classe : </span>
                              <span className="font-black text-[#192AB9]">
                                {classNameOverride || className}
                              </span>
                            </div>
                          </div>

                          {/* Zone Cachet + Signature + Nom du Directeur (si rien n'est saisi, reste blanc !) */}
                          <div className="flex flex-col items-end min-w-[90px] min-h-[54px] justify-end">
                            <div className="relative flex items-center justify-center h-12 w-24">
                              {stampUrl ? (
                                <img
                                  src={stampUrl}
                                  alt="Cachet officiel"
                                  className="h-12 w-12 object-contain"
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
                                  className="h-9 w-16 object-contain absolute right-0 bottom-0"
                                />
                              )}
                            </div>

                            {directorName.trim() && (
                              <div className="font-serif italic font-black text-[11px] text-[#A5181C] leading-none mt-0.5">
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

                {/* Boutons d'action : Enregistrer cette carte / Enregistrer & Passer à l'Élève Suivant (Ordre Alphabétique) */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-indigo-200/60">
                  <span className="text-[11px] font-medium text-slate-600">
                    Ordre alphabétique :{' '}
                    <strong>
                      {activeIndex + 1} sur {localStudents.length}
                    </strong>
                  </span>

                  <div className="flex items-center gap-2">
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

                    {localStudents.length > 1 && (
                      <button
                        type="button"
                        disabled={isSavingCurrent}
                        onClick={handleSaveAndNextStudent}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold shadow-xs transition-all flex items-center gap-1.5"
                      >
                        {isSavingCurrent ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <>
                            <Save className="h-3.5 w-3.5" />
                            <span>Enregistrer & Élève Suivant</span>
                            <ChevronRight className="h-4 w-4" />
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2 : Génération par Lots de 10 Cartes (Ex: 47 élèves -> 10, 10, 10, 10 et 7 sur la dernière page) */}
          {batchesOfTen.length > 1 && (
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-indigo-950 flex items-center gap-1.5">
                  <Layers className="h-4 w-4 text-indigo-600" />
                  Impression par Lots de 10 Élèves (Sans remplissage forcé sur la dernière page)
                </h3>
                <span className="text-xs font-semibold text-slate-600">
                  Total : <strong>{selectedCount} élèves</strong> répartis en{' '}
                  <strong>{batchesOfTen.length} listes</strong> (dernière liste :{' '}
                  <strong>{remainderOnLastPage} carte{remainderOnLastPage > 1 ? 's' : ''}</strong>)
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {batchesOfTen.map((batch) => (
                  <button
                    key={batch.pageNumber}
                    type="button"
                    disabled={isGenerating}
                    onClick={() =>
                      handleGenerateSheets(
                        batch.students,
                        `Lot_${batch.pageNumber}_Eleves_${batch.startIndex}_a_${batch.endIndex}`
                      )
                    }
                    className="px-3 py-2 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-950 text-xs font-extrabold transition-all flex items-center gap-1.5"
                  >
                    <Printer className="h-3.5 w-3.5 text-indigo-600" />
                    <span>
                      Lot {batch.pageNumber} : Élèves {batch.startIndex} à {batch.endIndex} (
                      {batch.students.length} carte{batch.students.length > 1 ? 's' : ''})
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 3 : Liste Complète des Élèves par Ordre Alphabétique */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="p-3.5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/60">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-indigo-950">
                  3. Liste Alphabétique de la Classe ({selectedCount} sélectionné{selectedCount > 1 ? 's' : ''})
                </h3>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
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
            </div>

            <div className="overflow-x-auto max-h-[260px] overflow-y-auto">
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
                        onClick={() => setActiveStudentId(st.id)}
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
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors"
            >
              Fermer
            </button>

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
