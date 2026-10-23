-- Migration 0047 : Rétablissement de la compatibilité public.dues, colonne due_id et nettoyage RLS
-- Résout: relation "public.dues" does not exist ET column p.due_id does not exist

-- 1. Ajouter la colonne due_id sur payments pour rétrocompatibilité
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS due_id uuid REFERENCES public.payment_schedules(id) ON DELETE CASCADE;

UPDATE public.payments SET due_id = schedule_id WHERE due_id IS NULL AND schedule_id IS NOT NULL;

-- 2. Nettoyer les anciennes politiques RLS obsolètes qui référençaient l'ancienne colonne due_id
DROP POLICY IF EXISTS "Parents can insert payments for their children" ON public.payments;
DROP POLICY IF EXISTS "Parents can view payments for their children" ON public.payments;
DROP POLICY IF EXISTS "Staff can view payments of their school" ON public.payments;
DROP POLICY IF EXISTS "Comptable and admin can insert payments" ON public.payments;

-- 3. Recréer les politiques RLS propres basées sur school_id et student_id
CREATE POLICY "Staff can view payments of their school"
  ON public.payments FOR SELECT
  USING (
    school_id IN (
      SELECT school_id FROM public.user_school_roles 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Comptable and admin can insert payments"
  ON public.payments FOR INSERT
  WITH CHECK (
    school_id IN (
      SELECT school_id FROM public.user_school_roles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'comptable')
    )
  );

CREATE POLICY "Parents can view payments for their children"
  ON public.payments FOR SELECT
  USING (
    student_id IN (
      SELECT psl.student_id FROM public.parent_student_links psl
      WHERE psl.parent_user_id = auth.uid()
    )
  );

-- 4. Nettoyer les triggers obsolètes sur public.payments
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

-- 5. Création de la VUE de compatibilité public.dues pointant vers public.payment_schedules
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

-- 6. Règle pour permettre les mises à jour transparentes via la vue public.dues
CREATE OR REPLACE RULE dues_update AS ON UPDATE TO public.dues
DO INSTEAD
  UPDATE public.payment_schedules 
  SET 
    status = NEW.status
  WHERE id = NEW.id;

-- 7. Attribution des droits d'accès
GRANT ALL ON TABLE public.payments TO authenticated, anon, service_role;
GRANT ALL ON public.dues TO authenticated, anon, service_role;
