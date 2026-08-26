-- ============================================
-- 27. SYSTEME DE NOTIFICATIONS
-- ============================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL, -- ex: 'finance', 'academique', 'rappel', 'systeme'
  is_read boolean DEFAULT false,
  action_url text, -- Lien optionnel pour rediriger l'utilisateur au clic
  created_at timestamptz DEFAULT now()
);

-- Index pour accélérer les requêtes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_is_read ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_school_id ON public.notifications(school_id);

-- Activer RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Politique : Un utilisateur peut voir uniquement ses propres notifications
CREATE POLICY "Lecture des notifications personnelles"
ON public.notifications FOR SELECT
USING (user_id = auth.uid());

-- Politique : Un utilisateur peut modifier uniquement ses propres notifications (ex: pour marquer comme lu)
CREATE POLICY "Modification des notifications personnelles"
ON public.notifications FOR UPDATE
USING (user_id = auth.uid());

-- Activer la réplication en temps réel (Supabase Realtime) sur la table
-- On doit configurer REPLICA IDENTITY pour que realtime reçoive les infos
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- Ajouter la table à la publication existante de Supabase pour le temps réel
BEGIN;
  -- supabase_realtime n'existe peut-être pas sur toutes les instances, donc on capture l'erreur
  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1 
      FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'notifications'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    END IF;
  EXCEPTION
    WHEN undefined_object THEN
      -- Create publication if it doesn't exist (local dev)
      CREATE PUBLICATION supabase_realtime FOR TABLE public.notifications;
  END
  $$;
COMMIT;
