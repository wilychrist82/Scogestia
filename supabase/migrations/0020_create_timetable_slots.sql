-- =====================================================
-- Migration: Emploi du Temps Scogestia
-- Table: timetable_slots
-- Coller directement dans le SQL Editor Supabase
-- =====================================================

-- Activer l'extension btree_gist (nécessaire pour la contrainte d'anti-chevauchement)
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Créer la table
CREATE TABLE IF NOT EXISTS timetable_slots (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id     uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  class_id      uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  day_of_week   smallint NOT NULL CHECK (day_of_week BETWEEN 1 AND 6),
  start_time    time NOT NULL,
  end_time      time NOT NULL,
  subject_name  text NOT NULL CHECK (char_length(subject_name) BETWEEN 1 AND 100),
  teacher_name  text,
  room          text,
  color         text NOT NULL DEFAULT '#065F46',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT timetable_times_valid CHECK (end_time > start_time)
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS timetable_slots_class_id_idx
  ON timetable_slots(class_id);

CREATE INDEX IF NOT EXISTS timetable_slots_school_id_idx
  ON timetable_slots(school_id);

-- Trigger updated_at automatique
CREATE OR REPLACE FUNCTION update_timetable_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS timetable_slots_updated_at ON timetable_slots;
CREATE TRIGGER timetable_slots_updated_at
  BEFORE UPDATE ON timetable_slots
  FOR EACH ROW EXECUTE FUNCTION update_timetable_updated_at();

-- ── Row Level Security ────────────────────────────────────────────────────────
ALTER TABLE timetable_slots ENABLE ROW LEVEL SECURITY;

-- Lecture : tout membre de l'école (admin, enseignant, parent, comptable)
CREATE POLICY "timetable_select_school_members"
  ON timetable_slots FOR SELECT
  USING (
    school_id IN (
      SELECT school_id FROM user_school_roles
      WHERE user_id = auth.uid()
    )
  );

-- Insertion : seulement admin et comptable
CREATE POLICY "timetable_insert_admin"
  ON timetable_slots FOR INSERT
  WITH CHECK (
    school_id IN (
      SELECT school_id FROM user_school_roles
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'comptable')
    )
  );

-- Mise à jour : seulement admin et comptable
CREATE POLICY "timetable_update_admin"
  ON timetable_slots FOR UPDATE
  USING (
    school_id IN (
      SELECT school_id FROM user_school_roles
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'comptable')
    )
  );

-- Suppression : seulement admin et comptable
CREATE POLICY "timetable_delete_admin"
  ON timetable_slots FOR DELETE
  USING (
    school_id IN (
      SELECT school_id FROM user_school_roles
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'comptable')
    )
  );

-- Vérification
SELECT 'Migration timetable_slots appliquée avec succès ✓' AS status;
