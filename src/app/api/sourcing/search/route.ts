import { NextResponse } from 'next/server';

// Apollo API endpoint for people search
const APOLLO_SEARCH_URL = 'https://api.apollo.io/api/v1/mixed_people/search';

interface ApolloOrganization {
  name?: string;
  industry?: string;
  website_url?: string;
  estimated_num_employees?: number;
}

interface ApolloEmploymentEntry {
  title?: string;
  organization_name?: string;
  start_date?: string;
  end_date?: string | null;
  current?: boolean;
}

interface ApolloPerson {
  id: string;
  first_name?: string;
  last_name?: string;
  name?: string;
  linkedin_url?: string;
  title?: string;
  email?: string;
  email_status?: string;
  organization?: ApolloOrganization;
  city?: string;
  state?: string;
  country?: string;
  headline?: string;
  seniority?: string;
  employment_history?: ApolloEmploymentEntry[];
}

interface SearchRequest {
  person_titles?: string[];
  person_locations?: string[];
  organization_num_employees_ranges?: string[];
  person_seniorities?: string[];
  contact_email_status?: string[];
  keywords?: string;
  per_page?: number;
  page?: number;
}

export async function POST(request: Request) {
  try {
    const body: SearchRequest = await request.json();

    const apolloApiKey = process.env.APOLLO_API_KEY;
    if (!apolloApiKey) {
      return NextResponse.json(
        { error: 'APOLLO_API_KEY not configured in .env.local' },
        { status: 500 }
      );
    }

    // Build Apollo search payload — only include fields that are set
    const payload: Record<string, unknown> = {
      per_page: Math.min(body.per_page ?? 25, 100),
      page: body.page ?? 1,
    };

    if (body.person_titles?.length) payload.person_titles = body.person_titles;
    if (body.person_locations?.length) payload.person_locations = body.person_locations;
    if (body.organization_num_employees_ranges?.length)
      payload.organization_num_employees_ranges = body.organization_num_employees_ranges;
    if (body.person_seniorities?.length) payload.person_seniorities = body.person_seniorities;
    if (body.contact_email_status?.length)
      payload.contact_email_status = body.contact_email_status;
    else payload.contact_email_status = ['verified', 'likely_to_engage'];
    if (body.keywords) payload.q_keywords = body.keywords;

    const response = await fetch(APOLLO_SEARCH_URL, {
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

    const data = await response.json();

    // Transform into simpler format for our UI
    const candidates = (data.people ?? []).map((p: ApolloPerson) => ({
      apollo_id: p.id,
      name: p.name ?? `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim(),
      first_name: p.first_name ?? '',
      last_name: p.last_name ?? '',
      title: p.title ?? '',
      email: p.email ?? null,
      email_status: p.email_status ?? 'unknown',
      linkedin_url: p.linkedin_url ?? null,
      company: p.organization?.name ?? '',
      industry: p.organization?.industry ?? '',
      company_size: p.organization?.estimated_num_employees ?? null,
      location: [p.city, p.state, p.country].filter(Boolean).join(', '),
      headline: p.headline ?? '',
      seniority: p.seniority ?? '',
      employment_history: (p.employment_history ?? []).map((e: ApolloEmploymentEntry) => ({
        title: e.title ?? '',
        company: e.organization_name ?? '',
        start_date: e.start_date ?? '',
        end_date: e.end_date ?? null,
        current: e.current ?? false,
      })),
    }));

    return NextResponse.json({
      candidates,
      pagination: {
        page: data.pagination?.page ?? 1,
        per_page: data.pagination?.per_page ?? 25,
        total_entries: data.pagination?.total_entries ?? 0,
        total_pages: data.pagination?.total_pages ?? 0,
      },
    });
  } catch (error) {
    console.error('Apollo search error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to search Apollo' },
      { status: 500 }
    );
  }
}
