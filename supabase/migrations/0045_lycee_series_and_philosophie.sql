-- Migration 0045: Intégration des séries de Lycée (2nde S/A4, 1ère A4/D/C, Terminale A4/D/C) et de la matière Philosophie

-- 1. Insérer la matière "Philosophie" pour toutes les écoles existantes qui ne l'ont pas encore
INSERT INTO public.subjects (school_id, name, cycle, category, coefficient)
SELECT DISTINCT s.id, 'Philosophie', 'secondaire', NULL, 2.0
FROM public.schools s
WHERE NOT EXISTS (
  SELECT 1 FROM public.subjects sub 
  WHERE sub.school_id = s.id 
  AND lower(sub.name) LIKE '%philo%'
);

-- 2. Insérer les classes de séries officielles du Lycée pour toutes les écoles ayant le cycle Lycée
-- Seconde S et A4
INSERT INTO public.classes (school_id, name, level, academic_year, capacity)
SELECT s.id, '2nde S', 'Seconde', '2024-2025', 80
FROM public.schools s
WHERE NOT EXISTS (
  SELECT 1 FROM public.classes c 
  WHERE c.school_id = s.id AND lower(c.name) in ('2nde s', 'seconde s')
);

INSERT INTO public.classes (school_id, name, level, academic_year, capacity)
SELECT s.id, '2nde A4', 'Seconde', '2024-2025', 80
FROM public.schools s
WHERE NOT EXISTS (
  SELECT 1 FROM public.classes c 
  WHERE c.school_id = s.id AND lower(c.name) in ('2nde a4', 'seconde a4', '2nde a', 'seconde a')
);

-- Première A4, D, C
INSERT INTO public.classes (school_id, name, level, academic_year, capacity)
SELECT s.id, '1ère A4', 'Première', '2024-2025', 80
FROM public.schools s
WHERE NOT EXISTS (
  SELECT 1 FROM public.classes c 
  WHERE c.school_id = s.id AND lower(c.name) in ('1ere a4', '1ère a4', 'premiere a4', 'première a4')
);

INSERT INTO public.classes (school_id, name, level, academic_year, capacity)
SELECT s.id, '1ère D', 'Première', '2024-2025', 80
FROM public.schools s
WHERE NOT EXISTS (
  SELECT 1 FROM public.classes c 
  WHERE c.school_id = s.id AND lower(c.name) in ('1ere d', '1ère d', 'premiere d', 'première d')
);

INSERT INTO public.classes (school_id, name, level, academic_year, capacity)
SELECT s.id, '1ère C', 'Première', '2024-2025', 80
FROM public.schools s
WHERE NOT EXISTS (
  SELECT 1 FROM public.classes c 
  WHERE c.school_id = s.id AND lower(c.name) in ('1ere c', '1ère c', 'premiere c', 'première c')
);

-- Terminale A4, D, C
INSERT INTO public.classes (school_id, name, level, academic_year, capacity)
SELECT s.id, 'Terminale A4', 'Terminale', '2024-2025', 80
FROM public.schools s
WHERE NOT EXISTS (
  SELECT 1 FROM public.classes c 
  WHERE c.school_id = s.id AND lower(c.name) in ('tle a4', 'terminale a4')
);

INSERT INTO public.classes (school_id, name, level, academic_year, capacity)
SELECT s.id, 'Terminale D', 'Terminale', '2024-2025', 80
FROM public.schools s
WHERE NOT EXISTS (
  SELECT 1 FROM public.classes c 
  WHERE c.school_id = s.id AND lower(c.name) in ('tle d', 'terminale d')
);

INSERT INTO public.classes (school_id, name, level, academic_year, capacity)
SELECT s.id, 'Terminale C', 'Terminale', '2024-2025', 80
FROM public.schools s
WHERE NOT EXISTS (
  SELECT 1 FROM public.classes c 
  WHERE c.school_id = s.id AND lower(c.name) in ('tle c', 'terminale c')
);
