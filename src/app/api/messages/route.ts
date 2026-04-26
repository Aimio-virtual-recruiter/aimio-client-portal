import { NextResponse } from "next/server";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabase/server";

/**
 * GET /api/messages?thread_id=X
 *   Fetch messages in a thread
 *
 * GET /api/messages?list=threads
 *   List all threads for current user (client or recruiter)
 *
 * POST /api/messages
 *   Body: { thread_id?, client_id?, recruiter_id?, content }
 *   Create thread if needed + send message
 */

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const threadId = searchParams.get("thread_id");
    const listType = searchParams.get("list");

    const supabase = await createSupabaseServerClient();

    // List all threads for this user
    if (listType === "threads") {
      let query = supabase
        .from("v_client_thread_summary")
        .select("*")
        .order("last_message_at", { ascending: false, nullsFirst: false });

      if (user.role === "client") {
        // Only their own threads
        const clientCompanyId = user.profile?.client_company_id;
        if (!clientCompanyId) {
          return NextResponse.json({ threads: [] });
        }
        query = query.eq("client_id", clientCompanyId);
      } else if (user.role === "recruiter") {
        // Threads assigned to this recruiter
        query = query.eq("recruiter_id", user.id);
      }
      // Admin sees all

      const { data, error } = await query;
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ threads: data || [] });
    }

    // Fetch messages in a specific thread
    if (threadId) {
      const { data: messages, error } = await supabase
        .from("messages")
        .select("*")
        .eq("thread_id", threadId)
        .order("created_at", { ascending: true });

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      // Mark as read for current user
      const readerType = user.role === "client" ? "client" : "recruiter";
      await supabase.rpc("mark_thread_read", {
        p_thread_id: threadId,
        p_reader_type: readerType,
      });

      return NextResponse.json({ messages: messages || [] });
    }

    return NextResponse.json({ error: "Specify ?list=threads or ?thread_id=X" }, { status: 400 });
  } catch (error) {
    console.error("[api/messages GET] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

interface SendMessageBody {
  thread_id?: string;
  client_id?: string;
  recruiter_id?: string;
  content: string;
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: SendMessageBody = await request.json();
    if (!body.content?.trim()) {
      return NextResponse.json({ error: "content required" }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();

    let threadId = body.thread_id;

    // Create thread if needed
    if (!threadId) {
      // Determine client_id and recruiter_id
      let clientId = body.client_id;
      let recruiterId = body.recruiter_id;

      if (user.role === "client") {
        clientId = user.profile?.client_company_id;
        if (!clientId) {
          return NextResponse.json({ error: "Client has no company" }, { status: 400 });
        }
        // Find their assigned recruiter — prefer recruiter_id (UUID) over recruteur_lead (slug/name)
        if (!recruiterId) {
          const { data: client } = await supabase
            .from("clients")
            .select("recruiter_id, recruteur_lead")
            .eq("id", clientId)
            .single();

          // 1. Direct UUID link (preferred — no ambiguity)
          if (client?.recruiter_id) {
            recruiterId = client.recruiter_id;
          } else if (client?.recruteur_lead) {
            // 2. Fallback: lookup by recruteur_lead which may be a slug like "anne-marie"
            //    or a full name like "Anne-Marie Tremblay" — match against any recruiter
            //    whose profile has a slugified name equal to the stored value.
            const lead = client.recruteur_lead.trim().toLowerCase();
            const { data: recruiters } = await supabase
              .from("profiles")
              .select("id, first_name, last_name")
              .eq("role", "recruiter")
              .limit(50);

            const slugify = (s: string) =>
              s.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "");

            const match = (recruiters || []).find((r) => {
              const fullName = `${r.first_name || ""} ${r.last_name || ""}`.trim().toLowerCase();
              const slug = slugify(`${r.first_name || ""} ${r.last_name || ""}`);
              return (
                fullName === lead ||
                slug === lead ||
                slugify(r.first_name || "") === lead
              );
            });
            if (match) recruiterId = match.id;
          }
        }
      } else if (user.role === "recruiter" || user.role === "admin") {
        recruiterId = user.id;
      }

      if (!clientId) {
        return NextResponse.json({ error: "client_id required" }, { status: 400 });
      }

      // Upsert thread
      const { data: thread, error: threadError } = await supabase
        .from("message_threads")
        .upsert(
          { client_id: clientId, recruiter_id: recruiterId },
          { onConflict: "client_id,recruiter_id" }
        )
        .select()
        .single();

      if (threadError) {
        return NextResponse.json({ error: threadError.message }, { status: 500 });
      }
      threadId = thread.id;
    }

    // Determine sender type
    const senderType =
      user.role === "client"
        ? "client"
        : user.role === "admin"
        ? "admin"
        : "recruiter";

    const senderName = `${user.first_name} ${user.last_name}`.trim() || user.email || "User";

    // Insert message
    const { data: message, error: msgError } = await supabase
      .from("messages")
      .insert({
        thread_id: threadId,
        sender_id: user.id,
        sender_type: senderType,
        sender_name: senderName,
        content: body.content,
      })
      .select()
      .single();

    if (msgError) {
      return NextResponse.json({ error: msgError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message, thread_id: threadId });
  } catch (error) {
    console.error("[api/messages POST] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
