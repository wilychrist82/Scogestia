-- ============================================
-- 11. VUE ET FONCTION: Résumé trimestriel de l'élève
-- ============================================

-- Fonction pour calculer la moyenne trimestrielle d'un élève
CREATE OR REPLACE FUNCTION public.calculate_term_average(p_student_id UUID, p_term TEXT)
RETURNS NUMERIC AS $$
DECLARE
    v_average NUMERIC;
BEGIN
    SELECT 
        CASE 
            WHEN SUM(coefficient) > 0 THEN SUM(score * coefficient) / SUM(coefficient)
            ELSE 0 
        END INTO v_average
    FROM public.grades
    WHERE student_id = p_student_id AND term = p_term AND score IS NOT NULL;
    
    RETURN ROUND(COALESCE(v_average, 0), 2);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Vue pour le résumé trimestriel
CREATE OR REPLACE VIEW public.student_term_summary AS
WITH term_averages AS (
    SELECT 
        student_id,
        class_id,
        term,
        public.calculate_term_average(student_id, term) as term_average
    FROM public.grades
    WHERE score IS NOT NULL
    GROUP BY student_id, class_id, term
),
ranked_averages AS (
    SELECT 
        student_id,
        class_id,
        term,
        term_average,
        RANK() OVER (PARTITION BY class_id, term ORDER BY term_average DESC) as class_rank
    FROM term_averages
),
absences AS (
    SELECT 
        student_id,
        COUNT(*) as unjustified_absences
    FROM public.attendance
    WHERE status = 'absent'
    GROUP BY student_id
)
SELECT 
    r.student_id,
    r.class_id,
    r.term,
    r.term_average,
    r.class_rank,
    COALESCE(a.unjustified_absences, 0) as unjustified_absences
FROM ranked_averages r
LEFT JOIN absences a ON r.student_id = a.student_id;
