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

// Génère un matricule séquentiel simple pour l'école (1000, 1001, 1002...)
async function generateUniqueMatricule(supabase: any, school_id: string): Promise<string> {
  const { data, error } = await supabase
    .from('students')
    .select('matricule')
    .eq('school_id', school_id);
    
  if (error) throw new Error('Erreur lors de la récupération des matricules');
  
  if (!data || data.length === 0) {
    return '1000';
  }
  
  // Extraire uniquement les matricules qui sont des nombres
  const numericMatricules = data
    .map((s: any) => parseInt(s.matricule, 10))
    .filter((n: number) => !isNaN(n));
    
  const maxMatricule = numericMatricules.length > 0 ? Math.max(...numericMatricules) : 999;
  return (maxMatricule + 1).toString();
}

import { studentSchema, updateStudentSchema } from '@/lib/validations';

export async function createStudent(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const validatedFields = studentSchema.safeParse({
    first_name: formData.get('prenom'),
    last_name: formData.get('nom'),
    date_of_birth: formData.get('date_naissance'),
    class_id: formData.get('classe'),
  });

  if (!validatedFields.success) {
    return { error: validatedFields.error.errors[0].message };
  }

  const { first_name, last_name, date_of_birth, class_id } = validatedFields.data;

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

export async function deleteStudent(studentId: string): Promise<ActionState> {
  try {
    const school_id = await getActiveSchoolId();
    const supabase = await createClient();

    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', studentId)
      .eq('school_id', school_id);

    if (error) {
      return { error: `Erreur lors de la suppression : ${error.message}` };
    }

    revalidatePath('/admin/eleves');
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function updateStudent(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const validatedFields = updateStudentSchema.safeParse({
    student_id: formData.get('student_id'),
    birth_place: formData.get('birth_place') || undefined,
    gender: formData.get('gender') || undefined,
    blood_group: formData.get('blood_group') || undefined,
    address: formData.get('address') || undefined,
  });

  if (!validatedFields.success) {
    return { error: validatedFields.error.errors[0].message };
  }

  const { student_id, birth_place, gender, blood_group, address } = validatedFields.data;

  try {
    const school_id = await getActiveSchoolId();
    const supabase = await createClient();
    
    const { error } = await supabase
      .from('students')
      .update({
        birth_place: birth_place || null,
        gender: gender || null,
        blood_group: blood_group || null,
        address: address || null
      })
      .eq('id', student_id)
      .eq('school_id', school_id);

    if (error) {
      return { error: `Erreur lors de la modification : ${error.message}` };
    }
  } catch (err: any) {
    return { error: err.message };
  }

  revalidatePath(`/admin/eleves/${student_id}`);
  return { success: true };
}

export async function importStudents(studentsList: any[]): Promise<ActionState & { count?: number }> {
  try {
    const school_id = await getActiveSchoolId();
    const supabase = await createClient();

    // 1. Fetch all classes for this school to map names to IDs
    const { data: classesData, error: classesError } = await supabase
      .from('classes')
      .select('id, name')
      .eq('school_id', school_id);

    if (classesError) throw new Error('Erreur de récupération des classes.');
    
    // Create a map of Class Name -> Class ID (case insensitive, trimmed)
    const classMap = new Map();
    if (classesData) {
      classesData.forEach((c) => {
        classMap.set(c.name.trim().toLowerCase(), c.id);
      });
    }

    // 2. Prepare bulk insert data
    let currentMaxMatricule = parseInt(await generateUniqueMatricule(supabase, school_id), 10);
    const insertData = [];

    for (const student of studentsList) {
      // Validate Required Fields
      const firstName = student['Prénom']?.trim();
      const lastName = student['Nom']?.trim();
      const className = student['Classe']?.trim();
      
      if (!firstName || !lastName || !className) {
        throw new Error(`L'élève ${firstName || ''} ${lastName || ''} n'a pas de prénom, nom ou classe.`);
      }

      // Map Class ID
      const classId = classMap.get(className.toLowerCase());
      if (!classId) {
        throw new Error(`La classe "${className}" n'existe pas dans le système pour l'élève ${firstName} ${lastName}.`);
      }

      // Handle Matricule
      let matricule = student['Matricule']?.toString().trim();
      if (!matricule) {
        matricule = currentMaxMatricule.toString();
        currentMaxMatricule++;
      }

      // Format Date (if invalid, set to null)
      let date_of_birth = student['Date de Naissance']?.trim() || null;
      if (date_of_birth && isNaN(Date.parse(date_of_birth))) {
        date_of_birth = null;
      }

      // Handle Parent Phone
      const parent_phone = student['Téléphone Parent']?.toString().trim() || null;
      const gender = student['Genre']?.trim().toUpperCase() === 'F' ? 'F' : (student['Genre']?.trim().toUpperCase() === 'M' ? 'M' : null);

      insertData.push({
        school_id,
        first_name: firstName,
        last_name: lastName,
        matricule,
        class_id: classId,
        date_of_birth,
        gender,
        parent_phone,
        status: 'actif'
      });
    }

    if (insertData.length === 0) {
      return { error: 'Aucun élève valide à importer.' };
    }

    // 3. Bulk Insert
    const { error: insertError } = await supabase
      .from('students')
      .insert(insertData);

    if (insertError) {
      if (insertError.code === '23505') {
        return { error: 'Un ou plusieurs élèves ont un matricule qui existe déjà.' };
      }
      throw insertError;
    }

    revalidatePath('/admin/eleves');
    return { success: true, count: insertData.length };

  } catch (err: any) {
    return { error: err.message };
  }
}