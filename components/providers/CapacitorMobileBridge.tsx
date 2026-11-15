'use client'

import { useEffect } from 'react'

const ROOT_EXIT_PATHS = new Set([
  '/',
  '/connexion',
  '/admin',
  '/enseignant',
  '/parent',
  '/super_admin',
])

export const CLOSE_TOP_LAYER_EVENT = 'scogestia:close-top-layer'

/**
 * Pont natif Capacitor :
 * - Intercepte le bouton Retour matériel Android pour fermer d'abord menus/modales,
 *   puis revenir dans l'historique ou minimiser proprement sur l'écran d'accueil.
 * - S'exécute sans erreur même sur un ancien APK n'incluant pas encore @capacitor/app.
 */
export function CapacitorMobileBridge() {
  useEffect(() => {
    let cleanup: (() => void) | undefined
    let disposed = false

    const setupBridge = async () => {
      try {
        const [{ Capacitor }, { App }] = await Promise.all([
          import('@capacitor/core'),
          import('@capacitor/app'),
        ])

        if (disposed || !Capacitor.isNativePlatform()) {
          return
        }

        // Ne pas enregistrer si le plugin natif n'est pas compilé dans cet APK
        if (!Capacitor.isPluginAvailable('App')) {
          return
        }

        const listener = await App.addListener('backButton', ({ canGoBack }) => {
          // 1. Laisser d'abord les tiroirs/modales écouter cet évènement
          const closeEvent = new CustomEvent(CLOSE_TOP_LAYER_EVENT, {
            cancelable: true,
          })
          window.dispatchEvent(closeEvent)
          if (closeEvent.defaultPrevented) {
            return
          }

          // 2. Fermer un éventuel dialogue/modale ouvert via Escape
          const openDialog = document.querySelector<HTMLElement>(
            '[role="dialog"], [role="alertdialog"], [aria-modal="true"]',
          )
          if (openDialog) {
            const escEvent = new KeyboardEvent('keydown', {
              key: 'Escape',
              code: 'Escape',
              bubbles: true,
              cancelable: true,
            })
            document.dispatchEvent(escEvent)
            const closeBtn = openDialog.querySelector<HTMLButtonElement>(
              'button[aria-label*="Fermer" i], button[aria-label*="Close" i]',
            )
            closeBtn?.click()
            return
          }

          // 3. Revenir en arrière si on n'est pas sur un écran racine
          const currentPath = window.location.pathname
          const isRootScreen = ROOT_EXIT_PATHS.has(currentPath)

          if (!isRootScreen && (canGoBack || window.history.length > 1)) {
            window.history.back()
            return
          }

          // 4. Sur l'accueil du rôle, minimiser proprement l'application Android
          void App.minimizeApp()
        })

        cleanup = () => {
          void listener.remove()
        }
      } catch {
        // Ignorer silencieusement sur navigateur Web ou APK sans plugin App
      }
    }

    void setupBridge()

    return () => {
      disposed = true
      cleanup?.()
    }
  }, [])

  return null
}
