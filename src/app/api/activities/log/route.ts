import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getCurrentUser } from '@/lib/supabase/server';

interface LogActivityRequest {
  prospect_id: string;
  rep_id: string;
  activity_type: 'call' | 'email' | 'linkedin_message' | 'meeting' | 'note';
  direction?: 'outbound' | 'inbound';
  // Call fields
  call_duration_seconds?: number;
  call_disposition?:
    | 'no_answer'
    | 'voicemail'
    | 'connected'
    | 'booked_meeting'
    | 'not_interested'
    | 'wrong_number'
    | 'do_not_call';
  // Email fields
  email_subject?: string;
  email_body?: string;
  email_status?: 'sent' | 'delivered' | 'opened' | 'clicked' | 'replied' | 'bounced';
  email_sequence_id?: string;
  email_step_number?: number;
  // Outcome
  outcome?: 'positive' | 'neutral' | 'negative';
  notes?: string;
  next_action?: string;
  next_action_at?: string;
}

/**
 * Logs a sales activity (call, email, meeting, note).
 * Triggers auto-update of prospect stats via DB trigger.
 */
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    if (user.role !== 'admin' && user.role !== 'recruiter') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const body: LogActivityRequest = await request.json();

    // Validation
    if (!body.prospect_id || !body.rep_id || !body.activity_type) {
      return NextResponse.json(
        { error: 'prospect_id, rep_id, and activity_type are required' },
        { status: 400 }
      );
    }

    const validTypes = ['call', 'email', 'linkedin_message', 'meeting', 'note'];
    if (!validTypes.includes(body.activity_type)) {
      return NextResponse.json({ error: 'Invalid activity_type' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from('sales_activities')
      .insert({
        prospect_id: body.prospect_id,
        rep_id: body.rep_id,
        activity_type: body.activity_type,
        direction: body.direction ?? 'outbound',
        call_duration_seconds: body.call_duration_seconds,
        call_disposition: body.call_disposition,
        email_subject: body.email_subject,
        email_body: body.email_body,
        email_status: body.email_status,
        email_sequence_id: body.email_sequence_id,
        email_step_number: body.email_step_number,
        outcome: body.outcome,
        notes: body.notes,
        next_action: body.next_action,
        next_action_at: body.next_action_at,
      })
      .select()
      .single();

    if (error) {
      console.error('Activity log error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, activity: data });
  } catch (error) {
    console.error('Activity API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
