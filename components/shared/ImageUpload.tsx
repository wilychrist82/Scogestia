'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

type Props = {
  bucket: string
  folder?: string
  defaultUrl?: string | null
  onUploadSuccess?: (url: string) => void
  label?: string
  name?: string
}

export function ImageUpload({ bucket, folder = 'uploads', defaultUrl, onUploadSuccess, label = 'Uploader une image', name }: Props) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(defaultUrl || null)
  const supabase = createClient()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Vérification de base de la taille et du type
    if (file.size > 5 * 1024 * 1024) {
      setError("Le fichier est trop volumineux (max 5 Mo).")
      return
    }
    if (!file.type.startsWith('image/')) {
      setError("Veuillez sélectionner une image.")
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      // Prévisualisation locale
      const objectUrl = URL.createObjectURL(file)
      setPreview(objectUrl)

      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
      const filePath = `${folder}/${fileName}`

      const { data, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath)

      if (publicUrlData?.publicUrl) {
        setPreview(publicUrlData.publicUrl)
        if (onUploadSuccess) onUploadSuccess(publicUrlData.publicUrl)
      } else {
        throw new Error("Impossible de récupérer l'URL de l'image.")
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-4">
        {preview ? (
          <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-gray-200 shrink-0">
            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-16 h-16 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 shrink-0">
            <span className="material-symbols-outlined">image</span>
          </div>
        )}
        <div className="flex-1">
          {name && <input type="hidden" name={name} value={preview || ''} />}
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
          />
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {isUploading ? (
              <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
            ) : (
              <span className="material-symbols-outlined text-[18px]">upload</span>
            )}
            {isUploading ? 'Téléchargement...' : label}
          </button>
          {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
        </div>
      </div>
    </div>
  )
}
