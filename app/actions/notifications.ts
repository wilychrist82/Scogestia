'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

type NotificationParams = {
  schoolId: string
  userId: string
  title: string
  message: string
  type: 'finance' | 'academique' | 'rappel' | 'systeme'
  actionUrl?: string
}

export async function sendNotification(params: NotificationParams) {
  const supabase = await createClient()

  const { error } = await supabase.from('notifications').insert({
    school_id: params.schoolId,
    user_id: params.userId,
    title: params.title,
    message: params.message,
    type: params.type,
    action_url: params.actionUrl || null
  })

  if (error) {
    console.error("Erreur lors de l'envoi de la notification:", error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Enregistre le token FCM de l'appareil pour l'utilisateur connecté.
 * Utilise createAdminClient pour nettoyer toute attribution précédente
 * de ce token physique à un autre compte (évite les notifications croisées et en doublon).
 */
export async function registerDeviceToken(fcmToken: string) {
  if (!fcmToken || typeof fcmToken !== 'string') {
    return { success: false, error: 'Token FCM manquant' }
  }

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Non authentifié' }

    const adminClient = await createAdminClient()

    // 1. Supprimer ce token physique pour tout AUTRE compte utilisateur (bypasse RLS)
    await adminClient
      .from('user_devices')
      .delete()
      .eq('fcm_token', fcmToken)
      .neq('user_id', user.id)

    // 2. Lier le token à l'utilisateur actuellement connecté
    const { error } = await adminClient
      .from('user_devices')
      .upsert({
        user_id: user.id,
        fcm_token: fcmToken,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })

    if (error) {
      console.error("Erreur upsert user_devices:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err: any) {
    console.error("Erreur registerDeviceToken:", err)
    return { success: false, error: err.message }
  }
}

/**
 * Supprime le token de l'appareil lors de la déconnexion
 */
export async function removeDeviceToken(fcmToken?: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: true }

    const adminClient = await createAdminClient()
    if (fcmToken) {
      await adminClient.from('user_devices').delete().eq('fcm_token', fcmToken)
    } else {
      await adminClient.from('user_devices').delete().eq('user_id', user.id)
    }

    return { success: true }
  } catch (err) {
    console.error("Erreur removeDeviceToken:", err)
    return { success: false }
  }
}
