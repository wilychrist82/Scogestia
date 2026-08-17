import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChildSelector } from '@/components/parent/ChildSelector'
import { resolveStudentId } from '@/lib/parent-utils'

type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function ParentPresencesPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams
  const supabase = await createClient()

  // 1. Auth & Role
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: roleData } = await supabase
    .from('user_school_roles')
    .select('school_id, role')
    .eq('user_id', user.id)
    .eq('role', 'parent')
    .single()

  if (!roleData) redirect('/')

  // 2. Enfant sélectionné
  const { childrenList, selectedChild, selectedChildId } = await resolveStudentId(supabase, user.id, resolvedParams)

  if (childrenList.length === 0 || !selectedChild) {
    return <div className="p-8">Aucun enfant lié.</div>
  }

  // 3. Récupérer l'historique de présence (Absences et retards)
  const { data: history } = await supabase
    .from('attendance')
    .select('*')
    .eq('student_id', selectedChildId)
    .in('status', ['absent', 'absent_justifie', 'retard'])
    .order('date', { ascending: false })

  const totalAbsences = history?.filter(h => h.status.includes('absent')).length || 0
  const totalRetards = history?.filter(h => h.status === 'retard').length || 0

  return (
    <div className="flex flex-col min-h-screen bg-[var(--color-surface)] text-[var(--color-on-surface)]">
      {/* TopAppBar */}
      <header className="bg-[var(--color-surface)] border-b border-[var(--color-outline-variant)] sticky top-0 z-40 w-full">
        <div className="flex justify-between items-center px-4 h-16 w-full max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[var(--color-primary)]">school</span>
            <span className="font-bold text-lg text-[var(--color-primary)]">EduParent Togo</span>
          </div>
          <ChildSelector childrenList={childrenList} selectedId={selectedChildId} />
        </div>
      </header>

      <main className="flex-grow w-full max-w-7xl mx-auto px-4 py-6 pb-[80px] flex flex-col gap-6">
        {/* Header / Summary */}
        <section className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-[var(--color-on-surface)]">Historique de Présence</h1>
          <div className="bg-[var(--color-surface-container-low)] rounded-xl border border-[var(--color-outline-variant)] p-4 flex items-center justify-between shadow-sm">
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-[var(--color-secondary)]">Total Absences</span>
              <span className="text-xl font-bold text-[var(--color-error)]">{totalAbsences} Jours</span>
            </div>
            <div className="flex flex-col text-right">
              <span className="text-sm font-semibold text-[var(--color-secondary)]">Total Retards</span>
              <span className="text-xl font-bold text-[#8B5A2B]">{totalRetards} Fois</span>
            </div>
          </div>
        </section>

        {/* Chronological List */}
        <section className="flex flex-col gap-4">
          {!history || history.length === 0 ? (
            <p className="text-[var(--color-on-surface-variant)] text-center py-8">Aucune absence ni retard enregistré.</p>
          ) : (
            history.map((record) => {
              const isAbsent = record.status.includes('absent')
              const isJustified = record.status === 'absent_justifie'
              
              const dateObj = new Date(record.date)
              const formattedDate = dateObj.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
              
              const colorClass = isAbsent ? 'bg-[var(--color-error)]' : 'bg-[#8B5A2B]' // tertiary / orange fallback
              const badgeClass = isAbsent 
                ? 'bg-[var(--color-error-container)] text-[var(--color-on-error-container)]'
                : 'bg-[var(--color-surface-variant)] text-[var(--color-on-surface-variant)]'
              const icon = isAbsent ? 'cancel' : 'schedule'

              return (
                <article key={record.id} className="bg-white rounded-lg border border-[var(--color-outline-variant)] p-4 flex flex-col gap-2 relative overflow-hidden">
                  <div className={`absolute top-0 left-0 w-1 h-full ${colorClass}`}></div>
                  <div className="flex justify-between items-start pl-2">
                    <div className="flex flex-col">
                      <span className="font-semibold text-sm text-[var(--color-on-surface)]">{formattedDate}</span>
                      {/* On pourrait afficher la classe ou matière si pertinent, mais pas dispo dans 'attendance' basique */}
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full font-semibold text-xs ${badgeClass}`}>
                      <span className="material-symbols-outlined text-[16px]">{icon}</span>
                      {isAbsent ? 'Absent' : 'Retard'}
                    </span>
                  </div>
                  <div className="pl-2 mt-1">
                    <p className="text-sm font-medium text-[var(--color-on-surface-variant)] flex items-center gap-2">
                      <span className={`material-symbols-outlined text-[20px] ${isAbsent ? 'text-[var(--color-error)]' : 'text-[var(--color-primary)]'}`}>
                        {isAbsent ? (isJustified ? 'info' : 'warning') : 'timer'}
                      </span>
                      {isAbsent 
                        ? (isJustified ? `Justifié${record.reason ? ' : ' + record.reason : ''}` : 'Non Justifié')
                        : (record.reason || 'Heure non précisée')}
                    </p>
                  </div>
                </article>
              )
            })
          )}
        </section>
      </main>

      {/* BottomNavBar */}
      <nav className="fixed bottom-0 w-full z-50 flex justify-around items-center bg-[var(--color-surface)] px-2 py-2 border-t border-[var(--color-outline-variant)] pb-4 pt-2 md:hidden">
        <Link href="/parent" className="flex flex-col items-center justify-center text-[var(--color-on-surface-variant)] p-2 w-16 group hover:bg-[var(--color-surface-container-highest)] rounded-lg transition-colors">
          <span className="material-symbols-outlined group-hover:text-[var(--color-primary)] transition-colors">home</span>
          <span className="text-xs font-semibold mt-1">Home</span>
        </Link>
        <Link href="/parent/notes" className="flex flex-col items-center justify-center text-[var(--color-on-surface-variant)] p-2 w-16 group hover:bg-[var(--color-surface-container-highest)] rounded-lg transition-colors">
          <span className="material-symbols-outlined group-hover:text-[var(--color-primary)] transition-colors">grade</span>
          <span className="text-xs font-semibold mt-1">Grades</span>
        </Link>
        <Link href="/parent/devoirs" className="flex flex-col items-center justify-center text-[var(--color-on-surface-variant)] p-2 w-16 group hover:bg-[var(--color-surface-container-highest)] rounded-lg transition-colors">
          <span className="material-symbols-outlined group-hover:text-[var(--color-primary)] transition-colors">menu_book</span>
          <span className="text-xs font-semibold mt-1">Homework</span>
        </Link>
      </nav>
    </div>
  )
}
