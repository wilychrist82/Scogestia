import { createClient } from '@supabase/supabase-js'

export function createAdminClient() {
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    supabaseKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}
