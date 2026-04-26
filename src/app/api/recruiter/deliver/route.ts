import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { getCurrentUser } from "@/lib/supabase/server";

export const maxDuration = 120;

/**
 * POST /api/recruiter/deliver
 *
 * Two actions:
 *  - action=score : Score a candidate with Claude (returns fit_score + analysis)
 *  - action=deliver : Save candidate + deliver to client (sends email)
 */

interface ScoreRequest {
  action: "score";
  candidate: {
    first_name: string;
    last_name: string;
    current_title?: string;
    current_company?: string;
    qualification_notes: string;
    interview_notes?: string;
  };
  position: string;
  client_context?: string;
}

interface DeliverRequest {
  action: "deliver";
  client_id: string;
  first_name: string;
  last_name: string;
  current_title: string;
  current_company: string;
  linkedin_url: string;
  city: string;
  salary_expectation: string;
  availability: string;
  position_applying_for: string;
  qualification_notes: string;
  interview_notes: string;
  ai_score: number | null;
  fit_analysis: string | null;
}

type RequestBody = ScoreRequest | DeliverRequest;

const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";
const CLAUDE_MODEL = "claude-sonnet-4-5-20250929";

async function callClaudeForScore(
  candidate: ScoreRequest["candidate"],
  position: string,
  clientContext: string
): Promise<{ score: number; analysis: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

  const prompt = `You are an expert recruiter scoring a candidate for a specific role.

POSITION: ${position}

CLIENT CONTEXT:
${clientContext || "Not provided"}

CANDIDATE:
Name: ${candidate.first_name} ${candidate.last_name}
Current: ${candidate.current_title || "?"} at ${candidate.current_company || "?"}

QUALIFICATION NOTES:
${candidate.qualification_notes}

${candidate.interview_notes ? `INTERVIEW NOTES:\n${candidate.interview_notes}` : ""}

Analyze this candidate's fit for the role. Return JSON only:
{
  "fit_score": <integer 0-100>,
  "analysis": "<2-3 sentences: strengths + concerns + recommendation, ~200 words max>"
}`;

  const response = await fetch(CLAUDE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 800,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Claude API error: ${errText}`);
  }

  const data = await response.json();
  const text = data.content?.[0]?.text || "";

  // Extract JSON
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Claude did not return valid JSON");

  const parsed = JSON.parse(jsonMatch[0]);
  return {
    score: parsed.fit_score || 0,
    analysis: parsed.analysis || "",
  };
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    if (user.role !== "recruiter" && user.role !== "admin") {
      return NextResponse.json({ error: "Accès recruteur/admin requis" }, { status: 403 });
    }

    const body: RequestBody = await request.json();

    // ===== SCORE ACTION =====
    if (body.action === "score") {
      const { score, analysis } = await callClaudeForScore(
        body.candidate,
        body.position,
        body.client_context || ""
      );
      return NextResponse.json({ score, analysis });
    }

    // ===== DELIVER ACTION =====
    if (body.action === "deliver") {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!supabaseUrl || !supabaseKey) {
        return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
      }
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Load client
      const { data: client, error: clientError } = await supabase
        .from("clients")
        .select("*")
        .eq("id", body.client_id)
        .single();

      if (clientError || !client) {
        return NextResponse.json({ error: "Client not found" }, { status: 404 });
      }

      // Insert sourced candidate as delivered
      const { data: candidate, error: insertError } = await supabase
        .from("sourced_candidates")
        .insert({
          client_id: body.client_id,
          first_name: body.first_name,
          last_name: body.last_name,
          full_name: `${body.first_name} ${body.last_name}`,
          current_title: body.current_title,
          current_company: body.current_company,
          linkedin_url: body.linkedin_url,
          location_city: body.city,
          salary_expectation: body.salary_expectation,
          availability: body.availability,
          qualification_notes: body.qualification_notes,
          interview_notes: body.interview_notes,
          ai_score: body.ai_score,
          source: "manual",
          status: "delivered",
          delivered_at: new Date().toISOString(),
          delivered_to_client_id: body.client_id,
        })
        .select()
        .single();

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }

      // Update client first_shortlist_delivered_at
      if (!client.first_shortlist_delivered_at) {
        await supabase
          .from("clients")
          .update({ first_shortlist_delivered_at: new Date().toISOString() })
          .eq("id", body.client_id);
      }

      // Send premium email
      const resendKey = process.env.RESEND_API_KEY;
      if (resendKey && client.contact_email) {
        try {
          const resend = new Resend(resendKey);
          await resend.emails.send({
            from: "Aimio <candidates@send.aimiorecrutement.com>",
            to: [client.contact_email],
            replyTo: "marc@aimiorecrutement.com",
            subject: `New qualified candidate — ${body.first_name} ${body.last_name} for ${body.position_applying_for}`,
            html: buildPremiumEmail({
              client,
              candidate: body,
              score: body.ai_score,
              analysis: body.fit_analysis,
            }),
          });
        } catch (emailErr) {
          console.error("[recruiter/deliver] Email failed:", emailErr);
        }
      }

      return NextResponse.json({
        success: true,
        candidate_id: candidate.id,
        message: `Candidate ${body.first_name} ${body.last_name} delivered to ${client.company_name}`,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("[api/recruiter/deliver] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

interface PremiumEmailParams {
  client: { company_name: string; contact_first_name: string; recruteur_lead: string | null };
  candidate: DeliverRequest;
  score: number | null;
  analysis: string | null;
}

// Escape HTML entities — prevents XSS in user-supplied fields rendered in emails
function esc(s: string | null | undefined): string {
  if (!s) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Validate URL — only http(s), no javascript: / data:
function safeUrl(u: string | null | undefined): string {
  if (!u) return "";
  try {
    const parsed = new URL(u);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.toString() : "";
  } catch {
    return "";
  }
}

function buildPremiumEmail(params: PremiumEmailParams): string {
  const { client, candidate, score, analysis } = params;
  const fullName = esc(`${candidate.first_name} ${candidate.last_name}`);
  const portalUrl = "https://hireaimio.com/dashboard";
  const linkedinUrl = safeUrl(candidate.linkedin_url);

  return `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#fafafa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:580px;margin:0 auto;padding:40px 24px;color:#18181b;">
    <div style="text-align:center;margin-bottom:32px;">
      <h1 style="font-size:24px;font-weight:700;color:#2445EB;margin:0;">Aimio</h1>
      <p style="font-size:11px;color:#71717a;margin:4px 0 0;letter-spacing:.05em;text-transform:uppercase;">Virtual Recruiter</p>
    </div>

    <p style="font-size:16px;line-height:1.6;">Hi ${esc(client.contact_first_name)},</p>
    <p style="font-size:16px;line-height:1.6;">New qualified candidate for <strong>${esc(candidate.position_applying_for)}</strong>:</p>

    <div style="background:linear-gradient(135deg,#2445EB 0%,#1A36C4 100%);border-radius:16px;padding:28px;margin:24px 0;color:#fff;">
      <p style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;opacity:.75;margin:0 0 8px;">Candidate</p>
      <h2 style="font-size:24px;font-weight:700;margin:0 0 6px;">${fullName}</h2>
      <p style="font-size:14px;opacity:.9;margin:0 0 16px;">${esc(candidate.current_title)}${candidate.current_company ? ` · ${esc(candidate.current_company)}` : ""}</p>
      ${score ? `<div style="display:inline-block;background:rgba(255,255,255,.2);border-radius:999px;padding:8px 16px;font-size:13px;font-weight:600;">Fit score: ${Number(score) || 0}/100</div>` : ""}
    </div>

    ${analysis ? `
    <div style="background:#f4f4f5;border-radius:12px;padding:20px;margin-bottom:24px;">
      <p style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:#2445EB;margin:0 0 10px;">AI analysis</p>
      <p style="font-size:14px;line-height:1.6;margin:0;color:#3f3f46;">${esc(analysis)}</p>
    </div>` : ""}

    <div style="background:#f4f4f5;border-radius:12px;padding:20px;margin-bottom:24px;">
      <p style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:#2445EB;margin:0 0 12px;">Quick facts</p>
      ${candidate.city ? `<p style="font-size:14px;margin:4px 0;"><strong>Location:</strong> ${esc(candidate.city)}</p>` : ""}
      ${candidate.salary_expectation ? `<p style="font-size:14px;margin:4px 0;"><strong>Salary expectation:</strong> ${esc(candidate.salary_expectation)}</p>` : ""}
      ${candidate.availability ? `<p style="font-size:14px;margin:4px 0;"><strong>Availability:</strong> ${esc(candidate.availability)}</p>` : ""}
      ${linkedinUrl ? `<p style="font-size:14px;margin:4px 0;"><strong>LinkedIn:</strong> <a href="${esc(linkedinUrl)}" style="color:#2445EB;">View profile</a></p>` : ""}
    </div>

    <div style="background:#fff;border:1px solid #e4e4e7;border-radius:12px;padding:20px;margin-bottom:24px;">
      <p style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:#71717a;margin:0 0 10px;">Qualification notes</p>
      <p style="font-size:14px;line-height:1.6;margin:0;color:#3f3f46;white-space:pre-line;">${esc(candidate.qualification_notes)}</p>
    </div>

    <div style="text-align:center;margin:32px 0;">
      <a href="${portalUrl}" style="display:inline-block;background:#2445EB;color:#fff;padding:14px 36px;border-radius:999px;text-decoration:none;font-size:14px;font-weight:600;">View in portal →</a>
    </div>

    <p style="font-size:13px;color:#71717a;line-height:1.6;">Quick feedback? Just reply to this email.</p>

    <div style="border-top:1px solid #e4e4e7;padding-top:16px;margin-top:32px;">
      <p style="font-size:13px;color:#71717a;margin:0;">
        ${esc(client.recruteur_lead) || "Your Aimio team"}<br>
        <a href="https://hireaimio.com" style="color:#2445EB;text-decoration:none;">hireaimio.com</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}
