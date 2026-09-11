'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { sendSms } from '@/lib/sms'
import { sendEmail } from '@/lib/emails/send'

export async function sendCommunication(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non autorisé' }

  const { data: roleData } = await supabase
    .from('user_school_roles')
    .select('school_id, role')
    .eq('user_id', user.id)
    .single()

  if (!roleData?.school_id) return { error: 'École introuvable' }

  const recipientType = formData.get('recipientType') as string
  const selectedClass = formData.get('selectedClass') as string
  const selectedParent = formData.get('selectedParent') as string
  const selectedEnseignant = formData.get('selectedEnseignant') as string
  const subject = formData.get('subject') as string || 'Message vocal'
  const message = formData.get('message') as string || 'Message vocal'
  const shouldSendSms = formData.get('sendSms') === 'true'
  const audioUrl = formData.get('audioUrl') as string | null

  if (!subject && !audioUrl) {
    return { error: 'L\'objet ou l\'audio est requis' }
  }

  const adminClient = createAdminClient()

  // ─────────────────────────────────────────────────────────────────────────
  // Résolution du recipient_id selon le type
  // ─────────────────────────────────────────────────────────────────────────
  let recipientId: string | null = null

  if (recipientType === 'class') {
    if (!selectedClass) return { error: 'La classe est requise' }
    recipientId = selectedClass

  } else if (recipientType === 'parent') {
    if (!selectedParent) return { error: 'L\'élève/parent est requis' }
    
    // selectedParent est un student_id → on trouve le parent lié
    // On utilise adminClient car les enseignants n'ont pas accès en RLS à parent_student_links
    const { data: linkData } = await adminClient
      .from('parent_student_links')
      .select('parent_user_id')
      .eq('student_id', selectedParent)
      .maybeSingle()

    if (!linkData?.parent_user_id) {
      return { error: 'Aucun compte parent n\'est encore activé pour cet élève.' }
    }
    recipientId = linkData.parent_user_id

  } else if (recipientType === 'enseignant') {
    // selectedEnseignant est directement un user_id d'enseignant
    if (!selectedEnseignant) return { error: 'L\'enseignant est requis' }
    recipientId = selectedEnseignant

  } else if (recipientType === 'admin') {
    // Pas de recipient_id unique, on notifie tous les admins de l'école
    recipientId = null

  } else if (recipientType === 'all') {
    // Tous les parents
    recipientId = null

  } else if (recipientType === 'all_teachers') {
    // Tous les enseignants
    recipientId = null
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Insertion en base (adminClient pour bypasser RLS — sécurisé car on a
  // déjà vérifié l'identité de l'utilisateur via supabase.auth.getUser())
  // ─────────────────────────────────────────────────────────────────────────
  const { error: insertError } = await adminClient.from('communications').insert({
    school_id: roleData.school_id,
    sender_id: user.id,
    recipient_type: recipientType,
    recipient_id: recipientId,
    subject,
    content: message,
    audio_url: audioUrl
  })

  if (insertError) {
    console.error('Error inserting communication:', insertError)
    return { error: 'Erreur lors de l\'envoi du message' }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Résolution des utilisateurs à notifier
  // ─────────────────────────────────────────────────────────────────────────
  try {
    let usersToNotify: string[] = []

    if (recipientType === 'parent' && recipientId) {
      // Notifier le parent spécifique
      usersToNotify = [recipientId]

    } else if (recipientType === 'enseignant' && recipientId) {
      // Notifier l'enseignant spécifique
      usersToNotify = [recipientId]

    } else if (recipientType === 'admin') {
      // Notifier tous les admins de l'école
      const { data: adminUsers } = await adminClient
        .from('user_school_roles')
        .select('user_id')
        .eq('school_id', roleData.school_id)
        .eq('role', 'admin')
      if (adminUsers) usersToNotify = adminUsers.map(u => u.user_id)

    } else if (recipientType === 'all') {
      // Notifier tous les parents de l'école
      const { data: parentUsers } = await adminClient
        .from('user_school_roles')
        .select('user_id')
        .eq('school_id', roleData.school_id)
        .eq('role', 'parent')
      if (parentUsers) usersToNotify = parentUsers.map(u => u.user_id)

    } else if (recipientType === 'all_teachers') {
      // Notifier tous les enseignants de l'école
      const { data: teacherUsers } = await adminClient
        .from('user_school_roles')
        .select('user_id')
        .eq('school_id', roleData.school_id)
        .eq('role', 'enseignant')
      if (teacherUsers) usersToNotify = teacherUsers.map(u => u.user_id)

    } else if (recipientType === 'class') {
      // Notifier les parents des élèves de la classe
      const { data: studentsInClass } = await adminClient
        .from('students')
        .select('id')
        .eq('class_id', selectedClass)
      
      if (studentsInClass && studentsInClass.length > 0) {
        const studentIds = studentsInClass.map(s => s.id)
        const { data: linkData } = await adminClient
          .from('parent_student_links')
          .select('parent_user_id')
          .in('student_id', studentIds)
        if (linkData) usersToNotify = linkData.map(l => l.parent_user_id)
      }
    }

    // Exclure l'expéditeur des destinataires
    usersToNotify = Array.from(new Set(usersToNotify)).filter(uid => uid !== user.id)

    // Insérer les notifications
    if (usersToNotify.length > 0) {
      const notifTitle = 'Nouveau message'
      const notifMessage = audioUrl ? 'Vous avez reçu un nouveau message vocal.' : subject
      
      const notificationsToInsert = usersToNotify.map(uid => ({
        user_id: uid,
        school_id: roleData.school_id,
        title: notifTitle,
        message: notifMessage,
        type: 'message'
      }))

      await adminClient.from('notifications').insert(notificationsToInsert)
    }
  } catch (notifErr) {
    console.error('Error creating notifications:', notifErr)
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Envoi SMS (si demandé)
  // ─────────────────────────────────────────────────────────────────────────
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
        const studentsRes = await supabase.from('students').select('id').eq('class_id', selectedClass)
        const studentIds = studentsRes.data?.map(s => s.id) || []
        if (studentIds.length > 0) {
          const { data } = await supabase
            .from('parent_student_links')
            .select('parent_user_id')
            .in('student_id', studentIds)
          if (data) parentIdsToSms = data.map(d => d.parent_user_id)
        }

      } else if (recipientType === 'parent' && recipientId) {
        parentIdsToSms = [recipientId]
      }

      if (parentIdsToSms.length > 0) {
        parentIdsToSms = Array.from(new Set(parentIdsToSms))

        const { data: parentsData } = await supabase
          .from('user_school_roles')
          .select('phone')
          .in('user_id', parentIdsToSms)
          .eq('school_id', roleData.school_id)

        const phones = parentsData?.map(p => p.phone).filter(Boolean) as string[] || []
        
        Promise.all(phones.map(phone => sendSms(phone, `[${subject}] ${message}`)))
          .catch(err => console.error("Erreur SMS:", err))
      }
    } catch (smsError) {
      console.error('Error in SMS logic:', smsError)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Envoi Email groupé (pour les annonces 'all' et 'class')
  // ─────────────────────────────────────────────────────────────────────────
  const shouldSendGroupEmail = ['all', 'class'].includes(recipientType) && !audioUrl
  if (shouldSendGroupEmail) {
    try {
      let parentUserIds: string[] = []

      if (recipientType === 'all') {
        const { data } = await adminClient
          .from('user_school_roles')
          .select('user_id')
          .eq('school_id', roleData.school_id)
          .eq('role', 'parent')
        if (data) parentUserIds = data.map(d => d.user_id)

      } else if (recipientType === 'class' && selectedClass) {
        const { data: studentsInClass } = await adminClient
          .from('students').select('id').eq('class_id', selectedClass)
        if (studentsInClass?.length) {
          const { data: links } = await adminClient
            .from('parent_student_links')
            .select('parent_user_id')
            .in('student_id', studentsInClass.map(s => s.id))
          if (links) parentUserIds = links.map(l => l.parent_user_id)
        }
      }

      if (parentUserIds.length > 0) {
        // Récupérer les emails des parents depuis auth.users via adminClient
        const emailsToSend: string[] = []
        for (const uid of Array.from(new Set(parentUserIds))) {
          try {
            const { data: u } = await adminClient.auth.admin.getUserById(uid)
            if (u?.user?.email) emailsToSend.push(u.user.email)
          } catch {}
        }

        if (emailsToSend.length > 0) {
          // Envoi par batch de 50 (limite Resend)
          const batches = []
          for (let i = 0; i < emailsToSend.length; i += 50) {
            batches.push(emailsToSend.slice(i, i + 50))
          }

          const { data: schoolData } = await adminClient
            .from('schools').select('name').eq('id', roleData.school_id).maybeSingle()
          const schoolName = (schoolData as any)?.name || 'Scogestia'

          const emailHtml = `
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
              <div style="background:#065F46;color:#fff;padding:16px 24px;border-radius:12px 12px 0 0;">
                <h2 style="margin:0;font-size:18px;">📢 Annonce — ${schoolName}</h2>
              </div>
              <div style="background:#f8f9ff;padding:24px;border:1px solid #e2e8f0;border-radius:0 0 12px 12px;">
                <h3 style="color:#0b1c30;margin-top:0;">${subject}</h3>
                <p style="color:#3f4944;line-height:1.7;">${message.replace(/\n/g, '<br/>')}</p>
                <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0;"/>
                <p style="color:#94a3b8;font-size:12px;margin:0;">
                  Ce message vous a été envoyé par ${schoolName} via Scogestia.
                  <a href="${process.env.NEXT_PUBLIC_SITE_URL || ''}/parent" style="color:#065F46;">Voir dans l'application →</a>
                </p>
              </div>
            </div>
          `

          Promise.all(
            batches.map(batch =>
              sendEmail({ to: batch, subject: `[${schoolName}] ${subject}`, html: emailHtml })
            )
          ).catch(err => console.error('[Group Email Error]', err))
        }
      }
    } catch (emailErr) {
      console.error('Error in group email logic:', emailErr)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Revalidation des pages concernées
  // ─────────────────────────────────────────────────────────────────────────
  revalidatePath('/admin/communication')
  revalidatePath('/parent/messages')
  revalidatePath('/enseignant/messages')

  return { success: true }
}
