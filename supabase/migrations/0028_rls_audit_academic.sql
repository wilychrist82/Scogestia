-- 0028_rls_audit_academic.sql
-- Audit et renforcement RLS pour les tables académiques récentes

-- 1. PRIMARY GRADES
DROP POLICY IF EXISTS "School users can view primary grades" ON public.primary_grades;
CREATE POLICY "Lecture primary_grades (Staff ou Parent)"
ON public.primary_grades FOR SELECT 
USING (
  public.has_role_in_school(school_id, array['super_admin'::user_role, 'admin'::user_role, 'enseignant'::user_role, 'comptable'::user_role])
  OR student_id IN (SELECT public.parent_student_ids())
);

-- 2. SECONDARY GRADES
DROP POLICY IF EXISTS "School users can view secondary grades" ON public.secondary_grades;
CREATE POLICY "Lecture secondary_grades (Staff ou Parent)"
ON public.secondary_grades FOR SELECT 
USING (
  public.has_role_in_school(school_id, array['super_admin'::user_role, 'admin'::user_role, 'enseignant'::user_role, 'comptable'::user_role])
  OR student_id IN (SELECT public.parent_student_ids())
);

-- 3. SUBJECTS (Matières)
-- Parents ont aussi besoin de voir les matières (pour comprendre les bulletins)
DROP POLICY IF EXISTS "Admins and teachers can view subjects" ON public.subjects;
CREATE POLICY "Lecture subjects (Staff ou Parents de l'école)"
ON public.subjects FOR SELECT 
USING (
  public.has_role_in_school(school_id, array['super_admin'::user_role, 'admin'::user_role, 'enseignant'::user_role, 'comptable'::user_role])
  -- Pour simplifier, si le parent a un enfant dans cette école, il peut voir les matières de l'école.
  OR school_id IN (
    SELECT s.school_id 
    FROM public.students s 
    JOIN public.parent_student_links psl ON s.id = psl.student_id 
    WHERE psl.parent_user_id = auth.uid()
  )
);

-- 4. PUBLISHED BULLETINS
-- On s'assure de la robustesse des politiques déjà existantes
DROP POLICY IF EXISTS "Parents can view their children's published_bulletins" ON public.published_bulletins;
CREATE POLICY "Lecture bulletins (Staff ou Parent)"
ON public.published_bulletins FOR SELECT
USING (
  public.has_role_in_school(school_id, array['super_admin'::user_role, 'admin'::user_role, 'enseignant'::user_role])
  OR student_id IN (SELECT public.parent_student_ids())
);

-- Note: L'Edge Function Supabase et le service_role by-passent le RLS,
-- donc pas de blocage pour la génération serveur.
