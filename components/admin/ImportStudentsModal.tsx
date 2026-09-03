'use client'

import { useState, useRef } from 'react'
import { importStudents } from '@/app/actions/students'
import toast from 'react-hot-toast'
import Papa from 'papaparse'

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
      toast.error('Veuillez sélectionner un fichier CSV.')
      return
    }

    setIsUploading(true)

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const data = results.data as any[]
          if (data.length === 0) {
            toast.error('Le fichier est vide.')
            setIsUploading(false)
            return
          }

          const response = await importStudents(data)

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
      },
      error: (error) => {
        toast.error('Erreur de lecture du fichier CSV.')
        setIsUploading(false)
      }
    })
  }

  const generateTemplate = () => {
    const headers = ['Prénom', 'Nom', 'Genre', 'Date de Naissance', 'Classe', 'Matricule', 'Téléphone Parent']
    const csvContent = headers.join(',') + '\n' + 
      'Jean,Dupont,M,2010-05-14,6eme A,1001,90123456\n' +
      'Marie,Curie,F,2011-09-22,6eme A,1002,90123456'
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'template_eleves.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
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
              <li>Le fichier doit être au format <strong>.csv</strong></li>
              <li>Les colonnes obligatoires sont: <strong>Prénom, Nom, Classe</strong>.</li>
              <li>La colonne <strong>Classe</strong> doit correspondre exactement au nom d'une classe existante.</li>
              <li><strong>Matricule</strong> et <strong>Téléphone Parent</strong> sont optionnels.</li>
            </ul>
            <button 
              onClick={generateTemplate}
              className="mt-3 text-blue-700 font-semibold hover:text-blue-900 underline underline-offset-2 flex items-center gap-1 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              Télécharger le modèle CSV
            </button>
          </div>

          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/50 transition-all group"
          >
            <input 
              type="file" 
              accept=".csv" 
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
                <p className="text-xs text-slate-500 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            ) : (
              <div>
                <p className="font-semibold text-slate-700">Cliquez pour sélectionner un fichier CSV</p>
                <p className="text-xs text-slate-500 mt-1">Taille maximale : 5 MB</p>
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
