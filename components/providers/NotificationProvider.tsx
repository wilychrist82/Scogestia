'use client'

import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast, { Toaster } from 'react-hot-toast'
import { BellRing } from 'lucide-react'
import { usePushNotifications } from '@/hooks/usePushNotifications'

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
  const [notifications, setNotifications] = useState<Notification[]>([])
  const unreadCount = notifications.filter(n => !n.is_read).length
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const lastNotifTimestamp = useRef<string | null>(null)

  usePushNotifications()

  useEffect(() => {
    const audio = new Audio('/notification.mp3')
    audio.preload = 'auto'
    audio.volume = 1
    audioRef.current = audio

    const keepWarm = () => {
      const a = audioRef.current
      if (!a) return
      const vol = a.volume
      a.volume = 0
      a.play()
        .then(() => { a.pause(); a.currentTime = 0; a.volume = vol })
        .catch(() => { a.volume = vol })
    }

    const events = ['click', 'touchstart', 'touchend', 'keydown']
    events.forEach(e => document.addEventListener(e, keepWarm, { passive: true }))
    return () => events.forEach(e => document.removeEventListener(e, keepWarm))
  }, [])

  const triggerAlert = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([300, 100, 300])
    }
    const a = audioRef.current
    if (a) {
      a.currentTime = 0
      a.volume = 1
      a.play().catch(err => console.warn('[Audio] play() bloque:', err))
    }
  }

  useEffect(() => {
    const supabase = createClient()
    let cleanup: (() => void) | null = null

    const setup = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: initialNotifs } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30)

      if (initialNotifs && initialNotifs.length > 0) {
        setNotifications(initialNotifs)
        lastNotifTimestamp.current = initialNotifs[0].created_at
      }

      const handleNewNotif = (newNotif: Notification) => {
        setNotifications(prev => {
          if (prev.some(n => n.id === newNotif.id)) return prev
          return [newNotif, ...prev].slice(0, 50)
        })
        lastNotifTimestamp.current = newNotif.created_at
        triggerAlert()
        toast(
          () => (
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

      const channel = supabase
        .channel(`notifs-${user.id}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
          (payload) => handleNewNotif(payload.new as Notification)
        )
        .subscribe((status) => console.log('[Realtime] statut:', status))

      const pollInterval = setInterval(async () => {
        const since = lastNotifTimestamp.current
        if (!since) return
        const { data: missed } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .gt('created_at', since)
          .order('created_at', { ascending: true })
        if (missed && missed.length > 0) missed.forEach(handleNewNotif)
      }, 15000)

      cleanup = () => { supabase.removeChannel(channel); clearInterval(pollInterval) }
    }

    setup()
    return () => { cleanup?.() }
  }, [])

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
