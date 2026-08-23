import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function ParentPaiementsPage({
  searchParams,
}: {
  searchParams: Promise<{ child?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/connexion')

  const resolvedSearchParams = await searchParams;
  const childId = resolvedSearchParams.child

  if (!childId) {
    return (
      <div className="p-6 text-center flex flex-col items-center justify-center min-h-[70vh]">
        <span className="material-symbols-outlined text-5xl text-gray-300 mb-4">person_search</span>
        <h2 className="text-xl font-bold text-[var(--color-on-surface)] mb-2">Élève non spécifié</h2>
        <p className="text-[var(--color-on-surface-variant)] mb-6">Veuillez sélectionner un enfant depuis le tableau de bord pour voir ses paiements.</p>
        <Link href="/parent" className="bg-[var(--color-primary)] text-white px-6 py-2 rounded-full font-semibold">
          Retour à l'accueil
        </Link>
      </div>
    )
  }

  // Vérifier le lien parent-enfant
  const { data: link } = await supabase
    .from('parent_student_links')
    .select('student_id')
    .eq('parent_user_id', user.id)
    .eq('student_id', childId)
    .single()

  if (!link) {
    return (
      <div className="p-6 text-center flex flex-col items-center justify-center min-h-[70vh]">
        <span className="material-symbols-outlined text-5xl text-red-300 mb-4">error</span>
        <h2 className="text-xl font-bold text-red-600 mb-2">Accès refusé</h2>
        <p className="text-[var(--color-on-surface-variant)] mb-6">Vous n'avez pas l'autorisation de voir les informations de cet élève.</p>
        <Link href="/parent" className="bg-[var(--color-primary)] text-white px-6 py-2 rounded-full font-semibold">
          Retour à l'accueil
        </Link>
      </div>
    )
  }

  // Récupérer les informations de l'élève
  const { data: student } = await supabase
    .from('students')
    .select('first_name, last_name, class_id, classes(name)')
    .eq('id', childId)
    .single()

  if (!student) {
    return (
      <div className="p-6 text-center">
        <p>Informations de l'élève introuvables.</p>
      </div>
    )
  }

  // Récupérer les échéanciers
  const { data: schedules } = await supabase
    .from('payment_schedules')
    .select('*')
    .eq('student_id', childId)
    .order('due_date', { ascending: true })

  // Récupérer les paiements effectués
  const { data: payments } = await supabase
    .from('payments')
    .select('*')
    .eq('student_id', childId)
    .order('paid_at', { ascending: false })

  const safeSchedules = schedules || [];
  const safePayments = payments || [];

  const totalDue = safeSchedules.reduce((acc, curr) => acc + Number(curr.amount_due), 0);
  const totalPaid = safePayments.reduce((acc, curr) => acc + Number(curr.amount), 0);
  
  // Note: On assume que les paiements ne sont pas directement liés à un schedule pour le solde,
  // Le solde global est Total Dû - Total Payé
  const balance = totalDue - totalPaid;

  const now = new Date();
  
  return (
    <div className="p-4 space-y-6 pb-20">
      <div className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-sm border border-[var(--color-outline-variant)]">
        <Link href="/parent" className="text-[var(--color-on-surface-variant)]">
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-[var(--color-on-surface)]">Finances</h1>
          <p className="text-sm text-[var(--color-primary)] font-medium">
            {student.first_name} {student.last_name} • {(student.classes as any)?.name}
          </p>
        </div>
      </div>

      <div className="bg-[var(--color-primary)] rounded-xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute -right-4 -top-4 opacity-10">
          <span className="material-symbols-outlined text-[120px]">account_balance_wallet</span>
        </div>
        <div className="relative z-10">
          <p className="text-sm font-medium text-white/80 mb-1">Reste à payer (Solde)</p>
          <div className="text-4xl font-black mb-4">
            {balance > 0 ? balance.toLocaleString('fr-FR') : 0} <span className="text-xl font-bold opacity-80">FCFA</span>
          </div>
          
          <div className="flex justify-between items-center pt-4 border-t border-white/20">
            <div>
              <p className="text-xs text-white/70">Total annuel</p>
              <p className="font-bold">{totalDue.toLocaleString('fr-FR')} FCFA</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-white/70">Déjà payé</p>
              <p className="font-bold">{totalPaid.toLocaleString('fr-FR')} FCFA</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-on-surface-variant)] pl-1">Échéancier</h2>
        
        {safeSchedules.length === 0 ? (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-[var(--color-outline-variant)] text-center">
            <p className="text-[var(--color-on-surface-variant)] text-sm">Aucun échéancier défini pour cet élève.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {safeSchedules.map(schedule => {
              const dueDate = new Date(schedule.due_date);
              const isOverdue = dueDate < now && schedule.status !== 'paye';
              
              const statusColors = schedule.status === 'paye' 
                ? 'bg-green-100 text-green-700 border-green-200' 
                : isOverdue 
                  ? 'bg-red-100 text-red-700 border-red-200' 
                  : 'bg-orange-100 text-orange-700 border-orange-200';
              
              const statusLabel = schedule.status === 'paye' 
                ? 'Payé' 
                : isOverdue 
                  ? 'En retard' 
                  : 'En attente';

              return (
                <div key={schedule.id} className="bg-white p-4 rounded-xl shadow-sm border border-[var(--color-outline-variant)] flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-[var(--color-on-surface)]">{schedule.label}</h3>
                    <p className="text-xs text-[var(--color-on-surface-variant)] flex items-center gap-1 mt-1">
                      <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                      Au {dueDate.toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <span className="font-bold text-lg">{Number(schedule.amount_due).toLocaleString('fr-FR')}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${statusColors}`}>
                      {statusLabel}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="space-y-4 pt-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-on-surface-variant)] pl-1">Historique des paiements</h2>
        
        {safePayments.length === 0 ? (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-[var(--color-outline-variant)] text-center flex flex-col items-center">
            <span className="material-symbols-outlined text-3xl text-gray-300 mb-2">receipt_long</span>
            <p className="text-[var(--color-on-surface-variant)] text-sm">Aucun paiement n'a encore été effectué.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-[var(--color-outline-variant)] overflow-hidden">
            <div className="divide-y divide-[var(--color-outline-variant)]">
              {safePayments.map(payment => (
                <div key={payment.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#e8f5e9] text-[#2e7d32] rounded-full flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined">payments</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-[var(--color-on-surface)]">
                        {payment.payment_method || 'Paiement'}
                      </h3>
                      <p className="text-xs text-[var(--color-on-surface-variant)] flex items-center gap-1 mt-1">
                        <span className="material-symbols-outlined text-[14px]">history</span>
                        {new Date(payment.paid_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                      {payment.transaction_reference && (
                        <p className="text-[10px] text-gray-400 mt-0.5 font-mono">
                          Réf: {payment.transaction_reference}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="font-bold text-[#2e7d32] text-lg whitespace-nowrap">
                    +{Number(payment.amount).toLocaleString('fr-FR')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
