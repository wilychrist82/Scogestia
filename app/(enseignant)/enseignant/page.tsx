import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function EnseignantDashboard() {
  const supabase = await createClient()

  // 1. Authentification
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  // 2. Vérification: L'enseignant a-t-il un rôle ?
  const { data: roleData } = await supabase
    .from('user_school_roles')
    .select('school_id')
    .eq('user_id', user.id)
    .eq('role', 'enseignant')
    .single()

  if (!roleData) redirect('/')

  // 3. Récupérer les classes/matières assignées
  const { data: assignments } = await supabase
    .from('teacher_class_subjects')
    .select(`
      id,
      subject_name,
      class:classes (
        id,
        name,
        level,
        academic_year
      )
    `)
    .eq('teacher_id', user.id)

  const currentTerm = "Trimestre 1" // Dans la vraie vie, cela devrait être dynamique selon les paramètres de l'école

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8 text-[var(--color-on-background)]">Espace Enseignant</h1>
      
      <h2 className="text-xl font-semibold mb-4 text-[var(--color-on-surface)]">Mes Classes et Matières</h2>
      
      {(!assignments || assignments.length === 0) ? (
        <div className="bg-[var(--color-surface-container-lowest)] p-8 rounded-xl border border-[var(--color-outline-variant)] text-center text-[var(--color-on-surface-variant)]">
          Aucune classe ne vous a été assignée pour le moment.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assignments.map((assignment: any) => (
            <div key={assignment.id} className="bg-[var(--color-surface-container-lowest)] p-6 rounded-xl border border-[var(--color-outline-variant)] shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-[var(--color-secondary-container)] flex items-center justify-center text-[var(--color-on-secondary-container)]">
                  <span className="material-symbols-outlined text-2xl">school</span>
                </div>
                <div>
                  <h3 className="font-bold text-lg text-[var(--color-on-surface)]">{assignment.class.name}</h3>
                  <p className="text-sm text-[var(--color-on-surface-variant)]">{assignment.subject_name}</p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <Link 
                  href={`/enseignant/notes/${assignment.class.id}/${encodeURIComponent(assignment.subject_name)}/${encodeURIComponent(currentTerm)}`}
                  className="flex-1 text-center bg-[var(--color-primary)] text-white py-2 px-4 rounded-lg font-medium hover:bg-[var(--color-primary-container)] transition-colors"
                >
                  Saisir les notes
                </Link>
                <Link 
                  href={`/enseignant/presence/${assignment.class.id}`}
                  className="flex-1 text-center bg-[var(--color-surface-container-high)] text-[var(--color-on-surface)] py-2 px-4 rounded-lg font-medium border border-[var(--color-outline-variant)] hover:bg-[var(--color-surface-container-highest)] transition-colors"
                >
                  Faire l'appel
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
