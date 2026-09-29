-- 0030_make_bulletins_bucket_public.sql
UPDATE storage.buckets SET public = true WHERE id = 'bulletins';
