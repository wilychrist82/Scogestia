import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

// Service role client bypasses RLS
const adminClient = createClient(supabaseUrl, serviceKey);

async function runAudit() {
  console.log("=== DÉBUT DE L'AUDIT RLS ===");

  try {
    // 1. Création des données de test
    console.log("1. Création de deux écoles distinctes...");
    const schoolA = await adminClient.from('schools').insert({ name: 'École A (Test RLS)', slug: `ecole-a-${Date.now()}` }).select().single();
    const schoolB = await adminClient.from('schools').insert({ name: 'École B (Test RLS)', slug: `ecole-b-${Date.now()}` }).select().single();

    if (schoolA.error) {
      console.error("School A Error:", schoolA.error);
      throw new Error("Erreur création école A");
    }
    if (schoolB.error) {
      console.error("School B Error:", schoolB.error);
      throw new Error("Erreur création école B");
    }

    const schoolAId = schoolA.data.id;
    const schoolBId = schoolB.data.id;

    console.log("2. Création d'un élève dans l'École B...");
    const studentB = await adminClient.from('students').insert({
      school_id: schoolBId,
      first_name: 'Élève',
      last_name: 'B',
      matricule: `TEST-${Date.now()}-B`
    }).select().single();

    if (studentB.error) throw new Error("Erreur création élève B");

    console.log("3. Création d'un utilisateur Parent pour l'École A...");
    const email = `parent_test_${Date.now()}@test.com`;
    const password = 'TestPassword123!';
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (authError) throw new Error("Erreur création Auth Parent");
    const parentId = authData.user.id;

    // Assigner le rôle de parent dans l'École A
    await adminClient.from('user_school_roles').insert({
      user_id: parentId,
      school_id: schoolAId,
      role: 'parent',
      full_name: 'Parent Test A'
    });

    console.log("4. Authentification en tant que Parent (École A)...");
    const parentClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    const { error: signInError } = await parentClient.auth.signInWithPassword({ email, password });
    if (signInError) throw new Error("Erreur connexion Parent");

    console.log("5. Test d'isolation RLS (Lecture croisée) : Le Parent A essaie de lire l'élève B...");
    const { data: readData, error: readError } = await parentClient.from('students').select('*').eq('id', studentB.data.id);
    
    if (readError) {
      console.log(`✅ TEST RÉUSSI : Accès refusé par la base de données. (${readError.message})`);
    } else if (readData && readData.length === 0) {
      console.log(`✅ TEST RÉUSSI : La politique RLS a masqué l'élève de l'école B. (0 ligne retournée)`);
    } else {
      console.error(`❌ ÉCHEC DU TEST : Le Parent A a pu lire l'élève B ! Faille RLS détectée !`);
      process.exit(1);
    }

    console.log("6. Test d'isolation RLS (Écriture croisée) : Le Parent A essaie d'insérer un paiement pour l'École B...");
    const { error: insertError } = await parentClient.from('payments').insert({
      school_id: schoolBId,
      student_id: studentB.data.id,
      amount: 50000,
      payment_method: 'espèces'
    });

    if (insertError) {
       console.log(`✅ TEST RÉUSSI : Insertion bloquée par la base de données. (${insertError.message})`);
    } else {
       console.error(`❌ ÉCHEC DU TEST : Le Parent A a pu insérer des données dans l'École B ! Faille RLS détectée !`);
       process.exit(1);
    }

    console.log("=== NETTOYAGE ===");
    await adminClient.from('schools').delete().eq('id', schoolAId);
    await adminClient.from('schools').delete().eq('id', schoolBId);
    await adminClient.auth.admin.deleteUser(parentId);
    console.log("Données de test supprimées.");

    console.log("=== AUDIT TERMINÉ AVEC SUCCÈS ===");
    process.exit(0);
  } catch (err) {
    console.error("❌ ERREUR LORS DE L'AUDIT :", err);
    process.exit(1);
  }
}

runAudit();
