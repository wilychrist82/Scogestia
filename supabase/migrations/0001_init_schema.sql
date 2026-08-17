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
