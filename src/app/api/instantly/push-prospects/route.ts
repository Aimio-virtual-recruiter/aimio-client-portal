import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Push Aimio prospects to an Instantly.ai campaign.
 * After push, updates prospects.status = 'queued' and logs an activity per prospect.
 */

interface PushRequest {
  campaign_id: string;
  prospect_ids: string[];
  rep_id?: string; // Who's assigned to follow-up on replies
}

export async function POST(request: Request) {
  try {
    const body: PushRequest = await request.json();

    if (!body.campaign_id || !body.prospect_ids || body.prospect_ids.length === 0) {
      return NextResponse.json(
        { error: 'campaign_id and prospect_ids required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.INSTANTLY_API_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'INSTANTLY_API_KEY not set in Vercel env vars' },
        { status: 500 }
      );
    }
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Load prospects
    const { data: prospects, error: pErr } = await supabase
      .from('prospects')
      .select('*')
      .in('id', body.prospect_ids)
      .eq('is_quebec', false); // Anti-cannibalization

    if (pErr) {
      return NextResponse.json({ error: pErr.message }, { status: 500 });
    }

    if (!prospects || prospects.length === 0) {
      return NextResponse.json({ error: 'No valid prospects found (non-Quebec)' }, { status: 404 });
    }

    // Filter those with emails (required for Instantly)
    const withEmails = prospects.filter((p) => p.email);

    if (withEmails.length === 0) {
      return NextResponse.json(
        { error: 'None of selected prospects have emails. Enrich first.' },
        { status: 400 }
      );
    }

    // Format for Instantly API
    // Instantly API: https://developer.instantly.ai/
    // POST https://api.instantly.ai/api/v1/lead/add with campaign_id + leads[]
    const leads = withEmails.map((p) => ({
      email: p.email,
      first_name: p.first_name ?? '',
      last_name: p.last_name ?? '',
      company_name: p.company_name,
      personalization: p.notes ?? '',
      phone: p.phone ?? '',
      website: p.company_domain ?? '',
      custom_variables: {
        aimio_prospect_id: p.id,
        title: p.title ?? '',
        linkedin_url: p.linkedin_url ?? '',
        icp_score: String(p.icp_score ?? 50),
      },
    }));

    // Call Instantly API
    const response = await fetch('https://api.instantly.ai/api/v1/lead/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: apiKey,
        campaign_id: body.campaign_id,
        skip_if_in_workspace: true,
        skip_if_in_campaign: true,
        leads,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return NextResponse.json(
        { error: `Instantly API error: ${err}` },
        { status: response.status }
      );
    }

    const instantlyResult = await response.json();

    // Update prospects status + log activities
    const prospectIdsUpdated = withEmails.map((p) => p.id);

    await supabase
      .from('prospects')
      .update({ status: 'queued', updated_at: new Date().toISOString() })
      .in('id', prospectIdsUpdated);

    // Log activities (one per prospect)
    const activities = withEmails.map((p) => ({
      prospect_id: p.id,
      rep_id: body.rep_id ?? null,
      activity_type: 'email',
      direction: 'outbound',
      email_status: 'sent',
      email_subject: `[Instantly Campaign ${body.campaign_id}] Push to sequence`,
      notes: `Pushed to Instantly campaign ${body.campaign_id}`,
    }));

    await supabase.from('sales_activities').insert(activities);

    return NextResponse.json({
      success: true,
      pushed: withEmails.length,
      total_selected: prospects.length,
      skipped_no_email: prospects.length - withEmails.length,
      skipped_quebec: body.prospect_ids.length - prospects.length,
      instantly_response: instantlyResult,
    });
  } catch (error) {
    console.error('Push to Instantly error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
