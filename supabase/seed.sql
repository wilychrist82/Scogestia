-- ============================================
-- 0. NETTOYAGE (Pour relancer le seed sans erreur)
-- ============================================
TRUNCATE TABLE public.parent_student_links CASCADE;
TRUNCATE TABLE public.students CASCADE;
TRUNCATE TABLE public.classes CASCADE;
TRUNCATE TABLE public.user_school_roles CASCADE;
TRUNCATE TABLE public.schools CASCADE;

-- Optionnel : nettoyage des users de test (si on gère auth.users dans le seed)
-- Attention : sur un vrai projet, ne pas tronquer auth.users en prod !
DELETE FROM auth.users WHERE email LIKE '%@test-scogestia.com';

-- ============================================
-- 1. CREATION DES USERS DANS auth.users
-- ============================================
-- Ecole A (IDs commençant par a1...)
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES 
('00000000-0000-0000-0000-000000000000', 'a1111111-1111-1111-1111-111111111111', 'authenticated', 'authenticated', 'admin@ecoleA.test-scogestia.com', crypt('password123', gen_salt('bf')), now(), '{"provider": "email", "providers": ["email"]}', '{}', now(), now()),
('00000000-0000-0000-0000-000000000000', 'a1111111-2222-1111-1111-111111111111', 'authenticated', 'authenticated', 'comptable@ecoleA.test-scogestia.com', crypt('password123', gen_salt('bf')), now(), '{"provider": "email", "providers": ["email"]}', '{}', now(), now()),
('00000000-0000-0000-0000-000000000000', 'a1111111-3333-1111-1111-111111111111', 'authenticated', 'authenticated', 'prof@ecoleA.test-scogestia.com', crypt('password123', gen_salt('bf')), now(), '{"provider": "email", "providers": ["email"]}', '{}', now(), now()),
('00000000-0000-0000-0000-000000000000', 'a1111111-4444-1111-1111-111111111111', 'authenticated', 'authenticated', 'parent@ecoleA.test-scogestia.com', crypt('password123', gen_salt('bf')), now(), '{"provider": "email", "providers": ["email"]}', '{}', now(), now());

-- Ecole B (IDs commençant par b2...)
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES 
('00000000-0000-0000-0000-000000000000', 'b2222222-1111-2222-2222-222222222222', 'authenticated', 'authenticated', 'admin@ecoleB.test-scogestia.com', crypt('password123', gen_salt('bf')), now(), '{"provider": "email", "providers": ["email"]}', '{}', now(), now()),
('00000000-0000-0000-0000-000000000000', 'b2222222-2222-2222-2222-222222222222', 'authenticated', 'authenticated', 'comptable@ecoleB.test-scogestia.com', crypt('password123', gen_salt('bf')), now(), '{"provider": "email", "providers": ["email"]}', '{}', now(), now()),
('00000000-0000-0000-0000-000000000000', 'b2222222-3333-2222-2222-222222222222', 'authenticated', 'authenticated', 'prof@ecoleB.test-scogestia.com', crypt('password123', gen_salt('bf')), now(), '{"provider": "email", "providers": ["email"]}', '{}', now(), now()),
('00000000-0000-0000-0000-000000000000', 'b2222222-4444-2222-2222-222222222222', 'authenticated', 'authenticated', 'parent@ecoleB.test-scogestia.com', crypt('password123', gen_salt('bf')), now(), '{"provider": "email", "providers": ["email"]}', '{}', now(), now());

-- ============================================
-- 2. CREATION DES 2 ECOLES
-- ============================================
INSERT INTO public.schools (id, name, slug, email)
VALUES 
('cccccccc-1111-1111-1111-111111111111', 'École Primaire Laïque Excellence', 'ecole-excellence', 'contact@excellence.tg'),
('cccccccc-2222-2222-2222-222222222222', 'Collège Privé Le Savoir', 'college-savoir', 'contact@savoir.tg');

-- ============================================
-- 3. AFFECTATION DES ROLES (USER_SCHOOL_ROLES)
-- ============================================
INSERT INTO public.user_school_roles (user_id, school_id, role, full_name)
VALUES 
-- Roles Ecole A
('a1111111-1111-1111-1111-111111111111', 'cccccccc-1111-1111-1111-111111111111', 'admin', 'Admin Excellence'),
('a1111111-2222-1111-1111-111111111111', 'cccccccc-1111-1111-1111-111111111111', 'comptable', 'Comptable Excellence'),
('a1111111-3333-1111-1111-111111111111', 'cccccccc-1111-1111-1111-111111111111', 'enseignant', 'Prof Excellence'),
('a1111111-4444-1111-1111-111111111111', 'cccccccc-1111-1111-1111-111111111111', 'parent', 'Parent Excellence'),

-- Roles Ecole B
('b2222222-1111-2222-2222-222222222222', 'cccccccc-2222-2222-2222-222222222222', 'admin', 'Admin Savoir'),
('b2222222-2222-2222-2222-222222222222', 'cccccccc-2222-2222-2222-222222222222', 'comptable', 'Comptable Savoir'),
('b2222222-3333-2222-2222-222222222222', 'cccccccc-2222-2222-2222-222222222222', 'enseignant', 'Prof Savoir'),
('b2222222-4444-2222-2222-222222222222', 'cccccccc-2222-2222-2222-222222222222', 'parent', 'Parent Savoir');

-- ============================================
-- 4. CREATION DES CLASSES (2 par école)
-- ============================================
INSERT INTO public.classes (id, school_id, name, level, academic_year)
VALUES
-- Classes Ecole A
('d1111111-1111-1111-1111-111111111111', 'cccccccc-1111-1111-1111-111111111111', 'CP1 A', 'Primaire', '2023-2024'),
('d1111111-2222-1111-1111-111111111111', 'cccccccc-1111-1111-1111-111111111111', 'CE1 B', 'Primaire', '2023-2024'),
('d1111111-3333-1111-1111-111111111111', 'cccccccc-1111-1111-1111-111111111111', 'S1', 's1', '2023-2024'),
('d1111111-4444-1111-1111-111111111111', 'cccccccc-1111-1111-1111-111111111111', 'S2', 's2', '2023-2024'),

-- Classes Ecole B
('d2222222-1111-2222-2222-222222222222', 'cccccccc-2222-2222-2222-222222222222', '6ème A', 'Collège', '2023-2024'),
('d2222222-2222-2222-2222-222222222222', 'cccccccc-2222-2222-2222-222222222222', '3ème B', 'Collège', '2023-2024');

-- ============================================
-- 5. CREATION DES ELEVES (3 par classe, matricules qui se chevauchent)
-- ============================================
-- Note : MAT-001, MAT-002, MAT-003 sont présents dans les deux écoles pour tester l'unicité par school_id
INSERT INTO public.students (id, school_id, matricule, first_name, last_name, class_id)
VALUES
-- Eleves Ecole A (Classe CP1)
('e1111111-1111-1111-1111-111111111111', 'cccccccc-1111-1111-1111-111111111111', 'MAT-001', 'Komi', 'Mensah', 'd1111111-1111-1111-1111-111111111111'),
('e1111111-2222-1111-1111-111111111111', 'cccccccc-1111-1111-1111-111111111111', 'MAT-002', 'Afua', 'Koffi', 'd1111111-1111-1111-1111-111111111111'),
('e1111111-3333-1111-1111-111111111111', 'cccccccc-1111-1111-1111-111111111111', 'MAT-003', 'Kodjo', 'Akakpo', 'd1111111-1111-1111-1111-111111111111'),
-- Eleves Ecole A (Classe CE1)
('e1111111-4444-1111-1111-111111111111', 'cccccccc-1111-1111-1111-111111111111', 'MAT-004', 'Abla', 'Lawson', 'd1111111-2222-1111-1111-111111111111'),
('e1111111-5555-1111-1111-111111111111', 'cccccccc-1111-1111-1111-111111111111', 'MAT-005', 'Kossi', 'Ekoue', 'd1111111-2222-1111-1111-111111111111'),
('e1111111-6666-1111-1111-111111111111', 'cccccccc-1111-1111-1111-111111111111', 'MAT-006', 'Akouvi', 'Ajavon', 'd1111111-2222-1111-1111-111111111111'),

-- Eleves Ecole B (Classe 6ème)
('e2222222-1111-2222-2222-222222222222', 'cccccccc-2222-2222-2222-222222222222', 'MAT-001', 'Jean', 'Dupont', 'd2222222-1111-2222-2222-222222222222'), -- Matricule identique à Ecole A !
('e2222222-2222-2222-2222-222222222222', 'cccccccc-2222-2222-2222-222222222222', 'MAT-002', 'Marie', 'Curie', 'd2222222-1111-2222-2222-222222222222'), -- Matricule identique à Ecole A !
('e2222222-3333-2222-2222-222222222222', 'cccccccc-2222-2222-2222-222222222222', 'MAT-003', 'Paul', 'Bocuse', 'd2222222-1111-2222-2222-222222222222'), -- Matricule identique à Ecole A !
-- Eleves Ecole B (Classe 3ème)
('e2222222-4444-2222-2222-222222222222', 'cccccccc-2222-2222-2222-222222222222', 'MAT-004', 'Lucie', 'Aubrac', 'd2222222-2222-2222-2222-222222222222'),
('e2222222-5555-2222-2222-222222222222', 'cccccccc-2222-2222-2222-222222222222', 'MAT-005', 'Albert', 'Camus', 'd2222222-2222-2222-2222-222222222222'),
('e2222222-6666-2222-2222-222222222222', 'cccccccc-2222-2222-2222-222222222222', 'MAT-006', 'Simone', 'Veil', 'd2222222-2222-2222-2222-222222222222');

-- ============================================
-- 6. LIENS PARENTS <-> ELEVES (1 enfant pour chaque parent test)
-- ============================================
INSERT INTO public.parent_student_links (parent_user_id, student_id, school_id)
VALUES
-- Le parent de l'école A est lié à l'élève e1111111-1111 (Komi Mensah)
('a1111111-4444-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 'cccccccc-1111-1111-1111-111111111111'),

-- Le parent de l'école B est lié à l'élève e2222222-1111 (Jean Dupont)
('b2222222-4444-2222-2222-222222222222', 'e2222222-1111-2222-2222-222222222222', 'cccccccc-2222-2222-2222-222222222222');
