'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { ActionState } from './finance'

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

export async function addSubject(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const classId = formData.get('classId') as string;
  const subjectName = formData.get('subjectName') as string;
  const coefficient = parseFloat(formData.get('coefficient') as string);
  const teacherId = formData.get('teacherId') as string;

  if (!classId || !subjectName || !coefficient || !teacherId) {
    return { error: 'Veuillez remplir tous les champs.' };
  }

  try {
    const school_id = await getActiveSchoolId();
    const supabase = await createClient();

    const { error } = await supabase.from('teacher_class_subjects').insert({
      school_id,
      class_id: classId,
      subject_name: subjectName,
      coefficient,
      teacher_id: teacherId
    });

    if (error) throw error;

    revalidatePath('/admin/academique/matieres');
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function saveGrades(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const classId = formData.get('classId') as string;
  const studentId = formData.get('studentId') as string;
  const term = formData.get('term') as string;
  const evaluationType = formData.get('evaluationType') as string;

  if (!classId || !studentId || !term || !evaluationType) {
    return { error: 'Paramètres manquants pour la sauvegarde.' };
  }

  try {
    const school_id = await getActiveSchoolId();
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Iterate through formData to find grades
    const gradesToUpsert = [];
    
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('grade_') && value) {
        const subjectName = key.replace('grade_', '');
        const score = parseFloat(value as string);
        
        if (!isNaN(score)) {
          gradesToUpsert.push({
            school_id,
            student_id: studentId,
            class_id: classId,
            subject_name: subjectName,
            term,
            evaluation_type: evaluationType,
            score,
            max_score: 20, // default
            entered_by: user?.id,
            updated_at: new Date().toISOString()
          });
        }
      }
    }

    if (gradesToUpsert.length > 0) {
      const subjectNames = gradesToUpsert.map(g => g.subject_name);
      
      await supabase
        .from('grades')
        .delete()
        .eq('school_id', school_id)
        .eq('class_id', classId)
        .eq('student_id', studentId)
        .eq('term', term)
        .eq('evaluation_type', evaluationType)
        .in('subject_name', subjectNames);

      const { error } = await supabase.from('grades').insert(gradesToUpsert);
      if (error) throw error;
    }

    revalidatePath('/admin/academique/notes');
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function saveAttendance(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const classId = formData.get('classId') as string;
  const date = formData.get('date') as string;

  if (!classId || !date) {
    return { error: 'Paramètres manquants pour la sauvegarde.' };
  }

  try {
    const school_id = await getActiveSchoolId();
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const attendanceToUpsert = [];
    
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('attendance_') && value) {
        const studentId = key.replace('attendance_', '');
        const status = value as string; // 'present', 'absent', 'retard', 'absent_justifie'
        
        attendanceToUpsert.push({
          school_id,
          student_id: studentId,
          class_id: classId,
          date,
          status,
          recorded_by: user?.id
        });
      }
    }

    if (attendanceToUpsert.length > 0) {
      const studentIds = attendanceToUpsert.map(a => a.student_id);
      
      // Delete existing for same day to prevent duplicates (as there's a unique constraint on student_id, date)
      await supabase
        .from('attendance')
        .delete()
        .eq('school_id', school_id)
        .eq('class_id', classId)
        .eq('date', date)
        .in('student_id', studentIds);

      const { error } = await supabase.from('attendance').insert(attendanceToUpsert);
      if (error) throw error;
    }

    revalidatePath('/admin/academique/presences');
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function publishHomework(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const classId = formData.get('classId') as string;
  const subjectName = formData.get('subjectName') as string;
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const dueDate = formData.get('dueDate') as string;

  if (!classId || !subjectName || !title || !dueDate) {
    return { error: 'Veuillez remplir les champs obligatoires (classe, matière, titre, date limite).' };
  }

  try {
    const school_id = await getActiveSchoolId();
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from('homework').insert({
      school_id,
      class_id: classId,
      subject_name: subjectName,
      title,
      description,
      due_date: dueDate,
      created_by: user?.id
    });

    if (error) throw error;

    revalidatePath('/admin/academique/devoirs');
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}



