import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export const dynamic = 'force-dynamic'

export default async function CommunicationHistoryPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: roleData } = await supabase
    .from('user_school_roles')
    .select('school_id')
    .eq('user_id', user.id)
    .limit(1).maybeSingle()

  if (!roleData?.school_id) {
    return <div className="p-8 text-[var(--color-status-retard-text)]">École introuvable.</div>
  }

  const schoolId = roleData.school_id

  const { data: classes } = await supabase
    .from('classes')
    .select('id, name')
    .eq('school_id', schoolId)

  const { data: parents } = await supabase
    .from('user_school_roles')
    .select('user_id, full_name')
    .eq('school_id', schoolId)
    .eq('role', 'parent')

  const { data: communications } = await supabase
    .from('communications')
    .select('*')
    .eq('school_id', schoolId)
    .order('created_at', { ascending: false })

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-[var(--color-surface)]">
      <div className="max-w-[1280px] mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[var(--color-surface-container-lowest)] p-6 rounded-xl border border-[var(--color-outline-variant)]">
          <div>
            <div className="flex items-center gap-2 text-[var(--color-on-surface-variant)] mb-2">
              <Link href="/admin/communication" className="hover:text-[var(--color-primary)] flex items-center gap-1">
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                Retour
              </Link>
              <span className="text-sm font-semibold text-[var(--color-on-surface)]">/ Historique</span>
            </div>
            <h2 className="text-3xl font-bold text-[var(--color-on-surface)]">Historique des Messages</h2>
            <p className="text-base text-[var(--color-on-surface-variant)] mt-1">Tous les messages et annonces envoyés depuis votre établissement.</p>
          </div>
        </div>

        {/* Historique Table/List */}
        <div className="bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-outline-variant)] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--color-surface-bright)] border-b border-[var(--color-outline-variant)]">
                  <th className="p-4 text-sm font-semibold text-[var(--color-on-surface-variant)]">Date & Heure</th>
                  <th className="p-4 text-sm font-semibold text-[var(--color-on-surface-variant)]">Destinataire(s)</th>
                  <th className="p-4 text-sm font-semibold text-[var(--color-on-surface-variant)]">Objet</th>
                  <th className="p-4 text-sm font-semibold text-[var(--color-on-surface-variant)] w-1/3">Message</th>
                </tr>
              </thead>
              <tbody>
                {communications && communications.length > 0 ? (
                  communications.map((comm) => {
                    let recipientText = ''
                    if (comm.recipient_type === 'all') recipientText = 'Tous les parents'
                    else if (comm.recipient_type === 'class') {
                      const c = classes?.find(cl => cl.id === comm.recipient_id)
                      recipientText = c ? `Classe : ${c.name}` : 'Classe inconnue'
                    } else if (comm.recipient_type === 'parent') {
                      const p = parents?.find(pa => pa.user_id === comm.recipient_id)
                      recipientText = p ? `Parent : ${p.full_name}` : 'Parent inconnu'
                    }

                    return (
                      <tr key={comm.id} className="border-b border-[var(--color-outline-variant)] hover:bg-[var(--color-surface-bright)] transition-colors">
                        <td className="p-4 text-sm text-[var(--color-on-surface)] whitespace-nowrap">
                          {format(new Date(comm.created_at), 'dd MMM yyyy, HH:mm', { locale: fr })}
                        </td>
                        <td className="p-4 text-sm font-medium text-[var(--color-on-surface)]">
                          <span className={`inline-flex px-2 py-1 rounded-md text-xs font-semibold ${
                            comm.recipient_type === 'all' ? 'bg-[#fce8e6] text-[#d93025]' : 'bg-[#e8f0fe] text-[#1a73e8]'
                          }`}>
                            {recipientText}
                          </span>
                        </td>
                        <td className="p-4 text-sm font-semibold text-[var(--color-on-surface)]">
                          {comm.subject}
                        </td>
                        <td className="p-4 text-sm text-[var(--color-on-surface-variant)] truncate max-w-xs" title={comm.content}>
                          {comm.content}
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-[var(--color-on-surface-variant)]">
                      Aucun message n'a encore été envoyé.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}
