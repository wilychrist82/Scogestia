import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BottomNav } from '@/components/parent/BottomNav'
import { ParentHeader } from '@/components/parent/ParentHeader'
import { UnauthorizedAccess } from '@/components/shared/UnauthorizedAccess'
import { NotificationProvider } from '@/components/providers/NotificationProvider'

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

  const userAvatar = user?.user_metadata?.avatar_url || null

  return (
    <NotificationProvider>
      {/* Fond neutre unifié */}
      <div className="min-h-screen bg-[#f0f4f3] flex justify-center">
        {/*
          Mobile (< md) : centré, max-w-md, effet "app dans un téléphone"
          Tablet (md-lg) : max-w-2xl, plus d'espace
          Desktop (> lg) : max-w-3xl, layout plus large
        */}
        <div className="w-full max-w-md md:max-w-2xl lg:max-w-3xl bg-white min-h-screen relative md:shadow-2xl flex flex-col">
          <ParentHeader fullName={roleData.full_name} userAvatar={userAvatar} />

          {/* Contenu principal avec padding bottom pour la nav fixe */}
          <main 
            className="flex-1 bg-[#f4f7f6] overflow-y-auto scrollbar-light"
            style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))' }}
          >
            {children}
          </main>

          <BottomNav />
        </div>
      </div>
    </NotificationProvider>
  )
}
