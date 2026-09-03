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
  Calculator,
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

const mainNavItems: NavItem[] = [
  { label: 'Tableau de bord', href: '/admin', icon: LayoutDashboard },
  { label: 'Élèves', href: '/admin/eleves', icon: Users, hasDropdown: true },
  { label: 'Classes', href: '/admin/classes', icon: Presentation },
  { label: 'Personnel', href: '/admin/personnel', icon: UserCircle },
  { 
    label: 'Finance', 
    href: '/admin/finance', 
    icon: CircleDollarSign, 
    hasDropdown: true,
    subItems: [
      { label: 'Tableau de bord', href: '/admin/finance' },
      { label: 'Caisse (Encaissement)', href: '/admin/finance/caisse' },
      { label: 'Échéances', href: '/admin/finance/echeances' },
      { label: 'Paiements', href: '/admin/finance/paiements' },
      { label: 'Impayés', href: '/admin/finance/impayes' },
      { label: 'Frais scolaires', href: '/admin/finance/frais' },
      { label: 'Rapports financiers', href: '/admin/finance/rapports' },
    ]
  },
  { 
    label: 'Académique', 
    href: '/admin/academique', 
    icon: BookOpen, 
    hasDropdown: true,
    subItems: [
      { label: 'Présences', href: '/admin/academique/presences' },
      { label: 'Devoirs', href: '/admin/academique/devoirs' },
      { label: 'Saisie des notes', href: '/admin/academique/notes' },
      { label: 'Bulletins & Livrets', href: '/admin/academique/bulletins' },
      { label: 'Matières', href: '/admin/academique/matieres' },
      { label: 'Emplois du temps', href: '/admin/academique/emplois' },
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
  { label: 'Paramètres', href: '/admin/parametres', icon: Settings, hasDropdown: true },
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
]

const superAdminNavItems: NavItem[] = [
  { label: 'Tableau de bord SaaS', href: '/super_admin', icon: LayoutDashboard },
  { label: 'Écoles (Clients)', href: '/super_admin/ecoles', icon: Users },
]

export function Sidebar({ userFullName, userRoleLabel, navVariant = 'admin', isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false)

  const NavGroup = ({ title, items }: { title: string, items: NavItem[] }) => (
    <div className="mb-2">
      <h3 className="px-4 text-[10px] font-bold text-[var(--color-sidebar-muted)] mb-1 uppercase tracking-wider">
        {title}
      </h3>
      <nav className="space-y-0.5">
        {items.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(`${item.href}/`))
          const Icon = item.icon
          return (
            <div key={item.href}>
              <Link 
                href={item.href}
                onClick={onClose}
                className={`flex items-center justify-between px-4 py-2 rounded-lg transition-colors duration-200 mx-2 ${
                  isActive 
                    ? 'bg-[var(--color-sidebar-active)] text-white font-semibold' 
                    : 'text-[var(--color-sidebar-text)] hover:bg-[var(--color-sidebar-hover)]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={18} className={isActive ? 'text-white' : 'text-[var(--color-sidebar-muted)]'} />
                  <span className="text-[13px]">{item.label}</span>
                </div>
                {item.hasDropdown && (
                  <ChevronDown size={16} className={isActive ? 'text-white' : 'text-[var(--color-sidebar-muted)]'} />
                )}
              </Link>
              {item.subItems && isActive && (
                <div className="ml-10 mt-1 space-y-1 border-l-2 border-[var(--color-sidebar-hover)] pl-2">
                  {item.subItems.map((subItem) => {
                    // For subitems, we need an exact match for the dashboard, and a startswith for the others
                    const isSubActive = (subItem.href === '/admin/finance' || subItem.href === '/admin/academique')
                      ? pathname === subItem.href 
                      : pathname.startsWith(subItem.href)
                    
                    return (
                      <Link
                        key={subItem.href}
                        href={subItem.href}
                        onClick={onClose}
                        className={`block px-3 py-1.5 rounded-md text-[11px] font-medium transition-colors ${
                          isSubActive
                            ? 'text-white bg-[var(--color-sidebar-hover)]'
                            : 'text-[var(--color-sidebar-muted)] hover:text-white hover:bg-[var(--color-sidebar-hover)]/50'
                        }`}
                      >
                        {subItem.label}
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

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}
      <aside className={`bg-[var(--color-sidebar-bg)] h-screen w-64 fixed left-0 top-0 flex flex-col pt-0 pb-0 mt-0 z-50 shadow-2xl overflow-hidden transition-transform duration-300 md:translate-x-0 bg-floating-waves ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        {/* Giant Faded Watermark (iziSAAS style) */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden pointer-events-none select-none z-0 h-64 flex items-end opacity-20">
          <h2 className="text-[100px] font-black leading-none text-white/10 tracking-tighter -ml-6 mb-[-15px] mix-blend-overlay transform -rotate-2">
            sco
            <br />
            gestia
          </h2>
        </div>
        {/* Logo */}
        <div className="mb-2 mt-0 pt-0 px-6 flex items-center justify-between" style={{ marginTop: '0px', paddingTop: '10px' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center overflow-hidden bg-white rounded-md p-1">
              <img src="/logo-scogestia-transparent.png" alt="Scogestia Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-wide">Scogestia</h1>
              <p className="text-[9px] text-[var(--color-sidebar-muted)] font-semibold tracking-widest uppercase">La gestion scolaire simplifiée</p>
            </div>
          </div>
          <button onClick={onClose} className="md:hidden text-white/70 hover:text-white">
            <X size={24} />
          </button>
        </div>
      
      {/* Navigation */}
      <div className="flex-1 relative z-10 overflow-y-auto custom-scrollbar pb-4">
        {navVariant === 'super_admin' ? (
          <NavGroup title="Menu Super Admin" items={superAdminNavItems} />
        ) : navVariant === 'enseignant' ? (
          <NavGroup title="Menu Enseignant" items={enseignantNavItems} />
        ) : (
          <>
            <NavGroup title="Menu Principal" items={mainNavItems} />
            <NavGroup title="Espaces par rôle" items={roleNavItems} />
          </>
        )}
      </div>

      {/* Help Block */}
      <div className="px-4 mt-auto pt-2 pb-2 relative z-10 shrink-0 border-t border-white/5">
        <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-xl p-2 text-center mb-2 transition-all hover:bg-white/10">
          <div className="flex justify-center mb-0.5">
            <Headset size={16} className="text-white/90" />
          </div>
          <h4 className="text-white font-semibold text-[11px] mb-1">Besoin d'aide ?</h4>
          <button 
            onClick={() => setIsSupportModalOpen(true)}
            className="w-full bg-[var(--color-sidebar-active)] text-white font-semibold text-[11px] py-1.5 px-3 rounded-lg flex items-center justify-center gap-2 hover:brightness-110 transition-all shadow-[0_0_15px_rgba(5,150,105,0.3)]"
          >
            Centre d'aide
          </button>
        </div>

        {/* Logout Button */}
        <form action={logout}>
          <button 
            type="submit" 
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-red-400/80 hover:text-red-400 hover:bg-red-500/10 transition-colors font-medium text-xs border border-transparent hover:border-red-500/20"
          >
            <LogOut size={16} />
            Déconnexion
          </button>
        </form>
      </div>
    </aside>
    
    <ContactSupportModal 
      isOpen={isSupportModalOpen} 
      onClose={() => setIsSupportModalOpen(false)} 
    />
    </>
  )
}
