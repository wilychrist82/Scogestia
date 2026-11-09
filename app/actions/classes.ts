'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { assertActiveSubscription } from '@/lib/subscription'

export type ActionState = {
  error?: string
  success?: boolean
} | null

async function getActiveSchoolId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { data: roleData, error } = await supabase
    .from('user_school_roles')
    .select('school_id')
    .eq('user_id', user.id)
    .in('role', ['admin', 'super_admin', 'directeur', 'censeur', 'secretaire'])
    .limit(1)
    .maybeSingle()

  if (error || !roleData) throw new Error('Action réservée aux administrateurs')
  return roleData.school_id
}

function getFallbackAcademicYear() {
  const date = new Date()
  const year = date.getFullYear()
  const month = date.getMonth()
  return month < 7 ? `${year - 1}-${year}` : `${year}-${year + 1}`
}

export async function createClass(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const name = formData.get('className') as string
  const level = formData.get('classLevel') as string
  const capacityStr = formData.get('capacity') as string
  const capacity = capacityStr ? parseInt(capacityStr) : null

  if (!name || !level) {
    return { error: 'Veuillez remplir les champs obligatoires (nom, niveau).' }
  }

  try {
    const school_id = await getActiveSchoolId()
    const supabase = await createClient()

    await assertActiveSubscription(supabase, school_id)

    const { data: schoolData } = await supabase
      .from('schools')
      .select('current_academic_year')
      .eq('id', school_id)
      .maybeSingle()

    const academic_year =
      (formData.get('academic_year') as string)?.trim() ||
      schoolData?.current_academic_year ||
      getFallbackAcademicYear()

    const { error } = await supabase
      .from('classes')
      .insert({
        school_id,
        name,
        level,
        capacity,
        academic_year,
      })

    if (error) {
      return { error: `Erreur lors de la création : ${error.message}` }
    }

    revalidatePath('/admin/classes')
    revalidatePath('/admin')
    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}

export async function updateClass(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const id = formData.get('classId') as string
  const name = formData.get('className') as string
  const level = formData.get('classLevel') as string
  const capacityStr = formData.get('capacity') as string
  const capacity = capacityStr ? parseInt(capacityStr) : null

  if (!id || !name || !level) {
    return { error: 'Veuillez remplir les champs obligatoires.' }
  }

  try {
    const school_id = await getActiveSchoolId()
    const supabase = await createClient()

    const { error } = await supabase
      .from('classes')
      .update({ name, level, capacity })
      .eq('id', id)
      .eq('school_id', school_id)

    if (error) {
      return { error: `Erreur lors de la modification : ${error.message}` }
    }

    revalidatePath('/admin/classes')
    revalidatePath('/admin')
    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}

export async function deleteClass(classId: string): Promise<ActionState> {
  try {
    const school_id = await getActiveSchoolId()
    const supabase = await createClient()

    const { error } = await supabase
      .from('classes')
      .delete()
      .eq('id', classId)
      .eq('school_id', school_id)

    if (error) {
      return { error: `Erreur lors de la suppression : ${error.message}` }
    }

    revalidatePath('/admin/classes')
    revalidatePath('/admin')
    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}
