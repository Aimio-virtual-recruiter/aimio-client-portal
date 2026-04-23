import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * LinkedIn Profile Enrichment via Apify.
 *
 * Accepts prospect_ids[] OR linkedin_urls[]. Enriches profile data:
 * - first_name / last_name / title / company_name / location
 * - headline / about / experience / education / skills / connections
 *
 * Uses APIFY_LINKEDIN_ENRICH_ACTOR_ID from env by default.
 * Can be overridden per request with `actor_id` in body.
 *
 * Normalizes output from ANY Apify LinkedIn profile actor by mapping
 * common field name variations (firstName / first_name / name, etc.)
 *
 * Anti-cannibalization: skips prospects flagged is_quebec = true.
 */

interface EnrichRequest {
  prospect_ids?: string[];
  linkedin_urls?: string[];
  actor_id?: string;
  /**
   * Input shape hint for the actor:
   * - 'queries_array'  → { queries: ["url1", "url2"] }
   * - 'urls_array'     → { urls: ["url1", "url2"] }
   * - 'profileUrls'    → { profileUrls: ["url1", "url2"] }
   * - 'startUrls'      → { startUrls: [{ url: "url1" }, ...] }
   * - 'queries_objects'→ [{ query: "url1" }, { query: "url2" }]
   * - 'kitchen_sink'   → all of the above combined (default, best compatibility)
   */
  input_shape?: 'queries_array' | 'urls_array' | 'profileUrls' | 'startUrls' | 'queries_objects' | 'kitchen_sink';
}

interface NormalizedProfile {
  linkedin_url: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  headline: string | null;
  title: string | null;
  company_name: string | null;
  location: string | null;
  about: string | null;
  email: string | null;
  phone: string | null;
  skills: string[];
  experience: unknown[];
  education: unknown[];
  connections_count: number | null;
  raw: unknown;
}

/**
 * Extracts a value from an object using multiple possible field name variations.
 */
function pickField(obj: Record<string, unknown>, keys: string[]): unknown {
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null && obj[k] !== '') {
      return obj[k];
    }
  }
  return null;
}

/**
 * Splits a full name into first + last.
 */
function splitName(full: string): { first: string; last: string } {
  const parts = full.trim().split(/\s+/);
  return { first: parts[0] ?? '', last: parts.slice(1).join(' ') };
}

/**
 * Normalizes raw Apify output into a standard shape.
 * Handles variations from different LinkedIn scraper actors.
 */
function normalizeProfile(raw: unknown, fallbackUrl: string): NormalizedProfile {
  const r = (raw ?? {}) as Record<string, unknown>;

  const linkedinUrl = String(
    pickField(r, ['linkedinUrl', 'linkedin_url', 'profileUrl', 'profile_url', 'url', 'query']) ?? fallbackUrl
  );

  // Name handling — try first/last, fall back to splitting full name
  let firstName = pickField(r, ['firstName', 'first_name', 'firstname']) as string | null;
  let lastName = pickField(r, ['lastName', 'last_name', 'lastname']) as string | null;
  const fullName = pickField(r, ['fullName', 'full_name', 'name']) as string | null;

  if (!firstName && !lastName && fullName) {
    const split = splitName(fullName);
    firstName = split.first;
    lastName = split.last;
  }

  // Skills — normalize to string[] regardless of input shape
  let skills: string[] = [];
  const rawSkills = r.skills;
  if (Array.isArray(rawSkills)) {
    skills = rawSkills
      .map((s: unknown) => {
        if (typeof s === 'string') return s;
        if (s && typeof s === 'object') {
          const o = s as Record<string, unknown>;
          return (o.name ?? o.skill ?? o.title ?? '') as string;
        }
        return '';
      })
      .filter((s) => s.length > 0);
  }

  const experience = (r.experience ?? r.experiences ?? r.positions ?? []) as unknown[];
  const education = (r.education ?? r.educations ?? r.schools ?? []) as unknown[];

  return {
    linkedin_url: linkedinUrl,
    first_name: firstName ?? null,
    last_name: lastName ?? null,
    full_name: fullName ?? null,
    headline: (pickField(r, ['headline', 'subTitle', 'sub_title']) as string | null) ?? null,
    title: (pickField(r, [
      'currentPosition',
      'current_position',
      'title',
      'position',
      'jobTitle',
      'job_title',
      'occupation',
    ]) as string | null) ?? null,
    company_name: (pickField(r, [
      'currentCompany',
      'current_company',
      'companyName',
      'company_name',
      'company',
    ]) as string | null) ?? null,
    location: (pickField(r, [
      'location',
      'geoLocationName',
      'geo_location_name',
      'locationName',
      'city',
    ]) as string | null) ?? null,
    about: (pickField(r, ['about', 'summary', 'description', 'bio']) as string | null) ?? null,
    email: (pickField(r, ['email', 'emailAddress', 'email_address']) as string | null) ?? null,
    phone: (pickField(r, ['phone', 'phoneNumber', 'phone_number', 'mobileNumber']) as string | null) ?? null,
    skills,
    experience: Array.isArray(experience) ? experience : [],
    education: Array.isArray(education) ? education : [],
    connections_count:
      (pickField(r, ['connectionsCount', 'connections_count', 'connections']) as number | null) ?? null,
    raw: r,
  };
}

/**
 * Builds the actor input payload in the requested shape.
 * 'kitchen_sink' passes multiple shapes so most actors find what they need.
 */
function buildInput(
  urls: string[],
  shape: EnrichRequest['input_shape'] = 'kitchen_sink'
): Record<string, unknown> | Array<Record<string, unknown>> {
  switch (shape) {
    case 'queries_array':
      return { queries: urls };
    case 'urls_array':
      return { urls };
    case 'profileUrls':
      return { profileUrls: urls };
    case 'startUrls':
      return { startUrls: urls.map((url) => ({ url })) };
    case 'queries_objects':
      return urls.map((query) => ({ query }));
    case 'kitchen_sink':
    default:
      // Send all common shapes — most actors ignore unknown fields
      return {
        queries: urls,
        urls,
        profileUrls: urls,
        startUrls: urls.map((url) => ({ url })),
        maxItems: urls.length,
      };
  }
}

/**
 * Calls Apify actor via run-sync endpoint (waits for completion, returns dataset).
 */
async function runApifyActor(
  actorId: string,
  apifyToken: string,
  urls: string[],
  inputShape: EnrichRequest['input_shape']
): Promise<unknown[]> {
  const endpoint = `https://api.apify.com/v2/acts/${encodeURIComponent(
    actorId
  )}/run-sync-get-dataset-items?token=${apifyToken}`;

  const input = buildInput(urls, inputShape);

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Apify actor ${actorId} failed (${res.status}): ${err.slice(0, 500)}`);
  }

  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function POST(request: Request) {
  try {
    const body: EnrichRequest = await request.json();

    const apifyToken = process.env.APIFY_TOKEN;
    const defaultActorId = process.env.APIFY_LINKEDIN_ENRICH_ACTOR_ID;
    const actorId = body.actor_id ?? defaultActorId;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!apifyToken) {
      return NextResponse.json(
        { error: 'APIFY_TOKEN not set in Vercel env vars' },
        { status: 500 }
      );
    }
    if (!actorId) {
      return NextResponse.json(
        { error: 'APIFY_LINKEDIN_ENRICH_ACTOR_ID not set — or provide actor_id in body' },
        { status: 500 }
      );
    }
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // ------------------------------------------------------------------
    // Resolve LinkedIn URLs to enrich
    // ------------------------------------------------------------------
    let urls: string[] = [...(body.linkedin_urls ?? [])];
    const urlToProspectId: Record<string, string> = {};

    if (body.prospect_ids && body.prospect_ids.length > 0) {
      const { data: prospects, error } = await supabase
        .from('prospects')
        .select('id, linkedin_url, is_quebec')
        .in('id', body.prospect_ids)
        .not('linkedin_url', 'is', null)
        .eq('is_quebec', false); // Anti-cannibalization

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      for (const p of prospects ?? []) {
        if (p.linkedin_url) {
          urls.push(p.linkedin_url);
          urlToProspectId[p.linkedin_url] = p.id;
        }
      }
    }

    if (urls.length === 0) {
      return NextResponse.json(
        { error: 'No LinkedIn URLs to enrich (provide prospect_ids or linkedin_urls)' },
        { status: 400 }
      );
    }

    // Dedupe
    urls = [...new Set(urls)];

    // Hard limit to protect Apify budget
    if (urls.length > 500) {
      return NextResponse.json(
        { error: 'Maximum 500 URLs per request — split into batches' },
        { status: 400 }
      );
    }

    // ------------------------------------------------------------------
    // Call Apify
    // ------------------------------------------------------------------
    const rawResults = await runApifyActor(actorId, apifyToken, urls, body.input_shape);

    const profiles = rawResults.map((raw, i) => normalizeProfile(raw, urls[i] ?? ''));

    // ------------------------------------------------------------------
    // Save to Supabase (update if exists, insert if new)
    // ------------------------------------------------------------------
    let updatedCount = 0;
    let insertedCount = 0;
    const errors: string[] = [];

    for (const p of profiles) {
      const existingId = urlToProspectId[p.linkedin_url];
      const locationParts = p.location?.split(',').map((s) => s.trim()) ?? [];

      // Build partial update payload — only include fields with values
      const payload: Record<string, unknown> = {
        linkedin_headline: p.headline,
        linkedin_about: p.about,
        linkedin_experience: p.experience,
        linkedin_education: p.education,
        linkedin_skills: p.skills,
        linkedin_connections_count: p.connections_count,
        linkedin_location: p.location,
        linkedin_enriched_at: new Date().toISOString(),
        linkedin_enricher_used: actorId,
        linkedin_raw_data: p.raw,
        updated_at: new Date().toISOString(),
      };

      // Only backfill core fields if they're missing
      if (p.first_name) payload.first_name_enriched = p.first_name;
      if (p.last_name) payload.last_name_enriched = p.last_name;
      if (p.title) payload.title_enriched = p.title;
      if (p.company_name) payload.company_name_enriched = p.company_name;
      if (p.email) payload.email_from_linkedin = p.email;
      if (p.phone) payload.phone_from_linkedin = p.phone;
      if (locationParts[0]) payload.company_city_from_linkedin = locationParts[0];

      // Clean payload: remove _enriched suffix — overwrite directly if empty
      if (existingId) {
        // Update existing prospect — only overwrite core fields if they're currently empty
        const { data: current } = await supabase
          .from('prospects')
          .select('first_name, last_name, title, company_name, email, phone, company_city')
          .eq('id', existingId)
          .single();

        const updates: Record<string, unknown> = {
          linkedin_headline: payload.linkedin_headline,
          linkedin_about: payload.linkedin_about,
          linkedin_experience: payload.linkedin_experience,
          linkedin_education: payload.linkedin_education,
          linkedin_skills: payload.linkedin_skills,
          linkedin_connections_count: payload.linkedin_connections_count,
          linkedin_location: payload.linkedin_location,
          linkedin_enriched_at: payload.linkedin_enriched_at,
          linkedin_enricher_used: payload.linkedin_enricher_used,
          linkedin_raw_data: payload.linkedin_raw_data,
          updated_at: payload.updated_at,
        };

        // Backfill core fields only if empty
        if (!current?.first_name && p.first_name) updates.first_name = p.first_name;
        if (!current?.last_name && p.last_name) updates.last_name = p.last_name;
        if (!current?.title && p.title) updates.title = p.title;
        if (!current?.company_name && p.company_name) updates.company_name = p.company_name;
        if (!current?.email && p.email) updates.email = p.email;
        if (!current?.phone && p.phone) updates.phone = p.phone;
        if (!current?.company_city && locationParts[0]) updates.company_city = locationParts[0];

        const { error } = await supabase.from('prospects').update(updates).eq('id', existingId);
        if (error) {
          errors.push(`update ${existingId}: ${error.message}`);
        } else {
          updatedCount++;
        }
      } else {
        // Insert new prospect from LinkedIn URL alone
        if (!p.full_name && !p.first_name && !p.last_name) {
          errors.push(`skip ${p.linkedin_url}: no name found`);
          continue;
        }

        const insertPayload = {
          first_name: p.first_name,
          last_name: p.last_name,
          title: p.title,
          email: p.email,
          phone: p.phone,
          linkedin_url: p.linkedin_url,
          company_name: p.company_name ?? '',
          company_city: locationParts[0] ?? null,
          company_state: locationParts[1] ?? null,
          company_country: locationParts[locationParts.length - 1] ?? null,
          is_quebec: false, // LinkedIn enrichment is always non-Quebec (user filters upstream)
          priority: 'medium',
          icp_score: 60,
          source: 'apify_linkedin',
          status: 'new',
          linkedin_headline: p.headline,
          linkedin_about: p.about,
          linkedin_experience: p.experience,
          linkedin_education: p.education,
          linkedin_skills: p.skills,
          linkedin_connections_count: p.connections_count,
          linkedin_location: p.location,
          linkedin_enriched_at: new Date().toISOString(),
          linkedin_enricher_used: actorId,
          linkedin_raw_data: p.raw,
        };

        const { error } = await supabase.from('prospects').insert(insertPayload);
        if (error) {
          errors.push(`insert ${p.linkedin_url}: ${error.message}`);
        } else {
          insertedCount++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      actor_used: actorId,
      urls_requested: urls.length,
      profiles_scraped: profiles.length,
      prospects_updated: updatedCount,
      prospects_inserted: insertedCount,
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
    });
  } catch (error) {
    console.error('LinkedIn enrichment error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
