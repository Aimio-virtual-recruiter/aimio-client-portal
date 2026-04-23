import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

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

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-09-30.clover" });
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    let event: Stripe.Event;
    if (webhookSecret && signature) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      } catch (err) {
        console.error("[stripe webhook] Signature verification failed:", err);
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
      }
    } else {
      event = JSON.parse(body);
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

    const findClientByCustomerId = async (customerId: string) => {
      if (!supabase) return null;
      const { data } = await supabase
        .from("clients")
        .select("*")
        .eq("stripe_customer_id", customerId)
        .single();
      return data;
    };

    switch (event.type) {
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
        if (!customerId || !supabase) break;

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
        if (!customerId || !supabase) break;

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
        if (!customerId || !supabase) break;

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
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown" },
      { status: 200 } // Return 200 so Stripe doesn't retry forever
    );
  }
}
