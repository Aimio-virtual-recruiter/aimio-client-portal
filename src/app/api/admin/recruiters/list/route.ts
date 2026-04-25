import { NextResponse } from "next/server";
import { createSupabaseAdminClient, getCurrentUser } from "@/lib/supabase/server";

/**
 * GET /api/admin/recruiters/list
 * Returns all recruiter accounts with their stats.
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized — admin only" }, { status: 403 });
    }

    const admin = createSupabaseAdminClient();

    // Fetch all profiles with role = recruiter or admin
    const { data: profiles, error } = await admin
      .from("profiles")
      .select("*")
      .in("role", ["recruiter", "admin"])
      .order("created_at", { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Enrich with sourcing_runs + delivery counts
    interface Profile {
      id: string;
      email: string;
      assigned_client_ids?: string[];
      [key: string]: unknown;
    }
    const enriched = await Promise.all(
      ((profiles || []) as Profile[]).map(async (p: Profile) => {
        const [{ count: runsCount }, { count: deliveredCount }] = await Promise.all([
          admin
            .from("sourcing_runs")
            .select("*", { count: "exact", head: true })
            .eq("recruiter_email", p.email),
          admin
            .from("sourced_candidates")
            .select("*", { count: "exact", head: true })
            .eq("status", "delivered"),
        ]);

        return {
          ...p,
          stats: {
            sourcing_runs: runsCount || 0,
            candidates_delivered: deliveredCount || 0,
            assigned_clients: p.assigned_client_ids?.length || 0,
          },
        };
      })
    );

    return NextResponse.json({ recruiters: enriched });
  } catch (error) {
    console.error("[api/admin/recruiters/list] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
