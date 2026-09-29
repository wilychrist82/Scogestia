-- Table staff_invitation_codes
create table public.staff_invitation_codes (
  id uuid default gen_random_uuid() primary key,
  school_id uuid not null references public.schools(id) on delete cascade,
  role text not null,
  full_name text not null,
  email text,
  phone text,
  code text not null,
  expires_at timestamptz not null default (now() + interval '7 days'),
  used_at timestamptz,
  created_at timestamptz default now() not null,
  created_by uuid references auth.users(id) on delete set null
);

-- Index pour la recherche rapide du code
create index idx_staff_invitations_code on public.staff_invitation_codes(code);
-- Index pour le nettoyage et l'affichage par école
create index idx_staff_invitations_school on public.staff_invitation_codes(school_id);

-- Unicité du code pour éviter les collisions globales
alter table public.staff_invitation_codes add constraint staff_invitations_code_key unique(code);

-- RLS
alter table public.staff_invitation_codes enable row level security;

-- L'utilisateur (admin) peut voir les invitations de son école
create policy "Admin can view staff invitations of their school"
  on public.staff_invitation_codes for select
  using (
    school_id in (
      select school_id from public.user_school_roles 
      where user_id = auth.uid() and role = 'admin'
    )
  );

-- L'utilisateur (admin) peut créer des invitations pour son école
create policy "Admin can insert staff invitations for their school"
  on public.staff_invitation_codes for insert
  with check (
    school_id in (
      select school_id from public.user_school_roles 
      where user_id = auth.uid() and role = 'admin'
    )
  );

-- Un visiteur non authentifié peut lire une invitation par son code s'il n'est pas expiré ni utilisé
create policy "Anyone can read a valid staff invitation by code"
  on public.staff_invitation_codes for select
  using (
    used_at is null 
    and expires_at > now()
  );

-- Mise à jour (pour marquer comme utilisé)
create policy "Anyone can mark staff invitation as used"
  on public.staff_invitation_codes for update
  using (
    used_at is null 
    and expires_at > now()
  )
  with check (
    used_at is not null
  );

-- Fonction sécurisée pour la consommation
create or replace function consume_staff_invitation(invitation_code text, staff_user_id uuid)
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
  from staff_invitation_codes
  where code = invitation_code
    and used_at is null
    and expires_at > now()
  for update;

  if not found then
    raise exception 'Code invalide, expiré ou déjà utilisé.';
  end if;

  -- Marquer comme utilisé
  update staff_invitation_codes
  set used_at = now()
  where id = v_invitation.id;

  -- S'assurer que le staff a le rôle dans user_school_roles pour cette école
  insert into user_school_roles (user_id, school_id, role, full_name, phone, is_active)
  values (
    staff_user_id, 
    v_invitation.school_id, 
    v_invitation.role, 
    v_invitation.full_name, 
    v_invitation.phone,
    true
  )
  on conflict (user_id, school_id) do update 
  set role = v_invitation.role,
      full_name = v_invitation.full_name,
      phone = v_invitation.phone,
      is_active = true;
end;
$$;
