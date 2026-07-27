-- ════════════════════════════════════════════════════════════════════════
-- Quick EOD — rapport de fin de journée natif Aimio OS
-- Date: 2026-07-26
-- Run in: Supabase Dashboard → SQL Editor
-- Safe to re-run (idempotent)
-- ════════════════════════════════════════════════════════════════════════
-- Remplace la saisie EOD Airtable (trop longue). Mode rapide = 8 chiffres
-- + note. Le reste (détail) est optionnel. Un seul EOD par recruteur/jour.
-- Le recruteur = une ligne profiles (auth.uid()). L'admin voit tout.

CREATE TABLE IF NOT EXISTS recruiter_eod (
  id             bigserial PRIMARY KEY,
  recruiter_id   uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  eod_date       date NOT NULL DEFAULT CURRENT_DATE,

  -- ── Mode rapide : les 8 chiffres du funnel ────────────────────────────
  prescreenings   integer NOT NULL DEFAULT 0,  -- prescreenings réalisés
  calls           integer NOT NULL DEFAULT 0,  -- appels passés
  submissions     integer NOT NULL DEFAULT 0,  -- candidats soumis au client
  interviews_held integer NOT NULL DEFAULT 0,  -- entrevues client tenues
  offers          integer NOT NULL DEFAULT 0,  -- offres faites
  offers_accepted integer NOT NULL DEFAULT 0,  -- offres acceptées
  placements      integer NOT NULL DEFAULT 0,  -- placements closés
  postings        integer NOT NULL DEFAULT 0,  -- affichages publiés

  -- ── Note + heures ─────────────────────────────────────────────────────
  help_needed    text,               -- "Aide dont j'ai besoin" (radar détresse remote)
  day_feedback   text,               -- "Feedback de la journée" (optionnel)
  hours_worked   numeric(4,1),       -- heures travaillées

  -- ── Mode détail (optionnel — jamais obligatoire) ──────────────────────
  candidates_sourced integer,
  calls_connected    integer,
  linkedin_messages  integer,
  linkedin_replies   integer,
  inmails_sent       integer,
  inmails_replies    integer,
  cold_emails        integer,
  email_replies      integer,

  -- ── Méta ──────────────────────────────────────────────────────────────
  source     text DEFAULT 'aimio_os',   -- 'aimio_os' | 'airtable_import'
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  UNIQUE (recruiter_id, eod_date)
);

CREATE INDEX IF NOT EXISTS idx_recruiter_eod_recruiter_date
  ON recruiter_eod(recruiter_id, eod_date DESC);
CREATE INDEX IF NOT EXISTS idx_recruiter_eod_date
  ON recruiter_eod(eod_date DESC);

-- ── RLS ─────────────────────────────────────────────────────────────────
ALTER TABLE recruiter_eod ENABLE ROW LEVEL SECURITY;

-- Lecture : l'admin voit tout ; le recruteur voit ses propres EOD.
DROP POLICY IF EXISTS "eod_select" ON recruiter_eod;
CREATE POLICY "eod_select" ON recruiter_eod
  FOR SELECT USING (
    (auth.jwt()->'app_metadata'->>'role')::text = 'admin'
    OR recruiter_id = auth.uid()
  );

-- Insertion : le recruteur crée ses propres EOD ; l'admin peut en créer pour autrui.
DROP POLICY IF EXISTS "eod_insert" ON recruiter_eod;
CREATE POLICY "eod_insert" ON recruiter_eod
  FOR INSERT WITH CHECK (
    (auth.jwt()->'app_metadata'->>'role')::text = 'admin'
    OR recruiter_id = auth.uid()
  );

-- Mise à jour : idem (corriger son EOD du jour).
DROP POLICY IF EXISTS "eod_update" ON recruiter_eod;
CREATE POLICY "eod_update" ON recruiter_eod
  FOR UPDATE USING (
    (auth.jwt()->'app_metadata'->>'role')::text = 'admin'
    OR recruiter_id = auth.uid()
  );
