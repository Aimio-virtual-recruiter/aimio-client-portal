import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * POST /api/recruiter/classify-reply
 *
 * Uses Claude to classify a candidate's reply into one of:
 *   - INTERESTED_YES     : Ready to talk → auto-send Calendly
 *   - INTERESTED_MAYBE   : Vague interest → recruiter follow-up
 *   - NOT_INTERESTED_NOW : Not right now → nurture sequence (3 months)
 *   - NOT_INTERESTED_EVER: Hard no → archive
 *   - QUESTION           : Has a question → alert recruiter
 *   - AUTO_REPLY         : Out of office / automated → ignore
 *
 * Can be triggered manually or via webhook from email provider / PhantomBuster.
 */

const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";
const CLAUDE_MODEL = "claude-sonnet-4-5-20250929";

type Classification =
  | "INTERESTED_YES"
  | "INTERESTED_MAYBE"
  | "NOT_INTERESTED_NOW"
  | "NOT_INTERESTED_EVER"
  | "QUESTION"
  | "AUTO_REPLY";

interface ClassifyRequest {
  message_id?: string;
  candidate_id: string;
  reply_content: string;
  channel?: string;
}

async function classifyReply(
  replyContent: string,
  originalOutreach: string
): Promise<{
  classification: Classification;
  confidence: number;
  summary: string;
  suggested_next_action: string;
}> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

  const prompt = `You are classifying a candidate's reply to a recruiter outreach.

ORIGINAL OUTREACH:
${originalOutreach}

CANDIDATE REPLY:
${replyContent}

Classify into ONE category and return JSON only:
{
  "classification": "INTERESTED_YES" | "INTERESTED_MAYBE" | "NOT_INTERESTED_NOW" | "NOT_INTERESTED_EVER" | "QUESTION" | "AUTO_REPLY",
  "confidence": <0-100>,
  "summary": "<1-sentence summary of what they said>",
  "suggested_next_action": "<1-sentence recommendation>"
}

Rules:
- INTERESTED_YES: Clear yes, asks for call/info, shares availability
- INTERESTED_MAYBE: Vague positive, "tell me more", "send info"
- NOT_INTERESTED_NOW: Happy where they are but open later, "not right now", "check back in 6 months"
- NOT_INTERESTED_EVER: Strong no, not looking, rude, unsubscribe request
- QUESTION: Asks specific question (comp? remote? visa? tech stack?)
- AUTO_REPLY: Out-of-office, vacation autoresponder, automated`;

  const response = await fetch(CLAUDE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 500,
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

  return JSON.parse(jsonMatch[0]);
}

const CLASSIFICATION_TO_STATUS: Record<Classification, string> = {
  INTERESTED_YES: "replied_interested",
  INTERESTED_MAYBE: "replied_interested",
  NOT_INTERESTED_NOW: "replied_not_now",
  NOT_INTERESTED_EVER: "replied_not_interested",
  QUESTION: "replied_interested", // recruiter follows up
  AUTO_REPLY: "outreached", // don't change status
};

export async function POST(request: Request) {
  try {
    const body: ClassifyRequest = await request.json();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Load original outreach context
    const { data: lastOutreach } = await supabase
      .from("outreach_messages")
      .select("*")
      .eq("candidate_id", body.candidate_id)
      .eq("status", "sent")
      .order("sent_at", { ascending: false })
      .limit(1)
      .single();

    const originalOutreach = lastOutreach?.body || "(no prior message found)";

    // Classify with Claude
    const classification = await classifyReply(body.reply_content, originalOutreach);

    // Save classification on outreach message if we have the ID
    if (body.message_id) {
      await supabase
        .from("outreach_messages")
        .update({
          status: "replied",
          replied_at: new Date().toISOString(),
          reply_content: body.reply_content,
          reply_classification: classification.classification,
        })
        .eq("id", body.message_id);
    }

    // Update candidate status
    const newStatus = CLASSIFICATION_TO_STATUS[classification.classification];
    if (newStatus) {
      await supabase
        .from("sourced_candidates")
        .update({ status: newStatus })
        .eq("id", body.candidate_id);
    }

    // Auto-send Calendly if INTERESTED_YES (optional, requires Calendly webhook + Resend)
    // This is a placeholder for Phase 3 — can be activated later
    let autoActionTaken: string | null = null;
    if (classification.classification === "INTERESTED_YES") {
      // TODO: send Calendly link automatically
      autoActionTaken = "Would send Calendly link (Phase 3 activation pending)";
    }

    return NextResponse.json({
      success: true,
      classification: classification.classification,
      confidence: classification.confidence,
      summary: classification.summary,
      suggested_next_action: classification.suggested_next_action,
      new_candidate_status: newStatus,
      auto_action_taken: autoActionTaken,
      cost_usd: 0.02,
    });
  } catch (error) {
    console.error("[api/recruiter/classify-reply] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
