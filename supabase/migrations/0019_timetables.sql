-- ============================================
-- 19. TIMETABLES (Emplois du temps)
-- ============================================

create table public.timetables (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  teacher_id uuid not null references auth.users(id),
  subject_name text not null,
  day_of_week integer not null check (day_of_week >= 1 and day_of_week <= 7), -- 1 = Lundi, 7 = Dimanche
  start_time time not null,
  end_time time not null,
  room_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Index pour optimiser les requêtes
create index idx_timetables_school on public.timetables(school_id);
create index idx_timetables_class on public.timetables(class_id);
create index idx_timetables_teacher on public.timetables(teacher_id);
create index idx_timetables_day on public.timetables(day_of_week);

-- RLS
alter table public.timetables enable row level security;

create policy "timetables_read"
  on public.timetables for select
  using (
    exists (
      select 1 from public.user_school_roles usr
      where usr.school_id = timetables.school_id
      and usr.user_id = auth.uid()
    )
  );

create policy "timetables_admin_write"
  on public.timetables for all
  using (
    exists (
      select 1 from public.user_school_roles usr
      where usr.school_id = timetables.school_id
      and usr.user_id = auth.uid()
      and usr.role in ('admin', 'super_admin')
    )
  );
