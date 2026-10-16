'use client'

import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast, { Toaster } from 'react-hot-toast'
import { BellRing } from 'lucide-react'
import { usePushNotifications } from '@/hooks/usePushNotifications'

// Fallback Web Audio API (notes douces)
function playWebAudioChime() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()

    // Notes du carillon : Do, Mi, Sol, Do (octave sup)
    const notes = [523.25, 659.25, 783.99, 1046.50]
    const totalDuration = 4 // secondes

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, ctx.currentTime)

      // Enveloppe douce : attaque rapide, longue décroissance
      const startTime = ctx.currentTime + i * 0.18
      const peakVolume = 0.18 - i * 0.02
      gain.gain.setValueAtTime(0, startTime)
      gain.gain.linearRampToValueAtTime(peakVolume, startTime + 0.05)
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + totalDuration - i * 0.3)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(startTime)
      osc.stop(startTime + totalDuration)
    })

    setTimeout(() => ctx.close().catch(() => {}), (totalDuration + 1) * 1000)
  } catch (err) {
    console.warn('[Chime] Web Audio API non disponible:', err)
  }
}

// Joue un carillon doux sans superposition
function playChime() {
  // 1. Tenter de jouer le fichier mp3
  try {
    const audio = new Audio('/notification.mp3')
    audio.volume = 0.6
    const playPromise = audio.play()
    if (playPromise !== undefined) {
      playPromise.catch((e) => {
        console.warn('[Audio] HTML5 Audio bloqué ou indisponible, passage au fallback Web Audio:', e)
        playWebAudioChime()
      })
      return
    }
  } catch (err) {
    console.warn('[Audio] Erreur de lecture du fichier mp3:', err)
  }

  // 2. Fallback si HTML5 Audio a échoué
  playWebAudioChime()
}

export type Notification = {
  id: string
  user_id: string
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
    // Carillon doux
    playChime()
  }

  useEffect(() => {
    const supabase = createClient()
    let cleanup: (() => void) | null = null

    const setup = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Récupérer le nom de l'utilisateur pour filtrer ses propres notifications
      const { data: roleProfile } = await supabase
        .from('user_school_roles')
        .select('full_name')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle()

      const currentUserName = (roleProfile?.full_name || user.user_metadata?.full_name || '').trim()

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

        // ─────────────────────────────────────────────────────────────────────
        // FILTRES ANTI-SONNERIE CHEZ L'EXPÉDITEUR
        // ─────────────────────────────────────────────────────────────────────
        // 1. Si le titre indique que le message provient de l'utilisateur connecté : JAMAIS DE SONNERIE !
        if (currentUserName && newNotif.title && newNotif.title.toLowerCase().includes(currentUserName.toLowerCase())) {
          console.log('[NotificationProvider] Alerte sonore bloquée : notification issue de l\'utilisateur connecté')
          return
        }

        // 2. Fenêtre de silence anti-écho : si un message a été envoyé depuis ce navigateur dans les 8 dernières secondes
        if (typeof window !== 'undefined' && newNotif.type === 'message') {
          const lastSentTime = parseInt(sessionStorage.getItem('scogestia_last_sent_msg_time') || '0', 10)
          if (Date.now() - lastSentTime < 8000) {
            console.log('[NotificationProvider] Alerte sonore bloquée : message envoyé récemment par cet utilisateur')
            return
          }

          // 3. Déduplication anti-doublon (Realtime / Push simultanés)
          const lastAlertId = (window as any).__scogestia_last_alert_id
          const lastAlertTime = (window as any).__scogestia_last_alert_time || 0
          if (lastAlertId === newNotif.id || (Date.now() - lastAlertTime < 3000 && (window as any).__scogestia_last_alert_title === newNotif.title)) {
            return
          }
          ;(window as any).__scogestia_last_alert_id = newNotif.id
          ;(window as any).__scogestia_last_alert_time = Date.now()
          ;(window as any).__scogestia_last_alert_title = newNotif.title
        }

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
      const channel = supabase
        .channel(`notifs-${user.id}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'notifications' },
          (payload) => {
            const newNotif = payload.new as Notification
            // Ne traiter que les notifications destinées à cet utilisateur
            if (newNotif && newNotif.user_id === user.id) {
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
