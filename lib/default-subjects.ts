import type { SupabaseClient } from '@supabase/supabase-js'

const DEFAULT_PRIMARY_SUBJECTS = [
  { name: 'Je sais écrire les mots (dictée, questions)', cycle: 'primaire', category: 'Français' },
  { name: 'Je produis un texte (Rédaction)', cycle: 'primaire', category: 'Français' },
  { name: 'Lecture', cycle: 'primaire', category: 'Français' },
  { name: 'Étude de texte', cycle: 'primaire', category: 'Français' },
  { name: 'Je sais parler (langage)', cycle: 'primaire', category: 'Français' },
  { name: 'Calcul Écrit', cycle: 'primaire', category: 'Mathématiques' },
  { name: 'Calcul mental', cycle: 'primaire', category: 'Mathématiques' },
  { name: 'Problème', cycle: 'primaire', category: 'Mathématiques' },
  { name: 'Sciences Humaines (Histoire-Géographie)', cycle: 'primaire', category: 'Sciences' },
  { name: 'Education Sociale (ECM)', cycle: 'primaire', category: 'Sciences' },
  { name: 'Sciences et Technologie (Edusivip)', cycle: 'primaire', category: 'Sciences' },
  { name: 'Arts plastiques (Dessin)', cycle: 'primaire', category: 'Divers' },
  { name: 'Chant', cycle: 'primaire', category: 'Divers' },
  { name: 'Récitation', cycle: 'primaire', category: 'Divers' },
  { name: 'Anglais', cycle: 'primaire', category: 'Divers' },
  { name: 'EPS', cycle: 'primaire', category: 'Divers' },
] as const

const DEFAULT_SECONDARY_SUBJECTS = [
  { name: 'Français', cycle: 'secondaire', coefficient: 2 },
  { name: 'Rédaction', cycle: 'secondaire', coefficient: 1 },
  { name: 'Histoire-Géographie', cycle: 'secondaire', coefficient: 2 },
  { name: 'Anglais', cycle: 'secondaire', coefficient: 2 },
  { name: 'SVT', cycle: 'secondaire', coefficient: 2 },
  { name: 'Mathématiques', cycle: 'secondaire', coefficient: 4 },
  { name: 'Sciences physiques', cycle: 'secondaire', coefficient: 3 },
  { name: 'ECM', cycle: 'secondaire', category: null, coefficient: 1 },
  { name: 'EPS', cycle: 'secondaire', coefficient: 1 },
  { name: 'Philosophie', cycle: 'secondaire', coefficient: 2 },
] as const

function normalizeSubjectName(name: string | null | undefined): string {
  return (name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

/**
 * Initialise les matières par défaut pour un nouvel établissement et complète
 * les matières essentielles manquantes (`Philosophie`, `Étude de texte`) en un seul appel.
 */
export async function ensureDefaultSubjects<T extends { name?: string | null }>(
  supabase: SupabaseClient,
  schoolId: string,
  existingSubjects: T[] | null,
): Promise<T[]> {
  const current = existingSubjects ?? []

  if (current.length === 0) {
    const seedRows = [
      ...DEFAULT_PRIMARY_SUBJECTS.map((s) => ({ school_id: schoolId, ...s })),
      ...DEFAULT_SECONDARY_SUBJECTS.map((s) => ({
        school_id: schoolId,
        name: s.name,
        cycle: s.cycle,
        coefficient: s.coefficient,
      })),
    ]
    const { data: inserted } = await supabase.from('subjects').insert(seedRows).select('*')
    return (inserted as T[] | null) ?? []
  }

  const toInsert: Array<Record<string, unknown>> = []

  if (!current.some((s) => (s.name || '').toLowerCase().includes('philo'))) {
    toInsert.push({
      school_id: schoolId,
      name: 'Philosophie',
      cycle: 'secondaire',
      coefficient: 2,
    })
  }

  const hasEtude = current.some((s) => {
    const norm = normalizeSubjectName(s.name)
    return norm === 'etude de texte' || norm.includes('etude de texte') || norm.includes('etude texte')
  })
  if (!hasEtude) {
    toInsert.push({
      school_id: schoolId,
      name: 'Étude de texte',
      cycle: 'primaire',
      category: 'Français',
      coefficient: 1,
    })
  }

  if (toInsert.length === 0) return current

  const { data: inserted } = await supabase.from('subjects').insert(toInsert).select('*')
  return [...current, ...((inserted as T[] | null) ?? [])]
}
