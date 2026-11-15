-- =============================================================================
-- Migration 0052 : Privilèges service_role sur toutes les tables & Facturation SaaS
-- Corrige l'erreur SQL 42501 ("permission denied for table saas_payments" /
-- "saas_subscriptions" et 9 autres tables côté service_role).
-- =============================================================================

-- 1. S'assurer que le schéma public est accessible aux rôles Supabase standards
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- 2. Accorder tous les privilèges au rôle serveur `service_role` sur les tables
-- existantes, séquences et fonctions (notamment celles créées hors privilèges par défaut)
GRANT ALL ON TABLE public.saas_payments TO service_role;
GRANT ALL ON TABLE public.saas_subscriptions TO service_role;
GRANT ALL ON TABLE public.academic_years TO service_role;
GRANT ALL ON TABLE public.primary_bulletin_info TO service_role;
GRANT ALL ON TABLE public.primary_grades TO service_role;
GRANT ALL ON TABLE public.primary_monthly_ranks TO service_role;
GRANT ALL ON TABLE public.secondary_grades TO service_role;
GRANT ALL ON TABLE public.staff_invitation_codes TO service_role;
GRANT ALL ON TABLE public.subjects TO service_role;
GRANT ALL ON TABLE public.super_admins TO service_role;
GRANT ALL ON TABLE public.timetable_slots TO service_role;

GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO service_role;

-- 3. Permettre aux utilisateurs authentifiés autorisés de consulter l'historique SaaS via RLS
GRANT SELECT ON TABLE public.saas_subscriptions TO authenticated;
GRANT SELECT ON TABLE public.saas_payments TO authenticated;

ALTER TABLE public.saas_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saas_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view their school's subscription" ON public.saas_subscriptions;
CREATE POLICY "Admins can view their school's subscription"
  ON public.saas_subscriptions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_school_roles usr
      WHERE usr.user_id = auth.uid()
        AND usr.school_id = saas_subscriptions.school_id
        AND usr.role::text IN ('admin', 'comptable', 'directeur', 'super_admin')
    )
  );

DROP POLICY IF EXISTS "Admins can view their school's saas payments" ON public.saas_payments;
CREATE POLICY "Admins can view their school's saas payments"
  ON public.saas_payments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_school_roles usr
      WHERE usr.user_id = auth.uid()
        AND usr.school_id = saas_payments.school_id
        AND usr.role::text IN ('admin', 'comptable', 'directeur', 'super_admin')
    )
  );
