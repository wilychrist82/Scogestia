-- ==============================================================================
-- FONCTION RPC POUR L'INSCRIPTION INITIALE D'UNE ÉCOLE
-- ==============================================================================
-- Cette fonction s'exécute avec les privilèges du créateur (SECURITY DEFINER).
-- Elle permet à un nouvel utilisateur (qui vient de s'inscrire sur Supabase Auth)
-- de créer son école et de s'attribuer le rôle d'admin, sans nécessiter
-- l'utilisation de la `service_role` côté client.

create or replace function public.register_new_school(
  p_school_name text,
  p_city text,
  p_admin_name text
)
returns uuid
language plpgsql security definer
set search_path = public
as $$
declare
  v_school_id uuid;
  v_slug text;
  v_count int;
  v_user_id uuid;
begin
  -- 1. Récupérer l'ID de l'utilisateur authentifié
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Non authentifié';
  end if;

  -- 2. Générer un slug basique à partir du nom
  v_slug := lower(regexp_replace(p_school_name, '[^a-zA-Z0-9]+', '-', 'g'));
  -- S'assurer que le slug est unique
  select count(*) into v_count from public.schools where slug = v_slug;
  if v_count > 0 then
    v_slug := v_slug || '-' || substr(md5(random()::text), 1, 4);
  end if;

  -- 3. Insérer la nouvelle école
  insert into public.schools (name, slug, city, current_academic_year)
  values (p_school_name, v_slug, p_city, '2024-2025')
  returning id into v_school_id;

  -- 4. Assigner le rôle admin au créateur
  insert into public.user_school_roles (user_id, school_id, role, full_name)
  values (v_user_id, v_school_id, 'admin', p_admin_name);

  -- 5. Insérer les classes par défaut
  insert into public.classes (school_id, name, level, academic_year)
  values 
    (v_school_id, 'S1', 'Maternelle', '2024-2025'),
    (v_school_id, 'S2', 'Maternelle', '2024-2025'),
    (v_school_id, 'CP1', 'Primaire', '2024-2025'),
    (v_school_id, 'CP2', 'Primaire', '2024-2025'),
    (v_school_id, 'CE1', 'Primaire', '2024-2025'),
    (v_school_id, 'CE2', 'Primaire', '2024-2025'),
    (v_school_id, 'CM1', 'Primaire', '2024-2025'),
    (v_school_id, 'CM2', 'Primaire', '2024-2025'),
    (v_school_id, '6ème', 'Secondaire', '2024-2025'),
    (v_school_id, '5ème', 'Secondaire', '2024-2025'),
    (v_school_id, '4ème', 'Secondaire', '2024-2025'),
    (v_school_id, '3ème', 'Secondaire', '2024-2025');

  return v_school_id;
end;
$$;
