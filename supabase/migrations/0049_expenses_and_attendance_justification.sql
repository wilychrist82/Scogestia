-- =============================================================================
-- Migration 0049 : Justification d'absence parent & Module Dépenses / Décaissements
-- =============================================================================

-- 1. Colonne justification sur la table attendance
ALTER TABLE public.attendance
  ADD COLUMN IF NOT EXISTS justification text;

-- 2. Table school_expenses (Dépenses & Décaissements de l'établissement)
CREATE TABLE IF NOT EXISTS public.school_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  category text NOT NULL DEFAULT 'Fonctionnement',
  label text NOT NULL,
  amount numeric(12, 2) NOT NULL CHECK (amount > 0),
  payment_method text NOT NULL DEFAULT 'especes',
  beneficiary text,
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  recorded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_school_expenses_school_date
  ON public.school_expenses(school_id, expense_date DESC);

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

