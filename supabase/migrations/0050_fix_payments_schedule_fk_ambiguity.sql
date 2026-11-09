-- Migration 0050 : Résolution de l'ambiguïté de clé étrangère PostgREST (PGRST201) entre payments et payment_schedules
-- La migration 0047 avait ajouté `due_id REFERENCES public.payment_schedules(id)` en plus de `schedule_id REFERENCES public.payment_schedules(id)`.
-- PostgREST refusait alors les jointures implicites `payments(...)` et `schedule:payment_schedules(...)`.

-- 1. Supprimer la contrainte de clé étrangère redondante sur due_id (tout en conservant la colonne due_id pour compatibilité)
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_due_id_fkey;

-- 2. Synchroniser les lignes existantes où schedule_id ou due_id serait renseigné sans l'autre
UPDATE public.payments SET schedule_id = due_id WHERE schedule_id IS NULL AND due_id IS NOT NULL;
UPDATE public.payments SET due_id = schedule_id WHERE due_id IS NULL AND schedule_id IS NOT NULL;

-- 3. Trigger léger pour maintenir schedule_id et due_id synchronisés à chaque insertion/mise à jour
CREATE OR REPLACE FUNCTION public.sync_payments_schedule_due_id()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.schedule_id IS NULL AND NEW.due_id IS NOT NULL THEN
    NEW.schedule_id := NEW.due_id;
  ELSIF NEW.due_id IS NULL AND NEW.schedule_id IS NOT NULL THEN
    NEW.due_id := NEW.schedule_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_payments_schedule_due_id ON public.payments;
CREATE TRIGGER trg_sync_payments_schedule_due_id
BEFORE INSERT OR UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.sync_payments_schedule_due_id();

