'use server'

import { createClient } from '@/lib/supabase/server'

export type AttendanceStatus = 'present' | 'absent' | 'retard' | 'absent_justifie' | 'non_defini'

export type AttendanceSavePayload = {
  student_id: string
  status: AttendanceStatus
}

export async function saveClassAttendance(
  classId: string, 
  date: string, 
  attendances: AttendanceSavePayload[]
): Promise<{ error?: string, success?: boolean }> {
  try {
    const supabase = await createClient()

    // 1. Authentification
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Non authentifié' }

    // 2. Vérification: L'enseignant a-t-il accès à cette école ?
    const { data: roleRows } = await supabase
      .from('user_school_roles')
      .select('school_id, role')
      .eq('user_id', user.id)
      .in('role', ['admin', 'enseignant'])
      .limit(1)

    const roleData = roleRows?.[0]
    if (!roleData) return { error: 'Non autorisé' }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: 'Date invalide' }

    // La classe doit appartenir à l'école de l'utilisateur
    const { data: cls } = await supabase
      .from('classes')
      .select('id')
      .eq('id', classId)
      .eq('school_id', roleData.school_id)
      .maybeSingle()
    if (!cls) return { error: 'Classe introuvable' }
    
    // (Optionnel) on pourrait re-vérifier si teacher_class_subjects inclut classId pour cet enseignant
    
    // 3. Préparer les données pour le Upsert
    const upsertData = attendances
      .filter(a => a.status !== 'non_defini') // On ne sauvegarde pas l'état 'non_defini'
      .map(a => ({
        school_id: roleData.school_id,
        class_id: classId,
        student_id: a.student_id,
        date: date,
        status: a.status,
        recorded_by: user.id
      }))

    // S'il n'y a rien à sauvegarder (tout est non défini), on peut s'arrêter là
    // ou supprimer les entrées existantes pour cette date
    if (upsertData.length > 0) {
      const { error: upsertError } = await supabase
        .from('attendance')
        .upsert(upsertData, {
          onConflict: 'student_id, date'
        })
        
      if (upsertError) return { error: upsertError.message }
    }

    // 4. Gérer les suppressions (si un élève était présent et qu'on le remet à 'non_defini')
    const undefinedStudents = attendances
      .filter(a => a.status === 'non_defini')
      .map(a => a.student_id)
      
    if (undefinedStudents.length > 0) {
      const { error: deleteError } = await supabase
        .from('attendance')
        .delete()
        .eq('class_id', classId)
        .eq('date', date)
        .in('student_id', undefinedStudents)
        
      if (deleteError) return { error: deleteError.message }
    }

    return { success: true }
  } catch (err: any) {
    console.error("Erreur saveClassAttendance:", err)
    return { error: err.message || "Erreur interne" }
  }
}
