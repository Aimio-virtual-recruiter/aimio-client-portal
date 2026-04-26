import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

/**
 * Stripe webhook receiver — updates client billing status on payment events.
 *
 * Configure in Stripe Dashboard:
 * - Webhook URL: https://hireaimio.com/api/webhooks/stripe
 * - Events to listen:
 *   - invoice.paid
 *   - invoice.payment_failed
 *   - invoice.finalized
 *   - customer.subscription.deleted
 */

export async function POST(request: Request) {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!stripeKey) {
      return NextResponse.json({ error: "STRIPE_SECRET_KEY not set" }, { status: 500 });
    }
    if (!webhookSecret) {
      // SECURITY: refuse to process unsigned webhooks. Otherwise anyone can POST a fake event.
      console.error("[stripe webhook] STRIPE_WEBHOOK_SECRET not set — rejecting all events");
      return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
    }

    const stripe = new Stripe(stripeKey);
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("[stripe webhook] Signature verification failed:", err);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    let supabase;
    try {
      supabase = createSupabaseAdminClient();
    } catch {
      console.error("[stripe webhook] SUPABASE_SERVICE_ROLE_KEY not configured");
      return NextResponse.json(
        { error: "DB not configured" },
        { status: 500 } // Stripe will retry — that's the desired behavior
      );
    }

    const findClientByCustomerId = async (customerId: string) => {
      const { data } = await supabase
        .from("clients")
        .select("*")
        .eq("stripe_customer_id", customerId)
        .single();
      return data;
    };

    // Idempotency check — Stripe retries on 5xx, don't double-process
    const { data: existingEvent } = await supabase
      .from("stripe_webhook_events")
      .select("id")
      .eq("id", event.id)
      .maybeSingle();
    if (existingEvent) {
      return NextResponse.json({ received: true, idempotent: true });
    }
    // Best-effort log of event before processing (table may not exist yet — non-fatal)
    await supabase
      .from("stripe_webhook_events")
      .insert({ id: event.id, type: event.type, created_at: new Date().toISOString() })
      .then(() => null, () => null);

    switch (event.type) {
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
        if (!customerId) break;

        const client = await findClientByCustomerId(customerId);
        if (client) {
          await supabase
            .from("clients")
            .update({
              billing_status: "active",
              status: client.status === "onboarding" ? "active" : client.status,
            })
            .eq("id", client.id);

          await supabase.from("sales_activities").insert({
            activity_type: "note",
            direction: "inbound",
            notes: `💰 PAYMENT RECEIVED: ${client.company_name} — $${(invoice.amount_paid / 100).toFixed(2)} USD. Invoice ${invoice.id}`,
            outcome: "positive",
            occurred_at: new Date().toISOString(),
          });
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
        if (!customerId) break;

        const client = await findClientByCustomerId(customerId);
        if (client) {
          await supabase
            .from("clients")
            .update({ billing_status: "past_due" })
            .eq("id", client.id);

          await supabase.from("sales_activities").insert({
            activity_type: "note",
            direction: "inbound",
            notes: `⚠️ PAYMENT FAILED: ${client.company_name} — Invoice ${invoice.id} — Follow up needed`,
            outcome: "negative",
            occurred_at: new Date().toISOString(),
          });
        }
        break;
      }

      case "invoice.finalized": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log("[stripe] Invoice finalized:", invoice.id);
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
        if (!customerId) break;

        const client = await findClientByCustomerId(customerId);
        if (client) {
          await supabase
            .from("clients")
            .update({ billing_status: "canceled", status: "churned" })
            .eq("id", client.id);
        }
        break;
      }

      default:
        console.log("[stripe webhook] Unhandled event:", event.type);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[stripe webhook] Error:", error);
    // Return 500 so Stripe RETRIES — silent 200 = lost payment events.
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}
