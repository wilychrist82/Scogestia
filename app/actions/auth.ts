'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { authRateLimit, checkRateLimit } from '@/lib/ratelimit'
import { sendEmail } from '@/lib/emails/send'
import { welcomeEmailHtml } from '@/lib/emails/templates/welcome'

export type AuthState = {
  error?: string;
  success?: boolean;
} | null;

export async function loginStaff(prevState: AuthState, formData: FormData): Promise<AuthState> {
  const identifier = formData.get('identifier') as string;
  const password = formData.get('password') as string;

  if (!identifier || !password) {
    return { error: 'Veuillez renseigner votre identifiant et votre mot de passe.' };
  }

  const headerList = await headers()
  const ip = headerList.get('x-forwarded-for') || '127.0.0.1'
  const rateLimit = await checkRateLimit(authRateLimit, `login_${ip}`)
  
  if (!rateLimit.success) {
    return { error: 'Trop de tentatives. Veuillez réessayer plus tard.' };
  }

  const supabase = await createClient();

  const cleanIdentifier = identifier.trim().replace(/\s+/g, '');
  const isEmail = cleanIdentifier.includes('@');
  
  // Dans Supabase Auth, les numéros de téléphone doivent être au format E.164 (avec le +)
  // Si le numéro commence par +, on le garde tel quel
  // Sinon, on tente de le nettoyer (parfois les gens oublient le + ou le code pays, on va utiliser la valeur telle quelle pour l'instant et voir l'erreur exacte)
  const credentials = isEmail 
    ? { email: cleanIdentifier, password }
    : { phone: cleanIdentifier.startsWith('+') ? cleanIdentifier : `+${cleanIdentifier}`, password };

  const { data, error } = await supabase.auth.signInWithPassword(credentials);

  // Fallback si le format avec "+" échoue (au cas où il a été enregistré différemment)
  let finalError = error;
  let finalData = data;

  if (error && !isEmail && credentials.phone?.startsWith('+')) {
     const fallbackCredentials = { phone: cleanIdentifier, password };
     const retry = await supabase.auth.signInWithPassword(fallbackCredentials);
     finalData = retry.data;
     finalError = retry.error;
  }

  if (finalError || !finalData.session) {
    console.error('Login error details:', finalError);
    return { error: `Erreur de connexion : ${finalError?.message || 'Identifiants invalides.'}` };
  }

  // Utiliser le token de la session utilisateur pour vérifier son rôle
  const userSupabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${finalData.session.access_token}`
        }
      }
    }
  );

  const { data: roles, error: rolesError } = await userSupabase
    .from('user_school_roles')
    .select('role')
    .eq('user_id', finalData.user.id)
    .limit(1);

  if (rolesError || !roles || roles.length === 0) {
    // S'il n'a pas de rôle, on le déconnecte (ex: un parent qui essaierait de se connecter ici)
    await supabase.auth.signOut();
    return { error: 'Accès refusé. Vous ne faites pas partie du personnel.' };
  }

  // Si c'est un parent, on le redirige vers l'espace parent
  if (roles[0].role === 'parent') {
    redirect('/parent');
  }

  redirect('/');
}

export async function registerSchool(prevState: AuthState, formData: FormData): Promise<AuthState> {
  const schoolName = formData.get('schoolName') as string;
  const city = formData.get('city') as string;
  const adminName = formData.get('adminName') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!schoolName || !city || !adminName || !email || !password) {
    return { error: 'Veuillez remplir tous les champs.' };
  }

  const supabase = await createClient();

  // 1. Inscription de l'utilisateur sur Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) {
    return { error: `Erreur d'inscription : ${authError.message}` };
  }

  if (!authData.user) {
    return { error: 'Une erreur est survenue lors de la création du compte.' };
  }

  // 2. Appel de la fonction RPC pour créer l'école et le rôle
  const { data: schoolId, error: rpcError } = await supabase.rpc('register_new_school', {
    p_school_name: schoolName,
    p_city: city,
    p_admin_name: adminName,
  });

  if (rpcError) {
    return { error: `Erreur lors de la création de l'école : ${rpcError.message}` };
  }

  // 3. Création automatique d'un abonnement d'essai gratuit de 14 jours
  if (schoolId) {
    const adminSupabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 14); // 14 jours
    
    await adminSupabase.from('saas_subscriptions').insert({
      school_id: schoolId,
      status: 'trial',
      plan_name: 'Essai Gratuit',
      current_period_end: trialEndDate.toISOString(),
    });

    const hasMaternelle = formData.get('cycle_maternelle') !== null;
    const hasPrimaire = formData.get('cycle_primaire') !== null;
    const hasCollege = formData.get('cycle_college') !== null;
    const hasLycee = formData.get('cycle_lycee') !== null;

    // 4. Configurer uniquement les classes correspondant aux cycles sélectionnés par l'école
    await configureInitialClasses(adminSupabase, schoolId, {
      hasMaternelle,
      hasPrimaire,
      hasCollege,
      hasLycee,
    });

    // 5. Email de bienvenue (non-bloquant)
    await sendEmail({
      to: email,
      subject: `Bienvenue sur Scogestia — ${schoolName} est prête !`,
      html: welcomeEmailHtml({
        adminName,
        schoolName,
        loginUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://app.scogestia.com'}/connexion`,
        trialDays: 14,
      }),
    }).catch(err => console.error('[Welcome Email Error]', err))
  }

  redirect('/connexion');
}

export async function completeOnboarding(prevState: AuthState, formData: FormData): Promise<AuthState> {
  const schoolName = formData.get('schoolName') as string;
  const city = formData.get('city') as string;
  const adminName = formData.get('adminName') as string;

  if (!schoolName || !city || !adminName) {
    return { error: 'Veuillez remplir tous les champs.' };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Non authentifié. Veuillez vous reconnecter.' };
  }

  // Appel de la fonction RPC pour créer l'école et le rôle
  const { data: schoolId, error: rpcError } = await supabase.rpc('register_new_school', {
    p_school_name: schoolName,
    p_city: city,
    p_admin_name: adminName,
  });

  if (rpcError) {
    return { error: `Erreur lors de la création de l'école : ${rpcError.message}` };
  }

  // Création automatique d'un abonnement d'essai gratuit de 14 jours
  if (schoolId) {
    const adminSupabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 14); // 14 jours
    
    await adminSupabase.from('saas_subscriptions').insert({
      school_id: schoolId,
      status: 'trial',
      plan_name: 'Essai Gratuit',
      current_period_end: trialEndDate.toISOString(),
    });

    const academicYear = (formData.get('academicYear') as string)?.trim() || '2026-2027';

    // Synchroniser l'année académique active sur l'école et ses classes initiales
    const { error: schoolUpErr } = await adminSupabase.from('schools').update({
      current_academic_year: academicYear
    }).eq('id', schoolId);
    if (schoolUpErr) console.error('[completeOnboarding] Erreur mise à jour école:', schoolUpErr);

    const { error: classUpErr } = await adminSupabase.from('classes').update({
      academic_year: academicYear
    }).eq('school_id', schoolId);
    if (classUpErr) console.error('[completeOnboarding] Erreur mise à jour classes:', classUpErr);

    const hasMaternelle = formData.get('cycle_maternelle') !== null;
    const hasPrimaire = formData.get('cycle_primaire') !== null;
    const hasCollege = formData.get('cycle_college') !== null;
    const hasLycee = formData.get('cycle_lycee') !== null;

    // Configurer uniquement les classes correspondant aux cycles sélectionnés par l'école
    await configureInitialClasses(adminSupabase, schoolId, {
      hasMaternelle,
      hasPrimaire,
      hasCollege,
      hasLycee,
    }, academicYear);
  }

  redirect('/admin');
}

export async function logout() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const adminClient = await import('@/lib/supabase/admin').then(m => m.createAdminClient());
    await adminClient.from('user_devices').delete().eq('user_id', user.id);
  }
  await supabase.auth.signOut();
  redirect('/connexion');
}

export async function requestPasswordReset(prevState: AuthState, formData: FormData): Promise<AuthState> {
  const email = formData.get('email') as string;

  if (!email) {
    return { error: 'Veuillez renseigner votre adresse email.' };
  }

  const headerList = await headers();
  const origin = headerList.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/api/auth/callback?next=/nouveau-mot-de-passe`,
  });

  if (error) {
    // Ne pas révéler si l'email existe ou non pour des raisons de sécurité
    return { error: 'Une erreur est survenue. Veuillez réessayer.' };
  }

  return { success: true };
}

export async function updatePassword(prevState: AuthState, formData: FormData): Promise<AuthState> {
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (!password || !confirmPassword) {
    return { error: 'Veuillez remplir tous les champs.' };
  }

  if (password !== confirmPassword) {
    return { error: 'Les mots de passe ne correspondent pas.' };
  }

  if (password.length < 6) {
    return { error: 'Le mot de passe doit contenir au moins 6 caractères.' };
  }

  const supabase = await createClient();
  
  const { error } = await supabase.auth.updateUser({
    password: password
  });

  if (error) {
    return { error: `Erreur lors de la mise à jour: ${error.message}` };
  }

  redirect('/admin');
}

type SchoolCycles = {
  hasMaternelle: boolean;
  hasPrimaire: boolean;
  hasCollege: boolean;
  hasLycee: boolean;
};

/**
 * Configure les classes initiales selon les cycles d'enseignement cochés par l'école.
 * Évite d'encombrer une école primaire avec des classes de collège/lycée ou inversement.
 */
async function configureInitialClasses(
  adminSupabase: any, 
  schoolId: string, 
  cycles: SchoolCycles,
  academicYear: string = '2026-2027'
) {
  try {
    // 1. Si le Lycée est coché, insérer Seconde, Première et Terminale
    if (cycles.hasLycee) {
      const lyceeClasses = [
        { school_id: schoolId, name: 'Seconde', level: 'Lycée', capacity: 40, academic_year: academicYear },
        { school_id: schoolId, name: 'Première', level: 'Lycée', capacity: 40, academic_year: academicYear },
        { school_id: schoolId, name: 'Terminale', level: 'Lycée', capacity: 40, academic_year: academicYear },
      ];
      for (const cls of lyceeClasses) {
        const { data: existing } = await adminSupabase
          .from('classes')
          .select('id')
          .eq('school_id', schoolId)
          .eq('name', cls.name)
          .maybeSingle();
        if (!existing) {
          await adminSupabase.from('classes').insert(cls);
        }
      }
    }

    // Fonction sécurisée pour supprimer les classes décochées UNIQUEMENT si aucun élève n'y est inscrit
    const safeDeleteClasses = async (classNames: string[]) => {
      const { data: targetClasses } = await adminSupabase
        .from('classes')
        .select('id, name')
        .eq('school_id', schoolId)
        .in('name', classNames);

      if (!targetClasses || targetClasses.length === 0) return;

      for (const cls of targetClasses) {
        const { count } = await adminSupabase
          .from('students')
          .select('id', { count: 'exact', head: true })
          .eq('class_id', cls.id);

        if (!count || count === 0) {
          const { error: delErr } = await adminSupabase
            .from('classes')
            .delete()
            .eq('id', cls.id)
            .eq('school_id', schoolId);
          if (delErr) {
            console.warn(`[configureInitialClasses] Erreur suppression classe vide ${cls.name}:`, delErr.message);
          }
        } else {
          console.warn(`[configureInitialClasses] Classe ${cls.name} (${cls.id}) conservée : ${count} élève(s) y sont rattaché(s).`);
        }
      }
    };

    // 2. Si le Collège n'est PAS coché, retirer les classes collège (si vides)
    if (!cycles.hasCollege) {
      await safeDeleteClasses(['6ème', '5ème', '4ème', '3ème']);
    }

    // 3. Si le Primaire n'est PAS coché, retirer les classes primaire (si vides)
    if (!cycles.hasPrimaire) {
      await safeDeleteClasses(['CP1', 'CP2', 'CE1', 'CE2', 'CM1', 'CM2']);
    }

    // 4. Si la Maternelle n'est PAS cochée, retirer les classes maternelle (si vides)
    if (!cycles.hasMaternelle) {
      await safeDeleteClasses(['S1', 'S2']);
    }
  } catch (err) {
    console.error('[configureInitialClasses] Erreur lors de la configuration des classes:', err);
  }
}
