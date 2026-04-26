import { NextResponse } from "next/server";
import { markUnsubscribed, verifyUnsubscribeToken } from "@/lib/email-utils";

/**
 * GET /api/unsubscribe?email=X&token=Y
 *   Mark email as unsubscribed (called from email link)
 *   Returns redirect to /unsubscribe page
 *
 * POST /api/unsubscribe
 *   Body: { email, token }
 *   Same but returns JSON (for one-click List-Unsubscribe-Post header)
 */

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    const token = searchParams.get("token");

    if (!email || !token) {
      return NextResponse.redirect(new URL("/unsubscribe?error=invalid", request.url));
    }

    if (!verifyUnsubscribeToken(email, token)) {
      return NextResponse.redirect(new URL("/unsubscribe?error=invalid", request.url));
    }

    await markUnsubscribed({
      email,
      reason: "user_clicked",
      source: "resend",
      ip: request.headers.get("x-forwarded-for") || undefined,
      userAgent: request.headers.get("user-agent") || undefined,
    });

    return NextResponse.redirect(
      new URL(`/unsubscribe?status=ok&email=${encodeURIComponent(email)}`, request.url)
    );
  } catch (error) {
    console.error("[api/unsubscribe GET]", error);
    return NextResponse.redirect(new URL("/unsubscribe?error=server", request.url));
  }
}

export async function POST(request: Request) {
  try {
    let email: string | null = null;
    let token: string | null = null;

    // Support both JSON body and form-urlencoded (for Mail clients one-click)
    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const body = await request.json();
      email = body.email;
      token = body.token;
    } else {
      const form = await request.formData();
      email = form.get("email") as string | null;
      token = form.get("token") as string | null;
    }

    // Also check query params (some mail clients append to URL)
    if (!email || !token) {
      const { searchParams } = new URL(request.url);
      email = email || searchParams.get("email");
      token = token || searchParams.get("token");
    }

    if (!email || !token || !verifyUnsubscribeToken(email, token)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    await markUnsubscribed({
      email,
      reason: "user_clicked",
      source: "list_unsubscribe_post",
      ip: request.headers.get("x-forwarded-for") || undefined,
      userAgent: request.headers.get("user-agent") || undefined,
    });

    return NextResponse.json({ success: true, email });
  } catch (error) {
    console.error("[api/unsubscribe POST]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}
