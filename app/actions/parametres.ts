'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type ActionState = {
  success?: boolean
  error?: string
}

function normalizeAvatarUrl(raw: string | null | undefined): { ok: true; value: string | null } | { ok: false; error: string } {
  if (raw === null || raw === undefined) return { ok: true, value: null }
  const trimmed = raw.trim()
  if (trimmed === '') return { ok: true, value: null }
  if (
    trimmed.startsWith('https://') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('/') ||
    (trimmed.startsWith('data:image/') && trimmed.length <= 250_000)
  ) {
    return { ok: true, value: trimmed }
  }
  return { ok: false, error: 'Image ou URL d’avatar invalide (ou image trop lourde).' }
}

function revalidateAvatarLayouts() {
  revalidatePath('/admin', 'layout')
  revalidatePath('/enseignant', 'layout')
  revalidatePath('/parent', 'layout')
  revalidatePath('/super_admin', 'layout')
  revalidatePath('/admin/parametres')
  revalidatePath('/admin/parametres/profil')
  revalidatePath('/enseignant/parametres')
  revalidatePath('/parent/parametres')
}

export async function updateSchoolSettings(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const name = formData.get('name') as string
  const city = formData.get('city') as string
  const phone = formData.get('phone') as string
  const email = formData.get('email') as string
  const currentAcademicYear = formData.get('currentAcademicYear') as string

  if (!name) {
    return { error: 'Le nom de l\'établissement est requis.' }
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non authentifié');

    const { data: roleData, error: roleError } = await supabase
      .from('user_school_roles')
      .select('school_id, role')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();

    if (roleError || !roleData || roleData.role !== 'admin') {
      throw new Error('Permission refusée');
    }

    const directorName = formData.get('directorName') as string
    const signatureUrl = formData.get('signatureUrl') as string
    const stampUrl = formData.get('stampUrl') as string
    const logoUrl = formData.get('logoUrl') as string

    const { error } = await supabase
      .from('schools')
      .update({
        name,
        city,
        phone,
        email,
        current_academic_year: currentAcademicYear,
        director_name: directorName || null,
        signature_url: signatureUrl || null,
        stamp_url: stampUrl || null,
        logo_url: logoUrl || null
      })
      .eq('id', roleData.school_id);

    if (error) throw error;

    const rawProfilePhoto = formData.get('profilePhotoUrl')
    if (typeof rawProfilePhoto === 'string') {
      const normalized = normalizeAvatarUrl(rawProfilePhoto)
      if (!normalized.ok) {
        return { error: normalized.error }
      }
      const { error: avatarError } = await supabase.auth.updateUser({
        data: { avatar_url: normalized.value },
      })
      if (avatarError) throw avatarError
    }

    revalidateAvatarLayouts();
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return { error: message };
  }
}

export async function updateUserAvatar(avatarUrl: string | null): Promise<ActionState> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Non authentifié' }

    const normalized = normalizeAvatarUrl(avatarUrl)
    if (!normalized.ok) {
      return { error: normalized.error }
    }

    const { error } = await supabase.auth.updateUser({
      data: { avatar_url: normalized.value },
    })
    if (error) throw error

    revalidateAvatarLayouts()
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return { error: message }
  }
}

export async function updateUserProfile(prevState: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non authentifié');

    const rawProfilePhoto = formData.get('profilePhotoUrl')
    const rawFullName = formData.get('fullName')
    const rawPhone = formData.get('phone')
    const fullName = typeof rawFullName === 'string' ? rawFullName.trim() : null
    const phone = typeof rawPhone === 'string' ? rawPhone.trim() : null

    const metadataPatch: Record<string, string | null> = {}
    if (typeof rawProfilePhoto === 'string') {
      const normalized = normalizeAvatarUrl(rawProfilePhoto)
      if (!normalized.ok) {
        return { error: normalized.error }
      }
      metadataPatch.avatar_url = normalized.value
    }
    if (fullName) {
      metadataPatch.full_name = fullName
    }

    if (Object.keys(metadataPatch).length > 0) {
      const { error } = await supabase.auth.updateUser({
        data: metadataPatch,
      })
      if (error) throw error
    }

    if (fullName) {
      await supabase
        .from('user_school_roles')
        .update({
          full_name: fullName,
          ...(phone !== null ? { phone: phone || null } : {}),
        })
        .eq('user_id', user.id)
    }

    revalidateAvatarLayouts();
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return { error: message };
  }
}

export async function updateSchoolAssetUrl(
  assetType: 'logo' | 'stamp' | 'signature',
  url: string | null
): Promise<ActionState> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Non authentifié')

    const { data: roleData, error: roleError } = await supabase
      .from('user_school_roles')
      .select('school_id, role')
      .eq('user_id', user.id)
      .maybeSingle()

    if (roleError || !roleData?.school_id) {
      throw new Error('Établissement introuvable')
    }

    const updatePayload =
      assetType === 'logo'
        ? { logo_url: url }
        : assetType === 'stamp'
          ? { stamp_url: url }
          : { signature_url: url }

    const { error } = await supabase
      .from('schools')
      .update(updatePayload)
      .eq('id', roleData.school_id)

    if (error) throw error

    revalidatePath('/admin/parametres')
    revalidatePath('/admin/classes')
    revalidatePath('/admin/eleves')
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return { error: message }
  }
}
