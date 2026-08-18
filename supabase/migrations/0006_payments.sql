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
