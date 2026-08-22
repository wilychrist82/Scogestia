import { ActivationForm } from './ActivationForm'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Activer mon compte Parent | Scogestia',
  description: "Page d'activation du compte parent avec un code d'invitation",
}

export default async function ActiverParentPage({
  searchParams,
}: {
  searchParams: { code?: string }
}) {
  const code = searchParams.code || ''
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-surface)] p-4 md:p-8">
      <ActivationForm initialCode={code} />
    </div>
  )
}
