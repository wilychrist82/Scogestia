'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type ActionState = {
  error?: string;
  success?: boolean;
} | null;

async function getActiveSchoolId() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié');

  const { data: roleData, error } = await supabase
    .from('user_school_roles')
    .select('school_id')
    .eq('user_id', user.id)
    .single();

  if (error || !roleData) throw new Error('École introuvable');
  return roleData.school_id;
}

export async function createClass(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const name = formData.get('className') as string;
  const level = formData.get('classLevel') as string;
  const capacity = parseInt(formData.get('capacity') as string) || 40;
  // Note: academic_year can be handled centrally. We'll hardcode "2026-2027" for now or expect it in formData
  const academic_year = '2026-2027'; 

  if (!name || !level) {
    return { error: 'Veuillez remplir les champs obligatoires (nom, niveau).' };
  }

  try {
    const school_id = await getActiveSchoolId();
    const supabase = await createClient();

    const { error } = await supabase
      .from('classes')
      .insert({
        school_id,
        name,
        level,
        capacity,
        academic_year
      });

    if (error) {
      return { error: `Erreur lors de la création : ${error.message}` };
    }

    revalidatePath('/admin/classes');
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function updateClass(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const id = formData.get('classId') as string;
  const name = formData.get('className') as string;
  const level = formData.get('classLevel') as string;
  const capacity = parseInt(formData.get('capacity') as string) || 40;

  if (!id || !name || !level) {
    return { error: 'Veuillez remplir les champs obligatoires.' };
  }

  try {
    const school_id = await getActiveSchoolId();
    const supabase = await createClient();

    const { error } = await supabase
      .from('classes')
      .update({ name, level, capacity })
      .eq('id', id)
      .eq('school_id', school_id); // Security: ensure it belongs to the school

    if (error) {
      return { error: `Erreur lors de la modification : ${error.message}` };
    }

    revalidatePath('/admin/classes');
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function deleteClass(classId: string): Promise<ActionState> {
  try {
    const school_id = await getActiveSchoolId();
    const supabase = await createClient();

    const { error } = await supabase
      .from('classes')
      .delete()
      .eq('id', classId)
      .eq('school_id', school_id); // Security: ensure it belongs to the school

    if (error) {
      return { error: `Erreur lors de la suppression : ${error.message}` };
    }

    revalidatePath('/admin/classes');
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}
