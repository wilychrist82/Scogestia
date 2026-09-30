'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
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
  const supabase = await createClient();
  await verifySuperAdmin(supabase);

  const adminClient = createAdminClient();
  const { data: schools, error } = await adminClient
    .from('schools')
    .select('id, subscription_status, subscription_plan');

  if (error) {
    throw new Error('Erreur lors de la récupération des métriques: ' + error.message);
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
}

export async function getAllSchools() {
  const supabase = await createClient();
  await verifySuperAdmin(supabase);

  const adminClient = createAdminClient();
  const { data: schools, error } = await adminClient
    .from('schools')
    .select(`
      *,
      saas_subscriptions (
        status,
        current_period_end,
        plan_name
      )
    `)
    .order('created_at', { ascending: false });

  if (error) throw new Error('Erreur de récupération des écoles: ' + error.message);
  return schools;
}

export async function toggleSchoolStatus(schoolId: string, currentStatus: string): Promise<ActionState> {
  try {
    const supabase = await createClient();
    await verifySuperAdmin(supabase);

    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    const adminClient = createAdminClient();

    const { error } = await adminClient
      .from('schools')
      .update({ subscription_status: newStatus })
      .eq('id', schoolId);

    if (error) throw new Error(`Erreur lors de la mise à jour: ${error.message}`);

    // Si on réactive l'école, on prolonge aussi saas_subscriptions pour lever le blocage
    if (newStatus === 'active') {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      await adminClient
        .from('saas_subscriptions')
        .upsert({
          school_id: schoolId,
          status: 'active',
          current_period_end: futureDate.toISOString(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'school_id' });
    } else {
      await adminClient
        .from('saas_subscriptions')
        .update({
          status: 'expired',
          updated_at: new Date().toISOString()
        })
        .eq('school_id', schoolId);
    }

    revalidatePath('/super_admin/ecoles');
    revalidatePath('/super_admin');
    revalidatePath('/admin');
    revalidatePath('/enseignant');
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function reactivateOrExtendSchool(schoolId: string, days: number = 30): Promise<ActionState> {
  try {
    const supabase = await createClient();
    await verifySuperAdmin(supabase);

    const adminClient = createAdminClient();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    await adminClient
      .from('schools')
      .update({ subscription_status: 'active' })
      .eq('id', schoolId);

    await adminClient
      .from('saas_subscriptions')
      .upsert({
        school_id: schoolId,
        status: 'active',
        current_period_end: futureDate.toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'school_id' });

    revalidatePath('/super_admin/ecoles');
    revalidatePath('/super_admin');
    revalidatePath('/admin');
    revalidatePath('/enseignant');
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function updateSchoolPlan(schoolId: string, newPlan: string): Promise<ActionState> {
  try {
    const supabase = await createClient();
    await verifySuperAdmin(supabase);

    const adminClient = createAdminClient();
    const { error } = await adminClient
      .from('schools')
      .update({ subscription_plan: newPlan })
      .eq('id', schoolId);

    if (error) throw new Error(`Erreur lors de la mise à jour: ${error.message}`);

    await adminClient
      .from('saas_subscriptions')
      .update({
        plan_name: newPlan,
        updated_at: new Date().toISOString()
      })
      .eq('school_id', schoolId);

    revalidatePath('/super_admin/ecoles');
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}
