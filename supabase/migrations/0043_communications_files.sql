-- Add file_url and file_type to communications
ALTER TABLE public.communications
ADD COLUMN IF NOT EXISTS file_url text,
ADD COLUMN IF NOT EXISTS file_type text;
