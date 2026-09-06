'use client'

import { useTransition, useState } from 'react'
import { ImageUpload } from '@/components/shared/ImageUpload'
import { updateTeacherProfile } from '@/app/actions/enseignant'

export function TeacherParametres({ userAvatar, userFullName }: { userAvatar: string, userFullName: string }) {
  const [isPending, startTransition] = useTransition()
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await updateTeacherProfile({}, formData)
      if (result?.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      }
    })
  }

  return (
    <div className="flex-1 p-4 md:p-6 lg:p-8 bg-[var(--color-surface)]">
      <div className="max-w-3xl mx-auto space-y-6">
        
        <div className="bg-[var(--color-surface-container-lowest)] p-6 rounded-xl border border-[var(--color-outline-variant)]">
          <h2 className="text-2xl font-bold text-[var(--color-on-surface)]">Paramètres du profil</h2>
          <p className="text-sm text-[var(--color-on-surface-variant)] mt-1">Gérez votre photo de profil et vos informations personnelles.</p>
        </div>

        {error && (
          <div className="bg-[var(--color-status-retard-bg)] text-[var(--color-status-retard-text)] p-3 rounded-xl border border-[var(--color-status-retard-bg)] text-sm font-medium">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-[var(--color-status-present-bg)] text-[var(--color-status-present-text)] p-3 rounded-xl border border-[var(--color-status-present-bg)] text-sm font-medium">
            Profil mis à jour avec succès !
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-[var(--color-surface-container-lowest)] p-6 rounded-xl border border-[var(--color-outline-variant)]">
          <div className="space-y-6">
            
            <div>
              <label className="block text-sm font-semibold text-[var(--color-on-surface)] mb-2">Photo de Profil</label>
              <ImageUpload 
                name="profilePhotoUrl" 
                bucket="avatars" 
                folder={`enseignant_${userFullName.replace(/\s+/g, '_')}`} 
                defaultUrl={userAvatar || null} 
                label="Choisir une photo"
              />
            </div>

            <div className="pt-4 border-t border-[var(--color-outline-variant)] flex justify-end">
              <button 
                type="submit" 
                disabled={isPending}
                className="h-12 px-8 bg-[var(--color-primary)] text-white font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isPending ? (
                  <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                ) : (
                  <span className="material-symbols-outlined text-[20px]">save</span>
                )}
                {isPending ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  )
}
