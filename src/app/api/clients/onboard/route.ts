import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createSupabaseAdminClient, getCurrentUser } from "@/lib/supabase/server";

interface OnboardRequest {
  company_name: string;
  contact_first_name: string;
  contact_last_name: string;
  contact_email: string;
  contact_phone?: string;
  contact_role?: string;
  country: string;
  company_size?: string;
  plan: "starter" | "growth" | "scale" | "enterprise";
  roles_hiring_for?: string;
  mrr_usd: number;
  billing_start_date: string;
  recruteur_lead?: string;
  notes?: string;
}

// Aligned with public pricing on hireaimio.com
const PLAN_DETAILS: Record<OnboardRequest["plan"], { name: string; candidates: string; positions: string }> = {
  starter:    { name: "Starter",    candidates: "10-15", positions: "1" },
  growth:     { name: "Growth",     candidates: "30-45", positions: "Jusqu'à 3" },
  scale:      { name: "Scale",      candidates: "60-90", positions: "Jusqu'à 6" },
  enterprise: { name: "Enterprise", candidates: "Sur mesure", positions: "Sur mesure" },
};

export async function POST(request: Request) {
  try {
    // AUTH: only admin can onboard new clients
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    if (user.role !== "admin") {
      return NextResponse.json({ error: "Accès admin requis" }, { status: 403 });
    }

    const body: OnboardRequest = await request.json();

    // Validate required fields
    if (!body.company_name || !body.contact_email || !body.contact_first_name || !body.plan) {
      return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.contact_email)) {
      return NextResponse.json({ error: "Format email invalide" }, { status: 400 });
    }

    let supabase;
    try {
      supabase = createSupabaseAdminClient();
    } catch {
      return NextResponse.json(
        { error: "SUPABASE_SERVICE_ROLE_KEY not configured — admin operations disabled" },
        { status: 500 }
      );
    }

    const portalUrl = "https://hireaimio.com/login";
    const email = body.contact_email.toLowerCase();

    // 1. Create the client tenant record
    const clientData = {
      company_name: body.company_name,
      contact_first_name: body.contact_first_name,
      contact_last_name: body.contact_last_name,
      contact_email: email,
      contact_phone: body.contact_phone || null,
      contact_role: body.contact_role || null,
      country: body.country,
      company_size: body.company_size || null,
      plan: body.plan,
      mrr_usd: body.mrr_usd,
      billing_start_date: body.billing_start_date,
      roles_hiring_for: body.roles_hiring_for || null,
      recruteur_lead: body.recruteur_lead || null,
      notes: body.notes || null,
      status: "onboarding",
      created_at: new Date().toISOString(),
      source: "admin_onboard",
    };

    const { data: clientRow, error: insertError } = await supabase
      .from("clients")
      .insert(clientData)
      .select("id")
      .single();

    if (insertError || !clientRow) {
      return NextResponse.json(
        { error: `Échec création client: ${insertError?.message || "unknown"}` },
        { status: 500 }
      );
    }

    // 2. Invite user via Supabase Auth — they set their own password through the email link
    const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://hireaimio.com"}/login`;
    const { data: invited, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
      email,
      {
        redirectTo: redirectUrl,
        data: {
          first_name: body.contact_first_name,
          last_name: body.contact_last_name,
          role: "client",
          client_company_id: clientRow.id,
        },
      }
    );

    if (inviteError) {
      // Roll back client creation if user invite fails
      await supabase.from("clients").delete().eq("id", clientRow.id);
      return NextResponse.json(
        { error: `Échec invitation utilisateur: ${inviteError.message}` },
        { status: 500 }
      );
    }

    // 3. Upsert profile linking auth user → client tenant (in case the trigger doesn't catch it)
    if (invited?.user) {
      await supabase.from("profiles").upsert({
        id: invited.user.id,
        first_name: body.contact_first_name,
        last_name: body.contact_last_name,
        role: "client",
        client_company_id: clientRow.id,
      });
    }

    // 4. Send welcome email via Resend (separate from Supabase invite — adds branding/context)
    const resendKey = process.env.RESEND_API_KEY;
    let emailSent = false;
    if (resendKey) {
      try {
        const resend = new Resend(resendKey);
        const plan = PLAN_DETAILS[body.plan];

        await resend.emails.send({
          from: "Marc-Antoine Côté <marc@send.aimiorecrutement.com>",
          to: [email],
          replyTo: "marc@aimiorecrutement.com",
          subject: `Bienvenue chez Aimio — démarrons votre recrutement 🚀`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #18181b;">
              <div style="text-align: center; margin-bottom: 32px;">
                <h1 style="font-size: 24px; font-weight: 700; color: #2445EB; margin: 0;">Aimio</h1>
                <p style="font-size: 13px; color: #6b6b6b; margin-top: 4px;">Recruteur Virtuel IA</p>
              </div>

              <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">Bonjour ${body.contact_first_name},</p>

              <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                Bienvenue dans l'équipe Aimio Recruteur Virtuel. Je suis Marc-Antoine Côté, fondateur d'Aimio.
                Vous allez recevoir un second courriel de Supabase pour activer votre compte et créer votre mot de passe.
              </p>

              <div style="background: #f5f5f5; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                <h2 style="font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #2445EB; margin: 0 0 16px 0;">Votre plan : ${plan.name}</h2>
                <ul style="padding-left: 20px; margin: 0; font-size: 14px; line-height: 1.8; color: #3f3f46;">
                  <li>Jusqu'à ${plan.positions} postes actifs</li>
                  <li>${plan.candidates} candidats qualifiés / mois</li>
                  <li>Première shortlist en 5-7 jours</li>
                  <li>Garantie 30 jours sur les candidats qualifiés</li>
                </ul>
              </div>

              <h2 style="font-size: 16px; font-weight: 700; margin: 32px 0 12px 0;">📅 Prochaine étape — Kickoff call</h2>
              <p style="font-size: 15px; line-height: 1.6; margin-bottom: 16px;">
                On doit faire un call de 60 minutes pour calibrer votre recherche et livrer parfaitement.
                Réservez un créneau cette semaine :
              </p>
              <a href="https://calendly.com/aimio-rv/kickoff" style="display: inline-block; background: #2445EB; color: #ffffff; padding: 12px 24px; border-radius: 9999px; text-decoration: none; font-size: 14px; font-weight: 600;">
                Réserver le kickoff call →
              </a>

              <h2 style="font-size: 16px; font-weight: 700; margin: 32px 0 12px 0;">🎯 Ce qui va se passer</h2>
              <ul style="padding-left: 20px; font-size: 14px; line-height: 1.8; color: #3f3f46;">
                <li><strong>Jour 1-3</strong> : Notre IA source 300-500 candidats sur 10+ plateformes</li>
                <li><strong>Jour 3-5</strong> : Nos recruteurs séniors contactent et qualifient les meilleurs</li>
                <li><strong>Jour 5-7</strong> : Premier shortlist de 5-7 candidats livré dans votre portail</li>
                <li><strong>Mois 1</strong> : ${plan.candidates} candidats qualifiés au total</li>
              </ul>

              <p style="font-size: 14px; color: #6b6b6b; margin-top: 24px;">
                Portail : <a href="${portalUrl}" style="color: #2445EB;">${portalUrl}</a>
              </p>

              <p style="font-size: 15px; line-height: 1.6; margin-top: 32px;">
                Questions ? Répondez directement à ce courriel. Je lis chaque message.
              </p>

              <p style="font-size: 15px; line-height: 1.6; margin-top: 24px; margin-bottom: 8px;">
                Au plaisir de faire grandir votre équipe,
              </p>

              <div style="border-top: 1px solid #e4e4e7; padding-top: 16px; margin-top: 24px;">
                <p style="font-size: 14px; font-weight: 600; margin: 0;">Marc-Antoine Côté</p>
                <p style="font-size: 13px; color: #6b6b6b; margin: 2px 0 0 0;">Fondateur, Aimio Recrutement</p>
                <p style="font-size: 13px; color: #6b6b6b; margin: 2px 0 0 0;">
                  <a href="mailto:marc@aimiorecrutement.com" style="color: #2445EB; text-decoration: none;">marc@aimiorecrutement.com</a> ·
                  <a href="https://hireaimio.com" style="color: #2445EB; text-decoration: none;">hireaimio.com</a>
                </p>
              </div>
            </div>
          `,
        });
        emailSent = true;
      } catch (emailError) {
        console.error("[onboard] Email send failed:", emailError);
      }
    }

    // 5. Notify internal team
    try {
      await supabase.from("sales_activities").insert({
        client_id: clientRow.id,
        activity_type: "note",
        direction: "outbound",
        notes: `🎉 NEW CLIENT ONBOARDED: ${body.company_name} (${body.plan.toUpperCase()} — $${body.mrr_usd}/mo)\n\nContact: ${body.contact_first_name} ${body.contact_last_name} (${email})\nCountry: ${body.country}\nRecruteur lead: ${body.recruteur_lead || "À assigner"}\nRoles: ${body.roles_hiring_for || "À définir au kickoff"}\n\nWelcome email ${emailSent ? "sent ✅" : "PENDING (Resend not configured)"}.`,
        outcome: "positive",
        occurred_at: new Date().toISOString(),
      });
    } catch (e) {
      console.warn("[onboard] Activity log warning:", e);
    }

    return NextResponse.json({
      success: true,
      message: `${body.company_name} onboardé. ${emailSent ? "Email envoyé." : "Email pas envoyé (configure RESEND_API_KEY)."} L'utilisateur recevra l'invite Supabase pour créer son mot de passe.`,
      client_id: clientRow.id,
      portal_url: portalUrl,
      email_sent: emailSent,
    });
  } catch (error) {
    console.error("[clients/onboard] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}
