import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: roleData } = await supabase
    .from('user_school_roles')
    .select('school_id, full_name, role')
    .eq('user_id', user.id)
    .single()

  if (!roleData?.school_id) {
    return <div className="p-8 text-[var(--color-status-retard-text)]">École introuvable.</div>
  }

  const schoolId = roleData.school_id

  // Fetch some stats
  const { count: studentsCount } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true })
    .eq('school_id', schoolId)

  const { count: classesCount } = await supabase
    .from('classes')
    .select('*', { count: 'exact', head: true })
    .eq('school_id', schoolId)

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-[var(--color-on-surface)]">Tableau de bord</h1>
        <p className="text-[var(--color-on-surface-variant)]">
          Bienvenue, {roleData.full_name}. Voici le résumé de votre établissement.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Card 1 */}
        <div className="bg-[var(--color-surface-container)] rounded-2xl p-6 border border-[var(--color-outline-variant)] shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#dce9ff] flex items-center justify-center text-[var(--color-primary)]">
              <span className="material-symbols-outlined text-2xl">group</span>
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--color-on-surface-variant)]">Total Élèves</p>
              <h3 className="text-2xl font-bold text-[var(--color-on-surface)]">{studentsCount || 0}</h3>
            </div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-[var(--color-surface-container)] rounded-2xl p-6 border border-[var(--color-outline-variant)] shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#d1fae5] flex items-center justify-center text-[#065f46]">
              <span className="material-symbols-outlined text-2xl">school</span>
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--color-on-surface-variant)]">Classes Actives</p>
              <h3 className="text-2xl font-bold text-[var(--color-on-surface)]">{classesCount || 0}</h3>
            </div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-[var(--color-surface-container)] rounded-2xl p-6 border border-[var(--color-outline-variant)] shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#ffedd5] flex items-center justify-center text-[#9a3412]">
              <span className="material-symbols-outlined text-2xl">badge</span>
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--color-on-surface-variant)]">Personnel</p>
              <h3 className="text-2xl font-bold text-[var(--color-on-surface)]">--</h3>
            </div>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-[var(--color-surface-container)] rounded-2xl p-6 border border-[var(--color-outline-variant)] shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#fee2e2] flex items-center justify-center text-[#b91c1c]">
              <span className="material-symbols-outlined text-2xl">payments</span>
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--color-on-surface-variant)]">Paiements (Mois)</p>
              <h3 className="text-2xl font-bold text-[var(--color-on-surface)]">--</h3>
            </div>
          </div>
        </div>

      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-xl font-bold text-[var(--color-on-surface)] mb-4">Actions Rapides</h2>
        <div className="flex flex-wrap gap-4">
          <a href="/admin/eleves" className="flex items-center gap-2 bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition-colors">
            <span className="material-symbols-outlined">person_add</span>
            Inscrire un élève
          </a>
          <a href="/admin/classes" className="flex items-center gap-2 bg-[var(--color-surface-container-high)] text-[var(--color-on-surface)] border border-[var(--color-outline-variant)] px-4 py-2 rounded-lg hover:bg-[var(--color-surface-variant)] transition-colors">
            <span className="material-symbols-outlined">class</span>
            Gérer les classes
          </a>
        </div>
      </div>
    </div>
  )
}
