'use client'

import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { importStudents, previewImportStudents } from '@/app/actions/students'
import toast from 'react-hot-toast'
import Papa from 'papaparse'
import {
  extractClassFromFilename,
  normalizeText,
  type StudentImportAnalysis,
} from '@/lib/student-import-utils'
import {
  FileSpreadsheet,
  X,
  Info,
  Download,
  Sparkles,
  CheckCircle2,
  Loader2,
  CloudUpload,
  Upload,
  AlertTriangle,
  Users,
  Layers,
  ArrowRight,
  Ban,
} from 'lucide-react'

type ClassOption = { id: string; name: string; level?: string }

type Props = {
  isOpen: boolean
  onClose: () => void
  classes?: ClassOption[]
  initialClassId?: string
}

async function parseSpreadsheetFile(selectedFile: File): Promise<Record<string, unknown>[]> {
  const fileExt = selectedFile.name.split('.').pop()?.toLowerCase()

  if (fileExt === 'csv') {
    const text = await selectedFile.text()
    const result = Papa.parse(text, { header: true, skipEmptyLines: true })
    return (result.data as Record<string, unknown>[]) || []
  }

  if (fileExt === 'xlsx' || fileExt === 'xls' || fileExt === 'ods') {
    const XLSX = await import('xlsx')
    const data = await selectedFile.arrayBuffer()
    const workbook = XLSX.read(data, { type: 'array' })
    const firstSheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[firstSheetName]
    return (XLSX.utils.sheet_to_json(worksheet) as Record<string, unknown>[]) || []
  }

  throw new Error('Format de fichier non supporté. Utilisez .xlsx, .xls ou .csv')
}

export function ImportStudentsModal({ isOpen, onClose, classes = [], initialClassId }: Props) {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [parsedRows, setParsedRows] = useState<Record<string, unknown>[]>([])
  const [analysis, setAnalysis] = useState<StudentImportAnalysis | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [selectedClassId, setSelectedClassId] = useState<string>(initialClassId || 'auto')
  const [classOverrides, setClassOverrides] = useState<Record<string, string>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (initialClassId) {
      setSelectedClassId(initialClassId)
    }
  }, [initialClassId])

  const resetModalState = useCallback(() => {
    setFile(null)
    setParsedRows([])
    setAnalysis(null)
    setPreviewError(null)
    setClassOverrides({})
    setIsAnalyzing(false)
    setIsUploading(false)
  }, [])

  const handleClose = useCallback(() => {
    if (isUploading) return
    resetModalState()
    onClose()
  }, [isUploading, onClose, resetModalState])

  useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen, handleClose])

  const detectedClass = useMemo(() => {
    if (!file || classes.length === 0) return null
    return extractClassFromFilename(file.name, classes)
  }, [file, classes])

  const runPreviewAnalysis = useCallback(
    async (
      rows: Record<string, unknown>[],
      fileName: string,
      fallbackId: string,
      overrides: Record<string, string>,
    ) => {
      if (rows.length === 0) return
      setIsAnalyzing(true)
      setPreviewError(null)
      try {
        const targetClassId = fallbackId !== 'auto' ? fallbackId : undefined
        const res = await previewImportStudents(rows, targetClassId, fileName, overrides)
        if (res.error || !res.analysis) {
          setAnalysis(null)
          setPreviewError(res.error || "Impossible d'analyser ce fichier.")
        } else {
          setAnalysis(res.analysis)
        }
      } catch (err: unknown) {
        setAnalysis(null)
        setPreviewError(err instanceof Error ? err.message : "Erreur d'analyse du fichier.")
      } finally {
        setIsAnalyzing(false)
      }
    },
    [],
  )

  const handleSelectedFile = async (selectedFile: File) => {
    setFile(selectedFile)
    setAnalysis(null)
    setPreviewError(null)
    setClassOverrides({})
    setIsAnalyzing(true)

    try {
      const rows = await parseSpreadsheetFile(selectedFile)
      if (rows.length === 0) {
        setParsedRows([])
        setPreviewError("Le fichier est vide ou aucune ligne valide n'a été trouvée.")
        setIsAnalyzing(false)
        return
      }
      setParsedRows(rows)
      await runPreviewAnalysis(rows, selectedFile.name, selectedClassId, {})
    } catch (err: unknown) {
      setParsedRows([])
      setPreviewError(err instanceof Error ? err.message : 'Erreur de lecture du fichier.')
      setIsAnalyzing(false)
    }
  }

  const handleFallbackClassChange = async (newClassId: string) => {
    setSelectedClassId(newClassId)
    if (file && parsedRows.length > 0) {
      await runPreviewAnalysis(parsedRows, file.name, newClassId, classOverrides)
    }
  }

  const handleClassOverrideChange = async (rawClassName: string, targetValue: string) => {
    const key = normalizeText(rawClassName)
    const nextOverrides = { ...classOverrides }
    if (targetValue === '__auto__') {
      delete nextOverrides[key]
    } else {
      nextOverrides[key] = targetValue
    }
    setClassOverrides(nextOverrides)
    if (file && parsedRows.length > 0) {
      await runPreviewAnalysis(parsedRows, file.name, selectedClassId, nextOverrides)
    }
  }

  if (!isOpen) return null

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      void handleSelectedFile(e.target.files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      void handleSelectedFile(e.dataTransfer.files[0])
    }
  }

  const handleConfirmImport = async () => {
    if (!file || parsedRows.length === 0) {
      toast.error('Veuillez sélectionner un fichier Excel ou CSV valide.')
      return
    }

    if (analysis && analysis.newRows.length === 0) {
      toast.error('Aucun nouvel élève à enregistrer (toutes les lignes sont déjà présentes).')
      return
    }

    setIsUploading(true)

    try {
      const targetClassId = selectedClassId !== 'auto' ? selectedClassId : undefined
      const response = await importStudents(parsedRows, targetClassId, file.name, classOverrides)

      if (response?.error) {
        toast.error(response.error, { duration: 6000 })
      } else if (response?.success) {
        const dupInfo =
          response.skippedDuplicatesCount && response.skippedDuplicatesCount > 0
            ? ` (${response.skippedDuplicatesCount} doublon(s) ignoré(s))`
            : ''
        if (response.createdClassesCount && response.createdClassesCount > 0) {
          toast.success(
            `${response.count} élève(s) enregistré(s)${dupInfo} · ${response.createdClassesCount} classe(s) créée(s) : ${response.createdClassesNames?.join(', ')}.`,
            { duration: 6000 },
          )
        } else {
          toast.success(
            `${response.count} élève(s) réparti(s) et enregistré(s) dans leurs classes${dupInfo} !`,
            { duration: 5000 },
          )
        }
        resetModalState()
        onClose()
        router.refresh()
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Erreur inattendue'
      toast.error("Erreur lors de l'importation : " + msg)
    } finally {
      setIsUploading(false)
    }
  }

  const generateTemplate = async () => {
    try {
      const { downloadAoaExcel } = await import('@/lib/excel-export-utils')
      const headers = ['Prénom', 'Nom', 'Sexe', 'Classe', 'Date de Naissance', 'Matricule', 'Téléphone Parent']
      const rows = [
        headers,
        ['Kokou', 'Mensah', 'M', 'CP1', '14/05/2019', '1001', '90123456'],
        ['Afi', 'Koffi', 'F', 'CM2', '22/09/2015', '1002', '91234567'],
        ['Amina', 'Diallo', 'F', '6ème', '10/11/2013', '1003', '92345678'],
        ['Jean', 'Dupont', 'M', '3ème', '03/01/2010', '1004', '93456789'],
      ]

      await downloadAoaExcel({
        sheetName: 'Eleves',
        fileName: 'modele_import_eleves_scogestia.xlsx',
        rows,
        colWidths: [16, 16, 8, 16, 18, 14, 18],
        headerRowIndex: 1,
      })
    } catch {
      toast.error('Impossible de générer le modèle Excel.')
    }
  }

  const newStudentsCount = analysis?.newRows.length ?? 0
  const duplicatesCount = analysis?.duplicateRows.length ?? 0
  const classBuckets = analysis?.classes ?? []

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Importer des élèves depuis Excel ou CSV"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/55 backdrop-blur-2xs"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92dvh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* En-tête */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div className="min-w-0">
            <h3 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="truncate">Importer des élèves (Excel / CSV)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Affectation automatique dans chaque classe correspondante sans doublons.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Fermer"
            disabled={isUploading}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corps scrollable */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
          {!file && (
            <div className="bg-blue-50 text-blue-900 p-4 rounded-xl text-xs sm:text-sm leading-relaxed border border-blue-100">
              <p className="font-semibold mb-2 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-blue-700 shrink-0" />
                Comment fonctionne l&apos;import multi-classes ?
              </p>
              <ul className="list-disc pl-5 space-y-1 opacity-90">
                <li>
                  Un seul fichier Excel (<strong>.xlsx, .xls</strong>) ou <strong>CSV</strong> peut contenir{' '}
                  <strong>plusieurs classes</strong> (ex : CP1, CP2, CE1… CM2, 6ème, 3ème).
                </li>
                <li>
                  Chaque ligne est rattachée automatiquement à la classe du logiciel correspondante (ou créée si absente) après votre confirmation.
                </li>
                <li>
                  Les élèves déjà inscrits ou présents en double dans le fichier sont <strong>détectés et ignorés</strong> automatiquement.
                </li>
              </ul>
              <button
                type="button"
                onClick={generateTemplate}
                className="mt-3 text-blue-700 font-semibold hover:text-blue-900 underline underline-offset-2 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Télécharger le modèle Excel multi-classes
              </button>
            </div>
          )}

          {/* Sélecteur de classe de secours */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between gap-2 flex-wrap">
              <span>Classe de secours (uniquement si la colonne « Classe » est absente)</span>
              <span className="text-[11px] font-normal text-slate-400">Priorité à la colonne « Classe » d&apos;Excel</span>
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => void handleFallbackClassChange(e.target.value)}
              disabled={isUploading || isAnalyzing}
              className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none cursor-pointer"
            >
              <option value="auto">
                {detectedClass
                  ? `⚡ Détection auto (Nom du fichier : ${detectedClass})`
                  : '⚡ Détection auto (colonne « Classe » du fichier)'}
              </option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  Classe {c.name}
                </option>
              ))}
            </select>
            {detectedClass && selectedClassId === 'auto' && (
              <p className="text-xs text-emerald-700 font-medium flex items-center gap-1 mt-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                Classe suggérée par le nom du fichier si colonne absente : <strong>{detectedClass}</strong>
              </p>
            )}
          </div>

          <input
            type="file"
            accept=".xlsx,.xls,.csv,.ods,.XLSX,.XLS,.CSV,.ODS,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
            onClick={(e) => {
              ;(e.target as HTMLInputElement).value = ''
            }}
          />

          {!file ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-7 text-center cursor-pointer transition-all group ${
                isDragging
                  ? 'border-emerald-600 bg-emerald-100/50 scale-[1.01]'
                  : 'border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40'
              }`}
            >
              <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-3 bg-emerald-100 text-emerald-600 group-hover:scale-110 transition-transform">
                <Upload className="w-6 h-6 text-emerald-600" />
              </div>
              <p className="font-semibold text-sm text-slate-700">
                Cliquez pour choisir votre fichier Excel / CSV (ou glissez-déposez-le ici)
              </p>
              <p className="text-xs text-slate-500 mt-1">
                L&apos;aperçu des classes et des élèves s&apos;affichera pour confirmation avant enregistrement.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Fichier sélectionné */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{file.name}</p>
                    <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} Ko</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading || isAnalyzing}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 underline cursor-pointer"
                >
                  Changer de fichier
                </button>
              </div>

              {isAnalyzing && (
                <div className="rounded-xl border border-slate-200 bg-white p-8 flex flex-col items-center justify-center gap-3 text-slate-600">
                  <Loader2 className="w-7 h-7 animate-spin text-emerald-600" />
                  <p className="text-sm font-semibold">
                    Analyse des classes et vérification anti-doublons en cours...
                  </p>
                </div>
              )}

              {previewError && !isAnalyzing && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Vérifiez votre fichier</p>
                    <p className="text-xs mt-1">{previewError}</p>
                  </div>
                </div>
              )}

              {analysis && !isAnalyzing && (
                <>
                  {/* KPIs d'aperçu */}
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                        <Users className="w-3.5 h-3.5" />
                        <span>À enregistrer</span>
                      </div>
                      <p className="text-xl font-extrabold text-emerald-950 mt-0.5">{newStudentsCount}</p>
                    </div>
                    <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 p-3">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-indigo-700">
                        <Layers className="w-3.5 h-3.5" />
                        <span>Classes</span>
                      </div>
                      <p className="text-xl font-extrabold text-indigo-950 mt-0.5">{classBuckets.length}</p>
                    </div>
                    <div
                      className={`rounded-xl border p-3 ${
                        duplicatesCount > 0
                          ? 'border-amber-200 bg-amber-50/80'
                          : 'border-slate-200 bg-slate-50/70'
                      }`}
                    >
                      <div
                        className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider ${
                          duplicatesCount > 0 ? 'text-amber-800' : 'text-slate-600'
                        }`}
                      >
                        <Ban className="w-3.5 h-3.5" />
                        <span>Doublons ignorés</span>
                      </div>
                      <p
                        className={`text-xl font-extrabold mt-0.5 ${
                          duplicatesCount > 0 ? 'text-amber-950' : 'text-slate-800'
                        }`}
                      >
                        {duplicatesCount}
                      </p>
                    </div>
                  </div>

                  {/* Correspondance par classe (Excel -> Scogestia) */}
                  <div className="rounded-xl border border-slate-200 overflow-hidden">
                    <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Répartition automatique par classe ({classBuckets.length})
                      </h4>
                      <span className="text-[11px] text-slate-500">Modifiable avant sauvegarde</span>
                    </div>
                    <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto custom-scrollbar bg-white">
                      {classBuckets.map((bucket) => {
                        const rawKey = normalizeText(bucket.primaryRawClass)
                        const overrideVal = classOverrides[rawKey] ?? '__auto__'
                        return (
                          <div
                            key={`${bucket.resolvedClassKey}_${bucket.primaryRawClass}`}
                            className="px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                          >
                            <div className="flex items-center gap-2 flex-wrap min-w-0">
                              <span className="font-bold text-slate-900">
                                {bucket.rawClassNames.join(' / ')}
                              </span>
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                                {bucket.newStudentsCount} nouveau(x)
                              </span>
                              {bucket.duplicateCount > 0 && (
                                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
                                  {bucket.duplicateCount} doublon(s)
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <ArrowRight className="w-3.5 h-3.5 text-slate-400 hidden sm:inline" />
                              <select
                                value={overrideVal}
                                onChange={(e) => void handleClassOverrideChange(bucket.primaryRawClass, e.target.value)}
                                disabled={isUploading}
                                aria-label={`Classe de destination pour ${bucket.primaryRawClass}`}
                                className={`h-8 px-2.5 rounded-lg border text-xs font-semibold outline-none ${
                                  bucket.isNewClass
                                    ? 'border-blue-300 bg-blue-50 text-blue-900'
                                    : 'border-emerald-300 bg-emerald-50 text-emerald-900'
                                }`}
                              >
                                <option value="__auto__">
                                  {bucket.isNewClass
                                    ? `✨ Créer classe "${bucket.resolvedClassName}" (${bucket.level})`
                                    : `✓ ${bucket.resolvedClassName} (existante)`}
                                </option>
                                {classes.map((c) => (
                                  <option key={c.id} value={c.id}>
                                    Affecter à : {c.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Tableau aperçu des élèves */}
                  <div className="rounded-xl border border-slate-200 overflow-hidden">
                    <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Aperçu des élèves détectés ({analysis.rows.length})
                      </h4>
                      <span className="text-[11px] text-slate-500">
                        Vérifiez puis confirmez pour sauvegarder
                      </span>
                    </div>
                    <div className="max-h-52 overflow-auto custom-scrollbar bg-white">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                          <tr>
                            <th className="py-2 px-3">#</th>
                            <th className="py-2 px-3">Nom &amp; Prénom</th>
                            <th className="py-2 px-3">Classe cible</th>
                            <th className="py-2 px-3">Sexe</th>
                            <th className="py-2 px-3">Statut</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {analysis.rows.map((row) => {
                            const isDup = row.duplicateReason !== null
                            return (
                              <tr key={`${row.rowNumber}_${row.lastName}_${row.firstName}`} className={isDup ? 'bg-amber-50/50 text-slate-500' : 'hover:bg-slate-50'}>
                                <td className="py-2 px-3 font-mono text-[11px] text-slate-400">{row.rowNumber - 1}</td>
                                <td className="py-2 px-3 font-semibold text-slate-900 whitespace-nowrap">
                                  {row.lastName} {row.firstName}
                                </td>
                                <td className="py-2 px-3 whitespace-nowrap">
                                  <span
                                    className={`px-2 py-0.5 rounded-md font-bold ${
                                      row.isNewClass
                                        ? 'bg-blue-50 text-blue-800 border border-blue-200'
                                        : 'bg-slate-100 text-slate-800'
                                    }`}
                                  >
                                    {row.resolvedClassName}
                                  </span>
                                </td>
                                <td className="py-2 px-3">{row.gender || '-'}</td>
                                <td className="py-2 px-3 whitespace-nowrap">
                                  {isDup ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold" title={row.duplicateReason || undefined}>
                                      Doublon ignoré · {row.duplicateReason}
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                                      <CheckCircle2 className="w-3 h-3" />
                                      À enregistrer
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
                </>
              )}
            </div>
          )}
        </div>

        {/* Pied de modale : demande explicite de confirmation */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-2.5 shrink-0">
          <p className="text-[11px] text-slate-500">
            {analysis && newStudentsCount > 0
              ? `Confirmez pour enregistrer ces ${newStudentsCount} élève(s) dans leurs classes correspondantes.`
              : 'Aucune donnée enregistrée tant que vous ne confirmez pas.'}
          </p>
          <div className="flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={handleClose}
              disabled={isUploading}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={() => void handleConfirmImport()}
              disabled={!file || isAnalyzing || isUploading || !analysis || newStudentsCount === 0}
              className="px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <CloudUpload className="w-4 h-4" />
                  Confirmer et enregistrer {newStudentsCount > 0 ? `(${newStudentsCount})` : ''}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
