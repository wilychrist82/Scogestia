'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function generateDues(prevState: any, formData: FormData): Promise<{ error?: string, success?: boolean }> {
  const targetType = formData.get('target_type') as string // 'class' or 'student'
  const targetSelect = formData.get('target_select') as string // class_id or student_id
  const label = formData.get('payment_label') as string
  const amountStr = formData.get('amount') as string
  const dueDate = formData.get('due_date') as string

  if (!targetType || !targetSelect || !label || !amountStr || !dueDate) {
    return { error: 'Veuillez remplir tous les champs requis.' }
  }

  const amount = parseFloat(amountStr)
  if (isNaN(amount) || amount <= 0) {
    return { error: 'Le montant doit être un nombre positif.' }
  }

  const supabase = await createClient()

  // 1. Vérifier l'école active de l'utilisateur
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { data: roleData } = await supabase
    .from('user_school_roles')
    .select('school_id')
    .eq('user_id', user.id)
    .single()

  if (!roleData?.school_id) {
    return { error: 'École introuvable pour cet utilisateur.' }
  }

  const schoolId = roleData.school_id
  let studentsToBill: string[] = []

  // 2. Récupérer les étudiants concernés
  if (targetType === 'class') {
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('id')
      .eq('class_id', targetSelect)
      .eq('school_id', schoolId)
      .eq('status', 'actif')

    if (studentsError) return { error: 'Erreur lors de la récupération des élèves de la classe.' }
    studentsToBill = students.map(s => s.id)
  } else if (targetType === 'student') {
    // Vérifier que l'élève appartient bien à l'école
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id')
      .eq('id', targetSelect)
      .eq('school_id', schoolId)
      .single()
      
    if (studentError || !student) return { error: 'Élève introuvable ou n\'appartient pas à votre école.' }
    studentsToBill = [student.id]
  }

  if (studentsToBill.length === 0) {
    return { error: 'Aucun élève actif trouvé pour cette sélection.' }
  }

  // 3. Préparer le bulk insert
  const duesToInsert = studentsToBill.map(studentId => ({
    school_id: schoolId,
    student_id: studentId,
    label,
    amount,
    due_date: dueDate,
    status: 'en_attente',
    created_by: user.id
  }))

  const { error: insertError } = await supabase
    .from('dues')
    .insert(duesToInsert)

  if (insertError) {
    return { error: 'Erreur lors de la création des échéances : ' + insertError.message }
  }

  redirect('/comptable/echeances')
}

export async function sendManualReminder(dueId: string): Promise<{ error?: string, success?: boolean }> {
  const supabase = await createClient()

  // 1. Authentification et vérification du rôle
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { data: roleData } = await supabase
    .from('user_school_roles')
    .select('school_id, role')
    .eq('user_id', user.id)
    .in('role', ['admin', 'comptable'])
    .single()

  if (!roleData) return { error: 'Non autorisé' }

  // 2. Récupérer l'échéance et le numéro du parent
  const { data: due, error: dueError } = await supabase
    .from('dues')
    .select(`
      id,
      label,
      amount,
      status,
      school_id,
      student:students!inner(
        parent_links:parent_student_links!inner(
          parent:users!parent_user_id(
            phone
          )
        )
      )
    `)
    .eq('id', dueId)
    .eq('school_id', roleData.school_id)
    .single()

  if (dueError || !due) return { error: 'Échéance introuvable ou non autorisée' }
  if (due.status === 'paye') return { error: 'Cette échéance est déjà payée' }

  // @ts-ignore - Supabase type casting pour les relations complexes
  const parentPhone = due.student?.parent_links?.[0]?.parent?.phone
  if (!parentPhone) return { error: 'Aucun numéro de téléphone trouvé pour le parent' }

  // 3. Envoyer le SMS via l'Edge Function
  const message = `Rappel Scogestia: Votre paiement de ${due.amount.toLocaleString('fr-FR')} FCFA pour "${due.label}" est en attente. Merci de régulariser la situation.`
  
  const { error: invokeError } = await supabase.functions.invoke('send-sms', {
    body: { phone: parentPhone, message }
  })

  // 4. Logger dans payment_reminders
  const status = invokeError ? 'failed' : 'sent'
  const { error: logError } = await supabase
    .from('payment_reminders')
    .insert({
      due_id: due.id,
      type: 'manual',
      status: status,
      error_details: invokeError ? JSON.stringify(invokeError) : null
    })

  if (invokeError) {
    console.error("Erreur d'envoi SMS manuel:", invokeError)
    return { error: 'Le SMS n\'a pas pu être envoyé.' }
  }

  revalidatePath('/comptable')
  return { success: true }
}

