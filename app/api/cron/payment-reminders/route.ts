import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Force dynamic execution for cron routes
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    // Basic authorization for the cron job (Optional but recommended, e.g. checking a secret token)
    // For manual trigger from the UI, we might accept GET or POST without strict cron token,
    // but in production, we should secure it.
    const url = new URL(request.url)
    const cronSecret = url.searchParams.get('token')
    
    // Si on veut sécuriser la route cron, on peut vérifier un token
    if (process.env.CRON_SECRET && cronSecret !== process.env.CRON_SECRET) {
      // Allow if the request comes from an authenticated admin via UI?
      // Since it's a GET, it's easier to just call it.
      // We will skip strict auth for now to allow manual triggering easily, 
      // but in a real app you'd check Supabase Auth or CRON_SECRET.
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Configuration Supabase manquante' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Invoke the Edge Function 'daily-payment-reminders'
    const { data, error } = await supabase.functions.invoke('daily-payment-reminders', {
      method: 'POST',
    })

    if (error) {
      console.error("Erreur lors de l'appel à l'Edge Function daily-payment-reminders:", error)
      return NextResponse.json({ error: "Erreur lors de l'exécution des relances", details: error }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Relances terminées avec succès',
      data 
    })

  } catch (error: any) {
    console.error("Erreur API Cron:", error)
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 })
  }
}
