import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Takes Apify scraped candidates and saves them to the prospects table.
 * Auto-detects Quebec, assigns source='apify', default priority medium.
 */

interface SaveRequest {
  candidates: Array<{
    apollo_id?: string;
    source_actor?: string;
    external_id?: string;
    name?: string;
    first_name?: string;
    last_name?: string;
    title?: string;
    email?: string | null;
    phone?: string | null;
    linkedin_url?: string | null;
    company?: string;
    industry?: string;
    location?: string;
  }>;
  owner_id?: string;
  priority?: string;
  icp_score?: number;
}

function splitName(fullName: string): { first: string; last: string } {
  const parts = fullName.trim().split(/\s+/);
  return {
    first: parts[0] ?? '',
    last: parts.slice(1).join(' '),
  };
}

function parseLocation(location: string | null | undefined): {
  city: string | null;
  state: string | null;
  country: string | null;
  isQuebec: boolean;
} {
  if (!location) {
    return { city: null, state: null, country: null, isQuebec: false };
  }
  const parts = location.split(',').map((p) => p.trim());
  const city = parts[0] ?? null;
  const state = parts[1] ?? null;
  const country = parts[parts.length - 1] ?? null;

  const joinedLower = location.toLowerCase();
  const isQuebec =
    joinedLower.includes('quebec') ||
    joinedLower.includes('québec') ||
    joinedLower.includes(' qc') ||
    joinedLower.includes(', qc');

  return { city, state, country, isQuebec };
}

export async function POST(request: Request) {
  try {
    const body: SaveRequest = await request.json();

    if (!body.candidates || body.candidates.length === 0) {
      return NextResponse.json({ error: 'No candidates provided' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    const prospects = body.candidates
      .filter((c) => c.company && (c.name || (c.first_name && c.last_name)))
      .map((c) => {
        let first = c.first_name ?? '';
        let last = c.last_name ?? '';
        if (!first && !last && c.name) {
          const split = splitName(c.name);
          first = split.first;
          last = split.last;
        }

        const loc = parseLocation(c.location);

        return {
          first_name: first || null,
          last_name: last || null,
          title: c.title ?? null,
          email: c.email ?? null,
          phone: c.phone ?? null,
          linkedin_url: c.linkedin_url ?? null,
          company_name: c.company ?? '',
          company_industry: c.industry ?? null,
          company_city: loc.city,
          company_state: loc.state,
          company_country: loc.country,
          is_quebec: loc.isQuebec,
          priority: body.priority ?? 'medium',
          icp_score: body.icp_score ?? 60,
          owner_id: body.owner_id ?? null,
          source: 'apify',
          external_id: c.external_id ?? c.apollo_id ?? null,
          status: 'new',
        };
      });

    if (prospects.length === 0) {
      return NextResponse.json(
        { error: 'No valid candidates (need at least name + company)' },
        { status: 400 }
      );
    }

    const { error, count } = await supabase
      .from('prospects')
      .insert(prospects, { count: 'exact' });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      inserted: count ?? prospects.length,
      flagged_quebec: prospects.filter((p) => p.is_quebec).length,
      with_email: prospects.filter((p) => p.email).length,
      with_linkedin: prospects.filter((p) => p.linkedin_url).length,
    });
  } catch (error) {
    console.error('Save to prospects error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
