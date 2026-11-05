'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

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
        .eq('school_id', roleData.school_id)
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

export async function submitAbsenceJustification(
  attendanceId: string,
  justification: string
): Promise<{ error?: string; success?: boolean }> {
  try {
    const cleanText = (justification || '').trim()
    if (!cleanText || cleanText.length < 3) {
      return { error: 'Veuillez saisir un motif de justification valide (minimum 3 caractères).' }
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Non authentifié.' }

    const adminClient = createAdminClient()

    // 1. Récupérer la ligne de présence et l'élève associé
    const { data: record, error: recErr } = await adminClient
      .from('attendance')
      .select('id, student_id, school_id, date, status, students(first_name, last_name)')
      .eq('id', attendanceId)
      .maybeSingle()

    if (recErr || !record) {
      return { error: 'Enregistrement de présence introuvable.' }
    }

    // 2. Vérifier que le parent connecté est bien lié à cet élève (ou admin de l'école)
    const { data: parentLink } = await adminClient
      .from('parent_student_links')
      .select('id')
      .eq('parent_user_id', user.id)
      .eq('student_id', record.student_id)
      .maybeSingle()

    if (!parentLink) {
      const { data: adminRole } = await adminClient
        .from('user_school_roles')
        .select('id')
        .eq('user_id', user.id)
        .eq('school_id', record.school_id)
        .in('role', ['admin', 'enseignant', 'super_admin'])
        .maybeSingle()

      if (!adminRole) {
        return { error: "Vous n'êtes pas autorisé à justifier l'absence de cet élève." }
      }
    }

    const nextStatus = record.status === 'absent' ? 'absent_justifie' : record.status

    // 3. Mettre à jour le motif de justification (avec fallback si la colonne justification n'est pas encore migrée)
    const { error: updateErr } = await adminClient
      .from('attendance')
      .update({
        justification: cleanText,
        status: nextStatus,
      })
      .eq('id', attendanceId)

    if (updateErr) {
      // Fallback sur le statut uniquement si la colonne justification n'existe pas encore
      const { error: fallbackErr } = await adminClient
        .from('attendance')
        .update({ status: nextStatus })
        .eq('id', attendanceId)

      if (fallbackErr) {
        return { error: fallbackErr.message }
      }
    }

    // 4. Notifier les administrateurs de l'école
    const { data: admins } = await adminClient
      .from('user_school_roles')
      .select('user_id')
      .eq('school_id', record.school_id)
      .eq('role', 'admin')

    if (admins && admins.length > 0) {
      const studentObj = Array.isArray(record.students) ? record.students[0] : (record.students as any)
      const studentName = studentObj ? `${studentObj.first_name} ${studentObj.last_name}` : 'Élève'
      const formattedDate = new Date(record.date).toLocaleDateString('fr-FR')

      const notificationsPayload = admins.map((a) => ({
        user_id: a.user_id,
        school_id: record.school_id,
        title: `Justification d'absence — ${studentName}`,
        body: `Motif transmis pour le ${formattedDate} : "${cleanText}"`,
        type: 'attendance',
        is_read: false,
      }))

      await adminClient.from('notifications').insert(notificationsPayload)
    }

    revalidatePath('/parent/presences')
    revalidatePath(`/admin/eleves/${record.student_id}`)
    return { success: true }
  } catch (err: any) {
    console.error('Erreur submitAbsenceJustification:', err)
    return { error: err.message || 'Erreur interne lors de l’envoi de la justification.' }
  }
}
