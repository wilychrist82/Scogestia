'use client'

import { useTransition, useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { createStudent } from '@/app/actions/students'
import Link from 'next/link'

type Props = {
  classes: { id: string, name: string, level?: string }[]
}

export function StudentForm({ classes }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  
  const [bDay, setBDay] = useState('')
  const [bMonth, setBMonth] = useState('')
  const [bYear, setBYear] = useState('')
  
  const currentYear = new Date().getFullYear()
  const years = Array.from({length: 30}, (_, i) => currentYear - 2 - i) // From currentYear-2 down to 30 years back
  const months = [
    { v: '01', l: 'Janvier' }, { v: '02', l: 'Février' }, { v: '03', l: 'Mars' },
    { v: '04', l: 'Avril' }, { v: '05', l: 'Mai' }, { v: '06', l: 'Juin' },
    { v: '07', l: 'Juillet' }, { v: '08', l: 'Août' }, { v: '09', l: 'Septembre' },
    { v: '10', l: 'Octobre' }, { v: '11', l: 'Novembre' }, { v: '12', l: 'Décembre' }
  ]
  const days = Array.from({length: 31}, (_, i) => (i + 1).toString().padStart(2, '0'))

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    
    startTransition(async () => {
      const result = await createStudent(null, formData)
      if (result?.error) {
        setError(result.error)
      }
      // If success, the action redirects automatically
    })
  }

  return (
    <div className="max-w-4xl mx-auto w-full">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-[var(--color-on-surface-variant)] mb-2">
          <Link href="/admin/eleves" className="hover:text-[var(--color-primary)] transition-colors text-sm font-semibold">
            Élèves
          </Link>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
          <span className="text-sm font-semibold text-[var(--color-on-surface)]">Nouvelle Inscription</span>
        </div>
        <h1 className="text-3xl font-bold text-[var(--color-on-surface)]">Inscription d'un Élève</h1>
        <p className="text-base text-[var(--color-on-surface-variant)] mt-2">Veuillez remplir les informations requises pour ajouter un nouvel élève au système.</p>
      </div>

      {error && (
        <div className="mb-6 bg-[var(--color-status-retard-bg)] text-[var(--color-status-retard-text)] p-4 rounded-lg text-sm font-medium border border-[var(--color-status-retard-text)]/20">
          {error}
        </div>
      )}

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-xl overflow-hidden shadow-sm">
        <div className="p-6 md:p-8 border-b border-[var(--color-outline-variant)] bg-[var(--color-surface-bright)]/50">
          <h2 className="text-xl font-semibold text-[var(--color-on-surface)] flex items-center gap-2">
            <span className="material-symbols-outlined text-[var(--color-primary)]">person_add</span>
            Informations Générales
          </h2>
        </div>
        
        <div className="p-6 md:p-8 space-y-6">
          {/* Row 1: Matricule (Read-only) */}
          <div className="w-full md:w-1/2">
            <label className="block text-sm font-semibold text-[var(--color-on-surface)] mb-2" htmlFor="matricule">Matricule</label>
            <div className="relative">
              <input 
                className="w-full h-12 bg-[#eff4ff] border border-[var(--color-outline-variant)] rounded-lg px-4 text-base text-[var(--color-on-surface-variant)] cursor-not-allowed" 
                disabled 
                id="matricule" 
                name="matricule" 
                readOnly 
                type="text" 
                value="Généré à la validation"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-[var(--color-on-surface-variant)] bg-[#eff4ff] px-2 py-1 rounded">
                Généré automatiquement
              </span>
            </div>
          </div>
          
          {/* Row 2: Nom & Prénom */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-[var(--color-on-surface)] mb-2" htmlFor="nom">
                Nom <span className="text-[var(--color-status-retard-text)]">*</span>
              </label>
              <input 
                className="w-full h-12 bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-lg px-4 text-base focus:outline-none focus:border-[var(--color-primary)] focus:border-2 transition-all" 
                id="nom" 
                name="nom" 
                placeholder="Ex: Dupont" 
                required 
                type="text"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[var(--color-on-surface)] mb-2" htmlFor="prenom">
                Prénom <span className="text-[var(--color-status-retard-text)]">*</span>
              </label>
              <input 
                className="w-full h-12 bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-lg px-4 text-base focus:outline-none focus:border-[var(--color-primary)] focus:border-2 transition-all" 
                id="prenom" 
                name="prenom" 
                placeholder="Ex: Jean" 
                required 
                type="text"
              />
            </div>
          </div>

          {/* Row 3: Date de naissance & Classe */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-[var(--color-on-surface)] mb-2">
                Date de naissance <span className="text-[var(--color-status-retard-text)]">*</span>
              </label>
              <input type="hidden" name="date_naissance" value={`${bYear}-${bMonth}-${bDay}`} />
              <div className="grid grid-cols-3 gap-2">
                {/* Jour */}
                <div className="relative">
                  <select 
                    className="w-full h-12 bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-lg pl-3 pr-8 text-base focus:outline-none focus:border-[var(--color-primary)] focus:border-2 transition-all appearance-none"
                    value={bDay}
                    onChange={(e) => setBDay(e.target.value)}
                    required
                  >
                    <option value="">Jour</option>
                    {days.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-on-surface-variant)] pointer-events-none text-sm">expand_more</span>
                </div>
                {/* Mois */}
                <div className="relative">
                  <select 
                    className="w-full h-12 bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-lg pl-3 pr-8 text-base focus:outline-none focus:border-[var(--color-primary)] focus:border-2 transition-all appearance-none"
                    value={bMonth}
                    onChange={(e) => setBMonth(e.target.value)}
                    required
                  >
                    <option value="">Mois</option>
                    {months.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
                  </select>
                  <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-on-surface-variant)] pointer-events-none text-sm">expand_more</span>
                </div>
                {/* Année */}
                <div className="relative">
                  <select 
                    className="w-full h-12 bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-lg pl-3 pr-8 text-base focus:outline-none focus:border-[var(--color-primary)] focus:border-2 transition-all appearance-none"
                    value={bYear}
                    onChange={(e) => setBYear(e.target.value)}
                    required
                  >
                    <option value="">Année</option>
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                  <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-on-surface-variant)] pointer-events-none text-sm">expand_more</span>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-[var(--color-on-surface)] mb-2" htmlFor="classe">
                Classe d'affectation <span className="text-[var(--color-status-retard-text)]">*</span>
              </label>
              <div className="relative">
                <select 
                  className="w-full h-12 bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-lg pl-4 pr-10 text-base focus:outline-none focus:border-[var(--color-primary)] focus:border-2 transition-all appearance-none" 
                  id="classe" 
                  name="classe" 
                  required
                >
                  <option value="">Sélectionner une classe</option>
                  <optgroup label="Maternelle">
                    {classes.filter(c => ['s1', 's2', 'section1', 'section2', 'maternelle'].includes((c.level || '').toLowerCase())).map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Primaire">
                    {classes.filter(c => ['cp1', 'cp2', 'ce1', 'ce2', 'cm1', 'cm2', 'primaire'].includes((c.level || '').toLowerCase())).map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Secondaire">
                    {classes.filter(c => ['6eme', '5eme', '4eme', '3eme', 'secondaire'].includes((c.level || '').toLowerCase())).map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Autres">
                    {classes.filter(c => !['s1', 's2', 'section1', 'section2', 'maternelle', 'cp1', 'cp2', 'ce1', 'ce2', 'cm1', 'cm2', 'primaire', '6eme', '5eme', '4eme', '3eme', 'secondaire'].includes((c.level || '').toLowerCase())).map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </optgroup>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-on-surface-variant)] pointer-events-none">expand_more</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 md:p-8 bg-[var(--color-surface-bright)]/30 border-t border-[var(--color-outline-variant)] flex flex-col sm:flex-row items-center justify-end gap-4">
          <Link 
            href="/admin/eleves"
            className="w-full sm:w-auto h-[48px] px-6 rounded-lg border border-[var(--color-primary)] text-[var(--color-primary)] font-semibold text-sm hover:bg-[#eff4ff] transition-colors flex items-center justify-center gap-2"
          >
            Annuler
          </Link>
          <button 
            disabled={isPending}
            className="w-full sm:w-auto h-[48px] px-6 rounded-lg bg-[var(--color-primary)] text-white font-semibold text-sm hover:opacity-90 transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50" 
            type="submit"
          >
            <span className="material-symbols-outlined text-sm">{isPending ? 'hourglass_empty' : 'save'}</span>
            {isPending ? 'Enregistrement...' : "Enregistrer l'élève"}
          </button>
        </div>
      </form>
    </div>
  )
}
