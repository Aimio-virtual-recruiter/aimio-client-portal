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
  currentPosition?: { title?: string; companyName?: string };
  experience?: Array<{ company?: string; title?: string; companyName?: string }>;
  location?: string | { linkedinText?: string; parsed?: unknown };
  city?: string;
  geoLocationName?: string;
  email?: string;
  emailAddress?: string;
  emails?: Array<string | { email?: string }>;
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
      item.currentPosition?.companyName ??
      item.companyName ??
      item.company ??
      item.currentCompany?.name ??
      item.experience?.[0]?.companyName ??
      item.experience?.[0]?.company ??
      '';

    // location can be a plain string or an object (e.g. harvestapi: { linkedinText })
    const locationText =
      typeof item.location === 'string'
        ? item.location
        : item.location?.linkedinText ??
          item.city ??
          item.geoLocationName ??
          '';

    // email can be item.email, or an `emails` array of strings/objects (harvestapi)
    const firstEmailEntry = item.emails?.[0];
    const emailFromArray =
      typeof firstEmailEntry === 'string'
        ? firstEmailEntry
        : firstEmailEntry?.email ?? null;

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
        item.currentPosition?.title ??
        '',
      company: firstCompany,
      location: locationText,
      email: item.email ?? item.emailAddress ?? emailFromArray ?? null,
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
        id: 'harvestapi/linkedin-profile-search',
        name: 'LinkedIn People Search',
        description:
          'Recherche de profils LinkedIn par mots-clés + filtres (titre, lieu). Sans cookie. Renvoie emails, expérience, compétences.',
        example_input: {
          searchQuery: 'contrôleur financier',
          currentJobTitles: ['Financial Controller', 'Contrôleur financier'],
          locations: ['Montreal, Quebec, Canada'],
          maxItems: 25,
        },
      },
      {
        id: 'harvestapi/linkedin-profile-scraper',
        name: 'LinkedIn Profile Scraper (par URL)',
        description:
          'Scrape un profil LinkedIn complet depuis son URL (expérience, formation, compétences, email). Sans cookie.',
        example_input: {
          profileUrls: ['https://www.linkedin.com/in/some-profile/'],
        },
      },
      {
        id: 'harvestapi/linkedin-company-employees',
        name: 'Employés d\'une entreprise (LinkedIn)',
        description:
          'Liste les employés d\'une entreprise ciblée. Idéal pour débaucher chez un concurrent. Sans cookie.',
        example_input: {
          companies: ['https://www.linkedin.com/company/some-company/'],
          maxItems: 50,
        },
      },
      {
        id: 'curious_coder/linkedin-jobs-scraper',
        name: 'LinkedIn Jobs (entreprises qui embauchent)',
        description:
          'Scrape les offres d\'emploi LinkedIn. Identifie les entreprises qui recrutent (leads de mandats).',
        example_input: {
          searchUrl:
            'https://www.linkedin.com/jobs/search/?keywords=contr%C3%B4leur&location=Montreal',
          count: 50,
        },
      },
    ],
  });
}
