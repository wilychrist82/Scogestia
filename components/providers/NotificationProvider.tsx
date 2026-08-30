'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast, { Toaster } from 'react-hot-toast'
import { BellRing } from 'lucide-react'

export type Notification = {
  id: string
  title: string
  message: string
  type: string
  is_read: boolean
  created_at: string
}

type NotificationContextType = {
  notifications: Notification[]
  unreadCount: number
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) throw new Error('useNotifications must be used within NotificationProvider')
  return context
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const unreadCount = notifications.filter(n => !n.is_read).length

  useEffect(() => {
    // Initialiser l'audio côté client uniquement
    const notifAudio = new Audio('/notification.mp3')
    notifAudio.preload = 'auto'
    setAudio(notifAudio)
  }, [])

  // Débloquer l'audio sur la première interaction de l'utilisateur (pour contourner le blocage du navigateur)
  useEffect(() => {
    const unlockAudio = () => {
      if (audio) {
        audio.play().then(() => {
          audio.pause()
          audio.currentTime = 0
        }).catch(() => {})
      }
      document.removeEventListener('click', unlockAudio)
      document.removeEventListener('touchstart', unlockAudio)
    }
    document.addEventListener('click', unlockAudio)
    document.addEventListener('touchstart', unlockAudio)
    
    return () => {
      document.removeEventListener('click', unlockAudio)
      document.removeEventListener('touchstart', unlockAudio)
    }
  }, [audio])

  useEffect(() => {
    const supabase = createClient()
    let userId: string | null = null

    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      userId = user.id

      // Charger les notifications existantes
      const { data: initialNotifs } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)
        
      if (initialNotifs) setNotifications(initialNotifs)

      // S'abonner aux insertions dans la table notifications pour cet utilisateur
      const channel = supabase
        .channel('realtime-notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            const newNotif = payload.new as Notification
            setNotifications(prev => [newNotif, ...prev].slice(0, 50))

            // 1. Jouer le son
            if (audio) {
              audio.currentTime = 0
              audio.play().catch((e) => console.log('Audio play blocked by browser:', e))
            }

            // 2. Afficher le Toast visuel
            toast(
              (t) => (
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <BellRing className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-gray-900">{newNotif.title}</p>
                    <p className="text-xs text-gray-500">{newNotif.message}</p>
                  </div>
                </div>
              ),
              { duration: 8000 }
            )
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }

    setupRealtime()
  }, [audio])

  const markAsRead = async (id: string) => {
    const supabase = createClient()
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
  }

  const markAllAsRead = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false)
  }

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead }}>
      <Toaster position="top-right" />
      {children}
    </NotificationContext.Provider>
  )
}
