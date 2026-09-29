'use server'

import { createClient } from '@/lib/supabase/server'
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

    const { data: roleData } = await supabase
      .from('user_school_roles')
      .select('school_id, role')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!roleData || roleData.role !== 'admin') {
      return { error: 'Seul un administrateur peut publier des annonces.' }
    }

    const title = formData.get('title') as string
    const content = formData.get('content') as string
    const targetType = (formData.get('targetType') as string) || 'all'
    const targetClassId = formData.get('targetClassId') as string | null

    if (!title || !content) {
      return { error: 'Le titre et le contenu sont requis.' }
    }

    const { error } = await supabase.from('announcements').insert({
      school_id: roleData.school_id,
      title,
      content,
      target_type: targetType,
      target_class_id: targetType === 'class' && targetClassId ? targetClassId : null,
      is_published: true,
      created_by: user.id,
    })

    if (error) throw error

    revalidatePath('/admin/communication')
    revalidatePath('/admin/communication/annonces')
    revalidatePath('/parent')
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
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

    const { data: roleData } = await supabase
      .from('user_school_roles')
      .select('school_id, role')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!roleData || roleData.role !== 'admin') {
      return { error: 'Permission refusée.' }
    }

    const updatePayload: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (data.title !== undefined) updatePayload.title = data.title
    if (data.content !== undefined) updatePayload.content = data.content
    if (data.is_published !== undefined) updatePayload.is_published = data.is_published
    if (data.target_type !== undefined) updatePayload.target_type = data.target_type
    if (data.target_class_id !== undefined) updatePayload.target_class_id = data.target_class_id

    const { error } = await supabase
      .from('announcements')
      .update(updatePayload)
      .eq('id', id)
      .eq('school_id', roleData.school_id)

    if (error) throw error

    revalidatePath('/admin/communication')
    revalidatePath('/admin/communication/annonces')
    revalidatePath('/parent')
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return { error: message }
  }
}

export async function deleteAnnouncement(id: string): Promise<AnnouncementState> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Non authentifié' }

    const { data: roleData } = await supabase
      .from('user_school_roles')
      .select('school_id, role')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!roleData || roleData.role !== 'admin') {
      return { error: 'Permission refusée.' }
    }

    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', id)
      .eq('school_id', roleData.school_id)

    if (error) throw error

    revalidatePath('/admin/communication')
    revalidatePath('/admin/communication/annonces')
    revalidatePath('/parent')
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return { error: message }
  }
}
