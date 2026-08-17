-- ============================================
-- 1. ACTIVATION DE RLS SUR TOUTES LES TABLES
-- ============================================
alter table public.schools enable row level security;
alter table public.user_school_roles enable row level security;
alter table public.classes enable row level security;
alter table public.students enable row level security;
alter table public.parent_student_links enable row level security;
alter table public.teacher_class_subjects enable row level security;
alter table public.payment_schedules enable row level security;
alter table public.payments enable row level security;
alter table public.payment_reminders enable row level security;
alter table public.grades enable row level security;
alter table public.attendance enable row level security;
alter table public.homework enable row level security;

-- ============================================
-- 2. FONCTIONS SECURITY DEFINER
-- ============================================

-- Retourne les IDs des écoles où l'utilisateur actif a un rôle valide
create or replace function public.user_school_ids()
returns setof uuid
language sql security definer stable
set search_path = public
as $$
  select school_id 
  from public.user_school_roles 
  where user_id = auth.uid() 
    and is_active = true;
$$;

-- Vérifie si l'utilisateur possède l'un des rôles spécifiés dans une école donnée
create or replace function public.has_role_in_school(p_school_id uuid, p_roles user_role[])
returns boolean
language sql security definer stable
set search_path = public
as $$
  select exists (
    select 1 
    from public.user_school_roles 
    where user_id = auth.uid() 
      and school_id = p_school_id 
      and is_active = true 
      and role = any(p_roles)
  );
$$;

-- Retourne les IDs des enfants liés au parent actif
create or replace function public.parent_student_ids()
returns setof uuid
language sql security definer stable
set search_path = public
as $$
  select student_id 
  from public.parent_student_links 
  where parent_user_id = auth.uid();
$$;

-- ============================================
-- 3. POLICIES RLS (Table par Table)
-- ============================================

-- SCHOOLS
-- Lecture: Utilisateurs ayant un rôle dans l'école
create policy "Lecture des écoles permise aux utilisateurs liés" 
on public.schools for select 
using (id in (select public.user_school_ids()));

-- Modification: Admins et Super Admins uniquement
create policy "Modification des écoles permise aux admins" 
on public.schools for update 
using (public.has_role_in_school(id, array['super_admin'::user_role, 'admin'::user_role]));

-- USER_SCHOOL_ROLES
-- Lecture: Utilisateurs peuvent voir le personnel de leur(s) école(s)
create policy "Lecture des rôles dans les écoles de l'utilisateur" 
on public.user_school_roles for select 
using (school_id in (select public.user_school_ids()));

-- Modification: Admins et Super Admins
create policy "Gestion des rôles par les admins" 
on public.user_school_roles for all 
using (public.has_role_in_school(school_id, array['super_admin'::user_role, 'admin'::user_role]));

-- CLASSES
-- Lecture: Tout utilisateur de l'école
create policy "Lecture des classes dans les écoles de l'utilisateur" 
on public.classes for select 
using (school_id in (select public.user_school_ids()));

-- Modification: Admins
create policy "Gestion des classes par les admins" 
on public.classes for all 
using (public.has_role_in_school(school_id, array['super_admin'::user_role, 'admin'::user_role]));

-- STUDENTS
-- Lecture: Le staff (admin, comptable, prof) voit tous les élèves de l'école, le parent ne voit que ses enfants.
create policy "Lecture des élèves (Staff entier de l'école OU parent de l'enfant)" 
on public.students for select 
using (
  public.has_role_in_school(school_id, array['super_admin'::user_role, 'admin'::user_role, 'comptable'::user_role, 'enseignant'::user_role])
  or id in (select public.parent_student_ids())
);

-- Modification: Admins
create policy "Gestion des élèves par les admins" 
on public.students for all 
using (public.has_role_in_school(school_id, array['super_admin'::user_role, 'admin'::user_role]));

-- PARENT_STUDENT_LINKS
-- Lecture: Admins ou le parent lui-même
create policy "Lecture des liens parents" 
on public.parent_student_links for select 
using (
  public.has_role_in_school(school_id, array['super_admin'::user_role, 'admin'::user_role])
  or parent_user_id = auth.uid()
);

-- Modification: Admins
create policy "Gestion des liens parents par les admins" 
on public.parent_student_links for all 
using (public.has_role_in_school(school_id, array['super_admin'::user_role, 'admin'::user_role]));

-- TEACHER_CLASS_SUBJECTS
-- Lecture: Tout utilisateur de l'école
create policy "Lecture des affectations profs" 
on public.teacher_class_subjects for select 
using (school_id in (select public.user_school_ids()));

-- Modification: Admins
create policy "Gestion des affectations par les admins" 
on public.teacher_class_subjects for all 
using (public.has_role_in_school(school_id, array['super_admin'::user_role, 'admin'::user_role]));

-- PAYMENT_SCHEDULES, PAYMENTS, PAYMENT_REMINDERS (Finance)
-- Lecture: Comptables, Admins OU parents (pour leurs enfants)
create policy "Lecture finance (Admins, Comptables ou Parents)" 
on public.payment_schedules for select 
using (
  public.has_role_in_school(school_id, array['super_admin'::user_role, 'admin'::user_role, 'comptable'::user_role])
  or student_id in (select public.parent_student_ids())
);

create policy "Gestion finance (Admins et Comptables)" 
on public.payment_schedules for all 
using (public.has_role_in_school(school_id, array['super_admin'::user_role, 'admin'::user_role, 'comptable'::user_role]));

create policy "Lecture paiements (Admins, Comptables ou Parents)" 
on public.payments for select 
using (
  public.has_role_in_school(school_id, array['super_admin'::user_role, 'admin'::user_role, 'comptable'::user_role])
  or student_id in (select public.parent_student_ids())
);

create policy "Gestion paiements (Admins et Comptables)" 
on public.payments for all 
using (public.has_role_in_school(school_id, array['super_admin'::user_role, 'admin'::user_role, 'comptable'::user_role]));

create policy "Lecture relances (Admins et Comptables)" 
on public.payment_reminders for select 
using (public.has_role_in_school(school_id, array['super_admin'::user_role, 'admin'::user_role, 'comptable'::user_role]));

create policy "Gestion relances (Admins et Comptables)" 
on public.payment_reminders for all 
using (public.has_role_in_school(school_id, array['super_admin'::user_role, 'admin'::user_role, 'comptable'::user_role]));

-- GRADES
-- Lecture: Staff de l'école (Admin, Prof, Comptable) OU parent de l'enfant
create policy "Lecture notes (Staff ou Parent)" 
on public.grades for select 
using (
  public.has_role_in_school(school_id, array['super_admin'::user_role, 'admin'::user_role, 'enseignant'::user_role, 'comptable'::user_role])
  or student_id in (select public.parent_student_ids())
);

-- Modification: Professeurs et Admins
create policy "Gestion notes (Admins et Profs)" 
on public.grades for all 
using (public.has_role_in_school(school_id, array['super_admin'::user_role, 'admin'::user_role, 'enseignant'::user_role]));

-- ATTENDANCE
-- Lecture: Staff de l'école OU parent de l'enfant
create policy "Lecture présences (Staff ou Parent)" 
on public.attendance for select 
using (
  public.has_role_in_school(school_id, array['super_admin'::user_role, 'admin'::user_role, 'enseignant'::user_role, 'comptable'::user_role])
  or student_id in (select public.parent_student_ids())
);

-- Modification: Professeurs et Admins
create policy "Gestion présences (Admins et Profs)" 
on public.attendance for all 
using (public.has_role_in_school(school_id, array['super_admin'::user_role, 'admin'::user_role, 'enseignant'::user_role]));

-- HOMEWORK
-- Lecture: Staff de l'école OU parents dont l'enfant est dans la classe (ici, tout parent de l'école peut voir, isolation par classe possible via jointure)
create policy "Lecture devoirs (Staff ou Parents de l'école)" 
on public.homework for select 
using (school_id in (select public.user_school_ids()));

-- Modification: Professeurs et Admins
create policy "Gestion devoirs (Admins et Profs)" 
on public.homework for all 
using (public.has_role_in_school(school_id, array['super_admin'::user_role, 'admin'::user_role, 'enseignant'::user_role]));


/*
=============================================================================
SCÉNARIO DE TEST MANUEL : VÉRIFICATION ISOLATION PARENT / ÉCOLE
=============================================================================
Objectif : Vérifier qu'un parent de l'école A ne peut lire QUE les données de
ses propres enfants, et ne peut ABSOLUMENT PAS lire les élèves de l'école B
ou même d'autres enfants de l'école A.

1. Simuler l'authentification en tant que Parent 1
   (depuis l'interface SQL Supabase ou via psql) :
   
   set request.jwt.claim.sub = 'uuid-de-parent-1';
   set request.jwt.claim.role = 'authenticated';

2. Exécuter la requête :
   
   SELECT id, first_name, school_id FROM public.students;

3. Résultat attendu (Comportement RLS) :
   La policy "Lecture des élèves (Staff entier de l'école OU parent de l'enfant)"
   va filtrer automatiquement les lignes.
   
   - has_role_in_school() retournera FALSE pour le parent (car son rôle est 'parent'
     et la fonction demande 'admin', 'enseignant', etc.)
   - La clause `id in (select public.parent_student_ids())` sera donc l'unique 
     condition validée.
   - RESULTAT : Seules les lignes de `students` correspondant aux enfants de 
     Parent 1 seront retournées. Les élèves de l'école B, ou les autres 
     élèves de l'école A n'apparaîtront pas. 

4. Nettoyage après test :
   reset request.jwt.claim.sub;
   reset request.jwt.claim.role;
=============================================================================
*/
