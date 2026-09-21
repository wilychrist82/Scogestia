'use client'

import { useState, useTransition, FormEvent } from 'react'
import { updateUserProfile } from '@/app/actions/parametres'
import { ImageUpload } from '@/components/shared/ImageUpload'

type Props = {
  userId: string
  userAvatar?: string
  role: 'parent' | 'enseignant'
}

export function UserProfileManager({ userId, userAvatar, role }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<boolean>(false)

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    const formData = new FormData(e.currentTarget)
    
    startTransition(async () => {
      const result = await updateUserProfile({}, formData)
      if (result?.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      }
    })
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-[var(--color-surface)]">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[var(--color-surface-container-lowest)] p-6 rounded-xl border border-[var(--color-outline-variant)]">
          <div>
            <div className="flex items-center gap-2 text-[var(--color-on-surface-variant)] mb-2">
              <span className="text-sm font-semibold text-[var(--color-on-surface)]">Mon Profil</span>
            </div>
            <h2 className="text-3xl font-bold text-[var(--color-on-surface)]">Paramètres du compte</h2>
            <p className="text-base text-[var(--color-on-surface-variant)] mt-1">Personnalisez votre photo de profil.</p>
          </div>
        </div>

        {error && (
          <div className="bg-[var(--color-status-retard-bg)] text-[var(--color-status-retard-text)] p-3 rounded-xl border border-[var(--color-status-retard-bg)] text-sm font-medium">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-[#e6f4ea] text-[#1e8e3e] p-3 rounded-xl border border-[#ceead6] text-sm font-medium flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">check_circle</span>
            Profil mis à jour avec succès.
          </div>
        )}

        <div className="bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-outline-variant)] shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-[var(--color-outline-variant)] bg-[var(--color-surface-bright)]">
            <h3 className="font-bold text-[var(--color-on-surface)] flex items-center gap-2">
              <span className="material-symbols-outlined text-[var(--color-primary)]">person</span>
              Informations personnelles
            </h3>
          </div>
          <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6">
            
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-[var(--color-on-surface)]">Photo de Profil (Avatar)</label>
              <ImageUpload 
                name="profilePhotoUrl" 
                bucket="avatars" 
                folder={`${role}_${userId}`} 
                defaultUrl={userAvatar || null} 
                label="Choisir une photo (Depuis la galerie ou le PC)"
              />
              <p className="text-xs text-[var(--color-on-surface-variant)] mt-1">
                Cette photo sera visible par l'administration et les enseignants.
              </p>
            </div>

            <div className="flex justify-end pt-4 border-t border-[var(--color-outline-variant)]">
              <button 
                type="submit" 
                disabled={isPending}
                className="bg-[var(--color-primary)] hover:opacity-90 text-white px-6 py-2.5 rounded-lg font-semibold text-sm transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {isPending && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                Enregistrer les modifications
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  )
}
