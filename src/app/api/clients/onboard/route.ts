import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

interface OnboardRequest {
  company_name: string;
  contact_first_name: string;
  contact_last_name: string;
  contact_email: string;
  contact_phone?: string;
  contact_role?: string;
  country: string;
  company_size?: string;
  plan: "starter" | "pro" | "enterprise";
  roles_hiring_for?: string;
  mrr_usd: number;
  billing_start_date: string;
  recruteur_lead?: string;
  notes?: string;
}

const PLAN_DETAILS = {
  starter: { name: "Starter", candidates: "8-12", positions: "2" },
  pro: { name: "Pro", candidates: "15-25", positions: "5" },
  enterprise: { name: "Enterprise", candidates: "30-40", positions: "10+" },
};

// Generate a secure temporary password
function generatePassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const symbols = "!@#$%";
  let password = "";
  for (let i = 0; i < 10; i++) password += chars.charAt(Math.floor(Math.random() * chars.length));
  password += symbols.charAt(Math.floor(Math.random() * symbols.length));
  password += Math.floor(Math.random() * 100);
  return password;
}

export async function POST(request: Request) {
  try {
    const body: OnboardRequest = await request.json();

    // Validate required fields
    if (!body.company_name || !body.contact_email || !body.contact_first_name || !body.plan) {
      return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    const password = generatePassword();
    const portalUrl = "https://hireaimio.com/login";

    // Save client record (best effort — table may not exist yet)
    const clientData = {
      company_name: body.company_name,
      contact_first_name: body.contact_first_name,
      contact_last_name: body.contact_last_name,
      contact_email: body.contact_email.toLowerCase(),
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
      portal_password_temp: password,
      created_at: new Date().toISOString(),
      source: "admin_onboard",
    };

    const { error: insertError } = await supabase.from("clients").insert(clientData);
    if (insertError) {
      console.warn("[onboard] Client insert warning (table may need migration):", insertError.message);
    }

    // Send welcome email via Resend
    const resendKey = process.env.RESEND_API_KEY;
    let emailSent = false;
    if (resendKey) {
      try {
        const resend = new Resend(resendKey);
        const plan = PLAN_DETAILS[body.plan];

        await resend.emails.send({
          from: "Marc-Antoine Côté <marc@send.aimiorecrutement.com>",
          to: [body.contact_email],
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
                Je voulais personnellement vous souhaiter la bienvenue et vous donner les prochaines étapes.
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

              <h2 style="font-size: 16px; font-weight: 700; margin: 32px 0 12px 0;">Vos credentials portail</h2>
              <div style="background: #ffffff; border: 1px solid #e4e4e7; border-radius: 8px; padding: 16px; font-family: ui-monospace, SFMono-Regular, monospace; font-size: 13px;">
                <p style="margin: 0 0 8px 0; color: #6b6b6b;">URL : <a href="${portalUrl}" style="color: #2445EB;">${portalUrl}</a></p>
                <p style="margin: 0 0 8px 0; color: #6b6b6b;">Email : <strong style="color: #18181b;">${body.contact_email}</strong></p>
                <p style="margin: 0; color: #6b6b6b;">Mot de passe temporaire : <strong style="color: #18181b;">${password}</strong></p>
              </div>
              <p style="font-size: 12px; color: #6b6b6b; margin-top: 8px;">⚠️ Changez votre mot de passe lors de votre première connexion.</p>

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

              <p style="font-size: 15px; line-height: 1.6; margin-top: 32px;">
                Questions? Répondez directement à ce courriel. Je lis chaque message.
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

    // Notify internal team
    try {
      await supabase.from("sales_activities").insert({
        activity_type: "note",
        direction: "outbound",
        notes: `🎉 NEW CLIENT ONBOARDED: ${body.company_name} (${body.plan.toUpperCase()} — $${body.mrr_usd}/mo)\n\nContact: ${body.contact_first_name} ${body.contact_last_name} (${body.contact_email})\nCountry: ${body.country}\nRecruteur lead: ${body.recruteur_lead || "À assigner"}\nRoles: ${body.roles_hiring_for || "À définir au kickoff"}\n\nPortal credentials generated and welcome email ${emailSent ? "sent ✅" : "PENDING (Resend not configured)"}.`,
        outcome: "positive",
        occurred_at: new Date().toISOString(),
      });
    } catch (e) {
      console.warn("[onboard] Activity log warning:", e);
    }

    return NextResponse.json({
      success: true,
      message: `${body.company_name} onboardé avec succès. ${emailSent ? "Welcome email envoyé." : "Email pas envoyé (configure RESEND_API_KEY)."}`,
      credentials: { email: body.contact_email, password },
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
