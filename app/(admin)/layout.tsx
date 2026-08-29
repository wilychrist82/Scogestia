import { AdminLayoutWrapper } from '@/components/layout/AdminLayoutWrapper'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'

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

  const { data: roleData } = await supabase
    .from('user_school_roles')
    .select('school_id, full_name, role')
    .eq('user_id', user.id)
    .limit(1).maybeSingle()

  const userFullName = roleData?.full_name || 'Admin User'
  const userRoleLabel = 'Administrateur'

  // Vérification de l'abonnement
  let showBanner = false
  let bannerMessage = ''
  let isExpired = false
  let daysRemaining = 0

  if (roleData?.school_id) {
    const { data: sub } = await supabase
      .from('saas_subscriptions')
      .select('status, current_period_end')
      .eq('school_id', roleData.school_id)
      .maybeSingle()
      
    if (sub && sub.current_period_end) {
      const endDate = new Date(sub.current_period_end)
      const now = new Date()
      const diffTime = endDate.getTime() - now.getTime()
      daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      if (daysRemaining <= 0 || sub.status === 'expired') {
        isExpired = true
        showBanner = true
        bannerMessage = "Votre abonnement a expiré. Veuillez le renouveler pour éviter une coupure de service."
      } else if (daysRemaining <= 5) {
        showBanner = true
        bannerMessage = `Votre abonnement expire dans ${daysRemaining} jour${daysRemaining > 1 ? 's' : ''}.`
      }
    } else {
      // Pas d'abonnement du tout
      isExpired = true
      showBanner = true
      bannerMessage = "Aucun abonnement actif détecté. Veuillez souscrire à un plan."
    }
  }

  return (
    <div className="flex flex-col h-screen w-full">
      {showBanner && (
        <div className={`px-4 py-3 flex items-center justify-between shadow-sm z-50 ${isExpired ? 'bg-[#d93025] text-white' : 'bg-[#f57f17] text-white'}`}>
          <div className="flex items-center gap-2 text-sm font-medium">
            <AlertTriangle className="w-5 h-5" />
            <span>{bannerMessage}</span>
          </div>
          <Link href="/admin/abonnement" className="text-xs font-bold bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded transition-colors whitespace-nowrap ml-4">
            Renouveler
          </Link>
        </div>
      )}
      <div className="flex-1 overflow-hidden relative">
        <AdminLayoutWrapper userFullName={userFullName} userRoleLabel={userRoleLabel}>
          {children}
        </AdminLayoutWrapper>
      </div>
    </div>
  )
}
