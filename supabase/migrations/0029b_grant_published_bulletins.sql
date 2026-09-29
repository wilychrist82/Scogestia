-- 0029_grant_published_bulletins.sql
GRANT ALL PRIVILEGES ON TABLE public.published_bulletins TO authenticated;
GRANT ALL PRIVILEGES ON TABLE public.published_bulletins TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.published_bulletins TO anon;
