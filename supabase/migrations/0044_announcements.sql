-- ============================================
-- ANNOUNCEMENTS (Annonces école)
-- Distinct des messages directs (communications).
-- Les annonces sont visibles par tous les parents
-- d'une classe ciblée ou de toute l'école.
-- ============================================
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  title text not null,
  content text not null,
  target_type text not null default 'all' check (target_type in ('all', 'class', 'level')),
  target_class_id uuid references public.classes(id) on delete set null,
  target_level text,
  is_published boolean default true,
  published_at timestamptz default now(),
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_announcements_school on public.announcements(school_id);
create index idx_announcements_published on public.announcements(school_id, is_published, published_at desc);

-- RLS
alter table public.announcements enable row level security;

-- Lecture : tous les utilisateurs liés à l'école
create policy "announcements_select"
on public.announcements for select
using (school_id in (select public.user_school_ids()));

-- Insertion : admin uniquement
create policy "announcements_insert"
on public.announcements for insert
with check (public.has_role_in_school(school_id, array['admin'::user_role]));

-- Modification : admin uniquement
create policy "announcements_update"
on public.announcements for update
using (public.has_role_in_school(school_id, array['admin'::user_role]));

-- Suppression : admin uniquement
create policy "announcements_delete"
on public.announcements for delete
using (public.has_role_in_school(school_id, array['admin'::user_role]));
