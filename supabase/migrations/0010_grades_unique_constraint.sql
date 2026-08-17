-- Ajout d'une contrainte d'unicité pour permettre l'upsert facile lors de la saisie des notes
ALTER TABLE public.grades 
DROP CONSTRAINT IF EXISTS grades_student_subject_term_type_key;

ALTER TABLE public.grades 
ADD CONSTRAINT grades_student_subject_term_type_key 
UNIQUE (student_id, class_id, subject_name, term, evaluation_type);
