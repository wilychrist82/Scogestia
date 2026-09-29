-- ============================================
-- 14. TABLES POUR LE LIVRET PRIMAIRE (RANG & APPRECIATION)
-- ============================================

CREATE TABLE IF NOT EXISTS public.primary_monthly_ranks (
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    month_number INT NOT NULL,
    rank_text TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (student_id, month_number)
);

CREATE TABLE IF NOT EXISTS public.primary_bulletin_info (
    student_id UUID NOT NULL PRIMARY KEY REFERENCES public.students(id) ON DELETE CASCADE,
    appreciation TEXT,
    director_decision TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.primary_monthly_ranks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.primary_bulletin_info ENABLE ROW LEVEL SECURITY;

-- Policies for primary_monthly_ranks
CREATE POLICY "Allow all authenticated users to read primary_monthly_ranks" 
ON public.primary_monthly_ranks FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow teachers and admins to insert/update primary_monthly_ranks" 
ON public.primary_monthly_ranks FOR ALL TO authenticated 
USING (auth.uid() IN (SELECT user_id FROM public.user_school_roles WHERE role IN ('admin', 'enseignant')));

-- Policies for primary_bulletin_info
CREATE POLICY "Allow all authenticated users to read primary_bulletin_info" 
ON public.primary_bulletin_info FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow teachers and admins to insert/update primary_bulletin_info" 
ON public.primary_bulletin_info FOR ALL TO authenticated 
USING (auth.uid() IN (SELECT user_id FROM public.user_school_roles WHERE role IN ('admin', 'enseignant')));
