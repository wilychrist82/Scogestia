-- =============================================================================
-- Migration 0051 : Permissions & Droits sur la table school_expenses
-- Résout l'erreur PostgREST: "permission denied for table school_expenses"
-- =============================================================================

-- 1. Attribuer les privilèges SQL à authenticated et service_role
GRANT ALL ON TABLE public.school_expenses TO authenticated, service_role;

-- 2. Sécurité RLS : s'assurer que les rôles autorisés (admin, comptable, super_admin) peuvent insérer et lire
ALTER TABLE public.school_expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lecture depenses meme ecole" ON public.school_expenses;
CREATE POLICY "Lecture depenses meme ecole"
  ON public.school_expenses
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_school_roles usr
      WHERE usr.user_id = auth.uid()
        AND usr.school_id = school_expenses.school_id
        AND usr.role IN ('admin', 'comptable', 'super_admin')
    )
  );

DROP POLICY IF EXISTS "Ecriture depenses admin et comptable" ON public.school_expenses;
CREATE POLICY "Ecriture depenses admin et comptable"
  ON public.school_expenses
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_school_roles usr
      WHERE usr.user_id = auth.uid()
        AND usr.school_id = school_expenses.school_id
        AND usr.role IN ('admin', 'comptable', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_school_roles usr
      WHERE usr.user_id = auth.uid()
        AND usr.school_id = school_expenses.school_id
        AND usr.role IN ('admin', 'comptable', 'super_admin')
    )
  );

