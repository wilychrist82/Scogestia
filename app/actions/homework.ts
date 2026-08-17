'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type HomeworkState = {
  error?: string;
  success?: boolean;
} | null;

export async function createHomework(prevState: HomeworkState, formData: FormData): Promise<HomeworkState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Non autorisé" };
  }

  // Get form data
  const classId = formData.get('class_id') as string;
  const subjectName = formData.get('subject_name') as string;
  const title = formData.get('titre') as string;
  const description = formData.get('description') as string;
  const dateLimite = formData.get('date_limite') as string;
  const heureLimite = formData.get('heure_limite') as string;
  const file = formData.get('attachment') as File | null;

  if (!classId || !subjectName || !title || !dateLimite) {
    return { error: "Veuillez remplir les champs obligatoires (Matière, Titre, Date)." };
  }

  // Verify that the user has a role in the school, to get the school_id
  const { data: roles } = await supabase
    .from('user_school_roles')
    .select('school_id')
    .eq('user_id', user.id)
    .limit(1);

  if (!roles || roles.length === 0) {
    return { error: "École introuvable pour cet utilisateur." };
  }
  const schoolId = roles[0].school_id;

  // Combine date and time
  let due_date = dateLimite;
  if (heureLimite) {
    due_date = `${dateLimite}T${heureLimite}:00`;
  } else {
    // default to end of day if no time specified
    due_date = `${dateLimite}T23:59:59`;
  }

  let attachment_url = null;

  // Handle file upload if present
  if (file && file.size > 0) {
    if (file.size > 10 * 1024 * 1024) {
      return { error: "Le fichier ne doit pas dépasser 10 Mo." };
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `${schoolId}/${classId}/${fileName}`;

    const { error: uploadError } = await supabase
      .storage
      .from('homework-attachments')
      .upload(filePath, file);

    if (uploadError) {
      return { error: `Erreur lors de l'upload du fichier : ${uploadError.message}` };
    }

    const { data: publicUrlData } = supabase
      .storage
      .from('homework-attachments')
      .getPublicUrl(filePath);

    attachment_url = publicUrlData.publicUrl;
  }

  // Insert homework
  const { error: insertError } = await supabase
    .from('homework')
    .insert({
      school_id: schoolId,
      class_id: classId,
      subject_name: subjectName,
      title,
      description,
      due_date,
      attachment_url,
      created_by: user.id
    });

  if (insertError) {
    return { error: `Erreur lors de la création du devoir : ${insertError.message}` };
  }

  revalidatePath('/enseignant/devoirs');
  return { success: true };
}
