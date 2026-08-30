'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useNotifications } from '@/components/providers/NotificationProvider'
import { Bell, CheckCheck } from 'lucide-react'

export function ParentHeader({ fullName }: { fullName: string }) {
  const router = useRouter()
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()
  const [showNotifs, setShowNotifs] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifs(false)
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

  return (
    <header className="h-14 bg-[var(--color-primary)] text-white flex items-center justify-between px-4 sticky top-0 z-50 shadow-md">
      <div className="flex items-center">
        <span className="material-symbols-outlined text-white mr-3">account_circle</span>
        <div className="flex flex-col">
          <span className="text-sm font-bold truncate max-w-[200px]">{fullName}</span>
          <span className="text-[10px] text-[var(--color-primary-container)]">Espace Parent</span>
        </div>
      </div>

      <div className="relative" ref={notifRef}>
        <button 
          onClick={() => setShowNotifs(!showNotifs)}
          className="relative p-2 text-white/90 hover:text-white transition-colors rounded-full hover:bg-white/10"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border border-[var(--color-primary)] leading-none">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
        
        {showNotifs && (
          <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden text-gray-800">
            <div className="flex items-center justify-between p-3 border-b border-gray-100 bg-gray-50">
              <h3 className="font-bold text-gray-900 text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <button onClick={markAllAsRead} className="text-xs text-[var(--color-primary)] hover:underline flex items-center gap-1">
                  <CheckCheck size={14} /> Tout lu
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500">Aucune notification</div>
              ) : (
                notifications.map(notif => (
                  <div 
                    key={notif.id} 
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${notif.is_read ? 'opacity-60' : 'bg-blue-50/30'}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <p className={`text-sm ${notif.is_read ? 'font-medium text-gray-700' : 'font-bold text-gray-900'}`}>{notif.title}</p>
                      {!notif.is_read && <span className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></span>}
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2">{notif.message}</p>
                    <p className="text-[10px] text-gray-400 mt-2">
                      {new Date(notif.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute:'2-digit' })}
                    </p>
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
