import { NextResponse } from "next/server";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabase/server";

/**
 * PATCH /api/mandates/[id]/criteria
 * Body: { search_criteria: object }
 *
 * Updates the saved search criteria for a mandate.
 * Auth: admin OR recruiter (clients use the mandate creation form to set initial criteria)
 */
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    if (user.role !== "admin" && user.role !== "recruiter") {
      return NextResponse.json({ error: "Accès recruteur/admin requis" }, { status: 403 });
    }

    const { id } = await context.params;
    if (!id) return NextResponse.json({ error: "mandate id required" }, { status: 400 });

    const body = await request.json().catch(() => ({}));
    const criteria = body.search_criteria;
    if (!criteria || typeof criteria !== "object") {
      return NextResponse.json({ error: "search_criteria object required" }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("mandates")
      .update({
        search_criteria: criteria,
        criteria_updated_at: new Date().toISOString(),
        criteria_updated_by: user.id,
      })
      .eq("id", id)
      .select("id, criteria_updated_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, mandate: data });
  } catch (err) {
    console.error("[/api/mandates/[id]/criteria PATCH] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur" },
      { status: 500 }
    );
  }
}
