-- Migration pour gérer les paiements en espèces et les reçus de caisse
-- On ajoute receipt_number à payments

ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS receipt_number text UNIQUE;

-- On permet que transaction_id soit optionnel ou on garde la logique de générer un ID local
-- Si on veut rendre transaction_id nullable pour les paiements en espèces:
-- ALTER TABLE public.payments ALTER COLUMN transaction_id DROP NOT NULL;
-- Mais pour ne pas casser l'existant, on va juste utiliser un préfixe (ex: 'CASH-xxx') côté applicatif.

-- Ajouter la valeur 'partiel' à l'enum payment_status si nécessaire
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'payment_status' AND e.enumlabel = 'partiel') THEN
    ALTER TYPE payment_status ADD VALUE 'partiel';
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
