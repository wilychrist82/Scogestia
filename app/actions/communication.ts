'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { sendSms } from '@/lib/sms'

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
  const subject = formData.get('subject') as string || 'Message vocal'
  const message = formData.get('message') as string || 'Message vocal'
  const shouldSendSms = formData.get('sendSms') === 'true'
  const audioUrl = formData.get('audioUrl') as string | null

  // If there's an audio URL but no text message, we still allow it
  if (!subject && !audioUrl) {
    return { error: 'L\'objet ou l\'audio est requis' }
  }

  let recipientId = null
  if (recipientType === 'class') {
    if (!selectedClass) return { error: 'La classe est requise' }
    recipientId = selectedClass
  } else if (recipientType === 'parent') {
    if (!selectedParent) return { error: 'L\'élève/parent est requis' }
    
    // selectedParent is actually the student_id from the UI.
    // Let's find the parent_user_id linked to this student.
    const { data: linkData } = await supabase
      .from('parent_student_links')
      .select('parent_user_id')
      .eq('student_id', selectedParent)
      .maybeSingle()

    if (!linkData?.parent_user_id) {
      return { error: 'Aucun compte parent n\'est encore activé pour cet élève. Vous ne pouvez pas lui envoyer de notification interne pour le moment.' }
    }
    
    recipientId = linkData.parent_user_id
  }

  const { error } = await supabase.from('communications').insert({
    school_id: roleData.school_id,
    sender_id: user.id,
    recipient_type: recipientType,
    recipient_id: recipientId,
    subject,
    content: message,
    audio_url: audioUrl
  })

  if (error) {
    console.error('Error inserting communication:', error)
    return { error: 'Erreur lors de l\'envoi du message' }
  }

  // Envoi de SMS si demandé
  if (shouldSendSms) {
    try {
      let parentIdsToSms: string[] = []

      if (recipientType === 'all') {
        const { data } = await supabase
          .from('user_school_roles')
          .select('user_id')
          .eq('school_id', roleData.school_id)
          .eq('role', 'parent')
        if (data) parentIdsToSms = data.map(d => d.user_id)
      } else if (recipientType === 'class') {
        const { data } = await supabase
          .from('parent_student_links')
          .select('parent_user_id')
          .in('student_id', (
            await supabase.from('students').select('id').eq('class_id', selectedClass)
          ).data?.map(s => s.id) || [])
        if (data) parentIdsToSms = data.map(d => d.parent_user_id)
      } else if (recipientType === 'parent') {
        parentIdsToSms = [selectedParent]
      }

      if (parentIdsToSms.length > 0) {
        // Remove duplicates
        parentIdsToSms = Array.from(new Set(parentIdsToSms))

        const { data: parentsData } = await supabase
          .from('user_school_roles')
          .select('phone')
          .in('user_id', parentIdsToSms)
          .eq('school_id', roleData.school_id)

        const phones = parentsData?.map(p => p.phone).filter(Boolean) as string[] || []
        
        // Envoi SMS en background (ne pas bloquer l'UI trop longtemps)
        // Pour un système en prod, cela devrait être via un job queue.
        Promise.all(phones.map(phone => sendSms(phone, `[${subject}] ${message}`)))
          .catch(err => console.error("Erreur lors de l'envoi en masse des SMS:", err))
      }
    } catch (smsError) {
      console.error('Error in SMS logic:', smsError)
    }
  }

  revalidatePath('/admin/communication')
  revalidatePath('/parent/messages')

  return { success: true }
}

