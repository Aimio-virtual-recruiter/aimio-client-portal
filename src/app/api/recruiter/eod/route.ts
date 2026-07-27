import { NextResponse } from "next/server";
import { getCurrentUser, createSupabaseServerClient } from "@/lib/supabase/server";

// Les 8 chiffres du "mode rapide" — jamais null, défaut 0.
const QUICK_FIELDS = [
  "prescreenings",
  "calls",
  "submissions",
  "interviews_held",
  "offers",
  "offers_accepted",
  "placements",
  "postings",
] as const;

// Champs "mode détail" — optionnels, peuvent rester null.
const DETAIL_FIELDS = [
  "candidates_sourced",
  "calls_connected",
  "linkedin_messages",
  "linkedin_replies",
  "inmails_sent",
  "inmails_replies",
  "cold_emails",
  "email_replies",
] as const;

/**
 * GET /api/recruiter/eod?date=YYYY-MM-DD
 * Retourne l'EOD du recruteur connecté pour la date (défaut = aujourd'hui),
 * afin de pré-remplir le formulaire s'il a déjà saisi / veut corriger.
 */
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (user.role !== "admin" && user.role !== "recruiter") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const url = new URL(request.url);
  const date = url.searchParams.get("date") || new Date().toISOString().slice(0, 10);

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("recruiter_eod")
    .select("*")
    .eq("recruiter_id", user.id)
    .eq("eod_date", date)
    .maybeSingle();

  if (error) {
    console.error("EOD GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ eod: data, date });
}

/**
 * POST /api/recruiter/eod
 * Upsert l'EOD du jour (clé recruiter_id + eod_date). Un seul EOD par
 * recruteur/jour ; re-soumettre corrige la saisie existante.
 */
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    if (user.role !== "admin" && user.role !== "recruiter") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const body = await request.json();
    const eod_date = body.eod_date || new Date().toISOString().slice(0, 10);

    // Le mode rapide : les 8 chiffres, forcés à un entier >= 0.
    const row: Record<string, unknown> = {
      recruiter_id: user.id,
      eod_date,
      help_needed: body.help_needed?.trim() || null,
      day_feedback: body.day_feedback?.trim() || null,
      hours_worked: body.hours_worked != null ? Number(body.hours_worked) : null,
      source: "aimio_os",
      updated_at: new Date().toISOString(),
    };

    for (const f of QUICK_FIELDS) {
      const n = Math.max(0, Math.round(Number(body[f]) || 0));
      row[f] = n;
    }

    // Le mode détail : optionnel — null si non fourni.
    for (const f of DETAIL_FIELDS) {
      const v = body[f];
      row[f] = v === undefined || v === null || v === "" ? null : Math.max(0, Math.round(Number(v) || 0));
    }

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("recruiter_eod")
      .upsert(row, { onConflict: "recruiter_id,eod_date" })
      .select()
      .single();

    if (error) {
      console.error("EOD upsert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, eod: data });
  } catch (error) {
    console.error("EOD API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}
