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
