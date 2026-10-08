import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

/**
 * Health check & Keep-alive endpoint pour Scogestia et Supabase.
 * - Vérifie la connectivité et la latence avec la base de données PostgreSQL Supabase
 * - Empêche la mise en veille automatique (cold start / pause 7 jours)
 * - Utilisable par UptimeRobot, BetterUptime, GitHub Actions ou Cron externe
 */
export async function GET() {
  const startTime = Date.now()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json(
      {
        status: 'error',
        message: 'Variables d\'environnement Supabase manquantes',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })

    // Requête légère pour réveiller et maintenir active la base de données
    const dbStart = Date.now()
    const { count, error } = await supabase
      .from('schools')
      .select('id', { count: 'exact', head: true })
      .limit(1)

    const dbLatency = Date.now() - dbStart

    if (error) {
      return NextResponse.json(
        {
          status: 'degraded',
          message: 'Erreur lors de la requête vers Supabase',
          error: error.message,
          database: {
            connected: false,
            latency_ms: dbLatency,
          },
          total_duration_ms: Date.now() - startTime,
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      )
    }

    return NextResponse.json(
      {
        status: 'healthy',
        message: 'Scogestia & Supabase opérationnels 24/7',
        database: {
          connected: true,
          latency_ms: dbLatency,
          schools_count: count ?? 0,
        },
        total_duration_ms: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'production',
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      }
    )
  } catch (err: any) {
    return NextResponse.json(
      {
        status: 'down',
        message: 'Échec de connexion au serveur de données',
        error: err.message || 'Erreur inattendue',
        total_duration_ms: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    )
  }
}
