-- ============================================
-- 12. CACHE BULLETINS: Bucket et Trigger Invalidation
-- ============================================

-- 1. Création du bucket 'bulletins'
INSERT INTO storage.buckets (id, name, public)
VALUES ('bulletins', 'bulletins', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Politiques RLS pour le bucket 'bulletins'
-- Seuls les parents liés à l'élève peuvent lire le bulletin (le nom du fichier commence par le student_id)
-- Note: Pour simplifier l'API, c'est le Route Handler (avec Service Role ou permissions appropriées) 
-- qui gérera l'écriture, donc pas besoin de politique INSERT complexe côté client pour l'instant.

CREATE POLICY "Les parents peuvent lire les bulletins de leurs enfants"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'bulletins' AND
  (
    -- Extraction du student_id depuis le chemin (format: student_id/term.pdf)
    split_part(name, '/', 1)::uuid IN (SELECT public.parent_student_ids())
    OR
    -- Autoriser les enseignants ou admins si besoin (non implémenté ici, on se fie au backend)
    auth.uid() IN (SELECT user_id FROM public.user_school_roles WHERE role IN ('admin', 'enseignant'))
  )
);

-- Le backend (Route Handler) utilisera le client Supabase avec Service Role key pour écrire le fichier, 
-- donc pas besoin de politique INSERT pour le rôle authenticated.

-- 3. Fonction pour invalider le cache du bulletin
CREATE OR REPLACE FUNCTION public.invalidate_bulletin_cache()
RETURNS TRIGGER AS $$
DECLARE
    v_student_id UUID;
    v_term TEXT;
    v_file_path TEXT;
BEGIN
    -- Récupérer l'ID de l'élève et le trimestre concerné par la modification de note
    IF TG_OP = 'DELETE' THEN
        v_student_id := OLD.student_id;
        v_term := OLD.term;
    ELSE
        v_student_id := NEW.student_id;
        v_term := NEW.term;
    END IF;

    -- Construire le chemin d'accès au fichier (ex: 123e4567-e89b-12d3-a456-426614174000/Trimestre 1.pdf)
    v_file_path := v_student_id::TEXT || '/' || v_term || '.pdf';

    -- Supprimer le fichier du bucket
    -- Note: La suppression depuis 'storage.objects' dans un trigger rend le fichier inaccessible.
    -- Un nettoyage périodique par Supabase s'occupera du fichier physique sur S3.
    DELETE FROM storage.objects
    WHERE bucket_id = 'bulletins' AND name = v_file_path;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Trigger sur la table grades
DROP TRIGGER IF EXISTS trg_invalidate_bulletin_on_grade_change ON public.grades;
CREATE TRIGGER trg_invalidate_bulletin_on_grade_change
AFTER INSERT OR UPDATE OR DELETE ON public.grades
FOR EACH ROW EXECUTE FUNCTION public.invalidate_bulletin_cache();
