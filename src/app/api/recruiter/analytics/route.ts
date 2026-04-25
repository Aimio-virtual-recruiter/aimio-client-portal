import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * GET /api/recruiter/analytics
 *
 * Returns full-funnel analytics for the recruiter dashboard:
 *  - Per-client funnel (sourced → replied → delivered → hired)
 *  - Global stats (total MRR, total sourced, conversion rates)
 *  - Per-sourcing-run performance
 */

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Global counts
    const { count: totalSourced } = await supabase
      .from("sourced_candidates")
      .select("*", { count: "exact", head: true });

    const { count: totalDelivered } = await supabase
      .from("sourced_candidates")
      .select("*", { count: "exact", head: true })
      .eq("status", "delivered");

    const { count: totalOutreached } = await supabase
      .from("sourced_candidates")
      .select("*", { count: "exact", head: true })
      .in("status", ["outreached", "replied_interested", "replied_not_now", "replied_not_interested", "qualifying", "qualified", "delivered", "hired"]);

    const { count: totalReplied } = await supabase
      .from("sourced_candidates")
      .select("*", { count: "exact", head: true })
      .in("status", ["replied_interested", "replied_not_now", "replied_not_interested", "qualifying", "qualified", "delivered", "hired"]);

    const { count: totalInterested } = await supabase
      .from("sourced_candidates")
      .select("*", { count: "exact", head: true })
      .in("status", ["replied_interested", "qualifying", "qualified", "delivered", "hired"]);

    const { count: totalHired } = await supabase
      .from("sourced_candidates")
      .select("*", { count: "exact", head: true })
      .eq("status", "hired");

    // MRR
    const { data: activeClients } = await supabase
      .from("clients")
      .select("mrr_usd, plan")
      .in("status", ["active", "onboarding"]);

    const mrrTotal = (activeClients || []).reduce((sum, c) => sum + (c.mrr_usd || 0), 0);
    const arrTotal = mrrTotal * 12;

    // Per-client funnel (from view)
    const { data: funnelData } = await supabase
      .from("v_sourcing_funnel")
      .select("*")
      .order("sourced", { ascending: false });

    // Recent sourcing runs
    const { data: recentRuns } = await supabase
      .from("sourcing_runs")
      .select("id, client_id, position_title, status, candidates_found, candidates_after_dedupe, started_at, completed_at, estimated_cost_usd")
      .order("started_at", { ascending: false })
      .limit(20);

    // Per-recruiter performance
    const { data: recruiterStats } = await supabase
      .from("sourcing_runs")
      .select("recruiter_email, candidates_found")
      .not("recruiter_email", "is", null);

    const recruiterPerf: Record<string, { runs: number; candidates: number }> = {};
    (recruiterStats || []).forEach((r) => {
      if (!r.recruiter_email) return;
      if (!recruiterPerf[r.recruiter_email]) {
        recruiterPerf[r.recruiter_email] = { runs: 0, candidates: 0 };
      }
      recruiterPerf[r.recruiter_email].runs += 1;
      recruiterPerf[r.recruiter_email].candidates += r.candidates_found || 0;
    });

    // Conversion rates
    const conversionRates = {
      sourced_to_outreached: totalSourced
        ? ((totalOutreached || 0) / totalSourced * 100).toFixed(1)
        : "0",
      outreached_to_replied: totalOutreached
        ? ((totalReplied || 0) / totalOutreached * 100).toFixed(1)
        : "0",
      replied_to_interested: totalReplied
        ? ((totalInterested || 0) / totalReplied * 100).toFixed(1)
        : "0",
      interested_to_delivered: totalInterested
        ? ((totalDelivered || 0) / totalInterested * 100).toFixed(1)
        : "0",
      delivered_to_hired: totalDelivered
        ? ((totalHired || 0) / totalDelivered * 100).toFixed(1)
        : "0",
      overall_sourced_to_hired: totalSourced
        ? ((totalHired || 0) / totalSourced * 100).toFixed(2)
        : "0",
    };

    return NextResponse.json({
      global: {
        total_sourced: totalSourced || 0,
        total_outreached: totalOutreached || 0,
        total_replied: totalReplied || 0,
        total_interested: totalInterested || 0,
        total_delivered: totalDelivered || 0,
        total_hired: totalHired || 0,
        mrr_usd: mrrTotal,
        arr_usd: arrTotal,
        active_clients: activeClients?.length || 0,
      },
      conversion_rates: conversionRates,
      per_client_funnel: funnelData || [],
      recent_sourcing_runs: recentRuns || [],
      per_recruiter: recruiterPerf,
    });
  } catch (error) {
    console.error("[api/recruiter/analytics] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
