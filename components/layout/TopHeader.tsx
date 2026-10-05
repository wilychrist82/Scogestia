'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Menu, 
  Bell, 
  ChevronDown, 
  CheckCheck, 
  Settings, 
  LogOut, 
  Search, 
  User, 
  Shield, 
  Building2, 
  Lock
} from 'lucide-react'
import { logout } from '@/app/actions/auth'
import { useNotifications } from '@/components/providers/NotificationProvider'
import { useState, useRef, useEffect } from 'react'
import { CommandPalette } from '@/components/search/CommandPalette'
import { NetworkStatusIndicator } from '@/components/ui/NetworkStatusIndicator'

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
  const [notifFilter, setNotifFilter] = useState<'all' | 'unread'>('all')
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
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
    if (pathname === '/admin') return { title: 'Tableau de bord', subtitle: `Bienvenue, ${userFullName.split(' ')[0]} ! Vue d'ensemble de votre établissement.` }
    if (pathname.startsWith('/admin/parametres/profil')) return { title: 'Mon profil', subtitle: 'Vos coordonnées et identifiants personnels.' }
    if (pathname.startsWith('/admin/parametres/securite')) return { title: 'Sécurité & Accès', subtitle: 'Gestion des mots de passe et sessions de sécurité.' }
    if (pathname.startsWith('/admin/parametres/journal')) return { title: 'Journal d\'activités', subtitle: 'Historique des connexions et actions système.' }
    if (pathname.startsWith('/admin/parametres')) return { title: 'Paramètres', subtitle: 'Configuration générale et identité de l\'établissement.' }
    if (pathname.startsWith('/admin/personnel')) return { title: 'Personnel & Équipe', subtitle: 'Gestion des enseignants, comptables et administrateurs.' }
    if (pathname.startsWith('/admin/eleves/nouveau')) return { title: 'Nouvel élève', subtitle: 'Enregistrer une nouvelle inscription dans l\'école.' }
    if (pathname.startsWith('/admin/eleves')) return { title: 'Gestion des élèves', subtitle: 'Fiches scolaires, matricules et contacts parents.' }
    if (pathname.startsWith('/admin/classes')) return { title: 'Classes & Niveaux', subtitle: 'Organisation des sections et effectifs par classe.' }
    if (pathname.startsWith('/admin/finance/frais')) return { title: 'Frais scolaires', subtitle: 'Grille tarifaire et frais de scolarité par niveau.' }
    if (pathname.startsWith('/admin/finance/echeances')) return { title: 'Échéances de paiement', subtitle: 'Calendrier des tranches et dates limites.' }
    if (pathname.startsWith('/admin/finance/caisse')) return { title: 'Caisse & Encaissements', subtitle: 'Enregistrez les versements et encaissements du jour.' }
    if (pathname.startsWith('/admin/finance/paiements')) return { title: 'Historique des paiements', subtitle: 'Reçus, transactions Mobile Money et espèces.' }
    if (pathname.startsWith('/admin/finance/impayes')) return { title: 'Suivi des impayés', subtitle: 'Relances automatiques et élèves en retard de paiement.' }
    if (pathname.startsWith('/admin/finance/rapports')) return { title: 'Rapports financiers', subtitle: 'Analyses de trésorerie et bilans comptables.' }
    if (pathname.startsWith('/admin/finance')) return { title: 'Gestion financière', subtitle: 'Tableau de bord financier — recouvrement et encaissements.' }
    if (pathname.startsWith('/admin/academique/matieres')) return { title: 'Matières & Coefficients', subtitle: 'Programme d\'enseignement et coefficients.' }
    if (pathname.startsWith('/admin/academique/emplois')) return { title: 'Emplois du temps', subtitle: 'Planning hebdomadaire des cours par classe.' }
    if (pathname.startsWith('/admin/academique/presences')) return { title: 'Suivi des présences', subtitle: 'Appel en classe, registre des absences et retards.' }
    if (pathname.startsWith('/admin/academique/devoirs')) return { title: 'Devoirs & Travaux', subtitle: 'Cahier de texte et devoirs distribués.' }
    if (pathname.startsWith('/admin/academique/notes')) return { title: 'Saisie des notes', subtitle: 'Évaluations continues, compositions et moyennes.' }
    if (pathname.startsWith('/admin/academique/bulletins')) return { title: 'Bulletins & Livrets', subtitle: 'Génération automatique et impression des bulletins.' }
    if (pathname.startsWith('/admin/academique')) return { title: 'Pôle académique', subtitle: 'Notes, présences, devoirs et bulletins scolaires.' }
    if (pathname.startsWith('/admin/communication/annonces')) return { title: 'Diffusion d\'annonces', subtitle: 'Publier des annonces officielles aux familles.' }
    if (pathname.startsWith('/admin/communication/historique')) return { title: 'Historique des envois', subtitle: 'Statistiques de lecture et journaux de diffusion.' }
    if (pathname.startsWith('/admin/communication')) return { title: 'Centre de communication', subtitle: 'Échanges directs et messagerie avec les parents.' }
    if (pathname.startsWith('/admin/rapports/academique')) return { title: 'Rapports académiques', subtitle: 'Statistiques de réussite et classements.' }
    if (pathname.startsWith('/admin/rapports/finance')) return { title: 'Bilans financiers', subtitle: 'États récapitulatifs des recettes et soldes.' }
    if (pathname.startsWith('/admin/rapports')) return { title: 'Rapports & Bilans', subtitle: 'Analyses globales de performance de l\'école.' }
    if (pathname.startsWith('/admin/abonnement')) return { title: 'Abonnement Scogestia', subtitle: 'Statut de votre licence SaaS et facturation.' }
    // Enseignant pages
    if (pathname === '/enseignant') return { title: 'Espace Enseignant', subtitle: `Bienvenue, ${userFullName.split(' ')[0]} ! Vos cours et activités du jour.` }
    if (pathname.startsWith('/enseignant/planning')) return { title: 'Emploi du temps', subtitle: 'Vos créneaux de cours programmés cette semaine.' }
    if (pathname.startsWith('/enseignant/notes')) return { title: 'Carnet de notes', subtitle: 'Saisie des notes et calcul des moyennes de vos classes.' }
    if (pathname.startsWith('/enseignant/presences')) return { title: 'Fiche d\'appel', subtitle: 'Pointer les présences et retards des élèves.' }
    if (pathname.startsWith('/enseignant/devoirs')) return { title: 'Devoirs à la maison', subtitle: 'Donner du travail et suivre le rendu des élèves.' }
    if (pathname.startsWith('/enseignant/messages')) return { title: 'Messagerie', subtitle: 'Échanges avec les parents d\'élèves.' }
    if (pathname.startsWith('/enseignant/parametres')) return { title: 'Mon compte', subtitle: 'Gérer vos informations personnelles d\'enseignant.' }
    // Super admin
    if (pathname === '/super_admin') return { title: 'Cockpit Super Admin', subtitle: 'Supervision globale de la plateforme Scogestia.' }
    if (pathname.startsWith('/super_admin/ecoles')) return { title: 'Écoles clientes', subtitle: 'Gestion des tenants, licences et abonnements scolaires.' }
    if (pathname.startsWith('/super_admin/health')) return { title: 'Santé système', subtitle: 'Disponibilité des bases, webhooks et services tiers.' }
    // Default
    return { title: 'Tableau de bord', subtitle: `Bienvenue, ${userFullName.split(' ')[0]} !` }
  }

  const { title, subtitle } = getPageInfo()

  // Filtre des notifications
  const filteredNotifications = notifFilter === 'all' 
    ? notifications 
    : notifications.filter(n => !n.is_read)

  return (
    <header className="h-[68px] bg-white/95 backdrop-blur-md border-b border-slate-200/80 flex items-center justify-between px-4 md:px-6 sticky top-0 z-30 w-full transition-colors">
      
      {/* Gauche : Bouton menu + Titre de page avec hiérarchie soignée */}
      <div className="flex items-center gap-3 min-w-0">
        <button 
          type="button"
          onClick={onMenuClick} 
          className="md:hidden relative text-slate-500 hover:text-slate-900 hover:bg-slate-100/80 p-2 rounded-xl transition-all flex-shrink-0 active:scale-95"
          aria-label="Ouvrir le menu de navigation"
        >
          <Menu size={20} />
          {unreadCount > 0 && (
            <span className="md:hidden absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white animate-pulse" />
          )}
        </button>

        <div className="hidden sm:block min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-[15px] font-bold text-slate-900 leading-tight truncate tracking-tight">
              {title}
            </h2>
            {isEnseignant && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60 shrink-0">
                Enseignant
              </span>
            )}
            {isSuperAdmin && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 text-violet-700 border border-violet-200/60 shrink-0">
                Super Admin
              </span>
            )}
          </div>
          <p className="text-[11.5px] text-slate-500 mt-0.5 truncate max-w-[420px] font-normal">
            {subtitle}
          </p>
        </div>
      </div>

      {/* Droite : Recherche (Ctrl+K) + Réseau + École + Notifications + Profil */}
      <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
        
        {/* Recherche Globale Desktop (Ctrl+K) */}
        <button
          type="button"
          onClick={() => setShowSearch(true)}
          className="hidden md:flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-slate-200/80 bg-slate-50/70 hover:bg-slate-100/80 hover:border-slate-300 text-xs text-slate-500 hover:text-slate-800 transition-all shadow-2xs group"
          title="Recherche rapide (Ctrl+K)"
        >
          <Search size={14} className="text-slate-400 group-hover:text-emerald-600 transition-colors" />
          <span className="font-medium">
            {isEnseignant ? "Rechercher un élève…" : "Recherche rapide…"}
          </span>
          <kbd className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-md font-mono font-bold bg-white border border-slate-200 text-slate-600 shadow-2xs">
            Ctrl K
          </kbd>
        </button>

        {/* Bouton recherche mobile */}
        <button
          type="button"
          onClick={() => setShowSearch(true)}
          className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all md:hidden"
          aria-label="Rechercher"
        >
          <Search size={19} />
        </button>

        {/* Indicateur de connectivité réseau */}
        <NetworkStatusIndicator />

        {/* Badge École actif */}
        {schoolName && !isSuperAdmin && (
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 border border-slate-200/80 rounded-xl bg-slate-50/60 hover:bg-slate-100/70 transition-colors">
            <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex items-center justify-center shrink-0">
              <Building2 size={13} />
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[140px]">
                {schoolName}
              </p>
              {schoolCity && (
                <p className="text-[10px] text-slate-500 leading-tight truncate">
                  {schoolCity}
                </p>
              )}
            </div>
          </div>
        )}

        <div className="h-5 w-px bg-slate-200 hidden md:block" />

        {/* ── Centre de notifications ── */}
        <div className="relative" ref={notifRef}>
          <button 
            type="button"
            onClick={() => { setShowNotifs(!showNotifs); setShowProfileMenu(false) }}
            className={`relative p-2 rounded-xl transition-all ${
              showNotifs 
                ? 'bg-emerald-50 text-emerald-700' 
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
            aria-label="Notifications"
          >
            <Bell size={19} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[17px] h-[17px] bg-rose-500 text-white text-[9px] font-extrabold flex items-center justify-center rounded-full border-2 border-white leading-none px-1 animate-pulse shadow-xs">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          
          {showNotifs && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-[0_20px_50px_rgba(15,23,42,0.18)] border border-slate-200/80 z-50 overflow-hidden animate-dropdown">
              {/* Header */}
              <div className="p-4 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
                    <Bell size={14} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm leading-tight">Notifications</h3>
                    <p className="text-[11px] text-slate-500">
                      {unreadCount > 0 ? `${unreadCount} non lue${unreadCount > 1 ? 's' : ''}` : 'Toutes vos alertes'}
                    </p>
                  </div>
                </div>

                {unreadCount > 0 && (
                  <button 
                    type="button"
                    onClick={markAllAsRead} 
                    className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 hover:underline transition-colors"
                  >
                    <CheckCheck size={14} /> Tout marquer lu
                  </button>
                )}
              </div>

              {/* Filtres Toutes / Non lues */}
              <div className="flex border-b border-slate-100 px-3 pt-2 gap-2 text-xs font-semibold text-slate-500">
                <button
                  type="button"
                  onClick={() => setNotifFilter('all')}
                  className={`pb-2 px-2 border-b-2 transition-colors ${
                    notifFilter === 'all' 
                      ? 'border-emerald-600 text-emerald-700 font-bold' 
                      : 'border-transparent hover:text-slate-800'
                  }`}
                >
                  Toutes ({notifications.length})
                </button>
                <button
                  type="button"
                  onClick={() => setNotifFilter('unread')}
                  className={`pb-2 px-2 border-b-2 transition-colors ${
                    notifFilter === 'unread' 
                      ? 'border-emerald-600 text-emerald-700 font-bold' 
                      : 'border-transparent hover:text-slate-800'
                  }`}
                >
                  Non lues ({unreadCount})
                </button>
              </div>

              {/* Liste scrollable */}
              <div className="max-h-[360px] overflow-y-auto scrollbar-light divide-y divide-slate-100">
                {filteredNotifications.length === 0 ? (
                  <div className="p-10 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
                      <Bell size={22} />
                    </div>
                    <p className="text-sm font-semibold text-slate-700">Aucune notification</p>
                    <p className="text-xs text-slate-400 mt-1">Vous êtes parfaitement à jour.</p>
                  </div>
                ) : (
                  filteredNotifications.map(notif => (
                    <div 
                      key={notif.id} 
                      onClick={() => handleNotificationClick(notif)}
                      className={`p-3.5 hover:bg-slate-50 cursor-pointer transition-colors flex items-start gap-3 ${
                        notif.is_read ? 'opacity-70 bg-white' : 'bg-emerald-50/25'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                        notif.is_read ? 'bg-transparent' : 'bg-emerald-500 ring-2 ring-emerald-200'
                      }`} />
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs ${notif.is_read ? 'font-medium text-slate-700' : 'font-bold text-slate-900'}`}>
                          {notif.title}
                        </p>
                        <p className="text-xs text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">
                          {notif.message}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1.5">
                          {new Date(notif.created_at).toLocaleDateString('fr-FR', { 
                            day: 'numeric', 
                            month: 'short', 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Menu Profil Utilisateur ── */}
        <div className="relative" ref={profileRef}>
          <button 
            type="button"
            onClick={() => { setShowProfileMenu(!showProfileMenu); setShowNotifs(false) }}
            className={`flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl transition-all ${
              showProfileMenu 
                ? 'bg-slate-100 ring-2 ring-emerald-500/20' 
                : 'hover:bg-slate-100'
            }`}
            aria-label="Menu profil utilisateur"
          >
            {userAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img 
                src={userAvatar} 
                alt={userFullName} 
                className="w-8 h-8 rounded-lg object-cover object-top border border-slate-200 shrink-0" 
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-[#070b14] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                {userFullName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="hidden md:block text-left">
              <p className="text-xs font-bold text-slate-800 leading-tight max-w-[120px] truncate">
                {userFullName}
              </p>
              <p className="text-[10px] text-slate-500 leading-tight truncate">
                {userRoleLabel}
              </p>
            </div>
            <ChevronDown 
              size={14} 
              className={`text-slate-400 transition-transform duration-200 shrink-0 ${
                showProfileMenu ? 'rotate-180 text-emerald-600' : ''
              }`} 
            />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-[0_20px_50px_rgba(15,23,42,0.18)] border border-slate-200/80 z-50 overflow-hidden animate-dropdown">
              <div className="p-4 border-b border-slate-100 bg-slate-50/80 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                  {userFullName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-900 truncate leading-tight">{userFullName}</p>
                  <p className="text-xs font-semibold text-emerald-700 truncate mt-0.5">{userRoleLabel}</p>
                </div>
              </div>

              <div className="p-1.5 space-y-0.5">
                <Link 
                  href={isEnseignant ? "/enseignant/parametres" : isSuperAdmin ? "/super_admin" : "/admin/parametres/profil"}
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <User size={15} className="text-slate-400" />
                  <span>Mon profil personnel</span>
                </Link>

                {!isEnseignant && !isSuperAdmin && (
                  <>
                    <Link 
                      href="/admin/parametres"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                      <Settings size={15} className="text-slate-400" />
                      <span>Configuration école</span>
                    </Link>
                    <Link 
                      href="/admin/parametres/securite"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                      <Lock size={15} className="text-slate-400" />
                      <span>Sécurité & Accès</span>
                    </Link>
                    <Link 
                      href="/admin/parametres/journal"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                      <Shield size={15} className="text-slate-400" />
                      <span>Journal d&apos;activités</span>
                    </Link>
                  </>
                )}

                <div className="my-1.5 h-px bg-slate-100" />

                <form action={logout}>
                  <button 
                    type="submit" 
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors text-left"
                  >
                    <LogOut size={15} />
                    <span>Se déconnecter</span>
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Command Palette Modal */}
      <CommandPalette isOpen={showSearch} onClose={() => setShowSearch(false)} role={navVariant} />
    </header>
  )
}
