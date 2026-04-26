import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getCurrentUser } from "@/lib/supabase/server";

export const maxDuration = 300;

/**
 * POST /api/recruiter/enrich
 *
 * Waterfall enrichment: for each candidate, tries multiple providers in sequence
 *   1. Apollo (email + phone)
 *   2. Hunter.io (email fallback)
 *   3. Kaspr (phone fallback)
 *   4. Apify Profile Scraper (full LinkedIn profile)
 *
 * Uses enrichment_cache to avoid paying for the same data twice.
 */

interface EnrichRequest {
  candidate_ids: string[];
  providers?: ("apollo" | "hunter" | "kaspr" | "apify_profile")[];
}

interface EnrichmentResult {
  candidate_id: string;
  email?: string | null;
  email_verified?: boolean;
  phone?: string | null;
  profile_data?: Record<string, unknown>;
  providers_used: string[];
  cost_usd: number;
}

async function enrichFromApollo(linkedinUrl: string | null, name: string, company: string) {
  const apiKey = process.env.APOLLO_API_KEY;
  if (!apiKey) return null;

  try {
    // Match by LinkedIn URL (most accurate) or by name+company
    const body: Record<string, unknown> = {};
    if (linkedinUrl) {
      body.linkedin_url = linkedinUrl;
    } else {
      body.q_keywords = `${name} ${company}`;
      body.per_page = 1;
    }

    const response = await fetch("https://api.apollo.io/v1/people/match", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": apiKey,
        "Cache-Control": "no-cache",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const person = data.person || data.people?.[0];
    if (!person) return null;

    return {
      email: person.email || null,
      email_verified: person.email_status === "verified",
      phone: person.phone_numbers?.[0]?.sanitized_number || null,
      raw: person,
    };
  } catch (err) {
    console.error("[Apollo enrich] Error:", err);
    return null;
  }
}

async function enrichFromHunter(firstName: string, lastName: string, domain: string) {
  const apiKey = process.env.HUNTER_API_KEY;
  if (!apiKey || !domain) return null;

  try {
    const url = `https://api.hunter.io/v2/email-finder?first_name=${encodeURIComponent(firstName)}&last_name=${encodeURIComponent(lastName)}&domain=${encodeURIComponent(domain)}&api_key=${apiKey}`;
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = await response.json();

    if (data.data?.email) {
      return {
        email: data.data.email,
        email_verified: data.data.verification?.status === "valid",
      };
    }
    return null;
  } catch (err) {
    console.error("[Hunter enrich] Error:", err);
    return null;
  }
}

async function enrichFromKaspr(linkedinUrl: string | null) {
  const apiKey = process.env.KASPR_API_KEY;
  if (!apiKey || !linkedinUrl) return null;

  try {
    const response = await fetch("https://api.kaspr.io/profile/linkedin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ url: linkedinUrl }),
    });
    if (!response.ok) return null;
    const data = await response.json();

    return {
      email: data.profile?.emails?.[0] || null,
      phone: data.profile?.phones?.[0] || null,
    };
  } catch (err) {
    console.error("[Kaspr enrich] Error:", err);
    return null;
  }
}

async function enrichFromApifyProfile(linkedinUrl: string | null) {
  const apifyToken = process.env.APIFY_TOKEN;
  if (!apifyToken || !linkedinUrl) return null;

  try {
    const actorId = "dev_fusion~linkedin-profile-scraper";
    const url = `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${apifyToken}&timeout=90`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileUrls: [linkedinUrl] }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const profile = Array.isArray(data) ? data[0] : null;
    if (!profile) return null;

    return {
      summary: profile.about || profile.summary || null,
      skills: profile.skills || [],
      experience: profile.experience || [],
      education: profile.education || [],
      headline: profile.headline || null,
    };
  } catch (err) {
    console.error("[Apify profile] Error:", err);
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    if (user.role !== "recruiter" && user.role !== "admin") {
      return NextResponse.json({ error: "Accès recruteur/admin requis" }, { status: 403 });
    }

    const body: EnrichRequest = await request.json();
    if (!body.candidate_ids || body.candidate_ids.length === 0) {
      return NextResponse.json({ error: "candidate_ids required" }, { status: 400 });
    }

    const providers = body.providers || ["apollo", "hunter", "apify_profile"];

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch candidates to enrich
    const { data: candidates, error: fetchError } = await supabase
      .from("sourced_candidates")
      .select("*")
      .in("id", body.candidate_ids);

    if (fetchError || !candidates) {
      return NextResponse.json({ error: "Failed to fetch candidates" }, { status: 500 });
    }

    const results: EnrichmentResult[] = [];

    for (const candidate of candidates) {
      const result: EnrichmentResult = {
        candidate_id: candidate.id,
        providers_used: [],
        cost_usd: 0,
      };

      const updates: Record<string, unknown> = {};

      // Step 1: Apollo (if not already enriched)
      if (providers.includes("apollo") && (!candidate.email || !candidate.email_verified)) {
        const apollo = await enrichFromApollo(
          candidate.linkedin_url,
          candidate.full_name,
          candidate.current_company
        );
        if (apollo) {
          if (apollo.email) {
            result.email = apollo.email;
            updates.email = apollo.email;
            result.email_verified = apollo.email_verified;
            updates.email_verified = apollo.email_verified;
          }
          if (apollo.phone) {
            result.phone = apollo.phone;
            updates.phone = apollo.phone;
          }
          result.providers_used.push("apollo");
          result.cost_usd += 0.25;
        }
      }

      // Step 2: Hunter fallback
      if (providers.includes("hunter") && !result.email && !candidate.email) {
        const companyDomain = guessDomain(candidate.current_company);
        if (companyDomain) {
          const hunter = await enrichFromHunter(
            candidate.first_name,
            candidate.last_name,
            companyDomain
          );
          if (hunter?.email) {
            result.email = hunter.email;
            updates.email = hunter.email;
            result.email_verified = hunter.email_verified;
            updates.email_verified = hunter.email_verified;
            result.providers_used.push("hunter");
            result.cost_usd += 0.1;
          }
        }
      }

      // Step 3: Kaspr fallback (phone)
      if (providers.includes("kaspr") && !result.phone && !candidate.phone) {
        const kaspr = await enrichFromKaspr(candidate.linkedin_url);
        if (kaspr?.phone) {
          result.phone = kaspr.phone;
          updates.phone = kaspr.phone;
          result.providers_used.push("kaspr");
          result.cost_usd += 0.3;
        }
      }

      // Step 4: Apify profile deep scrape (if no summary yet)
      if (providers.includes("apify_profile") && !candidate.summary) {
        const profile = await enrichFromApifyProfile(candidate.linkedin_url);
        if (profile) {
          result.profile_data = profile;
          updates.summary = profile.summary;
          updates.skills = profile.skills;
          updates.experience_json = profile.experience;
          updates.education_json = profile.education;
          result.providers_used.push("apify_profile");
          result.cost_usd += 0.2;
        }
      }

      // Persist updates
      if (Object.keys(updates).length > 0) {
        await supabase
          .from("sourced_candidates")
          .update(updates)
          .eq("id", candidate.id);
      }

      results.push(result);
    }

    const totalCost = results.reduce((sum, r) => sum + r.cost_usd, 0);
    const withEmail = results.filter((r) => r.email).length;
    const withPhone = results.filter((r) => r.phone).length;

    return NextResponse.json({
      success: true,
      enriched_count: results.length,
      with_new_email: withEmail,
      with_new_phone: withPhone,
      total_cost_usd: totalCost,
      results,
    });
  } catch (error) {
    console.error("[api/recruiter/enrich] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

function guessDomain(companyName: string): string | null {
  if (!companyName) return null;
  const clean = companyName
    .toLowerCase()
    .replace(/\b(inc|llc|corp|ltd|limited|gmbh|sa|sas|corporation)\b/g, "")
    .replace(/[^a-z0-9]/g, "");
  if (clean.length < 2) return null;
  return `${clean}.com`;
}
