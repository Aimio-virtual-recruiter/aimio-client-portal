import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * POST /api/recruiter/source
 *
 * Actions:
 *  - action=generate_brief : Claude generates an intelligent search brief from the job
 *  - action=run_sourcing : Runs Apify + Apollo in parallel, dedupes, saves to sourced_candidates
 */

const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";
const CLAUDE_MODEL = "claude-sonnet-4-5-20250929";
const APIFY_BASE = "https://api.apify.com/v2";
const APOLLO_API_URL = "https://api.apollo.io/v1/mixed_people/search";

interface SearchCriteria {
  jobTitlesCurrent?: string[];
  jobTitlesPast?: string[];
  excludeTitles?: string[];
  yearsExperienceMin?: number;
  yearsExperienceMax?: number;
  seniorityLevels?: string[];
  functions?: string[];
  locations?: string[];
  countries?: string[];
  remoteOk?: boolean;
  willingToRelocate?: boolean;
  currentEmployers?: string[];
  pastEmployers?: string[];
  excludeEmployers?: string[];
  industries?: string[];
  companySizes?: string[];
  skills?: string[];
  certifications?: string[];
  languages?: { name: string; proficiency: string }[];
  schools?: string[];
  degrees?: string[];
  fieldsOfStudy?: string[];
  openToWork?: boolean;
  recentlyChangedJobs?: boolean;
  yearsAtCurrentMin?: number;
}

interface GenerateBriefRequest {
  action: "generate_brief";
  client_id: string;
  position_title: string;
  raw_query?: string;
  location?: string;
  experience_min?: number;
  experience_max?: number;
  search_criteria?: SearchCriteria;
  internal_notes?: string;
}

interface RunSourcingRequest {
  action: "run_sourcing";
  client_id: string;
  sourcing_run_id?: string; // if resuming
  position_title: string;
  search_brief: SearchBrief;
  search_criteria?: SearchCriteria;
  max_results_per_source?: number;
  sources?: (
    | "apify_linkedin"
    | "apify_sales_nav"
    | "apify_recruiter_lite"
    | "apollo"
    | "indeed_resume"
  )[];
  recruiter_email?: string;
}

interface SearchBrief {
  boolean_search: string;
  primary_keywords: string[];
  secondary_keywords: string[];
  location_filters: string[];
  experience_range: string;
  target_companies: string[];
  exclude_companies: string[];
  seniority_titles: string[];
}

interface NormalizedCandidate {
  source: string;
  external_id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  current_title: string;
  current_company: string;
  linkedin_url: string | null;
  email: string | null;
  email_verified: boolean;
  phone: string | null;
  location_city: string;
  location_country: string;
  headline: string;
  raw: unknown;
}

// ============ BRIEF GENERATION ============

function formatCriteria(c?: SearchCriteria): string {
  if (!c) return "Aucun critère structuré fourni";
  const lines: string[] = [];
  if (c.jobTitlesCurrent?.length) lines.push(`Titres actuels: ${c.jobTitlesCurrent.join(", ")}`);
  if (c.jobTitlesPast?.length) lines.push(`Titres passés: ${c.jobTitlesPast.join(", ")}`);
  if (c.excludeTitles?.length) lines.push(`Exclure titres: ${c.excludeTitles.join(", ")}`);
  if (c.yearsExperienceMin || c.yearsExperienceMax)
    lines.push(`Expérience: ${c.yearsExperienceMin || 0}-${c.yearsExperienceMax || 30} ans`);
  if (c.yearsAtCurrentMin) lines.push(`Min années dans poste actuel: ${c.yearsAtCurrentMin}`);
  if (c.seniorityLevels?.length) lines.push(`Séniorité: ${c.seniorityLevels.join(", ")}`);
  if (c.functions?.length) lines.push(`Fonction: ${c.functions.join(", ")}`);
  if (c.locations?.length) lines.push(`Villes: ${c.locations.join(", ")}`);
  if (c.countries?.length) lines.push(`Pays: ${c.countries.join(", ")}`);
  if (c.remoteOk) lines.push("Télétravail OK");
  if (c.willingToRelocate) lines.push("Prêt à se relocaliser");
  if (c.currentEmployers?.length) lines.push(`Employeurs actuels cibles: ${c.currentEmployers.join(", ")}`);
  if (c.pastEmployers?.length) lines.push(`Employeurs passés: ${c.pastEmployers.join(", ")}`);
  if (c.excludeEmployers?.length) lines.push(`Exclure employeurs: ${c.excludeEmployers.join(", ")}`);
  if (c.industries?.length) lines.push(`Industries: ${c.industries.join(", ")}`);
  if (c.companySizes?.length) lines.push(`Taille entreprise: ${c.companySizes.join(", ")}`);
  if (c.skills?.length) lines.push(`Compétences: ${c.skills.join(", ")}`);
  if (c.certifications?.length) lines.push(`Certifications: ${c.certifications.join(", ")}`);
  if (c.languages?.length)
    lines.push(`Langues: ${c.languages.map((l) => `${l.name} (${l.proficiency})`).join(", ")}`);
  if (c.schools?.length) lines.push(`Écoles: ${c.schools.join(", ")}`);
  if (c.degrees?.length) lines.push(`Diplômes: ${c.degrees.join(", ")}`);
  if (c.fieldsOfStudy?.length) lines.push(`Champs études: ${c.fieldsOfStudy.join(", ")}`);
  if (c.openToWork) lines.push("Filtre Open to Work activé");
  if (c.recentlyChangedJobs) lines.push("A récemment changé d'emploi");
  return lines.join("\n");
}

async function generateSearchBrief(
  positionTitle: string,
  clientContext: string,
  rawQuery: string,
  location: string,
  criteria?: SearchCriteria,
  internalNotes?: string
): Promise<SearchBrief> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

  const criteriaBlock = formatCriteria(criteria);

  const prompt = `You are an expert recruiter. Generate an optimal LinkedIn Recruiter Lite + Apollo sourcing search brief in French (Quebec recruiting context: comptables, ingénieurs, avocats, chargés de projet construction — NOT tech).

POSITION: ${positionTitle}
CLIENT CONTEXT: ${clientContext}
RECRUITER'S RAW INPUT: ${rawQuery || "None — infer from criteria below"}
LOCATION PREFERENCE: ${location || "Open"}

STRUCTURED SEARCH CRITERIA (LinkedIn Recruiter Lite filters set by recruiter):
${criteriaBlock}

INTERNAL RECRUITER NOTES: ${internalNotes || "None"}

Return ONLY valid JSON with this exact structure:
{
  "boolean_search": "a LinkedIn Boolean search string with AND/OR/NOT operators (combines titles, skills, certifications, exclusions)",
  "primary_keywords": ["5-7 must-have keywords - reflect skills + certifications + key job titles"],
  "secondary_keywords": ["5-7 nice-to-have keywords - past employers, schools, languages"],
  "location_filters": ["2-4 locations in LinkedIn format"],
  "experience_range": "X-Y years (reflect yearsExperienceMin/Max)",
  "target_companies": ["8-12 companies where ideal candidates work - prioritize criteria.currentEmployers + competitors of client + top talent pools in industry"],
  "exclude_companies": ["respect criteria.excludeEmployers + add competitors of client to avoid awkward outreach"],
  "seniority_titles": ["3-5 likely current titles given seniorityLevels + functions criteria"]
}

IMPORTANT:
- Boolean search must be under 200 chars, LinkedIn-compatible
- Use criteria provided — don't invent skills/companies the recruiter didn't mention unless inferring from job title
- For Quebec non-tech roles, prefer francophone companies (Cogeco, Banque Nationale, Hydro-Québec, Desjardins, BRP, CGI, etc.) when relevant
- Seniority titles should mix English + French (Quebec market often uses both)`;

  const response = await fetch(CLAUDE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Claude API error: ${err}`);
  }

  const data = await response.json();
  const text = data.content?.[0]?.text || "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Claude did not return valid JSON");

  return JSON.parse(jsonMatch[0]) as SearchBrief;
}

// ============ APIFY LINKEDIN ============

interface ApifyLinkedInProfile {
  publicIdentifier?: string;
  id?: string;
  profileUrl?: string;
  url?: string;
  linkedinUrl?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  headline?: string;
  title?: string;
  jobTitle?: string;
  companyName?: string;
  company?: string;
  currentCompany?: { name?: string };
  location?: string;
  geoLocationName?: string;
  email?: string;
  phone?: string;
}

async function runApifyLinkedIn(
  searchBrief: SearchBrief,
  maxResults: number
): Promise<NormalizedCandidate[]> {
  const apifyToken = process.env.APIFY_TOKEN;
  if (!apifyToken) return [];

  try {
    const actorId = "apimaestro~linkedin-search-people";
    const url = `${APIFY_BASE}/acts/${actorId}/run-sync-get-dataset-items?token=${apifyToken}&timeout=180`;

    const searchTerm = searchBrief.primary_keywords.slice(0, 3).join(" ");
    const location = searchBrief.location_filters[0] || "";

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        searchTerm: `${searchTerm} ${location}`.trim(),
        maxResults,
      }),
    });

    if (!response.ok) {
      console.error("[Apify LinkedIn] Error:", response.status);
      return [];
    }

    const data: ApifyLinkedInProfile[] = await response.json();
    if (!Array.isArray(data)) return [];

    return data.map((item) => normalizeApify(item, "apify_linkedin"));
  } catch (err) {
    console.error("[Apify LinkedIn] Exception:", err);
    return [];
  }
}

async function runApifySalesNav(
  searchBrief: SearchBrief,
  maxResults: number,
  salesNavUrl?: string
): Promise<NormalizedCandidate[]> {
  const apifyToken = process.env.APIFY_TOKEN;
  const salesNavCookie = process.env.LINKEDIN_SALES_NAV_COOKIE;
  if (!apifyToken || !salesNavCookie || !salesNavUrl) return [];

  try {
    const actorId = "harvestapi~linkedin-sales-navigator-search-scraper";
    const url = `${APIFY_BASE}/acts/${actorId}/run-sync-get-dataset-items?token=${apifyToken}&timeout=240`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        searchUrl: salesNavUrl,
        maxItems: maxResults,
        cookie: salesNavCookie,
      }),
    });

    if (!response.ok) return [];

    const data: ApifyLinkedInProfile[] = await response.json();
    if (!Array.isArray(data)) return [];

    return data.map((item) => normalizeApify(item, "apify_sales_nav"));
  } catch (err) {
    console.error("[Apify SalesNav] Exception:", err);
    return [];
  }
}

function normalizeApify(item: ApifyLinkedInProfile, source: string): NormalizedCandidate {
  const fullName =
    item.fullName ||
    `${item.firstName || ""} ${item.lastName || ""}`.trim() ||
    "Unknown";
  const [firstName, ...rest] = fullName.split(" ");
  const lastName = rest.join(" ");

  const company = item.companyName || item.company || item.currentCompany?.name || "";
  const title = item.headline || item.title || item.jobTitle || "";
  const linkedinUrl = item.profileUrl || item.url || item.linkedinUrl || null;
  const location = item.location || item.geoLocationName || "";
  const [city, ...locParts] = location.split(",").map((s) => s.trim());

  return {
    source,
    external_id: item.publicIdentifier || item.id || linkedinUrl || "",
    first_name: firstName,
    last_name: lastName,
    full_name: fullName,
    current_title: title,
    current_company: company,
    linkedin_url: linkedinUrl,
    email: item.email || null,
    email_verified: false,
    phone: item.phone || null,
    location_city: city || "",
    location_country: locParts[locParts.length - 1] || "",
    headline: item.headline || "",
    raw: item,
  };
}

// ============ APOLLO.IO ============

interface ApolloPerson {
  id?: string;
  first_name?: string;
  last_name?: string;
  name?: string;
  title?: string;
  headline?: string;
  linkedin_url?: string;
  email?: string;
  email_status?: string;
  phone_numbers?: Array<{ sanitized_number?: string }>;
  city?: string;
  country?: string;
  organization?: { name?: string; industry?: string };
}

async function runApolloSearch(
  searchBrief: SearchBrief,
  maxResults: number
): Promise<NormalizedCandidate[]> {
  const apiKey = process.env.APOLLO_API_KEY;
  if (!apiKey) return [];

  try {
    const body = {
      q_keywords: searchBrief.primary_keywords.join(" "),
      person_titles: searchBrief.seniority_titles,
      person_locations: searchBrief.location_filters,
      organization_locations: searchBrief.location_filters,
      per_page: Math.min(maxResults, 100),
    };

    const response = await fetch(APOLLO_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": apiKey,
        "Cache-Control": "no-cache",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.error("[Apollo] Error:", response.status);
      return [];
    }

    const data = await response.json();
    const people: ApolloPerson[] = data.people || [];

    return people.map((p) => {
      const firstName = p.first_name || p.name?.split(" ")[0] || "";
      const lastName = p.last_name || p.name?.split(" ").slice(1).join(" ") || "";
      return {
        source: "apollo",
        external_id: p.id || p.linkedin_url || "",
        first_name: firstName,
        last_name: lastName,
        full_name: p.name || `${firstName} ${lastName}`.trim(),
        current_title: p.title || p.headline || "",
        current_company: p.organization?.name || "",
        linkedin_url: p.linkedin_url || null,
        email: p.email || null,
        email_verified: p.email_status === "verified",
        phone: p.phone_numbers?.[0]?.sanitized_number || null,
        location_city: p.city || "",
        location_country: p.country || "",
        headline: p.headline || p.title || "",
        raw: p,
      };
    });
  } catch (err) {
    console.error("[Apollo] Exception:", err);
    return [];
  }
}

// ============ DEDUPLICATION ============

function dedupe(candidates: NormalizedCandidate[]): NormalizedCandidate[] {
  const seen = new Map<string, NormalizedCandidate>();
  for (const c of candidates) {
    const key = c.linkedin_url || `${c.first_name}_${c.last_name}_${c.current_company}`.toLowerCase();
    const existing = seen.get(key);

    if (!existing) {
      seen.set(key, c);
    } else {
      // Merge: prefer verified email + more data
      seen.set(key, {
        ...existing,
        email: existing.email || c.email,
        email_verified: existing.email_verified || c.email_verified,
        phone: existing.phone || c.phone,
        linkedin_url: existing.linkedin_url || c.linkedin_url,
      });
    }
  }
  return Array.from(seen.values());
}

// ============ MAIN HANDLER ============

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as GenerateBriefRequest | RunSourcingRequest;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    // ===== GENERATE BRIEF =====
    if (body.action === "generate_brief") {
      const { data: client } = await supabase
        .from("clients")
        .select("company_name, country, industry, roles_hiring_for, notes")
        .eq("id", body.client_id)
        .single();

      const clientContext = client
        ? `${client.company_name} (${client.country}) — ${client.industry || "tech"}. Hiring for: ${client.roles_hiring_for || "various roles"}. Notes: ${client.notes || "none"}`
        : "";

      const brief = await generateSearchBrief(
        body.position_title,
        clientContext,
        body.raw_query || "",
        body.location || "",
        body.search_criteria,
        body.internal_notes
      );

      return NextResponse.json({ brief });
    }

    // ===== RUN SOURCING =====
    if (body.action === "run_sourcing") {
      const maxPerSource = body.max_results_per_source || 50;
      const sources = body.sources || ["apify_linkedin", "apollo"];

      // Create sourcing run record
      const { data: run } = await supabase
        .from("sourcing_runs")
        .insert({
          client_id: body.client_id,
          position_title: body.position_title,
          search_brief: body.search_brief,
          status: "running",
          sources_used: sources,
          max_results: maxPerSource * sources.length,
          recruiter_email: body.recruiter_email || null,
        })
        .select()
        .single();

      const runId = run?.id;

      // Launch sources in parallel
      const promises: Promise<NormalizedCandidate[]>[] = [];

      if (sources.includes("apify_linkedin")) {
        promises.push(runApifyLinkedIn(body.search_brief, maxPerSource));
      }
      if (sources.includes("apify_sales_nav")) {
        promises.push(runApifySalesNav(body.search_brief, maxPerSource));
      }
      if (sources.includes("apollo")) {
        promises.push(runApolloSearch(body.search_brief, maxPerSource));
      }

      const results = await Promise.all(promises);
      const allCandidates = results.flat();
      const deduped = dedupe(allCandidates);

      // Save to sourced_candidates
      const inserts = deduped.map((c) => ({
        sourcing_run_id: runId,
        client_id: body.client_id,
        first_name: c.first_name,
        last_name: c.last_name,
        full_name: c.full_name,
        current_title: c.current_title,
        current_company: c.current_company,
        linkedin_url: c.linkedin_url,
        email: c.email,
        email_verified: c.email_verified,
        phone: c.phone,
        location_city: c.location_city,
        location_country: c.location_country,
        headline: c.headline,
        source: c.source,
        source_raw: c.raw,
        status: "new" as const,
      }));

      let insertedCount = 0;
      if (inserts.length > 0) {
        const { error: insertError, count } = await supabase
          .from("sourced_candidates")
          .upsert(inserts, { onConflict: "linkedin_url", count: "exact" });
        if (insertError) {
          console.error("[recruiter/source] Insert error:", insertError);
        } else {
          insertedCount = count || inserts.length;
        }
      }

      // Update sourcing run
      await supabase
        .from("sourcing_runs")
        .update({
          status: "completed",
          candidates_found: allCandidates.length,
          candidates_after_dedupe: deduped.length,
          completed_at: new Date().toISOString(),
          estimated_cost_usd: sources.length * 1.5,
        })
        .eq("id", runId);

      return NextResponse.json({
        success: true,
        sourcing_run_id: runId,
        candidates_found: allCandidates.length,
        candidates_after_dedupe: deduped.length,
        candidates_inserted: insertedCount,
        sources_used: sources,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("[api/recruiter/source] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
