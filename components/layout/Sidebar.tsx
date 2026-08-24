'use client'

import Link from 'next/link'
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
  LogOut
} from 'lucide-react'
import { logout } from '@/app/actions/auth'

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
  navItems?: NavItem[]
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
  { label: 'Rapports', href: '/admin/rapports', icon: FileText, hasDropdown: true },
  { label: 'Paramètres', href: '/admin/parametres', icon: Settings, hasDropdown: true },
]

const roleNavItems: NavItem[] = [
  { label: 'Espace Enseignant', href: '/enseignant', icon: GraduationCap },
  { label: 'Espace Parent', href: '/parent', icon: Users },
]

export function Sidebar({ userFullName, userRoleLabel, navItems, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()

  const NavGroup = ({ title, items }: { title: string, items: NavItem[] }) => (
    <div className="mb-6">
      <h3 className="px-4 text-xs font-semibold text-[var(--color-sidebar-muted)] mb-3 uppercase tracking-wider">
        {title}
      </h3>
      <nav className="space-y-1">
        {items.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(`${item.href}/`))
          const Icon = item.icon
          return (
            <div key={item.href}>
              <Link 
                href={item.href}
                className={`flex items-center justify-between px-4 py-2.5 rounded-lg transition-colors duration-200 mx-2 ${
                  isActive 
                    ? 'bg-[var(--color-sidebar-active)] text-white font-semibold' 
                    : 'text-[var(--color-sidebar-text)] hover:bg-[var(--color-sidebar-hover)]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={20} className={isActive ? 'text-white' : 'text-[var(--color-sidebar-muted)]'} />
                  <span className="text-sm">{item.label}</span>
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
                        className={`block px-3 py-2 rounded-md text-xs font-medium transition-colors ${
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
      <aside className={`bg-[var(--color-sidebar-bg)] h-screen w-64 fixed left-0 top-0 flex flex-col py-6 z-50 shadow-lg overflow-y-auto custom-scrollbar transition-transform duration-300 md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Logo */}
        <div className="mb-8 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center overflow-hidden bg-white rounded-md p-1">
              <img src="/logo.png" alt="Scogestia Logo" className="w-full h-full object-contain" />
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
      <div className="flex-1">
        {navItems && navItems.length > 0 ? (
          <NavGroup title="Menu Enseignant" items={navItems} />
        ) : (
          <>
            <NavGroup title="Menu Principal" items={mainNavItems} />
            <NavGroup title="Espaces par rôle" items={roleNavItems} />
          </>
        )}
      </div>

      {/* Help Block */}
      <div className="px-4 mt-auto pb-4">
        <div className="bg-[var(--color-sidebar-hover)] rounded-xl p-4 text-center mb-4">
          <div className="flex justify-center mb-2">
            <Headset size={24} className="text-white" />
          </div>
          <h4 className="text-white font-semibold text-sm mb-1">Besoin d'aide ?</h4>
          <p className="text-[var(--color-sidebar-muted)] text-xs mb-4 leading-tight">
            Consultez notre centre d'aide ou contactez le support.
          </p>
          <button className="w-full bg-white text-[var(--color-sidebar-bg)] font-semibold text-sm py-2 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors">
            Centre d'aide
          </button>
        </div>

        {/* Logout Button */}
        <form action={logout}>
          <button 
            type="submit" 
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-red-400 hover:text-white hover:bg-red-500/20 transition-colors font-medium text-sm"
          >
            <LogOut size={20} />
            Déconnexion
          </button>
        </form>
      </div>
    </aside>
    </>
  )
}
