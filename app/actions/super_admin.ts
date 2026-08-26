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

  const { data: superAdmin, error } = await supabase
    .from('super_admins')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (error || !superAdmin) {
    throw new Error('Accès refusé. Vous n\'êtes pas un Super Administrateur du SaaS.');
  }
  
  return user.id;
}

export async function getSaaSDashboardMetrics() {
  const supabase = await createClient();
  await verifySuperAdmin(supabase);

  // Pour les requêtes Super Admin, on bypass RLS en utilisant éventuellement le Service Role 
  // OU on utilise simplement notre politique RLS fraîchement créée qui autorise la lecture.
  const { data: schools, error } = await supabase
    .from('schools')
    .select('id, subscription_status, subscription_plan');

  if (error) {
    throw new Error('Erreur lors de la récupération des métriques');
  }

  const totalSchools = schools.length;
  const activeSchools = schools.filter(s => s.subscription_status === 'active').length;
  const suspendedSchools = schools.filter(s => s.subscription_status === 'suspended').length;
  
  // Estimation MRR très basique : 
  // starter: 0, pro: 15000, premium: 30000 (exemple)
  let mrr = 0;
  schools.forEach(s => {
    if (s.subscription_status === 'active') {
      if (s.subscription_plan === 'pro') mrr += 15000;
      if (s.subscription_plan === 'premium') mrr += 30000;
    }
  });

  return { totalSchools, activeSchools, suspendedSchools, mrr };
}

export async function getAllSchools() {
  const supabase = await createClient();
  await verifySuperAdmin(supabase);

  const { data: schools, error } = await supabase
    .from('schools')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error('Erreur de récupération des écoles');
  return schools;
}

export async function toggleSchoolStatus(schoolId: string, currentStatus: string): Promise<ActionState> {
  try {
    const supabase = await createClient();
    await verifySuperAdmin(supabase);

    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';

    const { error } = await supabase
      .from('schools')
      .update({ subscription_status: newStatus })
      .eq('id', schoolId);

    if (error) throw new Error(`Erreur lors de la mise à jour: ${error.message}`);

    revalidatePath('/super_admin/ecoles');
    revalidatePath('/super_admin');
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function updateSchoolPlan(schoolId: string, newPlan: string): Promise<ActionState> {
  try {
    const supabase = await createClient();
    await verifySuperAdmin(supabase);

    const { error } = await supabase
      .from('schools')
      .update({ subscription_plan: newPlan })
      .eq('id', schoolId);

    if (error) throw new Error(`Erreur lors de la mise à jour: ${error.message}`);

    revalidatePath('/super_admin/ecoles');
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}
