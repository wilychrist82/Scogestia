import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function PersonnelPage() {
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

  // Fetch staff list for this school
  const { data: staffList, error } = await supabase
    .from('user_school_roles')
    .select('id, full_name, role, phone, is_active, user_id')
    .eq('school_id', schoolId)
    .in('role', ['admin', 'comptable', 'enseignant']) // Only staff roles
    .order('created_at', { ascending: false })

  const formatRole = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrateur'
      case 'comptable': return 'Comptable'
      case 'enseignant': return 'Enseignant'
      default: return role
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-[var(--color-surface)]">
      <div className="max-w-[1280px] mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[var(--color-surface-container-lowest)] p-6 rounded-xl border border-[var(--color-outline-variant)]">
          <div>
            <h2 className="text-3xl font-bold text-[var(--color-on-surface)]">Personnel</h2>
            <p className="text-base text-[var(--color-on-surface-variant)] mt-1">Gérez le personnel administratif et enseignant de votre établissement.</p>
          </div>
          <button className="flex items-center justify-center gap-2 bg-[var(--color-primary-container)] text-[var(--color-on-primary)] h-12 px-6 rounded-full text-sm font-semibold hover:bg-[var(--color-primary)] transition-colors active:opacity-90 w-full sm:w-auto shrink-0 shadow-sm">
            <span className="material-symbols-outlined" data-icon="person_add">person_add</span>
            Inviter un membre
          </button>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="relative flex-grow">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-on-surface-variant)]" data-icon="search">search</span>
            <input className="w-full pl-10 pr-4 py-3 bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-lg text-base focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] outline-none transition-all" placeholder="Rechercher par nom..." type="text"/>
          </div>
          <div className="flex gap-2">
            <select className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-lg px-4 py-3 text-base text-[var(--color-on-surface)] focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] outline-none min-w-[150px]">
              <option value="">Tous les rôles</option>
              <option value="enseignant">Enseignant</option>
              <option value="comptable">Comptable</option>
              <option value="admin">Administrateur</option>
            </select>
            <select className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-lg px-4 py-3 text-base text-[var(--color-on-surface)] focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] outline-none min-w-[150px]">
              <option value="">Tous les statuts</option>
              <option value="actif">Actif</option>
              <option value="inactif">Inactif</option>
            </select>
          </div>
        </div>

        {/* Data Table Container */}
        <div className="bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-outline-variant)] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--color-surface-container-low)] border-b border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] text-sm">
                  <th className="py-4 px-6 font-semibold">Nom</th>
                  <th className="py-4 px-6 font-semibold">Rôle</th>
                  <th className="py-4 px-6 font-semibold hidden md:table-cell">Téléphone</th>
                  <th className="py-4 px-6 font-semibold">Statut</th>
                  <th className="py-4 px-6 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-outline-variant)] text-base">
                {staffList?.map((staff) => (
                  <tr key={staff.id} className="hover:bg-[var(--color-surface-container-lowest)]/50 transition-colors bg-[var(--color-surface-container-lowest)]">
                    <td className="py-3 px-6">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-[var(--color-secondary-container)] text-[var(--color-on-secondary-container)] flex items-center justify-center font-bold text-sm">
                          {getInitials(staff.full_name)}
                        </div>
                        <span className="font-medium text-[var(--color-on-surface)]">{staff.full_name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-6 text-[var(--color-on-surface-variant)]">{formatRole(staff.role)}</td>
                    <td className="py-3 px-6 text-[var(--color-on-surface-variant)] hidden md:table-cell">{staff.phone || '-'}</td>
                    <td className="py-3 px-6">
                      {staff.is_active ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[var(--color-primary-fixed)] text-[var(--color-on-primary-fixed-variant)]">
                          <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary-container)]"></span>
                          Actif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[var(--color-surface-variant)] text-[var(--color-on-surface-variant)] border border-[var(--color-outline-variant)]">
                          <span className="material-symbols-outlined text-[14px]" data-icon="schedule">schedule</span>
                          Inactif
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-6 text-right">
                      <button className="p-2 text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] hover:bg-[var(--color-surface-container-high)] rounded-full transition-colors">
                        <span className="material-symbols-outlined text-[20px]" data-icon="more_vert">more_vert</span>
                      </button>
                    </td>
                  </tr>
                ))}
                {staffList?.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-[var(--color-on-surface-variant)]">
                      Aucun membre du personnel trouvé.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="px-6 py-4 border-t border-[var(--color-outline-variant)] flex items-center justify-between bg-[var(--color-surface-container-lowest)]">
            <span className="text-sm text-[var(--color-on-surface-variant)]">
              Affichage {staffList?.length ? '1' : '0'} à {staffList?.length || 0} sur {staffList?.length || 0} éléments
            </span>
            <div className="flex gap-1">
              <button className="p-1 rounded-md text-[var(--color-outline)] hover:text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container-high)] transition-colors disabled:opacity-50" disabled>
                <span className="material-symbols-outlined" data-icon="chevron_left">chevron_left</span>
              </button>
              <button className="p-1 rounded-md text-[var(--color-outline)] hover:text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container-high)] transition-colors disabled:opacity-50" disabled>
                <span className="material-symbols-outlined" data-icon="chevron_right">chevron_right</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
