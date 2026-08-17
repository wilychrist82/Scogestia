import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChildSelector } from '@/components/parent/ChildSelector'
import { resolveStudentId } from '@/lib/parent-utils'

type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function ParentDevoirsPage({ searchParams }: PageProps) {
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

  // 3. Récupérer les devoirs (Homework)
  // On récupère tous les devoirs de la classe de l'élève
  const { data: homeworks } = await supabase
    .from('homework')
    .select('*')
    .eq('class_id', selectedChild.class_id)
    .order('due_date', { ascending: true })

  const today = new Date().toISOString().split('T')[0]

  // Séparation en À venir / Passés
  const upcoming = homeworks?.filter(h => h.due_date >= today) || []
  const past = homeworks?.filter(h => h.due_date < today) || []

  // Pour l'interface, on lit le paramètre d'URL "tab"
  const tab = resolvedParams.tab === 'passes' ? 'passes' : 'avenir'

  const displayedHomeworks = tab === 'avenir' ? upcoming : past

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

      <main className="flex-grow w-full max-w-7xl mx-auto px-4 pt-6 pb-[80px]">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[var(--color-on-surface)] mb-1">Devoirs</h1>
          <p className="text-[var(--color-on-surface-variant)] text-sm">Suivez le travail à la maison de {selectedChild.first_name}.</p>
        </div>

        {/* Filter / Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 hide-scrollbar">
          <Link 
            href={`/parent/devoirs?student_id=${selectedChildId}&tab=avenir`}
            className={`font-semibold text-sm px-4 py-2 rounded-full min-h-[40px] whitespace-nowrap transition-colors flex items-center justify-center ${
              tab === 'avenir' 
                ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)]' 
                : 'bg-[var(--color-surface)] border border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-low)]'
            }`}
          >
            À venir ({upcoming.length})
          </Link>
          <Link 
            href={`/parent/devoirs?student_id=${selectedChildId}&tab=passes`}
            className={`font-semibold text-sm px-4 py-2 rounded-full min-h-[40px] whitespace-nowrap transition-colors flex items-center justify-center ${
              tab === 'passes' 
                ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)]' 
                : 'bg-[var(--color-surface)] border border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-low)]'
            }`}
          >
            Passés ({past.length})
          </Link>
        </div>

        {/* Homework List */}
        <div className="flex flex-col gap-4">
          {displayedHomeworks.length === 0 ? (
            <p className="text-center text-[var(--color-on-surface-variant)] py-8">
              Aucun devoir dans cette catégorie.
            </p>
          ) : (
            displayedHomeworks.map(hw => {
              const dateObj = new Date(hw.due_date)
              const formattedDate = dateObj.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
              const isPast = hw.due_date < today

              // Assignation de couleur en fonction de la matière
              let subjectColorClass = 'bg-[var(--color-surface-container-high)] text-[var(--color-on-surface)]'
              if (hw.subject_name.toLowerCase().includes('math')) subjectColorClass = 'bg-[var(--color-secondary-container)] text-[var(--color-on-secondary-container)]'
              if (hw.subject_name.toLowerCase().includes('fran') || hw.subject_name.toLowerCase().includes('ang')) subjectColorClass = 'bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)]'
              if (hw.subject_name.toLowerCase().includes('hist')) subjectColorClass = 'bg-[var(--color-tertiary-container)] text-[var(--color-on-tertiary-container)]'

              return (
                <div key={hw.id} className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-lg p-4 shadow-sm flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className={`inline-block font-semibold text-xs px-2 py-1 rounded mb-1 ${subjectColorClass}`}>
                        {hw.subject_name}
                      </span>
                      <h2 className="text-lg font-bold text-[var(--color-on-surface)]">{hw.title}</h2>
                    </div>
                    <div className={`${isPast ? 'bg-[var(--color-surface-variant)] text-[var(--color-on-surface-variant)]' : 'bg-[var(--color-error-container)] text-[var(--color-error)]'} font-semibold text-xs px-2 py-1 rounded flex items-center gap-1`}>
                      <span className="material-symbols-outlined text-[16px]">{isPast ? 'event' : 'schedule'}</span>
                      <span>{isPast ? `Passé (${formattedDate})` : `Pour le ${formattedDate}`}</span>
                    </div>
                  </div>
                  
                  {hw.description && (
                    <p className="text-sm text-[var(--color-on-surface-variant)]">
                      {hw.description}
                    </p>
                  )}
                  
                  {hw.attachment_url ? (
                    <div className="flex items-center gap-2 mt-2">
                      <a 
                        href={hw.attachment_url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 bg-[var(--color-surface)] border border-[var(--color-primary)] text-[var(--color-primary)] font-semibold text-sm h-12 rounded-lg hover:bg-[var(--color-surface-container-low)] transition-colors"
                      >
                        <span className="material-symbols-outlined">download</span>
                        Télécharger la pièce jointe
                      </a>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 mt-2">
                      <button disabled className="flex-1 flex items-center justify-center gap-2 bg-[var(--color-surface)] border border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] font-semibold text-sm h-12 rounded-lg opacity-50 cursor-not-allowed">
                        <span className="material-symbols-outlined">description</span>
                        Aucune pièce jointe
                      </button>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
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
        <div className="flex flex-col items-center justify-center bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] rounded-full px-4 py-1 opacity-80 touch-none">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>menu_book</span>
          <span className="text-xs font-bold mt-1">Homework</span>
        </div>
      </nav>

      <style dangerouslySetInnerHTML={{ __html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  )
}
