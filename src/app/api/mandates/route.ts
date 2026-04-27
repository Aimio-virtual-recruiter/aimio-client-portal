import { NextResponse } from "next/server";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabase/server";

/**
 * GET /api/mandates?client_id=<uuid>
 * Returns mandates for a client. Auth-scoped:
 *  - admin / recruiter → can list any client
 *  - client → can only list their own client_company_id
 */
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("client_id");
    if (!clientId) {
      return NextResponse.json({ error: "client_id required" }, { status: 400 });
    }

    // Tenant check for client users
    if (user.role === "client" && user.profile?.client_company_id !== clientId) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("mandates")
      .select("id, title, company_id, description, salary_min, salary_max, location, status, search_criteria, criteria_updated_at, created_at")
      .eq("company_id", clientId)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ mandates: data || [] });
  } catch (err) {
    console.error("[/api/mandates GET] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur" },
      { status: 500 }
    );
  }
}
