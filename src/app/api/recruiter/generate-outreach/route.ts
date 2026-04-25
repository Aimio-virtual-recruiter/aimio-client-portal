import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * POST /api/recruiter/generate-outreach
 *
 * Uses Claude to generate a 4-touch outreach sequence for a candidate:
 *   1. LinkedIn connection request (300 chars)
 *   2. LinkedIn InMail (subject + body)
 *   3. Email cold outreach (subject + body)
 *   4. LinkedIn follow-up (short message)
 *
 * Each message is personalized using the candidate's profile + AI personalization hooks.
 */

const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";
const CLAUDE_MODEL = "claude-sonnet-4-5-20250929";

interface GenerateRequest {
  candidate_id: string;
  recruiter_name?: string;
  tone?: "professional" | "casual" | "formal";
  calendly_url?: string;
}

interface OutreachSequence {
  linkedin_connection: { body: string; char_count: number };
  linkedin_inmail: { subject: string; body: string };
  email_cold: { subject: string; body: string };
  linkedin_followup: { body: string };
}

export async function POST(request: Request) {
  try {
    const body: GenerateRequest = await request.json();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Load candidate
    const { data: candidate, error: candidateError } = await supabase
      .from("sourced_candidates")
      .select("*")
      .eq("id", body.candidate_id)
      .single();

    if (candidateError || !candidate) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }

    // Load client + sourcing run context
    const { data: client } = await supabase
      .from("clients")
      .select("*")
      .eq("id", candidate.client_id)
      .single();

    const { data: run } = await supabase
      .from("sourcing_runs")
      .select("*")
      .eq("id", candidate.sourcing_run_id)
      .single();

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const recruiterName = body.recruiter_name || client.recruteur_lead || "Marc-Antoine";
    const tone = body.tone || "professional";
    const calendlyUrl = body.calendly_url || "https://meetings-na3.hubspot.com/olivier-bujold/virtual-recruiter-exploratory-meeting";
    const position = run?.position_title || "a role";

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

    const prompt = `You are an expert recruiter writing outreach to a passive candidate. Generate a 4-touch sequence.

CANDIDATE:
Name: ${candidate.full_name}
Current: ${candidate.current_title} at ${candidate.current_company}
Location: ${candidate.location_city}
Headline: ${candidate.headline || ""}

PERSONALIZATION HOOKS (use these in messages):
${(candidate.ai_personalization_hooks || []).map((h: string) => `- ${h}`).join("\n") || "None provided"}

RECOMMENDED OUTREACH ANGLE: ${candidate.ai_outreach_angle || "Focus on opportunity"}

CLIENT OPPORTUNITY:
Company: ${client.company_name}
Industry: ${client.industry || "tech"}
Country: ${client.country}
Position: ${position}
About the role: ${client.roles_hiring_for || position}
Why it's exciting: ${client.notes || "growth-stage company"}

RECRUITER: ${recruiterName}
CALENDLY: ${calendlyUrl}
TONE: ${tone}

Generate 4 messages in JSON format. Return ONLY JSON:
{
  "linkedin_connection": {
    "body": "<max 300 chars, personal, mention ONE hook from their profile, no emojis, no 'I hope this finds you well'>",
    "char_count": <integer>
  },
  "linkedin_inmail": {
    "subject": "<compelling subject, 40-60 chars>",
    "body": "<120-180 words: open with specific hook from their profile, mention ${client.company_name} briefly, explain why they'd be a fit for ${position}, soft CTA with Calendly>"
  },
  "email_cold": {
    "subject": "<different angle than LinkedIn, 40-60 chars>",
    "body": "<100-150 words: completely different opener than LinkedIn, focus on growth opportunity + specific technical challenge, end with clear CTA>"
  },
  "linkedin_followup": {
    "body": "<60-100 words: acknowledge previous message, polite, easy out, share a recent news about ${client.company_name} if possible>"
  }
}

RULES:
- NEVER start with "Hope you're well" / "Hope this finds you well"
- NEVER use "I came across your profile"
- USE the specific hooks provided
- Mention ${client.company_name} but keep it brief
- Be human, not robotic
- No emojis in LinkedIn InMail
- Email can have 1 emoji max`;

    const response = await fetch(CLAUDE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 2500,
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

    const sequence = JSON.parse(jsonMatch[0]) as OutreachSequence;

    // Save all 4 messages to outreach_messages
    const inserts = [
      {
        candidate_id: body.candidate_id,
        client_id: candidate.client_id,
        channel: "linkedin_connection" as const,
        touch_number: 1,
        subject: null,
        body: sequence.linkedin_connection.body,
        status: "draft" as const,
        personalization_hooks_used: candidate.ai_personalization_hooks || [],
      },
      {
        candidate_id: body.candidate_id,
        client_id: candidate.client_id,
        channel: "linkedin_inmail" as const,
        touch_number: 2,
        subject: sequence.linkedin_inmail.subject,
        body: sequence.linkedin_inmail.body,
        status: "draft" as const,
      },
      {
        candidate_id: body.candidate_id,
        client_id: candidate.client_id,
        channel: "email" as const,
        touch_number: 3,
        subject: sequence.email_cold.subject,
        body: sequence.email_cold.body,
        status: "draft" as const,
      },
      {
        candidate_id: body.candidate_id,
        client_id: candidate.client_id,
        channel: "linkedin_followup" as const,
        touch_number: 4,
        subject: null,
        body: sequence.linkedin_followup.body,
        status: "draft" as const,
      },
    ];

    // Delete old drafts first to avoid duplicates
    await supabase
      .from("outreach_messages")
      .delete()
      .eq("candidate_id", body.candidate_id)
      .eq("status", "draft");

    const { data: savedMessages } = await supabase
      .from("outreach_messages")
      .insert(inserts)
      .select();

    // Mark candidate as outreach_ready
    await supabase
      .from("sourced_candidates")
      .update({ status: "outreach_ready" })
      .eq("id", body.candidate_id);

    return NextResponse.json({
      success: true,
      sequence,
      messages: savedMessages,
      cost_usd: 0.05,
    });
  } catch (error) {
    console.error("[api/recruiter/generate-outreach] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
