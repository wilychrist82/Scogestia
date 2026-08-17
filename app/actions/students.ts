'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

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

// Génère un matricule unique pour l'école
async function generateUniqueMatricule(supabase: any, school_id: string): Promise<string> {
  const year = new Date().getFullYear().toString().slice(-2); // e.g. 26 for 2026
  let isUnique = false;
  let matricule = '';
  
  while (!isUnique) {
    // Génère un nombre aléatoire à 4 chiffres
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    matricule = `STU-${year}-${randomNum}`;
    
    const { count, error } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true })
      .eq('school_id', school_id)
      .eq('matricule', matricule);
      
    if (error) throw new Error('Erreur lors de la vérification du matricule');
    if (count === 0) isUnique = true;
  }
  
  return matricule;
}

export async function createStudent(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const first_name = formData.get('prenom') as string;
  const last_name = formData.get('nom') as string;
  const date_of_birth = formData.get('date_naissance') as string;
  const class_id = formData.get('classe') as string;

  if (!first_name || !last_name || !date_of_birth || !class_id) {
    return { error: 'Veuillez remplir tous les champs obligatoires.' };
  }

  try {
    const school_id = await getActiveSchoolId();
    const supabase = await createClient();
    
    const matricule = await generateUniqueMatricule(supabase, school_id);

    const { error } = await supabase
      .from('students')
      .insert({
        school_id,
        matricule,
        first_name,
        last_name,
        date_of_birth,
        class_id,
        status: 'actif'
      });

    if (error) {
      // Catch unique constraint violation just in case of a race condition
      if (error.code === '23505') {
         return { error: 'Une erreur de collision est survenue avec le matricule. Veuillez réessayer.' };
      }
      return { error: `Erreur lors de la création : ${error.message}` };
    }

  } catch (err: any) {
    return { error: err.message };
  }

  revalidatePath('/admin/eleves');
  redirect('/admin/eleves');
}
