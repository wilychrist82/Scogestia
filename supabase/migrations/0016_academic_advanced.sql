-- 0016_academic_advanced.sql

-- 1. Create a structured `subjects` table
CREATE TABLE public.subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  cycle text NOT NULL CHECK (cycle IN ('primaire', 'secondaire')),
  category text, -- For primary (e.g., 'Français', 'Mathématiques', 'EAC')
  coefficient numeric(4,2) DEFAULT 1.0, -- For secondary
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_subjects_school ON public.subjects(school_id);

-- 2. Primary Grades (Monthly 1-9)
CREATE TABLE public.primary_grades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  month_number integer NOT NULL CHECK (month_number BETWEEN 1 AND 9),
  score numeric(5,2),
  max_score numeric(5,2) DEFAULT 10,
  academic_year text NOT NULL,
  entered_by uuid REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(student_id, subject_id, month_number, academic_year)
);
CREATE INDEX idx_primary_grades_student ON public.primary_grades(student_id);

-- 3. Secondary Grades (Term: Classe & Comp)
CREATE TABLE public.secondary_grades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  term text NOT NULL CHECK (term IN ('1er_trimestre', '2e_trimestre', '3e_trimestre', '1er_semestre', '2e_semestre')),
  class_score numeric(5,2),
  comp_score numeric(5,2),
  max_score numeric(5,2) DEFAULT 20,
  academic_year text NOT NULL,
  entered_by uuid REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(student_id, subject_id, term, academic_year)
);
CREATE INDEX idx_secondary_grades_student ON public.secondary_grades(student_id);

-- 4. Enable RLS
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.primary_grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.secondary_grades ENABLE ROW LEVEL SECURITY;

-- 5. Policies
CREATE POLICY "Admins and teachers can view subjects" ON public.subjects
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_school_roles WHERE user_id = auth.uid() AND school_id = subjects.school_id)
  );

CREATE POLICY "Admins can manage subjects" ON public.subjects
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_school_roles WHERE user_id = auth.uid() AND school_id = subjects.school_id AND role = 'admin')
  );

-- Primary Grades Policies
CREATE POLICY "School users can view primary grades" ON public.primary_grades
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_school_roles WHERE user_id = auth.uid() AND school_id = primary_grades.school_id)
  );
CREATE POLICY "Teachers and admins can insert primary grades" ON public.primary_grades
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_school_roles WHERE user_id = auth.uid() AND school_id = primary_grades.school_id AND role IN ('admin', 'enseignant'))
  );
CREATE POLICY "Teachers and admins can update primary grades" ON public.primary_grades
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.user_school_roles WHERE user_id = auth.uid() AND school_id = primary_grades.school_id AND role IN ('admin', 'enseignant'))
  );

-- Secondary Grades Policies
CREATE POLICY "School users can view secondary grades" ON public.secondary_grades
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_school_roles WHERE user_id = auth.uid() AND school_id = secondary_grades.school_id)
  );
CREATE POLICY "Teachers and admins can insert secondary grades" ON public.secondary_grades
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_school_roles WHERE user_id = auth.uid() AND school_id = secondary_grades.school_id AND role IN ('admin', 'enseignant'))
  );
CREATE POLICY "Teachers and admins can update secondary grades" ON public.secondary_grades
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.user_school_roles WHERE user_id = auth.uid() AND school_id = secondary_grades.school_id AND role IN ('admin', 'enseignant'))
  );
