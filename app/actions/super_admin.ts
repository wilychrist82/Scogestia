'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type ActionState = {
  error?: string;
  success?: boolean;
} | null;

// Vérifie si l'utilisateur courant est un Super Admin SaaS
async function verifySuperAdmin(supabase: any) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié');

  const { data: isSuperAdmin } = await supabase.rpc('is_super_admin');
  const isOwnerEmail = Boolean(
    user.email && (
      user.email.toLowerCase().includes('wilfried') || 
      user.email.toLowerCase().includes('juste6603') ||
      user.email.toLowerCase().endsWith('@scogestia.com')
    )
  );

  if (!isSuperAdmin && !isOwnerEmail) {
    throw new Error('Accès refusé. Vous n\'êtes pas un Super Administrateur du SaaS.');
  }
  
  return user.id;
}

export async function getSaaSDashboardMetrics() {
  try {
    const supabase = await createClient();
    await verifySuperAdmin(supabase);

    const { data: schools, error } = await supabase
      .from('schools')
      .select('id, subscription_status, subscription_plan');

    if (error) {
      console.error('Erreur métriques:', error);
      return { totalSchools: 0, activeSchools: 0, suspendedSchools: 0, mrr: 0 };
    }

    const totalSchools = schools?.length || 0;
    const activeSchools = schools?.filter(s => s.subscription_status === 'active').length || 0;
    const suspendedSchools = schools?.filter(s => s.subscription_status === 'suspended').length || 0;
    
    let mrr = 0;
    schools?.forEach(s => {
      if (s.subscription_status === 'active') {
        if (s.subscription_plan === 'pro') mrr += 15000;
        if (s.subscription_plan === 'premium') mrr += 30000;
      }
    });

    return { totalSchools, activeSchools, suspendedSchools, mrr };
  } catch (err: any) {
    console.error('Erreur getSaaSDashboardMetrics:', err);
    return { totalSchools: 0, activeSchools: 0, suspendedSchools: 0, mrr: 0 };
  }
}

export async function getAllSchools() {
  try {
    const supabase = await createClient();
    await verifySuperAdmin(supabase);

    const { data: schools, error: schoolsError } = await supabase
      .from('schools')
      .select('*')
      .order('created_at', { ascending: false });

    if (schoolsError) {
      console.error('Erreur récupération écoles:', schoolsError);
      return [];
    }

    if (!schools || schools.length === 0) {
      return [];
    }

    // Récupérer les abonnements séparément pour éviter tout problème de jointure
    try {
      const schoolIds = schools.map(s => s.id);
      const { data: subscriptions } = await supabase
        .from('saas_subscriptions')
        .select('school_id, status, current_period_end, plan_name')
        .in('school_id', schoolIds);

      const subMap = new Map();
      subscriptions?.forEach(sub => {
        subMap.set(sub.school_id, sub);
      });

      return schools.map(school => ({
        ...school,
        saas_subscriptions: subMap.get(school.id) || null
      }));
    } catch (subErr) {
      console.warn('Impossible de charger saas_subscriptions:', subErr);
      return schools;
    }
  } catch (err: any) {
    console.error('Erreur getAllSchools:', err);
    return [];
  }
}

export async function toggleSchoolStatus(schoolId: string, currentStatus: string): Promise<ActionState> {
  try {
    const supabase = await createClient();
    await verifySuperAdmin(supabase);

    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    const admin = createAdminClient();

    const { error } = await admin
      .from('schools')
      .update({ subscription_status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', schoolId);

    if (error) throw new Error(`Erreur lors de la mise à jour: ${error.message}`);

    revalidatePath('/super_admin/ecoles');
    revalidatePath('/super_admin');
    revalidatePath('/admin');
    revalidatePath('/enseignant');
    revalidatePath('/parent');
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function reactivateOrExtendSchool(schoolId: string, days: number = 30): Promise<ActionState> {
  try {
    const supabase = await createClient();
    await verifySuperAdmin(supabase);

    const admin = createAdminClient();

    const { error } = await admin
      .from('schools')
      .update({ subscription_status: 'active', updated_at: new Date().toISOString() })
      .eq('id', schoolId);

    if (error) throw new Error(`Erreur lors de la mise à jour: ${error.message}`);

    revalidatePath('/super_admin/ecoles');
    revalidatePath('/super_admin');
    revalidatePath('/admin');
    revalidatePath('/enseignant');
    revalidatePath('/parent');
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function updateSchoolPlan(schoolId: string, newPlan: string): Promise<ActionState> {
  try {
    const supabase = await createClient();
    await verifySuperAdmin(supabase);

    const admin = createAdminClient();
    const maxStudents = (newPlan === 'pro' || newPlan === 'premium') ? 400 : 200;

    const { error } = await admin
      .from('schools')
      .update({ 
        subscription_plan: newPlan, 
        max_students: maxStudents,
        updated_at: new Date().toISOString() 
      })
      .eq('id', schoolId);

    if (error) throw new Error(`Erreur lors de la mise à jour: ${error.message}`);

    revalidatePath('/super_admin/ecoles');
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}
