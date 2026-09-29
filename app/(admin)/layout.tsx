import { AdminLayoutWrapper } from '@/components/layout/AdminLayoutWrapper'
import { SupportWidget } from '@/components/layout/SupportWidget'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import { UnauthorizedAccess } from '@/components/shared/UnauthorizedAccess'
import { getSchoolSubscriptionStatus } from '@/lib/subscription'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/connexion')
  }

  // Récupérer le rôle de l'utilisateur et l'école associée
  const { data: roleData } = await supabase
    .from('user_school_roles')
    .select(`
      school_id, 
      full_name, 
      role,
      schools (
        name,
        city
      )
    `)
    .eq('user_id', user.id)
    .in('role', ['admin', 'comptable'])
    .limit(1).maybeSingle()

  if (!roleData) {
    return <UnauthorizedAccess role="admin" />
  }

  const schoolJoin = roleData.schools as unknown as { name: string; city: string | null } | { name: string; city: string | null }[] | null
  const school = Array.isArray(schoolJoin) ? schoolJoin[0] ?? null : schoolJoin
  const schoolName = school?.name || 'École inconnue'
  const schoolCity = school?.city || ''

  const userFullName = roleData?.full_name || 'Admin User'
  const userRoleLabel = 'Administrateur'
  const userAvatar = user?.user_metadata?.avatar_url || null

  // Vérification de l'abonnement via l'utilitaire centralisé
  let showBanner = false
  let bannerMessage = ''
  let isExpired = false
  let daysRemaining = 0

  if (roleData?.school_id) {
    const subStatus = await getSchoolSubscriptionStatus(supabase, roleData.school_id)
    isExpired = subStatus.isExpired
    daysRemaining = subStatus.daysRemaining

    if (isExpired) {
      showBanner = true
      bannerMessage = "Votre période d'essai ou abonnement a expiré. Veuillez choisir un plan pour continuer."
    } else if (daysRemaining <= 5) {
      showBanner = true
      bannerMessage = `Votre abonnement expire dans ${daysRemaining} jour${daysRemaining > 1 ? 's' : ''}.`
    }
  }

  return (
    <div className="h-screen w-full">
      <AdminLayoutWrapper 
        userFullName={userFullName} 
        userRoleLabel={userRoleLabel}
        userAvatar={userAvatar}
        schoolName={schoolName}
        schoolCity={schoolCity}
        isExpired={isExpired}
        daysRemaining={daysRemaining}
        banner={showBanner ? (
          <div className={`px-4 py-3 flex items-center justify-between shadow-sm z-50 ${isExpired ? 'bg-[#d93025] text-white' : 'bg-[#f57f17] text-white'}`}>
            <div className="flex items-center gap-2 text-sm font-medium">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <span>{bannerMessage}</span>
            </div>
            <Link href="/admin/abonnement" className="text-xs font-bold bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded transition-colors whitespace-nowrap ml-4">
              {isExpired ? "S'abonner" : "Renouveler"}
            </Link>
          </div>
        ) : null}
      >
        {children}
      </AdminLayoutWrapper>
      <SupportWidget
        userFullName={userFullName}
        userEmail={user.email}
        tawkPropertyId={process.env.NEXT_PUBLIC_TAWK_PROPERTY_ID}
        tawkWidgetId={process.env.NEXT_PUBLIC_TAWK_WIDGET_ID}
      />
    </div>
  )
}
