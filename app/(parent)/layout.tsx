import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BottomNav } from '@/components/parent/BottomNav'

export default async function ParentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/connexion')
  }

  const { data: roleData } = await supabase
    .from('user_school_roles')
    .select('full_name, role')
    .eq('user_id', user.id)
    .eq('role', 'parent')
    .limit(1).maybeSingle()

  if (!roleData) redirect('/')

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex justify-center">
      <div className="w-full max-w-md bg-white min-h-screen relative shadow-2xl flex flex-col">
        {/* Header App-Like */}
        <header className="h-14 bg-[var(--color-primary)] text-white flex items-center px-4 sticky top-0 z-10 shadow-md">
          <span className="material-symbols-outlined text-white mr-3">account_circle</span>
          <div className="flex flex-col">
            <span className="text-sm font-bold truncate max-w-[200px]">{roleData.full_name}</span>
            <span className="text-[10px] text-[var(--color-primary-container)]">Espace Parent</span>
          </div>
        </header>

        {/* Contenu de la page avec padding bottom pour le nav */}
        <main className="flex-1 pb-20 bg-[#f4f7f6] overflow-y-auto">
          {children}
        </main>

        <BottomNav />
      </div>
    </div>
  )
}
