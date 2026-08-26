-- ============================================
-- 26. SUPER ADMIN SPACE (SaaS Owner)
-- ============================================

-- Table pour stocker les Super Admins globaux (propriétaires du SaaS)
CREATE TABLE IF NOT EXISTS public.super_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY;

-- Seuls les Super Admins peuvent voir cette table
CREATE POLICY "Les super admins voient les super admins"
ON public.super_admins FOR SELECT
USING (auth.uid() IN (SELECT user_id FROM public.super_admins));

-- Fonction globale pour vérifier si l'utilisateur courant est un Super Admin du SaaS
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.super_admins WHERE user_id = auth.uid()
  );
$$;

-- Mise à jour des politiques RLS sur `schools` pour permettre aux Super Admins globaux 
-- de tout lire et de tout modifier, sans avoir besoin d'être dans `user_school_roles`.
DROP POLICY IF EXISTS "Lecture des écoles permise aux utilisateurs liés" ON public.schools;
CREATE POLICY "Lecture des écoles permise aux utilisateurs liés ou Super Admins"
ON public.schools FOR SELECT
USING (
  public.is_super_admin() 
  OR id IN (SELECT public.user_school_ids())
);

DROP POLICY IF EXISTS "Modification des écoles permise aux admins" ON public.schools;
CREATE POLICY "Modification des écoles permise aux admins ou Super Admins"
ON public.schools FOR UPDATE
USING (
  public.is_super_admin() 
  OR public.has_role_in_school(id, array['super_admin'::user_role, 'admin'::user_role])
);

-- Insertion du premier Super Admin si existant, via un script SQL manuel ou en se basant sur une adresse e-mail.
-- Le propriétaire de l'application devra exécuter manuellement une requête pour s'ajouter :
-- INSERT INTO public.super_admins (user_id) VALUES ('ton-uuid-supabase');
