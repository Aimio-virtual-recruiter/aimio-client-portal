import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * POST /api/recruiter/send-email
 *
 * Sends outreach emails through Instantly.ai (recommended for deliverability + warmup)
 * Falls back to Resend if Instantly is not configured.
 *
 * Instantly handles:
 *  - Inbox warmup (auto-send replies between your own inboxes to build reputation)
 *  - Sequences with delays between touches
 *  - Reply detection
 *  - Unsubscribe management
 */

const INSTANTLY_API_BASE = "https://api.instantly.ai/api/v1";

interface SendEmailRequest {
  message_ids: string[];
  campaign_id?: string; // Instantly campaign
  test_mode?: boolean; // send to test email instead
}

async function addLeadsToInstantlyCampaign(
  campaignId: string,
  leads: Array<{ email: string; first_name: string; last_name: string; company?: string; custom_variables?: Record<string, string> }>
): Promise<{ added: number; skipped: number }> {
  const apiKey = process.env.INSTANTLY_API_KEY;
  if (!apiKey) throw new Error("INSTANTLY_API_KEY not configured");

  const response = await fetch(`${INSTANTLY_API_BASE}/lead/add`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      campaign_id: campaignId,
      skip_if_in_workspace: true,
      leads,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Instantly API error: ${err}`);
  }

  const data = await response.json();
  return {
    added: data.added_count || leads.length,
    skipped: data.skipped_count || 0,
  };
}

// Use compliance-aware sender that auto-checks opt-out + adds footer + headers
import { sendCompliantEmail } from "@/lib/email-utils";

async function sendViaResend(
  to: string,
  subject: string,
  body: string,
  from: string,
  replyTo: string
) {
  // Convert plain text body to HTML so footer + List-Unsubscribe headers work
  const htmlBody = body
    .split("\n")
    .map((line) => `<p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#3f3f46;">${line || "&nbsp;"}</p>`)
    .join("");

  const result = await sendCompliantEmail({
    to,
    from,
    replyTo,
    subject,
    html: htmlBody,
  });

  if (!result.sent && result.reason === "opted_out") {
    console.log(`[send-email] ${to} opted out — skipping`);
    return null;
  }
  if (!result.sent) {
    throw new Error(result.error || "Send failed");
  }
  return result;
}

export async function POST(request: Request) {
  try {
    const body: SendEmailRequest = await request.json();
    if (!body.message_ids || body.message_ids.length === 0) {
      return NextResponse.json({ error: "message_ids required" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Load messages + candidates
    const { data: messages, error: msgError } = await supabase
      .from("outreach_messages")
      .select("*, sourced_candidates(email, first_name, last_name, current_company, full_name, email_verified)")
      .in("id", body.message_ids)
      .eq("channel", "email");

    if (msgError || !messages) {
      return NextResponse.json({ error: "Failed to load messages" }, { status: 500 });
    }

    // Filter: only candidates with verified emails
    const valid = messages.filter(
      (m) => m.sourced_candidates?.email && m.sourced_candidates.email_verified
    );
    const invalid = messages.length - valid.length;

    const campaignId = body.campaign_id || process.env.INSTANTLY_DEFAULT_CAMPAIGN_ID;
    const useInstantly = !!(process.env.INSTANTLY_API_KEY && campaignId);

    let sentCount = 0;
    let failedCount = 0;

    if (useInstantly && !body.test_mode) {
      // ===== Send via Instantly (preferred) =====
      const leads = valid.map((m) => ({
        email: m.sourced_candidates!.email!,
        first_name: m.sourced_candidates!.first_name || "",
        last_name: m.sourced_candidates!.last_name || "",
        company: m.sourced_candidates!.current_company || "",
        custom_variables: {
          subject_line: m.subject || "",
          message_body: m.body,
          message_id: m.id,
        },
      }));

      try {
        const result = await addLeadsToInstantlyCampaign(campaignId!, leads);
        sentCount = result.added;

        // Mark as queued
        await supabase
          .from("outreach_messages")
          .update({
            status: "queued",
            scheduled_for: new Date().toISOString(),
            instantly_campaign_id: campaignId,
          })
          .in(
            "id",
            valid.map((m) => m.id)
          );
      } catch (err) {
        console.error("[send-email] Instantly error:", err);
        failedCount = valid.length;
      }
    } else {
      // ===== Fallback: send via Resend =====
      for (const msg of valid) {
        try {
          await sendViaResend(
            msg.sourced_candidates!.email!,
            msg.subject || "Quick note",
            msg.body,
            "Aimio <hi@send.aimiorecrutement.com>",
            "marc@aimiorecrutement.com"
          );

          await supabase
            .from("outreach_messages")
            .update({
              status: "sent",
              sent_at: new Date().toISOString(),
            })
            .eq("id", msg.id);

          sentCount++;
        } catch (err) {
          console.error("[send-email] Resend error:", err);
          failedCount++;
        }
      }
    }

    // Mark candidates as outreached
    const candidateIds = [...new Set(valid.map((m) => m.candidate_id).filter(Boolean))];
    if (candidateIds.length > 0) {
      await supabase
        .from("sourced_candidates")
        .update({ status: "outreached" })
        .in("id", candidateIds);
    }

    return NextResponse.json({
      success: true,
      provider: useInstantly ? "instantly" : "resend",
      sent: sentCount,
      failed: failedCount,
      skipped_no_email: invalid,
      total_processed: messages.length,
    });
  } catch (error) {
    console.error("[api/recruiter/send-email] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
