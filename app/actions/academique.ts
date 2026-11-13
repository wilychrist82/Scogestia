"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { ActionState } from "./finance";
import { getPrimarySubjectMaxScore } from "@/lib/academic-curriculum";
import { getSchoolSubscriptionStatus } from "@/lib/subscription";

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
    .limit(1)
    .maybeSingle();

  if (error || !roleData) throw new Error("École introuvable");
  return roleData.school_id;
}

function getDynamicAcademicYear() {
  const date = new Date();
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-indexed (0 = Jan, 7 = Aug)
  
  // Si on est avant août, l'année a commencé l'année précédente
  if (month < 7) {
    return `${year - 1}/${year}`;
  } else {
    // Si on est en août ou après, c'est la nouvelle rentrée
    return `${year}/${year + 1}`;
  }
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

    const dbCycle = (cycle === 'college' || cycle === 'lycee' || cycle === 'secondaire') ? 'secondaire' : 'primaire';
    const resolvedCategory = cycle === 'maternelle' ? (category || 'Maternelle') : (dbCycle === "primaire" ? category : null);
    const { error } = await supabase.from("subjects").insert({
      school_id,
      name,
      cycle: dbCycle,
      category: resolvedCategory,
      coefficient: dbCycle === "secondaire" ? coefficient || 1 : 1,
    });

    if (error) throw error;

    revalidatePath("/admin/academique/matieres");
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function deleteSchoolSubject(subjectId: string): Promise<ActionState> {
  try {
    const school_id = await getActiveSchoolId();
    const supabase = await createClient();

    const { error } = await supabase
      .from("subjects")
      .delete()
      .eq("id", subjectId)
      .eq("school_id", school_id);

    if (error) throw error;

    revalidatePath("/admin/academique/matieres");
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function ensurePhilosophieSubject(): Promise<ActionState> {
  try {
    const school_id = await getActiveSchoolId();
    const supabase = await createClient();

    const { data: existing } = await supabase
      .from("subjects")
      .select("id")
      .eq("school_id", school_id)
      .ilike("name", "%philo%")
      .limit(1)
      .maybeSingle();

    if (!existing) {
      const { error } = await supabase.from("subjects").insert({
        school_id,
        name: "Philosophie",
        cycle: "secondaire",
        category: null,
        coefficient: 2.0,
      });
      if (error) throw error;
    }

    revalidatePath("/admin/academique/matieres");
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function ensureEtudeDeTexteSubject(): Promise<ActionState> {
  try {
    const school_id = await getActiveSchoolId();
    const supabase = await createClient();

    const { data: allSubs } = await supabase
      .from("subjects")
      .select("id, name, cycle")
      .eq("school_id", school_id);

    const allEtudes = allSubs?.filter(s => {
      const n = (s.name || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
      return n === 'etude de texte' || n.includes('etude de texte') || n.includes('etude texte');
    });

    if (allEtudes && allEtudes.length > 1) {
      // Nettoyage : garder le premier, supprimer les doublons
      const duplicateIds = allEtudes.slice(1).map(e => e.id);
      const { error: delDupError } = await supabase
        .from("subjects")
        .delete()
        .eq("school_id", school_id)
        .in("id", duplicateIds);
      if (delDupError) {
        console.error("Erreur suppression doublons matières:", delDupError);
      }
    } else if (!allEtudes || allEtudes.length === 0) {
      const { error } = await supabase.from("subjects").insert({
        school_id,
        name: "Étude de texte",
        cycle: "primaire",
        category: "Français",
        coefficient: 1.0,
      });
      if (error) throw error;
    }

    revalidatePath("/admin/academique/matieres");
    revalidatePath("/admin/academique/notes");
    revalidatePath("/admin/academique/bulletins");
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
  const subjectId = formData.get("subjectId") as string | null;
  const studentId = formData.get("studentId") as string | null;

  if (!classId || (!subjectId && !studentId)) {
    return { error: "Paramètres manquants pour la sauvegarde (classe et élève ou matière requis)." };
  }

  try {
    const school_id = await getActiveSchoolId();
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Récupérer le niveau et nom de la classe
    const { data: clsData } = await supabase
      .from("classes")
      .select("name, level")
      .eq("id", classId)
      .maybeSingle();

    // Récupérer les noms des matières pour calcul du barème
    const { data: subjectsData } = await supabase
      .from("subjects")
      .select("id, name")
      .eq("school_id", school_id);
    const subjectsMap = new Map((subjectsData || []).map((s) => [s.id, s.name]));

    const academicYear = getDynamicAcademicYear();
    const gradesToUpsert = [];
    const deleteConditions: { student_id: string; subject_id: string; month_number: number }[] = [];

    for (const [key, value] of formData.entries()) {
      if (key.startsWith("score_")) {
        // key format: score_{monthNumber}_{targetId}
        // If studentId is present (mode par élève): targetId is subjectId
        // If subjectId is present (mode par matière): targetId is studentId
        const parts = key.split("_");
        if (parts.length === 3) {
          const monthNumber = parseInt(parts[1], 10);
          const targetId = parts[2];
          const actualStudentId = studentId ? studentId : targetId;
          const actualSubjectId = studentId ? targetId : subjectId!;
          const valStr = typeof value === "string" ? value.trim() : "";

          if (valStr !== "") {
            const score = parseFloat(valStr);
            if (!isNaN(score)) {
              const subjName = subjectsMap.get(actualSubjectId) || "";
              const officialMax = getPrimarySubjectMaxScore(subjName, clsData?.name, clsData?.level);
              const maxScoreStr = formData.get(`max_${actualSubjectId}`) as string | null;
              const maxScore = officialMax || (maxScoreStr ? parseFloat(maxScoreStr) : 10);

              if (score < 0 || score > maxScore) {
                return { error: `La note de ${subjName || 'la discipline'} (${score}) doit être comprise entre 0 et ${maxScore}.` };
              }

              gradesToUpsert.push({
                school_id,
                student_id: actualStudentId,
                subject_id: actualSubjectId,
                month_number: monthNumber,
                score,
                max_score: maxScore,
                academic_year: academicYear,
                entered_by: user?.id,
              });
            }
          } else {
            // Check if there was an existing grade that got cleared
            const origFlag = formData.get(`orig_${monthNumber}_${targetId}`);
            if (origFlag === "1") {
              deleteConditions.push({
                student_id: actualStudentId,
                subject_id: actualSubjectId,
                month_number: monthNumber,
              });
            }
          }
        }
      }
    }

    if (gradesToUpsert.length > 0) {
      const { error: upsertErr } = await supabase
        .from("primary_grades")
        .upsert(gradesToUpsert, {
          onConflict: "student_id, subject_id, month_number, academic_year",
        });
      if (upsertErr) throw upsertErr;
    }

    if (deleteConditions.length > 0) {
      for (const cond of deleteConditions) {
        await supabase
          .from("primary_grades")
          .delete()
          .eq("school_id", school_id)
          .eq("student_id", cond.student_id)
          .eq("subject_id", cond.subject_id)
          .eq("month_number", cond.month_number)
          .eq("academic_year", academicYear);
      }
    }

    revalidatePath("/admin/academique/notes");
    revalidatePath("/admin/academique/bulletins");
    revalidatePath("/enseignant/notes");
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

export interface ClassMonthPrimaryGradesPayload {
  classId: string;
  monthNumber: number;
  upserts: Array<{ studentId: string; subjectId: string; score: number }>;
  deletes: Array<{ studentId: string; subjectId: string }>;
}

export async function saveClassMonthPrimaryGrades(
  payload: ClassMonthPrimaryGradesPayload,
): Promise<{
  success?: boolean;
  error?: string;
  savedCount?: number;
  deletedCount?: number;
  savedGrades?: Array<{ student_id: string; subject_id: string; month_number: number; score: number }>;
  deletedPairs?: Array<{ student_id: string; subject_id: string; month_number: number }>;
  resolvedEtudeSubject?: { id: string; name: string; cycle: string; category: string | null; coefficient: number };
}> {
  if (!payload?.classId) {
    return { error: "Classe manquante pour l'enregistrement des notes." };
  }

  const monthNumber = Math.round(payload.monthNumber || 1);
  if (monthNumber < 1 || monthNumber > 9) {
    return { error: "Mois d'évaluation invalide (1 à 9 requis)." };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return { error: "Session expirée. Veuillez vous reconnecter." };
    }

    const { data: roleData, error: roleErr } = await supabase
      .from("user_school_roles")
      .select("school_id, role")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (roleErr || !roleData?.school_id) {
      return { error: "Établissement introuvable." };
    }

    const allowedRoles = ["admin", "super_admin", "directeur", "censeur", "enseignant", "secretaire"];
    if (!allowedRoles.includes(roleData.role)) {
      return { error: "Action non autorisée pour votre rôle." };
    }

    const school_id = roleData.school_id;
    const admin = createAdminClient();

    // 1. Vérifier que la classe appartient bien à l'école
    const { data: clsData, error: clsErr } = await admin
      .from("classes")
      .select("id, name, level")
      .eq("id", payload.classId)
      .eq("school_id", school_id)
      .maybeSingle();

    if (clsErr || !clsData) {
      return { error: "Classe introuvable dans cet établissement." };
    }

    // 2. Vérifier que les élèves concernés appartiennent à cette classe et école
    const { data: classStudents } = await admin
      .from("students")
      .select("id, last_name, first_name")
      .eq("school_id", school_id)
      .eq("class_id", payload.classId);

    const studentMap = new Map(
      (classStudents || []).map(s => [s.id, `${s.last_name || ''} ${s.first_name || ''}`.trim()])
    );

    // 3. Charger les matières de l'école (et résoudre virtual-etude-de-texte si utilisé)
    const { data: subjectsData } = await admin
      .from("subjects")
      .select("id, name, cycle, category, coefficient")
      .eq("school_id", school_id);

    const subjectsMap = new Map((subjectsData || []).map(s => [s.id, s.name]));
    let resolvedEtudeSubject: { id: string; name: string; cycle: string; category: string | null; coefficient: number } | undefined;

    const usesVirtualEtude =
      payload.upserts.some(u => u.subjectId === "virtual-etude-de-texte") ||
      payload.deletes.some(d => d.subjectId === "virtual-etude-de-texte");

    let realEtudeId: string | null = null;
    if (usesVirtualEtude) {
      const existingEtude = (subjectsData || []).find(s => {
        const n = (s.name || "")
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .trim();
        return n === "etude de texte" || n.includes("etude de texte") || n.includes("etude texte");
      });

      if (existingEtude) {
        realEtudeId = existingEtude.id;
      } else {
        const { data: insertedEtude, error: etudeErr } = await admin
          .from("subjects")
          .insert({
            school_id,
            name: "Étude de texte",
            cycle: "primaire",
            category: "Français",
            coefficient: 1,
          })
          .select("id, name, cycle, category, coefficient")
          .single();

        if (etudeErr || !insertedEtude) {
          return { error: `Impossible d'initialiser la matière Étude de texte : ${etudeErr?.message}` };
        }
        realEtudeId = insertedEtude.id;
        subjectsMap.set(insertedEtude.id, insertedEtude.name);
        resolvedEtudeSubject = insertedEtude;
      }
    }

    const resolveSubjectId = (id: string) =>
      id === "virtual-etude-de-texte" && realEtudeId ? realEtudeId : id;

    const academicYear = getDynamicAcademicYear();
    const upsertMap = new Map<string, any>();

    for (const item of payload.upserts) {
      if (!studentMap.has(item.studentId)) continue;
      const subjectId = resolveSubjectId(item.subjectId);
      const subjName = subjectsMap.get(subjectId);
      if (!subjName) continue;

      const score = Number(item.score);
      if (!Number.isFinite(score)) {
        return { error: `Note invalide détectée pour ${studentMap.get(item.studentId)} (${subjName}).` };
      }

      const officialMax = getPrimarySubjectMaxScore(subjName, clsData.name, clsData.level);
      if (score < 0 || score > officialMax) {
        return {
          error: `La note de ${subjName} (${score}) pour ${studentMap.get(item.studentId)} doit être comprise entre 0 et ${officialMax}.`,
        };
      }

      const key = `${item.studentId}_${subjectId}`;
      upsertMap.set(key, {
        school_id,
        student_id: item.studentId,
        subject_id: subjectId,
        month_number: monthNumber,
        score,
        max_score: officialMax,
        academic_year: academicYear,
        entered_by: user.id,
      });
    }

    const records = Array.from(upsertMap.values());
    if (records.length > 0) {
      const { error: upErr } = await admin
        .from("primary_grades")
        .upsert(records, {
          onConflict: "student_id, subject_id, month_number, academic_year",
        });
      if (upErr) {
        return { error: `Erreur lors de l'enregistrement des notes : ${upErr.message}` };
      }
    }

    const deletedPairs: Array<{ student_id: string; subject_id: string; month_number: number }> = [];
    const seenDeletes = new Set<string>();
    const validDeletes: Array<{ studentId: string; subjectId: string }> = [];

    for (const d of payload.deletes) {
      if (!studentMap.has(d.studentId)) continue;
      const subjectId = resolveSubjectId(d.subjectId);
      if (!subjectsMap.has(subjectId)) continue;
      const key = `${d.studentId}_${subjectId}`;
      if (upsertMap.has(key) || seenDeletes.has(key)) continue;
      seenDeletes.add(key);
      validDeletes.push({ studentId: d.studentId, subjectId });
    }

    for (let i = 0; i < validDeletes.length; i += 20) {
      const chunk = validDeletes.slice(i, i + 20);
      await Promise.all(
        chunk.map(async d => {
          const { error: delErr } = await admin
            .from("primary_grades")
            .delete()
            .eq("school_id", school_id)
            .eq("student_id", d.studentId)
            .eq("subject_id", d.subjectId)
            .eq("month_number", monthNumber)
            .eq("academic_year", academicYear);
          if (!delErr) {
            deletedPairs.push({
              student_id: d.studentId,
              subject_id: d.subjectId,
              month_number: monthNumber,
            });
          }
        })
      );
    }

    revalidatePath("/admin/academique/notes");
    revalidatePath("/admin/academique/bulletins");
    revalidatePath("/enseignant/notes");

    return {
      success: true,
      savedCount: records.length,
      deletedCount: deletedPairs.length,
      savedGrades: records.map(r => ({
        student_id: r.student_id,
        subject_id: r.subject_id,
        month_number: r.month_number,
        score: r.score,
      })),
      deletedPairs,
      resolvedEtudeSubject,
    };
  } catch (err: any) {
    return { error: err?.message || "Erreur inattendue lors de l'enregistrement." };
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
          academic_year: getDynamicAcademicYear(),
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
    revalidatePath("/enseignant/notes");
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

    // Récupérer la classe de l'élève pour le barème officiel
    const { data: stuData } = await supabase
      .from("students")
      .select("class_id, classes:classes(name, level)")
      .eq("id", studentId)
      .maybeSingle();

    const className = (stuData?.classes as any)?.name;
    const classLevel = (stuData?.classes as any)?.level;

    const { data: subjectsData } = await supabase
      .from("subjects")
      .select("id, name")
      .eq("school_id", school_id);
    const subjectsMap = new Map((subjectsData || []).map((s) => [s.id, s.name]));

    const gradesToUpsert = [];
    for (const [key, value] of Object.entries(grades)) {
      // key format: {subjectId}_{monthNumber}
      const parts = key.split("_");
      if (parts.length === 2 && value) {
        const subjectId = parts[0];
        const monthNumber = parseInt(parts[1], 10);
        const score = parseFloat(value);
        if (!isNaN(score)) {
          const subjName = subjectsMap.get(subjectId) || "";
          const officialMax = getPrimarySubjectMaxScore(subjName, className, classLevel);

          if (score < 0 || score > officialMax) {
            return { error: `La note de ${subjName || 'la discipline'} (${score}) dépasse le barème autorisé (${officialMax}).` };
          }

          gradesToUpsert.push({
            school_id,
            student_id: studentId,
            subject_id: subjectId,
            month_number: monthNumber,
            score,
            max_score: officialMax,
            academic_year: getDynamicAcademicYear(),
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
      const { error: infoErr } = await supabase.from("primary_bulletin_info").upsert(
        {
          student_id: studentId,
          appreciation: info.appreciation,
          director_decision: info.decision,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "student_id" },
      );
      if (infoErr) throw infoErr;
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
          academic_year: getDynamicAcademicYear(),
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

  if (!classId) {
    return {
      error: "Veuillez au moins sélectionner une classe.",
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
      subject_name: subjectName || 'Général',
      title: title || 'Devoir',
      description,
      due_date: dueDate ? dueDate : new Date().toISOString().split('T')[0],
      attachment_url: attachmentUrl,
      target_students,
      created_by: user?.id,
    });

    if (error) {
      console.error("DB Insert Error:", error);
      throw error;
    }

    revalidatePath("/admin/academique/devoirs");
    revalidatePath("/enseignant/devoirs");
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function deleteHomework(homeworkId: string): Promise<ActionState> {
  try {
    const school_id = await getActiveSchoolId();
    const supabase = await createClient();

    // Vérifier si le devoir appartient bien à l'école
    const { data: hw, error: fetchError } = await supabase
      .from("homework")
      .select("id")
      .eq("id", homeworkId)
      .eq("school_id", school_id)
      .single();

    if (fetchError || !hw) {
      return { error: "Devoir introuvable ou accès non autorisé." };
    }

    const { error } = await supabase
      .from("homework")
      .delete()
      .eq("id", homeworkId)
      .eq("school_id", school_id);
    if (error) throw error;

    revalidatePath("/admin/academique/devoirs");
    revalidatePath("/enseignant/devoirs");
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function publishBulletinPDF(studentId: string, termOrMonth: string, academicYear: string, fileUrl: string) {
  try {
    const supabase = await createClient()
    const schoolId = await getActiveSchoolId()
    if (!schoolId) return { success: false, error: 'École non trouvée' }
    
    // 1. Check if user is admin
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError || !userData.user) return { success: false, error: 'Non authentifié' }

    const { data: roleData } = await supabase
      .from('user_school_roles')
      .select('role')
      .eq('user_id', userData.user.id)
      .eq('school_id', schoolId)
      .limit(1)
      .maybeSingle()

    if (!roleData || (roleData.role !== 'admin' && roleData.role !== 'super_admin' && roleData.role !== 'comptable')) {
      return { success: false, error: 'Seule la direction ou les administrateurs peuvent publier les bulletins officiels.' }
    }
    
    // 2. Save to published_bulletins table
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

export async function fetchMonthlyAttendance(classId: string, year: number, month: number) {
  try {
    const school_id = await getActiveSchoolId();
    const supabase = await createClient();

    // month est 1-indexé (1 = Janvier, 12 = Décembre)
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    // Calculer le dernier jour du mois
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

    const { data, error } = await supabase
      .from("attendance")
      .select("student_id, date, status")
      .eq("school_id", school_id)
      .eq("class_id", classId)
      .gte("date", startDate)
      .lte("date", endDate);

    if (error) throw error;
    return { data };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function saveMonthlyAttendanceGrid(
  classId: string,
  year: number,
  month: number,
  updates: { student_id: string; date: string; status: string }[]
) {
  try {
    const school_id = await getActiveSchoolId();
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Séparer les présences ('present' ou vide) des absences/retards
    const toUpsert = updates
      .filter((u) => u.status === "absent" || u.status === "retard" || u.status === "absent_justifie")
      .map((u) => ({
        school_id,
        student_id: u.student_id,
        class_id: classId,
        date: u.date,
        status: u.status,
        recorded_by: user?.id,
      }));

    const toDelete = updates.filter((u) => u.status === "present" || !u.status);

    if (toUpsert.length > 0) {
      const { error } = await supabase
        .from("attendance")
        .upsert(toUpsert, { onConflict: "student_id, date" });
      if (error) throw error;
    }

    if (toDelete.length > 0) {
      // Suppression par lots
      for (const record of toDelete) {
        await supabase
          .from("attendance")
          .delete()
          .match({
            school_id,
            student_id: record.student_id,
            date: record.date,
          });
      }
    }

    // On revalide les deux routes possibles
    revalidatePath("/admin/academique/presences");
    revalidatePath("/enseignant/presences");
    
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function clearStudentGrades(studentId: string): Promise<ActionState> {
  try {
    const school_id = await getActiveSchoolId();
    const supabase = await createClient();

    const [primRes, secRes, genRes] = await Promise.all([
      supabase.from("primary_grades").delete().eq("student_id", studentId).eq("school_id", school_id),
      supabase.from("secondary_grades").delete().eq("student_id", studentId).eq("school_id", school_id),
      supabase.from("grades").delete().eq("student_id", studentId).eq("school_id", school_id)
    ]);

    if (primRes.error || secRes.error || genRes.error) {
      const firstErr = primRes.error || secRes.error || genRes.error;
      throw new Error(`Erreur lors de la suppression des notes : ${firstErr?.message}`);
    }

    revalidatePath("/admin/academique/notes");
    revalidatePath("/admin/academique/bulletins");
    revalidatePath("/parent/notes");
    revalidatePath("/parent/bulletins");
    
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

export type ImportClassGradesPayload = {
  classId: string;
  cycle: "primaire" | "maternelle" | "college" | "lycee" | "secondaire";
  monthNumber?: number;
  term?: string;
  createMissingSubjects?: boolean;
  createMissingStudents?: boolean;
  columns: Array<{
    colKey: string;
    name: string;
    maxScore: number;
    coefficient: number;
    subjectId: string | null;
  }>;
  rows: Array<{
    matchedStudentId: string | null;
    lastName: string;
    firstName: string;
    gender?: string | null;
    matricule?: string | null;
    scores: Record<string, number | null>;
  }>;
};

export async function importClassGrades(payload: ImportClassGradesPayload): Promise<{
  success?: boolean;
  error?: string;
  savedGradesCount?: number;
  createdStudentsCount?: number;
  createdSubjectsCount?: number;
  savedPrimaryGrades?: Array<{ student_id: string; subject_id: string; month_number: number; score: number }>;
  savedSecondaryGrades?: Array<{ student_id: string; subject_id: string; term: string; class_score: number | null; comp_score: number | null }>;
  createdStudents?: Array<{ id: string; last_name: string; first_name: string; matricule: string; class_id: string; gender: string | null }>;
  createdSubjects?: Array<{ id: string; name: string; cycle: string; category: string | null; coefficient: number }>;
}> {
  try {
    if (!payload.classId) {
      return { error: "Veuillez sélectionner une classe de destination." };
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Session expirée. Veuillez vous reconnecter." };

    const { data: roleData, error: roleErr } = await supabase
      .from("user_school_roles")
      .select("school_id, role")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (roleErr || !roleData?.school_id) {
      return { error: "Établissement introuvable." };
    }

    const allowedRoles = ["admin", "super_admin", "directeur", "censeur", "enseignant", "secretaire"];
    if (!allowedRoles.includes(roleData.role)) {
      return { error: "Action non autorisée pour votre rôle." };
    }

    const school_id = roleData.school_id;
    const admin = createAdminClient();

    // Vérifier que la classe appartient bien à l'établissement
    const { data: clsData, error: clsErr } = await admin
      .from("classes")
      .select("id, name, level")
      .eq("id", payload.classId)
      .eq("school_id", school_id)
      .maybeSingle();

    if (clsErr || !clsData) {
      return { error: "Classe introuvable dans cet établissement." };
    }

    const isPrimary = payload.cycle === "primaire" || payload.cycle === "maternelle";
    const dbCycle = isPrimary ? (payload.cycle === "maternelle" ? "maternelle" : "primaire") : "secondaire";
    const academicYear = getDynamicAcademicYear();
    const monthNumber = Math.min(9, Math.max(1, payload.monthNumber || 1));
    const term = payload.term || "1er_trimestre";

    // 1. Résoudre les matières (colKey -> subject_id)
    const { data: existingSubjects } = await admin
      .from("subjects")
      .select("id, name, cycle, category, coefficient")
      .eq("school_id", school_id);

    const normText = (s: string) =>
      (s || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();

    const colSubjectMap = new Map<string, { subjectId: string; name: string; maxScore: number }>();
    const createdSubjects: Array<{ id: string; name: string; cycle: string; category: string | null; coefficient: number }> = [];

    for (const col of payload.columns) {
      let targetSubjectId = col.subjectId;
      if (targetSubjectId && targetSubjectId !== "virtual-etude-de-texte") {
        const found = (existingSubjects || []).find(s => s.id === targetSubjectId);
        if (found) {
          colSubjectMap.set(col.colKey, {
            subjectId: found.id,
            name: found.name,
            maxScore: col.maxScore || 10,
          });
          continue;
        }
      }

      // Chercher par nom si virtual ou non mappé
      const colHasAnyScore = payload.rows.some(
        r => r.scores[col.colKey] !== null && r.scores[col.colKey] !== undefined
      );
      if (!colHasAnyScore && targetSubjectId !== "virtual-etude-de-texte") {
        continue;
      }

      const existingByName = (existingSubjects || []).find(
        s => normText(s.name) === normText(col.name) && (isPrimary ? s.cycle !== "secondaire" : s.cycle === "secondaire")
      );

      if (existingByName) {
        colSubjectMap.set(col.colKey, {
          subjectId: existingByName.id,
          name: existingByName.name,
          maxScore: col.maxScore || 10,
        });
      } else if (payload.createMissingSubjects) {
        const { data: insertedSub, error: subErr } = await admin
          .from("subjects")
          .insert({
            school_id,
            name: col.name,
            cycle: dbCycle,
            category: isPrimary ? "Général" : null,
            coefficient: isPrimary ? 1 : col.coefficient || 2,
          })
          .select("id, name, cycle, category, coefficient")
          .single();

        if (subErr || !insertedSub) {
          return { error: `Impossible de créer la matière "${col.name}" : ${subErr?.message}` };
        }
        existingSubjects?.push(insertedSub);
        createdSubjects.push(insertedSub);
        colSubjectMap.set(col.colKey, {
          subjectId: insertedSub.id,
          name: insertedSub.name,
          maxScore: col.maxScore || 10,
        });
      }
    }

    if (colSubjectMap.size === 0) {
      return {
        error:
          "Aucune rubrique n'est associée à une matière Scogestia. Associez au moins une colonne ou activez la création automatique des rubriques manquantes.",
      };
    }

    // 2. Résoudre ou créer les élèves manquants si demandé
    const { data: existingClassStudents } = await admin
      .from("students")
      .select("id")
      .eq("school_id", school_id)
      .eq("class_id", payload.classId);

    const validStudentIds = new Set((existingClassStudents || []).map(s => s.id));
    const missingRows = payload.rows.filter(r => !r.matchedStudentId || !validStudentIds.has(r.matchedStudentId));
    const createdStudents: Array<{ id: string; last_name: string; first_name: string; matricule: string; class_id: string; gender: string | null }> = [];
    const createdStudentIdByRowIdx = new Map<number, string>();

    if (missingRows.length > 0 && payload.createMissingStudents) {
      if (!["admin", "super_admin", "directeur", "censeur", "secretaire"].includes(roleData.role)) {
        return {
          error:
            "La création automatique de nouveaux élèves dans l'effectif est réservée à la direction / secrétariat. Décochez cette option pour enregistrer uniquement les élèves déjà inscrits.",
        };
      }

      const subStatus = await getSchoolSubscriptionStatus(admin as any, school_id);
      if (subStatus.isExpired) {
        return { error: "Votre abonnement a expiré. Impossible de créer de nouveaux élèves." };
      }

      const { count } = await admin
        .from("students")
        .select("*", { count: "exact", head: true })
        .eq("school_id", school_id);

      const currentCount = count || 0;
      if (currentCount + missingRows.length > subStatus.maxStudents) {
        return {
          error: `Limite de votre formule dépassée (${currentCount} + ${missingRows.length} > ${subStatus.maxStudents} élèves).`,
        };
      }

      const { data: allMats } = await admin
        .from("students")
        .select("matricule")
        .eq("school_id", school_id);

      const existingMatSet = new Set((allMats || []).map(m => (m.matricule || "").trim()));
      const numericMats = (allMats || [])
        .map(m => parseInt(m.matricule, 10))
        .filter(n => !isNaN(n));
      let nextMat = numericMats.length > 0 ? Math.max(...numericMats) + 1 : 1000;

      const toInsertStudents: Array<any> = [];
      const rowIndexes: number[] = [];

      payload.rows.forEach((row, idx) => {
        if (row.matchedStudentId && validStudentIds.has(row.matchedStudentId)) return;
        let mat = (row.matricule || "").trim();
        if (!mat || existingMatSet.has(mat)) {
          while (existingMatSet.has(String(nextMat))) nextMat++;
          mat = String(nextMat++);
        }
        existingMatSet.add(mat);

        toInsertStudents.push({
          school_id,
          class_id: payload.classId,
          matricule: mat,
          last_name: (row.lastName || "ÉLÈVE").trim().toUpperCase(),
          first_name: (row.firstName || "").trim() || "-",
          gender: row.gender === "M" || row.gender === "F" ? row.gender : null,
          status: "actif",
        });
        rowIndexes.push(idx);
      });

      if (toInsertStudents.length > 0) {
        const { data: insertedStus, error: stuErr } = await admin
          .from("students")
          .insert(toInsertStudents)
          .select("id, last_name, first_name, matricule, class_id, gender");

        if (stuErr || !insertedStus) {
          return { error: `Erreur lors de la création des élèves manquants : ${stuErr?.message}` };
        }

        insertedStus.forEach((st, i) => {
          createdStudents.push(st);
          createdStudentIdByRowIdx.set(rowIndexes[i], st.id);
        });
      }
    }

    // 3. Préparer les notes à enregistrer
    if (isPrimary) {
      const upsertsMap = new Map<string, any>();

      payload.rows.forEach((row, idx) => {
        const stuId =
          row.matchedStudentId && validStudentIds.has(row.matchedStudentId)
            ? row.matchedStudentId
            : createdStudentIdByRowIdx.get(idx);
        if (!stuId) return;

        for (const [colKey, mapping] of colSubjectMap.entries()) {
          const val = row.scores[colKey];
          if (val === null || val === undefined || isNaN(val)) continue;
          const safeVal = Math.max(0, Math.min(100, Number(val)));
          const officialMax = Math.max(
            mapping.maxScore || 10,
            getPrimarySubjectMaxScore(mapping.name, clsData.name, clsData.level),
            safeVal > 10 ? 20 : 10
          );

          const dedupKey = `${stuId}_${mapping.subjectId}`;
          upsertsMap.set(dedupKey, {
            school_id,
            student_id: stuId,
            subject_id: mapping.subjectId,
            month_number: monthNumber,
            score: safeVal,
            max_score: officialMax,
            academic_year: academicYear,
            entered_by: user.id,
          });
        }
      });

      const records = Array.from(upsertsMap.values());
      if (records.length === 0) {
        return {
          error: "Aucune note à enregistrer pour les élèves reconnus dans cette classe.",
        };
      }

      const { error: upErr } = await admin
        .from("primary_grades")
        .upsert(records, {
          onConflict: "student_id, subject_id, month_number, academic_year",
        });

      if (upErr) {
        return { error: `Erreur lors de l'enregistrement des notes : ${upErr.message}` };
      }

      revalidatePath("/admin/academique/notes");
      revalidatePath("/admin/academique/bulletins");
      revalidatePath("/enseignant/notes");

      return {
        success: true,
        savedGradesCount: records.length,
        createdStudentsCount: createdStudents.length,
        createdSubjectsCount: createdSubjects.length,
        savedPrimaryGrades: records.map(r => ({
          student_id: r.student_id,
          subject_id: r.subject_id,
          month_number: r.month_number,
          score: r.score,
        })),
        createdStudents,
        createdSubjects,
      };
    } else {
      const upsertsMap = new Map<string, any>();

      payload.rows.forEach((row, idx) => {
        const stuId =
          row.matchedStudentId && validStudentIds.has(row.matchedStudentId)
            ? row.matchedStudentId
            : createdStudentIdByRowIdx.get(idx);
        if (!stuId) return;

        for (const [colKey, mapping] of colSubjectMap.entries()) {
          const val = row.scores[colKey];
          if (val === null || val === undefined || isNaN(val)) continue;
          const safeVal = Math.max(0, Math.min(20, Number(val)));

          const dedupKey = `${stuId}_${mapping.subjectId}`;
          upsertsMap.set(dedupKey, {
            school_id,
            student_id: stuId,
            subject_id: mapping.subjectId,
            term,
            class_score: null,
            comp_score: safeVal,
            max_score: 20,
            academic_year: academicYear,
            entered_by: user.id,
          });
        }
      });

      const records = Array.from(upsertsMap.values());
      if (records.length === 0) {
        return {
          error: "Aucune note à enregistrer pour les élèves reconnus dans cette classe.",
        };
      }

      const { error: upErr } = await admin
        .from("secondary_grades")
        .upsert(records, {
          onConflict: "student_id, subject_id, term, academic_year",
        });

      if (upErr) {
        return { error: `Erreur lors de l'enregistrement des notes : ${upErr.message}` };
      }

      revalidatePath("/admin/academique/notes");
      revalidatePath("/admin/academique/bulletins");
      revalidatePath("/enseignant/notes");

      return {
        success: true,
        savedGradesCount: records.length,
        createdStudentsCount: createdStudents.length,
        createdSubjectsCount: createdSubjects.length,
        savedSecondaryGrades: records.map(r => ({
          student_id: r.student_id,
          subject_id: r.subject_id,
          term: r.term,
          class_score: r.class_score,
          comp_score: r.comp_score,
        })),
        createdStudents,
        createdSubjects,
      };
    }
  } catch (err: any) {
    return { error: err?.message || "Erreur inattendue lors de l'importation." };
  }
}
