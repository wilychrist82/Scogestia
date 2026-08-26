-- Fix storage deletion error by dropping the trigger that tries to delete directly from storage.objects
DROP TRIGGER IF EXISTS trg_invalidate_bulletin_on_grade_change ON public.grades;
DROP FUNCTION IF EXISTS public.invalidate_bulletin_cache();
