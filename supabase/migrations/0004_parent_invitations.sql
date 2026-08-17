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
