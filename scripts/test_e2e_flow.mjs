import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const adminClient = createClient(supabaseUrl, serviceKey);

async function runE2E() {
  console.log("=== DÉBUT DU TEST E2E ===");
  try {
    console.log("1. Création d'une école de test...");
    const school = await adminClient.from('schools').insert({ name: 'École E2E', slug: `ecole-e2e-${Date.now()}` }).select().single();
    if (school.error) {
      console.error(school.error);
      throw new Error("Erreur création école");
    }
    const schoolId = school.data.id;

    console.log("2. Création d'une classe...");
    const classData = await adminClient.from('classes').insert({ school_id: schoolId, name: '6ème E2E', level: 'college', academic_year: '2026-2027' }).select().single();
    if (classData.error) {
       console.error(classData.error);
       throw new Error("Erreur création classe");
    }
    const classId = classData.data.id;

    console.log("3. Inscription d'un élève...");
    const student = await adminClient.from('students').insert({
      school_id: schoolId,
      class_id: classId,
      first_name: 'John',
      last_name: 'Doe',
      matricule: `STU-E2E-${Date.now()}`
    }).select().single();
    if (student.error) throw new Error("Erreur création élève");
    const studentId = student.data.id;

    console.log("4. Ajout d'une note...");
    const grade = await adminClient.from('grades').insert({
      school_id: schoolId,
      student_id: studentId,
      class_id: classId,
      subject_name: 'Mathématiques',
      evaluation_type: 'devoir_mensuel',
      score: 18,
      max_score: 20,
      coefficient: 2,
      term: 'T1'
    }).select().single();
    if (grade.error) {
       console.error(grade.error);
       throw new Error("Erreur création note");
    }

    console.log("5. Génération d'une échéance financière...");
    const schedule = await adminClient.from('payment_schedules').insert({
      school_id: schoolId,
      student_id: studentId,
      academic_year: '2026-2027',
      label: 'Frais de scolarité E2E',
      amount_due: 100000,
      due_date: new Date().toISOString(),
      status: 'en_attente'
    }).select().single();
    if (schedule.error) throw new Error("Erreur génération échéance");

    console.log("6. Enregistrement d'un paiement...");
    const payment = await adminClient.from('payments').insert({
      school_id: schoolId,
      student_id: studentId,
      schedule_id: schedule.data.id,
      amount: 100000,
      payment_method: 'espèces',
      receipt_number: `REC-E2E-${Date.now()}`
    }).select().single();
    if (payment.error) throw new Error("Erreur enregistrement paiement");

    console.log("✅ TOUS LES FLUX ONT ÉTÉ VALIDÉS AVEC SUCCÈS !");
    
    console.log("=== NETTOYAGE ===");
    await adminClient.from('schools').delete().eq('id', schoolId);
    console.log("Données de test supprimées.");
    process.exit(0);

  } catch (err) {
    console.error("❌ ERREUR E2E :", err);
    process.exit(1);
  }
}

runE2E();
