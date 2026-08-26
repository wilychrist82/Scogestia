import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function EnseignantDashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: roleData } = await supabase
    .from('user_school_roles')
    .select('school_id')
    .eq('user_id', user.id)
    .eq('role', 'enseignant')
    .limit(1).maybeSingle()

  if (!roleData) redirect('/')

  // Récupérer les classes/matières assignées
  const { data: assignments } = await supabase
    .from('teacher_class_subjects')
    .select(`
      id,
      subject_name,
      class_id,
      classes (
        name
      )
    `)
    .eq('teacher_id', user.id)

  // Récupérer les annonces pour l'enseignant (RLS filtre pour lui)
  const { data: communications } = await supabase
    .from('communications')
    .select('*')
    .eq('school_id', roleData.school_id)
    .order('created_at', { ascending: false })
    .limit(3)

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-[var(--color-surface)]">
      <div className="max-w-[1280px] mx-auto space-y-6">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[var(--color-surface-container-lowest)] p-6 rounded-xl border border-[var(--color-outline-variant)]">
          <div>
            <div className="flex items-center gap-2 text-[var(--color-on-surface-variant)] mb-2">
              <span className="text-sm font-semibold text-[var(--color-on-surface)]">Tableau de bord</span>
            </div>
            <h2 className="text-3xl font-bold text-[var(--color-on-surface)]">Espace Enseignant</h2>
            <p className="text-base text-[var(--color-on-surface-variant)] mt-1">Gérez vos classes, saisissez vos notes et suivez l'assiduité.</p>
          </div>
        </div>

        {/* Annonces Récentes */}
        {communications && communications.length > 0 && (
          <div className="bg-[var(--color-surface-container-lowest)] p-6 rounded-xl border border-[var(--color-outline-variant)] shadow-sm">
            <h2 className="text-lg font-bold text-[var(--color-on-surface)] flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-[var(--color-primary)]">campaign</span>
              Annonces Récentes
            </h2>
            <div className="space-y-4">
              {communications.map(comm => (
                <div key={comm.id} className="border-l-4 border-[var(--color-primary)] pl-4 py-1">
                  <h3 className="font-semibold text-[var(--color-on-surface)]">{comm.subject}</h3>
                  <p className="text-sm text-[var(--color-on-surface-variant)] mt-1 whitespace-pre-wrap">{comm.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <h3 className="font-bold text-xl text-[var(--color-on-surface)] mt-8 mb-4">Mes Classes Assignées</h3>

        {(!assignments || assignments.length === 0) ? (
          <div className="bg-[var(--color-surface-container-lowest)] p-8 rounded-xl border border-[var(--color-outline-variant)] text-center text-[var(--color-on-surface-variant)]">
            Aucune classe ne vous a été assignée pour le moment.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assignments.map((assignment: any) => (
              <div key={assignment.id} className="bg-[var(--color-surface-container-lowest)] p-6 rounded-xl border border-[var(--color-outline-variant)] shadow-sm hover:shadow-md transition-shadow flex flex-col">
                <div className="flex items-center gap-3 mb-6 flex-1">
                  <div className="w-12 h-12 rounded-full bg-[#e8f0fe] text-[#1a73e8] flex items-center justify-center">
                    <span className="material-symbols-outlined text-2xl">school</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-[var(--color-on-surface)]">{assignment.classes?.name}</h3>
                    <p className="text-sm text-[var(--color-on-surface-variant)] font-medium">{assignment.subject_name}</p>
                  </div>
                </div>
                
                <div className="flex flex-col gap-2 mt-auto">
                  <Link 
                    href={`/enseignant/notes?classId=${assignment.class_id}&subject=${encodeURIComponent(assignment.subject_name)}`}
                    className="flex-1 text-center bg-[var(--color-primary)] text-white py-2.5 px-4 rounded-lg font-semibold hover:opacity-90 transition-opacity"
                  >
                    Saisir les notes
                  </Link>
                  <Link 
                    href={`/enseignant/presences?classId=${assignment.class_id}`}
                    className="flex-1 text-center bg-white text-[var(--color-on-surface)] py-2.5 px-4 rounded-lg font-semibold border border-[var(--color-outline-variant)] hover:bg-gray-50 transition-colors"
                  >
                    Faire l'appel
                  </Link>
                  <Link 
                    href={`/enseignant/devoirs?classId=${assignment.class_id}`}
                    className="flex-1 text-center bg-white text-[var(--color-on-surface)] py-2.5 px-4 rounded-lg font-semibold border border-[var(--color-outline-variant)] hover:bg-gray-50 transition-colors"
                  >
                    Cahier de texte
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
