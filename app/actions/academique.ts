"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { ActionState } from "./finance";

async function getActiveSchoolId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");

  const { data: roleData, error } = await supabase
    .from("user_school_roles")
    .select("school_id")
    .eq("user_id", user.id)
    .single();

  if (error || !roleData) throw new Error("École introuvable");
  return roleData.school_id;
}

export async function saveSchoolSubject(
  prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const name = formData.get("name") as string;
  const cycle = formData.get("cycle") as string;
  const category = formData.get("category") as string;
  const coefficient = parseFloat(formData.get("coefficient") as string);

  if (!name || !cycle) {
    return { error: "Veuillez remplir le nom et le cycle." };
  }

  try {
    const school_id = await getActiveSchoolId();
    const supabase = await createClient();

    const { error } = await supabase.from("subjects").insert({
      school_id,
      name,
      cycle,
      category: cycle === "primaire" ? category : null,
      coefficient: cycle === "secondaire" ? coefficient || 1 : 1,
    });

    if (error) throw error;

    revalidatePath("/admin/academique/matieres");
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function savePrimaryGrades(
  prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const classId = formData.get("classId") as string;
  const subjectId = formData.get("subjectId") as string;

  if (!classId || !subjectId) {
    return { error: "Paramètres manquants pour la sauvegarde." };
  }

  try {
    const school_id = await getActiveSchoolId();
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const gradesToUpsert = [];
    for (const [key, value] of formData.entries()) {
      if (key.startsWith("score_") && value) {
        // key format: score_{monthNumber}_{studentId}
        const parts = key.split("_");
        if (parts.length === 3) {
          const monthNumber = parseInt(parts[1], 10);
          const studentId = parts[2];
          const score = parseFloat(value as string);
          if (!isNaN(score)) {
            gradesToUpsert.push({
              school_id,
              student_id: studentId,
              subject_id: subjectId,
              month_number: monthNumber,
              score,
              max_score: 10,
              academic_year: "2023/2024",
              entered_by: user?.id,
            });
          }
        }
      }
    }

    if (gradesToUpsert.length > 0) {
      await supabase
        .from("primary_grades")
        .upsert(gradesToUpsert, {
          onConflict: "student_id, subject_id, month_number, academic_year",
        });
    }

    revalidatePath("/admin/academique/notes");
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function saveSecondaryGrades(
  prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const classId = formData.get("classId") as string;
  const term = formData.get("term") as string;
  const subjectId = formData.get("subjectId") as string;

  if (!classId || !term || !subjectId) {
    return { error: "Paramètres manquants pour la sauvegarde." };
  }

  try {
    const school_id = await getActiveSchoolId();
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const gradesToUpsert = [];
    // We will extract studentId from the keys: class_score_{id} and comp_score_{id}
    const studentIds = new Set<string>();
    for (const key of formData.keys()) {
      if (key.startsWith("class_score_"))
        studentIds.add(key.replace("class_score_", ""));
      if (key.startsWith("comp_score_"))
        studentIds.add(key.replace("comp_score_", ""));
    }

    for (const studentId of studentIds) {
      const classScoreStr = formData.get(`class_score_${studentId}`);
      const compScoreStr = formData.get(`comp_score_${studentId}`);
      const classScore = classScoreStr
        ? parseFloat(classScoreStr as string)
        : null;
      const compScore = compScoreStr
        ? parseFloat(compScoreStr as string)
        : null;

      if (classScore !== null || compScore !== null) {
        gradesToUpsert.push({
          school_id,
          student_id: studentId,
          subject_id: subjectId,
          term,
          class_score: classScore,
          comp_score: compScore,
          max_score: 20,
          academic_year: "2023/2024", // TODO: dynamic
          entered_by: user?.id,
        });
      }
    }

    if (gradesToUpsert.length > 0) {
      await supabase
        .from("secondary_grades")
        .upsert(gradesToUpsert, {
          onConflict: "student_id, subject_id, term, academic_year",
        });
    }

    revalidatePath("/admin/academique/notes");
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function saveBulletinPrimaryGrades(
  studentId: string,
  grades: Record<string, string>,
  ranks: Record<number, string> = {},
  info: { appreciation: string; decision: string } = {
    appreciation: "",
    decision: "",
  },
): Promise<ActionState> {
  try {
    const school_id = await getActiveSchoolId();
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const gradesToUpsert = [];
    for (const [key, value] of Object.entries(grades)) {
      // key format: {subjectId}_{monthNumber}
      const parts = key.split("_");
      if (parts.length === 2 && value) {
        const subjectId = parts[0];
        const monthNumber = parseInt(parts[1], 10);
        const score = parseFloat(value);
        if (!isNaN(score)) {
          gradesToUpsert.push({
            school_id,
            student_id: studentId,
            subject_id: subjectId,
            month_number: monthNumber,
            score,
            max_score: 10,
            academic_year: "2023/2024",
            entered_by: user?.id,
          });
        }
      }
    }

    if (gradesToUpsert.length > 0) {
      await supabase
        .from("primary_grades")
        .upsert(gradesToUpsert, {
          onConflict: "student_id, subject_id, month_number, academic_year",
        });
    }

    const ranksToUpsert = Object.entries(ranks)
      .map(([month, rank_text]) => ({
        student_id: studentId,
        month_number: parseInt(month, 10),
        rank_text,
      }))
      .filter((r) => r.rank_text.trim() !== "");

    if (ranksToUpsert.length > 0) {
      await supabase
        .from("primary_monthly_ranks")
        .upsert(ranksToUpsert, { onConflict: "student_id, month_number" });
    }

    if (info.appreciation || info.decision) {
      await supabase.from("primary_bulletin_info").upsert(
        {
          student_id: studentId,
          appreciation: info.appreciation,
          director_decision: info.decision,
        },
        { onConflict: "student_id" },
      );
    }

    revalidatePath("/admin/academique/bulletins");
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function saveBulletinSecondaryGrades(
  studentId: string,
  term: string,
  grades: Record<string, { cScore: string; compScore: string }>,
): Promise<ActionState> {
  try {
    const school_id = await getActiveSchoolId();
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const gradesToUpsert = [];
    for (const [subjectId, scores] of Object.entries(grades)) {
      const classScore = scores.cScore ? parseFloat(scores.cScore) : null;
      const compScore = scores.compScore ? parseFloat(scores.compScore) : null;

      if (classScore !== null || compScore !== null) {
        gradesToUpsert.push({
          school_id,
          student_id: studentId,
          subject_id: subjectId,
          term,
          class_score: classScore,
          comp_score: compScore,
          max_score: 20,
          academic_year: "2023/2024",
          entered_by: user?.id,
        });
      }
    }

    if (gradesToUpsert.length > 0) {
      await supabase
        .from("secondary_grades")
        .upsert(gradesToUpsert, {
          onConflict: "student_id, subject_id, term, academic_year",
        });
    }

    revalidatePath("/admin/academique/bulletins");
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function saveAttendance(
  prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const classId = formData.get("classId") as string;
  const date = formData.get("date") as string;

  if (!classId || !date) {
    return { error: "Paramètres manquants pour la sauvegarde." };
  }

  try {
    const school_id = await getActiveSchoolId();
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const attendanceToUpsert = [];

    for (const [key, value] of formData.entries()) {
      if (key.startsWith("attendance_") && value) {
        const studentId = key.replace("attendance_", "");
        const status = value as string; // 'present', 'absent', 'retard', 'absent_justifie'

        attendanceToUpsert.push({
          school_id,
          student_id: studentId,
          class_id: classId,
          date,
          status,
          recorded_by: user?.id,
        });
      }
    }

    if (attendanceToUpsert.length > 0) {
      const studentIds = attendanceToUpsert.map((a) => a.student_id);

      // Delete existing for same day to prevent duplicates (as there's a unique constraint on student_id, date)
      await supabase
        .from("attendance")
        .delete()
        .eq("school_id", school_id)
        .eq("class_id", classId)
        .eq("date", date)
        .in("student_id", studentIds);

      const { error } = await supabase
        .from("attendance")
        .insert(attendanceToUpsert);
      if (error) throw error;
    }

    revalidatePath("/admin/academique/presences");
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function publishHomework(
  prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const classId = formData.get("classId") as string;
  const subjectName = formData.get("subjectName") as string;
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const dueDate = formData.get("dueDate") as string;
  const targetStudentsStr = formData.get("targetStudents") as string;
  const attachment = formData.get("attachment") as File | null;

  if (!classId || !subjectName || !title || !dueDate) {
    return {
      error:
        "Veuillez remplir les champs obligatoires (classe, matière, titre, date limite).",
    };
  }

  try {
    const school_id = await getActiveSchoolId();
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let attachmentUrl = null;

    if (attachment && attachment.size > 0) {
      const fileExt = attachment.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${school_id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("homework-attachments")
        .upload(filePath, attachment, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.error("Erreur upload:", uploadError);
        return { error: "Erreur lors de l'upload du fichier." };
      }

      const { data: publicUrlData } = supabase.storage
        .from("homework-attachments")
        .getPublicUrl(filePath);

      attachmentUrl = publicUrlData.publicUrl;
    }

    let target_students = null;
    if (targetStudentsStr) {
      try {
        const parsed = JSON.parse(targetStudentsStr);
        if (Array.isArray(parsed) && parsed.length > 0) {
          target_students = parsed;
        }
      } catch (e) {
        console.error("Erreur parsing targetStudents", e);
      }
    }

    const { error } = await supabase.from("homework").insert({
      school_id,
      class_id: classId,
      subject_name: subjectName,
      title,
      description,
      due_date: dueDate,
      attachment_url: attachmentUrl,
      target_students,
      created_by: user?.id,
    });

    if (error) throw error;

    revalidatePath("/admin/academique/devoirs");
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function publishBulletinPDF(studentId: string, termOrMonth: string, academicYear: string, fileData: string) {
  try {
    const supabase = await createClient()
    const schoolId = await getActiveSchoolId()
    if (!schoolId) return { success: false, error: 'École non trouvée' }
    
    // 1. Check if user is admin
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError || !userData.user) return { success: false, error: 'Non authentifié' }
    
    // 2. Decode base64 to buffer
    // fileData is expected to be a base64 string: "data:application/pdf;base64,JVBERi..."
    const base64Data = fileData.split(';base64,').pop()
    if (!base64Data) return { success: false, error: 'Format de fichier invalide' }
    
    const buffer = Buffer.from(base64Data, 'base64')
    const fileName = `${schoolId}/${studentId}_${termOrMonth}_${academicYear}_${Date.now()}.pdf`
    
    // 3. Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('bulletins')
      .upload(fileName, buffer, {
        contentType: 'application/pdf',
        upsert: true
      })
      
    if (uploadError) {
      console.error('Upload error:', uploadError)
      return { success: false, error: "Erreur lors de l'upload du fichier: " + uploadError.message }
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage.from('bulletins').getPublicUrl(fileName)
    const fileUrl = urlData.publicUrl

    // 4. Save to published_bulletins table
    const { error: dbError } = await supabase
      .from('published_bulletins')
      .upsert({
        student_id: studentId,
        school_id: schoolId,
        term_or_month: termOrMonth,
        academic_year: academicYear,
        file_url: fileUrl
      }, { onConflict: 'student_id, term_or_month, academic_year' })
      
    if (dbError) {
      console.error('DB Error:', dbError)
      return { success: false, error: "Erreur lors de l'enregistrement en base: " + dbError.message }
    }
    
    return { success: true }
  } catch (error) {
    console.error('Publish error:', error)
    return { success: false, error: "Erreur inattendue" }
  }
}
