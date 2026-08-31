'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { revalidatePath } from 'next/cache'

export type ActionState = {
  error?: string;
  success?: boolean;
  code?: string;
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
  const email = formData.get('email') as string;
  const phone = formData.get('phone') as string;
  const role = formData.get('role') as string;
  const password = formData.get('password') as string;

  if (!fullName || !role) {
    return { error: 'Veuillez remplir les champs obligatoires (nom, rôle).' };
  }

  // Identifier for user
  const identifier = email || phone;
  if (!identifier && password) {
    return { error: 'Veuillez fournir un email ou un téléphone pour créer un compte avec mot de passe.' };
  }

  try {
    const school_id = await getActiveSchoolId();
    const serviceClient = createServiceRoleClient();
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (password) {
      // OPTION A: Création manuelle avec mot de passe
      const isEmail = identifier.includes('@');
      const createOptions = isEmail 
        ? { email: identifier, password, email_confirm: true, user_metadata: { full_name: fullName } }
        : { phone: identifier, password, phone_confirm: true, user_metadata: { full_name: fullName } };

      const { data: newUser, error: createError } = await serviceClient.auth.admin.createUser(createOptions);

      if (createError) {
        return { error: `Erreur de création du compte : ${createError.message}` };
      }

      // Add to user_school_roles
      const { error: dbError } = await serviceClient
        .from('user_school_roles')
        .upsert({
          user_id: newUser.user.id,
          school_id,
          role,
          full_name: fullName,
          phone: phone || null,
          is_active: true
        }, { onConflict: 'user_id, school_id, role' });

      if (dbError) {
        return { error: `Erreur lors de l'attribution du rôle : ${dbError.message}` };
      }

      revalidatePath('/admin/personnel');
      return { success: true };

    } else {
      // OPTION B: Génération de lien d'invitation
      // Générer un code alphanumérique unique de 6 caractères
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let code = '';
      let isUnique = false;

      while (!isUnique) {
        code = '';
        for (let i = 0; i < 6; i++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        const { count } = await serviceClient
          .from('staff_invitation_codes')
          .select('id', { count: 'exact', head: true })
          .eq('code', code);
        
        if (count === 0) isUnique = true;
      }

      const { error: insertError } = await serviceClient
        .from('staff_invitation_codes')
        .insert({
          school_id,
          role,
          full_name: fullName,
          email: email || null,
          phone: phone || null,
          code: code,
          created_by: user?.id
        });

      if (insertError) {
        return { error: `Erreur de génération du code : ${insertError.message}` };
      }

      revalidatePath('/admin/personnel');
      return { success: true, code: code };
    }
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function activateStaffAccount(prevState: any, formData: FormData): Promise<{ error?: string, success?: boolean }> {
  const identifier = formData.get('identifier') as string;
  const code = formData.get('code') as string;
  const password = formData.get('password') as string;

  if (!identifier || !code || !password) {
    return { error: 'Veuillez remplir tous les champs.' };
  }

  const supabase = await createClient();
  const adminClient = createServiceRoleClient();

  const isEmail = identifier.includes('@');
  const signUpOptions = isEmail 
    ? { email: identifier, password } 
    : { phone: identifier, password };

  const { data: authData, error: authError } = await supabase.auth.signUp(signUpOptions);

  if (authError && !authError.message.includes('already registered')) {
    return { error: `Erreur d'inscription: ${authError.message}` };
  }

  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword(signUpOptions);
  
  if (signInError) {
    return { error: `Erreur de connexion: ${signInError.message}` };
  }

  const staffUserId = signInData.user?.id;
  if (!staffUserId) return { error: 'Erreur inattendue.' };

  const { data: inv, error: invError } = await adminClient
    .from('staff_invitation_codes')
    .select('*')
    .eq('code', code.toUpperCase())
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (invError || !inv) {
    return { error: 'Le code d\'activation est invalide, expiré ou déjà utilisé.' };
  }

  const { error: rpcError } = await adminClient.rpc('consume_staff_invitation', {
    invitation_code: code.toUpperCase(),
    staff_user_id: staffUserId
  });

  if (rpcError) {
    return { error: `Erreur d'activation: ${rpcError.message}` };
  }

  return { success: true };
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

export async function editStaff(staffRoleId: string, formData: FormData): Promise<ActionState> {
  const fullName = formData.get('fullName') as string;
  const role = formData.get('role') as string;
  const phone = formData.get('phone') as string;
  const password = formData.get('password') as string;

  if (!fullName || !role) {
    return { error: 'Nom et rôle sont obligatoires.' };
  }

  try {
    const school_id = await getActiveSchoolId();
    const serviceClient = createServiceRoleClient();

    // Récupérer l'user_id correspondant pour mettre à jour le mot de passe si fourni
    const { data: roleData, error: fetchError } = await serviceClient
      .from('user_school_roles')
      .select('user_id')
      .eq('id', staffRoleId)
      .single();

    if (fetchError || !roleData) {
      return { error: 'Membre introuvable.' };
    }

    if (password && roleData.user_id) {
      const { error: updateAuthError } = await serviceClient.auth.admin.updateUserById(
        roleData.user_id,
        { password: password }
      );
      if (updateAuthError) {
        return { error: `Erreur lors de la modification du mot de passe : ${updateAuthError.message}` };
      }
    }

    const { error } = await serviceClient
      .from('user_school_roles')
      .update({
        full_name: fullName,
        role,
        phone: phone || null
      })
      .eq('id', staffRoleId)
      .eq('school_id', school_id);

    if (error) {
      return { error: `Erreur de modification : ${error.message}` };
    }

    revalidatePath('/admin/personnel');
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function getTeacherAssignments(teacherUserId: string) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('teacher_class_subjects')
      .select('id, class_id, subject_name, coefficient, classes(name, level)')
      .eq('teacher_id', teacherUserId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  } catch (err: any) {
    console.error(err);
    return [];
  }
}

export async function assignTeacherToClass(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const teacherUserId = formData.get('teacherUserId') as string;
  const classId = formData.get('classId') as string;
  const subjectName = formData.get('subjectName') as string;

  if (!teacherUserId || !classId || !subjectName) {
    return { error: 'Veuillez sélectionner une classe et une matière.' };
  }

  try {
    const school_id = await getActiveSchoolId();
    const serviceClient = createServiceRoleClient();

    const { error } = await serviceClient
      .from('teacher_class_subjects')
      .insert({
        school_id,
        teacher_id: teacherUserId,
        class_id: classId,
        subject_name: subjectName,
      });

    if (error) {
      if (error.code === '23505') { // Unique constraint violation (if any)
        return { error: 'Cette affectation existe déjà.' };
      }
      return { error: `Erreur d'affectation : ${error.message}` };
    }

    revalidatePath('/admin/personnel');
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function removeTeacherAssignment(assignmentId: string): Promise<ActionState> {
  try {
    const school_id = await getActiveSchoolId();
    const serviceClient = createServiceRoleClient();

    const { error } = await serviceClient
      .from('teacher_class_subjects')
      .delete()
      .eq('id', assignmentId)
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

export async function getSchoolClassesAndSubjects() {
  try {
    const school_id = await getActiveSchoolId();
    const supabase = await createClient();

    const [classesRes, subjectsRes] = await Promise.all([
      supabase.from('classes').select('id, name, level').eq('school_id', school_id).order('name'),
      supabase.from('subjects').select('id, name, cycle').eq('school_id', school_id).order('name')
    ]);

    return {
      classes: classesRes.data || [],
      subjects: subjectsRes.data || []
    };
  } catch (err: any) {
    console.error(err);
    return { classes: [], subjects: [] };
  }
}
