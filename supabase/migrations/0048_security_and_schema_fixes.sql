-- Migration 0048 : Correctifs de sécurité RLS, rôles étendus, RPC invitations et compatibilité bulletins primaire

-- 1. Étendre l'enum user_role pour éviter tout crash SQL sur les rôles administratifs complémentaires
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'secretaire';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'conseiller';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'directeur';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'censeur';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'surveillant';

-- 2. Autoriser le cycle 'maternelle' dans la table subjects en plus de 'primaire' et 'secondaire'
ALTER TABLE public.subjects DROP CONSTRAINT IF EXISTS subjects_cycle_check;
ALTER TABLE public.subjects ADD CONSTRAINT subjects_cycle_check
  CHECK (cycle IN ('maternelle', 'primaire', 'secondaire'));

-- 3. Ajouter les colonnes optionnelles school_id et academic_year sur primary_bulletin_info
ALTER TABLE public.primary_bulletin_info
  ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS academic_year TEXT;

-- 4. Renforcer l'isolation multi-tenant (RLS) sur primary_monthly_ranks et primary_bulletin_info
DROP POLICY IF EXISTS "Allow all authenticated users to read primary_monthly_ranks" ON public.primary_monthly_ranks;
DROP POLICY IF EXISTS "Allow teachers and admins to insert/update primary_monthly_ranks" ON public.primary_monthly_ranks;
DROP POLICY IF EXISTS "School members and linked parents can read primary_monthly_ranks" ON public.primary_monthly_ranks;
DROP POLICY IF EXISTS "School teachers and admins can manage primary_monthly_ranks" ON public.primary_monthly_ranks;

CREATE POLICY "School members and linked parents can read primary_monthly_ranks"
ON public.primary_monthly_ranks FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = primary_monthly_ranks.student_id
      AND (
        s.school_id IN (SELECT school_id FROM public.user_school_roles WHERE user_id = auth.uid())
        OR s.id IN (SELECT student_id FROM public.parent_student_links WHERE parent_user_id = auth.uid())
      )
  )
);

CREATE POLICY "School teachers and admins can manage primary_monthly_ranks"
ON public.primary_monthly_ranks FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.students s
    JOIN public.user_school_roles usr ON usr.school_id = s.school_id
    WHERE s.id = primary_monthly_ranks.student_id
      AND usr.user_id = auth.uid()
      AND usr.role::text IN ('admin', 'enseignant', 'super_admin', 'directeur', 'censeur')
  )
);

DROP POLICY IF EXISTS "Allow all authenticated users to read primary_bulletin_info" ON public.primary_bulletin_info;
DROP POLICY IF EXISTS "Allow teachers and admins to insert/update primary_bulletin_info" ON public.primary_bulletin_info;
DROP POLICY IF EXISTS "School members and linked parents can read primary_bulletin_info" ON public.primary_bulletin_info;
DROP POLICY IF EXISTS "School teachers and admins can manage primary_bulletin_info" ON public.primary_bulletin_info;

CREATE POLICY "School members and linked parents can read primary_bulletin_info"
ON public.primary_bulletin_info FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = primary_bulletin_info.student_id
      AND (
        s.school_id IN (SELECT school_id FROM public.user_school_roles WHERE user_id = auth.uid())
        OR s.id IN (SELECT student_id FROM public.parent_student_links WHERE parent_user_id = auth.uid())
      )
  )
);

CREATE POLICY "School teachers and admins can manage primary_bulletin_info"
ON public.primary_bulletin_info FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.students s
    JOIN public.user_school_roles usr ON usr.school_id = s.school_id
    WHERE s.id = primary_bulletin_info.student_id
      AND usr.user_id = auth.uid()
      AND usr.role::text IN ('admin', 'enseignant', 'super_admin', 'directeur', 'censeur')
  )
);

-- 5. Corriger la fonction RPC consume_staff_invitation (contrainte unique user_id, school_id, role + cast user_role)
CREATE OR REPLACE FUNCTION public.consume_staff_invitation(
  invitation_code text,
  staff_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invitation record;
BEGIN
  SELECT * INTO v_invitation
  FROM public.staff_invitation_codes
  WHERE code = upper(invitation_code)
    AND used_at IS NULL
    AND expires_at > now()
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Code d''invitation invalide ou expiré';
  END IF;

  INSERT INTO public.user_school_roles (user_id, school_id, role, full_name, phone, is_active)
  VALUES (
    staff_user_id,
    v_invitation.school_id,
    v_invitation.role::public.user_role,
    COALESCE(v_invitation.full_name, 'Membre du personnel'),
    v_invitation.phone,
    true
  )
  ON CONFLICT (user_id, school_id, role) DO UPDATE
  SET full_name = EXCLUDED.full_name,
      phone = COALESCE(EXCLUDED.phone, public.user_school_roles.phone),
      is_active = true;

  UPDATE public.staff_invitation_codes
  SET used_at = now()
  WHERE id = v_invitation.id;
END;
$$;

-- 6. Corriger la fonction RPC consume_parent_invitation (ajout de school_id obligatoire dans parent_student_links)
CREATE OR REPLACE FUNCTION public.consume_parent_invitation(
  invitation_code text,
  parent_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invitation record;
BEGIN
  SELECT * INTO v_invitation
  FROM public.parent_invitation_codes
  WHERE code = upper(invitation_code)
    AND used_at IS NULL
    AND expires_at > now()
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Code d''invitation invalide ou expiré';
  END IF;

  INSERT INTO public.parent_student_links (parent_user_id, student_id, school_id, relationship)
  VALUES (parent_user_id, v_invitation.student_id, v_invitation.school_id, 'parent')
  ON CONFLICT (parent_user_id, student_id) DO NOTHING;

  INSERT INTO public.user_school_roles (user_id, school_id, role, full_name, is_active)
  VALUES (parent_user_id, v_invitation.school_id, 'parent'::public.user_role, 'Parent', true)
  ON CONFLICT (user_id, school_id, role) DO NOTHING;

  UPDATE public.parent_invitation_codes
  SET used_at = now()
  WHERE id = v_invitation.id;
END;
$$;

