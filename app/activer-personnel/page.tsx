import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ActiverPersonnelForm from './ActiverPersonnelForm'

export const dynamic = 'force-dynamic'

export default async function ActiverPersonnelPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>
}) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  // Si déjà connecté, on redirige vers le tableau de bord
  if (session) {
    redirect('/')
  }

  const resolvedParams = await searchParams
  const code = resolvedParams.code

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
        <div className="text-center">
          <div className="w-16 h-16 bg-[#e8f0fe] rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-[32px] text-[#1a73e8]">badge</span>
          </div>
          <h2 className="mt-2 text-3xl font-extrabold text-gray-900">
            Activation du compte Personnel
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Veuillez entrer vos informations et votre code d'invitation pour activer votre compte Scogestia.
          </p>
        </div>

        <ActiverPersonnelForm initialCode={code || ''} />
      </div>
    </div>
  )
}
