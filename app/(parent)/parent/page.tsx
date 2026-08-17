import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChildSelector } from '@/components/parent/ChildSelector'
import { resolveStudentId } from '@/lib/parent-utils'

type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function ParentDashboard({ searchParams }: PageProps) {
  const resolvedParams = await searchParams

  const supabase = await createClient()

  // 1. Authentification
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  // 2. Vérification: Le parent a-t-il un rôle ?
  const { data: roleData } = await supabase
    .from('user_school_roles')
    .select('school_id, role')
    .eq('user_id', user.id)
    .eq('role', 'parent')
    .single()

  if (!roleData) redirect('/')

  // 3. Récupérer l'enfant sélectionné
  const { childrenList, selectedChild, selectedChildId } = await resolveStudentId(supabase, user.id, resolvedParams)

  if (childrenList.length === 0 || !selectedChild) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Bonjour, Parent</h1>
        <div className="bg-[var(--color-surface-container-lowest)] p-8 rounded-xl border border-[var(--color-outline-variant)]">
          Aucun enfant ne semble être lié à votre compte. Veuillez contacter l'administration.
        </div>
      </div>
    )
  }

  // 4. Récupérer toutes les données en parallèle pour l'enfant sélectionné
  const today = new Date().toISOString().split('T')[0]

  const [
    { data: payment },
    { data: attendance },
    { data: grades },
    { data: homeworks }
  ] = await Promise.all([
    // A. Dette / Échéance impayée la plus urgente
    supabase
      .from('payment_schedules')
      .select('id, amount, title, due_date, status')
      .eq('student_id', selectedChildId)
      .in('status', ['pending', 'en_retard'])
      .order('due_date', { ascending: true })
      .limit(1)
      .single(),
      
    // B. Présence du jour
    supabase
      .from('attendance')
      .select('status')
      .eq('student_id', selectedChildId)
      .eq('date', today)
      .single(),
      
    // C. Dernières notes
    supabase
      .from('grades')
      .select('subject_name, score, max_score')
      .eq('student_id', selectedChildId)
      .order('created_at', { ascending: false })
      .limit(3),
      
    // D. Prochains devoirs
    supabase
      .from('homework')
      .select('id, subject_name, title, due_date')
      .eq('class_id', selectedChild.class_id)
      .gte('due_date', today)
      .order('due_date', { ascending: true })
      .limit(2)
  ])

  return (
    <div className="flex flex-col min-h-screen bg-[var(--color-surface)] text-[var(--color-on-surface)]">
      {/* Header avec sélecteur */}
      <header className="bg-[var(--color-surface)] border-b border-[var(--color-outline-variant)] sticky top-0 z-40 w-full">
        <div className="flex justify-between items-center px-4 h-16 w-full max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[var(--color-primary)]">school</span>
            <span className="font-bold text-lg text-[var(--color-primary)]">EduParent Togo</span>
          </div>
          
          <ChildSelector childrenList={childrenList} selectedId={selectedChildId} />
        </div>
      </header>

      <main className="flex flex-col gap-6 p-4 max-w-7xl mx-auto w-full pb-24">
        {/* Welcome Message */}
        <div className="pt-2">
          <h1 className="text-3xl font-bold text-[var(--color-on-surface)]">Bonjour, Parent</h1>
          <p className="text-[var(--color-on-surface-variant)]">Voici le résumé pour {selectedChild.first_name} aujourd'hui.</p>
        </div>

        {/* Payment Alert Card (if any pending) */}
        {payment && (
          <section className="bg-[rgba(186,26,26,0.1)] border border-[rgba(186,26,26,0.2)] rounded-xl p-4">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-[var(--color-error-container)] rounded-full text-[var(--color-on-error-container)] flex-shrink-0">
                <span className="material-symbols-outlined">warning</span>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-[var(--color-on-surface)]">Paiement en attente</h2>
                <p className="text-lg text-[var(--color-error)] font-semibold mt-1">{payment.amount} FCFA</p>
                <p className="text-sm text-[var(--color-on-surface-variant)] mt-1">{payment.title}</p>
              </div>
            </div>
            <Link 
              href={`/parent/paiements/${payment.id}`}
              className="mt-4 w-full h-12 bg-[var(--color-primary)] text-white font-semibold rounded-lg flex justify-center items-center gap-2 hover:bg-[var(--color-primary-container)] transition-colors"
            >
              <span className="material-symbols-outlined">payments</span>
              Payer maintenant
            </Link>
          </section>
        )}

        {/* Attendance Summary */}
        <section className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-xl p-4 flex items-center justify-between border-l-4 border-l-[var(--color-primary)]">
          <div>
            <h3 className="text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Présence</h3>
            <p className="text-xl font-bold text-[var(--color-on-surface)] mt-1">
              {!attendance 
                ? "Non fait" 
                : attendance.status === 'present' 
                  ? "Présent aujourd'hui" 
                  : attendance.status === 'retard' 
                    ? "En retard aujourd'hui" 
                    : "Absent aujourd'hui"
              }
            </p>
          </div>
          {attendance?.status === 'present' && (
            <div className="h-12 w-12 bg-[var(--color-primary-container)] rounded-full flex items-center justify-center text-[var(--color-on-primary-container)]">
              <span className="material-symbols-outlined">check_circle</span>
            </div>
          )}
          {attendance?.status === 'absent' && (
            <div className="h-12 w-12 bg-[var(--color-error-container)] rounded-full flex items-center justify-center text-[var(--color-on-error-container)]">
              <span className="material-symbols-outlined">cancel</span>
            </div>
          )}
        </section>

        {/* Bento Grid for Grades and Homework */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Latest Grades */}
          <section className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-xl p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-[var(--color-on-surface)]">Dernières notes</h3>
              <Link href="/parent/notes" className="text-[var(--color-primary)] font-semibold text-sm hover:underline">Voir tout</Link>
            </div>
            
            <div className="flex flex-col gap-2">
              {(!grades || grades.length === 0) ? (
                <p className="text-sm text-[var(--color-on-surface-variant)]">Aucune note pour le moment.</p>
              ) : (
                grades.map((grade, idx) => (
                  <div key={idx} className="flex justify-between items-center py-2 border-b border-[var(--color-surface-container-highest)] last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[var(--color-secondary)]">grade</span>
                      <span className="text-base text-[var(--color-on-surface)]">{grade.subject_name}</span>
                    </div>
                    <span className="font-semibold text-sm bg-[var(--color-surface-container-high)] px-2 py-1 rounded text-[var(--color-on-surface)]">
                      {grade.score}/{grade.max_score}
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Upcoming Homework */}
          <section className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-xl p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-[var(--color-on-surface)]">Prochains devoirs</h3>
            </div>
            
            <div className="flex flex-col gap-2">
              {(!homeworks || homeworks.length === 0) ? (
                <p className="text-sm text-[var(--color-on-surface-variant)]">Aucun devoir à venir.</p>
              ) : (
                homeworks.map(hw => {
                  const dateObj = new Date(hw.due_date)
                  const formatted = dateObj.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' })
                  
                  return (
                    <div key={hw.id} className="flex items-start gap-4 p-2 bg-[var(--color-surface-bright)] border border-[var(--color-outline-variant)] rounded-lg">
                      <div className="bg-[var(--color-surface-variant)] p-2 rounded text-[var(--color-on-surface-variant)]">
                        <span className="material-symbols-outlined">assignment</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm text-[var(--color-on-surface)]">{hw.subject_name} - {hw.title}</h4>
                        <p className="text-xs text-[var(--color-error)] mt-1 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">event</span>
                          Pour {formatted}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
            <Link 
              href="/parent/agenda"
              className="mt-4 w-full h-12 border border-[var(--color-primary)] text-[var(--color-primary)] font-semibold rounded-lg flex justify-center items-center hover:bg-[var(--color-surface-container-low)] transition-colors"
            >
              Voir tout l'agenda
            </Link>
          </section>
          
        </div>
      </main>
    </div>
  )
}
