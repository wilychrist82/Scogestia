import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration missing')
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Helper pour envoyer le SMS via notre autre Edge Function
    const sendReminderSms = async (phone: string, message: string) => {
      try {
        const { error } = await supabase.functions.invoke('send-sms', {
          body: { phone, message }
        })
        if (error) throw error
        return true
      } catch (err) {
        console.error(`Erreur d'envoi SMS à ${phone}:`, err)
        return false
      }
    }

    const today = new Date()
    const jPlus3 = new Date(today)
    jPlus3.setDate(today.getDate() + 3)
    const jPlus3Str = jPlus3.toISOString().split('T')[0]

    // 1. Relances J-3 (Échéances en_attente qui expirent dans exactement 3 jours)
    const { data: approachingDues, error: approachingError } = await supabase
      .from('dues')
      .select(`
        id, 
        label, 
        amount, 
        student:students!inner(
          parent_links:parent_student_links!inner(
            parent:users!parent_user_id(
              phone
            )
          )
        )
      `)
      .eq('status', 'en_attente')
      .eq('due_date', jPlus3Str)
      // Ne pas relancer si on l'a déjà fait (Left join sur payment_reminders)
      .not('id', 'in', `(select due_id from payment_reminders where type = 'j-3')`)

    if (approachingError) console.error("Erreur récupération J-3:", approachingError)

    const sentApproaching = []
    if (approachingDues && approachingDues.length > 0) {
      for (const due of approachingDues) {
        // Extraction du téléphone (le modèle de données retourne un array ou objet selon la cardinalité)
        const parentPhone = due.student?.parent_links?.[0]?.parent?.phone
        
        if (parentPhone) {
          const message = `Rappel Scogestia: Votre paiement de ${due.amount} FCFA pour "${due.label}" arrive à échéance dans 3 jours. Merci d'y penser.`
          const success = await sendReminderSms(parentPhone, message)
          
          await supabase.from('payment_reminders').insert({
            due_id: due.id,
            type: 'j-3',
            status: success ? 'sent' : 'failed'
          })
          sentApproaching.push(due.id)
        }
      }
    }

    // 2. Relances Retard (Échéances en_retard qui n'ont jamais eu de rappel 'overdue')
    // Remarque: le statut 'en_retard' est mis à jour par cron-dues-status. S'il est en retard depuis hier, 
    // il n'a pas encore de log 'overdue'.
    const { data: overdueDues, error: overdueError } = await supabase
      .from('dues')
      .select(`
        id, 
        label, 
        amount, 
        student:students!inner(
          parent_links:parent_student_links!inner(
            parent:users!parent_user_id(
              phone
            )
          )
        )
      `)
      .eq('status', 'en_retard')
      .not('id', 'in', `(select due_id from payment_reminders where type = 'overdue')`)

    if (overdueError) console.error("Erreur récupération overdue:", overdueError)

    const sentOverdue = []
    if (overdueDues && overdueDues.length > 0) {
      for (const due of overdueDues) {
        const parentPhone = due.student?.parent_links?.[0]?.parent?.phone
        
        if (parentPhone) {
          const message = `Urgent Scogestia: Votre paiement de ${due.amount} FCFA pour "${due.label}" est en retard. Merci de régulariser la situation au plus vite.`
          const success = await sendReminderSms(parentPhone, message)
          
          await supabase.from('payment_reminders').insert({
            due_id: due.id,
            type: 'overdue',
            status: success ? 'sent' : 'failed'
          })
          sentOverdue.push(due.id)
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        message: 'Relances terminées', 
        stats: {
          'j-3_sent': sentApproaching.length,
          'overdue_sent': sentOverdue.length
        }
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Erreur CRON daily-payment-reminders:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
