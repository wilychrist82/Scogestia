-- Fix ambiguous column reference in consume_parent_invitation and add full_name
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
  values ($2, v_invitation.student_id, 'parent')
  on conflict (parent_user_id, student_id) do nothing;
  
  -- S'assurer que le parent a le rôle 'parent' dans user_school_roles pour cette école
  insert into user_school_roles (user_id, school_id, role, full_name)
  values ($2, v_invitation.school_id, 'parent', 'Parent')
  on conflict (user_id, school_id, role) do nothing;
end;
$$;
