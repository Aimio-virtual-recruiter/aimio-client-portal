import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * PATCH /api/recruiter/queue/[id]
 * Update status of a sourced candidate (keep, reject, etc.)
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!body.status) {
      return NextResponse.json({ error: "status required" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from("sourced_candidates")
      .update({ status: body.status })
      .eq("id", id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, candidate: data });
  } catch (error) {
    console.error("[api/recruiter/queue/[id]] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/recruiter/queue/[id]
 * Get full details of a single sourced candidate.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: candidate, error } = await supabase
      .from("sourced_candidates")
      .select("*, clients(company_name, country, roles_hiring_for), sourcing_runs(position_title, search_brief)")
      .eq("id", id)
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Load outreach messages for this candidate
    const { data: messages } = await supabase
      .from("outreach_messages")
      .select("*")
      .eq("candidate_id", id)
      .order("touch_number", { ascending: true });

    return NextResponse.json({ candidate, outreach_messages: messages || [] });
  } catch (error) {
    console.error("[api/recruiter/queue/[id]] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
