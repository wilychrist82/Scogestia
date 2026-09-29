-- Restauration des droits sur la table payments après sa recréation

GRANT ALL ON TABLE public.payments TO authenticated, anon, service_role;
GRANT ALL ON TABLE public.fee_types TO authenticated, anon, service_role;
