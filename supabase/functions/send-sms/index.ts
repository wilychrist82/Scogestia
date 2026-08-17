import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { phone, message } = await req.json()

    if (!phone || !message) {
      return new Response(
        JSON.stringify({ error: 'phone et message sont requis' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const username = Deno.env.get('AFRICASTALKING_USERNAME')
    const apiKey = Deno.env.get('AFRICASTALKING_API_KEY')

    if (!username || !apiKey) {
      // Mode de développement ou configuration manquante
      console.log(`[SMS MOCK] Message to ${phone}: ${message}`)
      return new Response(
        JSON.stringify({ status: 'mocked', message: 'SMS loggué en console (clés manquantes)' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // Format the phone number (Africa's Talking requires international format, e.g., +228...)
    // This is a basic assumption, in a real scenario you'd parse/validate the phone number using a library like google-libphonenumber
    let formattedPhone = phone
    if (!formattedPhone.startsWith('+')) {
      // Assuming Togo (+228) if no prefix is provided. Ideally this is handled client-side.
      formattedPhone = `+228${formattedPhone}`
    }

    // Africa's Talking API endpoint
    const url = username === 'sandbox' 
      ? 'https://api.sandbox.africastalking.com/version1/messaging'
      : 'https://api.africastalking.com/version1/messaging'

    // Form data is required by Africa's Talking
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
      return new Response(
        JSON.stringify({ status: 'success', data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    } else {
      console.error('Africa\'s Talking API error:', data)
      return new Response(
        JSON.stringify({ error: 'Erreur fournisseur SMS', details: data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

  } catch (error) {
    console.error('Erreur interne send-sms:', error)
    return new Response(
      JSON.stringify({ error: 'Erreur interne du serveur' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
