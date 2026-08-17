'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type GradeSavePayload = {
  student_id: string
  class_id: string
  subject_name: string
  term: string
  evaluation_type: 'devoir_maison' | 'devoir_mensuel' | 'composition_trimestrielle'
  score: number | null
}

export async function saveGrade(payload: GradeSavePayload): Promise<{ error?: string, success?: boolean }> {
  try {
    const supabase = await createClient()

    // 1. Authentification
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Non authentifié' }

    // 2. Vérification du rôle et récupération de l'école
    const { data: roleData } = await supabase
      .from('user_school_roles')
      .select('school_id, role')
      .eq('user_id', user.id)
      .in('role', ['admin', 'enseignant'])
      .single()

    if (!roleData) return { error: 'Non autorisé' }

    // Validation basique
    if (payload.score !== null && (payload.score < 0 || payload.score > 20)) {
      return { error: 'La note doit être comprise entre 0 et 20' }
    }

    if (payload.score === null) {
      // Si la note est vide, on la supprime
      const { error: deleteError } = await supabase
        .from('grades')
        .delete()
        .match({
          student_id: payload.student_id,
          class_id: payload.class_id,
          subject_name: payload.subject_name,
          term: payload.term,
          evaluation_type: payload.evaluation_type
        })
      if (deleteError) return { error: deleteError.message }
    } else {
      // Upsert
      const coeff = payload.evaluation_type === 'composition_trimestrielle' ? 2 : (payload.evaluation_type === 'devoir_mensuel' ? 1 : 0.5)

      const { error: upsertError } = await supabase
        .from('grades')
        .upsert({
          school_id: roleData.school_id,
          student_id: payload.student_id,
          class_id: payload.class_id,
          subject_name: payload.subject_name,
          evaluation_type: payload.evaluation_type,
          term: payload.term,
          score: payload.score,
          max_score: 20,
          coefficient: coeff,
          entered_by: user.id
        }, {
          onConflict: 'student_id, class_id, subject_name, term, evaluation_type'
        })
      
      if (upsertError) return { error: upsertError.message }
    }

    // On ne fait pas de revalidatePath systématique ici pour éviter de re-render 
    // toute la page à chaque frappe d'un utilisateur.
    // L'état est géré localement dans la grille.
    return { success: true }
  } catch (err: any) {
    console.error("Erreur saveGrade:", err)
    return { error: err.message || "Erreur interne" }
  }
}

// Action pour synchroniser un batch (hors-ligne)
export async function syncOfflineGrades(payloads: GradeSavePayload[]): Promise<{ error?: string, success?: boolean, failedCount?: number }> {
  let failedCount = 0
  for (const payload of payloads) {
    const res = await saveGrade(payload)
    if (res.error) failedCount++
  }
  
  if (payloads.length > 0) {
    // Si on a synchronisé, là on peut revalider la page pour tout mettre à jour
    const classId = payloads[0].class_id
    const subject = payloads[0].subject_name
    const term = payloads[0].term
    revalidatePath(`/enseignant/notes/${classId}/${subject}/${term}`)
  }

  if (failedCount > 0) {
    return { error: `${failedCount} note(s) n'ont pas pu être synchronisées.`, failedCount }
  }
  return { success: true }
}
