import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

/**
 * Instantly.ai webhook receiver.
 * Receives events: email_sent, email_opened, email_clicked, email_replied, lead_unsubscribed.
 * Maps to sales_activities + updates prospects.status.
 *
 * Security:
 * - Validates HMAC signature (header: x-instantly-signature) against INSTANTLY_WEBHOOK_SECRET
 * - Idempotent on event_id (deduplicates retries)
 *
 * Configure in Instantly:
 *  - Webhook URL : https://hireaimio.com/api/webhooks/instantly
 *  - Secret      : same value as INSTANTLY_WEBHOOK_SECRET in Vercel env
 */

interface InstantlyWebhookEvent {
  event_id?: string; // for idempotency
  event: 'email_sent' | 'email_opened' | 'email_clicked' | 'email_replied' | 'lead_unsubscribed' | 'email_bounced' | string;
  campaign_id?: string;
  lead_email?: string;
  timestamp?: string;
  custom_variables?: {
    aimio_prospect_id?: string;
    title?: string;
    linkedin_url?: string;
    icp_score?: string;
  };
  reply_text?: string;
  reply_subject?: string;
  step?: number;
  step_subject?: string;
}

function verifySignature(rawBody: string, signature: string | null, secret: string): boolean {
  if (!signature) return false;
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  // Constant-time compare to avoid timing attacks
  try {
    return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex'));
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  try {
    // 1. Read raw body for signature verification
    const rawBody = await request.text();

    // 2. Verify signature (if secret configured — recommended in prod)
    const webhookSecret = process.env.INSTANTLY_WEBHOOK_SECRET;
    if (webhookSecret) {
      const signature =
        request.headers.get('x-instantly-signature') ||
        request.headers.get('x-webhook-signature');
      if (!verifySignature(rawBody, signature, webhookSecret)) {
        console.error('[instantly webhook] Signature verification failed');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    } else {
      console.warn(
        '[instantly webhook] INSTANTLY_WEBHOOK_SECRET not set — webhooks accepted without verification (DEV ONLY)'
      );
    }

    let body: InstantlyWebhookEvent;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    // 3. Use admin client (bypasses RLS, webhooks have no user session)
    let supabase;
    try {
      supabase = createSupabaseAdminClient();
    } catch {
      console.error('[instantly webhook] SUPABASE_SERVICE_ROLE_KEY not configured');
      return NextResponse.json({ error: 'DB not configured' }, { status: 500 });
    }

    // 4. Idempotency — skip if we've already seen this event
    if (body.event_id) {
      const { data: existing } = await supabase
        .from('webhook_events')
        .select('id')
        .eq('source', 'instantly')
        .eq('event_id', body.event_id)
        .maybeSingle();
      if (existing) {
        return NextResponse.json({ received: true, idempotent: true });
      }
      // Log the event before processing (best-effort — table may not exist yet)
      await supabase
        .from('webhook_events')
        .insert({
          source: 'instantly',
          event_id: body.event_id,
          event_type: body.event,
          received_at: new Date().toISOString(),
        })
        .then(() => null, () => null);
    }

    // 5. Find prospect — by custom variable first, then email (now uses index)
    let prospectId = body.custom_variables?.aimio_prospect_id ?? null;

    if (!prospectId && body.lead_email) {
      const { data } = await supabase
        .from('prospects')
        .select('id')
        .eq('email', body.lead_email.toLowerCase())
        .limit(1)
        .maybeSingle();
      prospectId = data?.id ?? null;
    }

    if (!prospectId) {
      console.warn('Instantly webhook: no matching prospect', body.lead_email);
      return NextResponse.json({ received: true, matched: false });
    }

    // 6. Map Instantly event → activity
    const emailStatusMap: Record<string, string> = {
      email_sent: 'sent',
      email_opened: 'opened',
      email_clicked: 'clicked',
      email_replied: 'replied',
      email_bounced: 'bounced',
    };

    const emailStatus = emailStatusMap[body.event];
    const activityType = body.event === 'lead_unsubscribed' ? 'note' : 'email';

    await supabase.from('sales_activities').insert({
      prospect_id: prospectId,
      activity_type: activityType,
      direction: body.event === 'email_replied' ? 'inbound' : 'outbound',
      email_status: emailStatus,
      email_subject: body.step_subject ?? body.reply_subject ?? null,
      email_body: body.reply_text ?? null,
      email_step_number: body.step,
      outcome:
        body.event === 'email_replied'
          ? 'positive'
          : body.event === 'lead_unsubscribed' || body.event === 'email_bounced'
          ? 'negative'
          : 'neutral',
      notes: body.event === 'lead_unsubscribed' ? 'Unsubscribed via Instantly' : null,
      occurred_at: body.timestamp ?? new Date().toISOString(),
    });

    // 7. Update prospect status based on event
    if (body.event === 'email_replied') {
      await supabase
        .from('prospects')
        .update({
          reply_received: true,
          status: 'responded',
          last_contacted_at: body.timestamp ?? new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', prospectId);
    } else if (body.event === 'lead_unsubscribed') {
      await supabase
        .from('prospects')
        .update({
          status: 'do_not_contact',
          updated_at: new Date().toISOString(),
        })
        .eq('id', prospectId);
    } else if (body.event === 'email_bounced') {
      await supabase
        .from('prospects')
        .update({
          email_verified: false,
          notes: `Email bounced on ${new Date().toISOString()}`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', prospectId);
    }

    return NextResponse.json({ received: true, prospect_id: prospectId, event: body.event });
  } catch (error) {
    console.error('Instantly webhook error:', error);
    // Return 500 so Instantly retries — silent 200 = lost events
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}
