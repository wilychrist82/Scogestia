'use client'

import { useState, useTransition, FormEvent } from 'react'
import { updateSchoolSettings } from '@/app/actions/parametres'

type School = {
  id: string
  name: string
  address: string | null
  phone: string | null
  email: string | null
  current_academic_year: string
}

type Props = {
  school: School
}

export function ParametresManager({ school }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<boolean>(false)

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    const formData = new FormData(e.currentTarget)
    
    startTransition(async () => {
      const result = await updateSchoolSettings({}, formData)
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
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[var(--color-surface-container-lowest)] p-6 rounded-xl border border-[var(--color-outline-variant)]">
          <div>
            <div className="flex items-center gap-2 text-[var(--color-on-surface-variant)] mb-2">
              <span className="text-sm font-semibold text-[var(--color-on-surface)]">Paramètres</span>
            </div>
            <h2 className="text-3xl font-bold text-[var(--color-on-surface)]">Configuration de l'École</h2>
            <p className="text-base text-[var(--color-on-surface-variant)] mt-1">Gérez les informations globales et les préférences du système.</p>
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
            Paramètres enregistrés avec succès.
          </div>
        )}

        <div className="bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-outline-variant)] shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-[var(--color-outline-variant)] bg-[var(--color-surface-bright)]">
            <h3 className="font-bold text-[var(--color-on-surface)] flex items-center gap-2">
              <span className="material-symbols-outlined text-[var(--color-primary)]">account_balance</span>
              Informations de l'Établissement
            </h3>
          </div>
          <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-1.5 md:col-span-2">
                <label className="text-sm font-semibold text-[var(--color-on-surface)]">
                  Nom de l'établissement <span className="text-[var(--color-status-retard-text)]">*</span>
                </label>
                <input 
                  type="text" 
                  name="name"
                  defaultValue={school.name}
                  className="w-full h-12 px-4 border border-[var(--color-outline-variant)] rounded-lg text-base focus:border-[var(--color-primary)] outline-none bg-[var(--color-surface)]"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5 md:col-span-2">
                <label className="text-sm font-semibold text-[var(--color-on-surface)]">Adresse physique</label>
                <input 
                  type="text" 
                  name="address"
                  defaultValue={school.address || ''}
                  className="w-full h-12 px-4 border border-[var(--color-outline-variant)] rounded-lg text-base focus:border-[var(--color-primary)] outline-none bg-[var(--color-surface)]"
                  placeholder="Quartier, Ville, Pays"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[var(--color-on-surface)]">Téléphone de contact</label>
                <input 
                  type="text" 
                  name="phone"
                  defaultValue={school.phone || ''}
                  className="w-full h-12 px-4 border border-[var(--color-outline-variant)] rounded-lg text-base focus:border-[var(--color-primary)] outline-none bg-[var(--color-surface)]"
                  placeholder="+228 XX XX XX XX"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[var(--color-on-surface)]">Email de contact</label>
                <input 
                  type="email" 
                  name="email"
                  defaultValue={school.email || ''}
                  className="w-full h-12 px-4 border border-[var(--color-outline-variant)] rounded-lg text-base focus:border-[var(--color-primary)] outline-none bg-[var(--color-surface)]"
                  placeholder="contact@ecole.com"
                />
              </div>
            </div>

            <hr className="border-[var(--color-outline-variant)]" />

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-[var(--color-on-surface)]">
                Année Académique Active <span className="text-[var(--color-status-retard-text)]">*</span>
              </label>
              <select 
                name="currentAcademicYear"
                defaultValue={school.current_academic_year}
                className="w-full h-12 px-4 border border-[var(--color-outline-variant)] rounded-lg text-base focus:border-[var(--color-primary)] outline-none bg-[var(--color-surface)] max-w-md"
                required
              >
                <option value="2024-2025">2024 - 2025</option>
                <option value="2025-2026">2025 - 2026</option>
                <option value="2026-2027">2026 - 2027</option>
                <option value="2027-2028">2027 - 2028</option>
              </select>
              <p className="text-xs text-[var(--color-on-surface-variant)] mt-1">
                La modification de l'année scolaire active basculera l'ensemble du système sur cette année. Assurez-vous d'avoir exporté tous les rapports de l'année précédente.
              </p>
            </div>

            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-[var(--color-outline-variant)]">
              <button 
                type="submit" 
                disabled={isPending}
                className="bg-[var(--color-primary)] text-white px-8 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isPending ? 'Enregistrement...' : 'Enregistrer les modifications'}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  )
}
