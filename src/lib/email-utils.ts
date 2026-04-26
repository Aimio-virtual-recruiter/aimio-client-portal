import crypto from "crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

/**
 * Email utilities — unsubscribe handling, opt-out checks, footer generation
 *
 * Used by all Resend-sent emails to ensure CAN-SPAM, GDPR, CASL, Loi 25 compliance.
 */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://hireaimio.com";
const UNSUBSCRIBE_SECRET = process.env.UNSUBSCRIBE_SECRET || "aimio-unsub-default-change-me";

/**
 * Generate a signed unsubscribe token for a given email.
 * Prevents tampering — only Aimio can generate valid tokens.
 */
export function generateUnsubscribeToken(email: string): string {
  return crypto
    .createHmac("sha256", UNSUBSCRIBE_SECRET)
    .update(email.toLowerCase().trim())
    .digest("hex")
    .slice(0, 32);
}

export function verifyUnsubscribeToken(email: string, token: string): boolean {
  const expected = generateUnsubscribeToken(email);
  return expected === token;
}

/**
 * Build a one-click unsubscribe URL for a given email.
 * Used in email body link.
 */
export function buildUnsubscribeUrl(email: string): string {
  const token = generateUnsubscribeToken(email);
  const params = new URLSearchParams({ email, token });
  return `${APP_URL}/unsubscribe?${params.toString()}`;
}

/**
 * Check if an email is on the opt-out list.
 * MUST be called before sending any marketing email.
 */
export async function isEmailOptedOut(email: string): Promise<boolean> {
  if (!email) return false;
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("unsubscribed_emails")
    .select("id, resubscribed_at")
    .ilike("email", email.trim())
    .is("resubscribed_at", null)
    .limit(1)
    .single();
  return !!data;
}

/**
 * Mark an email as unsubscribed.
 */
export async function markUnsubscribed(params: {
  email: string;
  reason?: string;
  source?: string;
  ip?: string;
  userAgent?: string;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("unsubscribed_emails")
    .upsert(
      {
        email: params.email.toLowerCase().trim(),
        reason: params.reason || "user_clicked",
        source: params.source || "resend",
        ip_address: params.ip,
        user_agent: params.userAgent,
        unsubscribed_at: new Date().toISOString(),
      },
      { onConflict: "email" }
    );

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * Standard email footer with company info + unsubscribe link.
 * REQUIRED in every Resend marketing email.
 */
export function buildEmailFooter(recipientEmail: string, options?: {
  showUnsubscribe?: boolean;
}): string {
  const showUnsub = options?.showUnsubscribe !== false;
  const unsubUrl = buildUnsubscribeUrl(recipientEmail);

  return `
<div style="border-top:1px solid #e4e4e7;padding-top:20px;margin-top:32px;text-align:center;">
  <p style="font-size:11px;color:#71717a;line-height:1.6;margin:0 0 8px;">
    <strong>Aimio Recrutement Inc.</strong><br>
    2201-1020 rue de Bleury, Montreal, QC, H2Z 0B9, Canada
  </p>
  ${showUnsub ? `
  <p style="font-size:11px;color:#71717a;line-height:1.6;margin:0 0 8px;">
    Don't want to receive these emails?
    <a href="${unsubUrl}" style="color:#2445EB;text-decoration:underline;">Unsubscribe</a>
    ·
    <a href="${APP_URL}/privacy" style="color:#2445EB;text-decoration:underline;">Privacy Policy</a>
  </p>` : ""}
  <p style="font-size:10px;color:#a1a1aa;line-height:1.5;margin:0;">
    You're receiving this because we identified you as a potential match for an opportunity.
    Reply &quot;STOP&quot; or click unsubscribe above to opt out instantly.
  </p>
</div>`;
}

/**
 * Standard headers for Resend that enable native one-click unsubscribe
 * in Gmail, Outlook, Apple Mail, etc.
 *
 * Usage with Resend:
 *   await resend.emails.send({
 *     from, to, subject, html,
 *     headers: buildEmailHeaders(recipientEmail),
 *   });
 */
export function buildEmailHeaders(recipientEmail: string): Record<string, string> {
  const unsubUrl = buildUnsubscribeUrl(recipientEmail);
  return {
    "List-Unsubscribe": `<${unsubUrl}>, <mailto:unsubscribe@aimiorecrutement.com>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    "Precedence": "bulk",
  };
}

/**
 * Send-safe wrapper — checks opt-out status before sending via Resend.
 * Use this instead of resend.emails.send() directly for marketing/outreach emails.
 *
 * Returns:
 *   { sent: true } if sent
 *   { sent: false, reason: "opted_out" } if recipient opted out
 *   { sent: false, reason: "error", error: ... } on error
 */
export async function sendCompliantEmail(params: {
  to: string;
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
  skipOptOutCheck?: boolean; // Only for transactional like password reset
}): Promise<{ sent: boolean; reason?: string; error?: string; id?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { sent: false, reason: "error", error: "RESEND_API_KEY not configured" };

  // Check opt-out (skip only for transactional like password reset)
  if (!params.skipOptOutCheck) {
    const isOptedOut = await isEmailOptedOut(params.to);
    if (isOptedOut) {
      console.log(`[email] Skipping ${params.to} — opted out`);
      return { sent: false, reason: "opted_out" };
    }
  }

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);

    const result = await resend.emails.send({
      from: params.from || "Aimio <hi@send.aimiorecrutement.com>",
      to: [params.to],
      replyTo: params.replyTo || "marc@aimiorecrutement.com",
      subject: params.subject,
      html: params.html + buildEmailFooter(params.to),
      headers: buildEmailHeaders(params.to),
    });

    return { sent: true, id: result.data?.id };
  } catch (error) {
    return {
      sent: false,
      reason: "error",
      error: error instanceof Error ? error.message : "Unknown",
    };
  }
}
