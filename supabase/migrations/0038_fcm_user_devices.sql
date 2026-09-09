-- Create the user_devices table to store FCM tokens
create table public.user_devices (
  user_id uuid primary key references auth.users(id) on delete cascade,
  fcm_token text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS policies
alter table public.user_devices enable row level security;

-- Users can read their own devices
create policy "Users can view their own devices"
  on public.user_devices for select
  using (auth.uid() = user_id);

-- Users can insert/update their own devices
create policy "Users can manage their own devices"
  on public.user_devices for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Admins can read all devices (optional but useful for triggers/backend if not bypassing RLS)
create policy "Admins can view all devices"
  on public.user_devices for select
  using (
    exists (
      select 1 from public.user_school_roles 
      where user_school_roles.user_id = auth.uid() 
      and role in ('admin', 'super_admin')
    )
  );

-- Function to update updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at
  before update on public.user_devices
  for each row
  execute procedure public.handle_updated_at();
