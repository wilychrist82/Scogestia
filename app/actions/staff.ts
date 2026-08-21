'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service'
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

export async function inviteStaff(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const fullName = formData.get('fullName') as string;
  let email = formData.get('email') as string;
  const phone = formData.get('phone') as string;
  const role = formData.get('role') as string;

  if (!fullName || !role) {
    return { error: 'Veuillez remplir les champs obligatoires (nom, rôle).' };
  }
  
  if (!email) {
    email = `no-email-${Date.now()}@ecole.com`;
  }

  try {
    const school_id = await getActiveSchoolId();
    const serviceClient = createServiceRoleClient();
    
    // 1. Check if user already exists in auth.users by email
    // Invite user will send magic link and create user if not exists
    const { data: inviteData, error: inviteError } = await serviceClient.auth.admin.inviteUserByEmail(email, {
      data: {
        full_name: fullName
      }
    });

    if (inviteError) {
      return { error: `Erreur d'invitation : ${inviteError.message}` };
    }

    const invitedUserId = inviteData.user.id;

    // 2. Add to user_school_roles
    const { error: dbError } = await serviceClient
      .from('user_school_roles')
      .upsert({
        user_id: invitedUserId,
        school_id,
        role,
        full_name: fullName,
        phone: phone || null,
        is_active: true
      }, { onConflict: 'user_id, school_id, role' });

    if (dbError) {
      return { error: `Erreur base de données : ${dbError.message}` };
    }

    revalidatePath('/admin/personnel');
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function deleteStaff(staffId: string): Promise<ActionState> {
  try {
    const school_id = await getActiveSchoolId();
    const serviceClient = createServiceRoleClient();

    const { error } = await serviceClient
      .from('user_school_roles')
      .delete()
      .eq('id', staffId)
      .eq('school_id', school_id);

    if (error) {
      return { error: `Erreur lors de la suppression : ${error.message}` };
    }

    revalidatePath('/admin/personnel');
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}
