'use server'

import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { authRateLimit, checkRateLimit } from '@/lib/ratelimit'
import { createAdminClient } from '@/lib/supabase/admin'

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
  const identifier = formData.get('identifier') as string
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
  const adminClient = createAdminClient()

  // 1. Inscrire l'utilisateur (Supabase)
  const isEmail = identifier.includes('@')
  const signUpOptions = isEmail 
    ? { email: identifier, password } 
    : { phone: identifier, password }

  let parentUserId: string | undefined = undefined

  // 1. Tenter la connexion en premier (si le parent existe déjà)
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword(signUpOptions)

  if (signInError) {
    // Si la connexion échoue (identifiants invalides = n'existe pas ou mauvais mot de passe)
    // Tentons de créer le compte avec auto-confirmation
    const { data: newUserData, error: createUserError } = await adminClient.auth.admin.createUser({
      ...signUpOptions,
      email_confirm: true,
      phone_confirm: true
    })

    if (createUserError) {
      // S'il existe déjà mais mauvais mot de passe, createUser échouera avec 'already registered'
      if (createUserError.message.includes('already registered')) {
        return { error: 'Ce numéro de téléphone est déjà enregistré avec un autre mot de passe.' }
      }
      return { error: `Erreur d'inscription: ${createUserError.message}` }
    }

    // Le compte est créé et confirmé, on le connecte
    const { data: newSignInData, error: newSignInError } = await supabase.auth.signInWithPassword(signUpOptions)
    if (newSignInError) {
      return { error: `Erreur de connexion automatique: ${newSignInError.message}` }
    }
    parentUserId = newSignInData.user?.id
  } else {
    // Il existait déjà et le mot de passe est bon
    parentUserId = signInData.user?.id
  }

  if (!parentUserId) {
    return { error: 'Erreur inattendue lors de la récupération du compte.' }
  }

  // 2. Consommer le code manuellement via l'Admin Client (contourne le bug RPC "ambiguous column")
  
  // A. Trouver l'invitation valide
  const { data: inv, error: invError } = await adminClient
    .from('parent_invitation_codes')
    .select('*')
    .eq('code', code.toUpperCase())
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()

  if (invError || !inv) {
    return { error: 'Le code d\'activation est invalide, expiré ou déjà utilisé.' }
  }

  // B. Marquer comme utilisé
  await adminClient
    .from('parent_invitation_codes')
    .update({ used_at: new Date().toISOString() })
    .eq('id', inv.id)

  // C. Lier le parent à l'étudiant
  const { error: linkError } = await adminClient
    .from('parent_student_links')
    .insert({
      parent_user_id: parentUserId,
      student_id: inv.student_id,
      school_id: inv.school_id,
      relationship: 'parent'
    })

  if (linkError) {
    console.error("Erreur création parent_student_links:", linkError)
    return { error: "Erreur lors de la liaison à l'élève. L'administrateur a été notifié." }
  }

  // D. S'assurer que le parent a le rôle 'parent' (upsert pour éviter conflit d'unicité)
  await adminClient
    .from('user_school_roles')
    .upsert({
      user_id: parentUserId,
      school_id: inv.school_id,
      role: 'parent',
      full_name: 'Parent'
    }, { onConflict: 'user_id,school_id,role', ignoreDuplicates: true })

  return { success: true }
}

/**
 * Permet à un parent déjà connecté de lier un autre enfant à son compte via son code d'activation.
 */
export async function linkChildWithCode(code: string): Promise<{ error?: string, success?: boolean, studentName?: string, studentId?: string }> {
  if (!code || code.trim().length !== 6) {
    return { error: 'Le code d\'activation doit contenir 6 caractères.' }
  }

  const cleanCode = code.trim().toUpperCase()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Vous devez être connecté pour lier un élève.' }
  }

  const adminClient = createAdminClient()

  // 1. Trouver le code valide
  const { data: inv, error: invError } = await adminClient
    .from('parent_invitation_codes')
    .select('id, school_id, student_id, expires_at, used_at')
    .eq('code', cleanCode)
    .maybeSingle()

  if (invError || !inv) {
    return { error: 'Code d\'activation introuvable ou invalide.' }
  }

  if (inv.used_at) {
    return { error: 'Ce code d\'activation a déjà été utilisé.' }
  }

  if (new Date(inv.expires_at) < new Date()) {
    return { error: 'Ce code d\'activation a expiré.' }
  }

  // 2. Vérifier si l'élève est déjà lié à ce parent
  const { data: existingLink } = await adminClient
    .from('parent_student_links')
    .select('id')
    .eq('parent_user_id', user.id)
    .eq('student_id', inv.student_id)
    .maybeSingle()

  if (existingLink) {
    return { error: 'Cet enfant est déjà lié à votre compte.' }
  }

  // 3. Récupérer les infos de l'élève pour le message de confirmation
  const { data: student } = await adminClient
    .from('students')
    .select('first_name, last_name')
    .eq('id', inv.student_id)
    .maybeSingle()

  const studentName = student ? `${student.first_name} ${student.last_name}` : 'l\'élève'

  // 4. Lier l'élève au parent
  const { error: linkError } = await adminClient
    .from('parent_student_links')
    .insert({
      parent_user_id: user.id,
      student_id: inv.student_id,
      school_id: inv.school_id,
      relationship: 'parent'
    })

  if (linkError) {
    console.error('Erreur liaison parent-élève:', linkError)
    return { error: 'Impossible de lier l\'élève. Veuillez réessayer.' }
  }

  // 5. Marquer le code comme consommé
  await adminClient
    .from('parent_invitation_codes')
    .update({ used_at: new Date().toISOString() })
    .eq('id', inv.id)

  // 6. S'assurer que le rôle parent existe pour cette école
  const parentFullName = user.user_metadata?.full_name || 'Parent'
  await adminClient
    .from('user_school_roles')
    .upsert({
      user_id: user.id,
      school_id: inv.school_id,
      role: 'parent',
      full_name: parentFullName
    }, { onConflict: 'user_id,school_id,role', ignoreDuplicates: true })

  revalidatePath('/parent')
  revalidatePath('/parent/messages')

  return { success: true, studentName, studentId: inv.student_id }
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
