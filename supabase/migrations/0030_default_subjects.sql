-- 0030_default_subjects.sql

-- 1. Mettre à jour la fonction RPC pour insérer les matières par défaut
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

  -- 6. Insérer les matières par défaut
  insert into public.subjects (school_id, name, cycle, category, coefficient)
  values
    -- Primaire
    (v_school_id, 'Je sais écrire les mots (dictée, questions)', 'primaire', 'Français', 1.0),
    (v_school_id, 'Je produis un texte (Rédaction)', 'primaire', 'Français', 1.0),
    (v_school_id, 'Lecture', 'primaire', 'Français', 1.0),
    (v_school_id, 'Je sais parler (langage)', 'primaire', 'Français', 1.0),
    (v_school_id, 'Calcul Écrit', 'primaire', 'Mathématiques', 1.0),
    (v_school_id, 'Calcul mental', 'primaire', 'Mathématiques', 1.0),
    (v_school_id, 'Problème', 'primaire', 'Mathématiques', 1.0),
    (v_school_id, 'Sciences Humaines (Histoire-Géographie)', 'primaire', 'Sciences', 1.0),
    (v_school_id, 'Education Sociale (ECM)', 'primaire', 'Sciences', 1.0),
    (v_school_id, 'Sciences et Technologie (Edusivip)', 'primaire', 'Sciences', 1.0),
    (v_school_id, 'Arts plastiques (Dessin)', 'primaire', 'Divers', 1.0),
    (v_school_id, 'Chant', 'primaire', 'Divers', 1.0),
    (v_school_id, 'Récitation', 'primaire', 'Divers', 1.0),
    (v_school_id, 'Anglais', 'primaire', 'Divers', 1.0),
    (v_school_id, 'EPS', 'primaire', 'Divers', 1.0),
    -- Secondaire
    (v_school_id, 'Français', 'secondaire', null, 2.0),
    (v_school_id, 'Rédaction', 'secondaire', null, 1.0),
    (v_school_id, 'Histoire-Géographie', 'secondaire', null, 2.0),
    (v_school_id, 'Anglais', 'secondaire', null, 2.0),
    (v_school_id, 'SVT', 'secondaire', null, 2.0),
    (v_school_id, 'Mathématiques', 'secondaire', null, 4.0),
    (v_school_id, 'Sciences physiques', 'secondaire', null, 3.0),
    (v_school_id, 'ECM', 'secondaire', null, 1.0),
    (v_school_id, 'EPS', 'secondaire', null, 1.0);

  return v_school_id;
end;
$$;

-- 2. Insérer les matières par défaut pour toutes les écoles existantes qui n'ont pas encore de matières
DO $$
DECLARE
  sch RECORD;
BEGIN
  FOR sch IN SELECT id FROM public.schools
  LOOP
    -- Vérifier s'il y a déjà des matières pour cette école
    IF NOT EXISTS (SELECT 1 FROM public.subjects WHERE school_id = sch.id) THEN
      insert into public.subjects (school_id, name, cycle, category, coefficient)
      values
        -- Primaire
        (sch.id, 'Je sais écrire les mots (dictée, questions)', 'primaire', 'Français', 1.0),
        (sch.id, 'Je produis un texte (Rédaction)', 'primaire', 'Français', 1.0),
        (sch.id, 'Lecture', 'primaire', 'Français', 1.0),
        (sch.id, 'Je sais parler (langage)', 'primaire', 'Français', 1.0),
        (sch.id, 'Calcul Écrit', 'primaire', 'Mathématiques', 1.0),
        (sch.id, 'Calcul mental', 'primaire', 'Mathématiques', 1.0),
        (sch.id, 'Problème', 'primaire', 'Mathématiques', 1.0),
        (sch.id, 'Sciences Humaines (Histoire-Géographie)', 'primaire', 'Sciences', 1.0),
        (sch.id, 'Education Sociale (ECM)', 'primaire', 'Sciences', 1.0),
        (sch.id, 'Sciences et Technologie (Edusivip)', 'primaire', 'Sciences', 1.0),
        (sch.id, 'Arts plastiques (Dessin)', 'primaire', 'Divers', 1.0),
        (sch.id, 'Chant', 'primaire', 'Divers', 1.0),
        (sch.id, 'Récitation', 'primaire', 'Divers', 1.0),
        (sch.id, 'Anglais', 'primaire', 'Divers', 1.0),
        (sch.id, 'EPS', 'primaire', 'Divers', 1.0),
        -- Secondaire
        (sch.id, 'Français', 'secondaire', null, 2.0),
        (sch.id, 'Rédaction', 'secondaire', null, 1.0),
        (sch.id, 'Histoire-Géographie', 'secondaire', null, 2.0),
        (sch.id, 'Anglais', 'secondaire', null, 2.0),
        (sch.id, 'SVT', 'secondaire', null, 2.0),
        (sch.id, 'Mathématiques', 'secondaire', null, 4.0),
        (sch.id, 'Sciences physiques', 'secondaire', null, 3.0),
        (sch.id, 'ECM', 'secondaire', null, 1.0),
        (sch.id, 'EPS', 'secondaire', null, 1.0);
    END IF;
  END LOOP;
END;
$$;
