-- 0046_update_primary_grading_scales.sql
-- Harmonisation des barèmes officiels du primaire :
-- CP (CP1, CP2) : Toutes les disciplines sur 10.
-- CE (CE1, CE2) : Problème et Dictée-questions sur 20, autres sur 10.
-- CM (CM1, CM2) : Problème, Dictée-questions, Calcul écrit, Étude de texte sur 20, autres sur 10.

-- 1. Mise à jour de la table primary_grades pour les matières sur 20 au niveau CE et CM
UPDATE public.primary_grades pg
SET max_score = 20
FROM public.students s
JOIN public.classes c ON c.id = s.class_id
JOIN public.subjects subj ON subj.id = pg.subject_id
WHERE pg.student_id = s.id
  AND (
    -- Classes CM (CM1, CM2) : Problème, Dictée-questions, Calcul écrit, Étude de texte
    (
      (LOWER(c.name) LIKE '%cm%' OR LOWER(COALESCE(c.level, '')) LIKE '%cm%')
      AND (
        LOWER(subj.name) LIKE '%problem%'
        OR LOWER(subj.name) LIKE '%dictee%'
        OR LOWER(subj.name) LIKE '%ecrire les mots%'
        OR (LOWER(subj.name) LIKE '%calcul%' AND LOWER(subj.name) NOT LIKE '%mental%')
        OR (
          (LOWER(subj.name) LIKE '%texte%' OR LOWER(subj.name) LIKE '%lecture%')
          AND LOWER(subj.name) NOT LIKE '%redact%'
          AND LOWER(subj.name) NOT LIKE '%produis%'
        )
      )
    )
    OR
    -- Classes CE (CE1, CE2) : Problème et Dictée-questions
    (
      (LOWER(c.name) LIKE '%ce%' OR LOWER(COALESCE(c.level, '')) LIKE '%ce%')
      AND (
        LOWER(subj.name) LIKE '%problem%'
        OR LOWER(subj.name) LIKE '%dictee%'
        OR LOWER(subj.name) LIKE '%ecrire les mots%'
      )
    )
  );
