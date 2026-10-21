import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MatieresManager } from '@/components/admin/academique/MatieresManager'

export const dynamic = 'force-dynamic'

export default async function MatieresPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: roleData } = await supabase
    .from('user_school_roles')
    .select('school_id')
    .eq('user_id', user.id)
    .limit(1).maybeSingle()

  if (!roleData?.school_id) {
    return <div className="p-8 text-[var(--color-status-retard-text)]">École introuvable.</div>
  }

  const schoolId = roleData.school_id

  const { data: initialSubjects, error } = await supabase
    .from('subjects')
    .select('*')
    .eq('school_id', schoolId)
    .order('name')

  let subjects = initialSubjects

  if (error) {
    return <div className="p-8 text-[var(--color-status-retard-text)]">Erreur de récupération des matières: {error.message || JSON.stringify(error)}</div>
  }

  // Auto-seeding / vérification automatique d'Étude de texte
  if (!subjects || subjects.length === 0) {
    const seedSubjects = [
      // Primary
      { school_id: schoolId, name: 'Lecture', cycle: 'primaire', category: 'Français', coefficient: 1 },
      { school_id: schoolId, name: 'Étude de texte', cycle: 'primaire', category: 'Français', coefficient: 1 },
      { school_id: schoolId, name: 'Dictée', cycle: 'primaire', category: 'Français', coefficient: 1 },
      { school_id: schoolId, name: 'Rédaction', cycle: 'primaire', category: 'Français', coefficient: 1 },
      { school_id: schoolId, name: 'Langage', cycle: 'primaire', category: 'Français', coefficient: 1 },
      { school_id: schoolId, name: 'Calcul écrit', cycle: 'primaire', category: 'Mathématiques', coefficient: 1 },
      { school_id: schoolId, name: 'Calcul mental', cycle: 'primaire', category: 'Mathématiques', coefficient: 1 },
      { school_id: schoolId, name: 'Problème', cycle: 'primaire', category: 'Mathématiques', coefficient: 1 },
      { school_id: schoolId, name: 'Géométrie', cycle: 'primaire', category: 'Mathématiques', coefficient: 1 },
      { school_id: schoolId, name: 'Sciences et technologies', cycle: 'primaire', category: 'Sciences et technologies', coefficient: 1 },
      { school_id: schoolId, name: 'Sciences humaines', cycle: 'primaire', category: 'Sciences humaines', coefficient: 1 },
      { school_id: schoolId, name: 'Education sociale', cycle: 'primaire', category: 'Education sociale', coefficient: 1 },
      { school_id: schoolId, name: 'Dessin', cycle: 'primaire', category: 'EAC', coefficient: 1 },
      { school_id: schoolId, name: 'Chant', cycle: 'primaire', category: 'EAC', coefficient: 1 },
      { school_id: schoolId, name: 'Récitation', cycle: 'primaire', category: 'EAC', coefficient: 1 },
      { school_id: schoolId, name: 'EPS', cycle: 'primaire', category: 'EPS', coefficient: 1 },
      
      // Secondary
      { school_id: schoolId, name: 'Français', cycle: 'secondaire', coefficient: 2 },
      { school_id: schoolId, name: 'Histoire-Géographie', cycle: 'secondaire', coefficient: 2 },
      { school_id: schoolId, name: 'Anglais', cycle: 'secondaire', coefficient: 2 },
      { school_id: schoolId, name: 'SVT', cycle: 'secondaire', coefficient: 2 },
      { school_id: schoolId, name: 'Mathématiques', cycle: 'secondaire', coefficient: 2 },
      { school_id: schoolId, name: 'Sciences physiques', cycle: 'secondaire', coefficient: 2 },
      { school_id: schoolId, name: 'ECM', cycle: 'secondaire', coefficient: 1 },
      { school_id: schoolId, name: 'EPS', cycle: 'secondaire', coefficient: 1 },
      { school_id: schoolId, name: 'Philosophie', cycle: 'secondaire', coefficient: 2 },
    ]
    await supabase.from('subjects').insert(seedSubjects)
    const { data: newSubs } = await supabase.from('subjects').select('*').eq('school_id', schoolId).order('name')
    if (newSubs) subjects = newSubs
  } else {
    let hasChanges = false

    // Vérifier et nettoyer les doublons d'Étude de texte
    const allEtudes = subjects.filter(s => {
      const n = (s.name || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim()
      return n === 'etude de texte' || n.includes('etude de texte') || n.includes('etude texte')
    })

    if (allEtudes.length > 1) {
      const dupes = allEtudes.slice(1).map(e => e.id)
      await supabase.from('subjects').delete().in('id', dupes)
      hasChanges = true
    } else if (allEtudes.length === 0) {
      await supabase.from('subjects').insert({
        school_id: schoolId,
        name: 'Étude de texte',
        cycle: 'primaire',
        category: 'Français',
        coefficient: 1,
      })
      hasChanges = true
    }

    // Vérifier si Philosophie est présente
    const hasPhilo = subjects.some(s => (s.name || '').toLowerCase().includes('philo'))
    if (!hasPhilo) {
      await supabase.from('subjects').insert({
        school_id: schoolId,
        name: 'Philosophie',
        cycle: 'secondaire',
        coefficient: 2,
      })
      hasChanges = true
    }

    if (hasChanges) {
      const { data: updatedSubs } = await supabase.from('subjects').select('*').eq('school_id', schoolId).order('name')
      if (updatedSubs) subjects = updatedSubs
    }
  }

  return (
    <MatieresManager subjects={subjects || []} />
  )
}
