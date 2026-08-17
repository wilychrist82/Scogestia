import { createClient } from '@/lib/supabase/server'
import { Redis } from '@upstash/redis'
import Link from 'next/link'
import { Activity, Database, Server, ExternalLink, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'

// Utiliser une route dynamique pour toujours rafraichir
export const dynamic = 'force-dynamic'

async function checkDatabase() {
  const supabase = await createClient()
  try {
    const start = Date.now()
    // Ping DB
    const { error } = await supabase.from('users').select('id').limit(1)
    const latency = Date.now() - start
    
    if (error) throw error
    return { status: 'up', latency }
  } catch (error: any) {
    return { status: 'down', error: error.message, latency: 0 }
  }
}

async function checkRedis() {
  try {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      return { status: 'unconfigured', latency: 0 }
    }
    
    const start = Date.now()
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
    
    await redis.ping()
    const latency = Date.now() - start
    
    return { status: 'up', latency }
  } catch (error: any) {
    return { status: 'down', error: error.message, latency: 0 }
  }
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'up') return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle className="w-4 h-4 mr-1" /> Opérationnel</span>
  if (status === 'unconfigured') return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><AlertTriangle className="w-4 h-4 mr-1" /> Non configuré</span>
  return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"><XCircle className="w-4 h-4 mr-1" /> En panne</span>
}

export default async function HealthDashboard() {
  const supabase = await createClient()
  
  // RLS check : on peut double vérifier le rôle bien que le middleware s'en occupe
  const { data: { user } } = await supabase.auth.getUser()
  const { data: roles } = await supabase
    .from('user_school_roles')
    .select('role')
    .eq('user_id', user?.id as string)
    .limit(1)

  if (!roles || roles[0]?.role !== 'super_admin') {
    return (
      <div className="p-8 text-center text-red-600">
        <h1>Accès refusé. Réservé au super_admin.</h1>
      </div>
    )
  }

  const [dbStatus, redisStatus] = await Promise.all([
    checkDatabase(),
    checkRedis()
  ])

  // Get recent webhook errors
  const { data: recentWebhookErrors } = await supabase
    .from('payment_webhook_logs')
    .select('id, transaction_id, status, error_details, created_at')
    .not('status', 'eq', 'processed')
    .not('status', 'eq', 'received')
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Activity className="w-8 h-8 mr-3 text-blue-600" />
            Santé Applicative
          </h1>
          <p className="text-gray-500 mt-1">Vue d'ensemble des services vitaux et intégrations</p>
        </div>
        <a 
          href="https://sentry.io" 
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
        >
          Ouvrir Sentry Dashboard <ExternalLink className="ml-2 w-4 h-4" />
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Supabase DB Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Database className="w-5 h-5 mr-2 text-gray-400" />
              Base de Données
            </h3>
            <StatusBadge status={dbStatus.status} />
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-500">Latence: {dbStatus.status === 'up' ? `${dbStatus.latency}ms` : '-'}</p>
            {dbStatus.error && <p className="text-xs text-red-500 mt-2">{dbStatus.error}</p>}
          </div>
        </div>

        {/* Redis / Rate Limit Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Server className="w-5 h-5 mr-2 text-gray-400" />
              Rate Limiting (Redis)
            </h3>
            <StatusBadge status={redisStatus.status} />
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-500">Latence: {redisStatus.status === 'up' ? `${redisStatus.latency}ms` : '-'}</p>
            {redisStatus.error && <p className="text-xs text-red-500 mt-2">{redisStatus.error}</p>}
          </div>
        </div>
      </div>

      {/* Webhook Errors Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Dernières Erreurs de Paiement (CinetPay)</h3>
          <p className="text-sm text-gray-500 mt-1">Les alertes critiques sont notifiées dans Sentry. Ceci est l'historique direct de la base.</p>
        </div>
        
        {recentWebhookErrors && recentWebhookErrors.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {recentWebhookErrors.map((log) => (
              <li key={log.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-red-600">
                      Erreur: {log.status}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Transaction: {log.transaction_id || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-700 mt-2 bg-gray-100 p-2 rounded">
                      {log.error_details || 'Détails non disponibles'}
                    </p>
                  </div>
                  <div className="text-sm text-gray-400">
                    {new Date(log.created_at).toLocaleString('fr-FR')}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-6 text-center text-gray-500">
            Aucune erreur récente à afficher.
          </div>
        )}
      </div>
    </div>
  )
}
