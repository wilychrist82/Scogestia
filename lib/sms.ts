import { createClient } from '@supabase/supabase-js'
import * as Sentry from '@sentry/nextjs'

/**
 * Service d'envoi de SMS
 * 
 * Cette fonction appelle l'Edge Function Supabase 'send-sms'
 * qui elle-même s'interface avec Africa's Talking.
 */
export async function sendSms(phoneNumber: string, message: string): Promise<boolean> {
  try {
    // Note: on utilise Supabase Admin ou le client standard selon le contexte
    // Si c'est appelé depuis un Webhook (serveur), il faut s'assurer d'avoir les clés.
    // L'Edge function elle-même gère la logique métier.
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error("Clés Supabase manquantes pour invoquer l'Edge Function.")
      Sentry.captureException(new Error("Missing Supabase keys for SMS Edge Function"), { tags: { feature: 'sms', severity: 'critical' } })
      return false
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data, error } = await supabase.functions.invoke('send-sms', {
      body: { phone: phoneNumber, message }
    })

    if (error) {
      console.error("Erreur lors de l'appel à l'Edge Function send-sms:", error)
      Sentry.captureException(error, { 
        tags: { feature: 'sms', severity: 'error' },
        extra: { phone: phoneNumber }
      })
      return false
    }

    console.log(`[SMS SUCCESS] Résultat:`, data)
    return true
  } catch (error) {
    console.error("Erreur interne lors de l'envoi du SMS:", error)
    Sentry.captureException(error, { 
      tags: { feature: 'sms', severity: 'error' },
      extra: { phone: phoneNumber }
    })
    return false
  }
}
