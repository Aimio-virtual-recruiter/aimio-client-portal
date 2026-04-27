-- ════════════════════════════════════════════════════════════════════════
-- Candidate CRM — recruiter notes + tags
-- Date: 2026-04-27
-- Run in: Supabase Dashboard → SQL Editor
-- Safe to re-run (idempotent)
-- ════════════════════════════════════════════════════════════════════════

-- Recruiter notes on candidates (timestamped, multiple over time)
CREATE TABLE IF NOT EXISTS candidate_notes (
  id           bigserial PRIMARY KEY,
  candidate_id uuid NOT NULL,
  author_id    uuid REFERENCES profiles(id) ON DELETE SET NULL,
  author_name  text,
  content      text NOT NULL,
  created_at   timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_candidate_notes_candidate ON candidate_notes(candidate_id, created_at DESC);

-- FK to sourced_candidates (only if it exists)
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='sourced_candidates') THEN
    -- Drop existing constraint if any to allow re-run
    ALTER TABLE candidate_notes DROP CONSTRAINT IF EXISTS candidate_notes_candidate_id_fkey;
    ALTER TABLE candidate_notes
      ADD CONSTRAINT candidate_notes_candidate_id_fkey
      FOREIGN KEY (candidate_id) REFERENCES sourced_candidates(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Tags on candidates (free-form labels recruiter can add)
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='sourced_candidates') THEN
    EXECUTE 'ALTER TABLE sourced_candidates ADD COLUMN IF NOT EXISTS tags text[] DEFAULT ''{}''::text[]';
  END IF;
END $$;

-- RLS
ALTER TABLE candidate_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "recruiter_admin_read_notes" ON candidate_notes;
CREATE POLICY "recruiter_admin_read_notes" ON candidate_notes
  FOR SELECT USING (
    (auth.jwt()->'app_metadata'->>'role')::text IN ('admin', 'recruiter')
  );

DROP POLICY IF EXISTS "recruiter_admin_write_notes" ON candidate_notes;
CREATE POLICY "recruiter_admin_write_notes" ON candidate_notes
  FOR INSERT WITH CHECK (
    (auth.jwt()->'app_metadata'->>'role')::text IN ('admin', 'recruiter')
  );

DROP POLICY IF EXISTS "recruiter_admin_delete_notes" ON candidate_notes;
CREATE POLICY "recruiter_admin_delete_notes" ON candidate_notes
  FOR DELETE USING (
    (auth.jwt()->'app_metadata'->>'role')::text IN ('admin', 'recruiter')
  );
