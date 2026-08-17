import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChildSelector } from '@/components/parent/ChildSelector'
import { resolveStudentId } from '@/lib/parent-utils'

type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function ParentBulletinsPage({ searchParams }: PageProps) {
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

  // 3. Récupérer les trimestres finalisés pour cet enfant
  const { data: terms } = await supabase
    .from('student_term_summary')
    .select('term')
    .eq('student_id', selectedChildId)
    .order('term', { ascending: true })

  const availableTermsSet = new Set(terms?.map(t => t.term) || [])

  // On affiche toujours 3 trimestres pour une année classique
  const allTerms = ['Trimestre 1', 'Trimestre 2', 'Trimestre 3']
  const currentYear = new Date().getFullYear()

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

      <main className="flex-grow flex flex-col w-full max-w-7xl mx-auto px-4 py-6 gap-6 pb-[80px]">
        <section>
          <h2 className="text-2xl font-bold text-[var(--color-on-surface)] mb-2">Bulletins Trimestriels</h2>
          <p className="text-sm text-[var(--color-on-surface-variant)] mb-4">Année Scolaire {currentYear - 1}/{currentYear}</p>
          
          <div className="flex flex-col gap-3">
            {allTerms.map((term) => {
              const isAvailable = availableTermsSet.has(term)

              if (isAvailable) {
                return (
                  <div key={term} className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-xl p-4 flex items-center justify-between shadow-sm">
                    <div className="flex flex-col">
                      <span className="font-semibold text-sm text-[var(--color-on-surface)]">Bulletin {term}</span>
                      <span className="text-xs text-[var(--color-on-surface-variant)] mt-1">Disponible</span>
                    </div>
                    <a 
                      href={`/api/bulletins/generate?student_id=${selectedChildId}&term=${term}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="h-12 px-4 bg-[var(--color-primary)] text-[var(--color-on-primary)] rounded-lg font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[var(--color-surface-tint)] transition-colors"
                    >
                      <span className="material-symbols-outlined">download</span>
                      PDF
                    </a>
                  </div>
                )
              } else {
                return (
                  <div key={term} className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-xl p-4 flex items-center justify-between shadow-sm opacity-70">
                    <div className="flex flex-col">
                      <span className="font-semibold text-sm text-[var(--color-on-surface)]">Bulletin {term}</span>
                      <span className="text-xs text-[var(--color-on-surface-variant)] mt-1">Bientôt disponible</span>
                    </div>
                    <button disabled className="h-12 px-4 border border-[var(--color-outline)] text-[var(--color-outline)] rounded-lg font-semibold text-sm flex items-center justify-center gap-2 cursor-not-allowed">
                      <span className="material-symbols-outlined">lock</span>
                      PDF
                    </button>
                  </div>
                )
              }
            })}
          </div>
        </section>

        <section className="mt-4">
          <h3 className="text-xs font-semibold text-[var(--color-on-surface-variant)] mb-3 uppercase tracking-wider">Archives ({currentYear - 2}/{currentYear - 1})</h3>
          <div className="flex flex-col gap-3">
            <div className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-xl p-4 flex items-center justify-between shadow-sm">
              <div className="flex flex-col">
                <span className="font-semibold text-sm text-[var(--color-on-surface)]">Bulletin Annuel</span>
                <span className="text-xs text-[var(--color-on-surface-variant)] mt-1">Année complète</span>
              </div>
              <button disabled className="h-12 px-4 border border-[var(--color-primary)] text-[var(--color-primary)] rounded-lg font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[var(--color-surface-container-low)] transition-colors opacity-50">
                <span className="material-symbols-outlined">download</span>
                PDF
              </button>
            </div>
          </div>
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
        <div className="flex flex-col items-center justify-center bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] rounded-full px-4 py-1 opacity-80 touch-none">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>picture_as_pdf</span>
          <span className="text-xs font-bold mt-1">Bulletins</span>
        </div>
      </nav>
    </div>
  )
}
