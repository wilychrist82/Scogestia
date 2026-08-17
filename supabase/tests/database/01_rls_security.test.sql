BEGIN;

-- Désactiver le log des requêtes internes à pgTAP
SET client_min_messages = warning;

-- Installer pgTAP si ce n'est pas déjà fait
CREATE EXTENSION IF NOT EXISTS pgtap;

-- Planifier les tests (définir le nombre exact de tests qu'on va exécuter)
SELECT plan(6);

-- --------------------------------------------------------
-- SETUP DU CONTEXTE DE TEST
-- --------------------------------------------------------
-- Créer des utilisateurs de test
INSERT INTO auth.users (id, email) VALUES
    ('11111111-1111-1111-1111-111111111111', 'parentA@test.com'),
    ('22222222-2222-2222-2222-222222222222', 'parentB@test.com'),
    ('33333333-3333-3333-3333-333333333333', 'teacherA@test.com');

-- Créer deux écoles
INSERT INTO public.schools (id, name, type) VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Ecole A', 'primaire'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Ecole B', 'primaire');

-- Assigner les rôles : Parent A -> Ecole A, Parent B -> Ecole B, Teacher A -> Ecole A
INSERT INTO public.user_school_roles (user_id, school_id, role) VALUES
    ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'parent'),
    ('22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'parent'),
    ('33333333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'enseignant');

-- Créer deux classes
INSERT INTO public.classes (id, school_id, name, level) VALUES
    ('c1111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'CP Ecole A', 'CP'),
    ('c2222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'CP Ecole B', 'CP');

-- Créer deux élèves
INSERT INTO public.students (id, school_id, class_id, first_name, last_name) VALUES
    ('s1111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'c1111111-1111-1111-1111-111111111111', 'Enfant', 'A'),
    ('s2222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'c2222222-2222-2222-2222-222222222222', 'Enfant', 'B');

-- Lier les parents à leurs enfants
INSERT INTO public.parent_student_links (parent_id, student_id) VALUES
    ('11111111-1111-1111-1111-111111111111', 's1111111-1111-1111-1111-111111111111'),
    ('22222222-2222-2222-2222-222222222222', 's2222222-2222-2222-2222-222222222222');

-- Assigner une classe au professeur
INSERT INTO public.teacher_class_subjects (teacher_id, class_id, subject_name) VALUES
    ('33333333-3333-3333-3333-333333333333', 'c1111111-1111-1111-1111-111111111111', 'Mathématiques');

-- --------------------------------------------------------
-- TESTS RLS
-- --------------------------------------------------------

-- Test 1: Parent A (Ecole A) ne doit voir que la classe de l'école A
-- On simule la session JWT de Parent A
SELECT set_config('request.jwt.claims', '{"sub": "11111111-1111-1111-1111-111111111111"}', true);
SET ROLE authenticated;

SELECT results_eq(
    'SELECT id FROM public.classes',
    ARRAY['c1111111-1111-1111-1111-111111111111'::uuid],
    'Parent A ne doit voir que les classes de l''école A (Isolation Ecole)'
);

-- Test 2: Parent A ne doit voir que son propre enfant
SELECT results_eq(
    'SELECT id FROM public.students',
    ARRAY['s1111111-1111-1111-1111-111111111111'::uuid],
    'Parent A ne doit voir que son propre enfant (Isolation Parent-Enfant)'
);

-- Test 3: Parent B ne doit voir que son propre enfant
RESET ROLE;
SELECT set_config('request.jwt.claims', '{"sub": "22222222-2222-2222-2222-222222222222"}', true);
SET ROLE authenticated;

SELECT results_eq(
    'SELECT id FROM public.students',
    ARRAY['s2222222-2222-2222-2222-222222222222'::uuid],
    'Parent B ne doit voir que son propre enfant (Isolation Parent-Enfant)'
);

-- Test 4: L'enseignant A (Ecole A) doit voir l'enfant A
RESET ROLE;
SELECT set_config('request.jwt.claims', '{"sub": "33333333-3333-3333-3333-333333333333"}', true);
SET ROLE authenticated;

SELECT results_eq(
    'SELECT id FROM public.students',
    ARRAY['s1111111-1111-1111-1111-111111111111'::uuid],
    'Enseignant A doit voir l''enfant A car il est dans son école'
);

-- Test 5: L'enseignant A peut insérer une note pour la classe qu'il a assignée
SELECT lives_ok(
    $$ INSERT INTO public.grades (student_id, subject_name, score, max_score, term, teacher_id) 
       VALUES ('s1111111-1111-1111-1111-111111111111', 'Mathématiques', 15, 20, 'Trimestre 1', '33333333-3333-3333-3333-333333333333') $$,
    'Enseignant A peut insérer une note pour sa classe assignée'
);

-- Test 6: L'enseignant A NE PEUT PAS insérer une note pour une matière non assignée (ex: Français)
SELECT throws_ok(
    $$ INSERT INTO public.grades (student_id, subject_name, score, max_score, term, teacher_id) 
       VALUES ('s1111111-1111-1111-1111-111111111111', 'Français', 10, 20, 'Trimestre 1', '33333333-3333-3333-3333-333333333333') $$,
    'new row violates row-level security policy for table "grades"',
    'Enseignant A ne doit pas pouvoir insérer une note pour une matière non assignée'
);

RESET ROLE;
SELECT * FROM finish();
ROLLBACK;
