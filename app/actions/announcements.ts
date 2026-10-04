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
    const targetType = (formData.get('targetType') as string) || 'all'
    const targetClassId = (formData.get('targetClassId') as string)?.trim() || null

    if (!title || !content) {
      return { error: 'Le titre et le contenu sont requis.' }
    }

    const adminClient = createAdminClient()
    const { error } = await adminClient.from('announcements').insert({
      school_id: roleData.school_id,
      title,
      content,
      target_type: targetType,
      target_class_id: targetType === 'class' && targetClassId ? targetClassId : null,
      is_published: true,
      created_by: user.id,
    })

    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('schema cache')) {
        return {
          error: "La table 'announcements' n'est pas encore créée dans Supabase. Veuillez exécuter le script de migration SQL 0044_announcements.sql dans votre dashboard Supabase (SQL Editor)."
        }
      }
      return { error: error.message || 'Erreur lors de la création de l\'annonce.' }
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

export async function updateAnnouncement(
  id: string,
  data: { title?: string; content?: string; is_published?: boolean; target_type?: string; target_class_id?: string | null }
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
