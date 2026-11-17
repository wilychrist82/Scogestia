'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { STUDENT_MANAGEMENT_ROLES } from '@/lib/roles'

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
    .in('role', [...STUDENT_MANAGEMENT_ROLES])
    .limit(1)
    .maybeSingle();

  if (error || !roleData) throw new Error('Action non autorisée ou établissement introuvable');
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

import { formatSubscriptionPlanLabel, getSchoolSubscriptionStatus } from '@/lib/subscription';

async function checkStudentLimit(supabase: any, school_id: string, incomingCount: number = 1): Promise<void> {
  const subStatus = await getSchoolSubscriptionStatus(supabase, school_id);

  if (subStatus.isExpired) {
    throw new Error("Abonnement requis : Votre période d'essai ou votre abonnement a expiré. Veuillez renouveler votre accès depuis l'espace Abonnement.");
  }

  const limit = subStatus.maxStudents;
  const planLabel = formatSubscriptionPlanLabel(subStatus.planName, subStatus.status);

  const { count, error } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true })
    .eq('school_id', school_id);

  if (error) throw new Error("Erreur lors de la vérification de la limite d'élèves.");

  const currentCount = count || 0;
  if (currentCount + incomingCount > limit) {
    if (incomingCount === 1) {
       throw new Error(`Limite atteinte : Votre ${planLabel} vous limite à ${limit} élèves. ${!subStatus.isPro ? 'Passez au Plan Pro (400 élèves) ou Annuel (illimité).' : 'Passez au Plan Annuel pour un effectif illimité.'}`);
    } else {
       throw new Error(`Limite atteinte : Vous essayez d'ajouter ${incomingCount} élèves, mais il ne vous reste que ${Math.max(0, limit - currentCount)} place(s) disponible(s) sur votre ${planLabel} (${limit} max).`);
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

    const gender = (formData.get('gender') as string)?.trim() || null;
    const parent_phone = (formData.get('parent_phone') as string)?.trim() || null;
    const birth_place = (formData.get('birth_place') as string)?.trim() || null;

    const { error } = await supabase
      .from('students')
      .insert({
        school_id,
        matricule,
        first_name,
        last_name,
        date_of_birth,
        class_id,
        gender: gender || null,
        parent_phone: parent_phone || null,
        birth_place: birth_place || null,
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

/**
 * Transfère / promeut un groupe d'élèves sélectionnés vers une classe supérieure ou cible.
 * Conserve l'intégralité de l'historique scolaire, des notes, matricule et bulletins.
 */
export async function promoteStudents(
  studentIds: string[],
  targetClassId: string
): Promise<{ error?: string; success?: boolean; count?: number }> {
  if (!studentIds || studentIds.length === 0) {
    return { error: 'Veuillez sélectionner au moins un élève à transférer.' };
  }

  if (!targetClassId) {
    return { error: 'Veuillez sélectionner la classe de destination.' };
  }

  try {
    const school_id = await getActiveSchoolId();
    const supabase = await createClient();

    // Vérifier que la classe de destination appartient à l'école
    const { data: targetClass, error: classError } = await supabase
      .from('classes')
      .select('id, name')
      .eq('id', targetClassId)
      .eq('school_id', school_id)
      .single();

    if (classError || !targetClass) {
      return { error: 'Classe de destination introuvable ou non autorisée.' };
    }

    // Mettre à jour la classe des élèves sélectionnés
    const { error: updateError } = await supabase
      .from('students')
      .update({ class_id: targetClassId })
      .in('id', studentIds)
      .eq('school_id', school_id);

    if (updateError) {
      return { error: `Erreur lors du transfert : ${updateError.message}` };
    }

    revalidatePath('/admin/eleves');
    revalidatePath('/admin/classes');
    revalidatePath('/admin/academique/promotion');
    revalidatePath('/admin');

    return { success: true, count: studentIds.length };
  } catch (err: any) {
    return { error: err.message || 'Une erreur est survenue lors de la promotion.' };
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
  extractClassFromFilename,
  analyzeStudentImportRows,
  type ExistingClassRef,
  type StudentImportAnalysis,
} from '@/lib/student-import-utils'
import { getDynamicAcademicYear } from '@/lib/academic-year'
import { chunkArray } from '@/lib/collections'

export type ImportPreviewResponse = {
  error?: string
  analysis?: StudentImportAnalysis
  existingClasses?: ExistingClassRef[]
}

async function loadSchoolImportContext(
  supabase: Awaited<ReturnType<typeof createClient>>,
  school_id: string,
  defaultClassId?: string,
  fileName?: string,
  studentsList: Record<string, unknown>[] = [],
  classOverrides?: Record<string, string>,
) {
  const [{ data: classesData, error: classesError }, { data: schoolRow }, { data: existingStudents, error: studentsError }] =
    await Promise.all([
      supabase.from('classes').select('id, name, level').eq('school_id', school_id),
      supabase.from('schools').select('current_academic_year').eq('id', school_id).maybeSingle(),
      supabase
        .from('students')
        .select('id, matricule, first_name, last_name, class_id, date_of_birth')
        .eq('school_id', school_id)
        .range(0, 4999),
    ])

  if (classesError) throw new Error('Erreur de récupération des classes.')
  if (studentsError) throw new Error('Erreur lors de la vérification des doublons existants.')

  const existingClasses: ExistingClassRef[] = classesData || []

  let fallbackClassName: string | undefined
  if (defaultClassId) {
    const found = existingClasses.find((c) => c.id === defaultClassId)
    if (found) fallbackClassName = found.name
  }
  if (!fallbackClassName && fileName) {
    fallbackClassName = extractClassFromFilename(fileName, existingClasses)
  }

  const analysis = analyzeStudentImportRows(studentsList, existingClasses, existingStudents || [], {
    fallbackClassName,
    classOverrides,
  })

  return {
    existingClasses,
    existingStudents: existingStudents || [],
    academicYear: schoolRow?.current_academic_year?.trim() || getDynamicAcademicYear('-'),
    analysis,
  }
}

export async function previewImportStudents(
  studentsList: Record<string, unknown>[],
  defaultClassId?: string,
  fileName?: string,
  classOverrides?: Record<string, string>,
): Promise<ImportPreviewResponse> {
  try {
    const school_id = await getActiveSchoolId()
    const supabase = await createClient()
    const { existingClasses, analysis } = await loadSchoolImportContext(
      supabase,
      school_id,
      defaultClassId,
      fileName,
      studentsList,
      classOverrides,
    )

    if (analysis.rows.length === 0) {
      return { error: 'Aucun élève valide détecté dans ce fichier.' }
    }

    return {
      analysis,
      existingClasses,
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur d'analyse du fichier."
    return { error: message }
  }
}

export async function importStudents(
  studentsList: Record<string, unknown>[],
  defaultClassId?: string,
  fileName?: string,
  classOverrides?: Record<string, string>,
): Promise<
  ActionState & {
    count?: number
    skippedDuplicatesCount?: number
    createdClassesCount?: number
    createdClassesNames?: string[]
  }
> {
  try {
    const school_id = await getActiveSchoolId()
    const supabase = await createClient()

    const { existingStudents, academicYear, analysis } = await loadSchoolImportContext(
      supabase,
      school_id,
      defaultClassId,
      fileName,
      studentsList,
      classOverrides,
    )

    if (analysis.rows.length === 0) {
      return { error: 'Aucun élève valide trouvé dans le fichier à importer.' }
    }

    if (analysis.newRows.length === 0) {
      return {
        error: `Aucun nouvel élève à importer : les ${analysis.duplicateRows.length} élève(s) du fichier existent déjà sans doublons dans vos classes.`,
      }
    }

    // Vérifier le quota uniquement sur les nouveaux élèves réellement ajoutés
    await checkStudentLimit(supabase, school_id, analysis.newRows.length)

    // Créer automatiquement les classes absentes (sans doublons d'orthographe)
    const createdClassIdByKey = new Map<string, string>()
    const createdClassesNames: string[] = []

    if (analysis.missingClassesToCreate.length > 0) {
      const newClassesToInsert = analysis.missingClassesToCreate.map((cls) => ({
        school_id,
        name: cls.name,
        level: cls.level,
        academic_year: academicYear,
        capacity: 60,
      }))

      const { data: createdClasses, error: createError } = await supabase
        .from('classes')
        .insert(newClassesToInsert)
        .select('id, name')

      if (createError) {
        throw new Error(`Erreur lors de la création automatique des classes : ${createError.message}`)
      }

      if (createdClasses) {
        analysis.missingClassesToCreate.forEach((clsMeta, idx) => {
          const matchedCreated =
            createdClasses.find((c) => c.name === clsMeta.name) ?? createdClasses[idx]
          if (matchedCreated) {
            createdClassIdByKey.set(`new:${clsMeta.canonicalKey}`, matchedCreated.id)
            createdClassesNames.push(matchedCreated.name)
          }
        })
      }
    }

    // Calcul du prochain matricule disponible pour les élèves sans matricule dans le fichier
    const usedMatricules = new Set<string>()
    let maxMatriculeNum = 999
    existingStudents.forEach((s) => {
      if (s.matricule) {
        usedMatricules.add(s.matricule.toString().trim().toLowerCase())
        const num = parseInt(String(s.matricule), 10)
        if (!isNaN(num) && num > maxMatriculeNum) {
          maxMatriculeNum = num
        }
      }
    })

    const touchedClassIds = new Set<string>()
    const insertData = analysis.newRows.map((row) => {
      const targetClassId = row.resolvedClassId ?? createdClassIdByKey.get(row.resolvedClassKey)
      if (!targetClassId) {
        throw new Error(
          `Impossible d'associer la classe "${row.resolvedClassName}" pour l'élève ${row.firstName} ${row.lastName}.`,
        )
      }
      touchedClassIds.add(targetClassId)

      let matricule = row.matricule
      if (!matricule || usedMatricules.has(matricule.toLowerCase())) {
        do {
          maxMatriculeNum++
          matricule = maxMatriculeNum.toString()
        } while (usedMatricules.has(matricule.toLowerCase()))
      }
      usedMatricules.add(matricule.toLowerCase())

      return {
        school_id,
        first_name: row.firstName,
        last_name: row.lastName,
        matricule,
        class_id: targetClassId,
        date_of_birth: row.dateOfBirth,
        gender: row.gender,
        parent_phone: row.parentPhone,
        status: 'actif',
      }
    })

    // Insertion par paquets de 100 pour supporter sereinement 100-500+ élèves multi-classes
    for (const batch of chunkArray(insertData, 100)) {
      const { error: insertError } = await supabase.from('students').insert(batch)
      if (insertError) {
        if (insertError.code === '23505') {
          return { error: 'Un ou plusieurs élèves ont un matricule qui existe déjà dans cette école.' }
        }
        throw insertError
      }
    }

    revalidatePath('/admin/eleves')
    revalidatePath('/admin/classes')
    touchedClassIds.forEach((cid) => revalidatePath(`/admin/classes/${cid}`))

    return {
      success: true,
      count: insertData.length,
      skippedDuplicatesCount: analysis.duplicateRows.length,
      createdClassesCount: createdClassesNames.length,
      createdClassesNames,
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur lors de l'importation."
    return { error: message }
  }
}