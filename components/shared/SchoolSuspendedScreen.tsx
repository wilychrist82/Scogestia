'use client'

import { ShieldAlert, LogOut } from 'lucide-react'
import { logout } from '@/app/actions/auth'

type Props = {
  schoolName?: string
  userRole?: 'enseignant' | 'parent' | 'comptable'
}

export function SchoolSuspendedScreen({ schoolName, userRole = 'enseignant' }: Props) {
  const roleLabel = userRole === 'parent' ? 'parent' : userRole === 'enseignant' ? 'enseignant' : 'personnel'

  return (
    <div className="min-h-screen bg-[var(--color-surface)] flex items-center justify-center p-4">
      <div className="bg-[var(--color-surface-container-lowest)] p-8 md:p-10 rounded-3xl shadow-2xl max-w-lg w-full text-center border border-[var(--color-outline-variant)]">
        <div className="w-20 h-20 bg-amber-50 dark:bg-amber-950/40 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-amber-200 dark:border-amber-800">
          <ShieldAlert size={36} strokeWidth={2.2} />
        </div>
        <h2 className="text-2xl font-bold text-[var(--color-on-surface)] mb-2">Établissement temporairement suspendu</h2>
        <p className="text-sm text-[var(--color-on-surface-variant)] mb-6 leading-relaxed">
          L'accès pour <strong>{schoolName || "votre établissement"}</strong> est actuellement suspendu en attente du renouvellement de l'abonnement Scogestia par la direction de l'école.
        </p>

        <div className="p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-outline-variant)] text-xs text-[var(--color-on-surface-variant)] mb-6 text-left space-y-1">
          <p className="font-semibold text-[var(--color-on-surface)]">Que faire en tant que {roleLabel} ?</p>
          <p>Veuillez contacter le secrétariat ou la direction de votre établissement pour les informer que l'abonnement doit être réactivé.</p>
        </div>

        <button
          onClick={() => logout()}
          className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm transition-colors shadow-md"
        >
          <LogOut size={16} />
          <span>Se déconnecter</span>
        </button>
      </div>
    </div>
  )
}
