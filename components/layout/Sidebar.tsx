'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Users, 
  Presentation, 
  UserCircle, 
  CircleDollarSign, 
  BookOpen, 
  MessageSquare, 
  FileText, 
  Settings, 
  GraduationCap, 
  Headset, 
  ChevronDown, 
  ShieldCheck, 
  X, 
  LogOut, 
  Calendar, 
  CreditCard, 
  Lock,
  Activity,
  UserCheck,
  Megaphone,
  History,
  ShieldAlert,
  UserCog
} from 'lucide-react'
import { logout } from '@/app/actions/auth'
import { ContactSupportModal } from './ContactSupportModal'
import { useNotifications } from '@/components/providers/NotificationProvider'

export type NavItem = {
  label: string
  href: string
  icon: any
  hasDropdown?: boolean
  subItems?: { label: string, href: string, icon?: any }[]
}

export type SidebarProps = {
  userFullName?: string
  userRoleLabel?: string
  navVariant?: 'admin' | 'enseignant' | 'super_admin'
  isOpen?: boolean
  onClose?: () => void
  isExpired?: boolean
  isSuperAdmin?: boolean
}

// ── Nav items exhaustifs et professionnels ──

const mainNavItems: NavItem[] = [
  { label: 'Tableau de bord', href: '/admin', icon: LayoutDashboard },
  { label: 'Classes', href: '/admin/classes', icon: Presentation },
  { label: 'Élèves', href: '/admin/eleves', icon: Users },
  { label: 'Personnel', href: '/admin/personnel', icon: UserCircle },
  { 
    label: 'Finance', 
    href: '/admin/finance', 
    icon: CircleDollarSign, 
    hasDropdown: true,
    subItems: [
      { label: 'Tableau de bord', href: '/admin/finance' },
      { label: 'Frais scolaires', href: '/admin/finance/frais' },
      { label: 'Échéances', href: '/admin/finance/echeances' },
      { label: 'Caisse (Encaissements)', href: '/admin/finance/caisse' },
      { label: 'Paiements', href: '/admin/finance/paiements' },
      { label: 'Impayés', href: '/admin/finance/impayes' },
      { label: 'Rapports financiers', href: '/admin/finance/rapports' },
    ]
  },
  { 
    label: 'Académique', 
    href: '/admin/academique', 
    icon: BookOpen, 
    hasDropdown: true,
    subItems: [
      { label: 'Surveillance des notes', href: '/admin/academique/surveillance' },
      { label: 'Matières', href: '/admin/academique/matieres' },
      { label: 'Emplois du temps', href: '/admin/academique/emplois' },
      { label: 'Présences', href: '/admin/academique/presences' },
      { label: 'Devoirs', href: '/admin/academique/devoirs' },
      { label: 'Saisie des notes', href: '/admin/academique/notes' },
      { label: 'Bulletins & Livrets', href: '/admin/academique/bulletins' },
      { label: 'Promotion fin d\'année', href: '/admin/academique/promotion' },
    ]
  },
  { label: 'Communication', href: '/admin/communication', icon: MessageSquare },
  { label: 'Rapports', href: '/admin/rapports', icon: FileText },
  { label: 'Abonnement', href: '/admin/abonnement', icon: CreditCard },
  { label: 'Paramètres', href: '/admin/parametres', icon: Settings },
]

const enseignantNavItems: NavItem[] = [
  { label: 'Tableau de bord', href: '/enseignant', icon: LayoutDashboard },
  { label: 'Emploi du temps', href: '/enseignant/planning', icon: Calendar },
  { label: 'Notes', href: '/enseignant/notes', icon: GraduationCap },
  { label: 'Présences', href: '/enseignant/presences', icon: UserCheck },
  { label: 'Devoirs', href: '/enseignant/devoirs', icon: BookOpen },
  { label: 'Messages', href: '/enseignant/messages', icon: MessageSquare },
  { label: 'Paramètres', href: '/enseignant/parametres', icon: Settings },
]

const superAdminNavItems: NavItem[] = [
  { label: 'Tableau de bord SaaS', href: '/super_admin', icon: LayoutDashboard },
  { label: 'Écoles (Clients)', href: '/super_admin/ecoles', icon: Users },
  { label: 'Santé système', href: '/super_admin/health', icon: Activity },
]

// ── Composant NavGroup avec animations fluides ──

type NavGroupProps = {
  title: string
  items: NavItem[]
  pathname: string
  openDropdowns: Record<string, boolean>
  onToggleDropdown: (href: string) => void
  onClose?: () => void
  isExpired?: boolean
  unreadCount?: number
}

function NavGroup({ title, items, pathname, openDropdowns, onToggleDropdown, onClose, isExpired, unreadCount = 0 }: NavGroupProps) {
  return (
    <div className="mb-5">
      <div className="px-4 mb-2 flex items-center justify-between">
        <h3 className="text-[10px] font-bold text-slate-400/80 uppercase tracking-[0.14em]">
          {title}
        </h3>
      </div>
      <nav className="space-y-1">
        {items.map((item) => {
          const isExact = pathname === item.href
          const isChildActive = Boolean(item.subItems?.some(s => pathname === s.href || (s.href !== item.href && pathname.startsWith(`${s.href}/`))))
          const isActive = isExact || (item.href !== '/admin' && item.href !== '/enseignant' && item.href !== '/super_admin' && (pathname.startsWith(`${item.href}/`) || isChildActive))
          const isOpen = openDropdowns[item.href] ?? isActive
          const Icon = item.icon
          const isAbonnement = item.href === '/admin/abonnement'
          const isLocked = Boolean(isExpired && !isAbonnement)

          return (
            <div key={item.href} className="px-2">
              {item.hasDropdown ? (
                <div>
                  <button
                    type="button"
                    onClick={() => onToggleDropdown(item.href)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 text-left group ${
                      isActive 
                        ? 'bg-emerald-500/15 text-emerald-300 font-semibold border border-emerald-500/30 shadow-[0_2px_12px_rgba(5,150,105,0.15)]' 
                        : isLocked
                          ? 'text-slate-400 opacity-60 hover:bg-white/[0.04]'
                          : 'text-slate-300 hover:text-white hover:bg-white/[0.06]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`p-1.5 rounded-lg transition-colors ${
                        isActive 
                          ? 'bg-emerald-500/20 text-emerald-300' 
                          : 'text-slate-400 group-hover:text-white group-hover:bg-white/[0.08]'
                      }`}>
                        <Icon size={17} className="flex-shrink-0" />
                      </div>
                      <span className="text-sm font-medium tracking-tight truncate">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {item.href === '/admin/communication' && unreadCount > 0 && (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-rose-500 text-white min-w-[18px] h-[18px] flex items-center justify-center animate-pulse shadow-sm">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                      {isLocked && <Lock size={12} className="text-amber-400 shrink-0" />}
                      <div className={`p-0.5 rounded transition-transform duration-300 ${isOpen ? 'rotate-180 text-emerald-300' : 'text-slate-400 group-hover:text-white'}`}>
                        <ChevronDown size={14} />
                      </div>
                    </div>
                  </button>

                  {/* Sous-menu avec guide vertical */}
                  {isOpen && item.subItems && (
                    <div className="mt-1 ml-5 pl-3 border-l-2 border-emerald-500/20 space-y-0.5 py-0.5 transition-all">
                      {item.subItems.map((subItem) => {
                        const isSubActive = pathname === subItem.href || (subItem.href !== item.href && pathname.startsWith(`${subItem.href}/`))

                        return (
                          <Link
                            key={subItem.href}
                            href={subItem.href}
                            onClick={onClose}
                            className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 group ${
                              isSubActive
                                ? 'text-white bg-white/[0.12] font-semibold shadow-xs'
                                : isLocked
                                  ? 'text-slate-400 opacity-60 hover:text-slate-200'
                                  : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className={`w-1.5 h-1.5 rounded-full transition-all flex-shrink-0 ${
                                isSubActive 
                                  ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)] scale-110' 
                                  : 'bg-slate-600 group-hover:bg-slate-400'
                              }`} />
                              <span className="truncate">{subItem.label}</span>
                            </div>
                            {isLocked && <Lock size={10} className="text-amber-400/80 shrink-0 ml-1" />}
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <Link 
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                    isActive 
                      ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-semibold shadow-[0_4px_18px_rgba(5,150,105,0.35)]' 
                      : isAbonnement && isExpired
                        ? 'bg-rose-500/20 text-rose-200 border border-rose-500/40 hover:bg-rose-500/30'
                        : isLocked
                          ? 'text-slate-400 opacity-60 hover:bg-white/[0.04]'
                          : 'text-slate-300 hover:text-white hover:bg-white/[0.06]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-1.5 rounded-lg transition-colors ${
                      isActive 
                        ? 'bg-white/20 text-white' 
                        : isAbonnement && isExpired 
                          ? 'text-rose-400' 
                          : 'text-slate-400 group-hover:text-white group-hover:bg-white/[0.08]'
                    }`}>
                      <Icon size={17} className="flex-shrink-0" />
                    </div>
                    <span className="text-sm font-medium tracking-tight truncate">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {(item.href === '/enseignant/messages' || item.href === '/admin/communication') && unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-rose-500 text-white min-w-[18px] h-[18px] flex items-center justify-center animate-pulse shadow-sm">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                    {isAbonnement && isExpired && (
                      <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-rose-500 text-white animate-pulse">
                        Requis
                      </span>
                    )}
                    {isLocked && <Lock size={12} className="text-amber-400 shrink-0" />}
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-white flex-shrink-0 shadow-[0_0_6px_rgba(255,255,255,0.8)]" />
                    )}
                  </div>
                </Link>
              )}
            </div>
          )
        })}
      </nav>
    </div>
  )
}

// ── Composant principal Sidebar ──

export function Sidebar({ userFullName, userRoleLabel, navVariant = 'admin', isOpen, onClose, isExpired, isSuperAdmin = false }: SidebarProps) {
  const pathname = usePathname()
  const { unreadCount } = useNotifications()
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false)

  const currentRoleNavItems: NavItem[] = [
    ...(isSuperAdmin ? [{ label: 'Cockpit Super Admin', href: '/super_admin', icon: ShieldCheck }] : []),
    { label: 'Espace Enseignant', href: '/enseignant', icon: GraduationCap },
    { label: 'Espace Parent', href: '/parent', icon: Users },
  ]

  // État des dropdowns avec auto-expansion intelligente sur changement d'URL
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    const allItems = [...mainNavItems, ...enseignantNavItems, ...superAdminNavItems]
    allItems.forEach(item => {
      if (item.hasDropdown && pathname.startsWith(item.href)) {
        initial[item.href] = true
      }
    })
    return initial
  })

  // Synchronise automatiquement l'ouverture des sous-menus lorsqu'on navigue
  useEffect(() => {
    const allItems = [...mainNavItems, ...enseignantNavItems, ...superAdminNavItems]
    allItems.forEach(item => {
      if (item.hasDropdown && pathname.startsWith(item.href)) {
        setOpenDropdowns(prev => ({ ...prev, [item.href]: true }))
      }
    })
  }, [pathname])

  const handleToggleDropdown = (href: string) => {
    setOpenDropdowns(prev => ({ ...prev, [href]: !prev[href] }))
  }

  // Initiales utilisateur pour l'avatar
  const getInitials = (name?: string) => {
    if (!name) return '?'
    const parts = name.trim().split(' ')
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    return name.substring(0, 2).toUpperCase()
  }

  const initials = getInitials(userFullName)

  return (
    <>
      {/* Overlay mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/70 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside className={`bg-[#070b14] h-screen w-64 fixed left-0 top-0 flex flex-col py-4 z-50 border-r border-white/[0.08] shadow-[0_0_35px_rgba(0,0,0,0.5)] overflow-hidden transition-transform duration-300 ease-in-out md:translate-x-0 ${isOpen ? 'translate-x-0' : 'max-md:-translate-x-full'}`}>
        
        {/* Glow ambient subtil en fond */}
        <div className="pointer-events-none absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-emerald-500/10 via-transparent to-transparent" />
        
        {/* ── Logo & En-tête de marque ── */}
        <div className="mb-4 px-5 flex items-center justify-between flex-shrink-0 relative z-10">
          <Link href="/admin" className="flex items-center gap-3 group">
            <div className="w-10 h-10 flex items-center justify-center overflow-hidden rounded-xl bg-white/5 border border-white/10 p-1 group-hover:border-emerald-500/40 transition-colors shadow-inner">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-scogestia-transparent.png" alt="Scogestia Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-[17px] font-bold text-white tracking-tight leading-tight">Scogestia</h1>
                <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-400/10 text-emerald-300 border border-emerald-400/20">
                  ERP
                </span>
              </div>
              <p className="text-[9.5px] text-slate-400 font-medium tracking-wider uppercase leading-tight mt-0.5">
                Gestion scolaire
              </p>
            </div>
          </Link>

          <button 
            onClick={onClose} 
            className="md:hidden text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
            aria-label="Fermer le menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* ── Navigation avec défilement ultra-fluide ── */}
        <div className="flex-1 relative z-10 overflow-y-auto custom-scrollbar pb-3 px-1">
          {navVariant === 'super_admin' ? (
            <NavGroup 
              title="Menu Super Admin" 
              items={superAdminNavItems}
              pathname={pathname}
              openDropdowns={openDropdowns}
              onToggleDropdown={handleToggleDropdown}
              onClose={onClose}
              unreadCount={unreadCount}
            />
          ) : navVariant === 'enseignant' ? (
            <NavGroup 
              title="Menu Enseignant" 
              items={enseignantNavItems}
              pathname={pathname}
              openDropdowns={openDropdowns}
              onToggleDropdown={handleToggleDropdown}
              onClose={onClose}
              isExpired={isExpired}
              unreadCount={unreadCount}
            />
          ) : (
            <>
              <NavGroup 
                title="Menu Principal" 
                items={mainNavItems}
                pathname={pathname}
                openDropdowns={openDropdowns}
                onToggleDropdown={handleToggleDropdown}
                onClose={onClose}
                isExpired={isExpired}
                unreadCount={unreadCount}
              />
              <NavGroup 
                title="Espaces connectés" 
                items={currentRoleNavItems}
                pathname={pathname}
                openDropdowns={openDropdowns}
                onToggleDropdown={handleToggleDropdown}
                onClose={onClose}
                isExpired={isExpired}
                unreadCount={unreadCount}
              />
            </>
          )}
        </div>

        {/* ── Footer : Carte Profil + Actions ── */}
        <div className="mt-auto pt-3 flex-shrink-0 relative z-10 border-t border-white/[0.08]">
          {/* Carte Utilisateur */}
          {userFullName && (
            <div className="mx-3 mb-2 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center gap-3 hover:bg-white/[0.07] transition-colors">
              <div className="relative">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-emerald-300">{initials}</span>
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#070b14]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-white truncate leading-tight">{userFullName}</p>
                <p className="text-[10px] text-slate-400 truncate leading-tight mt-0.5">{userRoleLabel || 'Membre école'}</p>
              </div>
            </div>
          )}

          {/* Boutons d'action */}
          <div className="px-3 space-y-1 pb-4 md:pb-1">
            <button 
              type="button"
              onClick={() => setIsSupportModalOpen(true)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sky-400 hover:text-sky-300 hover:bg-sky-500/10 transition-all duration-200 text-xs font-medium group"
            >
              <Headset size={15} className="flex-shrink-0 group-hover:scale-110 transition-transform" />
              <span>Assistance & Support</span>
            </button>

            <form action={logout}>
              <button 
                type="submit" 
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-400/80 hover:text-rose-300 hover:bg-rose-500/10 transition-all duration-200 text-xs font-medium group"
              >
                <LogOut size={15} className="flex-shrink-0 group-hover:scale-110 transition-transform" />
                <span>Déconnexion</span>
              </button>
            </form>
          </div>
          
          <div className="h-4 md:hidden" />
        </div>
      </aside>
    
      <ContactSupportModal 
        isOpen={isSupportModalOpen} 
        onClose={() => setIsSupportModalOpen(false)} 
      />
    </>
  )
}
