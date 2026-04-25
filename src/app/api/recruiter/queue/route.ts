import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * GET /api/recruiter/queue
 * Returns candidates in queue (new/kept/outreach_ready) for a recruiter to review.
 * Filterable by sourcing_run_id or client_id.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const runId = searchParams.get("sourcing_run_id");
    const clientId = searchParams.get("client_id");
    const status = searchParams.get("status"); // comma-separated

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Try the view first, fall back to base query
    let candidates;
    const { data: viewData, error: viewError } = await supabase
      .from("v_recruiter_queue")
      .select("*")
      .order("ai_score", { ascending: false, nullsFirst: false })
      .limit(200);

    if (viewError) {
      // Fallback: base table with client join
      let query = supabase
        .from("sourced_candidates")
        .select("*, clients(company_name, contact_first_name), sourcing_runs(position_title)")
        .order("ai_score", { ascending: false, nullsFirst: false })
        .limit(200);

      const statusList = status ? status.split(",") : ["new", "kept", "outreach_ready"];
      query = query.in("status", statusList);
      if (runId) query = query.eq("sourcing_run_id", runId);
      if (clientId) query = query.eq("client_id", clientId);

      const { data, error } = await query;
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      // Flatten join
      candidates = (data || []).map((c) => {
        const clientRef = c.clients as { company_name?: string; contact_first_name?: string } | null;
        const runRef = c.sourcing_runs as { position_title?: string } | null;
        return {
          ...c,
          client_company_name: clientRef?.company_name,
          client_contact_first_name: clientRef?.contact_first_name,
          position_title: runRef?.position_title,
        };
      });
    } else {
      // Use view, apply filters
      candidates = viewData || [];
      if (runId) candidates = candidates.filter((c) => c.sourcing_run_id === runId);
      if (clientId) candidates = candidates.filter((c) => c.client_id === clientId);
      if (status) {
        const statusList = status.split(",");
        candidates = candidates.filter((c) => statusList.includes(c.status));
      }
    }

    return NextResponse.json({ candidates });
  } catch (error) {
    console.error("[api/recruiter/queue] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
