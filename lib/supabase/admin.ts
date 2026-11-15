import { createServiceRoleClient } from '@/lib/supabase/service'

export function createAdminClient() {
  return createServiceRoleClient()
}
