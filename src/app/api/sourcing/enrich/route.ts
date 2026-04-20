import { NextResponse } from 'next/server';

// Apollo /people/match endpoint — works on all paid plans (including Basic)
const APOLLO_MATCH_URL = 'https://api.apollo.io/api/v1/people/match';

interface EnrichRequest {
  first_name?: string;
  last_name?: string;
  name?: string;
  email?: string;
  domain?: string;
  organization_name?: string;
  linkedin_url?: string;
}

interface ApolloMatchResponse {
  person?: {
    id?: string;
    first_name?: string;
    last_name?: string;
    name?: string;
    linkedin_url?: string;
    title?: string;
    headline?: string;
    photo_url?: string;
    email?: string;
    email_status?: string;
    phone?: string;
    city?: string;
    state?: string;
    country?: string;
    formatted_address?: string;
    seniority?: string;
    employment_history?: Array<{
      title?: string;
      organization_name?: string;
      start_date?: string;
      end_date?: string | null;
      current?: boolean;
    }>;
    organization?: {
      name?: string;
      industry?: string;
      website_url?: string;
      estimated_num_employees?: number;
      primary_phone?: { number?: string };
      organization_headcount_twelve_month_growth?: number;
    };
  };
}

export async function POST(request: Request) {
  try {
    const body: EnrichRequest = await request.json();

    const apolloApiKey = process.env.APOLLO_API_KEY;
    if (!apolloApiKey) {
      return NextResponse.json(
        { error: 'APOLLO_API_KEY not configured in .env.local' },
        { status: 500 }
      );
    }

    // Need at least one identifier
    const hasIdentifier =
      body.first_name ||
      body.last_name ||
      body.name ||
      body.email ||
      body.linkedin_url;

    if (!hasIdentifier) {
      return NextResponse.json(
        {
          error:
            'Au moins un identifiant requis : first_name + last_name, name, email, OU linkedin_url',
        },
        { status: 400 }
      );
    }

    // If user provided full name, split it for Apollo
    const payload: Record<string, unknown> = {};
    if (body.first_name) payload.first_name = body.first_name;
    if (body.last_name) payload.last_name = body.last_name;
    if (body.name && !body.first_name && !body.last_name) {
      const parts = body.name.trim().split(/\s+/);
      if (parts.length >= 2) {
        payload.first_name = parts[0];
        payload.last_name = parts.slice(1).join(' ');
      } else {
        payload.first_name = body.name;
      }
    }
    if (body.email) payload.email = body.email;
    if (body.linkedin_url) payload.linkedin_url = body.linkedin_url;
    if (body.organization_name) payload.organization_name = body.organization_name;
    if (body.domain) payload.domain = body.domain;

    const response = await fetch(APOLLO_MATCH_URL, {
      method: 'POST',
      headers: {
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/json',
        'X-Api-Key': apolloApiKey,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Apollo API error (${response.status}): ${errorText}` },
        { status: response.status }
      );
    }

    const data: ApolloMatchResponse = await response.json();

    if (!data.person) {
      return NextResponse.json(
        {
          error: 'Aucun match trouvé dans la base Apollo',
          query: payload,
        },
        { status: 404 }
      );
    }

    const p = data.person;
    const enriched = {
      apollo_id: p.id ?? '',
      name: p.name ?? `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim(),
      first_name: p.first_name ?? '',
      last_name: p.last_name ?? '',
      title: p.title ?? '',
      headline: p.headline ?? '',
      seniority: p.seniority ?? '',
      photo_url: p.photo_url ?? null,
      email: p.email ?? null,
      email_status: p.email_status ?? 'unknown',
      phone: p.phone ?? null,
      linkedin_url: p.linkedin_url ?? null,
      location: p.formatted_address ?? [p.city, p.state, p.country].filter(Boolean).join(', '),
      city: p.city ?? '',
      state: p.state ?? '',
      country: p.country ?? '',
      company: p.organization?.name ?? '',
      company_industry: p.organization?.industry ?? '',
      company_website: p.organization?.website_url ?? '',
      company_size: p.organization?.estimated_num_employees ?? null,
      company_phone: p.organization?.primary_phone?.number ?? null,
      company_growth_12m: p.organization?.organization_headcount_twelve_month_growth ?? null,
      employment_history: (p.employment_history ?? []).map((e) => ({
        title: e.title ?? '',
        company: e.organization_name ?? '',
        start_date: e.start_date ?? '',
        end_date: e.end_date ?? null,
        current: e.current ?? false,
      })),
      raw: p,
    };

    return NextResponse.json({ enriched });
  } catch (error) {
    console.error('Apollo enrich error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to enrich' },
      { status: 500 }
    );
  }
}
