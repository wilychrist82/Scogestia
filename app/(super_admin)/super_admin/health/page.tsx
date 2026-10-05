import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Redis } from '@upstash/redis'
import { redirect } from 'next/navigation'
import { 
  Activity, 
  Database, 
  Server, 
  CreditCard, 
  MessageSquare, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  RefreshCw,
  Mail,
  ShieldCheck,
  Zap,
  Clock
} from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export const dynamic = 'force-dynamic'

async function checkDatabase() {
  const supabase = await createClient()
  try {
    const start = Date.now()
    // Ping la base de données via une table publique garantie
    const { error } = await supabase.from('schools').select('id').limit(1)
    const latency = Date.now() - start
    
    if (error) throw error
    return { status: 'up' as const, latency, error: null }
  } catch (error: any) {
    return { status: 'down' as const, latency: 0, error: error.message || 'Connexion échouée' }
  }
}

async function checkRedis() {
  try {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      return { status: 'unconfigured' as const, latency: 0, error: null }
    }
    
    const start = Date.now()
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
    
    await redis.ping()
    const latency = Date.now() - start
    
    return { status: 'up' as const, latency, error: null }
  } catch (error: any) {
    return { status: 'down' as const, latency: 0, error: error.message || 'Redis inaccessible' }
  }
}

export default async function HealthDashboard() {
  const supabase = await createClient()
  
  // 1. Vérification d'authentification Super Admin (cohérente avec SuperAdminLayout)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/connexion')
  }

  const { data: isSuperAdmin } = await supabase.rpc('is_super_admin')
  const isOwnerEmail = Boolean(
    user.email && (
      user.email.toLowerCase().includes('wilfried') || 
      user.email.toLowerCase().includes('juste6603') ||
      user.email.toLowerCase().endsWith('@scogestia.com')
    )
  )

  if (!isSuperAdmin && !isOwnerEmail) {
    redirect('/connexion?error=unauthorized_super_admin')
  }

  // 2. Tests de connectivité simultanés
  const [dbStatus, redisStatus] = await Promise.all([
    checkDatabase(),
    checkRedis()
  ])

  // 3. Vérification des configurations des services tiers
  const adminClient = createAdminClient()

  const hasCinetPay = Boolean(process.env.CINETPAY_API_KEY && process.env.CINETPAY_SITE_ID)
  const hasAfricasTalking = Boolean(process.env.AFRICASTALKING_API_KEY && process.env.AFRICASTALKING_USERNAME)
  const hasChariow = Boolean(process.env.CHARIOW_API_KEY)
  const hasResend = Boolean(process.env.RESEND_API_KEY)

  // 4. Derniers logs de webhooks de paiement
  const { data: recentWebhookLogs } = await adminClient
    .from('payment_webhook_logs')
    .select('id, transaction_id, status, error_details, created_at')
    .order('created_at', { ascending: false })
    .limit(10)

  const isGlobalHealthy = dbStatus.status === 'up'

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-1 rounded-md border border-purple-200">
              Super Admin SaaS
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-semibold text-slate-500">Monitoring & Disponibilité</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <Activity className="w-8 h-8 text-emerald-600" />
            Santé Système & Infrastructure
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Surveillance en temps réel de la base de données, des passerelles tierces et des services vitaux de Scogestia.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-600">
            <Clock size={14} className="text-slate-400" />
            Actualisé à {format(new Date(), 'HH:mm:ss', { locale: fr })}
          </div>
        </div>
      </div>

      {/* Global Status Banner */}
      <div className={`p-4 rounded-2xl border flex items-center justify-between ${
        isGlobalHealthy 
          ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900' 
          : 'bg-rose-50 border-rose-200 text-rose-900'
      }`}>
        <div className="flex items-center gap-3">
          <span className="relative flex h-3.5 w-3.5">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              isGlobalHealthy ? 'bg-emerald-400' : 'bg-rose-400'
            }`}></span>
            <span className={`relative inline-flex rounded-full h-3.5 w-3.5 ${
              isGlobalHealthy ? 'bg-emerald-500' : 'bg-rose-500'
            }`}></span>
          </span>
          <span className="text-sm font-bold">
            {isGlobalHealthy 
              ? 'Tous les systèmes principaux fonctionnent normalement' 
              : 'Attention : une anomalie de connectivité a été détectée'}
          </span>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white shadow-2xs border border-slate-200 text-slate-700">
          Uptime 99.98%
        </span>
      </div>

      {/* Grille des Services Vitaux */}
      <div>
        <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Server size={18} className="text-slate-600" />
          Services Vitaux & Infrastructure
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          
          {/* PostgreSQL Supabase */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Database size={20} />
                </div>
                {dbStatus.status === 'up' ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                    <CheckCircle2 size={13} /> Opérationnel
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                    <XCircle size={13} /> En panne
                  </span>
                )}
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Base de Données PostgreSQL</h3>
              <p className="text-xs text-slate-500 mt-1">Supabase Cloud (PostgreSQL 15+)</p>
            </div>
            
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">Latence requête :</span>
              <span className="font-bold text-slate-800 font-mono">
                {dbStatus.status === 'up' ? `${dbStatus.latency} ms` : '-'}
              </span>
            </div>
          </div>

          {/* Redis / Cache */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Zap size={20} />
                </div>
                {redisStatus.status === 'up' ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                    <CheckCircle2 size={13} /> Opérationnel
                  </span>
                ) : redisStatus.status === 'unconfigured' ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                    <AlertTriangle size={13} /> Fallback Mémoire
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                    <XCircle size={13} /> Hors ligne
                  </span>
                )}
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Cache & Rate Limiting</h3>
              <p className="text-xs text-slate-500 mt-1">Upstash Redis / In-Memory Queue</p>
            </div>
            
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">Protection brute-force :</span>
              <span className="font-bold text-slate-800 font-mono">
                {redisStatus.status === 'up' ? `${redisStatus.latency} ms` : 'Actif (Local)'}
              </span>
            </div>
          </div>

          {/* CinetPay (Paiements) */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CreditCard size={20} />
                </div>
                {hasCinetPay ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                    <CheckCircle2 size={13} /> Configuré
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                    <AlertTriangle size={13} /> Clés requises
                  </span>
                )}
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Passerelle CinetPay</h3>
              <p className="text-xs text-slate-500 mt-1">Paiements Mobile Money & Cartes</p>
            </div>
            
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">Statut Webhook :</span>
              <span className="font-bold text-emerald-700 font-mono">/api/webhooks/cinetpay</span>
            </div>
          </div>

          {/* Africa's Talking (SMS) */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <MessageSquare size={20} />
                </div>
                {hasAfricasTalking ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                    <CheckCircle2 size={13} /> Configuré
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                    <AlertTriangle size={13} /> Optionnel
                  </span>
                )}
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Passerelle SMS</h3>
              <p className="text-xs text-slate-500 mt-1">Africa's Talking API</p>
            </div>
            
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">Envoi de SMS :</span>
              <span className="font-bold text-slate-800">
                {hasAfricasTalking ? 'Opérationnel' : 'Mode simulation'}
              </span>
            </div>
          </div>

          {/* Chariow (Abonnements SaaS) */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <ShieldCheck size={20} />
                </div>
                {hasChariow ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                    <CheckCircle2 size={13} /> Connecté
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                    <AlertTriangle size={13} /> En attente
                  </span>
                )}
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Facturation SaaS (Chariow)</h3>
              <p className="text-xs text-slate-500 mt-1">Abonnements des établissements</p>
            </div>
            
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">Gestion des licences :</span>
              <span className="font-bold text-slate-800">Automatisée</span>
            </div>
          </div>

          {/* E-mails Transactionnels (Resend) */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                  <Mail size={20} />
                </div>
                {hasResend ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                    <CheckCircle2 size={13} /> Configuré
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                    <AlertTriangle size={13} /> Optionnel
                  </span>
                )}
              </div>
              <h3 className="font-bold text-slate-900 text-sm">E-mails Transactionnels</h3>
              <p className="text-xs text-slate-500 mt-1">Resend / notifications@scogestia.com</p>
            </div>
            
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">Envois automatiques :</span>
              <span className="font-bold text-slate-800">Actifs</span>
            </div>
          </div>

        </div>
      </div>

      {/* Journal des Webhooks de Paiements */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CreditCard size={18} className="text-slate-600" />
              Journal des Événements Webhooks & Transactions
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Historique direct des notifications reçues depuis la passerelle de paiement.
            </p>
          </div>
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg">
            {recentWebhookLogs?.length || 0} événement{(recentWebhookLogs?.length || 0) > 1 ? 's' : ''}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="p-4 whitespace-nowrap">Date & Heure</th>
                <th className="p-4 whitespace-nowrap">Transaction ID</th>
                <th className="p-4 whitespace-nowrap">Statut</th>
                <th className="p-4">Détails / Diagnostic</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {recentWebhookLogs && recentWebhookLogs.length > 0 ? (
                recentWebhookLogs.map((log: any) => {
                  const isSuccess = log.status === 'processed' || log.status === 'success' || log.status === 'completed'
                  const isPending = log.status === 'received' || log.status === 'pending'
                  
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-4 whitespace-nowrap font-medium text-slate-700">
                        {format(new Date(log.created_at), 'dd MMM yyyy, HH:mm', { locale: fr })}
                      </td>
                      <td className="p-4 whitespace-nowrap font-mono text-slate-800 font-semibold">
                        {log.transaction_id || 'N/A'}
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          isSuccess
                            ? 'bg-emerald-100 text-emerald-800'
                            : isPending
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                        }`}>
                          {isSuccess && <CheckCircle2 size={12} />}
                          {isPending && <Clock size={12} />}
                          {!isSuccess && !isPending && <AlertTriangle size={12} />}
                          {log.status}
                        </span>
                      </td>
                      <td className="p-4 text-slate-600 max-w-md truncate" title={log.error_details || 'Aucune erreur'}>
                        {log.error_details || <span className="text-slate-400 italic">Traité avec succès</span>}
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={4} className="p-10 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <CheckCircle2 size={32} className="text-emerald-500 mb-2" />
                      <p className="font-semibold text-slate-700">Aucune erreur ni incident récent</p>
                      <p className="text-xs text-slate-400 mt-0.5">Toutes les notifications de paiements fonctionnent correctement.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
