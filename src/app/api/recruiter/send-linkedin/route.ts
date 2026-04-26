import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getCurrentUser } from "@/lib/supabase/server";

export const maxDuration = 120;

/**
 * POST /api/recruiter/send-linkedin
 *
 * Launches a PhantomBuster Phantom to send a LinkedIn message
 * (connection request OR InMail) to a candidate.
 *
 * Supports 3 Phantom types:
 *  - "connection" : Auto Connect (sends connection request with note)
 *  - "inmail" : InMail Sender
 *  - "followup" : Message to existing connection
 */

const PHANTOMBUSTER_API_BASE = "https://api.phantombuster.com/api/v2";

interface SendLinkedInRequest {
  message_ids: string[]; // outreach_messages IDs
  phantom_id?: string; // override default
  dry_run?: boolean; // don't actually send, just validate
}

interface PhantomInput {
  sessionCookie: string;
  profileUrls?: string[];
  message?: string;
  messages?: Array<{ profileUrl: string; message: string }>;
  subject?: string;
  numberOfAddsPerLaunch?: number;
}

async function launchPhantom(phantomId: string, input: PhantomInput): Promise<{
  containerId: string;
  status: string;
}> {
  const apiKey = process.env.PHANTOMBUSTER_API_KEY;
  if (!apiKey) throw new Error("PHANTOMBUSTER_API_KEY not configured");

  const response = await fetch(`${PHANTOMBUSTER_API_BASE}/agents/launch`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Phantombuster-Key": apiKey,
    },
    body: JSON.stringify({
      id: phantomId,
      argument: JSON.stringify(input),
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`PhantomBuster error: ${err}`);
  }

  const data = await response.json();
  return {
    containerId: data.containerId,
    status: data.status || "launched",
  };
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    if (user.role !== "recruiter" && user.role !== "admin") {
      return NextResponse.json({ error: "Accès recruteur/admin requis" }, { status: 403 });
    }

    const body: SendLinkedInRequest = await request.json();
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
      .select("*, sourced_candidates(linkedin_url, full_name)")
      .in("id", body.message_ids);

    if (msgError || !messages) {
      return NextResponse.json({ error: "Failed to load messages" }, { status: 500 });
    }

    const sessionCookie = process.env.LINKEDIN_SESSION_COOKIE;
    if (!sessionCookie) {
      return NextResponse.json(
        { error: "LINKEDIN_SESSION_COOKIE not configured" },
        { status: 500 }
      );
    }

    // Group messages by channel (connection / inmail / followup)
    const byChannel = {
      linkedin_connection: [] as typeof messages,
      linkedin_inmail: [] as typeof messages,
      linkedin_followup: [] as typeof messages,
    };

    for (const msg of messages) {
      if (msg.channel in byChannel) {
        byChannel[msg.channel as keyof typeof byChannel].push(msg);
      }
    }

    const launches = [];

    // ===== CONNECTION REQUESTS =====
    if (byChannel.linkedin_connection.length > 0) {
      const phantomId =
        body.phantom_id || process.env.PHANTOMBUSTER_CONNECTION_PHANTOM_ID;
      if (phantomId) {
        const phantomMessages = byChannel.linkedin_connection
          .filter((m) => m.sourced_candidates?.linkedin_url)
          .map((m) => ({
            profileUrl: m.sourced_candidates!.linkedin_url!,
            message: m.body,
          }));

        if (!body.dry_run && phantomMessages.length > 0) {
          try {
            const result = await launchPhantom(phantomId, {
              sessionCookie,
              messages: phantomMessages,
              numberOfAddsPerLaunch: phantomMessages.length,
            });

            // Mark messages as queued
            await supabase
              .from("outreach_messages")
              .update({
                status: "queued",
                scheduled_for: new Date().toISOString(),
                phantombuster_run_id: result.containerId,
              })
              .in(
                "id",
                byChannel.linkedin_connection.map((m) => m.id)
              );

            launches.push({
              channel: "linkedin_connection",
              phantom_id: phantomId,
              container_id: result.containerId,
              count: phantomMessages.length,
            });
          } catch (err) {
            console.error("[send-linkedin] Connection phantom error:", err);
          }
        }
      }
    }

    // ===== INMAILS =====
    if (byChannel.linkedin_inmail.length > 0) {
      const phantomId = body.phantom_id || process.env.PHANTOMBUSTER_INMAIL_PHANTOM_ID;
      if (phantomId) {
        const inmailMessages = byChannel.linkedin_inmail
          .filter((m) => m.sourced_candidates?.linkedin_url)
          .map((m) => ({
            profileUrl: m.sourced_candidates!.linkedin_url!,
            subject: m.subject || "",
            message: m.body,
          }));

        if (!body.dry_run && inmailMessages.length > 0) {
          try {
            const result = await launchPhantom(phantomId, {
              sessionCookie,
              messages: inmailMessages,
            });

            await supabase
              .from("outreach_messages")
              .update({
                status: "queued",
                scheduled_for: new Date().toISOString(),
                phantombuster_run_id: result.containerId,
              })
              .in(
                "id",
                byChannel.linkedin_inmail.map((m) => m.id)
              );

            launches.push({
              channel: "linkedin_inmail",
              phantom_id: phantomId,
              container_id: result.containerId,
              count: inmailMessages.length,
            });
          } catch (err) {
            console.error("[send-linkedin] InMail phantom error:", err);
          }
        }
      }
    }

    // Mark candidates as outreached
    const candidateIds = [...new Set(messages.map((m) => m.candidate_id).filter(Boolean))];
    if (candidateIds.length > 0 && !body.dry_run) {
      await supabase
        .from("sourced_candidates")
        .update({ status: "outreached" })
        .in("id", candidateIds);
    }

    return NextResponse.json({
      success: true,
      dry_run: body.dry_run || false,
      launches,
      messages_processed: messages.length,
    });
  } catch (error) {
    console.error("[api/recruiter/send-linkedin] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
