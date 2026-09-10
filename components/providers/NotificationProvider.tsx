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

// ─── Système Audio Robuste ────────────────────────────────────────────────────
// Problème Android WebView : l'AudioContext passe en état "suspended" après
// quelques secondes d'inactivité. Il faut TOUJOURS appeler resume() avant play().
// On met en cache l'ArrayBuffer brut (pas le AudioBuffer décodé) pour éviter
// les problèmes de mismatch quand le contexte est recréé.
let _audioArrayBuffer: ArrayBuffer | null = null
let _audioCtx: AudioContext | null = null

async function _ensureAudioCtx(): Promise<AudioContext | null> {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioCtx) return null
    // Recréer le contexte s'il est fermé
    if (!_audioCtx || _audioCtx.state === 'closed') {
      _audioCtx = new AudioCtx()
    }
    // Toujours reprendre s'il est suspendu (Android suspend après inactivité)
    if (_audioCtx.state === 'suspended') {
      await _audioCtx.resume()
    }
    return _audioCtx
  } catch (e) {
    return null
  }
}

async function _loadAudioBuffer(): Promise<ArrayBuffer | null> {
  if (_audioArrayBuffer) return _audioArrayBuffer
  try {
    const res = await fetch('/notification.mp3')
    _audioArrayBuffer = await res.arrayBuffer()
    console.log('[Scogestia Audio] Buffer chargé ✓')
    return _audioArrayBuffer
  } catch (e) {
    console.error('[Scogestia Audio] Erreur chargement:', e)
    return null
  }
}

// Pré-chargement : appeler au premier événement utilisateur
async function preloadAudio() {
  await _loadAudioBuffer()
  await _ensureAudioCtx()
  console.log('[Scogestia Audio] Prêt ✓')
}

async function playSound() {
  try {
    const ctx = await _ensureAudioCtx()
    if (!ctx) { console.warn('[Audio] AudioContext non disponible'); return }

    // Toujours recharger le buffer depuis le cache ArrayBuffer
    const rawBuffer = await _loadAudioBuffer()
    if (!rawBuffer) { console.warn('[Audio] Buffer non disponible'); return }

    // Décoder à chaque fois depuis l'ArrayBuffer (évite les erreurs de contexte fermé)
    const decoded = await ctx.decodeAudioData(rawBuffer.slice(0))
    const src = ctx.createBufferSource()
    src.buffer = decoded
    src.connect(ctx.destination)
    src.start(0)
  } catch (e) {
    console.error('[Scogestia Audio] Erreur lecture:', e)
    // Fallback ultime HTMLAudio
    try { new Audio('/notification.mp3').play() } catch (_) {}
  }
}
// ─────────────────────────────────────────────────────────────────────────────

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const unreadCount = notifications.filter(n => !n.is_read).length
  const initialized = useRef(false)

  // Initialiser les notifications push Capacitor (Android natif background)
  usePushNotifications()

  // Pré-charger le son à la première interaction utilisateur
  useEffect(() => {
    const unlock = () => {
      if (initialized.current) return
      initialized.current = true
      preloadAudio() // Pré-charge l'ArrayBuffer + réchauffe l'AudioContext
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

            // Jouer le son via Web Audio API robuste (résume l'AudioContext si suspendu)
            playSound() // fire-and-forget, async géré en interne

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
