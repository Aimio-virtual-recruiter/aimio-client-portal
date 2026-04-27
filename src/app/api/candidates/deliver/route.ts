import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { getCurrentUser } from "@/lib/supabase/server";

/**
 * Deliver a candidate to a client — marks candidate as delivered
 * + automatically sends email notification to the client contact.
 *
 * This is the moment we fulfill our promise: "first shortlist in 5-7 days".
 */

interface DeliverRequest {
  candidate_id: string;
  mandate_id: string;
  client_id: string;
  recruiter_notes?: string;
  ai_score?: number;
  send_email?: boolean; // default true
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    if (user.role !== "admin" && user.role !== "recruiter") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const body: DeliverRequest = await request.json();

    if (!body.candidate_id || !body.client_id) {
      return NextResponse.json(
        { error: "candidate_id and client_id required" },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Load client data
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("*")
      .eq("id", body.client_id)
      .single();

    if (clientError || !client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Load candidate data (try candidates table, fallback to prospects)
    let candidate;
    const { data: candidateData } = await supabase
      .from("candidates")
      .select("*")
      .eq("id", body.candidate_id)
      .single();

    if (candidateData) {
      candidate = candidateData;
    } else {
      const { data: prospectData } = await supabase
        .from("prospects")
        .select("*")
        .eq("id", body.candidate_id)
        .single();
      candidate = prospectData;
    }

    if (!candidate) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }

    // Load mandate data if provided
    let mandate = null;
    if (body.mandate_id) {
      const { data: mandateData } = await supabase
        .from("mandates")
        .select("*")
        .eq("id", body.mandate_id)
        .single();
      mandate = mandateData;
    }

    // Mark candidate as delivered
    const deliveredAt = new Date().toISOString();
    const candidateUpdate = {
      status: "delivered",
      delivered_at: deliveredAt,
      delivered_to_client_id: body.client_id,
      recruiter_notes: body.recruiter_notes || null,
      ai_score: body.ai_score || candidate.ai_score || candidate.icp_score || null,
    };

    // Try updating in candidates table first
    const { error: updateError } = await supabase
      .from("candidates")
      .update(candidateUpdate)
      .eq("id", body.candidate_id);

    if (updateError) {
      // Fallback: update in prospects
      await supabase.from("prospects").update(candidateUpdate).eq("id", body.candidate_id);
    }

    // Update client's first_shortlist_delivered_at if not already set
    if (!client.first_shortlist_delivered_at) {
      await supabase
        .from("clients")
        .update({ first_shortlist_delivered_at: deliveredAt })
        .eq("id", body.client_id);
    }

    // Log activity
    await supabase.from("sales_activities").insert({
      prospect_id: body.candidate_id,
      activity_type: "note",
      direction: "outbound",
      notes: `✨ CANDIDATE DELIVERED to ${client.company_name}: ${candidate.first_name} ${candidate.last_name} (${candidate.title || "N/A"}) — AI score ${candidateUpdate.ai_score || "N/A"}`,
      outcome: "positive",
      occurred_at: deliveredAt,
    });

    // Send email notification to client (if enabled and Resend configured)
    const shouldSendEmail = body.send_email !== false;
    const resendKey = process.env.RESEND_API_KEY;
    let emailSent = false;

    if (shouldSendEmail && resendKey && client.contact_email) {
      try {
        const resend = new Resend(resendKey);
        const portalUrl = `https://hireaimio.com/dashboard`;
        const candidateFullName = `${candidate.first_name || ""} ${candidate.last_name || ""}`.trim();
        const score = candidateUpdate.ai_score ? `${candidateUpdate.ai_score}/10` : null;

        await resend.emails.send({
          from: "Aimio Recrutement <candidates@send.aimiorecrutement.com>",
          to: [client.contact_email],
          replyTo: "marc@aimiorecrutement.com",
          subject: `🎯 Nouveau candidat livré pour ${client.company_name}`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #18181b;">
              <div style="text-align: center; margin-bottom: 32px;">
                <h1 style="font-size: 24px; font-weight: 700; color: #2445EB; margin: 0;">Aimio</h1>
                <p style="font-size: 12px; color: #6b6b6b; margin-top: 4px;">Recruteur Virtuel IA</p>
              </div>

              <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">Bonjour ${client.contact_first_name},</p>

              <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
                Bonne nouvelle — on vient d'ajouter un <strong>nouveau candidat qualifié</strong> dans votre portail.
              </p>

              <div style="background: linear-gradient(135deg, #2445EB 0%, #1A36C4 100%); border-radius: 12px; padding: 24px; margin-bottom: 24px; color: #ffffff;">
                <p style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; opacity: 0.8; margin: 0 0 8px 0;">Nouveau candidat</p>
                <h2 style="font-size: 22px; font-weight: 700; margin: 0 0 4px 0;">${candidateFullName}</h2>
                <p style="font-size: 14px; opacity: 0.9; margin: 0 0 16px 0;">${candidate.title || ""} ${candidate.company_name ? `· ${candidate.company_name}` : ""}</p>
                ${score ? `<div style="display: inline-block; background: rgba(255,255,255,0.2); border-radius: 20px; padding: 6px 14px; font-size: 13px; font-weight: 600;">Score IA : ${score}</div>` : ""}
              </div>

              ${mandate ? `
                <div style="background: #f5f5f5; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                  <p style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #2445EB; margin: 0 0 4px 0;">Pour le poste</p>
                  <p style="font-size: 15px; font-weight: 600; margin: 0;">${mandate.title || mandate.role || ""}</p>
                </div>
              ` : ""}

              ${body.recruiter_notes ? `
                <div style="background: #f5f5f5; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                  <p style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #2445EB; margin: 0 0 8px 0;">Notes du recruteur</p>
                  <p style="font-size: 14px; line-height: 1.6; margin: 0; color: #3f3f46;">${body.recruiter_notes}</p>
                </div>
              ` : ""}

              <p style="font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
                <strong>Voir le profil complet</strong> (CV, scoring détaillé, notes recruteur, disponibilités) dans votre portail :
              </p>

              <div style="text-align: center; margin-bottom: 32px;">
                <a href="${portalUrl}" style="display: inline-block; background: #2445EB; color: #ffffff; padding: 14px 32px; border-radius: 9999px; text-decoration: none; font-size: 14px; font-weight: 600;">
                  Voir le candidat dans le portail →
                </a>
              </div>

              <div style="background: #fef7ed; border-left: 3px solid #f59e0b; border-radius: 4px; padding: 12px 16px; margin-bottom: 24px;">
                <p style="font-size: 13px; line-height: 1.5; color: #78350f; margin: 0;">
                  ⏰ <strong>Astuce</strong> : Les meilleurs candidats reçoivent souvent d'autres offres. Répondez-nous dans les 48h avec votre feedback ou vos disponibilités d'entrevue pour maximiser vos chances.
                </p>
              </div>

              <p style="font-size: 14px; line-height: 1.6; color: #6b6b6b; margin-top: 24px;">
                Questions ou feedback rapide ? Répondez à ce courriel.
              </p>

              <div style="border-top: 1px solid #e4e4e7; padding-top: 16px; margin-top: 32px;">
                <p style="font-size: 13px; color: #6b6b6b; margin: 0;">
                  ${client.recruteur_lead || "Votre équipe Aimio"}<br>
                  Recruteur Virtuel IA · <a href="https://hireaimio.com" style="color: #2445EB; text-decoration: none;">hireaimio.com</a>
                </p>
              </div>
            </div>
          `,
        });
        emailSent = true;
      } catch (emailErr) {
        console.error("[candidates/deliver] Email failed:", emailErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Candidat ${candidate.first_name} ${candidate.last_name} livré à ${client.company_name}`,
      candidate_id: body.candidate_id,
      client_id: body.client_id,
      email_sent: emailSent,
      delivered_at: deliveredAt,
      portal_url: "https://hireaimio.com/dashboard",
    });
  } catch (error) {
    console.error("[candidates/deliver] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}
