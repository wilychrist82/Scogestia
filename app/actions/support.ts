'use server'

import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendSupportMessage(formData: FormData) {
  const subject = formData.get('subject') as string
  const message = formData.get('message') as string
  const userEmail = formData.get('userEmail') as string

  if (!subject || !message || !userEmail) {
    return { error: 'Veuillez remplir tous les champs obligatoires.' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Vous devez être connecté.' }
  }

  // Enregistrement dans la base de données (si on a une table support_tickets)
  // Pour l'instant, on simule l'envoi d'email
  console.log('--- NOUVEAU MESSAGE DE SUPPORT ---')
  console.log(`De: ${userEmail} (Utilisateur ID: ${user.id})`)
  console.log(`Sujet: ${subject}`)
  console.log(`Message: ${message}`)
  console.log(`-> Cet email devrait être envoyé à : wilfried2025@gmail.com`)
  console.log('-----------------------------------')

  // Envoi d'email via Resend
  try {
    const { data, error: resendError } = await resend.emails.send({
      from: 'Scogestia Support <onboarding@resend.dev>', // par defaut, resend utilise cette adresse de test. Remplacez par votre domaine plus tard.
      to: 'wilfried2025@gmail.com',
      replyTo: userEmail,
      subject: `[Support Scogestia] ${subject}`,
      text: `Nouveau message de support reçu :\n\nUtilisateur: ${userEmail}\nSujet: ${subject}\n\nMessage:\n${message}`
    })

    if (resendError) {
      console.error('Erreur Resend:', resendError)
      return { error: 'Le message n\'a pas pu être envoyé. Vérifiez la configuration de l\'email.' }
    }
    
    console.log('Email envoyé avec succès via Resend, ID:', data?.id)
  } catch (err) {
    console.error('Erreur lors de l\'envoi de l\'email:', err)
    return { error: 'Une erreur interne est survenue lors de l\'envoi de l\'email.' }
  }

  return { success: true }
}
