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

    // 2. Generate the invite link WITHOUT sending Supabase's default email.
    //    We embed this link in our own Aimio-branded Resend email below.
    const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://hireaimio.com"}/login/reset`;
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: "invite",
      email,
      options: {
        redirectTo: redirectUrl,
        data: {
          first_name: body.contact_first_name,
          last_name: body.contact_last_name,
          role: "client",
          client_company_id: clientRow.id,
        },
      },
    });

    if (linkError || !linkData?.properties?.action_link) {
      await supabase.from("clients").delete().eq("id", clientRow.id);
      return NextResponse.json(
        { error: `Échec création utilisateur: ${linkError?.message || "no link returned"}` },
        { status: 500 }
      );
    }

    const inviteLink = linkData.properties.action_link;
    const newUserId = linkData.user?.id;

    // 3. Upsert profile linking auth user → client tenant
    if (newUserId) {
      await supabase.from("profiles").upsert({
        id: newUserId,
        first_name: body.contact_first_name,
        last_name: body.contact_last_name,
        role: "client",
        client_company_id: clientRow.id,
      });
    }

    // 4. Send ONE Aimio-branded email (replaces Supabase invite + welcome)
    const resendKey = process.env.RESEND_API_KEY;
    let emailSent = false;
    let emailError: string | null = null;
    if (resendKey) {
      try {
        const resend = new Resend(resendKey);
        const plan = PLAN_DETAILS[body.plan];

        const { error: sendErr } = await resend.emails.send({
          from: "Marc-Antoine Côté <marc@send.aimiorecrutement.com>",
          to: [email],
          replyTo: "marc@aimiorecrutement.com",
          subject: `Créez votre portail Aimio — ${body.company_name}`,
          html: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #18181b; background: #ffffff;">

  <!-- Logo / Header -->
  <div style="text-align: center; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 1px solid #e4e4e7;">
    <h1 style="font-size: 28px; font-weight: 700; color: #2445EB; margin: 0; letter-spacing: -0.5px;">Aimio</h1>
    <p style="font-size: 11px; color: #71717a; margin: 4px 0 0; letter-spacing: 0.05em; text-transform: uppercase; font-weight: 600;">Virtual Recruiter</p>
  </div>

  <!-- Title -->
  <h2 style="font-size: 22px; font-weight: 600; margin: 0 0 16px;">Bonjour ${body.contact_first_name} 👋</h2>

  <p style="font-size: 15px; line-height: 1.6; margin-bottom: 20px;">
    Bienvenue chez <strong>Aimio</strong>. Votre portail <strong>${body.company_name}</strong> est prêt.
    Cliquez sur le bouton ci-dessous pour créer votre mot de passe et accéder à votre tableau de bord.
  </p>

  <!-- CTA Button -->
  <div style="text-align: center; margin: 36px 0;">
    <a href="${inviteLink}" style="display: inline-block; background: linear-gradient(135deg, #2445EB 0%, #4B5DF5 100%); color: #ffffff; padding: 16px 40px; border-radius: 9999px; text-decoration: none; font-size: 15px; font-weight: 600; box-shadow: 0 4px 12px rgba(36, 69, 235, 0.25);">
      🚀 Créer mon portail Aimio
    </a>
  </div>

  <p style="font-size: 12px; color: #71717a; text-align: center; margin: 0 0 32px;">
    Ce lien expire dans 24 heures.
  </p>

  <!-- Plan summary -->
  <div style="background: linear-gradient(135deg, #f4f4f5 0%, #fafafa 100%); border-radius: 12px; padding: 24px; margin-bottom: 24px;">
    <h2 style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #2445EB; margin: 0 0 14px;">Votre plan ${plan.name}</h2>
    <ul style="padding-left: 20px; margin: 0; font-size: 14px; line-height: 1.9; color: #3f3f46;">
      <li>${plan.positions} actifs</li>
      <li>${plan.candidates} candidats qualifiés / mois</li>
      <li>Premier shortlist en <strong>5-7 jours</strong></li>
      <li>Garantie remboursement <strong>30 jours</strong></li>
    </ul>
  </div>

  <!-- Kickoff call -->
  <h2 style="font-size: 16px; font-weight: 700; margin: 32px 0 12px;">📅 Prochaine étape — Kickoff call</h2>
  <p style="font-size: 14px; line-height: 1.6; margin-bottom: 16px; color: #3f3f46;">
    Réservez un appel de 60 min pour qu'on calibre votre recherche et qu'on livre parfaitement dès la première semaine.
  </p>
  <div style="text-align: center; margin: 16px 0 32px;">
    <a href="https://calendly.com/aimio-rv/kickoff" style="display: inline-block; background: #ffffff; color: #2445EB; border: 2px solid #2445EB; padding: 12px 28px; border-radius: 9999px; text-decoration: none; font-size: 13px; font-weight: 600;">
      Réserver le kickoff call →
    </a>
  </div>

  <!-- Roadmap -->
  <h2 style="font-size: 16px; font-weight: 700; margin: 32px 0 12px;">🎯 Roadmap mois 1</h2>
  <ul style="padding-left: 20px; font-size: 13px; line-height: 1.8; color: #3f3f46; margin: 0;">
    <li><strong>Jour 1-3</strong> · Notre IA source 300-500 candidats sur 10+ plateformes</li>
    <li><strong>Jour 3-5</strong> · Nos recruteurs séniors qualifient les meilleurs</li>
    <li><strong>Jour 5-7</strong> · Premier shortlist livré dans votre portail</li>
    <li><strong>Mois 1</strong> · ${plan.candidates} qualifiés au total</li>
  </ul>

  <!-- Support -->
  <div style="border-top: 1px solid #e4e4e7; padding-top: 20px; margin-top: 36px;">
    <p style="font-size: 14px; line-height: 1.6; margin: 0 0 12px; color: #18181b;">
      Une question ? Répondez directement à ce courriel — je lis chaque message.
    </p>
    <p style="font-size: 13px; color: #18181b; margin: 16px 0 4px; font-weight: 600;">Marc-Antoine Côté</p>
    <p style="font-size: 12px; color: #71717a; margin: 0;">Fondateur · Aimio Recrutement</p>
    <p style="font-size: 12px; color: #71717a; margin: 8px 0 0;">
      <a href="mailto:marc@aimiorecrutement.com" style="color: #2445EB; text-decoration: none;">marc@aimiorecrutement.com</a> ·
      <a href="https://hireaimio.com" style="color: #2445EB; text-decoration: none;">hireaimio.com</a>
    </p>
  </div>

  <!-- Fallback link -->
  <p style="font-size: 11px; color: #a1a1aa; margin-top: 24px; line-height: 1.5;">
    Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>
    <span style="color: #71717a; word-break: break-all;">${inviteLink}</span>
  </p>

</div>`,
        });

        if (sendErr) {
          emailError = sendErr.message;
          console.error("[onboard] Resend send error:", sendErr);
        } else {
          emailSent = true;
        }
      } catch (e) {
        emailError = e instanceof Error ? e.message : String(e);
        console.error("[onboard] Email send threw:", e);
      }
    } else {
      emailError = "RESEND_API_KEY not configured";
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
      message: emailSent
        ? `${body.company_name} onboardé. Email Aimio envoyé à ${email}.`
        : `${body.company_name} onboardé MAIS email pas envoyé : ${emailError || "raison inconnue"}. Tu peux donner manuellement le lien d'invite ci-dessous au client.`,
      client_id: clientRow.id,
      portal_url: portalUrl,
      email_sent: emailSent,
      email_error: emailError,
      // Surface the invite link so admin can copy/send manually if Resend failed
      invite_link: emailSent ? null : inviteLink,
    });
  } catch (error) {
    console.error("[clients/onboard] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}
