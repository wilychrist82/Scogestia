import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function ParentPresencesPage({
  searchParams,
}: {
  searchParams: Promise<{ child?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/connexion')

  const resolvedSearchParams = await searchParams;
  const childId = resolvedSearchParams.child

  if (!childId) {
    return (
      <div className="p-6 text-center flex flex-col items-center justify-center min-h-[70vh]">
        <span className="material-symbols-outlined text-5xl text-gray-300 mb-4">person_search</span>
        <h2 className="text-xl font-bold text-[var(--color-on-surface)] mb-2">Élève non spécifié</h2>
        <p className="text-[var(--color-on-surface-variant)] mb-6">Veuillez sélectionner un enfant depuis le tableau de bord pour voir ses présences.</p>
        <Link href="/parent" className="bg-[var(--color-primary)] text-white px-6 py-2 rounded-full font-semibold">
          Retour à l'accueil
        </Link>
      </div>
    )
  }

  // Vérifier le lien parent-enfant
  const { data: link } = await supabase
    .from('parent_student_links')
    .select('student_id')
    .eq('parent_user_id', user.id)
    .eq('student_id', childId)
    .single()

  if (!link) {
    return (
      <div className="p-6 text-center flex flex-col items-center justify-center min-h-[70vh]">
        <span className="material-symbols-outlined text-5xl text-red-300 mb-4">error</span>
        <h2 className="text-xl font-bold text-red-600 mb-2">Accès refusé</h2>
        <p className="text-[var(--color-on-surface-variant)] mb-6">Vous n'avez pas l'autorisation de voir les informations de cet élève.</p>
        <Link href="/parent" className="bg-[var(--color-primary)] text-white px-6 py-2 rounded-full font-semibold">
          Retour à l'accueil
        </Link>
      </div>
    )
  }

  // Récupérer les informations de l'élève
  const { data: student } = await supabase
    .from('students')
    .select('first_name, last_name, class_id, classes(name)')
    .eq('id', childId)
    .single()

  if (!student) {
    return (
      <div className="p-6 text-center">
        <p>Informations de l'élève introuvables.</p>
      </div>
    )
  }

  // Récupérer les présences de l'élève
  const { data: attendances } = await supabase
    .from('attendance')
    .select('*')
    .eq('student_id', childId)
    .order('date', { ascending: false })

  const absences = (attendances || []).filter(a => a.status === 'absent')
  const retards = (attendances || []).filter(a => a.status === 'retard')

  return (
    <div className="p-4 space-y-6 pb-20">
      <div className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-sm border border-[var(--color-outline-variant)]">
        <Link href="/parent" className="text-[var(--color-on-surface-variant)]">
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-[var(--color-on-surface)]">Assiduité</h1>
          <p className="text-sm text-[var(--color-primary)] font-medium">
            {student.first_name} {student.last_name} • {(student.classes as any)?.name}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex flex-col items-center justify-center text-center">
          <span className="material-symbols-outlined text-red-500 text-3xl mb-1">event_busy</span>
          <span className="text-2xl font-bold text-red-600">{absences.length}</span>
          <span className="text-xs text-red-800 font-medium uppercase tracking-wide">Absences</span>
        </div>
        <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 flex flex-col items-center justify-center text-center">
          <span className="material-symbols-outlined text-orange-500 text-3xl mb-1">schedule</span>
          <span className="text-2xl font-bold text-orange-600">{retards.length}</span>
          <span className="text-xs text-orange-800 font-medium uppercase tracking-wide">Retards</span>
        </div>
      </div>

      {!attendances || attendances.length === 0 ? (
        <div className="bg-white p-8 rounded-xl shadow-sm border border-[var(--color-outline-variant)] text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-[#e8f5e9] rounded-full flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-[32px] text-[#2e7d32]">check_circle</span>
          </div>
          <h2 className="text-lg font-bold text-[var(--color-on-surface)] mb-1">Excellente assiduité</h2>
          <p className="text-[var(--color-on-surface-variant)] text-sm">Aucune absence ou retard n'a été enregistré.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-[var(--color-outline-variant)] overflow-hidden">
          <div className="bg-[var(--color-surface)] px-4 py-3 border-b border-[var(--color-outline-variant)] font-bold text-[var(--color-on-surface)]">
            Historique
          </div>
          <div className="divide-y divide-[var(--color-outline-variant)]">
            {attendances.map((record: any) => {
              const isAbsent = record.status === 'absent';
              return (
                <div key={record.id} className="p-4 flex items-start gap-4 hover:bg-gray-50 transition-colors">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isAbsent ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                    <span className="material-symbols-outlined">
                      {isAbsent ? 'event_busy' : 'schedule'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-[var(--color-on-surface)] capitalize">
                      {record.status}
                    </h3>
                    <p className="text-sm text-[var(--color-on-surface-variant)] flex items-center gap-1 mt-1">
                      <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                      {new Date(record.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                    {record.justification && (
                      <div className="mt-2 text-sm bg-gray-100 p-2 rounded text-gray-700 italic border-l-2 border-gray-300">
                        "{record.justification}"
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  )
}
