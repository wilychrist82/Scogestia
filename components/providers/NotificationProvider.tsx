'use client'

import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast, { Toaster } from 'react-hot-toast'
import { BellRing } from 'lucide-react'
import { usePushNotifications } from '@/hooks/usePushNotifications'

// Joue un carillon doux (Web Audio API) — s'arrête automatiquement après ~5s
function playChime() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()

    // Notes du carillon : Do, Mi, Sol, Do (octave sup)
    const notes = [523.25, 659.25, 783.99, 1046.50]
    const totalDuration = 5 // secondes

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, ctx.currentTime)

      // Enveloppe douce : attaque rapide, longue décroissance
      const startTime = ctx.currentTime + i * 0.18
      const peakVolume = 0.18 - i * 0.02 // chaque note un peu plus douce
      gain.gain.setValueAtTime(0, startTime)
      gain.gain.linearRampToValueAtTime(peakVolume, startTime + 0.05)
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + totalDuration - i * 0.3)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(startTime)
      osc.stop(startTime + totalDuration)
    })

    // Ferme le contexte proprement après la durée totale
    setTimeout(() => ctx.close().catch(() => {}), (totalDuration + 1) * 1000)
  } catch (err) {
    console.warn('[Chime] Web Audio API non disponible:', err)
  }
}

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
  const lastNotifTimestamp = useRef<string | null>(null)

  usePushNotifications()

  const triggerAlert = () => {
    // Vibration légère
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([100, 50, 100])
    }
    // Carillon doux généré par Web Audio API (s'arrête après 5s)
    playChime()
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

      // Abonnement Realtime
      // IMPORTANT : on ne met PAS de filtre côté Supabase (user_id=eq.X) car cela
      // nécessite REPLICA IDENTITY FULL sur la table. On filtre en JavaScript.
      const channel = supabase
        .channel(`notifs-${user.id}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'notifications' },
          (payload) => {
            const newNotif = payload.new as Notification
            // Filtre JS : ne traiter que les notifications de CET utilisateur
            if (newNotif.user_id === user.id) {
              handleNewNotif(newNotif)
            }
          }
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
