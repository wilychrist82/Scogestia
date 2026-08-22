import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function ParentDevoirsPage({
  searchParams,
}: {
  searchParams: { child?: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/connexion')

  const childId = searchParams.child

  if (!childId) {
    return (
      <div className="p-6 text-center flex flex-col items-center justify-center min-h-[70vh]">
        <span className="material-symbols-outlined text-5xl text-gray-300 mb-4">person_search</span>
        <h2 className="text-xl font-bold text-[var(--color-on-surface)] mb-2">Élève non spécifié</h2>
        <p className="text-[var(--color-on-surface-variant)] mb-6">Veuillez sélectionner un enfant depuis le tableau de bord pour voir ses devoirs.</p>
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

  if (!student || !student.class_id) {
    return (
      <div className="p-6 text-center">
        <p>Informations de l'élève introuvables ou classe non assignée.</p>
      </div>
    )
  }

  // Récupérer les devoirs de la classe
  const { data: allHomeworks } = await supabase
    .from('homework')
    .select('*')
    .eq('class_id', student.class_id)
    .order('due_date', { ascending: true })

  // Filtrer les devoirs (Ciblage)
  const homeworks = allHomeworks?.filter((hw: any) => {
    // Si la cible est vide/nulle, c'est pour toute la classe
    if (!hw.target_students || hw.target_students.length === 0) return true;
    // Sinon, vérifier si l'enfant est dans la liste
    return hw.target_students.includes(childId);
  }) || [];

  const now = new Date();
  const upcomingHomeworks = homeworks.filter(hw => new Date(hw.due_date) >= now);
  const pastHomeworks = homeworks.filter(hw => new Date(hw.due_date) < now);

  return (
    <div className="p-4 space-y-6 pb-20">
      <div className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-sm border border-[var(--color-outline-variant)]">
        <Link href="/parent" className="text-[var(--color-on-surface-variant)]">
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-[var(--color-on-surface)]">Devoirs</h1>
          <p className="text-sm text-[var(--color-primary)] font-medium">
            {student.first_name} {student.last_name} • {(student.classes as any)?.name}
          </p>
        </div>
      </div>

      {homeworks.length === 0 ? (
        <div className="bg-white p-8 rounded-xl shadow-sm border border-[var(--color-outline-variant)] text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-[#e8f0fe] rounded-full flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-[32px] text-[#1a73e8]">check_circle</span>
          </div>
          <h2 className="text-lg font-bold text-[var(--color-on-surface)] mb-1">Aucun devoir</h2>
          <p className="text-[var(--color-on-surface-variant)] text-sm">Votre enfant n'a aucun devoir pour le moment.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {upcomingHomeworks.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-on-surface-variant)] pl-1">À faire</h2>
              <div className="space-y-3">
                {upcomingHomeworks.map(hw => (
                  <HomeworkCard key={hw.id} hw={hw} />
                ))}
              </div>
            </div>
          )}

          {pastHomeworks.length > 0 && (
            <div className="space-y-3 opacity-75">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-on-surface-variant)] pl-1">Passés</h2>
              <div className="space-y-3">
                {pastHomeworks.map(hw => (
                  <HomeworkCard key={hw.id} hw={hw} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function HomeworkCard({ hw }: { hw: any }) {
  const isPast = new Date(hw.due_date) < new Date();
  
  return (
    <div className={`bg-white rounded-xl p-4 shadow-sm border border-[var(--color-outline-variant)] ${isPast ? 'bg-gray-50' : ''}`}>
      <div className="flex justify-between items-start mb-2">
        <span className="px-2 py-1 bg-[#e8f0fe] text-[#1a73e8] text-xs font-bold rounded uppercase tracking-wide">
          {hw.subject_name}
        </span>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${isPast ? 'bg-gray-100 text-gray-500 border-gray-200' : 'bg-[#fff8e1] text-[#f57f17] border-[#ffe082]'}`}>
          {isPast ? 'Terminé' : `Pour le ${new Date(hw.due_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`}
        </span>
      </div>
      <h3 className="font-bold text-[var(--color-on-surface)] text-lg mb-2 leading-tight">{hw.title}</h3>
      {hw.description && (
        <p className="text-sm text-[var(--color-on-surface-variant)] mb-4 bg-[var(--color-surface)] p-3 rounded-lg border border-[var(--color-outline-variant)]">
          {hw.description}
        </p>
      )}
      
      {hw.attachment_url && (
        <a 
          href={hw.attachment_url.startsWith('http') ? hw.attachment_url : `https://mxttnddswkntrryshqzl.supabase.co/storage/v1/object/public/homework-attachments/${hw.attachment_url}`}
          target="_blank" 
          rel="noreferrer" 
          className="flex items-center justify-center gap-2 w-full py-2.5 mt-2 bg-gradient-to-r from-[#e8f0fe] to-[#f3e8fd] text-[var(--color-primary)] rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          <span className="material-symbols-outlined text-[18px]">download</span>
          Ouvrir la pièce jointe
        </a>
      )}
    </div>
  )
}
