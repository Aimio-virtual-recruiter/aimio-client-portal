import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createSupabaseAdminClient, getCurrentUser } from "@/lib/supabase/server";

/**
 * POST /api/admin/recruiters/invite
 * Invites a new recruiter to the platform.
 *
 * Flow:
 *  1. Admin calls this endpoint with { email, first_name, assigned_client_ids }
 *  2. We call supabase.auth.admin.inviteUserByEmail — this creates the user + sends invite
 *  3. Supabase sends a magic link email (or we send our own custom email via Resend)
 *  4. Profile row auto-created by trigger with role='recruiter'
 *  5. User clicks link → lands on /recruiter/welcome → sets password
 */

interface InviteRequest {
  email: string;
  first_name: string;
  last_name?: string;
  assigned_client_ids?: string[];
  phone?: string;
}

export async function POST(request: Request) {
  try {
    // Check admin auth
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized — admin only" }, { status: 403 });
    }

    const body: InviteRequest = await request.json();
    if (!body.email || !body.first_name) {
      return NextResponse.json({ error: "email and first_name required" }, { status: 400 });
    }

    const admin = createSupabaseAdminClient();

    // Invite the user — this creates auth.users entry + sends Supabase default email
    const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://hireaimio.com"}/recruiter/welcome`;

    const { data: inviteData, error: inviteError } = await admin.auth.admin.inviteUserByEmail(
      body.email,
      {
        redirectTo: redirectUrl,
        data: {
          first_name: body.first_name,
          last_name: body.last_name || "",
          role: "recruiter",
          invited_by: user.id,
        },
      }
    );

    if (inviteError) {
      // If user already exists, try to regenerate link
      if (inviteError.message?.includes("already")) {
        return NextResponse.json(
          { error: `A user with email ${body.email} already exists` },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: inviteError.message }, { status: 500 });
    }

    const newUser = inviteData.user;
    if (!newUser) {
      return NextResponse.json({ error: "Invitation failed" }, { status: 500 });
    }

    // Upsert profile with proper role + assigned clients
    // (the trigger creates a default row, we update it here to set role + assignments)
    await admin
      .from("profiles")
      .upsert({
        id: newUser.id,
        email: body.email,
        first_name: body.first_name,
        last_name: body.last_name || "",
        phone: body.phone,
        role: "recruiter",
        assigned_client_ids: body.assigned_client_ids || [],
        invited_by: user.id,
        invited_at: new Date().toISOString(),
        is_active: true,
      }, { onConflict: "id" });

    // Send a custom branded welcome email (on top of Supabase's default)
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      try {
        const resend = new Resend(resendKey);

        // Generate a fresh magic link for the custom email
        const { data: linkData } = await admin.auth.admin.generateLink({
          type: "invite",
          email: body.email,
          options: { redirectTo: redirectUrl },
        });

        const inviteLink = linkData?.properties?.action_link || redirectUrl;

        await resend.emails.send({
          from: "Aimio <team@send.aimiorecrutement.com>",
          to: [body.email],
          replyTo: user.email || "marc@aimiorecrutement.com",
          subject: `${body.first_name}, welcome to Aimio`,
          html: buildInviteEmail({
            firstName: body.first_name,
            inviterName: `${user.first_name || ""} ${user.last_name || ""}`.trim() || "Marc-Antoine",
            inviteLink,
          }),
        });
      } catch (emailErr) {
        console.error("[invite] Custom email failed (Supabase default still sent):", emailErr);
      }
    }

    return NextResponse.json({
      success: true,
      user_id: newUser.id,
      email: body.email,
      message: `Invitation sent to ${body.email}`,
    });
  } catch (error) {
    console.error("[api/admin/recruiters/invite] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

function buildInviteEmail(params: {
  firstName: string;
  inviterName: string;
  inviteLink: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#fafafa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px;color:#18181b;">
    <div style="text-align:center;margin-bottom:40px;">
      <h1 style="font-size:24px;font-weight:700;color:#2445EB;margin:0;letter-spacing:-0.02em;">Aimio</h1>
      <p style="font-size:11px;color:#71717a;margin:4px 0 0;letter-spacing:0.1em;text-transform:uppercase;">Virtual Recruiter</p>
    </div>

    <h2 style="font-size:24px;font-weight:700;color:#09090b;margin:0 0 16px;letter-spacing:-0.02em;">Hey ${params.firstName},</h2>

    <p style="font-size:16px;line-height:1.6;color:#3f3f46;margin:0 0 20px;">
      ${params.inviterName} has invited you to join the Aimio Virtual Recruiter platform.
    </p>

    <p style="font-size:15px;line-height:1.6;color:#3f3f46;margin:0 0 28px;">
      You'll have access to the recruiter portal where you can:
    </p>

    <ul style="font-size:14px;line-height:1.8;color:#3f3f46;padding-left:20px;margin:0 0 32px;">
      <li>Run AI-powered sourcing on LinkedIn + Apollo</li>
      <li>Review scored candidates in your queue</li>
      <li>Send personalized multi-touch outreach</li>
      <li>Deliver qualified candidates to clients</li>
    </ul>

    <div style="text-align:center;margin:32px 0;">
      <a href="${params.inviteLink}"
         style="display:inline-block;background:#2445EB;color:#ffffff;padding:14px 36px;border-radius:999px;text-decoration:none;font-size:14px;font-weight:600;box-shadow:0 4px 12px rgba(36,69,235,0.2);">
        Activate my account →
      </a>
    </div>

    <p style="font-size:13px;color:#71717a;line-height:1.6;margin:32px 0 0;">
      This link is unique to you. If you didn&apos;t expect this, you can ignore this email.
    </p>

    <div style="border-top:1px solid #e4e4e7;padding-top:16px;margin-top:32px;">
      <p style="font-size:12px;color:#71717a;margin:0;">
        ${params.inviterName}<br>
        Aimio Recrutement Inc. · <a href="https://hireaimio.com" style="color:#2445EB;text-decoration:none;">hireaimio.com</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}
