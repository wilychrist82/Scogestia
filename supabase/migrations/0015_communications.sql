-- Create communications table
CREATE TABLE public.communications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_type text NOT NULL CHECK (recipient_type IN ('all', 'class', 'parent')),
  recipient_id uuid, -- NULL for 'all', class_id for 'class', parent_user_id for 'parent'
  subject text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Indexes for faster lookups
CREATE INDEX idx_communications_school ON public.communications(school_id);
CREATE INDEX idx_communications_recipient ON public.communications(recipient_type, recipient_id);

-- RLS Policies
ALTER TABLE public.communications ENABLE ROW LEVEL SECURITY;

-- Admins and comptables can read all communications for their school
CREATE POLICY "Admins and comptables can view communications" ON public.communications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_school_roles 
      WHERE user_id = auth.uid() 
      AND school_id = communications.school_id 
      AND role IN ('admin', 'comptable')
    )
  );

-- Admins can insert communications for their school
CREATE POLICY "Admins can insert communications" ON public.communications
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_school_roles 
      WHERE user_id = auth.uid() 
      AND school_id = communications.school_id 
      AND role = 'admin'
    )
  );

-- Parents can read communications that are sent to 'all', their children's classes, or to them specifically
CREATE POLICY "Parents can view their communications" ON public.communications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_school_roles 
      WHERE user_id = auth.uid() 
      AND school_id = communications.school_id 
      AND role = 'parent'
    )
    AND (
      recipient_type = 'all'
      OR (recipient_type = 'parent' AND recipient_id = auth.uid())
      OR (
        recipient_type = 'class' AND recipient_id IN (
          SELECT s.class_id 
          FROM public.parent_student_links psl
          JOIN public.students s ON psl.student_id = s.id
          WHERE psl.parent_user_id = auth.uid()
        )
      )
    )
  );
