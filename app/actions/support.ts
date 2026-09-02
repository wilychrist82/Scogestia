'use server'

import { createClient } from '@/lib/supabase/server'

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

  // TODO: Intégrer Resend ou Nodemailer ici avec la clé API
  // Exemple avec Resend:
  // await resend.emails.send({
  //   from: 'support@votre-domaine.com',
  //   to: 'wilfried2025@gmail.com',
  //   reply_to: userEmail,
  //   subject: `[Support Scogestia] ${subject}`,
  //   text: message
  // })

  return { success: true }
}
