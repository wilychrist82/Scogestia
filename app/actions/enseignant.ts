'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type ActionState = {
  success?: boolean
  error?: string
}

export async function updateTeacherProfile(prevState: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Non authentifié')

    const profilePhotoUrl = formData.get('profilePhotoUrl') as string

    if (profilePhotoUrl !== null) {
      const { error } = await supabase.auth.updateUser({
        data: { avatar_url: profilePhotoUrl }
      })
      if (error) throw error
    }

    revalidatePath('/enseignant/parametres')
    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}
