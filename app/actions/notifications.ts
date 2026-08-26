'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

type NotificationParams = {
  schoolId: string
  userId: string
  title: string
  message: string
  type: 'finance' | 'academique' | 'rappel' | 'systeme'
  actionUrl?: string
}

export async function sendNotification(params: NotificationParams) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch (error) {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )

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
