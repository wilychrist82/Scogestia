-- 0014_published_bulletins.sql

CREATE TABLE IF NOT EXISTS public.published_bulletins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    term_or_month TEXT NOT NULL,
    academic_year TEXT NOT NULL,
    file_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- un étudiant ne peut avoir qu'un seul bulletin publié par trimestre/mois et par année académique
    UNIQUE(student_id, term_or_month, academic_year)
);

ALTER TABLE public.published_bulletins ENABLE ROW LEVEL SECURITY;

-- Admins can manage published_bulletins for their school
CREATE POLICY "Admins have full access to published_bulletins"
ON public.published_bulletins
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_school_roles usr
        WHERE usr.user_id = auth.uid() AND usr.role IN ('admin', 'super_admin')
        AND usr.school_id = published_bulletins.school_id
    )
);

-- Parents can view published_bulletins for their children
CREATE POLICY "Parents can view their children's published_bulletins"
ON public.published_bulletins
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM parent_student_links psl
        WHERE psl.parent_id = auth.uid()
        AND psl.student_id = published_bulletins.student_id
    )
);

-- Also ensure admins have upload access to the 'bulletins' storage bucket.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Admins can upload bulletins' AND tablename = 'objects' AND schemaname = 'storage'
    ) THEN
        CREATE POLICY "Admins can upload bulletins"
        ON storage.objects
        FOR ALL
        TO authenticated
        USING (
            bucket_id = 'bulletins' AND
            EXISTS (
                SELECT 1 FROM user_school_roles usr
                WHERE usr.user_id = auth.uid() AND usr.role IN ('admin', 'super_admin')
            )
        );
    END IF;
END $$;
