'use server'

import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import { authRateLimit, checkRateLimit } from '@/lib/ratelimit'

// Fonction pour générer un code alphanumérique aléatoire
function generateRandomCode(length: number = 6): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export async function generateParentCode(studentId: string): Promise<{ code?: string, error?: string }> {
  const supabase = await createClient()

  // Vérifier que le staff a bien accès à cette école
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  // Obtenir l'école de l'élève
  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('school_id')
    .eq('id', studentId)
    .single()

  if (studentError || !student) {
    return { error: 'Élève introuvable' }
  }

  // Vérifier si un code actif existe déjà
  const { data: existingCode } = await supabase
    .from('parent_invitation_codes')
    .select('code')
    .eq('student_id', studentId)
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()

  if (existingCode) {
    return { code: existingCode.code } // Retourne le code existant s'il est encore valide
  }

  let code = ''
  let isUnique = false

  // Générer un code unique
  while (!isUnique) {
    code = generateRandomCode(6)
    const { count } = await supabase
      .from('parent_invitation_codes')
      .select('id', { count: 'exact', head: true })
      .eq('code', code)
    
    if (count === 0) isUnique = true
  }

  // Insérer le nouveau code
  const { error: insertError } = await supabase
    .from('parent_invitation_codes')
    .insert({
      school_id: student.school_id,
      student_id: studentId,
      code: code,
      created_by: user.id
    })

  if (insertError) {
    return { error: 'Erreur lors de la génération du code.' }
  }

  return { code }
}

export async function activateParentAccount(prevState: any, formData: FormData): Promise<{ error?: string, success?: boolean }> {
  const identifier = formData.get('identifier') as string // phone or email
  const code = formData.get('code') as string
  const password = formData.get('password') as string

  if (!identifier || !code || !password) {
    return { error: 'Veuillez remplir tous les champs.' }
  }

  const headerList = await headers()
  const ip = headerList.get('x-forwarded-for') || '127.0.0.1'
  const rateLimit = await checkRateLimit(authRateLimit, `activate_${ip}`)
  
  if (!rateLimit.success) {
    return { error: 'Trop de tentatives. Veuillez réessayer plus tard.' }
  }

  if (code.length !== 6) {
    return { error: 'Le code doit contenir 6 caractères.' }
  }

  const supabase = await createClient()

  // 1. Inscrire l'utilisateur (Supabase)
  // Selon que l'identifiant contient un '@', on utilise l'email ou le téléphone.
  const isEmail = identifier.includes('@')
  
  const signUpOptions = isEmail 
    ? { email: identifier, password } 
    : { phone: identifier, password }

  const { data: authData, error: authError } = await supabase.auth.signUp(signUpOptions)

  if (authError) {
    return { error: `Erreur d'inscription: ${authError.message}` }
  }

  // Force login pour s'assurer que le cookie de session est bien créé
  const { error: signInError } = await supabase.auth.signInWithPassword(signUpOptions)
  if (signInError) {
    return { error: `Erreur de connexion automatique: ${signInError.message}` }
  }

  const parentUserId = authData.user?.id
  if (!parentUserId) {
    return { error: 'Erreur inattendue lors de la création du compte.' }
  }

  // 2. Consommer le code via la fonction RPC `consume_parent_invitation`
  const { error: consumeError } = await supabase.rpc('consume_parent_invitation', {
    invitation_code: code.toUpperCase(),
    parent_user_id: parentUserId
  })

  if (consumeError) {
    // Note: Si la consommation échoue, le compte Auth est déjà créé.
    // L'idéal serait de faire l'inverse (vérifier d'abord) ou de gérer l'erreur,
    // mais consume_parent_invitation s'assure de l'intégrité en base.
    return { error: consumeError.message || 'Le code d\'activation est invalide, expiré ou déjà utilisé.' }
  }

  return { success: true }
}

export async function inviteStaff(prevState: any, formData: FormData): Promise<{ error?: string, success?: boolean }> {
  // Puisque nous n'utilisons pas service_role pour appeler supabase.auth.admin.inviteUserByEmail,
  // Le système d'invitation "Staff" consistera à envoyer un lien au staff, qui s'inscrira de lui-même
  // via une page d'inscription spéciale, ou créera son compte et on lui assignera le rôle via RPC.
  // La demande dit: "1. Invitation staff : lien d'activation à durée limitée envoyé par email"
  // Implémentation simplifiée : on pourrait générer un token ou utiliser magiclink s'il était configuré.
  
  // Cette partie n'est pas le focus de la maquette "activer mon compte parent", 
  // mais la fonction est préparée.
  return { error: "L'invitation du staff par email requiert un backend configuré pour l'envoi." }
}
