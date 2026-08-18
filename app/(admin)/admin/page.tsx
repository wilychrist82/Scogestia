import { createClient } from '@/lib/supabase/server'
import { 
  Users, 
  Presentation, 
  UserCircle, 
  Wallet, 
  CalendarOff,
  TrendingUp,
  ChevronDown,
  PlusUser, 
  UserPlus,
  PlusSquare,
  CalendarPlus,
  Banknote,
  BookOpenCheck,
  LayoutGrid,
  FileText
} from 'lucide-react'
import { 
  PaymentBarChart, 
  AttendancePieChart, 
  ClassDistributionPieChart, 
  CircularProgress 
} from '@/components/dashboard/DashboardCharts'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  const supabase = await createClient()

  // Real data fetching
  const { count: studentCount } = await supabase
    .from('user_school_roles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'eleve')

  const { count: classesCount } = await supabase
    .from('classes')
    .select('*', { count: 'exact', head: true })

  const { count: staffCount } = await supabase
    .from('user_school_roles')
    .select('*', { count: 'exact', head: true })
    .in('role', ['admin', 'comptable', 'enseignant'])

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-8">
      {/* Filters Row */}
      <div className="flex justify-end mb-2">
        <div className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-lg cursor-pointer bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
          Année scolaire : 2024 - 2025
          <CalendarOff size={16} className="text-gray-400 ml-2" />
        </div>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Total Élèves */}
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-[var(--color-chart-green)] shrink-0">
            <Users size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium mb-1">Total élèves</p>
            <p className="text-2xl font-bold text-gray-900 leading-none">{studentCount || 512}</p>
            <p className="text-[10px] text-[var(--color-chart-green)] flex items-center mt-1 font-medium">
              <TrendingUp size={12} className="mr-1" /> 12 ce mois
            </p>
          </div>
        </div>

        {/* Total Classes */}
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-[var(--color-chart-blue)] shrink-0">
            <Presentation size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium mb-1">Total classes</p>
            <p className="text-2xl font-bold text-gray-900 leading-none">{classesCount || 18}</p>
            <p className="text-[10px] text-[var(--color-chart-green)] flex items-center mt-1 font-medium">
              <TrendingUp size={12} className="mr-1" /> 1 ce mois
            </p>
          </div>
        </div>

        {/* Total Personnel */}
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center text-[var(--color-chart-purple)] shrink-0">
            <UserCircle size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium mb-1">Total personnel</p>
            <p className="text-2xl font-bold text-gray-900 leading-none">{staffCount || 28}</p>
            <p className="text-[10px] text-[var(--color-chart-green)] flex items-center mt-1 font-medium">
              <TrendingUp size={12} className="mr-1" /> 2 ce mois
            </p>
          </div>
        </div>

        {/* Taux de recouvrement */}
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-[var(--color-chart-orange)] shrink-0">
            <Wallet size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium mb-1">Taux de recouvrement</p>
            <p className="text-2xl font-bold text-gray-900 leading-none">82%</p>
            <p className="text-[10px] text-[var(--color-chart-green)] flex items-center mt-1 font-medium">
              <TrendingUp size={12} className="mr-1" /> 6% ce mois
            </p>
          </div>
        </div>

        {/* Absences */}
        <div className="bg-white rounded-xl p-5 border border-red-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-[var(--color-chart-red)] shrink-0">
            <CalendarOff size={24} />
          </div>
          <div className="flex-1">
            <p className="text-xs text-gray-500 font-medium mb-1">Absences aujourd'hui</p>
            <p className="text-2xl font-bold text-gray-900 leading-none mb-1">32</p>
            <a href="#" className="text-[10px] text-[var(--color-chart-green)] font-medium underline">Voir le détail</a>
          </div>
        </div>
      </div>

      {/* Middle Row: Charts & Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recouvrement des paiements */}
        <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-gray-100 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-bold text-gray-900">Recouvrement des paiements</h3>
            <div className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700">
              Cette année <ChevronDown size={14} className="ml-1" />
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium text-gray-500 mb-2">
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-gray-200"></span> Attendu</div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[var(--color-chart-green)]"></span> Encaissé</div>
          </div>
          
          <div className="flex-1 min-h-[250px]">
            <PaymentBarChart />
          </div>

          <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-4">
            <div>
              <p className="text-xs text-gray-500 font-medium">Total attendu</p>
              <p className="text-lg font-bold text-gray-900">28 500 000 FCFA</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Total encaissé</p>
              <p className="text-lg font-bold text-gray-900">23 370 000 FCFA</p>
            </div>
            <div className="flex items-center gap-3">
              <CircularProgress percentage={82} />
              <p className="text-xs text-gray-500 font-medium max-w-[80px] leading-tight">Taux de<br/>recouvrement</p>
            </div>
          </div>
        </div>

        {/* Échéances impayées */}
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-900">Échéances impayées urgentes</h3>
            <a href="#" className="text-sm font-semibold text-[var(--color-chart-green)] hover:underline">Voir toutes</a>
          </div>
          
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-[11px] text-gray-500 border-b border-gray-100">
                  <th className="pb-3 font-medium uppercase tracking-wide">Élève</th>
                  <th className="pb-3 font-medium uppercase tracking-wide">Classe</th>
                  <th className="pb-3 font-medium text-right uppercase tracking-wide">Montant dû</th>
                  <th className="pb-3 font-medium text-center uppercase tracking-wide">Échéance</th>
                  <th className="pb-3 font-medium text-center uppercase tracking-wide">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {[
                  { name: 'AGBODAN Komi', class: '6ème A', amount: '75 000 FCFA', date: '15/05/2025' },
                  { name: 'DOSSA Kossi', class: '5ème B', amount: '60 000 FCFA', date: '15/05/2025' },
                  { name: 'LAWSON Esi', class: '4ème A', amount: '50 000 FCFA', date: '10/05/2025' },
                  { name: 'TCHALLA Mawuli', class: '6ème A', amount: '75 000 FCFA', date: '05/05/2025' },
                  { name: 'HOUNKPATI Nana', class: '3ème B', amount: '40 000 FCFA', date: '05/05/2025' },
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 text-gray-900 font-medium whitespace-nowrap">{row.name}</td>
                    <td className="py-3 text-gray-600">{row.class}</td>
                    <td className="py-3 text-gray-900 font-medium text-right whitespace-nowrap">{row.amount}</td>
                    <td className="py-3 text-gray-500 text-center">{row.date}</td>
                    <td className="py-3 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700">En retard</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Bottom Row: Donut Charts & Activity */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Présence du jour */}
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm flex flex-col">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Présence du jour</h3>
          <div className="flex items-center justify-between flex-1">
            <div className="w-1/2">
              <AttendancePieChart />
            </div>
            <div className="w-1/2 pl-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-[var(--color-chart-green)]"></span>
                  <span className="text-sm text-gray-600">Présents</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-gray-900 mr-1">476</span>
                  <span className="text-[10px] text-gray-400 font-semibold">(85%)</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-[var(--color-chart-red)]"></span>
                  <span className="text-sm text-gray-600">Absents</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-gray-900 mr-1">32</span>
                  <span className="text-[10px] text-gray-400 font-semibold">(6%)</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-[var(--color-chart-orange)]"></span>
                  <span className="text-sm text-gray-600">Retards</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-gray-900 mr-1">54</span>
                  <span className="text-[10px] text-gray-400 font-semibold">(9%)</span>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-100 pt-4 mt-4 flex justify-between items-center text-sm">
            <span className="text-gray-500 font-medium">Total élèves</span>
            <span className="font-bold text-gray-900">562</span>
          </div>
        </div>

        {/* Répartition */}
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm flex flex-col">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Répartition des élèves par classe</h3>
          <div className="flex items-center justify-between flex-1">
            <div className="w-1/2">
              <ClassDistributionPieChart />
            </div>
            <div className="w-1/2 pl-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-[var(--color-chart-green)]"></span>
                  <span className="text-sm text-gray-600">6ème</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-gray-900 mr-1">120</span>
                  <span className="text-[10px] text-gray-400 font-semibold">(21%)</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-[var(--color-chart-blue)]"></span>
                  <span className="text-sm text-gray-600">5ème</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-gray-900 mr-1">140</span>
                  <span className="text-[10px] text-gray-400 font-semibold">(25%)</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-[var(--color-chart-purple)]"></span>
                  <span className="text-sm text-gray-600">4ème</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-gray-900 mr-1">130</span>
                  <span className="text-[10px] text-gray-400 font-semibold">(23%)</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-[var(--color-chart-orange)]"></span>
                  <span className="text-sm text-gray-600">3ème</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-gray-900 mr-1">172</span>
                  <span className="text-[10px] text-gray-400 font-semibold">(31%)</span>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-100 pt-4 mt-4 flex justify-between items-center text-sm">
            <span className="text-gray-500 font-medium">Total élèves</span>
            <span className="font-bold text-gray-900">562</span>
          </div>
        </div>

        {/* Activités récentes */}
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-900">Activités récentes</h3>
            <a href="#" className="text-sm font-semibold text-[var(--color-chart-green)] hover:underline">Voir tout</a>
          </div>
          <div className="space-y-5">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-[var(--color-chart-green)] shrink-0">
                <Wallet size={16} />
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-semibold text-gray-900 leading-snug">Paiement reçu de AGBODAN Komi</p>
                <p className="text-[11px] text-gray-500 mt-0.5">75 000 FCFA</p>
              </div>
              <span className="text-[11px] text-gray-400 font-medium">10:24</span>
            </div>
            
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-[var(--color-chart-blue)] shrink-0">
                <BookOpenCheck size={16} />
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-semibold text-gray-900 leading-snug">Note saisie pour la classe 6ème A (Mathématiques)</p>
                <p className="text-[11px] text-gray-500 mt-0.5">par M. Adjovi</p>
              </div>
              <span className="text-[11px] text-gray-400 font-medium">09:15</span>
            </div>

            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-[var(--color-chart-red)] shrink-0">
                <CalendarOff size={16} />
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-semibold text-gray-900 leading-snug">Absence enregistrée pour 6 élèves</p>
                <p className="text-[11px] text-gray-500 mt-0.5">dans la classe 5ème B</p>
              </div>
              <span className="text-[11px] text-gray-400 font-medium whitespace-nowrap">Hier, 16:30</span>
            </div>

            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-[var(--color-chart-blue)] shrink-0">
                <FileText size={16} />
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-semibold text-gray-900 leading-snug">Devoir publié en Français pour la classe 4ème A</p>
                <p className="text-[11px] text-gray-500 mt-0.5">par Mlle. Akouvi</p>
              </div>
              <span className="text-[11px] text-gray-400 font-medium whitespace-nowrap">Hier, 14:20</span>
            </div>

            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-[var(--color-chart-orange)] shrink-0">
                <CalendarPlus size={16} />
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-semibold text-gray-900 leading-snug">Nouvelle échéance générée pour 120 élèves</p>
                <p className="text-[11px] text-gray-500 mt-0.5">pour le 15 Juin 2025</p>
              </div>
              <span className="text-[11px] text-gray-400 font-medium whitespace-nowrap">Hier, 11:05</span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm mt-2">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Actions rapides</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <button className="flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-700 py-3 px-2 rounded-lg font-semibold text-[13px] transition-colors border border-gray-100 text-center leading-tight">
            <UserPlus size={16} className="text-[var(--color-chart-green)] shrink-0" />
            Ajouter un élève
          </button>
          <button className="flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-700 py-3 px-2 rounded-lg font-semibold text-[13px] transition-colors border border-gray-100 text-center leading-tight">
            <PlusSquare size={16} className="text-[var(--color-chart-green)] shrink-0" />
            Créer une classe
          </button>
          <button className="flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-700 py-3 px-2 rounded-lg font-semibold text-[13px] transition-colors border border-gray-100 text-center leading-tight">
            <CalendarPlus size={16} className="text-[var(--color-chart-green)] shrink-0" />
            Générer échéance
          </button>
          <button className="flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-700 py-3 px-2 rounded-lg font-semibold text-[13px] transition-colors border border-gray-100 text-center leading-tight">
            <Banknote size={16} className="text-[var(--color-chart-green)] shrink-0" />
            Enregistrer paiement
          </button>
          <button className="flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-700 py-3 px-2 rounded-lg font-semibold text-[13px] transition-colors border border-gray-100 text-center leading-tight">
            <BookOpenCheck size={16} className="text-[var(--color-chart-green)] shrink-0" />
            Publier devoir
          </button>
          <button className="flex items-center justify-center gap-2 bg-[var(--color-sidebar-bg)] hover:bg-[var(--color-sidebar-hover)] text-white py-3 px-2 rounded-lg font-semibold text-[13px] transition-colors shadow-sm text-center leading-tight">
            <LayoutGrid size={16} className="shrink-0" />
            Tous les raccourcis
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="pt-6 border-t border-gray-200 mt-8 flex flex-col md:flex-row items-center justify-between text-xs text-gray-500 font-medium">
        <p>© 2025 Scogestia. Tous droits réservés.</p>
        <div className="flex items-center gap-4 mt-4 md:mt-0">
          <a href="#" className="hover:text-gray-900 transition-colors">Confidentialité</a>
          <span>•</span>
          <a href="#" className="hover:text-gray-900 transition-colors">Conditions d'utilisation</a>
          <span>•</span>
          <a href="#" className="hover:text-gray-900 transition-colors">Aide</a>
        </div>
      </footer>
    </div>
  )
}
