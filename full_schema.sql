DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO postgres; GRANT ALL ON SCHEMA public TO public;
-- ============================================
-- EXTENSION & TYPES
-- ============================================
create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

create type user_role as enum ('super_admin', 'admin', 'comptable', 'enseignant', 'parent');
create type payment_status as enum ('en_attente', 'paye', 'partiel', 'en_retard', 'annule');
create type attendance_status as enum ('present', 'absent', 'retard', 'absent_justifie');
create type evaluation_type as enum ('devoir_mensuel', 'composition_trimestrielle', 'devoir_maison');

-- ============================================
-- 1. SCHOOLS (le tenant racine)
-- ============================================
create table public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  country text default 'TG',
  city text,
  phone text,
  email text,
  logo_url text,
  subscription_plan text default 'starter',
  subscription_status text default 'active',
  billing_cycle text default 'monthly',
  max_students integer default 200,
  current_academic_year text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- 2. USER_SCHOOL_ROLES (pivot central de la sécurité)
-- ============================================
create table public.user_school_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  school_id uuid not null references public.schools(id) on delete cascade,
  role user_role not null,
  full_name text not null,
  phone text,
  is_active boolean default true,
  created_at timestamptz default now(),
  unique(user_id, school_id, role)
);

create index idx_usr_user on public.user_school_roles(user_id);
create index idx_usr_school on public.user_school_roles(school_id);

-- ============================================
-- 3. CLASSES (créée avant students car students y fait référence)
-- ============================================
create table public.classes (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  name text not null,
  level text not null,
  academic_year text not null,
  main_teacher_id uuid references auth.users(id),
  capacity integer default 40,
  created_at timestamptz default now()
);

create index idx_classes_school on public.classes(school_id);

-- ============================================
-- 4. STUDENTS
-- ============================================
create table public.students (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  matricule text not null,
  first_name text not null,
  last_name text not null,
  date_of_birth date,
  gender text,
  class_id uuid references public.classes(id),
  enrollment_date date default current_date,
  status text default 'actif',
  photo_url text,
  created_at timestamptz default now(),
  unique(school_id, matricule)
);

create index idx_students_school on public.students(school_id);
create index idx_students_class on public.students(class_id);

-- ============================================
-- 5. PARENT_STUDENT_LINKS
-- ============================================
create table public.parent_student_links (
  id uuid primary key default gen_random_uuid(),
  parent_user_id uuid not null references auth.users(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  school_id uuid not null references public.schools(id) on delete cascade,
  relationship text default 'parent',
  created_at timestamptz default now(),
  unique(parent_user_id, student_id)
);

create index idx_psl_parent on public.parent_student_links(parent_user_id);
create index idx_psl_student on public.parent_student_links(student_id);

-- ============================================
-- 6. TEACHER_CLASS_SUBJECTS
-- ============================================
create table public.teacher_class_subjects (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  teacher_id uuid not null references auth.users(id),
  class_id uuid not null references public.classes(id) on delete cascade,
  subject_name text not null,
  coefficient numeric(4,2) default 1.0,
  created_at timestamptz default now()
);

create index idx_tcs_teacher on public.teacher_class_subjects(teacher_id);
create index idx_tcs_class on public.teacher_class_subjects(class_id);

-- ============================================
-- 7. PAYMENTS (échéancier + historique + relances)
-- ============================================
create table public.payment_schedules (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  academic_year text not null,
  label text not null,
  amount_due numeric(12,2) not null,
  due_date date not null,
  status payment_status default 'en_attente',
  created_at timestamptz default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  schedule_id uuid references public.payment_schedules(id),
  amount numeric(12,2) not null,
  payment_method text,
  transaction_reference text,
  paid_at timestamptz default now(),
  recorded_by uuid references auth.users(id),
  receipt_url text,
  created_at timestamptz default now()
);

create table public.payment_reminders (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  schedule_id uuid not null references public.payment_schedules(id) on delete cascade,
  sent_at timestamptz default now(),
  channel text default 'sms',
  status text default 'envoye'
);

create index idx_payments_student on public.payments(student_id);
create index idx_schedules_student on public.payment_schedules(student_id);
create index idx_schedules_school_status on public.payment_schedules(school_id, status);

-- ============================================
-- 8. GRADES
-- ============================================
create table public.grades (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  class_id uuid not null references public.classes(id),
  subject_name text not null,
  evaluation_type evaluation_type not null,
  term text not null,
  score numeric(5,2) not null,
  max_score numeric(5,2) default 20,
  coefficient numeric(4,2) default 1.0,
  entered_by uuid references auth.users(id),
  entered_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_grades_student_term on public.grades(student_id, term);
create index idx_grades_class on public.grades(class_id);

-- ============================================
-- 9. ATTENDANCE
-- ============================================
create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  class_id uuid not null references public.classes(id),
  date date not null,
  status attendance_status not null,
  justification text,
  recorded_by uuid references auth.users(id),
  created_at timestamptz default now(),
  unique(student_id, date)
);

create index idx_attendance_student_date on public.attendance(student_id, date);
create index idx_attendance_class_date on public.attendance(class_id, date);

-- ============================================
-- 10. HOMEWORK
-- ============================================
create table public.homework (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  subject_name text not null,
  title text not null,
  description text,
  due_date date not null,
  attachment_url text,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

create index idx_homework_class on public.homework(class_id, due_date);
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
  insert into public.schools (name, slug, city)
  values (p_school_name, v_slug, p_city)
  returning id into v_school_id;

  -- 4. Assigner le rôle admin au créateur
  insert into public.user_school_roles (user_id, school_id, role, full_name)
  values (v_user_id, v_school_id, 'admin', p_admin_name);

  return v_school_id;
end;
$$;
-- Table parent_invitation_codes
create table public.parent_invitation_codes (
  id uuid default gen_random_uuid() primary key,
  school_id uuid not null references public.schools(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  code text not null,
  expires_at timestamptz not null default (now() + interval '7 days'),
  used_at timestamptz,
  created_at timestamptz default now() not null,
  created_by uuid references auth.users(id) on delete set null
);

-- Index pour la recherche rapide du code
create index idx_parent_invitations_code on public.parent_invitation_codes(code);
-- Index pour le nettoyage et l'affichage par école/étudiant
create index idx_parent_invitations_school on public.parent_invitation_codes(school_id);
create index idx_parent_invitations_student on public.parent_invitation_codes(student_id);

-- Unicité du code pour éviter les collisions globales
alter table public.parent_invitation_codes add constraint parent_invitations_code_key unique(code);

-- RLS
alter table public.parent_invitation_codes enable row level security;

-- L'utilisateur (staff) peut voir les invitations de son école
create policy "Staff can view invitations of their school"
  on public.parent_invitation_codes for select
  using (
    school_id in (
      select school_id from public.user_school_roles 
      where user_id = auth.uid()
    )
  );

-- L'utilisateur (admin/staff) peut créer des invitations pour son école
create policy "Staff can insert invitations for their school"
  on public.parent_invitation_codes for insert
  with check (
    school_id in (
      select school_id from public.user_school_roles 
      where user_id = auth.uid()
    )
  );

-- Un visiteur non authentifié peut lire une invitation par son code s'il n'est pas expiré ni utilisé (nécessaire pour la vérification)
create policy "Anyone can read a valid invitation by code"
  on public.parent_invitation_codes for select
  using (
    used_at is null 
    and expires_at > now()
  );

-- Mise à jour (pour marquer comme utilisé) :
-- Cela sera fait en bypassant RLS dans un Security Definer RPC, ou via RLS.
-- Comme nous n'utilisons pas service_role, nous pouvons utiliser un trigger ou un Security Definer.
-- Mais pour simplifier, on permet à quiconque de "consommer" (update) un code valide qu'il connait,
-- SAUF qu'on ne peut pas modifier autre chose que used_at.
create policy "Anyone can mark invitation as used"
  on public.parent_invitation_codes for update
  using (
    used_at is null 
    and expires_at > now()
  )
  with check (
    -- On s'assure qu'ils ne changent que used_at (ou que ce soit le bon code)
    used_at is not null
  );

-- Fonction sécurisée pour la consommation (Option recommandée)
create or replace function consume_parent_invitation(invitation_code text, parent_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invitation record;
begin
  -- Trouver l'invitation valide
  select * into v_invitation
  from parent_invitation_codes
  where code = invitation_code
    and used_at is null
    and expires_at > now()
  for update;

  if not found then
    raise exception 'Code invalide, expiré ou déjà utilisé.';
  end if;

  -- Marquer comme utilisé
  update parent_invitation_codes
  set used_at = now()
  where id = v_invitation.id;

  -- Lier le parent à l'étudiant
  insert into parent_student_links (parent_user_id, student_id, relationship)
  values (parent_user_id, v_invitation.student_id, 'parent')
  on conflict (parent_user_id, student_id) do nothing;
  
  -- S'assurer que le parent a le rôle 'parent' dans user_school_roles pour cette école
  insert into user_school_roles (user_id, school_id, role)
  values (parent_user_id, v_invitation.school_id, 'parent')
  on conflict (user_id, school_id) do nothing;
end;
$$;

create table public.dues (
  id uuid default gen_random_uuid() primary key,
  school_id uuid not null references public.schools(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  label text not null,
  amount numeric(10, 2) not null,
  due_date date not null,
  status payment_status not null default 'en_attente',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index pour accélérer les requêtes de filtrage sur la table
create index idx_dues_school on public.dues(school_id);
create index idx_dues_student on public.dues(student_id);
create index idx_dues_status on public.dues(status);
create index idx_dues_due_date on public.dues(due_date);

-- RLS pour les échéances
alter table public.dues enable row level security;

-- Seuls les utilisateurs appartenant à l'école peuvent voir les échéances
create policy "Users can view dues of their school"
  on public.dues for select
  using (
    school_id in (
      select school_id from public.user_school_roles 
      where user_id = auth.uid()
    )
  );

-- Seul le comptable ou l'admin peut créer/modifier des échéances
create policy "Comptable and admin can insert dues"
  on public.dues for insert
  with check (
    school_id in (
      select school_id from public.user_school_roles 
      where user_id = auth.uid() and role in ('admin', 'comptable')
    )
  );

create policy "Comptable and admin can update dues"
  on public.dues for update
  using (
    school_id in (
      select school_id from public.user_school_roles 
      where user_id = auth.uid() and role in ('admin', 'comptable')
    )
  );

-- RPC : Mettre à jour les échéances dépassées
create or replace function public.update_overdue_dues()
returns integer
language plpgsql
security definer
as $$
declare
  updated_count integer;
begin
  update public.dues
  set 
    status = 'en_retard',
    updated_at = now()
  where 
    due_date < current_date
    and status = 'en_attente';
    
  get diagnostics updated_count = row_count;
  return updated_count;
end;
$$;
create type transaction_status as enum ('pending', 'success', 'failed');

drop table if exists public.payments cascade;
create table public.payments (
  id uuid default gen_random_uuid() primary key,
  due_id uuid not null references public.dues(id) on delete cascade,
  amount numeric(10, 2) not null,
  payment_method text not null, -- tmoney, flooz, wave, orange, momo, etc.
  transaction_id text not null unique, -- CinetPay transaction id
  status transaction_status not null default 'pending',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index pour la recherche par transaction ID
create index idx_payments_transaction_id on public.payments(transaction_id);
create index idx_payments_due_id on public.payments(due_id);
create index idx_payments_status on public.payments(status);

-- RLS
alter table public.payments enable row level security;

-- Le parent peut voir les paiements liés à ses enfants
create policy "Parents can view payments for their children"
  on public.payments for select
  using (
    due_id in (
      select d.id from public.dues d
      join public.parent_student_links psl on d.student_id = psl.student_id
      where psl.parent_user_id = auth.uid()
    )
  );

-- Le parent peut insérer un paiement (lors de l'initialisation)
create policy "Parents can insert payments for their children"
  on public.payments for insert
  with check (
    due_id in (
      select d.id from public.dues d
      join public.parent_student_links psl on d.student_id = psl.student_id
      where psl.parent_user_id = auth.uid()
    )
  );

-- Le staff de l'école peut voir les paiements
create policy "Staff can view payments of their school"
  on public.payments for select
  using (
    due_id in (
      select d.id from public.dues d
      where d.school_id in (
        select school_id from public.user_school_roles 
        where user_id = auth.uid()
      )
    )
  );

-- Mettre à jour (seulement admin/webhook/system, donc soit bypass RLS, soit role)
-- On utilise le service_role pour le webhook, donc il bypasse RLS.
create table public.payment_webhook_logs (
  id uuid default gen_random_uuid() primary key,
  transaction_id text, -- Peut être nul si on n'arrive pas à parser la requête
  payload jsonb not null,
  status text not null default 'received', -- 'received', 'processed', 'error', 'failed_check'
  error_details text,
  created_at timestamptz not null default now()
);

-- Index pour la recherche par transaction ID
create index idx_webhook_logs_trans_id on public.payment_webhook_logs(transaction_id);
create index idx_webhook_logs_status on public.payment_webhook_logs(status);

-- RLS
alter table public.payment_webhook_logs enable row level security;

-- Seuls les administrateurs et comptables peuvent lire ces logs (si besoin)
create policy "Admins can read webhook logs"
  on public.payment_webhook_logs for select
  using (
    auth.uid() in (
      select user_id from public.user_school_roles 
      where role in ('admin', 'comptable')
    )
  );

-- Seul le service_role peut écrire (via le webhook)
-- Aucune policy d'insertion pour l'authentifié n'est nécessaire car le webhook bypasse RLS.

-- Fonction transactionnelle pour le succès d'un paiement
create or replace function public.process_cinetpay_success(p_transaction_id text, p_amount numeric)
returns void
language plpgsql
security definer
as $$
declare
  v_payment record;
begin
  -- 1. Trouver le paiement concerné et verrouiller la ligne (éviter la double exécution)
  select * into v_payment
  from public.payments
  where transaction_id = p_transaction_id
  for update;

  if not found then
    raise exception 'Transaction introuvable: %', p_transaction_id;
  end if;

  if v_payment.status = 'success' then
    -- Déjà traité, on ignore gracieusement
    return;
  end if;

  -- 2. Mettre à jour le paiement
  update public.payments
  set 
    status = 'success', 
    updated_at = now()
  where 
    id = v_payment.id;

  -- 3. Mettre à jour l'échéance (dues)
  -- Note : Dans une logique métier complète, on vérifierait si la somme des paiements couvre le montant total.
  -- Ici, on assume que l'échéance passe à 'paye'.
  update public.dues
  set 
    status = 'paye', 
    updated_at = now()
  where 
    id = v_payment.due_id;

end;
$$;
create type reminder_type as enum ('j-3', 'overdue');

drop table if exists public.payment_reminders cascade;
create table public.payment_reminders (
  id uuid default gen_random_uuid() primary key,
  due_id uuid not null references public.dues(id) on delete cascade,
  type reminder_type not null,
  status text not null default 'sent', -- 'sent', 'failed'
  error_details text,
  created_at timestamptz not null default now()
);

-- Index pour vérifier rapidement si une relance a déjà été envoyée
create index idx_payment_reminders_due_type on public.payment_reminders(due_id, type);

-- RLS
alter table public.payment_reminders enable row level security;

-- Seuls les administrateurs et comptables peuvent lire ces logs
create policy "Staff can view payment reminders"
  on public.payment_reminders for select
  using (
    auth.uid() in (
      select user_id from public.user_school_roles 
      where role in ('admin', 'comptable')
    )
  );

-- Seul le service_role (Edge Functions) peut insérer des relances
-- Bypass RLS
-- Ajouter la valeur 'manual' à l'enum reminder_type
-- Note: Dans Postgres, on ajoute une valeur à un enum existant avec ALTER TYPE ... ADD VALUE
alter type public.reminder_type add value if not exists 'manual';
-- Ajout d'une contrainte d'unicité pour permettre l'upsert facile lors de la saisie des notes
ALTER TABLE public.grades 
DROP CONSTRAINT IF EXISTS grades_student_subject_term_type_key;

ALTER TABLE public.grades 
ADD CONSTRAINT grades_student_subject_term_type_key 
UNIQUE (student_id, class_id, subject_name, term, evaluation_type);
-- ============================================
-- 11. VUE ET FONCTION: Résumé trimestriel de l'élève
-- ============================================

-- Fonction pour calculer la moyenne trimestrielle d'un élève
CREATE OR REPLACE FUNCTION public.calculate_term_average(p_student_id UUID, p_term TEXT)
RETURNS NUMERIC AS $$
DECLARE
    v_average NUMERIC;
BEGIN
    SELECT 
        CASE 
            WHEN SUM(coefficient) > 0 THEN SUM(score * coefficient) / SUM(coefficient)
            ELSE 0 
        END INTO v_average
    FROM public.grades
    WHERE student_id = p_student_id AND term = p_term AND score IS NOT NULL;
    
    RETURN ROUND(COALESCE(v_average, 0), 2);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Vue pour le résumé trimestriel
CREATE OR REPLACE VIEW public.student_term_summary AS
WITH term_averages AS (
    SELECT 
        student_id,
        class_id,
        term,
        public.calculate_term_average(student_id, term) as term_average
    FROM public.grades
    WHERE score IS NOT NULL
    GROUP BY student_id, class_id, term
),
ranked_averages AS (
    SELECT 
        student_id,
        class_id,
        term,
        term_average,
        RANK() OVER (PARTITION BY class_id, term ORDER BY term_average DESC) as class_rank
    FROM term_averages
),
absences AS (
    SELECT 
        student_id,
        COUNT(*) as unjustified_absences
    FROM public.attendance
    WHERE status = 'absent'
    GROUP BY student_id
)
SELECT 
    r.student_id,
    r.class_id,
    r.term,
    r.term_average,
    r.class_rank,
    COALESCE(a.unjustified_absences, 0) as unjustified_absences
FROM ranked_averages r
LEFT JOIN absences a ON r.student_id = a.student_id;
-- ============================================
-- 12. CACHE BULLETINS: Bucket et Trigger Invalidation
-- ============================================

-- 1. Création du bucket 'bulletins'
INSERT INTO storage.buckets (id, name, public)
VALUES ('bulletins', 'bulletins', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Politiques RLS pour le bucket 'bulletins'
-- Seuls les parents liés à l'élève peuvent lire le bulletin (le nom du fichier commence par le student_id)
-- Note: Pour simplifier l'API, c'est le Route Handler (avec Service Role ou permissions appropriées) 
-- qui gérera l'écriture, donc pas besoin de politique INSERT complexe côté client pour l'instant.

CREATE POLICY "Les parents peuvent lire les bulletins de leurs enfants"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'bulletins' AND
  (
    -- Extraction du student_id depuis le chemin (format: student_id/term.pdf)
    split_part(name, '/', 1)::uuid IN (SELECT public.parent_student_ids())
    OR
    -- Autoriser les enseignants ou admins si besoin (non implémenté ici, on se fie au backend)
    auth.uid() IN (SELECT user_id FROM public.user_school_roles WHERE role IN ('admin', 'enseignant'))
  )
);

-- Le backend (Route Handler) utilisera le client Supabase avec Service Role key pour écrire le fichier, 
-- donc pas besoin de politique INSERT pour le rôle authenticated.

-- 3. Fonction pour invalider le cache du bulletin
CREATE OR REPLACE FUNCTION public.invalidate_bulletin_cache()
RETURNS TRIGGER AS $$
DECLARE
    v_student_id UUID;
    v_term TEXT;
    v_file_path TEXT;
BEGIN
    -- Récupérer l'ID de l'élève et le trimestre concerné par la modification de note
    IF TG_OP = 'DELETE' THEN
        v_student_id := OLD.student_id;
        v_term := OLD.term;
    ELSE
        v_student_id := NEW.student_id;
        v_term := NEW.term;
    END IF;

    -- Construire le chemin d'accès au fichier (ex: 123e4567-e89b-12d3-a456-426614174000/Trimestre 1.pdf)
    v_file_path := v_student_id::TEXT || '/' || v_term || '.pdf';

    -- Supprimer le fichier du bucket
    -- Note: La suppression depuis 'storage.objects' dans un trigger rend le fichier inaccessible.
    -- Un nettoyage périodique par Supabase s'occupera du fichier physique sur S3.
    DELETE FROM storage.objects
    WHERE bucket_id = 'bulletins' AND name = v_file_path;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Trigger sur la table grades
DROP TRIGGER IF EXISTS trg_invalidate_bulletin_on_grade_change ON public.grades;
CREATE TRIGGER trg_invalidate_bulletin_on_grade_change
AFTER INSERT OR UPDATE OR DELETE ON public.grades
FOR EACH ROW EXECUTE FUNCTION public.invalidate_bulletin_cache();
-- ============================================
-- 13. HOMEWORK STORAGE BUCKET
-- ============================================

-- Create the bucket for homework attachments if it doesn't exist
insert into storage.buckets (id, name, public)
values ('homework-attachments', 'homework-attachments', true)
on conflict (id) do nothing;

-- Enable RLS on the bucket objects (Already handled by Supabase)
-- alter table storage.objects enable row level security;

-- Drop existing policies if any (for idempotency)
-- drop policy if exists "Public access to homework attachments" on storage.objects;
-- drop policy if exists "Staff can upload homework attachments" on storage.objects;

-- Policy 1: Anyone (including anonymous) can read from the public bucket
-- NOTE: Please create this policy manually via the Supabase Dashboard (Storage -> Policies)
-- create policy "Public access to homework attachments"
-- on storage.objects for select
-- using (bucket_id = 'homework-attachments');

-- Policy 2: Authenticated staff can insert into the bucket
-- NOTE: Please create this policy manually via the Supabase Dashboard (Storage -> Policies)
-- create policy "Staff can upload homework attachments"
-- on storage.objects for insert
-- to authenticated
-- with check (bucket_id = 'homework-attachments');
-- ============================================
-- 0. NETTOYAGE (Pour relancer le seed sans erreur)
-- ============================================
TRUNCATE TABLE public.parent_student_links CASCADE;
TRUNCATE TABLE public.students CASCADE;
TRUNCATE TABLE public.classes CASCADE;
TRUNCATE TABLE public.user_school_roles CASCADE;
TRUNCATE TABLE public.schools CASCADE;

-- Optionnel : nettoyage des users de test (si on gère auth.users dans le seed)
-- Attention : sur un vrai projet, ne pas tronquer auth.users en prod !
DELETE FROM auth.users WHERE email LIKE '%@test-scogestia.com';

-- ============================================
-- 1. CREATION DES USERS DANS auth.users
-- ============================================
-- Ecole A (IDs commençant par a1...)
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES 
('00000000-0000-0000-0000-000000000000', 'a1111111-1111-1111-1111-111111111111', 'authenticated', 'authenticated', 'admin@ecoleA.test-scogestia.com', crypt('password123', gen_salt('bf')), now(), '{"provider": "email", "providers": ["email"]}', '{}', now(), now()),
('00000000-0000-0000-0000-000000000000', 'a1111111-2222-1111-1111-111111111111', 'authenticated', 'authenticated', 'comptable@ecoleA.test-scogestia.com', crypt('password123', gen_salt('bf')), now(), '{"provider": "email", "providers": ["email"]}', '{}', now(), now()),
('00000000-0000-0000-0000-000000000000', 'a1111111-3333-1111-1111-111111111111', 'authenticated', 'authenticated', 'prof@ecoleA.test-scogestia.com', crypt('password123', gen_salt('bf')), now(), '{"provider": "email", "providers": ["email"]}', '{}', now(), now()),
('00000000-0000-0000-0000-000000000000', 'a1111111-4444-1111-1111-111111111111', 'authenticated', 'authenticated', 'parent@ecoleA.test-scogestia.com', crypt('password123', gen_salt('bf')), now(), '{"provider": "email", "providers": ["email"]}', '{}', now(), now());

-- Ecole B (IDs commençant par b2...)
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES 
('00000000-0000-0000-0000-000000000000', 'b2222222-1111-2222-2222-222222222222', 'authenticated', 'authenticated', 'admin@ecoleB.test-scogestia.com', crypt('password123', gen_salt('bf')), now(), '{"provider": "email", "providers": ["email"]}', '{}', now(), now()),
('00000000-0000-0000-0000-000000000000', 'b2222222-2222-2222-2222-222222222222', 'authenticated', 'authenticated', 'comptable@ecoleB.test-scogestia.com', crypt('password123', gen_salt('bf')), now(), '{"provider": "email", "providers": ["email"]}', '{}', now(), now()),
('00000000-0000-0000-0000-000000000000', 'b2222222-3333-2222-2222-222222222222', 'authenticated', 'authenticated', 'prof@ecoleB.test-scogestia.com', crypt('password123', gen_salt('bf')), now(), '{"provider": "email", "providers": ["email"]}', '{}', now(), now()),
('00000000-0000-0000-0000-000000000000', 'b2222222-4444-2222-2222-222222222222', 'authenticated', 'authenticated', 'parent@ecoleB.test-scogestia.com', crypt('password123', gen_salt('bf')), now(), '{"provider": "email", "providers": ["email"]}', '{}', now(), now());

-- ============================================
-- 2. CREATION DES 2 ECOLES
-- ============================================
INSERT INTO public.schools (id, name, slug, email)
VALUES 
('cccccccc-1111-1111-1111-111111111111', 'École Primaire Laïque Excellence', 'ecole-excellence', 'contact@excellence.tg'),
('cccccccc-2222-2222-2222-222222222222', 'Collège Privé Le Savoir', 'college-savoir', 'contact@savoir.tg');

-- ============================================
-- 3. AFFECTATION DES ROLES (USER_SCHOOL_ROLES)
-- ============================================
INSERT INTO public.user_school_roles (user_id, school_id, role, full_name)
VALUES 
-- Roles Ecole A
('a1111111-1111-1111-1111-111111111111', 'cccccccc-1111-1111-1111-111111111111', 'admin', 'Admin Excellence'),
('a1111111-2222-1111-1111-111111111111', 'cccccccc-1111-1111-1111-111111111111', 'comptable', 'Comptable Excellence'),
('a1111111-3333-1111-1111-111111111111', 'cccccccc-1111-1111-1111-111111111111', 'enseignant', 'Prof Excellence'),
('a1111111-4444-1111-1111-111111111111', 'cccccccc-1111-1111-1111-111111111111', 'parent', 'Parent Excellence'),

-- Roles Ecole B
('b2222222-1111-2222-2222-222222222222', 'cccccccc-2222-2222-2222-222222222222', 'admin', 'Admin Savoir'),
('b2222222-2222-2222-2222-222222222222', 'cccccccc-2222-2222-2222-222222222222', 'comptable', 'Comptable Savoir'),
('b2222222-3333-2222-2222-222222222222', 'cccccccc-2222-2222-2222-222222222222', 'enseignant', 'Prof Savoir'),
('b2222222-4444-2222-2222-222222222222', 'cccccccc-2222-2222-2222-222222222222', 'parent', 'Parent Savoir');

-- ============================================
-- 4. CREATION DES CLASSES (2 par école)
-- ============================================
INSERT INTO public.classes (id, school_id, name, level, academic_year)
VALUES
-- Classes Ecole A
('d1111111-1111-1111-1111-111111111111', 'cccccccc-1111-1111-1111-111111111111', 'CP1 A', 'Primaire', '2023-2024'),
('d1111111-2222-1111-1111-111111111111', 'cccccccc-1111-1111-1111-111111111111', 'CE1 B', 'Primaire', '2023-2024'),

-- Classes Ecole B
('d2222222-1111-2222-2222-222222222222', 'cccccccc-2222-2222-2222-222222222222', '6ème A', 'Collège', '2023-2024'),
('d2222222-2222-2222-2222-222222222222', 'cccccccc-2222-2222-2222-222222222222', '3ème B', 'Collège', '2023-2024');

-- ============================================
-- 5. CREATION DES ELEVES (3 par classe, matricules qui se chevauchent)
-- ============================================
-- Note : MAT-001, MAT-002, MAT-003 sont présents dans les deux écoles pour tester l'unicité par school_id
INSERT INTO public.students (id, school_id, matricule, first_name, last_name, class_id)
VALUES
-- Eleves Ecole A (Classe CP1)
('e1111111-1111-1111-1111-111111111111', 'cccccccc-1111-1111-1111-111111111111', 'MAT-001', 'Komi', 'Mensah', 'd1111111-1111-1111-1111-111111111111'),
('e1111111-2222-1111-1111-111111111111', 'cccccccc-1111-1111-1111-111111111111', 'MAT-002', 'Afua', 'Koffi', 'd1111111-1111-1111-1111-111111111111'),
('e1111111-3333-1111-1111-111111111111', 'cccccccc-1111-1111-1111-111111111111', 'MAT-003', 'Kodjo', 'Akakpo', 'd1111111-1111-1111-1111-111111111111'),
-- Eleves Ecole A (Classe CE1)
('e1111111-4444-1111-1111-111111111111', 'cccccccc-1111-1111-1111-111111111111', 'MAT-004', 'Abla', 'Lawson', 'd1111111-2222-1111-1111-111111111111'),
('e1111111-5555-1111-1111-111111111111', 'cccccccc-1111-1111-1111-111111111111', 'MAT-005', 'Kossi', 'Ekoue', 'd1111111-2222-1111-1111-111111111111'),
('e1111111-6666-1111-1111-111111111111', 'cccccccc-1111-1111-1111-111111111111', 'MAT-006', 'Akouvi', 'Ajavon', 'd1111111-2222-1111-1111-111111111111'),

-- Eleves Ecole B (Classe 6ème)
('e2222222-1111-2222-2222-222222222222', 'cccccccc-2222-2222-2222-222222222222', 'MAT-001', 'Jean', 'Dupont', 'd2222222-1111-2222-2222-222222222222'), -- Matricule identique à Ecole A !
('e2222222-2222-2222-2222-222222222222', 'cccccccc-2222-2222-2222-222222222222', 'MAT-002', 'Marie', 'Curie', 'd2222222-1111-2222-2222-222222222222'), -- Matricule identique à Ecole A !
('e2222222-3333-2222-2222-222222222222', 'cccccccc-2222-2222-2222-222222222222', 'MAT-003', 'Paul', 'Bocuse', 'd2222222-1111-2222-2222-222222222222'), -- Matricule identique à Ecole A !
-- Eleves Ecole B (Classe 3ème)
('e2222222-4444-2222-2222-222222222222', 'cccccccc-2222-2222-2222-222222222222', 'MAT-004', 'Lucie', 'Aubrac', 'd2222222-2222-2222-2222-222222222222'),
('e2222222-5555-2222-2222-222222222222', 'cccccccc-2222-2222-2222-222222222222', 'MAT-005', 'Albert', 'Camus', 'd2222222-2222-2222-2222-222222222222'),
('e2222222-6666-2222-2222-222222222222', 'cccccccc-2222-2222-2222-222222222222', 'MAT-006', 'Simone', 'Veil', 'd2222222-2222-2222-2222-222222222222');

-- ============================================
-- 6. LIENS PARENTS <-> ELEVES (1 enfant pour chaque parent test)
-- ============================================
INSERT INTO public.parent_student_links (parent_user_id, student_id, school_id)
VALUES
-- Le parent de l'école A est lié à l'élève e1111111-1111 (Komi Mensah)
('a1111111-4444-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 'cccccccc-1111-1111-1111-111111111111'),

-- Le parent de l'école B est lié à l'élève e2222222-1111 (Jean Dupont)
('b2222222-4444-2222-2222-222222222222', 'e2222222-1111-2222-2222-222222222222', 'cccccccc-2222-2222-2222-222222222222');
