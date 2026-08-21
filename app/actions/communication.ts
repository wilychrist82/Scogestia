'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function sendCommunication(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non autorisé' }

  const { data: roleData } = await supabase
    .from('user_school_roles')
    .select('school_id')
    .eq('user_id', user.id)
    .single()

  if (!roleData?.school_id) return { error: 'École introuvable' }

  const recipientType = formData.get('recipientType') as string
  const selectedClass = formData.get('selectedClass') as string
  const selectedParent = formData.get('selectedParent') as string
  const subject = formData.get('subject') as string
  const message = formData.get('message') as string

  if (!subject || !message) {
    return { error: 'L\'objet et le message sont requis' }
  }

  let recipientId = null
  if (recipientType === 'class') {
    if (!selectedClass) return { error: 'La classe est requise' }
    recipientId = selectedClass
  } else if (recipientType === 'parent') {
    if (!selectedParent) return { error: 'Le parent est requis' }
    recipientId = selectedParent
  }

  const { error } = await supabase.from('communications').insert({
    school_id: roleData.school_id,
    sender_id: user.id,
    recipient_type: recipientType,
    recipient_id: recipientId,
    subject,
    content: message
  })

  if (error) {
    console.error('Error inserting communication:', error)
    return { error: 'Erreur lors de l\'envoi du message' }
  }

  revalidatePath('/admin/communication')
  revalidatePath('/parent/messages')

  return { success: true }
}
