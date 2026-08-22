import { ActivationForm } from './ActivationForm'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Activer mon compte Parent | Scogestia',
  description: "Page d'activation du compte parent avec un code d'invitation",
}

export default async function ActiverParentPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedSearchParams = await searchParams
  const code = (typeof resolvedSearchParams?.code === 'string') ? resolvedSearchParams.code : ''
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-surface)] p-4 md:p-8">
      <ActivationForm initialCode={code} />
    </div>
  )
}
