-- Migration de réconciliation Finance (Phase 4)
-- Supression de la table dues redondante et restauration de la table payments avec schedule_id

DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.dues CASCADE;
DROP TYPE IF EXISTS transaction_status CASCADE;

CREATE TABLE public.payments (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  schedule_id uuid references public.payment_schedules(id) on delete cascade,
  amount numeric(12,2) not null,
  payment_method text not null, -- 'espèces', 'chèque', 'virement', etc.
  transaction_reference text,
  receipt_number text unique, -- Reçu de caisse généré
  paid_at timestamptz not null default now(),
  recorded_by uuid references auth.users(id) on delete set null,
  receipt_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_payments_school on public.payments(school_id);
create index idx_payments_student on public.payments(student_id);
create index idx_payments_schedule on public.payments(schedule_id);

alter table public.payments enable row level security;

create policy "Parents can view payments for their children"
  on public.payments for select
  using (
    student_id in (
      select psl.student_id from public.parent_student_links psl
      where psl.parent_user_id = auth.uid()
    )
  );

create policy "Staff can view payments of their school"
  on public.payments for select
  using (
    school_id in (
      select school_id from public.user_school_roles 
      where user_id = auth.uid()
    )
  );

create policy "Comptable and admin can insert payments"
  on public.payments for insert
  with check (
    school_id in (
      select school_id from public.user_school_roles 
      where user_id = auth.uid() and role in ('admin', 'comptable')
    )
  );

-- Table fee_types (Frais scolaires)
CREATE TABLE public.fee_types (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  label text not null,
  amount numeric(12,2) not null,
  periodicity text not null,
  target text not null,
  created_at timestamptz not null default now()
);

alter table public.fee_types enable row level security;

create policy "Staff can view fee types"
  on public.fee_types for select
  using (
    school_id in (
      select school_id from public.user_school_roles 
      where user_id = auth.uid()
    )
  );

create policy "Comptable and admin can manage fee types"
  on public.fee_types for all
  using (
    school_id in (
      select school_id from public.user_school_roles 
      where user_id = auth.uid() and role in ('admin', 'comptable')
    )
  );
