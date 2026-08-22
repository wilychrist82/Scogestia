'use client'

import { usePathname } from 'next/navigation'
import { Menu, Bell, ChevronDown, Calendar } from 'lucide-react'
import { logout } from '@/app/actions/auth'

export function TopHeader({ userFullName, userRoleLabel, onMenuClick }: { userFullName: string, userRoleLabel: string, onMenuClick?: () => void }) {
  const pathname = usePathname()
  
  const getPageInfo = () => {
    if (pathname.includes('/parametres')) return { title: 'Paramètres', subtitle: 'Gérez la configuration de votre établissement.' }
    if (pathname.includes('/personnel')) return { title: 'Personnel', subtitle: 'Gérez le personnel administratif et enseignant.' }
    if (pathname.includes('/eleves')) return { title: 'Élèves', subtitle: 'Gérez les élèves de votre établissement.' }
    if (pathname.includes('/classes')) return { title: 'Classes', subtitle: 'Gérez les classes de votre établissement.' }
    if (pathname.includes('/finance')) return { title: 'Finance', subtitle: 'Gérez les paiements et les finances.' }
    if (pathname.includes('/academique')) return { title: 'Académique', subtitle: 'Gérez les notes et bulletins.' }
    if (pathname.includes('/communication')) return { title: 'Communication', subtitle: 'Gérez la communication avec les parents.' }
    if (pathname.includes('/rapports')) return { title: 'Rapports', subtitle: 'Consultez les rapports et statistiques.' }
    return { title: 'Tableau de bord', subtitle: `Bienvenue, ${userFullName.split(' ')[0]} ! Voici un aperçu de votre école aujourd'hui.` }
  }

  const { title, subtitle } = getPageInfo()

  return (
    <header className="bg-white h-[72px] border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-10 w-full shadow-sm">
      <div className="flex items-center gap-4">
        <button onClick={onMenuClick} className="text-gray-400 hover:text-gray-700 transition-colors md:hidden">
          <Menu size={24} />
        </button>
        <div className="hidden md:flex items-start gap-4">
          <button className="text-gray-400 hover:text-gray-700 transition-colors mt-1">
            <Menu size={20} />
          </button>
          <div>
            <h2 className="text-xl font-bold text-gray-900 leading-none">{title}</h2>
            <p className="text-sm text-gray-500 mt-1.5">{subtitle}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        {/* School Selector */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-900 leading-tight">École La Réussite</p>
            <p className="text-[11px] text-gray-500">Lomé, Togo</p>
          </div>
          <ChevronDown size={14} className="text-gray-400 ml-1" />
        </div>

        <div className="h-8 w-px bg-gray-200 hidden lg:block"></div>

        {/* Notifications */}
        <button className="relative p-2 text-gray-500 hover:text-[var(--color-primary)] transition-colors rounded-full hover:bg-gray-100">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white leading-none">5</span>
        </button>

        {/* Profile */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[var(--color-sidebar-bg)] flex items-center justify-center text-white font-bold overflow-hidden border border-gray-200">
            {userFullName.charAt(0).toUpperCase()}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-bold text-gray-900 leading-tight">{userFullName}</p>
            <p className="text-[11px] text-gray-500">{userRoleLabel}</p>
          </div>
          <form action={logout}>
            <button title="Se déconnecter" type="submit" className="ml-2 p-2 text-gray-500 hover:text-red-600 transition-colors rounded-full hover:bg-red-50">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            </button>
          </form>
        </div>
      </div>
    </header>
  )
}
