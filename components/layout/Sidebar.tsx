'use client'

import Link from 'next/link'
import { useState } from 'react'
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
  CreditCard
} from 'lucide-react'
import { logout } from '@/app/actions/auth'
import { ContactSupportModal } from './ContactSupportModal'

export type NavItem = {
  label: string
  href: string
  icon: any
  hasDropdown?: boolean
  subItems?: { label: string, href: string }[]
}

export type SidebarProps = {
  userFullName?: string
  userRoleLabel?: string
  navVariant?: 'admin' | 'enseignant' | 'super_admin'
  isOpen?: boolean
  onClose?: () => void
}

// ── Nav items définis HORS du composant (évite re-création à chaque render) ──

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
      { label: 'Matières', href: '/admin/academique/matieres' },
      { label: 'Emplois du temps', href: '/admin/academique/emplois' },
      { label: 'Présences', href: '/admin/academique/presences' },
      { label: 'Devoirs', href: '/admin/academique/devoirs' },
      { label: 'Saisie des notes', href: '/admin/academique/notes' },
      { label: 'Bulletins & Livrets', href: '/admin/academique/bulletins' },
    ]
  },
  { label: 'Communication', href: '/admin/communication', icon: MessageSquare },
  { 
    label: 'Rapports', 
    href: '/admin/rapports', 
    icon: FileText, 
    hasDropdown: true,
    subItems: [
      { label: 'Rapport global', href: '/admin/rapports' },
      { label: 'Rapports académiques', href: '/admin/rapports/academique' },
      { label: 'Bilans financiers', href: '/admin/rapports/finance' }
    ]
  },
  { label: 'Abonnement', href: '/admin/abonnement', icon: CreditCard },
  { label: 'Paramètres', href: '/admin/parametres', icon: Settings },
]

const roleNavItems: NavItem[] = [
  { label: 'Espace Enseignant', href: '/enseignant', icon: GraduationCap },
  { label: 'Espace Parent', href: '/parent', icon: Users },
]

const enseignantNavItems: NavItem[] = [
  { label: 'Tableau de bord', href: '/enseignant', icon: LayoutDashboard },
  { label: 'Emploi du temps', href: '/enseignant/planning', icon: Calendar },
  { label: 'Notes', href: '/enseignant/notes', icon: GraduationCap },
  { label: 'Présences', href: '/enseignant/presences', icon: ShieldCheck },
  { label: 'Devoirs', href: '/enseignant/devoirs', icon: BookOpen },
  { label: 'Messages', href: '/enseignant/messages', icon: MessageSquare },
]

const superAdminNavItems: NavItem[] = [
  { label: 'Tableau de bord SaaS', href: '/super_admin', icon: LayoutDashboard },
  { label: 'Écoles (Clients)', href: '/super_admin/ecoles', icon: Users },
]

// ── Composant NavGroup défini HORS de Sidebar ──

type NavGroupProps = {
  title: string
  items: NavItem[]
  pathname: string
  openDropdowns: Record<string, boolean>
  onToggleDropdown: (href: string) => void
  onClose?: () => void
}

function NavGroup({ title, items, pathname, openDropdowns, onToggleDropdown, onClose }: NavGroupProps) {
  return (
    <div className="mb-4">
      <h3 className="px-4 text-[10px] font-bold text-[var(--color-sidebar-muted)] mb-2 uppercase tracking-[0.12em]">
        {title}
      </h3>
      <nav className="space-y-0.5">
        {items.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/admin' && item.href !== '/enseignant' && item.href !== '/super_admin' && pathname.startsWith(`${item.href}/`))
          const isOpen = openDropdowns[item.href] ?? isActive
          const Icon = item.icon

          return (
            <div key={item.href}>
              {item.hasDropdown ? (
                /* Pour les items avec dropdown : bouton pour toggle + link */
                <button
                  onClick={() => onToggleDropdown(item.href)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg transition-all duration-200 mx-2 text-left group ${
                    isActive 
                      ? 'bg-[var(--color-sidebar-active)] text-white font-semibold' 
                      : 'text-[var(--color-sidebar-text)] hover:bg-[var(--color-sidebar-hover)]'
                  }`}
                  style={{ width: 'calc(100% - 1rem)' }}
                >
                  <div className="flex items-center gap-3">
                    <Icon 
                      size={18} 
                      className={`flex-shrink-0 transition-colors ${isActive ? 'text-white' : 'text-[var(--color-sidebar-muted)] group-hover:text-white/70'}`} 
                    />
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                  <ChevronDown 
                    size={14} 
                    className={`flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : 'rotate-0'} ${isActive ? 'text-white' : 'text-[var(--color-sidebar-muted)]'}`} 
                  />
                </button>
              ) : (
                <Link 
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center justify-between px-4 py-2.5 rounded-lg transition-all duration-200 mx-2 group ${
                    isActive 
                      ? 'bg-[var(--color-sidebar-active)] text-white font-semibold' 
                      : 'text-[var(--color-sidebar-text)] hover:bg-[var(--color-sidebar-hover)]'
                  }`}
                  style={{ display: 'flex', marginLeft: '0.5rem', marginRight: '0.5rem', borderRadius: '0.5rem' }}
                >
                  <div className="flex items-center gap-3">
                    <Icon 
                      size={18} 
                      className={`flex-shrink-0 transition-colors ${isActive ? 'text-white' : 'text-[var(--color-sidebar-muted)] group-hover:text-white/70'}`} 
                    />
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                  {/* Indicateur actif */}
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-white/70 flex-shrink-0" />
                  )}
                </Link>
              )}

              {/* Sous-menu */}
              {item.subItems && isOpen && (
                <div className="ml-9 mt-0.5 mb-1 space-y-0.5 border-l border-white/8 pl-3">
                  {item.subItems.map((subItem) => {
                    const isSubActive = (subItem.href === '/admin/finance' || subItem.href === '/admin/academique' || subItem.href === '/admin/rapports')
                      ? pathname === subItem.href 
                      : pathname.startsWith(subItem.href)
                    
                    return (
                      <Link
                        key={subItem.href}
                        href={subItem.href}
                        onClick={onClose}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-[12.5px] font-medium transition-all duration-150 ${
                          isSubActive
                            ? 'text-white bg-white/10'
                            : 'text-[var(--color-sidebar-muted)] hover:text-white hover:bg-white/5'
                        }`}
                      >
                        {isSubActive && (
                          <span className="w-1 h-1 rounded-full bg-[var(--color-sidebar-active)] flex-shrink-0" />
                        )}
                        <span className={isSubActive ? '' : 'ml-3'}>{subItem.label}</span>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>
    </div>
  )
}

// ── Composant principal Sidebar ──

export function Sidebar({ userFullName, userRoleLabel, navVariant = 'admin', isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false)

  // État indépendant pour chaque dropdown (permet l'ouverture manuelle)
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>(() => {
    // Initialise les dropdowns ouverts selon la route courante
    const initial: Record<string, boolean> = {}
    const allItems = [...mainNavItems, ...enseignantNavItems, ...superAdminNavItems]
    allItems.forEach(item => {
      if (item.hasDropdown && item.href !== '/admin' && pathname.startsWith(item.href)) {
        initial[item.href] = true
      }
    })
    return initial
  })

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
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <aside className={`bg-[var(--color-sidebar-bg)] h-screen w-64 fixed left-0 top-0 flex flex-col py-4 z-50 shadow-2xl overflow-hidden transition-transform duration-300 ease-in-out md:translate-x-0 bg-floating-waves ${isOpen ? 'translate-x-0' : 'max-md:-translate-x-full'}`}>
        
        {/* ── Logo ── */}
        <div className="mb-5 px-5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 flex items-center justify-center overflow-hidden rounded-xl p-0 bg-white/5 border border-white/10">
              <img src="/logo-scogestia-transparent.png" alt="Scogestia Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-[17px] font-bold text-white tracking-wide leading-tight">Scogestia</h1>
              <p className="text-[9px] text-[var(--color-sidebar-muted)] font-semibold tracking-widest uppercase leading-tight mt-0.5">Gestion scolaire</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="md:hidden text-white/50 hover:text-white transition-colors p-1 rounded hover:bg-white/10"
          >
            <X size={20} />
          </button>
        </div>

        {/* ── Navigation ── */}
        <div className="flex-1 relative z-10 overflow-y-auto custom-scrollbar pb-2 px-1">
          {navVariant === 'super_admin' ? (
            <NavGroup 
              title="Menu Super Admin" 
              items={superAdminNavItems}
              pathname={pathname}
              openDropdowns={openDropdowns}
              onToggleDropdown={handleToggleDropdown}
              onClose={onClose}
            />
          ) : navVariant === 'enseignant' ? (
            <NavGroup 
              title="Menu Enseignant" 
              items={enseignantNavItems}
              pathname={pathname}
              openDropdowns={openDropdowns}
              onToggleDropdown={handleToggleDropdown}
              onClose={onClose}
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
              />
              <NavGroup 
                title="Espaces par rôle" 
                items={roleNavItems}
                pathname={pathname}
                openDropdowns={openDropdowns}
                onToggleDropdown={handleToggleDropdown}
                onClose={onClose}
              />
            </>
          )}
        </div>

        {/* ── Footer : Utilisateur + Actions ── */}
        <div className="mt-auto pt-3 flex-shrink-0 relative z-10">
          {/* Séparateur */}
          <div className="mx-4 mb-3 h-px bg-white/8" />

          {/* Profil utilisateur */}
          {userFullName && (
            <div className="mx-3 mb-2 px-3 py-2.5 rounded-xl bg-white/5 border border-white/8 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[var(--color-sidebar-active)]/30 border border-[var(--color-sidebar-active)]/40 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-emerald-300">{initials}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white truncate leading-tight">{userFullName}</p>
                <p className="text-[10px] text-[var(--color-sidebar-muted)] truncate leading-tight">{userRoleLabel}</p>
              </div>
            </div>
          )}

          {/* Boutons action */}
          <div className="px-3 space-y-0.5 pb-4">
            <button 
              onClick={() => setIsSupportModalOpen(true)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-blue-400/80 hover:text-blue-300 hover:bg-blue-500/10 transition-all duration-200 text-sm font-medium group"
            >
              <Headset size={16} className="flex-shrink-0 group-hover:scale-110 transition-transform" />
              Centre d'aide
            </button>

            <form action={logout}>
              <button 
                type="submit" 
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 text-sm font-medium group"
              >
                <LogOut size={16} className="flex-shrink-0 group-hover:scale-110 transition-transform" />
                Déconnexion
              </button>
            </form>
          </div>
        </div>
      </aside>
    
      <ContactSupportModal 
        isOpen={isSupportModalOpen} 
        onClose={() => setIsSupportModalOpen(false)} 
      />
    </>
  )
}
