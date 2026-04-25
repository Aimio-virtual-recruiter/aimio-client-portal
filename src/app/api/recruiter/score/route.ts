import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * POST /api/recruiter/score
 *
 * Deep AI scoring: analyzes a candidate against a position using Claude.
 * Can score individual candidates OR batch-score all 'new' candidates for a sourcing run.
 */

const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";
const CLAUDE_MODEL = "claude-sonnet-4-5-20250929";

interface ScoreSingleRequest {
  action: "score_single";
  candidate_id: string;
}

interface ScoreBatchRequest {
  action: "score_batch";
  sourcing_run_id?: string;
  client_id?: string;
  limit?: number;
}

type RequestBody = ScoreSingleRequest | ScoreBatchRequest;

interface SourcedCandidate {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  current_title: string;
  current_company: string;
  headline: string;
  summary: string | null;
  skills: string[] | null;
  experience_json: unknown;
  location_city: string;
  location_country: string;
  email: string | null;
  linkedin_url: string | null;
  client_id: string;
  sourcing_run_id: string;
}

interface ScoringResult {
  fit_score: number;
  verdict: "STRONG_MATCH" | "GOOD_MATCH" | "BORDERLINE" | "NOT_MATCH";
  strengths: string[];
  concerns: string[];
  personalization_hooks: string[];
  outreach_angle: string;
  likelihood_to_respond: string;
  salary_estimate: string;
}

async function scoreCandidate(
  candidate: SourcedCandidate,
  positionTitle: string,
  clientContext: string
): Promise<ScoringResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

  const prompt = `You are an expert technical recruiter evaluating a candidate for a specific role.

POSITION: ${positionTitle}

CLIENT CONTEXT:
${clientContext}

CANDIDATE PROFILE:
Name: ${candidate.full_name}
Current: ${candidate.current_title || "?"} at ${candidate.current_company || "?"}
Location: ${candidate.location_city || "?"}, ${candidate.location_country || "?"}
Headline: ${candidate.headline || "?"}
${candidate.summary ? `Summary: ${candidate.summary.substring(0, 800)}` : ""}
${candidate.skills?.length ? `Skills: ${candidate.skills.slice(0, 20).join(", ")}` : ""}
${candidate.experience_json ? `Experience: ${JSON.stringify(candidate.experience_json).substring(0, 1500)}` : ""}

Analyze this candidate's fit for the role and return ONLY valid JSON:
{
  "fit_score": <integer 0-100>,
  "verdict": "STRONG_MATCH" | "GOOD_MATCH" | "BORDERLINE" | "NOT_MATCH",
  "strengths": [<3 specific strengths, bullet-style phrases>],
  "concerns": [<0-3 red flags or gaps>],
  "personalization_hooks": [<3 specific details from their profile useful for outreach>],
  "outreach_angle": "<recommended messaging angle, 1 sentence>",
  "likelihood_to_respond": "High | Medium | Low + 1-sentence reason",
  "salary_estimate": "<estimated salary range based on role + location + seniority>"
}

Scoring guide:
- 85-100: STRONG_MATCH — must-haves fully met, bonus skills present
- 70-84: GOOD_MATCH — core requirements met, minor gaps
- 50-69: BORDERLINE — some fit but significant gaps
- 0-49: NOT_MATCH — clear misalignment

Be strict. Most candidates should score 50-70, only exceptional fits get 85+.`;

  const response = await fetch(CLAUDE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 1000,
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

  return JSON.parse(jsonMatch[0]) as ScoringResult;
}

export async function POST(request: Request) {
  try {
    const body: RequestBody = await request.json();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch candidates
    let candidates: SourcedCandidate[] = [];
    if (body.action === "score_single") {
      const { data } = await supabase
        .from("sourced_candidates")
        .select("*")
        .eq("id", body.candidate_id)
        .limit(1);
      candidates = (data || []) as SourcedCandidate[];
    } else if (body.action === "score_batch") {
      let query = supabase
        .from("sourced_candidates")
        .select("*")
        .is("ai_score", null)
        .in("status", ["new", "kept"])
        .limit(body.limit || 50);

      if (body.sourcing_run_id) query = query.eq("sourcing_run_id", body.sourcing_run_id);
      if (body.client_id) query = query.eq("client_id", body.client_id);

      const { data } = await query;
      candidates = (data || []) as SourcedCandidate[];
    }

    if (candidates.length === 0) {
      return NextResponse.json({ success: true, scored_count: 0, results: [] });
    }

    // Load client + position context for each candidate's sourcing run
    const runIds = [...new Set(candidates.map((c) => c.sourcing_run_id).filter(Boolean))];
    const { data: runs } = await supabase
      .from("sourcing_runs")
      .select("id, position_title, search_brief, client_id")
      .in("id", runIds);

    const runMap = new Map((runs || []).map((r) => [r.id, r]));

    const clientIds = [...new Set(candidates.map((c) => c.client_id))];
    const { data: clients } = await supabase
      .from("clients")
      .select("id, company_name, industry, country, roles_hiring_for, notes")
      .in("id", clientIds);

    const clientMap = new Map((clients || []).map((c) => [c.id, c]));

    // Score each candidate in parallel (max 5 at a time to avoid rate limits)
    const results: Array<{ candidate_id: string } & ScoringResult> = [];
    for (let i = 0; i < candidates.length; i += 5) {
      const batch = candidates.slice(i, i + 5);
      const batchResults = await Promise.allSettled(
        batch.map(async (candidate) => {
          const run = runMap.get(candidate.sourcing_run_id);
          const client = clientMap.get(candidate.client_id);
          const position = run?.position_title || "Unknown Position";
          const clientContext = client
            ? `${client.company_name} (${client.country}) — ${client.industry || "tech"}. Hiring: ${client.roles_hiring_for || "various"}. Notes: ${client.notes || "none"}`
            : "Not provided";

          const score = await scoreCandidate(candidate, position, clientContext);

          // Save to DB
          await supabase
            .from("sourced_candidates")
            .update({
              ai_score: score.fit_score,
              ai_verdict: score.verdict,
              ai_strengths: score.strengths,
              ai_concerns: score.concerns,
              ai_personalization_hooks: score.personalization_hooks,
              ai_outreach_angle: score.outreach_angle,
              ai_likelihood_to_respond: score.likelihood_to_respond,
              salary_estimate: score.salary_estimate,
            })
            .eq("id", candidate.id);

          return { candidate_id: candidate.id, ...score };
        })
      );

      batchResults.forEach((r) => {
        if (r.status === "fulfilled") results.push(r.value);
      });
    }

    return NextResponse.json({
      success: true,
      scored_count: results.length,
      failed_count: candidates.length - results.length,
      total_cost_usd: results.length * 0.15,
      results,
    });
  } catch (error) {
    console.error("[api/recruiter/score] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
