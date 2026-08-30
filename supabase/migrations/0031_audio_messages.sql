-- 1. Add audio_url to communications table
ALTER TABLE public.communications
ADD COLUMN IF NOT EXISTS audio_url text;

-- 2. Create the storage bucket for communications (public to easily play from URL)
INSERT INTO storage.buckets (id, name, public)
VALUES ('communications', 'communications', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Set up Storage RLS policies for the new bucket

-- Policy: Authenticated users can view/download audio files
DROP POLICY IF EXISTS "Authenticated users can read communications audio" ON storage.objects;
CREATE POLICY "Authenticated users can read communications audio"
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'communications' AND auth.role() = 'authenticated' );

-- Policy: School staff can upload audio files
DROP POLICY IF EXISTS "School staff can upload audio" ON storage.objects;
CREATE POLICY "School staff can upload audio"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'communications' 
    AND auth.role() = 'authenticated'
    AND (
      EXISTS (
        SELECT 1 FROM public.user_school_roles 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'enseignant', 'comptable')
      )
    )
  );

-- 4. To allow bidirectional communication (parents to school), update the recipient_type check constraint.
ALTER TABLE public.communications
DROP CONSTRAINT IF EXISTS communications_recipient_type_check;

ALTER TABLE public.communications
ADD CONSTRAINT communications_recipient_type_check 
CHECK (recipient_type IN ('all', 'class', 'parent', 'admin', 'teacher'));

-- Policy: Parents can insert communications directed to admin or teacher
DROP POLICY IF EXISTS "Parents can send messages to admin or teacher" ON public.communications;
CREATE POLICY "Parents can send messages to admin or teacher"
  ON public.communications
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_school_roles 
      WHERE user_id = auth.uid() 
      AND school_id = communications.school_id 
      AND role = 'parent'
    )
    AND recipient_type IN ('admin', 'teacher')
  );

-- Policy: Parents can upload audio files
DROP POLICY IF EXISTS "Parents can upload audio" ON storage.objects;
CREATE POLICY "Parents can upload audio"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'communications' 
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM public.user_school_roles 
      WHERE user_id = auth.uid() 
      AND role = 'parent'
    )
  );
