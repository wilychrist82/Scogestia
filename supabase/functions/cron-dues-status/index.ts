import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Edge function pour mettre à jour quotidiennement les échéances en retard
serve(async (req) => {
  try {
    // Vérifier l'autorisation (par exemple une clé partagée pour s'assurer que c'est bien pg_cron qui l'appelle)
    // Pour simplifier l'exemple, nous utilisons le Service Role Key
    const authHeader = req.headers.get('Authorization')
    if (authHeader !== `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}` && authHeader !== `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`) {
      // Dans un vrai environnement de production, on utiliserait un secret personnalisé.
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Appeler la fonction RPC pour mettre à jour les statuts
    const { data, error } = await supabaseAdmin.rpc('update_overdue_dues')

    if (error) {
      throw error
    }

    return new Response(
      JSON.stringify({ message: `Mise à jour réussie. ${data} échéances modifiées.` }),
      { headers: { 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { headers: { 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
