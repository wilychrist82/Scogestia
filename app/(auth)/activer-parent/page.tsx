import { ActivationForm } from './ActivationForm'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Activer mon compte Parent | Scogestia',
  description: "Page d'activation du compte parent avec un code d'invitation",
}

export default function ActiverParentPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-surface)] p-4 md:p-8">
      <ActivationForm />
    </div>
  )
}
