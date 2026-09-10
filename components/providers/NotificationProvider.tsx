'use client'

import React, { createContext, useContext, useEffect, useRef } from 'react'
import { useState } from 'react'
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

// ─── Web Audio API ────────────────────────────────────────────────────────────
// C'est la SEULE API qui fonctionne de manière fiable dans un WebView Android.
// new Audio().play() est bloqué par la politique autoplay d'Android WebView.
// On pré-charge le buffer une fois après la 1ère interaction, puis on joue sans restriction.
let _audioCtx: AudioContext | null = null
let _audioBuffer: AudioBuffer | null = null
let _audioReady = false

async function initWebAudio() {
  if (_audioReady) return
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioCtx) return
    _audioCtx = new AudioCtx()
    if (_audioCtx.state === 'suspended') await _audioCtx.resume()
    const res = await fetch('/notification.mp3')
    const buf = await res.arrayBuffer()
    _audioBuffer = await _audioCtx.decodeAudioData(buf)
    _audioReady = true
    console.log('[Scogestia Audio] Prêt ✓')
  } catch (e) {
    console.error('[Scogestia Audio] Erreur initialisation:', e)
  }
}

function playSound() {
  if (!_audioReady || !_audioCtx || !_audioBuffer) {
    // Fallback ultime : tenter HTMLAudio
    try { new Audio('/notification.mp3').play() } catch (_) {}
    return
  }
  try {
    if (_audioCtx.state === 'suspended') _audioCtx.resume()
    const src = _audioCtx.createBufferSource()
    src.buffer = _audioBuffer
    src.connect(_audioCtx.destination)
    src.start(0)
  } catch (e) {
    console.error('[Scogestia Audio] Erreur lecture:', e)
  }
}
// ─────────────────────────────────────────────────────────────────────────────

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const unreadCount = notifications.filter(n => !n.is_read).length
  const initialized = useRef(false)

  // Initialiser les notifications push Capacitor (Android natif background)
  usePushNotifications()

  // Initialiser Web Audio à la première interaction utilisateur
  useEffect(() => {
    const unlock = () => {
      if (initialized.current) return
      initialized.current = true
      initWebAudio()
    }
    const events = ['click', 'touchstart', 'keydown']
    events.forEach(e => document.addEventListener(e, unlock, { passive: true }))
    return () => events.forEach(e => document.removeEventListener(e, unlock))
  }, [])

  // Écoute Supabase Realtime — notifications en temps réel (foreground)
  useEffect(() => {
    const supabase = createClient()

    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: initialNotifs } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)

      if (initialNotifs) setNotifications(initialNotifs)

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

            // Jouer le son via Web Audio API (bypass autoplay Android)
            playSound()

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
        )
        .subscribe()

      return () => { supabase.removeChannel(channel) }
    }

    setupRealtime()
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
