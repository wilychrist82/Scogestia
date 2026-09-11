-- Migration : Système de communication enseignants bidirectionnel
-- Corrige 3 problèmes :
-- 1. Le CHECK CONSTRAINT n'acceptait pas 'enseignant' et 'all_teachers'
-- 2. Pas de politique RLS INSERT pour les enseignants
-- 3. Pas de politique RLS pour lire parent_student_links côté enseignant
--    (résolu côté code avec adminClient, mais ajoutons aussi la politique DB)

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Mise à jour du CHECK CONSTRAINT recipient_type
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.communications
DROP CONSTRAINT IF EXISTS communications_recipient_type_check;

ALTER TABLE public.communications
ADD CONSTRAINT communications_recipient_type_check
CHECK (recipient_type IN ('all', 'class', 'parent', 'admin', 'teacher', 'enseignant', 'all_teachers'));

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Politique INSERT pour les enseignants
--    Un enseignant peut envoyer à 'admin' ou à un parent spécifique ('parent')
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Enseignants can insert communications" ON public.communications;

CREATE POLICY "Enseignants can insert communications"
  ON public.communications
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_school_roles
      WHERE user_id = auth.uid()
      AND school_id = communications.school_id
      AND role = 'enseignant'
    )
    AND recipient_type IN ('admin', 'parent', 'teacher', 'enseignant')
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Mise à jour politique SELECT enseignant sur communications
--    Étendre pour inclure les messages qui lui sont adressés personnellement
--    et les messages 'all_teachers'
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Enseignants can view their communications" ON public.communications;

CREATE POLICY "Enseignants can view their communications"
  ON public.communications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_school_roles
      WHERE user_id = auth.uid()
      AND school_id = communications.school_id
      AND role = 'enseignant'
    )
    AND (
      -- Messages envoyés par l'enseignant lui-même
      sender_id = auth.uid()
      -- Messages à tous
      OR recipient_type = 'all'
      -- Messages à tous les enseignants
      OR recipient_type = 'all_teachers'
      -- Messages adressés à cet enseignant précisément
      OR (recipient_type IN ('enseignant', 'teacher') AND recipient_id = auth.uid())
      -- Messages à une classe que l'enseignant enseigne
      OR (
        recipient_type = 'class' AND recipient_id IN (
          SELECT class_id
          FROM public.teacher_class_subjects
          WHERE teacher_id = auth.uid()
        )
      )
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Lecture de parent_student_links pour les enseignants
--    Permet à un enseignant de savoir quel parent est lié à ses élèves
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Enseignants can read parent links for their students" ON public.parent_student_links;

CREATE POLICY "Enseignants can read parent links for their students"
  ON public.parent_student_links
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.students s
      JOIN public.teacher_class_subjects tcs ON tcs.class_id = s.class_id
      WHERE s.id = parent_student_links.student_id
      AND tcs.teacher_id = auth.uid()
    )
  );
