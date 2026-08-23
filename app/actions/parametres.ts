'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type ActionState = {
  success?: boolean
  error?: string
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
      .maybeSingle();

    if (roleError || !roleData || roleData.role !== 'admin') {
      throw new Error('Permission refusée');
    }

    const { error } = await supabase
      .from('schools')
      .update({
        name,
        city,
        phone,
        email,
        current_academic_year: currentAcademicYear
      })
      .eq('id', roleData.school_id);

    if (error) throw error;

    revalidatePath('/admin/parametres');
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}
