import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * GET /api/recruiter/clients
 * Returns active RV clients with aggregated stats for the recruiter dashboard.
 */
export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Try the view first (if schema applied), fall back to base table
    let clients;
    const { data: viewData, error: viewError } = await supabase
      .from("v_recruiter_client_summary")
      .select("*")
      .in("status", ["active", "onboarding"])
      .order("mrr_usd", { ascending: false });

    if (viewError) {
      // Fallback: query base clients table
      const { data: baseData, error: baseError } = await supabase
        .from("clients")
        .select("*")
        .in("status", ["active", "onboarding"])
        .order("mrr_usd", { ascending: false });

      if (baseError) {
        return NextResponse.json({ error: baseError.message }, { status: 500 });
      }
      clients = baseData;
    } else {
      clients = viewData;
    }

    return NextResponse.json({ clients: clients || [] });
  } catch (error) {
    console.error("[api/recruiter/clients] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
