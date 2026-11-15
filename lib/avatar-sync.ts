export const AVATAR_UPDATED_EVENT = 'scogestia:avatar-updated'

/**
 * Notifie immédiatement l'interface (Sidebar + TopHeader) lorsqu'une nouvelle photo
 * de profil / d'administrateur est téléversée ou retirée dans Paramètres.
 */
export function emitAvatarUpdated(avatarUrl: string | null) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent<{ avatarUrl: string | null }>(AVATAR_UPDATED_EVENT, {
      detail: { avatarUrl: avatarUrl && avatarUrl.trim() !== '' ? avatarUrl.trim() : null },
    })
  )
}
