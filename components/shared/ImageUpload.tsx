'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Image as ImageIcon, Loader2, Trash2, Upload } from 'lucide-react'

type Props = {
  bucket: string
  folder?: string
  defaultUrl?: string | null
  onUploadSuccess?: (url: string) => void
  onRemove?: () => void
  allowRemove?: boolean
  label?: string
  name?: string
}

async function toCompactDataUrl(rawDataUrl: string, maxDim = 256): Promise<string> {
  return new Promise((resolve) => {
    const img = new window.Image()
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width || maxDim, img.height || maxDim))
      const width = Math.max(1, Math.round((img.width || maxDim) * scale))
      const height = Math.max(1, Math.round((img.height || maxDim) * scale))
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve(rawDataUrl)
        return
      }
      ctx.drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/jpeg', 0.82))
    }
    img.onerror = () => resolve(rawDataUrl)
    img.src = rawDataUrl
  })
}

export function ImageUpload({
  bucket,
  folder = 'uploads',
  defaultUrl,
  onUploadSuccess,
  onRemove,
  allowRemove = false,
  label = 'Uploader une image',
  name,
}: Props) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [previewOverride, setPreviewOverride] = useState<{ base: string | null; value: string | null } | null>(null)
  const supabase = createClient()

  const basePreview = defaultUrl || null
  const preview =
    previewOverride && previewOverride.base === basePreview
      ? previewOverride.value
      : basePreview

  const setPreview = (next: string | null) => {
    setPreviewOverride({ base: basePreview, value: next })
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    // Vérification de base de la taille (jusqu'à 15 Mo) et du type
    if (file.size > 15 * 1024 * 1024) {
      setError("Le fichier est trop volumineux (max 15 Mo).")
      return
    }
    if (!file.type.startsWith('image/')) {
      setError("Veuillez sélectionner une image.")
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      // Lecture immédiate en DataURL pour prévisualisation instantanée
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = () => reject(new Error('Lecture du fichier impossible'))
        reader.readAsDataURL(file)
      })
      setPreview(dataUrl)

      const fileExt = (file.name.split('.').pop() || 'png').replace(/[^a-zA-Z0-9]/g, '')
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
      const filePath = `${folder}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, { upsert: true })

      if (!uploadError) {
        const { data: publicUrlData } = supabase.storage
          .from(bucket)
          .getPublicUrl(filePath)

        if (publicUrlData?.publicUrl) {
          setPreview(publicUrlData.publicUrl)
          if (onUploadSuccess) onUploadSuccess(publicUrlData.publicUrl)
          return
        }
      }

      // Fallback compact si le bucket Storage échoue (évite un cookie auth surdimensionné)
      const compactUrl = dataUrl.length > 100_000 ? await toCompactDataUrl(dataUrl) : dataUrl
      setPreview(compactUrl)
      if (onUploadSuccess) onUploadSuccess(compactUrl)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur lors du téléversement.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemove = () => {
    setPreview(null)
    setError(null)
    if (onUploadSuccess) onUploadSuccess('')
    if (onRemove) onRemove()
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-4">
        {preview ? (
          <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-gray-200 shrink-0 bg-white shadow-2xs">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Preview" className="w-full h-full object-cover object-top" />
          </div>
        ) : (
          <div className="w-16 h-16 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 shrink-0">
            <ImageIcon className="w-6 h-6" />
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
          <div className="flex flex-wrap items-center gap-2">
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {isUploading ? 'Téléchargement...' : label}
            </button>
            {allowRemove && preview && (
              <button
                type="button"
                onClick={handleRemove}
                disabled={isUploading}
                className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-lg border border-rose-200 transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Retirer</span>
              </button>
            )}
          </div>
          {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
        </div>
      </div>
    </div>
  )
}
