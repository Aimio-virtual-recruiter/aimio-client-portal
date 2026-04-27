-- ════════════════════════════════════════════════════════════════════════════
-- Migration: Security hardening + missing columns/tables
-- Date: 2026-04-26
-- Run in: Supabase Dashboard → SQL Editor → New query → paste → Run
-- Safe to run multiple times (idempotent)
-- ════════════════════════════════════════════════════════════════════════════

-- ─── 1. WEBHOOK_EVENTS table (idempotency for Stripe + Instantly + future webhooks)
CREATE TABLE IF NOT EXISTS webhook_events (
    id           bigserial PRIMARY KEY,
    source       text NOT NULL,         -- 'stripe', 'instantly', etc.
    event_id     text NOT NULL,         -- the upstream provider's event id
    event_type   text,                  -- e.g. 'invoice.paid', 'email_replied'
    received_at  timestamptz DEFAULT now(),
    UNIQUE (source, event_id)
);
CREATE INDEX IF NOT EXISTS idx_webhook_events_source_event ON webhook_events(source, event_id);

-- Stripe-specific table (legacy compat — only used if you prefer single-purpose tables)
CREATE TABLE IF NOT EXISTS stripe_webhook_events (
    id          text PRIMARY KEY,      -- the stripe event.id
    type        text,
    created_at  timestamptz DEFAULT now()
);

-- ─── 2. SOURCED_CANDIDATES — feedback columns from client decisions
ALTER TABLE sourced_candidates
    ADD COLUMN IF NOT EXISTS client_feedback_reason text,
    ADD COLUMN IF NOT EXISTS client_feedback_at     timestamptz;

-- ─── 3. CLIENTS — direct UUID link to assigned recruiter (replaces fragile string match)
ALTER TABLE clients
    ADD COLUMN IF NOT EXISTS recruiter_id uuid REFERENCES profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_clients_recruiter_id ON clients(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_billing_status ON clients(billing_status);
CREATE INDEX IF NOT EXISTS idx_clients_stripe_customer ON clients(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;

-- ─── 4. CRITICAL INDEXES (10-100× speedup on common queries)

-- sourced_candidates: most filtered table
CREATE INDEX IF NOT EXISTS idx_sourced_candidates_client_status
    ON sourced_candidates(client_id, status);
CREATE INDEX IF NOT EXISTS idx_sourced_candidates_status
    ON sourced_candidates(status);
CREATE INDEX IF NOT EXISTS idx_sourced_candidates_delivered_at
    ON sourced_candidates(delivered_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_sourced_candidates_ai_score
    ON sourced_candidates(ai_score DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_sourced_candidates_sourcing_run
    ON sourced_candidates(sourcing_run_id);
CREATE INDEX IF NOT EXISTS idx_sourced_candidates_linkedin_url
    ON sourced_candidates(linkedin_url) WHERE linkedin_url IS NOT NULL;

-- prospects: webhook lookup by email + waterfall enrichment
CREATE INDEX IF NOT EXISTS idx_prospects_email
    ON prospects(lower(email)) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_prospects_status
    ON prospects(status);
CREATE INDEX IF NOT EXISTS idx_prospects_assigned_rep
    ON prospects(assigned_rep_id) WHERE assigned_rep_id IS NOT NULL;

-- messages: thread queries
CREATE INDEX IF NOT EXISTS idx_messages_thread_created
    ON messages(thread_id, created_at);

-- message_threads: route lookup
CREATE INDEX IF NOT EXISTS idx_message_threads_client_recruiter
    ON message_threads(client_id, recruiter_id);

-- profiles: role + client_company_id lookup (for getCurrentClientId)
CREATE INDEX IF NOT EXISTS idx_profiles_role
    ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_client_company
    ON profiles(client_company_id) WHERE client_company_id IS NOT NULL;

-- mandates: client filter
CREATE INDEX IF NOT EXISTS idx_mandates_company
    ON mandates(company_id);
CREATE INDEX IF NOT EXISTS idx_mandates_status
    ON mandates(status);

-- sourcing_runs: lookup by client + status
CREATE INDEX IF NOT EXISTS idx_sourcing_runs_client_status
    ON sourcing_runs(client_id, status);

-- outreach_emails: pending lookup for auto-followup
CREATE INDEX IF NOT EXISTS idx_outreach_emails_status_replied
    ON outreach_emails(status, replied_at);

-- sales_activities: lookup by prospect + client
CREATE INDEX IF NOT EXISTS idx_sales_activities_prospect
    ON sales_activities(prospect_id) WHERE prospect_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sales_activities_client
    ON sales_activities(client_id) WHERE client_id IS NOT NULL;

-- ─── 5. AUTH HOOK — inject role into JWT (saves ~50ms per request in middleware)
-- After running this, ALSO go to: Supabase Dashboard → Authentication → Hooks → Custom Access Token
-- And select the function: public.custom_access_token_hook

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    claims jsonb;
    user_role text;
    user_client_company_id uuid;
BEGIN
    -- Get the user's role + tenant from profiles
    SELECT role, client_company_id
      INTO user_role, user_client_company_id
      FROM public.profiles
      WHERE id = (event->>'user_id')::uuid;

    claims := event->'claims';

    -- Inject role + client_company_id into JWT app_metadata
    IF user_role IS NOT NULL THEN
        claims := jsonb_set(
            claims,
            '{app_metadata,role}',
            to_jsonb(user_role)
        );
    END IF;

    IF user_client_company_id IS NOT NULL THEN
        claims := jsonb_set(
            claims,
            '{app_metadata,client_company_id}',
            to_jsonb(user_client_company_id::text)
        );
    END IF;

    event := jsonb_set(event, '{claims}', claims);

    RETURN event;
END;
$$;

-- Grant supabase_auth_admin permission to call the hook
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) TO supabase_auth_admin;
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT SELECT ON public.profiles TO supabase_auth_admin;

-- ─── 6. ROW LEVEL SECURITY (defense in depth — even if API bug, DB blocks bad reads)

-- Enable RLS on critical tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE sourced_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE mandates ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- profiles: anyone can read their own profile; admins read all
DROP POLICY IF EXISTS "users_read_own_profile" ON profiles;
CREATE POLICY "users_read_own_profile" ON profiles
    FOR SELECT USING (auth.uid() = id OR (auth.jwt()->'app_metadata'->>'role')::text = 'admin');

DROP POLICY IF EXISTS "users_update_own_profile" ON profiles;
CREATE POLICY "users_update_own_profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- clients: client users see only their company; recruiters see assigned; admins see all
DROP POLICY IF EXISTS "tenant_clients_select" ON clients;
CREATE POLICY "tenant_clients_select" ON clients
    FOR SELECT USING (
        (auth.jwt()->'app_metadata'->>'role')::text = 'admin'
        OR id = ((auth.jwt()->'app_metadata'->>'client_company_id')::uuid)
        OR id IN (
            SELECT unnest(assigned_client_ids) FROM profiles WHERE id = auth.uid()
        )
    );

-- sourced_candidates: same tenant rules
DROP POLICY IF EXISTS "tenant_sourced_candidates_select" ON sourced_candidates;
CREATE POLICY "tenant_sourced_candidates_select" ON sourced_candidates
    FOR SELECT USING (
        (auth.jwt()->'app_metadata'->>'role')::text IN ('admin', 'recruiter')
        OR client_id = ((auth.jwt()->'app_metadata'->>'client_company_id')::uuid)
    );

DROP POLICY IF EXISTS "tenant_sourced_candidates_update" ON sourced_candidates;
CREATE POLICY "tenant_sourced_candidates_update" ON sourced_candidates
    FOR UPDATE USING (
        (auth.jwt()->'app_metadata'->>'role')::text IN ('admin', 'recruiter')
        OR client_id = ((auth.jwt()->'app_metadata'->>'client_company_id')::uuid)
    );

-- messages: only thread participants
DROP POLICY IF EXISTS "thread_messages_select" ON messages;
CREATE POLICY "thread_messages_select" ON messages
    FOR SELECT USING (
        (auth.jwt()->'app_metadata'->>'role')::text = 'admin'
        OR thread_id IN (
            SELECT id FROM message_threads
            WHERE client_id = ((auth.jwt()->'app_metadata'->>'client_company_id')::uuid)
               OR recruiter_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "thread_messages_insert" ON messages;
CREATE POLICY "thread_messages_insert" ON messages
    FOR INSERT WITH CHECK (
        (auth.jwt()->'app_metadata'->>'role')::text = 'admin'
        OR thread_id IN (
            SELECT id FROM message_threads
            WHERE client_id = ((auth.jwt()->'app_metadata'->>'client_company_id')::uuid)
               OR recruiter_id = auth.uid()
        )
    );

-- message_threads: select by participation
DROP POLICY IF EXISTS "thread_select" ON message_threads;
CREATE POLICY "thread_select" ON message_threads
    FOR SELECT USING (
        (auth.jwt()->'app_metadata'->>'role')::text = 'admin'
        OR client_id = ((auth.jwt()->'app_metadata'->>'client_company_id')::uuid)
        OR recruiter_id = auth.uid()
    );

-- mandates: tenant-scoped
DROP POLICY IF EXISTS "tenant_mandates_select" ON mandates;
CREATE POLICY "tenant_mandates_select" ON mandates
    FOR SELECT USING (
        (auth.jwt()->'app_metadata'->>'role')::text IN ('admin', 'recruiter')
        OR company_id = ((auth.jwt()->'app_metadata'->>'client_company_id')::uuid)
    );

DROP POLICY IF EXISTS "tenant_mandates_insert" ON mandates;
CREATE POLICY "tenant_mandates_insert" ON mandates
    FOR INSERT WITH CHECK (
        (auth.jwt()->'app_metadata'->>'role')::text IN ('admin', 'recruiter')
        OR company_id = ((auth.jwt()->'app_metadata'->>'client_company_id')::uuid)
    );

-- ─── 7. UTILITY: trigger to auto-add profile when a user signs up
-- (Many auth flows skip this, leaving users with no profile row)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, first_name, last_name, role, client_company_id)
    VALUES (
        new.id,
        coalesce(new.raw_user_meta_data->>'first_name', ''),
        coalesce(new.raw_user_meta_data->>'last_name', ''),
        coalesce(new.raw_user_meta_data->>'role', 'client'),
        nullif(new.raw_user_meta_data->>'client_company_id', '')::uuid
    )
    ON CONFLICT (id) DO UPDATE SET
        first_name        = EXCLUDED.first_name,
        last_name         = EXCLUDED.last_name,
        role              = EXCLUDED.role,
        client_company_id = EXCLUDED.client_company_id;
    RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ════════════════════════════════════════════════════════════════════════════
-- DONE. Verification queries:
-- ════════════════════════════════════════════════════════════════════════════

-- Check tables exist
SELECT 'webhook_events' AS table, count(*) FROM webhook_events
UNION ALL SELECT 'stripe_webhook_events', count(*) FROM stripe_webhook_events;

-- Check columns added
SELECT column_name FROM information_schema.columns
 WHERE table_name = 'sourced_candidates' AND column_name IN ('client_feedback_reason','client_feedback_at');

SELECT column_name FROM information_schema.columns
 WHERE table_name = 'clients' AND column_name = 'recruiter_id';

-- Check key indexes
SELECT indexname FROM pg_indexes
 WHERE schemaname = 'public' AND indexname LIKE 'idx_%'
 ORDER BY indexname;

-- Check RLS enabled
SELECT tablename, rowsecurity FROM pg_tables
 WHERE schemaname = 'public'
   AND tablename IN ('clients','sourced_candidates','messages','message_threads','mandates','profiles');
