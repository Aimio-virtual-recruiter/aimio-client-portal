import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

interface PerformanceResponse {
  reps: Array<{
    id: string;
    name: string;
    title: string;
    calls_today: number;
    calls_connected_today: number;
    meetings_booked_today: number;
    emails_sent_today: number;
    calls_this_week: number;
    meetings_this_week: number;
    calls_target: number;
    calls_completion_pct: number;
  }>;
  team_totals: {
    calls_today: number;
    calls_connected_today: number;
    meetings_booked_today: number;
    emails_sent_today: number;
    calls_this_week: number;
    meetings_this_week: number;
  };
  last_updated: string;
}

/**
 * Returns real-time sales performance for all active reps.
 * Calculates today / this week KPIs.
 */
export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get active reps (focus on sales-oriented roles)
    const { data: reps, error: repsError } = await supabase
      .from('recruiters')
      .select('id, name, title')
      .eq('is_active', true);

    if (repsError) {
      return NextResponse.json({ error: repsError.message }, { status: 500 });
    }

    if (!reps || reps.length === 0) {
      return NextResponse.json(
        {
          reps: [],
          team_totals: {
            calls_today: 0,
            calls_connected_today: 0,
            meetings_booked_today: 0,
            emails_sent_today: 0,
            calls_this_week: 0,
            meetings_this_week: 0,
          },
          last_updated: new Date().toISOString(),
        } as PerformanceResponse
      );
    }

    // Date boundaries
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()).toISOString();

    // Fetch all activities for today + this week in 1 query (efficient)
    const { data: activities, error: actError } = await supabase
      .from('sales_activities')
      .select('rep_id, activity_type, call_disposition, occurred_at')
      .gte('occurred_at', startOfWeek);

    if (actError) {
      return NextResponse.json({ error: actError.message }, { status: 500 });
    }

    const acts = activities ?? [];

    // Calculate per-rep stats
    const repStats = reps.map((r) => {
      const repActs = acts.filter((a) => a.rep_id === r.id);
      const todayActs = repActs.filter((a) => a.occurred_at >= startOfToday);

      const calls_today = todayActs.filter((a) => a.activity_type === 'call').length;
      const calls_connected_today = todayActs.filter(
        (a) =>
          a.activity_type === 'call' &&
          (a.call_disposition === 'connected' || a.call_disposition === 'booked_meeting')
      ).length;
      const meetings_booked_today = todayActs.filter(
        (a) => a.call_disposition === 'booked_meeting' || a.activity_type === 'meeting'
      ).length;
      const emails_sent_today = todayActs.filter((a) => a.activity_type === 'email').length;

      const calls_this_week = repActs.filter((a) => a.activity_type === 'call').length;
      const meetings_this_week = repActs.filter(
        (a) => a.activity_type === 'meeting' || a.call_disposition === 'booked_meeting'
      ).length;

      const calls_target = 300;
      const calls_completion_pct = calls_target > 0 ? Math.round((calls_today / calls_target) * 100) : 0;

      return {
        id: r.id,
        name: r.name,
        title: r.title,
        calls_today,
        calls_connected_today,
        meetings_booked_today,
        emails_sent_today,
        calls_this_week,
        meetings_this_week,
        calls_target,
        calls_completion_pct,
      };
    });

    // Team totals
    const team_totals = {
      calls_today: repStats.reduce((sum, r) => sum + r.calls_today, 0),
      calls_connected_today: repStats.reduce((sum, r) => sum + r.calls_connected_today, 0),
      meetings_booked_today: repStats.reduce((sum, r) => sum + r.meetings_booked_today, 0),
      emails_sent_today: repStats.reduce((sum, r) => sum + r.emails_sent_today, 0),
      calls_this_week: repStats.reduce((sum, r) => sum + r.calls_this_week, 0),
      meetings_this_week: repStats.reduce((sum, r) => sum + r.meetings_this_week, 0),
    };

    const response: PerformanceResponse = {
      reps: repStats.sort((a, b) => b.calls_today - a.calls_today), // Leaderboard order
      team_totals,
      last_updated: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Performance API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
