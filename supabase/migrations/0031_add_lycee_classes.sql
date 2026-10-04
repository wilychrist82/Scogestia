-- Migration 0031: Ajout du cycle Lycée (Secondaire 2) complet : Seconde, Première, Terminale

-- 1. Mise à jour de la fonction register_school_with_admin pour inclure Seconde, Première et Terminale
create or replace function public.register_school_with_admin(
  p_school_name text,
  p_admin_name text,
  p_city text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_school_id uuid;
  v_slug text;
begin
  -- 1. Récupérer l'ID de l'utilisateur connecté
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Non authentifié';
  end if;

  -- 2. Générer un slug unique
  v_slug := lower(regexp_replace(p_school_name, '[^a-zA-Z0-9]', '-', 'g'));
  v_slug := regexp_replace(v_slug, '-+', '-', 'g');
  v_slug := trim(both '-' from v_slug);
  
  if exists (select 1 from public.schools where slug = v_slug) then
    v_slug := v_slug || '-' || substr(md5(random()::text), 1, 4);
  end if;

  -- 3. Insérer la nouvelle école
  insert into public.schools (name, slug, city, current_academic_year)
  values (p_school_name, v_slug, p_city, '2024-2025')
  returning id into v_school_id;

  -- 4. Assigner le rôle admin au créateur
  insert into public.user_school_roles (user_id, school_id, role, full_name)
  values (v_user_id, v_school_id, 'admin', p_admin_name);

  -- 5. Insérer les classes par défaut (Cycle complet : Maternelle -> Primaire -> Collège -> Lycée)
  insert into public.classes (school_id, name, level, academic_year)
  values 
    -- Maternelle
    (v_school_id, 'S1', 'Maternelle', '2024-2025'),
    (v_school_id, 'S2', 'Maternelle', '2024-2025'),
    -- Primaire
    (v_school_id, 'CP1', 'Primaire', '2024-2025'),
    (v_school_id, 'CP2', 'Primaire', '2024-2025'),
    (v_school_id, 'CE1', 'Primaire', '2024-2025'),
    (v_school_id, 'CE2', 'Primaire', '2024-2025'),
    (v_school_id, 'CM1', 'Primaire', '2024-2025'),
    (v_school_id, 'CM2', 'Primaire', '2024-2025'),
    -- Collège (Secondaire 1)
    (v_school_id, '6ème', 'Secondaire', '2024-2025'),
    (v_school_id, '5ème', 'Secondaire', '2024-2025'),
    (v_school_id, '4ème', 'Secondaire', '2024-2025'),
    (v_school_id, '3ème', 'Secondaire', '2024-2025'),
    -- Lycée (Secondaire 2)
    (v_school_id, 'Seconde', 'Lycée', '2024-2025'),
    (v_school_id, 'Première', 'Lycée', '2024-2025'),
    (v_school_id, 'Terminale', 'Lycée', '2024-2025');

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
    -- Secondaire & Lycée
    (v_school_id, 'Français', 'secondaire', null, 2.0),
    (v_school_id, 'Rédaction', 'secondaire', null, 1.0),
    (v_school_id, 'Histoire-Géographie', 'secondaire', null, 2.0),
    (v_school_id, 'Education Civique et Morale (ECM)', 'secondaire', null, 1.0),
    (v_school_id, 'Anglais', 'secondaire', null, 2.0),
    (v_school_id, 'Mathématiques', 'secondaire', null, 3.0),
    (v_school_id, 'Sciences de la Vie et de la Terre (SVT)', 'secondaire', null, 2.0),
    (v_school_id, 'Sciences Physiques', 'secondaire', null, 2.0),
    (v_school_id, 'EPS', 'secondaire', null, 1.0);

  return v_school_id;
end;
$$;

-- 2. Insérer Seconde, Première et Terminale pour toutes les écoles existantes qui ne les ont pas
insert into public.classes (school_id, name, level, academic_year, capacity)
select s.id, 'Seconde', 'Lycée', '2024-2025', 80
from public.schools s
where not exists (
  select 1 from public.classes c 
  where c.school_id = s.id and lower(c.name) in ('seconde', '2nde')
);

insert into public.classes (school_id, name, level, academic_year, capacity)
select s.id, 'Première', 'Lycée', '2024-2025', 80
from public.schools s
where not exists (
  select 1 from public.classes c 
  where c.school_id = s.id and lower(c.name) in ('premiere', 'première', '1ere', '1ère')
);

insert into public.classes (school_id, name, level, academic_year, capacity)
select s.id, 'Terminale', 'Lycée', '2024-2025', 80
from public.schools s
where not exists (
  select 1 from public.classes c 
  where c.school_id = s.id and lower(c.name) in ('terminale', 'tle')
);
