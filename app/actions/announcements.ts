'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export type AnnouncementState = {
  success?: boolean
  error?: string
}

export async function createAnnouncement(
  _prevState: AnnouncementState,
  formData: FormData
): Promise<AnnouncementState> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Non authentifié' }

    // Accepte à la fois 'admin' et 'super_admin'
    const { data: roleRows } = await supabase
      .from('user_school_roles')
      .select('school_id, role')
      .eq('user_id', user.id)
      .in('role', ['admin', 'super_admin'])
      .limit(1)

    const roleData = roleRows?.[0]
    if (!roleData || !roleData.school_id) {
      return { error: 'Seul un administrateur ou super admin peut publier des annonces.' }
    }

    const title = (formData.get('title') as string)?.trim()
    const content = (formData.get('content') as string)?.trim()
    const targetAudience = (formData.get('targetAudience') as string) || (formData.get('targetType') as string) || 'parents'
    const targetClassId = (formData.get('targetClassId') as string)?.trim() || null

    if (!title || !content) {
      return { error: 'Le titre et le contenu sont requis.' }
    }

    let targetType = 'all'
    let targetLevel: string | null = null

    if (targetAudience === 'class') {
      targetType = 'class'
      targetLevel = null
    } else if (targetAudience === 'teachers') {
      targetType = 'all'
      targetLevel = 'teachers'
    } else if (targetAudience === 'all') {
      targetType = 'all'
      targetLevel = 'all'
    } else {
      targetType = 'all'
      targetLevel = 'parents'
    }

    const adminClient = createAdminClient()
    const { data: insertedData, error } = await adminClient
      .from('announcements')
      .insert({
        school_id: roleData.school_id,
        title,
        content,
        target_type: targetType,
        target_level: targetLevel,
        target_class_id: targetType === 'class' && targetClassId ? targetClassId : null,
        is_published: true,
        created_by: user.id,
      })
      .select('id, title, content, target_type, target_level, target_class_id')
      .single()

    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('schema cache')) {
        return {
          error: "La table 'announcements' n'est pas encore créée dans Supabase. Veuillez exécuter le script de migration SQL 0044_announcements.sql dans votre dashboard Supabase (SQL Editor)."
        }
      }
      return { error: error.message || 'Erreur lors de la création de l\'annonce.' }
    }

    // Déclencher les notifications & alertes sonores ciblées (Push FCM + Realtime in-app + Badge)
    try {
      await dispatchAnnouncementNotifications({
        schoolId: roleData.school_id,
        creatorId: user.id,
        title,
        content,
        targetType,
        targetLevel,
        targetClassId: targetType === 'class' && targetClassId ? targetClassId : null,
      })
    } catch (notifErr) {
      console.error('Erreur lors de la diffusion des notifications de l\'annonce:', notifErr)
    }

    revalidatePath('/admin/communication')
    revalidatePath('/admin/communication/annonces')
    revalidatePath('/parent')
    revalidatePath('/enseignant')
    return { success: true }
  } catch (err: unknown) {
    const message = err && typeof err === 'object' && 'message' in err
      ? String((err as any).message)
      : (err instanceof Error ? err.message : 'Erreur inattendue')
    return { error: message }
  }
}

export async function updateAnnouncement(
  id: string,
  data: { title?: string; content?: string; is_published?: boolean; target_type?: string; target_level?: string | null; target_class_id?: string | null }
): Promise<AnnouncementState> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Non authentifié' }

    const { data: roleRows } = await supabase
      .from('user_school_roles')
      .select('school_id, role')
      .eq('user_id', user.id)
      .in('role', ['admin', 'super_admin'])
      .limit(1)

    const roleData = roleRows?.[0]
    if (!roleData || !roleData.school_id) {
      return { error: 'Permission refusée.' }
    }

    const updatePayload: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (data.title !== undefined) updatePayload.title = data.title.trim()
    if (data.content !== undefined) updatePayload.content = data.content.trim()
    if (data.is_published !== undefined) updatePayload.is_published = data.is_published
    if (data.target_type !== undefined) updatePayload.target_type = data.target_type
    if (data.target_level !== undefined) updatePayload.target_level = data.target_level
    if (data.target_class_id !== undefined) updatePayload.target_class_id = data.target_class_id

    const adminClient = createAdminClient()
    const { error } = await adminClient
      .from('announcements')
      .update(updatePayload)
      .eq('id', id)
      .eq('school_id', roleData.school_id)

    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('schema cache')) {
        return {
          error: "La table 'announcements' n'est pas encore créée dans Supabase. Veuillez exécuter le script de migration SQL 0044_announcements.sql dans votre dashboard Supabase (SQL Editor)."
        }
      }
      return { error: error.message || 'Erreur lors de la mise à jour.' }
    }

    // Si l'annonce vient d'être activée/publiée, notifier les destinataires
    if (data.is_published === true) {
      const { data: currentAnn } = await adminClient
        .from('announcements')
        .select('*')
        .eq('id', id)
        .eq('school_id', roleData.school_id)
        .maybeSingle()

      if (currentAnn) {
        try {
          await dispatchAnnouncementNotifications({
            schoolId: roleData.school_id,
            creatorId: user.id,
            title: data.title || currentAnn.title,
            content: data.content || currentAnn.content,
            targetType: data.target_type || currentAnn.target_type,
            targetLevel: data.target_level !== undefined ? data.target_level : currentAnn.target_level,
            targetClassId: data.target_class_id !== undefined ? data.target_class_id : currentAnn.target_class_id,
          })
        } catch (notifErr) {
          console.error('Erreur notification publication annonce:', notifErr)
        }
      }
    }

    revalidatePath('/admin/communication')
    revalidatePath('/admin/communication/annonces')
    revalidatePath('/parent')
    revalidatePath('/enseignant')
    return { success: true }
  } catch (err: unknown) {
    const message = err && typeof err === 'object' && 'message' in err
      ? String((err as any).message)
      : (err instanceof Error ? err.message : 'Erreur inattendue')
    return { error: message }
  }
}

export async function deleteAnnouncement(id: string): Promise<AnnouncementState> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Non authentifié' }

    const { data: roleRows } = await supabase
      .from('user_school_roles')
      .select('school_id, role')
      .eq('user_id', user.id)
      .in('role', ['admin', 'super_admin'])
      .limit(1)

    const roleData = roleRows?.[0]
    if (!roleData || !roleData.school_id) {
      return { error: 'Permission refusée.' }
    }

    const adminClient = createAdminClient()
    const { error } = await adminClient
      .from('announcements')
      .delete()
      .eq('id', id)
      .eq('school_id', roleData.school_id)

    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('schema cache')) {
        return {
          error: "La table 'announcements' n'est pas encore créée dans Supabase. Veuillez exécuter le script de migration SQL 0044_announcements.sql dans votre dashboard Supabase (SQL Editor)."
        }
      }
      return { error: error.message || 'Erreur lors de la suppression.' }
    }

    revalidatePath('/admin/communication')
    revalidatePath('/admin/communication/annonces')
    revalidatePath('/parent')
    return { success: true }
  } catch (err: unknown) {
    const message = err && typeof err === 'object' && 'message' in err
      ? String((err as any).message)
      : (err instanceof Error ? err.message : 'Erreur inattendue')
    return { error: message }
  }
}

/**
 * Diffuse les notifications de l'annonce à tous les parents/enseignants ciblés
 * Crée des entrées dans public.notifications, ce qui déclenche :
 * 1) Supabase Realtime (alerte carillon sonore + vibration + toast en direct + badge)
 * 2) Le trigger DB on_new_notification_send_push -> FCM Push Notification haute priorité
 *    avec réveil de l'écran en veille et sonnerie dédiée (notification_sound).
 */
async function dispatchAnnouncementNotifications({
  schoolId,
  creatorId,
  title,
  content,
  targetType,
  targetLevel,
  targetClassId,
}: {
  schoolId: string
  creatorId: string
  title: string
  content: string
  targetType: string
  targetLevel?: string | null
  targetClassId?: string | null
}) {
  const adminClient = createAdminClient()
  let usersToNotify: string[] = []

  if (targetType === 'all') {
    const audience = targetLevel || 'all'

    // Si l'audience inclut les parents ('parents' ou 'all')
    if (audience === 'parents' || audience === 'all') {
      const { data: parentUsers } = await adminClient
        .from('user_school_roles')
        .select('user_id')
        .eq('school_id', schoolId)
        .eq('role', 'parent')

      if (parentUsers) {
        usersToNotify.push(...parentUsers.map(u => u.user_id))
      }
    }

    // Si l'audience inclut les enseignants ('teachers' ou 'all')
    if (audience === 'teachers' || audience === 'all') {
      const { data: teacherUsers } = await adminClient
        .from('user_school_roles')
        .select('user_id')
        .eq('school_id', schoolId)
        .eq('role', 'enseignant')

      if (teacherUsers) {
        usersToNotify.push(...teacherUsers.map(u => u.user_id))
      }
    }
  } else if (targetType === 'class' && targetClassId) {
    // 1. Trouver les élèves inscrits dans cette classe
    const { data: studentsInClass } = await adminClient
      .from('students')
      .select('id')
      .eq('class_id', targetClassId)
      .eq('school_id', schoolId)

    if (studentsInClass && studentsInClass.length > 0) {
      const studentIds = studentsInClass.map(s => s.id)
      const { data: linkData } = await adminClient
        .from('parent_student_links')
        .select('parent_user_id')
        .in('student_id', studentIds)

      if (linkData) {
        usersToNotify.push(...linkData.map(l => l.parent_user_id))
      }
    }

    // 2. Enseignant titulaire de la classe
    const { data: classData } = await adminClient
      .from('classes')
      .select('main_teacher_id')
      .eq('id', targetClassId)
      .eq('school_id', schoolId)
      .maybeSingle()

    if (classData?.main_teacher_id) {
      usersToNotify.push(classData.main_teacher_id)
    }

    // 3. Enseignants intervenant dans cette classe
    const { data: tcsData } = await adminClient
      .from('teacher_class_subjects')
      .select('teacher_id')
      .eq('class_id', targetClassId)

    if (tcsData) {
      usersToNotify.push(...tcsData.map(t => t.teacher_id).filter(Boolean))
    }
  }

  // Filtrer les doublons et exclure l'auteur (admin)
  const uniqueUserIds = Array.from(new Set(usersToNotify)).filter(uid => uid && uid !== creatorId)

  if (uniqueUserIds.length === 0) return

  // Récupérer le rôle de chaque utilisateur pour configurer le lien d'action
  const { data: userRoles } = await adminClient
    .from('user_school_roles')
    .select('user_id, role')
    .in('user_id', uniqueUserIds)
    .eq('school_id', schoolId)

  const roleMap = new Map((userRoles || []).map(r => [r.user_id, r.role]))

  const notifTitle = `📢 Annonce : ${title}`
  const notifMessage = content.length > 150 ? `${content.substring(0, 150)}...` : content

  const notificationsToInsert = uniqueUserIds.map(uid => {
    const role = roleMap.get(uid)
    const actionUrl = role === 'enseignant' ? '/enseignant' : '/parent'

    return {
      school_id: schoolId,
      user_id: uid,
      title: notifTitle,
      message: notifMessage,
      type: 'annonce',
      action_url: actionUrl,
      is_read: false,
    }
  })

  // Insérer par lots de 100
  const chunkSize = 100
  for (let i = 0; i < notificationsToInsert.length; i += chunkSize) {
    const chunk = notificationsToInsert.slice(i, i + chunkSize)
    const { error: insertErr } = await adminClient.from('notifications').insert(chunk)
    if (insertErr) {
      console.error('Erreur insertion notifications annonce:', insertErr)
    }
  }
}

