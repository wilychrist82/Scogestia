-- Add parent_phone to students table to store the phone number directly
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS parent_phone text;
