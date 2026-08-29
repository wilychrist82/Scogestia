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
    const username = process.env.AFRICASTALKING_USERNAME
    const apiKey = process.env.AFRICASTALKING_API_KEY

    if (!username || !apiKey) {
      console.log(`[SMS MOCK] Message to ${phoneNumber}: ${message}`)
      return true
    }

    let formattedPhone = phoneNumber
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = `+228${formattedPhone}`
    }

    const url = username === 'sandbox' 
      ? 'https://api.sandbox.africastalking.com/version1/messaging'
      : 'https://api.africastalking.com/version1/messaging'

    const formData = new URLSearchParams()
    formData.append('username', username)
    formData.append('to', formattedPhone)
    formData.append('message', message)

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        'apiKey': apiKey,
      },
      body: formData
    })

    const data = await response.json()

    if (response.ok) {
      console.log(`[SMS SUCCESS] Résultat:`, data)
      return true
    } else {
      console.error('Africa\'s Talking API error:', data)
      Sentry.captureException(new Error('Erreur fournisseur SMS'), { 
        tags: { feature: 'sms', severity: 'error' },
        extra: { phone: phoneNumber, details: data }
      })
      return false
    }
  } catch (error) {
    console.error("Erreur interne lors de l'envoi du SMS:", error)
    Sentry.captureException(error, { 
      tags: { feature: 'sms', severity: 'error' },
      extra: { phone: phoneNumber }
    })
    return false
  }
}
