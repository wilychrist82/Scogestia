'use client'

import { useState, useRef } from 'react'
import { importStudents } from '@/app/actions/students'
import toast from 'react-hot-toast'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'

type Props = {
  isOpen: boolean
  onClose: () => void
}

export function ImportStudentsModal({ isOpen, onClose }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0])
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
      } else if (fileExt === 'xlsx' || fileExt === 'xls') {
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
        toast.error('Le fichier est vide.')
        setIsUploading(false)
        return
      }

      const response = await importStudents(parsedData)

      if (response?.error) {
        toast.error(response.error)
      } else if (response?.success) {
        toast.success(`${response.count} élèves importés avec succès !`)
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
    // Generate an Excel file template instead of CSV
    const headers = ['Prénom', 'Nom', 'Genre', 'Date de Naissance', 'Classe', 'Matricule', 'Téléphone Parent']
    const data = [
      { 'Prénom': 'Jean', 'Nom': 'Dupont', 'Genre': 'M', 'Date de Naissance': '2010-05-14', 'Classe': '6eme A', 'Matricule': '1001', 'Téléphone Parent': '90123456' },
      { 'Prénom': 'Marie', 'Nom': 'Curie', 'Genre': 'F', 'Date de Naissance': '2011-09-22', 'Classe': '6eme A', 'Matricule': '1002', 'Téléphone Parent': '90123456' }
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
    link.download = 'template_eleves.xlsx'
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
              Instructions
            </p>
            <ul className="list-disc pl-5 space-y-1 opacity-90">
              <li>Le fichier doit être au format <strong>Excel (.xlsx, .xls)</strong> ou <strong>CSV</strong>.</li>
              <li>Les colonnes obligatoires sont: <strong>Prénom, Nom, Classe</strong>.</li>
              <li>La colonne <strong>Classe</strong> doit correspondre exactement au nom d'une classe existante.</li>
              <li><strong>Matricule</strong> et <strong>Téléphone Parent</strong> sont optionnels.</li>
            </ul>
            <button 
              onClick={generateTemplate}
              className="mt-3 text-blue-700 font-semibold hover:text-blue-900 underline underline-offset-2 flex items-center gap-1 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              Télécharger le modèle Excel
            </button>
          </div>

          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/50 transition-all group"
          >
            <input 
              type="file" 
              accept=".xlsx,.xls,.csv" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            <div className="mx-auto w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined">file_upload</span>
            </div>
            {file ? (
              <div>
                <p className="font-semibold text-slate-800">{file.name}</p>
                <p className="text-xs text-slate-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            ) : (
              <div>
                <p className="font-semibold text-slate-700">Cliquez pour sélectionner un fichier (Excel ou CSV)</p>
                <p className="text-xs text-slate-500 mt-1">Taille maximale recommandée : 50 MB</p>
              </div>
            )}
          </div>
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
