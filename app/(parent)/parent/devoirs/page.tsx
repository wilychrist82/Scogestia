import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

import { resolveStudentId } from '@/lib/parent-utils'
import { HomeworkList } from '@/components/parent/HomeworkList'

export const dynamic = 'force-dynamic'

export default async function ParentDevoirsPage({
  searchParams,
}: {
  searchParams: Promise<{ child?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/connexion')

  const resolvedSearchParams = await searchParams;
  const { childrenList, selectedChild, selectedChildId } = await resolveStudentId(supabase, user.id, resolvedSearchParams)

  if (!selectedChildId) {
    return (
      <div className="p-6 text-center flex flex-col items-center justify-center min-h-[70vh]">
        <span className="material-symbols-outlined text-5xl text-gray-300 mb-4">person_search</span>
        <h2 className="text-xl font-bold text-[var(--color-on-surface)] mb-2">Aucun élève lié</h2>
        <p className="text-[var(--color-on-surface-variant)] mb-6">Vous n'avez aucun enfant lié à votre compte.</p>
        <Link href="/parent" className="bg-[var(--color-primary)] text-white px-6 py-2 rounded-full font-semibold">
          Retour à l'accueil
        </Link>
      </div>
    )
  }

  const childId = selectedChildId

  // Si on veut être sûr que le student complet existe (pour classes, etc.)
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

  // Récupérer les devoirs de la classe
  const { data: allHomeworks } = await supabase
    .from('homework')
    .select('*')
    .eq('class_id', student.class_id)
    .order('due_date', { ascending: true })

  // Filtrer les devoirs (Ciblage)
  const homeworks = allHomeworks?.filter((hw: any) => {
    let targets = hw.target_students;
    if (!targets) return true; // Toute la classe
    
    // Si la bdd renvoie une chaîne au lieu d'un tableau (Postgres array string)
    if (typeof targets === 'string') {
      try {
        targets = JSON.parse(targets);
      } catch {
        targets = targets.replace(/[{}"']/g, '').split(',').map((s: string) => s.trim());
      }
    }
    
    if (Array.isArray(targets)) {
      if (targets.length === 0) return true;
      return targets.includes(childId);
    }
    
    return true; // Fallback
  }) || [];

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Comparer uniquement la date

  const upcomingHomeworks = homeworks.filter(hw => {
    const dueDate = new Date(hw.due_date);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate >= today;
  });
  
  const pastHomeworks = homeworks.filter(hw => {
    const dueDate = new Date(hw.due_date);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today;
  });

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
            <HomeworkList homeworks={upcomingHomeworks} title="À faire" />
          )}

          {pastHomeworks.length > 0 && (
            <HomeworkList homeworks={pastHomeworks} title="Passés" isPast={true} />
          )}
        </div>
      )}
    </div>
  )
}

