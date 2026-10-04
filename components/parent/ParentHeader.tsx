'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useNotifications } from '@/components/providers/NotificationProvider'
import { Bell, CheckCheck, LogOut, Settings, UserPlus, ChevronDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { LinkChildModal } from './LinkChildModal'

export function ParentHeader({ fullName, userAvatar }: { fullName: string, userAvatar?: string | null }) {
  const router = useRouter()
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()
  const [showNotifs, setShowNotifs] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showLinkChildModal, setShowLinkChildModal] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)

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

  const handleNotificationClick = async (notif: any) => {
    if (!notif.is_read) {
      await markAsRead(notif.id)
    }
    setShowNotifs(false)
    
    if (notif.type === 'message') {
      router.push('/parent/messages')
    }
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/connexion')
    router.refresh()
  }

  const initials = fullName
    ? fullName.split(' ').map(n => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
    : 'P'

  return (
    <header 
      className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white flex items-center justify-between px-4 sticky top-0 z-50 shadow-md border-b border-white/10"
      style={{
        paddingTop: 'max(0.6rem, env(safe-area-inset-top))',
        paddingBottom: '0.6rem',
        minHeight: 'calc(3.8rem + env(safe-area-inset-top))'
      }}
    >
      {/* Profil parent & switcher menu */}
      <div className="relative" ref={profileRef}>
        <button 
          type="button"
          onClick={() => setShowProfileMenu(!showProfileMenu)}
          className="flex items-center text-left focus:outline-none p-1.5 rounded-xl hover:bg-white/10 transition-colors gap-2.5 group"
        >
          {userAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img 
              src={userAvatar} 
              alt={fullName} 
              className="w-9 h-9 rounded-xl object-cover border border-white/20 shadow-xs" 
            />
          ) : (
            <div className="w-9 h-9 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center font-bold text-sm text-emerald-200 shadow-xs">
              {initials}
            </div>
          )}
          <div className="flex flex-col text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-sm sm:text-base font-bold tracking-tight truncate max-w-[150px] sm:max-w-[210px] leading-tight text-white">
                {fullName}
              </span>
              <ChevronDown size={14} className={`text-white/60 transition-transform duration-200 group-hover:text-white ${showProfileMenu ? 'rotate-180' : ''}`} />
            </div>
            <span className="text-[9.5px] font-bold text-emerald-300 uppercase tracking-widest leading-tight mt-0.5">
              Espace Famille
            </span>
          </div>
        </button>

        {showProfileMenu && (
          <div className="absolute left-0 mt-2 w-60 bg-white rounded-2xl shadow-[0_20px_50px_rgba(15,23,42,0.2)] border border-slate-200/80 z-50 overflow-hidden animate-dropdown">
            <div className="p-4 border-b border-slate-100 bg-slate-50/80">
              <p className="text-sm font-bold text-slate-900 truncate">{fullName}</p>
              <p className="text-xs text-emerald-700 font-semibold mt-0.5">Compte Parent / Tuteur</p>
            </div>
            <div className="p-1.5 space-y-0.5">
              <Link
                href="/parent/parametres"
                onClick={() => setShowProfileMenu(false)}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <Settings size={15} className="text-slate-400" />
                <span>Paramètres de mon compte</span>
              </Link>
              <button
                type="button"
                onClick={() => {
                  setShowProfileMenu(false)
                  setShowLinkChildModal(true)
                }}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors text-left"
              >
                <UserPlus size={15} className="text-emerald-600" />
                <span>Lier un nouvel enfant</span>
              </button>
              
              <div className="my-1.5 h-px bg-slate-100" />

              <button 
                type="button"
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors text-left"
              >
                <LogOut size={15} />
                <span>Se déconnecter</span>
              </button>
            </div>
          </div>
        )}

        <LinkChildModal 
          isOpen={showLinkChildModal} 
          onClose={() => setShowLinkChildModal(false)} 
        />
      </div>

      {/* Notifications */}
      <div className="relative" ref={notifRef}>
        <button 
          type="button"
          onClick={() => setShowNotifs(!showNotifs)}
          className={`relative p-2.5 text-white/90 hover:text-white transition-all rounded-xl hover:bg-white/10 ${showNotifs ? 'bg-white/15 text-white' : ''}`}
          aria-label="Notifications"
        >
          <Bell size={19} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[17px] h-[17px] bg-rose-500 text-white text-[9.5px] font-extrabold flex items-center justify-center rounded-full border-2 border-emerald-900 leading-none px-1 shadow-xs animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
        
        {showNotifs && (
          <div className="absolute right-0 mt-2 w-80 sm:w-88 bg-white rounded-2xl shadow-[0_20px_50px_rgba(15,23,42,0.2)] border border-slate-200/80 z-50 overflow-hidden text-slate-800 animate-dropdown">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/80">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
                  <Bell size={14} />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Notifications</h3>
              </div>
              {unreadCount > 0 && (
                <button 
                  type="button"
                  onClick={markAllAsRead} 
                  className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold hover:underline flex items-center gap-1 transition-colors"
                >
                  <CheckCheck size={14} /> Tout lu
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto scrollbar-light divide-y divide-slate-100">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-2">
                    <Bell size={20} />
                  </div>
                  <p className="text-sm font-semibold text-slate-700">Aucune notification</p>
                  <p className="text-xs text-slate-400 mt-1">Vous n&apos;avez pas de nouveaux messages.</p>
                </div>
              ) : (
                notifications.map(notif => (
                  <div 
                    key={notif.id} 
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-3.5 hover:bg-slate-50 cursor-pointer transition-colors flex items-start gap-3 ${
                      notif.is_read ? 'opacity-70 bg-white' : 'bg-emerald-50/30'
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
    </header>
  )
}
