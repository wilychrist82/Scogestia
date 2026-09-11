'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
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
    .select('school_id, full_name')
    .eq('user_id', user.id)
    .limit(1);

  if (!roles || roles.length === 0) {
    return { error: "École introuvable pour cet utilisateur." };
  }
  const schoolId = roles[0].school_id;
  const teacherName = roles[0].full_name || 'L\'enseignant';

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

  // ─────────────────────────────────────────────────────────────────────────
  // Notifications : parents des élèves de la classe + admins de l'école
  // ─────────────────────────────────────────────────────────────────────────
  try {
    const adminClient = createAdminClient();
    const usersToNotify: string[] = [];

    const notifTitle = `Nouveau devoir — ${subjectName}`;
    const notifMessage = `${teacherName} a publié un devoir "${title}" pour le ${new Date(dateLimite).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}.`;

    // 1. Récupérer les élèves de la classe
    const { data: studentsInClass } = await adminClient
      .from('students')
      .select('id')
      .eq('class_id', classId);

    if (studentsInClass && studentsInClass.length > 0) {
      const studentIds = studentsInClass.map(s => s.id);

      // 2. Récupérer les parents liés à ces élèves
      const { data: parentLinks } = await adminClient
        .from('parent_student_links')
        .select('parent_user_id')
        .in('student_id', studentIds);

      if (parentLinks) {
        parentLinks.forEach(link => {
          if (link.parent_user_id && !usersToNotify.includes(link.parent_user_id)) {
            usersToNotify.push(link.parent_user_id);
          }
        });
      }
    }

    // 3. Récupérer les admins de l'école
    const { data: adminUsers } = await adminClient
      .from('user_school_roles')
      .select('user_id')
      .eq('school_id', schoolId)
      .eq('role', 'admin');

    if (adminUsers) {
      adminUsers.forEach(admin => {
        if (admin.user_id && !usersToNotify.includes(admin.user_id) && admin.user_id !== user.id) {
          usersToNotify.push(admin.user_id);
        }
      });
    }

    // 4. Insérer les notifications
    if (usersToNotify.length > 0) {
      const notificationsToInsert = usersToNotify.map(uid => ({
        user_id: uid,
        school_id: schoolId,
        title: notifTitle,
        message: notifMessage,
        type: 'academique',
        action_url: '/parent/devoirs'
      }));

      await adminClient.from('notifications').insert(notificationsToInsert);
    }
  } catch (notifErr) {
    // Ne pas bloquer l'UI si la notification échoue
    console.error('Erreur lors des notifications devoir:', notifErr);
  }
  // ─────────────────────────────────────────────────────────────────────────

  revalidatePath('/enseignant/devoirs');
  revalidatePath('/parent/devoirs');
  revalidatePath('/admin');
  return { success: true };
}
