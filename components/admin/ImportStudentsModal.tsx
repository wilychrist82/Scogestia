'use client'

import { useState, useRef } from 'react'
import { importStudents } from '@/app/actions/students'
import toast from 'react-hot-toast'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'

import { extractClassFromFilename } from '@/lib/student-import-utils'
import { useEffect, useMemo } from 'react'

type Props = {
  isOpen: boolean
  onClose: () => void
  classes?: { id: string, name: string, level?: string }[]
  initialClassId?: string
}

export function ImportStudentsModal({ isOpen, onClose, classes = [], initialClassId }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [selectedClassId, setSelectedClassId] = useState<string>(initialClassId || 'auto')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (initialClassId) {
      setSelectedClassId(initialClassId)
    }
  }, [initialClassId])

  const detectedClass = useMemo(() => {
    if (!file || classes.length === 0) return null
    return extractClassFromFilename(file.name, classes)
  }, [file, classes])

  if (!isOpen) return null

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0])
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
      setFile(e.dataTransfer.files[0])
    }
  }

  const handleImport = async () => {
    if (!file) {
      toast.error('Veuillez sélectionner un fichier Excel ou CSV.')
      return
    }

    setIsUploading(true)

    try {
      const fileExt = file.name.split('.').pop()?.toLowerCase()
      
      let parsedData: any[] = []

      if (fileExt === 'csv') {
        const text = await file.text()
        const result = Papa.parse(text, { header: true, skipEmptyLines: true })
        parsedData = result.data as any[]
      } else if (fileExt === 'xlsx' || fileExt === 'xls' || fileExt === 'ods') {
        const data = await file.arrayBuffer()
        const workbook = XLSX.read(data, { type: 'array' })
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]
        parsedData = XLSX.utils.sheet_to_json(worksheet)
      } else {
        toast.error('Format de fichier non supporté. Utilisez .xlsx, .xls ou .csv')
        setIsUploading(false)
        return
      }

      if (parsedData.length === 0) {
        toast.error('Le fichier est vide ou n\'a pas pu être lu.')
        setIsUploading(false)
        return
      }

      const targetClassId = selectedClassId !== 'auto' ? selectedClassId : undefined
      const response = await importStudents(parsedData, targetClassId, file.name)

      if (response?.error) {
        toast.error(response.error, { duration: 6000 })
      } else if (response?.success) {
        if (response.createdClassesCount && response.createdClassesCount > 0) {
          toast.success(
            `${response.count} élèves importés avec succès ! ${response.createdClassesCount} classe(s) créée(s) automatiquement : ${response.createdClassesNames?.join(', ')}.`,
            { duration: 6000 }
          )
        } else {
          toast.success(`${response.count} élèves importés et répartis dans leurs classes !`)
        }
        onClose()
        setFile(null)
      }
    } catch (error: any) {
      toast.error('Erreur lors de l\'importation: ' + error.message)
    } finally {
      setIsUploading(false)
    }
  }

  const generateTemplate = () => {
    // Generate an Excel file template with multiple classes example
    const headers = ['Prénom', 'Nom', 'Sexe', 'Classe', 'Date de Naissance', 'Matricule', 'Téléphone Parent']
    const data = [
      { 'Prénom': 'Jean', 'Nom': 'Dupont', 'Sexe': 'M', 'Classe': '2nde A', 'Date de Naissance': '14/05/2009', 'Matricule': '1001', 'Téléphone Parent': '90123456' },
      { 'Prénom': 'Marie', 'Nom': 'Curie', 'Sexe': 'F', 'Classe': '1ère D', 'Date de Naissance': '22/09/2008', 'Matricule': '1002', 'Téléphone Parent': '91234567' },
      { 'Prénom': 'Amina', 'Nom': 'Diallo', 'Sexe': 'F', 'Classe': 'Terminale C', 'Date de Naissance': '10/11/2007', 'Matricule': '1003', 'Téléphone Parent': '92345678' },
      { 'Prénom': 'Koffi', 'Nom': 'Mensah', 'Sexe': 'M', 'Classe': '6ème A', 'Date de Naissance': '03/01/2012', 'Matricule': '1004', 'Téléphone Parent': '93456789' }
    ]
    
    const worksheet = XLSX.utils.json_to_sheet(data, { header: headers })
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Eleves')
    
    // Write and trigger download
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'modele_import_eleves_scogestia.xlsx'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 ">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-600">upload_file</span>
            Importer des élèves
          </h3>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-sm leading-relaxed border border-blue-100">
            <p className="font-semibold mb-2 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base">info</span>
              Instructions & Répartition par classe
            </p>
            <ul className="list-disc pl-5 space-y-1 opacity-90">
              <li>Le fichier peut être au format <strong>Excel (.xlsx, .xls)</strong> ou <strong>CSV</strong>.</li>
              <li>Un même fichier peut contenir <strong>plusieurs classes différentes</strong> (ex: 2nde A, 1ère D, 6ème B, CM2...).</li>
              <li>Colonnes obligatoires : <strong>Prénom, Nom, Classe</strong>.</li>
              <li>Colonnes recommandées : <strong>Sexe</strong> (M/F), <strong>Date de Naissance</strong> (JJ/MM/AAAA), <strong>Matricule</strong>, <strong>Téléphone Parent</strong>.</li>
              <li>✨ <em>Si une classe n'existe pas encore dans Scogestia, elle sera créée automatiquement avec son niveau !</em></li>
            </ul>
            <button 
              onClick={generateTemplate}
              className="mt-3 text-blue-700 font-semibold hover:text-blue-900 underline underline-offset-2 flex items-center gap-1 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              Télécharger le modèle Excel pré-rempli
            </button>
          </div>

          {/* Sélecteur de classe de destination */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>Classe de destination</span>
              <span className="text-[11px] font-normal text-slate-400">Si non indiquée dans chaque ligne</span>
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full h-11 px-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none cursor-pointer"
            >
              <option value="auto">
                {detectedClass 
                  ? `⚡ Détection auto (Nom du fichier : ${detectedClass})`
                  : '⚡ Détection auto (selon le fichier ou son nom)'}
              </option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>Classe {c.name}</option>
              ))}
            </select>
            {detectedClass && selectedClassId === 'auto' && (
              <p className="text-xs text-emerald-700 font-medium flex items-center gap-1 mt-1">
                <span className="material-symbols-outlined text-sm text-emerald-600">auto_awesome</span>
                Classe détectée d'après le nom du fichier : <strong>{detectedClass}</strong>
              </p>
            )}
          </div>

          <div 
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all group ${
              isDragging 
                ? 'border-emerald-600 bg-emerald-100/50 scale-[1.02]' 
                : file 
                  ? 'border-emerald-500 bg-emerald-50/40' 
                  : 'border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50'
            }`}
          >
            <input 
              type="file" 
              accept=".xlsx,.xls,.csv,.ods,.XLSX,.XLS,.CSV,.ODS,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileChange}
              onClick={(e) => { (e.target as HTMLInputElement).value = '' }}
            />
            <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-transform ${
              file ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-100 text-emerald-600 group-hover:scale-110'
            }`}>
              <span className="material-symbols-outlined">
                {file ? 'check_circle' : 'file_upload'}
              </span>
            </div>
            {file ? (
              <div className="space-y-1">
                <p className="font-bold text-slate-800 break-all">{file.name}</p>
                <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                <p className="text-xs text-emerald-600 font-semibold pt-1">
                  ✓ Fichier sélectionné. Cliquez sur « Importer » ci-dessous ou cliquez ici pour changer de fichier.
                </p>
              </div>
            ) : (
              <div>
                <p className="font-semibold text-slate-700">
                  Cliquez pour sélectionner un fichier (ou glissez-déposez-le ici)
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Formats acceptés : Excel (.xlsx, .xls) ou CSV
                </p>
              </div>
            )}
          </div>

          <p className="text-xs text-slate-500 text-center italic">
            💡 Astuce : si votre dossier semble vide lors de la sélection, vérifiez que le filtre en bas à droite de l'explorateur Windows est bien sur <strong>« Tous les fichiers (*.*) »</strong>, ou glissez simplement votre fichier depuis votre dossier jusque dans la zone ci-dessus.
          </p>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Annuler
          </button>
          <button 
            onClick={handleImport}
            disabled={!file || isUploading}
            className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isUploading ? (
              <>
                <span className="material-symbols-outlined animate-spin text-sm">refresh</span>
                Importation...
              </>
            ) : (
              'Importer'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
