import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * WATERFALL ENRICHMENT
 * Order: Apollo → SalesQL → Hunter → Dropcontact → Clay
 * Stops as soon as email + phone are both found.
 */

interface EnrichRequest {
  prospect_id: string;
}

interface EnrichmentResult {
  email?: string | null;
  email_verified?: boolean;
  phone?: string | null;
  linkedin_url?: string | null;
  title?: string | null;
  source: string;
  success: boolean;
  error?: string;
}

// ─────────────────────────────────────────────────────────
// PROVIDER: APOLLO (/people/match)
// ─────────────────────────────────────────────────────────
async function enrichApollo(params: {
  first_name?: string;
  last_name?: string;
  email?: string;
  linkedin_url?: string;
  organization_name?: string;
}): Promise<EnrichmentResult> {
  const apiKey = process.env.APOLLO_API_KEY;
  if (!apiKey) {
    return { source: 'apollo', success: false, error: 'APOLLO_API_KEY not set' };
  }

  try {
    const payload: Record<string, unknown> = {};
    if (params.first_name) payload.first_name = params.first_name;
    if (params.last_name) payload.last_name = params.last_name;
    if (params.email) payload.email = params.email;
    if (params.linkedin_url) payload.linkedin_url = params.linkedin_url;
    if (params.organization_name) payload.organization_name = params.organization_name;

    const res = await fetch('https://api.apollo.io/api/v1/people/match', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      return { source: 'apollo', success: false, error: `HTTP ${res.status}` };
    }

    const data = await res.json();
    if (!data.person) {
      return { source: 'apollo', success: false, error: 'No match' };
    }

    return {
      email: data.person.email ?? null,
      email_verified: data.person.email_status === 'verified',
      phone: data.person.phone ?? null,
      linkedin_url: data.person.linkedin_url ?? null,
      title: data.person.title ?? null,
      source: 'apollo',
      success: !!data.person.email || !!data.person.phone,
    };
  } catch (err) {
    return {
      source: 'apollo',
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

// ─────────────────────────────────────────────────────────
// PROVIDER: SALESQL
// ─────────────────────────────────────────────────────────
async function enrichSalesQL(params: {
  first_name?: string;
  last_name?: string;
  company_name?: string;
  linkedin_url?: string;
}): Promise<EnrichmentResult> {
  const apiKey = process.env.SALESQL_API_KEY;
  if (!apiKey) {
    return { source: 'salesql', success: false, error: 'SALESQL_API_KEY not set' };
  }

  try {
    // SalesQL API: https://salesql.com/api
    // POST /v1/contacts/enrich with X-API-Key header
    const body: Record<string, unknown> = {};
    if (params.linkedin_url) body.linkedin_url = params.linkedin_url;
    if (params.first_name) body.first_name = params.first_name;
    if (params.last_name) body.last_name = params.last_name;
    if (params.company_name) body.company_name = params.company_name;

    const res = await fetch('https://api.salesql.com/v1/contacts/enrich', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      return {
        source: 'salesql',
        success: false,
        error: `HTTP ${res.status}: ${await res.text().catch(() => '')}`,
      };
    }

    const data = await res.json();

    // SalesQL returns : emails[], phones[], contact info
    const email = data.emails?.[0]?.email ?? data.email ?? null;
    const phone = data.phones?.[0]?.phone ?? data.phone ?? null;

    return {
      email,
      email_verified: data.emails?.[0]?.verified ?? false,
      phone,
      linkedin_url: data.linkedin_url ?? params.linkedin_url ?? null,
      title: data.title ?? data.job_title ?? null,
      source: 'salesql',
      success: !!email || !!phone,
    };
  } catch (err) {
    return {
      source: 'salesql',
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

// ─────────────────────────────────────────────────────────
// PROVIDER: ROCKETREACH (700M+ database — largest)
// ─────────────────────────────────────────────────────────
async function enrichRocketReach(params: {
  first_name?: string;
  last_name?: string;
  company_name?: string;
  linkedin_url?: string;
}): Promise<EnrichmentResult> {
  const apiKey = process.env.ROCKETREACH_API_KEY;
  if (!apiKey) {
    return { source: 'rocketreach', success: false, error: 'ROCKETREACH_API_KEY not set' };
  }

  try {
    // RocketReach API: https://api.rocketreach.co/v2/person/lookup
    const queryParams: Record<string, string> = {};
    if (params.linkedin_url) queryParams.linkedin_url = params.linkedin_url;
    if (params.first_name) queryParams.first_name = params.first_name;
    if (params.last_name) queryParams.last_name = params.last_name;
    if (params.company_name) queryParams.current_employer = params.company_name;

    const qs = new URLSearchParams(queryParams).toString();
    const res = await fetch(`https://api.rocketreach.co/v2/person/lookup?${qs}`, {
      method: 'GET',
      headers: {
        'Api-Key': apiKey,
      },
    });

    if (!res.ok) {
      return {
        source: 'rocketreach',
        success: false,
        error: `HTTP ${res.status}`,
      };
    }

    const data = await res.json();

    // RocketReach returns: emails[], phones[], current_title, etc.
    const primaryEmail = data.emails?.find((e: { smtp_valid?: string; type?: string }) => e.smtp_valid === 'valid')?.email ?? data.emails?.[0]?.email ?? null;
    const primaryPhone = data.phones?.[0]?.number ?? null;

    return {
      email: primaryEmail,
      email_verified:
        data.emails?.find((e: { smtp_valid?: string }) => e.smtp_valid === 'valid') !== undefined,
      phone: primaryPhone,
      linkedin_url: data.linkedin_url ?? params.linkedin_url ?? null,
      title: data.current_title ?? null,
      source: 'rocketreach',
      success: !!primaryEmail || !!primaryPhone,
    };
  } catch (err) {
    return {
      source: 'rocketreach',
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

// ─────────────────────────────────────────────────────────
// PROVIDER: HUNTER.IO
// ─────────────────────────────────────────────────────────
async function enrichHunter(params: {
  first_name?: string;
  last_name?: string;
  company_domain?: string;
}): Promise<EnrichmentResult> {
  const apiKey = process.env.HUNTER_API_KEY;
  if (!apiKey) {
    return { source: 'hunter', success: false, error: 'HUNTER_API_KEY not set' };
  }
  if (!params.company_domain || !params.first_name || !params.last_name) {
    return {
      source: 'hunter',
      success: false,
      error: 'Requires domain + first + last name',
    };
  }

  try {
    const url = `https://api.hunter.io/v2/email-finder?domain=${encodeURIComponent(
      params.company_domain
    )}&first_name=${encodeURIComponent(params.first_name)}&last_name=${encodeURIComponent(
      params.last_name
    )}&api_key=${apiKey}`;

    const res = await fetch(url);
    if (!res.ok) {
      return { source: 'hunter', success: false, error: `HTTP ${res.status}` };
    }

    const data = await res.json();
    const email = data.data?.email ?? null;
    const confidence = data.data?.score ?? 0;

    return {
      email,
      email_verified: confidence >= 80,
      source: 'hunter',
      success: !!email,
    };
  } catch (err) {
    return {
      source: 'hunter',
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

// ─────────────────────────────────────────────────────────
// MAIN WATERFALL
// ─────────────────────────────────────────────────────────
export async function POST(request: Request) {
  try {
    const body: EnrichRequest = await request.json();

    if (!body.prospect_id) {
      return NextResponse.json({ error: 'prospect_id required' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Load prospect
    const { data: prospect, error: pErr } = await supabase
      .from('prospects')
      .select('*')
      .eq('id', body.prospect_id)
      .single();

    if (pErr || !prospect) {
      return NextResponse.json({ error: 'Prospect not found' }, { status: 404 });
    }

    // Extract company domain from email if present
    const existingDomain = prospect.email?.split('@')?.[1] ?? prospect.company_domain ?? null;

    // Params shared across providers
    const params = {
      first_name: prospect.first_name ?? undefined,
      last_name: prospect.last_name ?? undefined,
      email: prospect.email ?? undefined,
      linkedin_url: prospect.linkedin_url ?? undefined,
      organization_name: prospect.company_name ?? undefined,
      company_name: prospect.company_name ?? undefined,
      company_domain: existingDomain ?? undefined,
    };

    const attempts: EnrichmentResult[] = [];

    // Best email + phone found so far
    let bestEmail: string | null = prospect.email ?? null;
    let bestPhone: string | null = prospect.phone ?? null;
    let bestLinkedIn: string | null = prospect.linkedin_url ?? null;
    let bestTitle: string | null = prospect.title ?? null;
    let bestEmailVerified = prospect.email_verified ?? false;
    let usedSource: string | null = null;

    // Helper to stop when satisfied
    const enoughData = () => bestEmail && bestPhone;

    // ─── Attempt 1: Apollo ───────────────────────
    if (!enoughData()) {
      const r = await enrichApollo(params);
      attempts.push(r);
      if (r.success) {
        if (!bestEmail && r.email) {
          bestEmail = r.email;
          bestEmailVerified = r.email_verified ?? false;
          usedSource = r.source;
        }
        if (!bestPhone && r.phone) {
          bestPhone = r.phone;
          usedSource = usedSource ?? r.source;
        }
        if (!bestLinkedIn && r.linkedin_url) bestLinkedIn = r.linkedin_url;
        if (!bestTitle && r.title) bestTitle = r.title;
      }
    }

    // ─── Attempt 2: SalesQL ──────────────────────
    if (!enoughData()) {
      const r = await enrichSalesQL(params);
      attempts.push(r);
      if (r.success) {
        if (!bestEmail && r.email) {
          bestEmail = r.email;
          bestEmailVerified = r.email_verified ?? false;
          usedSource = usedSource ?? r.source;
        }
        if (!bestPhone && r.phone) {
          bestPhone = r.phone;
          usedSource = usedSource ?? r.source;
        }
        if (!bestLinkedIn && r.linkedin_url) bestLinkedIn = r.linkedin_url;
        if (!bestTitle && r.title) bestTitle = r.title;
      }
    }

    // ─── Attempt 3: RocketReach (700M+ database) ─
    if (!enoughData()) {
      const r = await enrichRocketReach(params);
      attempts.push(r);
      if (r.success) {
        if (!bestEmail && r.email) {
          bestEmail = r.email;
          bestEmailVerified = r.email_verified ?? false;
          usedSource = usedSource ?? r.source;
        }
        if (!bestPhone && r.phone) {
          bestPhone = r.phone;
          usedSource = usedSource ?? r.source;
        }
        if (!bestLinkedIn && r.linkedin_url) bestLinkedIn = r.linkedin_url;
        if (!bestTitle && r.title) bestTitle = r.title;
      }
    }

    // ─── Attempt 4: Hunter.io ────────────────────
    if (!enoughData()) {
      const r = await enrichHunter(params);
      attempts.push(r);
      if (r.success && !bestEmail && r.email) {
        bestEmail = r.email;
        bestEmailVerified = r.email_verified ?? false;
        usedSource = usedSource ?? r.source;
      }
    }

    // Update prospect in DB
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (bestEmail && bestEmail !== prospect.email) updates.email = bestEmail;
    if (bestEmailVerified !== prospect.email_verified) updates.email_verified = bestEmailVerified;
    if (bestPhone && bestPhone !== prospect.phone) updates.phone = bestPhone;
    if (bestLinkedIn && bestLinkedIn !== prospect.linkedin_url) updates.linkedin_url = bestLinkedIn;
    if (bestTitle && bestTitle !== prospect.title) updates.title = bestTitle;

    if (Object.keys(updates).length > 1) {
      const { error: uErr } = await supabase
        .from('prospects')
        .update(updates)
        .eq('id', body.prospect_id);

      if (uErr) {
        console.error('Update error:', uErr);
      }
    }

    const foundEmail = bestEmail !== prospect.email;
    const foundPhone = bestPhone !== prospect.phone;

    return NextResponse.json({
      success: foundEmail || foundPhone,
      found_email: foundEmail,
      found_phone: foundPhone,
      final_email: bestEmail,
      final_phone: bestPhone,
      source_used: usedSource,
      attempts,
    });
  } catch (error) {
    console.error('Waterfall error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
