'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function processCashPayment(data: {
  due_id: string
  amount_paid: number
  payment_method: 'especes' | 'cheque'
}) {
  const supabase = await createClient()

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Non autorisé')

    // 1. Lire l'échéance (due)
    const { data: due, error: dueError } = await supabase
      .from('payment_schedules')
      .select('*, schools(*), students(*)')
      .eq('id', data.due_id)
      .single()

    if (dueError || !due) throw new Error('Échéance introuvable')

    // 2. Vérifier les autorisations (Comptable ou Admin)
    const { data: roleData } = await supabase
      .from('user_school_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('school_id', due.school_id)
      .single()

    if (!roleData || !['admin', 'comptable'].includes(roleData.role)) {
      throw new Error('Permission refusée')
    }

    // 3. Lire les paiements existants pour calculer le reste à payer
    const { data: existingPayments } = await supabase
      .from('payments')
      .select('amount')
      .eq('schedule_id', due.id)
      .eq('status', 'success')

    const totalPaidBefore = existingPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0
    const remaining = Number(due.amount_due) - totalPaidBefore

    if (data.amount_paid > remaining) {
      throw new Error(`Le montant payé (${data.amount_paid}) dépasse le reste à payer (${remaining})`)
    }

    // 4. Créer le paiement avec un numéro de reçu unique
    // Format: REC-{SCHOOL_ID_SHORT}-{YYMMDD}-{RANDOM}
    const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '')
    const randomCode = Math.random().toString(36).substring(2, 6).toUpperCase()
    const receiptNumber = `REC-${dateStr}-${randomCode}`

    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        schedule_id: due.id,
        school_id: due.school_id,
        student_id: due.student_id,
        amount: data.amount_paid,
        payment_method: data.payment_method,
        transaction_reference: `CASH-${receiptNumber}`, // Identifiant unique local
        receipt_number: receiptNumber,
        status: 'success',
        created_by: user.id
      })
      .select()
      .single()

    if (paymentError) throw paymentError

    // 5. Mettre à jour le statut de l'échéance si totalement payée (ou partiellement)
    const totalPaidNow = totalPaidBefore + data.amount_paid
    let newStatus = due.status

    if (totalPaidNow >= Number(due.amount_due)) {
      newStatus = 'paye'
    } else if (totalPaidNow > 0) {
      newStatus = 'partiel'
    }

    if (newStatus !== due.status) {
      await supabase
        .from('payment_schedules')
        .update({ status: newStatus })
        .eq('id', due.id)
    }

    revalidatePath('/admin/finance/caisse')
    revalidatePath('/admin/finance/paiements')

    return { 
      success: true, 
      payment, 
      due, 
      remaining: Number(due.amount_due) - totalPaidNow 
    }

  } catch (error: any) {
    console.error('Erreur encaissement:', error)
    return { error: error.message }
  }
}
