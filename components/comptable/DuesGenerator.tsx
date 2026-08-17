'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { generateDues } from '@/app/actions/accounting'

type ClassData = { id: string, name: string }
type StudentData = { id: string, first_name: string, last_name: string, class_id: string }

type Props = {
  classes: ClassData[]
  students: StudentData[]
}

export function DuesGenerator({ classes, students }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  
  const [targetType, setTargetType] = useState<'class' | 'student'>('class')
  const [targetClass, setTargetClass] = useState('')
  const [targetStudent, setTargetStudent] = useState('')

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    
    // Validate target selection
    if (targetType === 'class' && !targetClass) {
      setError("Veuillez sélectionner une classe.")
      return
    }
    if (targetType === 'student' && !targetStudent) {
      setError("Veuillez sélectionner un élève.")
      return
    }

    // Set correct target_select value
    formData.set('target_select', targetType === 'class' ? targetClass : targetStudent)

    startTransition(async () => {
      const result = await generateDues(null, formData)
      if (result?.error) {
        setError(result.error)
      }
    })
  }

  // Filter students based on selected class if any, otherwise show all
  const filteredStudents = targetClass 
    ? students.filter(s => s.class_id === targetClass)
    : students

  return (
    <div className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-xl p-4 md:p-8 shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-[var(--color-status-retard-bg)] text-[var(--color-status-retard-text)] p-4 rounded-lg text-sm mb-4 border border-[var(--color-status-retard-text)]/20">
            {error}
          </div>
        )}

        {/* Selection Type Toggle */}
        <div className="mb-6 border-b border-[var(--color-outline-variant)] pb-6">
          <label className="text-sm font-semibold text-[var(--color-on-background)] block mb-3">Cible de facturation</label>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="radio" 
                name="target_type" 
                value="class" 
                checked={targetType === 'class'}
                onChange={() => setTargetType('class')}
                className="text-[var(--color-primary)] border-[var(--color-outline-variant)] focus:ring-[var(--color-primary)] w-5 h-5" 
              />
              <span className="text-base text-[var(--color-on-surface)]">Classe entière</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="radio" 
                name="target_type" 
                value="student" 
                checked={targetType === 'student'}
                onChange={() => setTargetType('student')}
                className="text-[var(--color-primary)] border-[var(--color-outline-variant)] focus:ring-[var(--color-primary)] w-5 h-5" 
              />
              <span className="text-base text-[var(--color-on-surface)]">Élève individuel</span>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Target Selection */}
          {targetType === 'class' ? (
            <div>
              <label className="text-sm font-semibold text-[var(--color-on-background)] block mb-2" htmlFor="target_select_class">Sélectionner la classe</label>
              <div className="relative">
                <select 
                  id="target_select_class" 
                  value={targetClass}
                  onChange={(e) => setTargetClass(e.target.value)}
                  className="w-full border border-[var(--color-outline-variant)] rounded-lg p-3 bg-[var(--color-surface)] text-[var(--color-on-surface)] appearance-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-container)] focus:outline-none transition-colors h-[48px]"
                >
                  <option disabled value="">Choisir une classe...</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[var(--color-on-surface-variant)]">
                  <span className="material-symbols-outlined">expand_more</span>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <label className="text-sm font-semibold text-[var(--color-on-background)] block mb-2" htmlFor="target_select_student">Sélectionner l'élève</label>
              <div className="relative">
                <select 
                  id="target_select_student" 
                  value={targetStudent}
                  onChange={(e) => setTargetStudent(e.target.value)}
                  className="w-full border border-[var(--color-outline-variant)] rounded-lg p-3 bg-[var(--color-surface)] text-[var(--color-on-surface)] appearance-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-container)] focus:outline-none transition-colors h-[48px]"
                >
                  <option disabled value="">Choisir un élève...</option>
                  {filteredStudents.map(s => (
                    <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[var(--color-on-surface-variant)]">
                  <span className="material-symbols-outlined">expand_more</span>
                </div>
              </div>
            </div>
          )}

          {/* Label Input */}
          <div>
            <label className="text-sm font-semibold text-[var(--color-on-background)] block mb-2" htmlFor="payment_label">Libellé de l'échéance</label>
            <input 
              type="text" 
              id="payment_label" 
              name="payment_label" 
              required
              placeholder="ex: Scolarité Trimestre 2" 
              className="w-full border border-[var(--color-outline-variant)] rounded-lg p-3 bg-[var(--color-surface)] text-[var(--color-on-surface)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-container)] focus:outline-none transition-colors h-[48px]" 
            />
          </div>

          {/* Amount Input */}
          <div>
            <label className="text-sm font-semibold text-[var(--color-on-background)] block mb-2" htmlFor="amount">Montant (FCFA)</label>
            <div className="relative">
              <input 
                type="number" 
                id="amount" 
                name="amount" 
                required
                min="0"
                placeholder="0" 
                className="w-full border border-[var(--color-outline-variant)] rounded-lg p-3 pr-16 bg-[var(--color-surface)] text-[var(--color-on-surface)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-container)] focus:outline-none transition-colors h-[48px]" 
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                <span className="text-sm font-semibold text-[var(--color-on-surface-variant)]">FCFA</span>
              </div>
            </div>
          </div>

          {/* Due Date Input */}
          <div>
            <label className="text-sm font-semibold text-[var(--color-on-background)] block mb-2" htmlFor="due_date">Date d'échéance maximale</label>
            <input 
              type="date" 
              id="due_date" 
              name="due_date" 
              required
              className="w-full border border-[var(--color-outline-variant)] rounded-lg p-3 bg-[var(--color-surface)] text-[var(--color-on-surface)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-container)] focus:outline-none transition-colors h-[48px]" 
            />
          </div>
        </div>

        {/* Information Note */}
        <div className="bg-[var(--color-surface-container)] p-4 rounded-lg mt-6 border border-[var(--color-outline-variant)]/50">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-[var(--color-primary)] mt-0.5">info</span>
            <div>
              <h4 className="text-sm font-semibold text-[var(--color-on-background)]">Note d'information</h4>
              <p className="text-sm text-[var(--color-on-surface-variant)] mt-1">La génération s'appliquera aux statuts actifs uniquement. Les notifications seront envoyées automatiquement aux parents liés si la configuration de l'établissement le permet.</p>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="pt-6 border-t border-[var(--color-outline-variant)] flex justify-end gap-4 mt-8">
          <button 
            type="button" 
            onClick={() => router.back()}
            disabled={isPending}
            className="px-6 py-3 border border-[var(--color-outline)] text-[var(--color-on-surface)] font-semibold text-sm rounded-lg hover:bg-[var(--color-surface-container-high)] transition-colors h-[48px] min-w-[120px] disabled:opacity-50"
          >
            Annuler
          </button>
          <button 
            type="submit" 
            disabled={isPending}
            className="px-6 py-3 bg-[var(--color-primary)] text-white font-semibold text-sm rounded-lg flex items-center gap-2 hover:opacity-90 transition-opacity h-[48px] shadow-sm disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[20px]">{isPending ? 'hourglass_empty' : 'receipt_long'}</span>
            {isPending ? 'Génération...' : 'Générer les échéances'}
          </button>
        </div>
      </form>
    </div>
  )
}
