import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BottomNav } from '@/components/parent/BottomNav'
import { ParentHeader } from '@/components/parent/ParentHeader'
import { UnauthorizedAccess } from '@/components/shared/UnauthorizedAccess'

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

  if (!roleData) {
    return <UnauthorizedAccess role="parent" />
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex justify-center">
      <div className="w-full max-w-md bg-white min-h-screen relative shadow-2xl flex flex-col">
        <ParentHeader fullName={roleData.full_name} />

        {/* Contenu de la page avec padding bottom pour le nav */}
        <main className="flex-1 pb-20 bg-[#f4f7f6] overflow-y-auto">
          {children}
        </main>

        <BottomNav />
      </div>
    </div>
  )
}
