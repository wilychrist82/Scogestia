-- Ajouter la valeur 'manual' à l'enum reminder_type
-- Note: Dans Postgres, on ajoute une valeur à un enum existant avec ALTER TYPE ... ADD VALUE
alter type public.reminder_type add value if not exists 'manual';
