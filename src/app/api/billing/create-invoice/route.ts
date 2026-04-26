import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { getCurrentUser } from "@/lib/supabase/server";

/**
 * Create + send a Stripe invoice to a client.
 * - Creates Stripe Customer if not exists
 * - Creates monthly invoice for the RV plan
 * - Stripe automatically emails the invoice to the client
 * - Saves stripe IDs in our clients table
 */

interface CreateInvoiceRequest {
  client_id: string;
  description?: string; // e.g., "Aimio Recruteur Virtuel - April 2026"
  amount_usd?: number; // override MRR if needed (for pro-rated, etc.)
  due_in_days?: number; // default 7 (net 7)
}

const PLAN_NAMES = {
  starter: "Recruteur Virtuel — Starter",
  pro: "Recruteur Virtuel — Pro",
  enterprise: "Recruteur Virtuel — Enterprise",
};

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    if (user.role !== "admin") {
      return NextResponse.json({ error: "Accès admin requis" }, { status: 403 });
    }

    const body: CreateInvoiceRequest = await request.json();

    if (!body.client_id) {
      return NextResponse.json({ error: "client_id required" }, { status: 400 });
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return NextResponse.json(
        { error: "STRIPE_SECRET_KEY not set. Add it in Vercel env vars." },
        { status: 500 }
      );
    }

    const stripe = new Stripe(stripeKey);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Load client
    const { data: client, error: clientErr } = await supabase
      .from("clients")
      .select("*")
      .eq("id", body.client_id)
      .single();

    if (clientErr || !client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const amountUsd = body.amount_usd ?? client.mrr_usd;
    const planName = PLAN_NAMES[client.plan as keyof typeof PLAN_NAMES] || "Recruteur Virtuel";
    const now = new Date();
    const monthLabel = now.toLocaleString("en-US", { month: "long", year: "numeric" });
    const description = body.description || `${planName} — ${monthLabel}`;
    const dueInDays = body.due_in_days ?? 7;

    // Step 1 — Create or retrieve Stripe customer
    let stripeCustomerId = client.stripe_customer_id;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: client.contact_email,
        name: `${client.contact_first_name} ${client.contact_last_name}`,
        description: `${client.company_name} — ${client.plan.toUpperCase()}`,
        metadata: {
          client_id: client.id,
          company_name: client.company_name,
          plan: client.plan,
          country: client.country,
          aimio_source: "onboard_admin",
        },
        address: client.country
          ? { country: client.country === "USA" ? "US" : client.country === "Canada" ? "CA" : client.country === "UK" ? "GB" : client.country === "Ireland" ? "IE" : client.country === "Australia" ? "AU" : "US" }
          : undefined,
      });
      stripeCustomerId = customer.id;

      // Save to our DB
      await supabase
        .from("clients")
        .update({ stripe_customer_id: stripeCustomerId })
        .eq("id", client.id);
    }

    // Step 2 — Create invoice item (the line item)
    await stripe.invoiceItems.create({
      customer: stripeCustomerId,
      amount: Math.round(amountUsd * 100), // Stripe uses cents
      currency: "usd",
      description,
    });

    // Step 3 — Create the invoice
    const invoice = await stripe.invoices.create({
      customer: stripeCustomerId,
      collection_method: "send_invoice",
      days_until_due: dueInDays,
      auto_advance: false, // we'll finalize manually
      description: `Merci pour votre confiance envers Aimio Recruteur Virtuel IA. Cette facture couvre votre abonnement mensuel.`,
      footer: "Garantie 30 jours sur les candidats qualifiés. Questions : marc@aimiorecrutement.com",
      metadata: {
        client_id: client.id,
        aimio_plan: client.plan,
      },
    });

    if (!invoice.id) {
      return NextResponse.json({ error: "Invoice creation failed" }, { status: 500 });
    }

    // Step 4 — Finalize the invoice
    const finalized = await stripe.invoices.finalizeInvoice(invoice.id);

    // Step 5 — Send the invoice (Stripe automatically emails)
    const sent = await stripe.invoices.sendInvoice(finalized.id!);

    // Step 6 — Update our DB
    await supabase
      .from("clients")
      .update({ billing_status: "active" })
      .eq("id", client.id);

    // Log activity
    await supabase.from("sales_activities").insert({
      activity_type: "note",
      direction: "outbound",
      notes: `💵 Invoice sent to ${client.company_name} — $${amountUsd} USD, due in ${dueInDays} days. Stripe invoice: ${sent.hosted_invoice_url}`,
      outcome: "positive",
      occurred_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: `Invoice de $${amountUsd} USD envoyée à ${client.contact_email}. Due dans ${dueInDays} jours.`,
      invoice_id: sent.id,
      invoice_url: sent.hosted_invoice_url,
      invoice_pdf: sent.invoice_pdf,
      amount_usd: amountUsd,
      stripe_customer_id: stripeCustomerId,
      due_date: sent.due_date ? new Date(sent.due_date * 1000).toISOString() : null,
    });
  } catch (error) {
    console.error("[billing/create-invoice] Error:", error);
    const msg = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json(
      { error: msg, hint: msg.includes("stripe") ? "Run: npm install stripe" : undefined },
      { status: 500 }
    );
  }
}
