-- ════════════════════════════════════════════════════════════════════════
-- Add search_criteria to mandates + link sourcing_runs to mandates
-- Date: 2026-04-27
-- Run in: Supabase Dashboard → SQL Editor
-- Safe to re-run (idempotent)
-- ════════════════════════════════════════════════════════════════════════

-- Mandates: store the rich search criteria (LinkedIn Recruiter Lite-style)
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='mandates') THEN
    EXECUTE 'ALTER TABLE mandates ADD COLUMN IF NOT EXISTS search_criteria jsonb';
    EXECUTE 'ALTER TABLE mandates ADD COLUMN IF NOT EXISTS criteria_updated_at timestamptz';
    EXECUTE 'ALTER TABLE mandates ADD COLUMN IF NOT EXISTS criteria_updated_by uuid REFERENCES profiles(id) ON DELETE SET NULL';
  END IF;
END $$;

-- Sourcing runs: link to the mandate they came from (was just position_title before)
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='sourcing_runs') THEN
    EXECUTE 'ALTER TABLE sourcing_runs ADD COLUMN IF NOT EXISTS mandate_id uuid REFERENCES mandates(id) ON DELETE SET NULL';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_sourcing_runs_mandate ON sourcing_runs(mandate_id) WHERE mandate_id IS NOT NULL';
  END IF;
END $$;
