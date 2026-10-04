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

import { getSchoolSubscriptionStatus } from '@/lib/subscription';

async function checkStudentLimit(supabase: any, school_id: string, incomingCount: number = 1): Promise<void> {
  const subStatus = await getSchoolSubscriptionStatus(supabase, school_id);

  if (subStatus.isExpired) {
    throw new Error("Abonnement requis : Votre période d'essai ou votre abonnement a expiré. Veuillez renouveler votre accès depuis l'espace Abonnement.");
  }

  const limit = subStatus.maxStudents;

  const { count, error } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true })
    .eq('school_id', school_id);

  if (error) throw new Error("Erreur lors de la vérification de la limite d'élèves.");

  const currentCount = count || 0;
  if (currentCount + incomingCount > limit) {
    if (incomingCount === 1) {
       throw new Error(`Limite atteinte : Votre ${subStatus.isPro ? 'Plan Pro' : 'Plan Standard'} vous limite à ${limit} élèves. ${!subStatus.isPro ? 'Passez au Plan Pro pour accueillir jusqu\'à 400 élèves.' : 'Contactez le support pour une extension sur-mesure.'}`);
    } else {
       throw new Error(`Limite atteinte : Vous essayez d'ajouter ${incomingCount} élèves, mais il ne vous reste que ${Math.max(0, limit - currentCount)} place(s) disponible(s) sur votre ${subStatus.isPro ? 'Plan Pro' : 'Plan Standard'} (${limit} max). ${!subStatus.isPro ? 'Passez au Plan Pro pour accueillir jusqu\'à 400 élèves.' : ''}`);
    }
  }
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
    return { error: validatedFields.error.issues[0].message };
  }

  const { first_name, last_name, date_of_birth, class_id } = validatedFields.data;

  try {
    const school_id = await getActiveSchoolId();
    const supabase = await createClient();
    
    await checkStudentLimit(supabase, school_id, 1);
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

  const stayOnPage = formData.get('stay_on_page') === 'true';

  if (!stayOnPage) {
    revalidatePath('/admin/eleves');
    redirect('/admin/eleves');
  } else {
    revalidatePath('/admin/eleves/nouveau');
    return { success: true };
  }
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
    revalidatePath('/admin/classes');
    revalidatePath('/admin/classes/[id]', 'page');
    revalidatePath('/admin/academique/presences');
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function removeStudentFromClass(studentId: string): Promise<ActionState> {
  try {
    const school_id = await getActiveSchoolId();
    const supabase = await createClient();

    const { error } = await supabase
      .from('students')
      .update({ class_id: null })
      .eq('id', studentId)
      .eq('school_id', school_id);

    if (error) {
      return { error: `Erreur : ${error.message}` };
    }

    revalidatePath('/admin/eleves');
    revalidatePath('/admin/classes');
    revalidatePath('/admin/classes/[id]', 'page');
    revalidatePath('/admin/academique/presences');
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
    parent_phone: formData.get('parent_phone') || undefined,
  });

  if (!validatedFields.success) {
    return { error: validatedFields.error.issues[0].message };
  }

  const { student_id, birth_place, gender, blood_group, address, parent_phone } = validatedFields.data;

  try {
    const school_id = await getActiveSchoolId();
    const supabase = await createClient();
    
    const { error } = await supabase
      .from('students')
      .update({
        birth_place: birth_place || null,
        gender: gender || null,
        blood_group: blood_group || null,
        address: address || null,
        parent_phone: parent_phone || null
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

import {
  normalizeText,
  detectClassLevel,
  getRowField,
  extractNameParts,
  extractClassFromFilename,
  parseFlexibleDate,
  parseGender
} from '@/lib/student-import-utils'

export async function importStudents(
  studentsList: any[],
  defaultClassId?: string,
  fileName?: string
): Promise<ActionState & { count?: number; createdClassesCount?: number; createdClassesNames?: string[] }> {
  try {
    const school_id = await getActiveSchoolId();
    const supabase = await createClient();

    // 1. Récupérer toutes les classes existantes pour cette école
    const { data: classesData, error: classesError } = await supabase
      .from('classes')
      .select('id, name')
      .eq('school_id', school_id);

    if (classesError) throw new Error('Erreur de récupération des classes.');
    
    // Map Nom de classe normalisé -> ID
    const classMap = new Map<string, string>();
    if (classesData) {
      classesData.forEach((c) => {
        classMap.set(normalizeText(c.name), c.id);
      });
    }

    // Déterminer une classe par défaut (sélectionnée ou déduite du nom de fichier)
    let fallbackClassName: string | undefined = undefined;
    if (defaultClassId) {
      const found = classesData?.find(c => c.id === defaultClassId);
      if (found) fallbackClassName = found.name;
    }
    if (!fallbackClassName && fileName) {
      fallbackClassName = extractClassFromFilename(fileName, classesData || []);
    }

    // 2. Détecter si le fichier contient des classes inexistantes
    const missingClasses = new Map<string, string>(); // normalized -> raw original name
    for (const student of studentsList) {
      let rawClass = getRowField(student, ['classe', 'class', 'niveau', 'salle', 'cours', 'division', 'groupe', 'section']);
      if (!rawClass && fallbackClassName) {
        rawClass = fallbackClassName;
      }
      if (rawClass) {
        const normClass = normalizeText(rawClass);
        if (!classMap.has(normClass) && !missingClasses.has(normClass)) {
          missingClasses.set(normClass, rawClass.trim());
        }
      }
    }

    // Créer automatiquement les classes manquantes
    const createdClassesNames: string[] = [];
    if (missingClasses.size > 0) {
      const newClassesToInsert = Array.from(missingClasses.values()).map((rawName) => ({
        school_id,
        name: rawName,
        level: detectClassLevel(rawName),
        academic_year: '2026-2027',
        capacity: 60
      }));

      const { data: createdClasses, error: createError } = await supabase
        .from('classes')
        .insert(newClassesToInsert)
        .select('id, name');

      if (createError) {
        throw new Error(`Erreur lors de la création automatique des classes : ${createError.message}`);
      }

      if (createdClasses) {
        createdClasses.forEach((c) => {
          classMap.set(normalizeText(c.name), c.id);
          createdClassesNames.push(c.name);
        });
      }
    }

    // 3. Récupérer tous les matricules existants pour éviter les collisions
    const { data: existingStudents } = await supabase
      .from('students')
      .select('matricule')
      .eq('school_id', school_id);
    
    const usedMatricules = new Set<string>();
    let maxMatriculeNum = 999;

    if (existingStudents) {
      existingStudents.forEach((s: any) => {
        if (s.matricule) {
          usedMatricules.add(s.matricule.toString().trim().toLowerCase());
          const num = parseInt(s.matricule, 10);
          if (!isNaN(num) && num > maxMatriculeNum) {
            maxMatriculeNum = num;
          }
        }
      });
    }

    // 4. Préparer les données élèves
    const insertData = [];

    for (let index = 0; index < studentsList.length; index++) {
      const student = studentsList[index];
      
      const nameParts = extractNameParts(student);
      const firstName = nameParts?.firstName;
      const lastName = nameParts?.lastName;
      let className = getRowField(student, ['classe', 'class', 'niveau', 'salle', 'cours', 'division', 'groupe', 'section']);
      
      // Si la ligne n'a pas de colonne classe explicite, utiliser le fallback
      if (!className && fallbackClassName) {
        className = fallbackClassName;
      }

      // Sauter les lignes totalement vides
      if (!firstName && !lastName && !className) {
        continue;
      }

      if (!firstName || !lastName) {
        throw new Error(`Ligne ${index + 2} : Impossible de déterminer le Nom et le Prénom de l'élève.`);
      }

      if (!className) {
        throw new Error(`Ligne ${index + 2} : L'élève "${firstName} ${lastName}" n'a pas de classe spécifiée. Veuillez sélectionner une classe de destination ou ajouter une colonne "Classe" dans votre fichier Excel.`);
      }

      // Associer la classe
      const classId = classMap.get(normalizeText(className));
      if (!classId) {
        throw new Error(`Impossible de trouver ou créer la classe "${className}" pour l'élève ${firstName} ${lastName}.`);
      }

      // Gestion du matricule unique
      let matricule = getRowField(student, ['matricule', 'id', 'numero matricule', 'num_matricule']);
      if (matricule) {
        matricule = matricule.trim();
        // Si le matricule existe déjà dans la base ou dans ce lot, on le rend unique
        if (usedMatricules.has(matricule.toLowerCase())) {
          maxMatriculeNum++;
          matricule = `${matricule}-${maxMatriculeNum}`;
        }
      } else {
        maxMatriculeNum++;
        matricule = maxMatriculeNum.toString();
      }
      usedMatricules.add(matricule.toLowerCase());

      // Date de naissance
      const rawDate = getRowField(student, ['date de naissance', 'date naissance', 'ddn', 'birth date', 'date_de_naissance', 'date_naissance', 'birthdate']);
      const date_of_birth = parseFlexibleDate(rawDate);

      // Genre / Sexe
      const rawGender = getRowField(student, ['sexe', 'genre', 'gender', 'sex']);
      const gender = parseGender(rawGender);

      // Téléphone parent
      const parent_phone = getRowField(student, ['telephone parent', 'telephone', 'contact parent', 'parent phone', 'contact', 'telephone_parent', 'tel parent', 'tel']) || null;

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
      return { error: 'Aucun élève valide trouvé dans le fichier à importer.' };
    }

    await checkStudentLimit(supabase, school_id, insertData.length);
    
    // 5. Insertion en masse des élèves
    const { error: insertError } = await supabase
      .from('students')
      .insert(insertData);

    if (insertError) {
      if (insertError.code === '23505') {
        return { error: 'Un ou plusieurs élèves ont un matricule qui existe déjà dans cette école.' };
      }
      throw insertError;
    }

    revalidatePath('/admin/eleves');
    revalidatePath('/admin/classes');

    return { 
      success: true, 
      count: insertData.length,
      createdClassesCount: createdClassesNames.length,
      createdClassesNames
    };

  } catch (err: any) {
    return { error: err.message };
  }
}