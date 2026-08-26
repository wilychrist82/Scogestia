-- Add setting fields to schools table
ALTER TABLE public.schools 
ADD COLUMN IF NOT EXISTS signature_url text,
ADD COLUMN IF NOT EXISTS stamp_url text,
ADD COLUMN IF NOT EXISTS director_name text,
ADD COLUMN IF NOT EXISTS grading_system jsonb DEFAULT '{"max_score": 20, "pass_mark": 10}'::jsonb;

-- Create academic_years table for better historical tracking
CREATE TABLE IF NOT EXISTS public.academic_years (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name text NOT NULL, -- e.g., '2026-2027'
  start_date date,
  end_date date,
  is_active boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_academic_years_school ON public.academic_years(school_id);

ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;

-- Admins and comptables can manage academic years
CREATE POLICY "Admins manage academic years" ON public.academic_years
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_school_roles 
      WHERE user_id = auth.uid() 
      AND school_id = academic_years.school_id 
      AND role = 'admin'
    )
  );

-- Everyone can read academic years
CREATE POLICY "Everyone can read academic years" ON public.academic_years
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_school_roles 
      WHERE user_id = auth.uid() 
      AND school_id = academic_years.school_id 
    )
  );
