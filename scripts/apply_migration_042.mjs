// Script pour appliquer la migration 0042 via l'API Supabase REST
// Usage: node scripts/apply_migration_042.mjs

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://juhlayflzogtomarshpx.supabase.co'
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!serviceRoleKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY manquant. Utilisez: $env:SUPABASE_SERVICE_ROLE_KEY="votre_cle" && node scripts/apply_migration_042.mjs')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

const sql = `
-- 1. Mise à jour du CHECK CONSTRAINT recipient_type
ALTER TABLE public.communications
DROP CONSTRAINT IF EXISTS communications_recipient_type_check;

ALTER TABLE public.communications
ADD CONSTRAINT communications_recipient_type_check
CHECK (recipient_type IN ('all', 'class', 'parent', 'admin', 'teacher', 'enseignant', 'all_teachers'));

-- 2. Politique INSERT pour les enseignants
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

-- 3. Mise à jour politique SELECT enseignant
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
      sender_id = auth.uid()
      OR recipient_type = 'all'
      OR recipient_type = 'all_teachers'
      OR (recipient_type IN ('enseignant', 'teacher') AND recipient_id = auth.uid())
      OR (
        recipient_type = 'class' AND recipient_id IN (
          SELECT class_id
          FROM public.teacher_class_subjects
          WHERE teacher_id = auth.uid()
        )
      )
    )
  );

-- 4. Lecture de parent_student_links pour les enseignants
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
`

// Exécuter via RPC (rpc exec_sql nécessite une fonction postgres custom)
// Alternative: utiliser l'API management de Supabase
const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': serviceRoleKey,
    'Authorization': `Bearer ${serviceRoleKey}`
  },
  body: JSON.stringify({ sql })
})

if (!response.ok) {
  console.log('RPC exec_sql non disponible, utiliser le dashboard Supabase SQL Editor')
  console.log('\n=== SQL à exécuter dans le dashboard Supabase ===\n')
  console.log(sql)
} else {
  console.log('Migration appliquée avec succès !')
}
