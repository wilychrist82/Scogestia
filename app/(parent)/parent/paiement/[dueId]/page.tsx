import { createClient } from '@/lib/supabase/server'
import { PaymentForm } from '@/components/parent/PaymentForm'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function PaiementPage({ params }: { params: { dueId: string } }) {
  const supabase = await createClient()

  // 1. Authentification
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  // 2. Vérifier que l'utilisateur est bien le parent
  // et récupérer les infos de l'échéance
  const { data: due, error: dueError } = await supabase
    .from('dues')
    .select(`
      id,
      label,
      amount,
      status,
      student:students (
        first_name,
        last_name
      )
    `)
    .eq('id', params.dueId)
    .single()

  if (dueError || !due) {
    // Échéance introuvable
    redirect('/parent')
  }

  if (due.status === 'paye') {
    // Déjà payé
    redirect('/parent?msg=deja-paye')
  }

  return (
    <div className="font-body-md text-body-md antialiased min-h-screen flex flex-col md:max-w-md md:mx-auto md:bg-white md:shadow-lg md:border-x border-[var(--color-outline-variant)] relative bg-[var(--color-surface)]">
      {/* TopAppBar */}
      <header className="flex justify-between items-center px-4 h-16 w-full bg-[var(--color-surface)] text-[var(--color-primary)] border-b border-[var(--color-outline-variant)] sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Link href="/parent" className="p-2 -ml-2 rounded-full hover:bg-[var(--color-surface-container-low)] transition-colors">
            <span className="material-symbols-outlined text-[var(--color-primary)]">arrow_back</span>
          </Link>
          <h1 className="text-xl font-bold text-[var(--color-primary)]">Paiement</h1>
        </div>
        <div className="text-sm font-semibold text-[var(--color-on-surface-variant)] bg-[var(--color-surface-container-low)] px-3 py-1 rounded-full">
          Élève: {due.student?.first_name}
        </div>
      </header>

      {/* Main Form */}
      <PaymentForm dueId={due.id} label={due.label} amount={due.amount} />
    </div>
  )
}
