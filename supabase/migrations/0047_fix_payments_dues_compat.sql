-- Migration 0047 : Rétablissement de la compatibilité public.dues et nettoyage des triggers obsolètes
-- Résout l'erreur: relation "public.dues" does not exist lors de l'encaissement d'un paiement

-- 1. Nettoyer tout trigger ou fonction obsolète sur public.payments qui ferait référence à l'ancienne table dues
DO $$ 
DECLARE 
    trg RECORD;
BEGIN
    FOR trg IN 
        SELECT trigger_name 
        FROM information_schema.triggers 
        WHERE event_object_table = 'payments' 
          AND trigger_name IN (
            'on_payment_insert', 
            'trg_payment_dues', 
            'update_due_on_payment', 
            'on_payment_update_due',
            'update_dues_status_trigger'
          )
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || quote_ident(trg.trigger_name) || ' ON public.payments CASCADE;';
    END LOOP;
END $$;

-- 2. Création de la VUE de compatibilité public.dues pointant vers public.payment_schedules
CREATE OR REPLACE VIEW public.dues AS 
SELECT 
  id,
  school_id,
  student_id,
  label,
  amount_due AS amount,
  amount_due,
  due_date,
  status,
  created_at,
  created_at AS updated_at
FROM public.payment_schedules;

-- 3. Règle pour permettre les mises à jour transparentes via la vue public.dues
CREATE OR REPLACE RULE dues_update AS ON UPDATE TO public.dues
DO INSTEAD
  UPDATE public.payment_schedules 
  SET 
    status = NEW.status
  WHERE id = NEW.id;

-- 4. Attribution des droits d'accès sur la vue pour tous les rôles
GRANT ALL ON public.dues TO authenticated, anon, service_role;
