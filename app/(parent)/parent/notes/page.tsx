import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChildSelector } from '@/components/parent/ChildSelector'
import { resolveStudentId } from '@/lib/parent-utils'

type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function ParentNotesPage({ searchParams }: PageProps) {
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

  // 3. Récupérer les notes (on simule le trimestre "Trimestre 1" pour l'instant ou on prend le plus récent)
  const targetTerm = "Trimestre 1"

  const [
    { data: termSummary },
    { data: grades }
  ] = await Promise.all([
    supabase
      .from('student_term_summary')
      .select('*')
      .eq('student_id', selectedChildId)
      .eq('term', targetTerm)
      .single(),
    supabase
      .from('grades')
      .select('*')
      .eq('student_id', selectedChildId)
      .eq('term', targetTerm)
      .order('subject_name', { ascending: true })
  ])

  // Grouper les notes par matière pour calculer la moyenne de la matière (simplifié)
  const subjectsMap: Record<string, { totalScore: number; maxScore: number; count: number; icon: string }> = {}
  
  if (grades) {
    grades.forEach(g => {
      if (!subjectsMap[g.subject_name]) {
        let icon = 'menu_book'
        if (g.subject_name.toLowerCase().includes('math')) icon = 'calculate'
        if (g.subject_name.toLowerCase().includes('science') || g.subject_name.toLowerCase().includes('phys')) icon = 'science'
        if (g.subject_name.toLowerCase().includes('hist')) icon = 'public'
        
        subjectsMap[g.subject_name] = { totalScore: 0, maxScore: 20, count: 0, icon }
      }
      
      // On ramène tout sur 20 pour la moyenne matière
      const normalizedScore = (g.score / g.max_score) * 20
      subjectsMap[g.subject_name].totalScore += normalizedScore
      subjectsMap[g.subject_name].count += 1
    })
  }

  const subjects = Object.keys(subjectsMap).map(name => {
    const s = subjectsMap[name]
    return {
      name,
      average: s.count > 0 ? (s.totalScore / s.count).toFixed(1) : '-',
      icon: s.icon
    }
  })

  return (
    <div className="flex flex-col min-h-screen bg-[var(--color-surface)] text-[var(--color-on-surface)] pb-[80px]">
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

      <main className="flex-1 w-full max-w-7xl mx-auto">
        {/* Header Section: Moyenne Générale */}
        <section className="bg-[var(--color-primary)] text-[var(--color-on-primary)] px-4 py-8 rounded-b-[24px] shadow-sm relative overflow-hidden">
          <div className="relative z-10 flex flex-col items-center justify-center text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-[var(--color-primary-fixed-dim)] mb-1">Moyenne Générale</p>
            <div className="text-5xl font-bold text-[var(--color-on-primary)]">
              {termSummary?.term_average || '-'}
              <span className="text-2xl font-bold text-[var(--color-primary-fixed-dim)]">/20</span>
            </div>
            <p className="text-base text-[var(--color-inverse-primary)] mt-2">
              {targetTerm} - {termSummary ? `Rang: ${termSummary.class_rank}` : 'Pas de données'}
            </p>
          </div>
          
          <div className="absolute top-[-20px] right-[-20px] w-32 h-32 bg-[var(--color-primary-container)] rounded-full opacity-50 blur-xl"></div>
          <div className="absolute bottom-[-40px] left-[-20px] w-40 h-40 bg-[var(--color-surface-tint)] rounded-full opacity-30 blur-2xl"></div>
        </section>

        {/* Sélecteur de Trimestre (statique pour l'instant) */}
        <section className="px-4 py-4 mt-2">
          <div className="flex bg-[var(--color-surface-container-low)] rounded-lg p-1 w-full shadow-sm border border-[var(--color-outline-variant)]">
            <button className="flex-1 py-2 px-3 text-center rounded-md text-sm bg-white shadow-sm border border-[var(--color-outline-variant)] text-[var(--color-primary)] font-bold transition-colors">
              Trimestre 1
            </button>
            <button className="flex-1 py-2 px-3 text-center rounded-md text-sm text-[var(--color-secondary)] hover:bg-[var(--color-surface-container)] transition-colors opacity-50 cursor-not-allowed">
              Trimestre 2
            </button>
            <button className="flex-1 py-2 px-3 text-center rounded-md text-sm text-[var(--color-secondary)] hover:bg-[var(--color-surface-container)] transition-colors opacity-50 cursor-not-allowed">
              Trimestre 3
            </button>
          </div>
        </section>

        {/* Liste des Matières */}
        <section className="px-4 pb-8 flex flex-col gap-4">
          <h2 className="text-xl font-bold text-[var(--color-on-surface)] mb-1 mt-2">Détail par Matière</h2>
          
          {subjects.length === 0 ? (
            <p className="text-[var(--color-on-surface-variant)] text-center py-8">Aucune note enregistrée pour ce trimestre.</p>
          ) : (
            subjects.map(subj => {
              const scoreNum = parseFloat(subj.average)
              const percentage = isNaN(scoreNum) ? 0 : (scoreNum / 20) * 100
              
              return (
                <div key={subj.name} className="bg-white border border-[var(--color-outline-variant)] rounded-xl p-4 flex flex-col gap-2">
                  <div className="flex justify-between items-center w-full">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-lg bg-[var(--color-surface-container-high)] text-[var(--color-primary)] flex items-center justify-center">
                        <span className="material-symbols-outlined">{subj.icon}</span>
                      </div>
                      <h3 className="font-semibold text-sm text-[var(--color-on-surface)]">{subj.name}</h3>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-bold text-[var(--color-primary)]">{subj.average}</span>
                      <span className="text-xs font-semibold text-[var(--color-secondary)]">/20</span>
                    </div>
                  </div>
                  <div className="w-full bg-[var(--color-surface-container)] rounded-full h-1.5 overflow-hidden">
                    <div className="bg-[var(--color-primary)] h-1.5 rounded-full" style={{ width: `${percentage}%` }}></div>
                  </div>
                </div>
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
        <div className="flex flex-col items-center justify-center bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] rounded-full px-4 py-1 w-20 opacity-80 touch-none">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>grade</span>
          <span className="text-xs font-bold mt-1">Grades</span>
        </div>
        <Link href="/parent/devoirs" className="flex flex-col items-center justify-center text-[var(--color-on-surface-variant)] p-2 w-16 group hover:bg-[var(--color-surface-container-highest)] rounded-lg transition-colors">
          <span className="material-symbols-outlined group-hover:text-[var(--color-primary)] transition-colors">menu_book</span>
          <span className="text-xs font-semibold mt-1">Homework</span>
        </Link>
      </nav>
    </div>
  )
}
