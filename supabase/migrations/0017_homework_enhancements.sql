-- 0017_homework_enhancements.sql

-- Add target_students array to allow selective homework assignment
-- If null or empty, it means the homework is assigned to the entire class.
ALTER TABLE public.homework 
ADD COLUMN target_students uuid[] DEFAULT NULL;

-- Make sure the homework-attachments bucket exists and has correct policies
INSERT INTO storage.buckets (id, name, public)
VALUES ('homework-attachments', 'homework-attachments', true)
ON CONFLICT (id) DO NOTHING;
