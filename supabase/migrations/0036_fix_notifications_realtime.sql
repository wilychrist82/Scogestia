-- ============================================================
-- CORRECTIF REALTIME : Notifications
-- Problème : REPLICA IDENTITY FULL manquant → les filtres
-- user_id=eq.X de Supabase Realtime ne fonctionnent pas.
-- Solution : activer REPLICA IDENTITY FULL sur la table.
-- ============================================================

-- S'assurer que REPLICA IDENTITY FULL est activé
-- (requis pour les filtres user_id dans Supabase Realtime)
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- S'assurer que la table est bien dans la publication Realtime
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END
$$;
