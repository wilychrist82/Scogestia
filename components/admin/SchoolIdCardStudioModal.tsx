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
  MapPin,
  UserCheck,
  Calendar,
  Eye,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import {
  generateClassStudentIdCardsPDF,
  generateStudentIdCardPDF,
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

const STORAGE_KEY = 'scogestia_idcard_studio_config_v1'

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
  const [localStudents, setLocalStudents] = useState<StudioStudentItem[]>(initialStudents)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(initialStudents.map((s) => s.id))
  )
  const [previewStudentId, setPreviewStudentId] = useState<string>(
    initialStudents[0]?.id || ''
  )
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const [dirtyStudentIds, setDirtyStudentIds] = useState<Set<string>>(new Set())
  const [isSavingAll, setIsSavingAll] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterMode, setFilterMode] = useState<'all' | 'missing_photo' | 'missing_info'>('all')

  // Champs d'en-tête officiels de la carte scolaire togolaise
  const [inspectionName, setInspectionName] = useState(
    schoolInfo?.city ? `IEPP / DRE ${schoolInfo.city.toUpperCase()}` : 'IEPP LACS-OUEST'
  )
  const [schoolNameOverride, setSchoolNameOverride] = useState(
    schoolInfo?.name || 'ÉTABLISSEMENT SCOLAIRE'
  )
  const [examCenter, setExamCenter] = useState(
    schoolInfo?.city || schoolInfo?.name || 'Lomé'
  )
  const [directorName, setDirectorName] = useState(
    schoolInfo?.director_name || 'Le Directeur'
  )
  const [cardAcademicYear, setCardAcademicYear] = useState(
    schoolInfo?.current_academic_year || academicYear || '2025-2026'
  )

  useEffect(() => {
    setLocalStudents(initialStudents)
    setSelectedIds(new Set(initialStudents.map((s) => s.id)))
    if (initialStudents.length > 0) {
      setPreviewStudentId((prev) =>
        initialStudents.some((s) => s.id === prev) ? prev : initialStudents[0].id
      )
    }
  }, [initialStudents])

  // Charger la configuration mémorisée dans le navigateur
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.inspectionName) setInspectionName(parsed.inspectionName)
        if (parsed.examCenter) setExamCenter(parsed.examCenter)
        if (parsed.directorName && !schoolInfo?.director_name) {
          setDirectorName(parsed.directorName)
        }
      }
    } catch {
      // Ignore
    }
  }, [schoolInfo?.director_name])

  const persistHeaderConfig = (next: {
    inspectionName: string
    examCenter: string
    directorName: string
  }) => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      // Ignore
    }
  }

  const previewStudent = useMemo(() => {
    return (
      localStudents.find((s) => s.id === previewStudentId) ||
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
  }, [localStudents, previewStudentId, schoolInfo?.city])

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

  const handleFieldChange = (
    studentId: string,
    field: 'first_name' | 'last_name' | 'date_of_birth' | 'birth_place' | 'gender',
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
    setPreviewStudentId(studentId)
  }

  const handlePhotoUpload = async (studentId: string, file?: File | null) => {
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error("L'image est trop volumineuse (max 5 Mo).")
      return
    }

    try {
      setUploadingId(studentId)
      setPreviewStudentId(studentId)
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
      toast.success('Photo de carte scolaire enregistrée !')
      onStudentsUpdated?.()
    } catch (err) {
      console.error(err)
      toast.error("Erreur lors de l'envoi de la photo.")
    } finally {
      setUploadingId(null)
    }
  }

  const saveModifiedStudentsToDb = async () => {
    if (dirtyStudentIds.size === 0) return true
    try {
      setIsSavingAll(true)
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
      setIsSavingAll(false)
    }
  }

  const buildDocDataForStudent = (s: StudioStudentItem): StudentDocumentData => ({
    studentId: s.id,
    matricule: s.matricule || 'N/A',
    firstName: s.first_name,
    lastName: s.last_name,
    dateOfBirth: s.date_of_birth,
    birthPlace: s.birth_place || schoolInfo?.city || 'Lomé',
    gender: s.gender,
    bloodGroup: s.blood_group || null,
    className,
    classLevel,
    parentPhone: s.parent_phone || null,
    address: s.address || null,
    avatarUrl: s.avatar_url || null,
    schoolName: schoolNameOverride.trim() || schoolInfo?.name || 'Établissement Scolaire',
    schoolCity: schoolInfo?.city || null,
    schoolPhone: schoolInfo?.phone || null,
    schoolEmail: schoolInfo?.email || null,
    academicYear: cardAcademicYear.trim() || '2025-2026',
    directorName: directorName.trim() || schoolInfo?.director_name || 'Le Directeur',
    schoolLogoUrl: schoolInfo?.logo_url || null,
    schoolStampUrl: schoolInfo?.stamp_url || null,
    schoolSignatureUrl: schoolInfo?.signature_url || null,
    inspectionName: inspectionName.trim() || 'IEPP / DRE',
    examCenter: examCenter.trim() || schoolInfo?.city || 'Lomé',
  })

  const handleGeneratePdf = async (mode: 'class_sheet' | 'single_card' | 'single_10up') => {
    const selectedList = localStudents.filter((s) => selectedIds.has(s.id))
    if (selectedList.length === 0) {
      toast.error('Veuillez sélectionner au moins un élève.')
      return
    }

    try {
      setIsGenerating(true)
      persistHeaderConfig({
        inspectionName,
        examCenter,
        directorName,
      })

      if (dirtyStudentIds.size > 0) {
        await saveModifiedStudentsToDb()
      }

      if (mode === 'single_card') {
        await generateStudentIdCardPDF(buildDocDataForStudent(selectedList[0]), {
          tenUpSheet: false,
        })
        toast.success('Carte scolaire générée avec succès !')
      } else if (mode === 'single_10up') {
        await generateStudentIdCardPDF(buildDocDataForStudent(selectedList[0]), {
          tenUpSheet: true,
        })
        toast.success('Planche de 10 cartes générée avec succès !')
      } else {
        const docs = selectedList.map(buildDocDataForStudent)
        await generateClassStudentIdCardsPDF(className, docs)
        const pagesCount = Math.ceil(docs.length / 10)
        toast.success(
          `Planche PDF générée : ${docs.length} carte(s) sur ${pagesCount} page(s) A4 (10 cartes/page) !`
        )
      }
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

  const selectedCount = selectedIds.size
  const pagesCount = Math.max(1, Math.ceil(selectedCount / 10))
  const isSingleStudentMode = localStudents.length === 1

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-6xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Bandeau Supérieur — Stripe Royal Indigo & Sapphire */}
        <div className="relative flex items-center justify-between gap-4 bg-gradient-to-r from-[#1E293B] via-[#312E81] to-[#4338CA] px-5 py-4 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25 backdrop-blur-md">
              <IdCard className="h-6 w-6 text-amber-300" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-white">
                  Studio Officiel — Cartes d&apos;Identité Scolaires
                </h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/20 px-2.5 py-0.5 text-[11px] font-extrabold text-emerald-200 ring-1 ring-emerald-300/30">
                  <Sparkles className="h-3 w-3" />
                  10 Cartes / Page A4 • Sans Verso
                </span>
              </div>
              <p className="text-xs text-indigo-100/90 mt-0.5">
                Classe : <strong className="text-white">{className}</strong> • Ajoutez les photos & informations manquantes puis générez la planche prête à imprimer.
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
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50/70">
          {/* SECTION 1 : Paramètres de la Carte + Aperçu Visuel Temps Réel */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            {/* Formulaire des mentions officielles de la carte */}
            <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-indigo-950 flex items-center gap-1.5">
                    <Building2 className="h-4 w-4 text-indigo-600" />
                    1. Mentions Officielles de l&apos;En-tête (Modèle Togolais)
                  </h3>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    Mémorisé auto.
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Inspection / DRE / IEPP *
                    </label>
                    <input
                      type="text"
                      value={inspectionName}
                      onChange={(e) => setInspectionName(e.target.value)}
                      placeholder="Ex: IEPP LACS-OUEST ou DRE LOMÉ"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-xs font-bold text-slate-900 focus:border-indigo-600 focus:bg-white outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Centre d&apos;Écrit (Examen / Ville) *
                    </label>
                    <div className="relative">
                      <MapPin className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={examCenter}
                        onChange={(e) => setExamCenter(e.target.value)}
                        placeholder="Ex: Agbodankopé / Lomé"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-8 pr-3 py-2 text-xs font-bold text-indigo-950 focus:border-indigo-600 focus:bg-white outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Nom Officiel de l&apos;École sur la carte (en rouge) *
                    </label>
                    <input
                      type="text"
                      value={schoolNameOverride}
                      onChange={(e) => setSchoolNameOverride(e.target.value)}
                      placeholder="Ex: EPP AGBODANKOPE / CPL LE ROI"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-xs font-extrabold uppercase text-red-700 focus:border-indigo-600 focus:bg-white outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Nom du Directeur / Chef d&apos;Établissement *
                    </label>
                    <div className="relative">
                      <UserCheck className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={directorName}
                        onChange={(e) => setDirectorName(e.target.value)}
                        placeholder="Ex: GNAMAVO Kodjo"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-8 pr-3 py-2 text-xs font-bold text-slate-900 focus:border-indigo-600 focus:bg-white outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Année Scolaire *
                    </label>
                    <div className="relative">
                      <Calendar className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={cardAcademicYear}
                        onChange={(e) => setCardAcademicYear(e.target.value)}
                        placeholder="Ex: 2025-2026"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-8 pr-3 py-2 text-xs font-bold text-slate-900 focus:border-indigo-600 focus:bg-white outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-indigo-50/70 border border-indigo-200/70 px-3.5 py-2.5 flex items-center justify-between gap-3 text-xs">
                <div className="text-indigo-950 font-medium">
                  Disposition d&apos;impression :{' '}
                  <strong className="font-extrabold">2 colonnes × 5 lignes = 10 élèves différents / page A4</strong>
                </div>
                <span className="shrink-0 font-extrabold text-indigo-700 bg-white px-2.5 py-1 rounded-lg border border-indigo-200 shadow-2xs">
                  Recto seul
                </span>
              </div>
            </div>

            {/* APERÇU VISUEL TEMPS RÉEL DE LA CARTE OFFICIELLE TOGOLAISE */}
            <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-950 flex items-center gap-1.5">
                  <Eye className="h-4 w-4 text-indigo-600" />
                  Aperçu en direct de la Carte Scolaire
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  Élève affiché : <strong className="text-slate-800">{previewStudent.last_name} {previewStudent.first_name}</strong>
                </span>
              </div>

              {/* Rendu HTML/CSS reproduisant exactement la carte officielle Togolaise */}
              <div className="mx-auto w-full max-w-[460px] rounded-md p-[5px] bg-[#007A33] shadow-lg select-none">
                <div className="rounded-[2px] p-[4px] bg-[#FFCE00]">
                  <div className="bg-[#EEF4FA] text-slate-900 overflow-hidden">
                    {/* En-tête de la carte */}
                    <div className="px-2.5 pt-1.5 pb-1.5 relative">
                      <div className="flex items-start justify-between gap-2">
                        {/* Gauche : MEPST + Emblème RT */}
                        <div className="flex flex-col items-center shrink-0">
                          <div className="font-serif font-black text-[13px] leading-none tracking-tight">
                            <span className="text-slate-950">ME</span>
                            <span className="text-red-600">P</span>
                            <span className="text-amber-500">S</span>
                            <span className="text-blue-700">T</span>
                          </div>
                          <div className="mt-1 h-11 w-10 rounded-full border border-emerald-600 bg-white flex flex-col items-center justify-center shadow-2xs overflow-hidden">
                            {schoolInfo?.logo_url ? (
                              <img
                                src={schoolInfo.logo_url}
                                alt="Logo"
                                className="h-9 w-9 object-contain"
                              />
                            ) : (
                              <div className="flex flex-col items-center justify-center text-center leading-none">
                                <span className="text-[6px] font-bold text-emerald-800">🇹🇬</span>
                                <span className="px-1 py-0.5 rounded-full bg-amber-300 text-[8px] font-serif font-black text-slate-950 border border-amber-500">
                                  RT
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Centre + Droite */}
                        <div className="flex-1 flex flex-col">
                          <div className="text-right font-serif leading-tight">
                            <div className="text-[10.5px] font-black tracking-tight text-slate-950 uppercase">
                              REPUBLIQUE TOGOLAISE
                            </div>
                            <div className="text-[9.5px] font-bold text-slate-900 pr-2">
                              Travail-Liberté-Patrie
                            </div>
                          </div>

                          <div className="text-center mt-0.5 space-y-0.5">
                            <div className="font-serif font-black text-[10.5px] text-[#0F1D5F] uppercase tracking-wide truncate">
                              {inspectionName || 'IEPP LACS-OUEST'}
                            </div>
                            <div className="font-serif font-black text-[15px] leading-none text-[#B41218] uppercase tracking-tight truncate">
                              {schoolNameOverride || schoolInfo?.name || 'EPP AGBODANKOPE'}
                            </div>
                            <div className="font-serif font-extrabold text-[11px] leading-tight">
                              <span className="text-slate-950">Centre d&apos;Ecrit: </span>
                              <span className="text-[#192AB9] underline decoration-red-400 decoration-wavy">
                                {examCenter || schoolInfo?.city || 'Lomé'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Double trait tricolore de séparation */}
                    <div className="h-[2px] w-full bg-red-700" />
                    <div className="h-[2px] w-full bg-[#007A33]" />
                    <div className="h-[1.5px] w-full bg-[#FFCE00]" />

                    {/* Corps de la carte : Photo à gauche + Infos à droite */}
                    <div className="grid grid-cols-12 bg-[#F8FAFC]">
                      {/* Photo Passeport (Gauche) */}
                      <div className="col-span-4 p-1">
                        <div className="w-full h-[142px] border-2 border-[#C2410C] bg-sky-100 overflow-hidden flex flex-col items-center justify-center relative">
                          {previewStudent.avatar_url ? (
                            <img
                              src={previewStudent.avatar_url}
                              alt={previewStudent.first_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center text-center p-2">
                              <div className="h-11 w-11 rounded-full bg-sky-200/90 text-blue-900 font-serif font-black text-base flex items-center justify-center mb-1">
                                {(previewStudent.last_name[0] || 'A').toUpperCase()}
                                {(previewStudent.first_name[0] || 'R').toUpperCase()}
                              </div>
                              <span className="text-[9px] font-bold text-blue-900 uppercase">
                                Photo Élève
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Informations d'état civil (Droite) */}
                      <div className="col-span-8 flex flex-col justify-between pb-1.5 pr-1.5">
                        <div>
                          {/* Bandeau pêche CARTE D'IDENTITE SCOLAIRE */}
                          <div className="bg-[#FDE0C6] py-0.5 px-2 text-center border-b border-amber-200/80">
                            <span className="font-serif font-black italic text-[11.5px] text-[#122AB9] underline decoration-[#122AB9] tracking-tight">
                              CARTE D&apos;IDENTITE SCOLAIRE
                            </span>
                          </div>

                          <div className="px-2 pt-1.5 space-y-0.5 font-serif text-[12px] leading-snug">
                            <div className="truncate">
                              <span className="font-black text-slate-950">Nom: </span>
                              <span className="font-black text-[#99121C] uppercase">
                                {previewStudent.last_name}
                              </span>
                            </div>
                            <div className="truncate">
                              <span className="font-black text-slate-950">Prénoms: </span>
                              <span className="font-black text-[#99121C]">
                                {previewStudent.first_name}
                              </span>
                            </div>
                            <div className="truncate text-[11.5px]">
                              <span className="font-black text-slate-950">
                                Né (e) le{' '}
                                {previewStudent.date_of_birth
                                  ? new Date(previewStudent.date_of_birth).toLocaleDateString('fr-FR')
                                  : '—'}{' '}
                                à {previewStudent.birth_place || schoolInfo?.city || 'Lomé'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="font-black text-[#D94619]">Sexe </span>
                                <span className="font-black text-slate-950">: </span>
                                <span className="font-black text-[#122AB9]">
                                  {previewStudent.gender || '—'}
                                </span>
                              </div>
                              <span className="text-[9px] font-sans font-bold text-slate-400">
                                Mle: {previewStudent.matricule}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Bas de la carte : Année scolaire + Classe + Cachet rond bleu + Directeur */}
                        <div className="px-2 pt-1 flex items-end justify-between relative">
                          <div className="font-serif leading-tight">
                            <div className="italic font-black text-[11px] underline decoration-[#122AB9]">
                              <span className="text-slate-950">Année </span>
                              <span className="text-[#122AB9]">Scolaire</span>
                            </div>
                            <div className="italic font-black text-[13px] text-[#A5181C] pl-1">
                              {cardAcademicYear}
                            </div>
                            <div className="italic text-[12px] mt-0.5">
                              <span className="text-slate-950 font-semibold">Classe : </span>
                              <span className="font-black text-[#192AB9]">{className}</span>
                            </div>
                          </div>

                          {/* Cachet circulaire bleu + Nom du Directeur */}
                          <div className="flex flex-col items-end">
                            <div className="h-12 w-12 rounded-full border-2 border-[#122ABE] flex flex-col items-center justify-center text-[#122ABE] text-center p-0.5 shadow-2xs bg-white/60">
                              <span className="text-[4.5px] font-black uppercase leading-none">
                                REPUBLIQUE TOGOLAISE
                              </span>
                              <span className="text-[7px] font-black my-0.5">★ RT ★</span>
                              <span className="text-[4.2px] font-extrabold uppercase leading-none truncate max-w-[38px]">
                                {(schoolNameOverride || 'ÉCOLE').slice(0, 14)}
                              </span>
                            </div>
                            <div className="font-serif italic font-black text-[11px] text-[#A5181C] leading-none mt-0.5">
                              {directorName || 'Le Directeur'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2 : Table Interactive des Élèves (Upload Photo 1-clic + Lieu/Date de naissance) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/60">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-indigo-950">
                  2. Photos & Informations des Élèves ({selectedCount} sélectionné{selectedCount > 1 ? 's' : ''})
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
                <div className="relative w-full sm:w-56">
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

            <div className="overflow-x-auto max-h-[340px] overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 z-10 bg-slate-100 border-b border-slate-200 text-[11px] font-extrabold text-slate-600 uppercase">
                  <tr>
                    <th className="py-2.5 px-3 w-10 text-center">
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
                    <th className="py-2.5 px-3">Photo Passeport</th>
                    <th className="py-2.5 px-3">Nom (MAJUSCULE)</th>
                    <th className="py-2.5 px-3">Prénoms</th>
                    <th className="py-2.5 px-3">Né(e) le</th>
                    <th className="py-2.5 px-3">Lieu de naissance (à ...)</th>
                    <th className="py-2.5 px-3 text-center">Sexe</th>
                    <th className="py-2.5 px-3 text-right">Aperçu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/70">
                  {filteredStudents.map((st) => {
                    const isSelected = selectedIds.has(st.id)
                    const isPreviewed = previewStudent.id === st.id
                    const isUploadingThis = uploadingId === st.id

                    return (
                      <tr
                        key={st.id}
                        onClick={() => setPreviewStudentId(st.id)}
                        className={`transition-colors cursor-pointer ${
                          isPreviewed
                            ? 'bg-indigo-50/70'
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

                        {/* Upload Photo en 1 clic */}
                        <td className="py-2 px-3" onClick={(e) => e.stopPropagation()}>
                          <label className="inline-flex items-center gap-2.5 cursor-pointer group">
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              disabled={isUploadingThis}
                              onChange={(e) => handlePhotoUpload(st.id, e.target.files?.[0])}
                            />
                            <div className="h-11 w-9 rounded-lg border border-slate-300 bg-slate-100 overflow-hidden flex items-center justify-center relative shadow-2xs group-hover:border-indigo-600">
                              {st.avatar_url ? (
                                <img
                                  src={st.avatar_url}
                                  alt={st.first_name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <Camera className="h-4 w-4 text-slate-400 group-hover:text-indigo-600" />
                              )}
                              {isUploadingThis && (
                                <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center">
                                  <Loader2 className="h-4 w-4 text-white animate-spin" />
                                </div>
                              )}
                            </div>
                            <span
                              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors ${
                                st.avatar_url
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 group-hover:bg-emerald-100'
                                  : 'bg-indigo-50 text-indigo-700 border border-indigo-200 group-hover:bg-indigo-100'
                              }`}
                            >
                              {st.avatar_url ? 'Changer photo' : '+ Ajouter photo'}
                            </span>
                          </label>
                        </td>

                        {/* Nom */}
                        <td className="py-2 px-3" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            value={st.last_name}
                            onChange={(e) =>
                              handleFieldChange(st.id, 'last_name', e.target.value)
                            }
                            className="w-full min-w-[110px] rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-extrabold uppercase text-red-800 focus:border-indigo-600 outline-none"
                          />
                        </td>

                        {/* Prénoms */}
                        <td className="py-2 px-3" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            value={st.first_name}
                            onChange={(e) =>
                              handleFieldChange(st.id, 'first_name', e.target.value)
                            }
                            className="w-full min-w-[120px] rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:border-indigo-600 outline-none"
                          />
                        </td>

                        {/* Date de naissance */}
                        <td className="py-2 px-3" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="date"
                            value={st.date_of_birth ? st.date_of_birth.slice(0, 10) : ''}
                            onChange={(e) =>
                              handleFieldChange(st.id, 'date_of_birth', e.target.value)
                            }
                            className="w-full min-w-[125px] rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold text-slate-800 focus:border-indigo-600 outline-none"
                          />
                        </td>

                        {/* Lieu de naissance */}
                        <td className="py-2 px-3" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            value={st.birth_place || ''}
                            onChange={(e) =>
                              handleFieldChange(st.id, 'birth_place', e.target.value)
                            }
                            placeholder={schoolInfo?.city || 'Ex: Lomé'}
                            className="w-full min-w-[115px] rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:border-indigo-600 outline-none"
                          />
                        </td>

                        {/* Sexe */}
                        <td className="py-2 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={st.gender?.toUpperCase() || ''}
                            onChange={(e) =>
                              handleFieldChange(st.id, 'gender', e.target.value)
                            }
                            className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-extrabold text-indigo-950 focus:border-indigo-600 outline-none"
                          >
                            <option value="">—</option>
                            <option value="F">F</option>
                            <option value="M">M</option>
                          </select>
                        </td>

                        {/* Bouton Aperçu */}
                        <td className="py-2 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => setPreviewStudentId(st.id)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                              isPreviewed
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            {isPreviewed ? 'Affiché' : 'Voir carte'}
                          </button>
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
        <div className="border-t border-slate-200 bg-white px-5 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 text-xs text-slate-600">
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span>
              <strong>{selectedCount} élève{selectedCount > 1 ? 's' : ''}</strong> prêt{selectedCount > 1 ? 's' : ''} •{' '}
              Impression automatique :{' '}
              <strong className="text-indigo-950">
                10 cartes par page A4 ({pagesCount} page{pagesCount > 1 ? 's' : ''})
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap w-full sm:w-auto justify-end">
            {dirtyStudentIds.size > 0 && (
              <button
                type="button"
                disabled={isSavingAll}
                onClick={async () => {
                  const ok = await saveModifiedStudentsToDb()
                  if (ok) toast.success('Modifications enregistrées !')
                }}
                className="px-3.5 py-2.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs font-extrabold hover:bg-emerald-100 transition-colors flex items-center gap-1.5"
              >
                {isSavingAll ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Enregistrer les infos ({dirtyStudentIds.size})
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors"
            >
              Fermer
            </button>

            {isSingleStudentMode ? (
              <>
                <button
                  type="button"
                  disabled={isGenerating || selectedCount === 0}
                  onClick={() => handleGeneratePdf('single_card')}
                  className="px-4 py-2.5 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-900 text-xs font-extrabold hover:bg-indigo-100 transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Printer className="h-4 w-4 text-indigo-700" />
                  Imprimer 1 Carte (Recto)
                </button>
                <button
                  type="button"
                  disabled={isGenerating || selectedCount === 0}
                  onClick={() => handleGeneratePdf('single_10up')}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#1E293B] via-[#312E81] to-[#4338CA] text-white text-xs sm:text-sm font-extrabold shadow-md hover:opacity-95 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin text-amber-300" />
                  ) : (
                    <IdCard className="h-4 w-4 text-amber-300" />
                  )}
                  Générer Planche 10 Cartes / Page A4
                </button>
              </>
            ) : (
              <button
                type="button"
                disabled={isGenerating || selectedCount === 0}
                onClick={() => handleGeneratePdf('class_sheet')}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#1E293B] via-[#312E81] to-[#4338CA] text-white text-xs sm:text-sm font-extrabold shadow-md hover:opacity-95 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin text-amber-300" />
                ) : (
                  <Printer className="h-4 w-4 text-amber-300" />
                )}
                Générer la Planche PDF ({selectedCount} élèves • 10 cartes / page A4)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

