create type payment_status as enum ('en_attente', 'paye', 'en_retard', 'partiel');

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
