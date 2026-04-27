import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/supabase/server';

const APIFY_BASE = 'https://api.apify.com/v2';

interface ApifyRunRequest {
  actorId: string; // e.g. "apimaestro~linkedin-search-people"
  input: Record<string, unknown>;
  timeout?: number; // seconds (max 300 for sync)
}

interface ApifyItem {
  id?: string;
  url?: string;
  profileUrl?: string;
  linkedinUrl?: string;
  publicIdentifier?: string;
  fullName?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  headline?: string;
  title?: string;
  jobTitle?: string;
  occupation?: string;
  companyName?: string;
  company?: string;
  currentCompany?: { name?: string };
  experience?: Array<{ company?: string; title?: string; companyName?: string }>;
  location?: string;
  city?: string;
  geoLocationName?: string;
  email?: string;
  emailAddress?: string;
  phone?: string;
  industryName?: string;
  industry?: string;
  summary?: string;
  about?: string;
  connectionDegree?: string | number;
  skills?: string[];
  [key: string]: unknown;
}

interface NormalizedCandidate {
  source: 'apify';
  source_actor: string;
  external_id: string;
  name: string;
  title: string;
  company: string;
  location: string;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  industry: string;
  headline: string;
  raw: ApifyItem;
}

function normalizeApifyData(
  data: ApifyItem[],
  actorId: string
): NormalizedCandidate[] {
  if (!Array.isArray(data)) return [];

  return data.map((item) => {
    const firstCompany =
      item.companyName ??
      item.company ??
      item.currentCompany?.name ??
      item.experience?.[0]?.companyName ??
      item.experience?.[0]?.company ??
      '';

    return {
      source: 'apify',
      source_actor: actorId,
      external_id:
        item.publicIdentifier ??
        item.id ??
        item.profileUrl ??
        item.url ??
        item.linkedinUrl ??
        '',
      name:
        item.fullName ??
        item.name ??
        `${item.firstName ?? ''} ${item.lastName ?? ''}`.trim(),
      title:
        item.headline ??
        item.title ??
        item.jobTitle ??
        item.occupation ??
        '',
      company: firstCompany,
      location: item.location ?? item.city ?? item.geoLocationName ?? '',
      email: item.email ?? item.emailAddress ?? null,
      phone: item.phone ?? null,
      linkedin_url:
        item.profileUrl ?? item.url ?? item.linkedinUrl ?? null,
      industry: item.industryName ?? item.industry ?? '',
      headline: item.headline ?? '',
      raw: item,
    };
  });
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    if (user.role !== 'admin' && user.role !== 'recruiter') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const body: ApifyRunRequest = await request.json();

    const apifyToken = process.env.APIFY_TOKEN;
    if (!apifyToken) {
      return NextResponse.json(
        { error: 'APIFY_TOKEN not configured in .env.local' },
        { status: 500 }
      );
    }

    if (!body.actorId) {
      return NextResponse.json(
        { error: 'actorId is required (e.g. "apimaestro~linkedin-search-people")' },
        { status: 400 }
      );
    }

    // Apify uses tilde (~) in URL paths instead of slash for actor IDs
    const safeActorId = body.actorId.replace('/', '~');
    const timeout = Math.min(body.timeout ?? 120, 300);

    // Synchronous endpoint — returns results when actor finishes (or timeout)
    const url = `${APIFY_BASE}/acts/${safeActorId}/run-sync-get-dataset-items?token=${apifyToken}&timeout=${timeout}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body.input ?? {}),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        {
          error: `Apify error (${response.status}): ${errorText}`,
          actor: body.actorId,
        },
        { status: response.status }
      );
    }

    const data: ApifyItem[] = await response.json();
    const candidates = normalizeApifyData(data, body.actorId);

    return NextResponse.json({
      candidates,
      raw_count: Array.isArray(data) ? data.length : 0,
      normalized_count: candidates.length,
      actor: body.actorId,
    });
  } catch (error) {
    console.error('Apify route error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to run Apify actor',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  if (user.role !== 'admin' && user.role !== 'recruiter') {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }
  // Return list of recommended actors for the UI
  return NextResponse.json({
    recommended_actors: [
      {
        id: 'apimaestro/linkedin-search-people',
        name: 'LinkedIn People Search',
        description:
          'Search public LinkedIn profiles by keywords. No cookie required.',
        example_input: {
          searchTerm: 'Software Engineer Toronto',
          maxResults: 25,
        },
      },
      {
        id: 'dev_fusion/linkedin-profile-scraper',
        name: 'LinkedIn Profile Scraper',
        description:
          'Scrape full LinkedIn profile from URL (experience, education, skills).',
        example_input: {
          profileUrls: ['https://www.linkedin.com/in/some-profile/'],
        },
      },
      {
        id: 'harvestapi/linkedin-sales-navigator-search-scraper',
        name: 'LinkedIn Sales Navigator Search',
        description:
          'Scrape Sales Navigator search results. Requires Sales Nav cookie.',
        example_input: {
          searchUrl:
            'https://www.linkedin.com/sales/search/people?...',
          maxItems: 50,
        },
      },
      {
        id: 'apify/linkedin-jobs-scraper',
        name: 'LinkedIn Jobs Scraper (Lead Finder)',
        description:
          'Scrape job postings from LinkedIn. Identifies companies actively hiring.',
        example_input: {
          query: 'Software Engineer',
          location: 'Canada',
          maxItems: 100,
        },
      },
      {
        id: 'apify/crunchbase-scraper',
        name: 'Crunchbase Companies (Lead Finder)',
        description:
          'Scrape Crunchbase for companies with recent funding. Great for B2B leads.',
        example_input: {
          startUrls: ['https://www.crunchbase.com/discover/organization.companies/...'],
          maxItems: 50,
        },
      },
    ],
  });
}
