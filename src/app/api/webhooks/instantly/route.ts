import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Instantly.ai webhook receiver.
 * Receives events: email_sent, email_opened, email_clicked, email_replied, lead_unsubscribed.
 * Maps to sales_activities + updates prospects.status.
 *
 * Configure in Instantly: Webhook URL = https://aimio-client-portal.vercel.app/api/webhooks/instantly
 */

interface InstantlyWebhookEvent {
  event: 'email_sent' | 'email_opened' | 'email_clicked' | 'email_replied' | 'lead_unsubscribed' | 'email_bounced' | string;
  campaign_id?: string;
  lead_email?: string;
  timestamp?: string;
  // Custom vars sent during push
  custom_variables?: {
    aimio_prospect_id?: string;
    title?: string;
    linkedin_url?: string;
    icp_score?: string;
  };
  // Reply content if event = replied
  reply_text?: string;
  reply_subject?: string;
  // Step info
  step?: number;
  step_subject?: string;
}

export async function POST(request: Request) {
  try {
    const body: InstantlyWebhookEvent = await request.json();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find prospect — by custom variable first, then email
    let prospectId = body.custom_variables?.aimio_prospect_id ?? null;

    if (!prospectId && body.lead_email) {
      const { data } = await supabase
        .from('prospects')
        .select('id')
        .eq('email', body.lead_email)
        .limit(1)
        .single();
      prospectId = data?.id ?? null;
    }

    if (!prospectId) {
      // Log event even if we can't match — might match later
      console.warn('Instantly webhook: no matching prospect', body);
      return NextResponse.json({ received: true, matched: false });
    }

    // Map Instantly event → activity
    const emailStatusMap: Record<string, string> = {
      email_sent: 'sent',
      email_opened: 'opened',
      email_clicked: 'clicked',
      email_replied: 'replied',
      email_bounced: 'bounced',
    };

    const emailStatus = emailStatusMap[body.event];
    const activityType = body.event === 'lead_unsubscribed' ? 'note' : 'email';

    // Log the activity
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

    // Update prospect status based on event
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
    // Return 200 so Instantly doesn't retry forever
    return NextResponse.json(
      { received: true, error: error instanceof Error ? error.message : 'Unknown' },
      { status: 200 }
    );
  }
}
