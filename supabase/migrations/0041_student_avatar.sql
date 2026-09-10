-- Add avatar_url column to students table
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS avatar_url text;
