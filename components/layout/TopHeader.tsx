'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Menu, Bell, ChevronDown, CheckCheck, Settings, LogOut } from 'lucide-react'
import { logout } from '@/app/actions/auth'
import { useNotifications } from '@/components/providers/NotificationProvider'
import { useState, useRef, useEffect } from 'react'

export function TopHeader({ 
  userFullName, 
  userRoleLabel, 
  userAvatar,
  onMenuClick,
  schoolName,
  schoolCity,
  navVariant = 'admin'
}: { 
  userFullName: string, 
  userRoleLabel: string, 
  userAvatar?: string | null,
  onMenuClick?: () => void,
  schoolName?: string,
  schoolCity?: string,
  navVariant?: 'admin' | 'enseignant' | 'super_admin'
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()
  const [showNotifs, setShowNotifs] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)

  const isEnseignant = navVariant === 'enseignant'
  const isSuperAdmin = navVariant === 'super_admin'

  const handleNotificationClick = async (notif: any) => {
    if (!notif.is_read) {
      await markAsRead(notif.id)
    }
    setShowNotifs(false)
    
    if (notif.type === 'message') {
      if (pathname.startsWith('/admin')) {
        router.push('/admin/communication')
      } else if (pathname.startsWith('/enseignant')) {
        router.push('/enseignant/messages')
      }
    }
  }
  
  // Fermer les dropdowns au clic extérieur
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifs(false)
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])
  
  // Mapping complet des pages → titre + sous-titre
  const getPageInfo = () => {
    // Admin pages
    if (pathname === '/admin') return { title: 'Tableau de bord', subtitle: `Bienvenue, ${userFullName.split(' ')[0]} ! Voici un aperçu de votre école aujourd'hui.` }
    if (pathname.startsWith('/admin/parametres')) return { title: 'Paramètres', subtitle: 'Gérez la configuration et l\'identité de votre établissement.' }
    if (pathname.startsWith('/admin/personnel')) return { title: 'Personnel', subtitle: 'Gérez le personnel administratif et enseignant.' }
    if (pathname.startsWith('/admin/eleves')) return { title: 'Élèves', subtitle: 'Gérez les élèves inscrits dans votre établissement.' }
    if (pathname.startsWith('/admin/classes')) return { title: 'Classes', subtitle: 'Gérez les classes et niveaux scolaires.' }
    if (pathname.startsWith('/admin/finance/frais')) return { title: 'Frais scolaires', subtitle: 'Définissez les types de frais et montants.' }
    if (pathname.startsWith('/admin/finance/echeances')) return { title: 'Échéances', subtitle: 'Gérez les échéances de paiement par élève.' }
    if (pathname.startsWith('/admin/finance/caisse')) return { title: 'Caisse', subtitle: 'Enregistrez et suivez les encaissements.' }
    if (pathname.startsWith('/admin/finance/paiements')) return { title: 'Paiements', subtitle: 'Historique complet des paiements reçus.' }
    if (pathname.startsWith('/admin/finance/impayes')) return { title: 'Impayés', subtitle: 'Suivez les élèves en retard de paiement.' }
    if (pathname.startsWith('/admin/finance/rapports')) return { title: 'Rapports financiers', subtitle: 'Analyses et bilans financiers de l\'établissement.' }
    if (pathname.startsWith('/admin/finance')) return { title: 'Finance', subtitle: 'Tableau de bord financier — encaissements, échéances et impayés.' }
    if (pathname.startsWith('/admin/academique/matieres')) return { title: 'Matières', subtitle: 'Gérez les matières enseignées.' }
    if (pathname.startsWith('/admin/academique/emplois')) return { title: 'Emplois du temps', subtitle: 'Organisez les emplois du temps des classes.' }
    if (pathname.startsWith('/admin/academique/presences')) return { title: 'Présences', subtitle: 'Suivez les absences et retards des élèves.' }
    if (pathname.startsWith('/admin/academique/devoirs')) return { title: 'Devoirs', subtitle: 'Suivez les devoirs et travaux assignés.' }
    if (pathname.startsWith('/admin/academique/notes')) return { title: 'Saisie des notes', subtitle: 'Saisissez et gérez les notes des élèves.' }
    if (pathname.startsWith('/admin/academique/bulletins')) return { title: 'Bulletins & Livrets', subtitle: 'Générez et imprimez les bulletins scolaires.' }
    if (pathname.startsWith('/admin/academique')) return { title: 'Académique', subtitle: 'Gestion des notes, présences, devoirs et bulletins.' }
    if (pathname.startsWith('/admin/communication')) return { title: 'Communication', subtitle: 'Envoyez des messages et annonces aux parents.' }
    if (pathname.startsWith('/admin/rapports/academique')) return { title: 'Rapports académiques', subtitle: 'Statistiques et analyses des performances scolaires.' }
    if (pathname.startsWith('/admin/rapports/finance')) return { title: 'Bilans financiers', subtitle: 'Rapports et bilans financiers détaillés.' }
    if (pathname.startsWith('/admin/rapports')) return { title: 'Rapports', subtitle: 'Consultez les rapports globaux de l\'établissement.' }
    if (pathname.startsWith('/admin/abonnement')) return { title: 'Abonnement', subtitle: 'Gérez votre abonnement Scogestia.' }
    // Enseignant pages
    if (pathname === '/enseignant') return { title: 'Mon espace', subtitle: `Bienvenue, ${userFullName.split(' ')[0]} ! Voici votre tableau de bord.` }
    if (pathname.startsWith('/enseignant/planning')) return { title: 'Emploi du temps', subtitle: 'Vos créneaux de cours de la semaine.' }
    if (pathname.startsWith('/enseignant/notes')) return { title: 'Notes', subtitle: 'Saisissez et gérez les notes de vos classes.' }
    if (pathname.startsWith('/enseignant/presences')) return { title: 'Présences', subtitle: 'Faites l\'appel et suivez les absences.' }
    if (pathname.startsWith('/enseignant/devoirs')) return { title: 'Devoirs', subtitle: 'Publiez et gérez les devoirs pour vos élèves.' }
    if (pathname.startsWith('/enseignant/messages')) return { title: 'Messages', subtitle: 'Consultez et envoyez des messages aux parents.' }
    if (pathname.startsWith('/enseignant/parametres')) return { title: 'Paramètres', subtitle: 'Gérez votre profil enseignant.' }
    // Super admin
    if (pathname === '/super_admin') return { title: 'Dashboard SaaS', subtitle: 'Vue globale des écoles clientes Scogestia.' }
    if (pathname.startsWith('/super_admin/ecoles')) return { title: 'Écoles clientes', subtitle: 'Gérez les établissements abonnés.' }
    // Default
    return { title: 'Tableau de bord', subtitle: `Bienvenue, ${userFullName.split(' ')[0]} !` }
  }

  const { title, subtitle } = getPageInfo()

  // Styles conditionnels selon le variant
  const headerBg = isEnseignant 
    ? 'bg-[var(--color-primary)] border-[var(--color-primary)]' 
    : isSuperAdmin 
      ? 'bg-slate-900 border-slate-800'
      : 'bg-white border-gray-200'
  
  const textPrimary = isEnseignant || isSuperAdmin ? 'text-white' : 'text-gray-900'
  const textMuted = isEnseignant || isSuperAdmin ? 'text-white/70' : 'text-gray-500'
  const iconColor = isEnseignant || isSuperAdmin ? 'text-white/80 hover:text-white' : 'text-gray-500 hover:text-gray-800'
  const hoverBg = isEnseignant || isSuperAdmin ? 'hover:bg-white/10' : 'hover:bg-gray-100'
  const dividerColor = isEnseignant || isSuperAdmin ? 'bg-white/15' : 'bg-gray-200'
  const schoolBorderColor = isEnseignant || isSuperAdmin ? 'border-white/15 hover:bg-white/8' : 'border-gray-200 hover:bg-gray-50'

  return (
    <header className={`${headerBg} h-[68px] border-b flex items-center justify-between px-4 md:px-6 sticky top-0 z-30 w-full shadow-sm`}>
      {/* Gauche : Menu + Titre de page */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Bouton menu — fonctionne sur mobile ET desktop */}
        <button 
          onClick={onMenuClick} 
          className={`${iconColor} ${hoverBg} p-2 rounded-lg transition-colors flex-shrink-0`}
          aria-label="Ouvrir le menu"
        >
          <Menu size={20} />
        </button>

        {/* Titre de page — masqué sur très petit mobile */}
        <div className="hidden sm:block min-w-0">
          <h2 className={`text-base font-bold ${textPrimary} leading-tight truncate`}>{title}</h2>
          <p className={`text-[11px] ${textMuted} mt-0.5 truncate max-w-[360px]`}>{subtitle}</p>
        </div>
      </div>

      {/* Droite : École + Notifs + Profil */}
      <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
        
        {/* Sélecteur d'école */}
        <div className={`hidden lg:flex items-center gap-2 px-3 py-1.5 border ${schoolBorderColor} rounded-lg cursor-pointer transition-colors`}>
          <div className="text-right">
            <p className={`text-sm font-semibold ${textPrimary} leading-tight`}>{schoolName || 'École'}</p>
            {schoolCity && <p className={`text-[11px] ${textMuted}`}>{schoolCity}</p>}
          </div>
          <ChevronDown size={13} className={textMuted} />
        </div>

        <div className={`h-6 w-px ${dividerColor} hidden lg:block`} />

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => { setShowNotifs(!showNotifs); setShowProfileMenu(false) }}
            className={`relative p-2 ${iconColor} ${hoverBg} transition-colors rounded-lg`}
            aria-label="Notifications"
          >
            <Bell size={19} />
            {unreadCount > 0 && (
              <span className={`absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full border-2 ${isEnseignant || isSuperAdmin ? 'border-[var(--color-primary)]' : 'border-white'} leading-none px-0.5`}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          
          {showNotifs && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-dropdown">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/80">
                <div className="flex items-center gap-2">
                  <Bell size={14} className="text-gray-400" />
                  <h3 className="font-bold text-gray-900 text-sm">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="bg-red-100 text-red-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{unreadCount}</span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button onClick={markAllAsRead} className="text-xs text-[var(--color-primary)] hover:underline flex items-center gap-1 font-medium">
                    <CheckCheck size={12} /> Tout lu
                  </button>
                )}
              </div>
              <div className="max-h-[340px] overflow-y-auto scrollbar-light">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <Bell size={28} className="mx-auto text-gray-200 mb-2" />
                    <p className="text-sm text-gray-400 font-medium">Aucune notification</p>
                  </div>
                ) : (
                  notifications.map(notif => (
                    <div 
                      key={notif.id} 
                      onClick={() => handleNotificationClick(notif)}
                      className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${notif.is_read ? 'opacity-60' : 'bg-blue-50/40'}`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <p className={`text-sm flex-1 leading-snug ${notif.is_read ? 'font-medium text-gray-700' : 'font-bold text-gray-900'}`}>
                          {notif.title}
                        </p>
                        {!notif.is_read && <span className="w-2 h-2 bg-blue-500 rounded-full mt-1 flex-shrink-0" />}
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-2 mt-1">{notif.message}</p>
                      <p className="text-[10px] text-gray-400 mt-1.5">
                        {new Date(notif.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute:'2-digit' })}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profil utilisateur */}
        <div className="relative" ref={profileRef}>
          <button 
            onClick={() => { setShowProfileMenu(!showProfileMenu); setShowNotifs(false) }}
            className={`flex items-center gap-2.5 pl-1 pr-2 py-1 rounded-lg transition-colors ${hoverBg}`}
            aria-label="Menu profil"
          >
            {userAvatar ? (
              <img 
                src={userAvatar} 
                alt={userFullName} 
                className={`w-8 h-8 rounded-lg object-cover object-top border ${isEnseignant || isSuperAdmin ? 'border-white/20' : 'border-gray-200'} flex-shrink-0`} 
              />
            ) : (
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm overflow-hidden flex-shrink-0 ${isEnseignant || isSuperAdmin ? 'bg-white/20 text-white' : 'bg-[var(--color-sidebar-bg)] text-white'}`}>
                {userFullName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="hidden md:block text-left">
              <p className={`text-xs font-bold ${textPrimary} leading-tight max-w-[120px] truncate`}>{userFullName}</p>
              <p className={`text-[10px] ${textMuted} leading-tight truncate`}>{userRoleLabel}</p>
            </div>
            <ChevronDown 
              size={14} 
              className={`${textMuted} transition-transform duration-200 flex-shrink-0 ${showProfileMenu ? 'rotate-180' : ''}`} 
            />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-dropdown">
              <div className="p-3.5 border-b border-gray-100 bg-gray-50/80">
                <p className="text-sm font-bold text-gray-900 truncate">{userFullName}</p>
                <p className="text-xs text-gray-500 truncate mt-0.5">{userRoleLabel}</p>
              </div>
              <div className="py-1.5">
                <Link 
                  href={isEnseignant ? "/enseignant/parametres" : isSuperAdmin ? "/" : "/admin/parametres"}
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Settings size={15} className="text-gray-400" />
                  Paramètres du profil
                </Link>
                <div className="mx-3 my-1 h-px bg-gray-100" />
                <form action={logout}>
                  <button 
                    type="submit" 
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
                  >
                    <LogOut size={15} />
                    Se déconnecter
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
