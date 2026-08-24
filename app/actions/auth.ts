'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { authRateLimit, checkRateLimit } from '@/lib/ratelimit'

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

  const isEmail = identifier.includes('@');
  const credentials = isEmail 
    ? { email: identifier, password }
    : { phone: identifier, password };

  const { data, error } = await supabase.auth.signInWithPassword(credentials);

  if (error || !data.session) {
    return { error: 'Identifiants invalides.' };
  }

  // Utiliser le token de la session utilisateur pour vérifier son rôle
  const userSupabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${data.session.access_token}`
        }
      }
    }
  );

  const { data: roles, error: rolesError } = await userSupabase
    .from('user_school_roles')
    .select('role')
    .eq('user_id', data.user.id)
    .limit(1);

  if (rolesError || !roles || roles.length === 0) {
    // S'il n'a pas de rôle, on le déconnecte (ex: un parent qui essaierait de se connecter ici)
    await supabase.auth.signOut();
    return { error: 'Accès refusé. Vous ne faites pas partie du personnel.' };
  }

  // Vérifier si c'est un parent seulement, interdire l'accès au portail staff
  if (roles[0].role === 'parent') {
    await supabase.auth.signOut();
    return { error: 'Accès réservé au personnel. Les parents ont leur propre portail.' };
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

  redirect('/connexion');
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/connexion');
}

