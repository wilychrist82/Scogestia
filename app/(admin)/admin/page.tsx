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
    
  const { count: staffCount } = await supabase
    .from('user_school_roles')
    .select('*', { count: 'exact', head: true })
    .eq('school_id', schoolId)
    .in('role', ['admin', 'comptable', 'enseignant'])

  return (
    <div className="flex-1 p-4 md:p-6 lg:p-8 min-h-screen max-w-[1280px] mx-auto w-full">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-[var(--color-on-surface)]">Tableau de bord</h2>
        <p className="text-base text-[var(--color-on-surface-variant)] mt-1">Vue d'ensemble de l'établissement</p>
      </div>

      {/* Summary Cards (Bento style grid) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        <div className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-xl p-4 md:p-6 flex flex-col justify-between h-32 hover:border-[var(--color-primary)] transition-colors shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-sm font-semibold text-[var(--color-on-surface-variant)]">Nombre d'élèves</span>
            <div className="p-2 bg-[var(--color-surface-container-low)] rounded-lg text-[var(--color-primary)]">
              <span className="material-symbols-outlined text-[20px]" data-icon="school">school</span>
            </div>
          </div>
          <div>
            <span className="text-3xl font-bold text-[var(--color-on-surface)]">{studentsCount || 0}</span>
          </div>
        </div>

        <div className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-xl p-4 md:p-6 flex flex-col justify-between h-32 hover:border-[var(--color-primary)] transition-colors shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-sm font-semibold text-[var(--color-on-surface-variant)]">Nombre de classes</span>
            <div className="p-2 bg-[var(--color-surface-container-low)] rounded-lg text-[var(--color-primary)]">
              <span className="material-symbols-outlined text-[20px]" data-icon="meeting_room">meeting_room</span>
            </div>
          </div>
          <div>
            <span className="text-3xl font-bold text-[var(--color-on-surface)]">{classesCount || 0}</span>
          </div>
        </div>
        
        <div className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-xl p-4 md:p-6 flex flex-col justify-between h-32 hover:border-[var(--color-primary)] transition-colors shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-sm font-semibold text-[var(--color-on-surface-variant)]">Personnel</span>
            <div className="p-2 bg-[var(--color-surface-container-low)] rounded-lg text-[var(--color-primary)]">
              <span className="material-symbols-outlined text-[20px]" data-icon="badge">badge</span>
            </div>
          </div>
          <div>
            <span className="text-3xl font-bold text-[var(--color-on-surface)]">{staffCount || 0}</span>
          </div>
        </div>

        <div className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-xl p-4 md:p-6 flex flex-col justify-between h-32 hover:border-[var(--color-primary)] transition-colors shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-sm font-semibold text-[var(--color-on-surface-variant)]">Taux de recouvrement</span>
            <div className="p-2 bg-[var(--color-surface-container-low)] rounded-lg text-[var(--color-primary)]">
              <span className="material-symbols-outlined text-[20px]" data-icon="payments">payments</span>
            </div>
          </div>
          <div>
            <span className="text-3xl font-bold text-[var(--color-on-surface)]">--</span>
            <span className="text-sm text-[var(--color-on-surface-variant)] ml-2">Mois en cours</span>
          </div>
        </div>
      </div>

      {/* Charts and Activity Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Payment Trends Chart (Placeholder) */}
        <div className="lg:col-span-2 bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-xl p-4 md:p-6 flex flex-col shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-[var(--color-on-surface)]">Tendances de paiement</h3>
            <button className="text-sm font-semibold text-[var(--color-primary)] hover:underline">Voir détails</button>
          </div>
          <div className="flex-1 min-h-[250px] flex items-center justify-center bg-[var(--color-surface-container-low)] rounded-lg border border-dashed border-[var(--color-outline-variant)] relative overflow-hidden">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, var(--color-primary) 1px, transparent 0)", backgroundSize: "20px 20px" }}></div>
            <span className="text-base text-[var(--color-on-surface-variant)] z-10 flex items-center gap-2">
              <span className="material-symbols-outlined text-[var(--color-primary)]">bar_chart</span>
              Graphique des paiements (Visualisation des données)
            </span>
          </div>
        </div>

        {/* Recent Activity List */}
        <div className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-xl p-4 md:p-6 flex flex-col shadow-sm">
          <div className="mb-4">
            <h3 className="text-xl font-bold text-[var(--color-on-surface)]">Activité récente</h3>
          </div>
          <div className="space-y-4 flex-1 overflow-y-auto">
            
            <div className="flex items-start gap-3 pb-3 border-b border-[var(--color-outline-variant)] last:border-0">
              <div className="w-8 h-8 rounded-full bg-[var(--color-surface-container-high)] flex items-center justify-center text-[var(--color-primary)] shrink-0">
                <span className="material-symbols-outlined text-sm" data-icon="receipt_long">receipt_long</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--color-on-surface)]">Paiement reçu : Classe 3A</p>
                <p className="text-xs font-medium text-[var(--color-on-surface-variant)]">Jean Dupont - Frais de scolarité</p>
                <p className="text-xs font-medium text-[var(--color-on-surface-variant)] mt-1">Il y a 10 min</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 pb-3 border-b border-[var(--color-outline-variant)] last:border-0">
              <div className="w-8 h-8 rounded-full bg-[var(--color-error-container)] flex items-center justify-center text-[var(--color-error)] shrink-0">
                <span className="material-symbols-outlined text-sm" data-icon="warning">warning</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--color-on-surface)]">Absence signalée</p>
                <p className="text-xs font-medium text-[var(--color-on-surface-variant)]">Marie Curie - Classe 4B</p>
                <p className="text-xs font-medium text-[var(--color-on-surface-variant)] mt-1">Il y a 45 min</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 pb-3 border-b border-[var(--color-outline-variant)] last:border-0">
              <div className="w-8 h-8 rounded-full bg-[var(--color-surface-container-high)] flex items-center justify-center text-[var(--color-primary)] shrink-0">
                <span className="material-symbols-outlined text-sm" data-icon="person_add">person_add</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--color-on-surface)]">Nouvel élève inscrit</p>
                <p className="text-xs font-medium text-[var(--color-on-surface-variant)]">Dossier #450 validé</p>
                <p className="text-xs font-medium text-[var(--color-on-surface-variant)] mt-1">Il y a 2 heures</p>
              </div>
            </div>
            
          </div>
          <button className="w-full mt-4 py-2 border border-[var(--color-outline-variant)] rounded-lg text-sm font-semibold text-[var(--color-primary)] hover:bg-[var(--color-surface-container-low)] transition-colors">Voir toute l'activité</button>
        </div>
      </div>
    </div>
  )
}
